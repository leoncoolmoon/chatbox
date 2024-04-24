const CACHE_NAME = 'chatbot-pwa-cache-v4.1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'favicon-192x192.png',
  'favicon-512x512.png',
  'style.css',
  'script.js',
  'search.js',
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
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
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
