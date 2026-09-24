const CACHE_NAME = '7phone-v5-homepage-v2-no-runtime-cache';

async function clearAllCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(clearAllCaches());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clearAllCaches().then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', () => {
  return;
});
