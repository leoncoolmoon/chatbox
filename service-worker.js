const CACHE_NAME = 'chatbot-pwa-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'favicon-192x192.png',
  'favicon-512x512.png',
  'style.css',
  'script.js'
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
