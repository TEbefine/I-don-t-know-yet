const CACHE_NAME = 'sap-cache-v7';

/* Only precache what's needed for first paint + first chapter */
const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './chapters/index.js',
  './chapters/chapter-1.js',
  './SAP-01.webp',
  './EkkamaiVibe/EkkamaiVibe-light.ttf',
  './EkkamaiVibe/EkkamaiVibe-Regular.ttf'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE);
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
  if (!url.protocol.startsWith('http')) return;

  /* Network-first for chapter content (keeps it fresh) */
  const isChapterJS = url.pathname.includes('/chapters/chapter-');
  
  if (isChapterJS) {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return networkResponse;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  /* Stale-while-revalidate for everything else */
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse);
          });
        }
        return networkResponse.clone();
      }).catch(() => {});
      
      return cachedResponse || fetchPromise;
    })
  );
});
