// Service Worker for PWA Caching and Offline Support
// ==================================================

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
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
      self.registration.showNotification(payload.title || 'MY-RUNNER.COM Test', options)
    );
  }
});

// Notification click event handler for in-app notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    payload = { title: 'Notification', body: event.data.text() };
  }

  const title = payload.title || 'MY-RUNNER.COM';
  const options = {
    body: payload.body || 'You have a new update.',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-96.png',
    data: payload.data || {},
    actions: payload.actions || []
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'PUSH_NOTIFICATION_CLICKED', data: event.notification.data });
          return;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});