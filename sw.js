/* Show Team service worker
   - App HTML: network-first so new versions load automatically when online
   - Static assets (app.js/icons/manifest): cache-first for speed
   - Fully offline-capable via cache fallback
   NOTE: user data (localStorage + IndexedDB) is never touched by this cache. */
const VERSION = 'dfst-v36';
const ASSETS = ['index.html', 'app.js', 'config.js', 'vendor/supabase.js', 'manifest.webmanifest', 'favicon-32.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(ASSETS.map(a => new Request(a, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ---- Web push: show the notification the Edge Function sent ---- */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (_) { d = { title: 'Show Team', body: (e.data && e.data.text()) || '' }; }
  const title = d.title || 'Show Team';
  const opts = {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'favicon-32.png',
    data: d.data || {},
    tag: d.tag || undefined,        // same tag replaces an earlier notification
    renotify: !!d.tag,
    vibrate: [40, 30, 40]
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

/* ---- Tapping a notification focuses (or opens) the app at the right screen ---- */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) { if (c.navigate && target) { try { c.navigate(target); } catch (_) {} } return c.focus(); }
      }
      return self.clients.openWindow(target);
    })
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Only handle same-origin requests. Cross-origin calls (Supabase API,
  // storage, auth) must go straight to the network — never cached.
  if (new URL(req.url).origin !== self.location.origin) return;
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isNav) {
    // network-first: fetch the latest app, fall back to cache when offline
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return res; })
        .catch(() => caches.match('index.html').then(r => r || caches.match(req)))
    );
  } else {
    // cache-first for static assets
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
      }))
    );
  }
});
