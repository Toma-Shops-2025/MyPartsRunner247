const CACHE_NAME = `mypartsrunner-v3-${Date.now()}`;
const urlsToCache = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Skip caching for most dynamic content
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('?v=') ||
      event.request.url.includes('?t=') ||
      event.request.url.includes('index-') ||
      event.request.url.includes('vendor-') ||
      event.request.url.includes('supabase-') ||
      event.request.url.includes('netlify') ||
      event.request.url.includes('supabase.co')) {
    return fetch(event.request);
  }

  // Only cache static assets like images, fonts, etc.
  if (event.request.url.includes('.png') || 
      event.request.url.includes('.jpg') || 
      event.request.url.includes('.jpeg') || 
      event.request.url.includes('.gif') || 
      event.request.url.includes('.svg') || 
      event.request.url.includes('.ico') ||
      event.request.url.includes('.woff') ||
      event.request.url.includes('.woff2') ||
      event.request.url.includes('.ttf')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  } else {
    // For everything else, just fetch without caching
    return fetch(event.request);
  }
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New delivery update!',
    icon: 'https://d64gsuwffb70l.cloudfront.net/682bb5704b7430be07455fed_1757470893428_bcb25c1b.png',
    badge: 'https://d64gsuwffb70l.cloudfront.net/682bb5704b7430be07455fed_1757470893428_bcb25c1b.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: 'https://d64gsuwffb70l.cloudfront.net/682bb5704b7430be07455fed_1757470893428_bcb25c1b.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: 'https://d64gsuwffb70l.cloudfront.net/682bb5704b7430be07455fed_1757470893428_bcb25c1b.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('MyPartsRunner', options)
  );
});
