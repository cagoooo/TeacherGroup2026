const BUILD_VERSION = '2026.09.03-6';
const CACHE_NAME = `teachergroup-${BUILD_VERSION}`;
const PRECACHE_ASSETS = [
  `./styles.css?v=${BUILD_VERSION}`,
  `./site-data.js?v=${BUILD_VERSION}`,
  `./app.js?v=${BUILD_VERSION}`,
  `./sw-register.js?v=${BUILD_VERSION}`,
  './assets/favicon.svg',
  './assets/favicon.ico',
  './assets/favicon-32x32.png',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-192-maskable.png',
  './assets/icon-512-maskable.png',
  './site.webmanifest'
];

self.addEventListener('install', (event) => {
  // 保留 waiting 狀態，讓使用者決定何時套用新版，不打斷正在閱讀的頁面。
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_ASSETS.map((asset) => cache.add(asset)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith('teachergroup-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((client) => {
      client.postMessage({ type: 'SW_ACTIVATED', version: BUILD_VERSION });
    });
  })());
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'GET_VERSION' && event.source) {
    event.source.postMessage({ type: 'SW_VERSION', version: BUILD_VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // 版本檔永遠優先向網路查詢，避免把新版偵測卡在舊 cache。
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('version.json')) {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' }))
        .catch(() => caches.match('./version.json').then((cached) => cached || Response.error()))
    );
    return;
  }

  // HTML 網路優先，避免離線 fallback 長期保留舊版頁面。
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html').then((fallback) => fallback || Response.error())))
    );
    return;
  }

  // 版本化 JS/CSS 與圖片可 cache-first；新版本的 URL 會隨版本字串改變。
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
