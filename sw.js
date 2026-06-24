const CACHE_NAME = 'sap-cache-v4';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './chapters/index.js',
  './chapters/chapter-1.js',
  './chapters/chapter-2.js',
  './chapters/chapter-3.js',
  './chapters/chapter-4.js',
  './chapters/chapter-5.js',
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
  if (e.request.method !== 'GET') return;
  
  const url = new URL(e.request.url);
  if (!url.protocol.startsWith('http') && !url.protocol.startsWith('https')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => {});
        
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
