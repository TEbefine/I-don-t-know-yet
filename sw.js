const CACHE_NAME = 'sap-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './chapters/index.js',
  './chapters/chapter-1.js',
  './chapters/chapter-2.js',
  './SAP-01.png',
  './SAP-02.png',
  './EkkamaiVibe/EkkamaiVibe-thin.ttf',
  './EkkamaiVibe/EkkamaiVibe-light.ttf',
  './EkkamaiVibe/EkkamaiVibe-Regular.ttf',
  './EkkamaiVibe/EkkamaiVibe-Bold.ttf',
  './EkkamaiVibe/EkkamaiVibe-Heavy.ttf'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local/same-origin assets
  if (e.request.method !== 'GET') return;
  
  const url = new URL(e.request.url);
  
  // Exclude external APIs or schemes like chrome-extension://
  if (!url.protocol.startsWith('http') && !url.protocol.startsWith('https')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to keep cache up to date
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network failures in background */});
        
        return cachedResponse;
      }
      
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        
        return networkResponse;
      });
    })
  );
});
