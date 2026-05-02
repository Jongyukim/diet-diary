const CACHE = 'dietdiary-v1';
const ASSETS = [
  '/diet-diary/',
  '/diet-diary/index.html',
  '/diet-diary/manifest.json',
  '/diet-diary/css/style.css',
  '/diet-diary/js/presets.js',
  '/diet-diary/js/data.js',
  '/diet-diary/js/exercise.js',
  '/diet-diary/js/render.js',
  '/diet-diary/js/charts.js',
  '/diet-diary/js/ai.js',
  '/diet-diary/js/app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Google API 요청은 캐시 안 함
  if (e.request.url.includes('googleapis') || e.request.url.includes('accounts.google')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/diet-diary/index.html'));
    })
  );
});
