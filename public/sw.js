const CACHE_NAME = `mypartsrunner-${Date.now()}`;
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
  // Skip caching for dynamic imports and API calls
  if (event.request.url.includes('/src/') || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('?v=') ||
      event.request.url.includes('?t=')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
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
