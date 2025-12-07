// Tăng version này mỗi khi deploy để xóa cache cũ
const CACHE_VERSION = 'v2-' + new Date().getTime();
const CACHE_NAMES = [CACHE_VERSION];

self.addEventListener('install', event => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  // Kích hoạt ngay lập tức không đợi
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    // Xóa tất cả cache cũ
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!CACHE_NAMES.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim tất cả clients ngay lập tức
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Chỉ xử lý GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Không cache API hoặc file động
  const isStatic = /\.(js|css|html|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/.test(url);
  if (!isStatic) {
    return;
  }
  
  // Với file HTML: luôn thử fetch từ network trước (network-first)
  if (url.endsWith('.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Cache bản mới
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => {
          // Nếu offline, dùng cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Với file tĩnh khác (JS, CSS, images): cache-first
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        // Có trong cache, trả về ngay
        return response;
      }
      // Không có trong cache, fetch từ network
      return fetch(event.request)
        .then(networkResponse => {
          // Cache lại để lần sau dùng
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_VERSION).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(err => {
          console.error('[SW] Fetch error:', err);
          return new Response('Offline', { 
            status: 503, 
            statusText: 'Service Unavailable' 
          });
        });
    })
  );
});
