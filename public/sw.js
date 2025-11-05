// Service Worker for PWA + FREE Push Notifications
// ================================================

const CACHE_NAME = 'mypartsrunner-v3';
const STATIC_CACHE = 'mypartsrunner-static-v3';
const DYNAMIC_CACHE = 'mypartsrunner-dynamic-v3';

const urlsToCache = [
  '/',
  '/place-order',
  '/my-orders',
  '/driver-dashboard',
  '/profile',
  '/earnings',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-logo.png',
  '/manifest.json'
];

const API_CACHE_PATTERNS = [
  /\/api\//,
  /\.netlify\/functions\//
];

// Install event - Cache static assets
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  // Force activation for iOS compatibility
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(cache) {
        console.log('Caching static assets...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(function(response) {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', request.url);
          return response;
        }
        
        // Fetch from network
        return fetch(request)
          .then(function(response) {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Determine cache strategy
            if (isStaticAsset(request.url)) {
              // Cache static assets in static cache
              caches.open(STATIC_CACHE)
                .then(function(cache) {
                  cache.put(request, responseToCache);
                });
            } else if (isAPIRequest(request.url)) {
              // Cache API responses in dynamic cache with TTL
              caches.open(DYNAMIC_CACHE)
                .then(function(cache) {
                  cache.put(request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(function() {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Helper functions
function isStaticAsset(url) {
  return url.includes('.js') || url.includes('.css') || url.includes('.png') || 
         url.includes('.jpg') || url.includes('.svg') || url.includes('.ico');
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Push event - Handle incoming push notifications
self.addEventListener('push', function(event) {
  const timestamp = new Date().toISOString();
  console.log(`🔔 [${timestamp}] Push event received:`, event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log(`📬 [${timestamp}] Push data parsed:`, data);
    } catch (e) {
      data = { title: 'MyPartsRunner', body: event.data.text() };
      console.log(`📬 [${timestamp}] Push data (text):`, data);
    }
  } else {
    console.log(`⚠️ [${timestamp}] Push event has no data`);
  }

  // CRITICAL: Block driver notifications if they don't match the current user
  // This prevents customers from seeing driver notifications
  const notificationUserId = data?.data?.userId;
  const notificationType = data?.data?.type;
  const isOrderAvailableNotification = data?.title?.includes('New Order') || 
                                       data?.title?.includes('Order Available') ||
                                       notificationType === 'order_available';
  
  // For driver notifications, verify user before showing
  if (isOrderAvailableNotification && notificationUserId) {
    event.waitUntil(
      (async () => {
        try {
          // Try to get current user ID from IndexedDB
          let currentUserId = null;
          try {
            const db = await new Promise((resolve, reject) => {
              const request = indexedDB.open('mypartsrunner-user', 1);
              request.onerror = () => reject(request.error);
              request.onsuccess = () => resolve(request.result);
              request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('user')) {
                  db.createObjectStore('user');
                }
              };
            });
            
            const tx = db.transaction('user', 'readonly');
            const store = tx.objectStore('user');
            currentUserId = await new Promise((resolve, reject) => {
              const request = store.get('userId');
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
          } catch (dbError) {
            console.log(`⚠️ [${timestamp}] Could not access IndexedDB:`, dbError);
          }
          
          if (currentUserId && currentUserId !== notificationUserId) {
            console.log(`🚫 [${timestamp}] BLOCKED: Driver notification for ${notificationUserId} but current user is ${currentUserId}`);
            console.log(`   NOT showing notification to prevent customer from seeing driver notifications`);
            return; // Don't show the notification
          }
          
          // User matches or we can't verify - show notification
          const options = {
            body: data.body || 'You have a new notification',
            icon: data.icon || '/icon-192x192.png',
            badge: data.badge || '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: data.data || {},
            actions: data.actions || [
              {
                action: 'view',
                title: 'View',
                icon: '/checkmark.png'
              },
              {
                action: 'close',
                title: 'Close',
                icon: '/xmark.png'
              }
            ],
            requireInteraction: data.requireInteraction || false,
            silent: data.silent || false
          };
          
          await self.registration.showNotification(data.title || 'MyPartsRunner', options);
          console.log(`✅ [${timestamp}] Driver notification displayed: ${data.title}`);
        } catch (error) {
          console.error(`❌ [${timestamp}] Error processing driver notification:`, error);
        }
      })()
    );
  } else {
    // Not a driver notification or no user_id - show normally
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: data.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/xmark.png'
        }
      ],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'MyPartsRunner', options)
        .then(() => {
          console.log(`✅ [${timestamp}] Notification displayed: ${data.title}`);
        })
        .catch((error) => {
          console.error(`❌ [${timestamp}] Failed to show notification:`, error);
        })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync
      console.log('Background sync triggered')
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    // Handle notification test from main thread
    const payload = event.data.payload;
    const options = {
      body: payload.body || 'Test notification',
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      tag: payload.tag || 'test-notification',
      data: payload.data || {},
      vibrate: [100, 50, 100],
      requireInteraction: false,
      silent: false
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || 'MyPartsRunner Test', options)
    );
  }
});