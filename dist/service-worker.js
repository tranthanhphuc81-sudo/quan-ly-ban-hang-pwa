
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Chỉ cache file tĩnh (html, js, css, png, jpg, svg)
  const url = event.request.url;
  const isStatic = /\.(js|css|html|png|jpg|jpeg|svg|ico)$/.test(url);
  if (!isStatic) {
    // Không cache API hoặc file động
    return;
  }
  event.respondWith(
    caches.open('v1').then(cache => {
      return cache.match(event.request).then(response => {
        if (response) return response;
        return fetch(event.request)
          .then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(err => {
            console.error('Service Worker fetch error:', err);
            return new Response('Offline hoặc lỗi mạng', { status: 503, statusText: 'Service Worker fetch error' });
          });
      });
    })
  );
});
