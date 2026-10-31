// Сервис-воркер «Мой мир»: приложение открывается и без интернета.
// Страница index.html берётся из сети (чтобы приходили обновления), а если сети нет, из копии.
const V = 'moi-mir-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const isPage = r.mode === 'navigate' || /\.(html|webmanifest)$/.test(new URL(r.url).pathname);
  if (isPage) { // сначала сеть, при её отсутствии копия
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
  } else { // картинки и прочее: из копии, при отсутствии скачиваем и запоминаем
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })));
  }
});