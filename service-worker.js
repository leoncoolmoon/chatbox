const CACHE_NAME = 'chatbot-pwa-cache-v5.0';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'favicon-192x192.png',
  'favicon-512x512.png',
  'style.css',
  'script.js',
  'search.js',
  'storage.js',
  'migration.js',
  'close.svg',
  'search.svg',
  'cn.json',
  'en.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Only intercept same-origin requests to avoid interfering with cross-origin API calls
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName != CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data.action === 'GET_CACHE_NAME') {
    event.ports[0].postMessage({ cacheName: CACHE_NAME });
  }
});
