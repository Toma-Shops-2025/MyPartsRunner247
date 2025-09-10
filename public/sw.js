const CACHE_NAME = 'mypartsrunner-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
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
