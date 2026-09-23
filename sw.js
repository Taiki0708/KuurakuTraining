// Bump this value whenever the app shell changes so installed devices receive a safe update prompt.
const VERSION = 'serveup-training-1.0.0-8';
const SHELL = `${VERSION}-shell`;
const CONTENT = `${VERSION}-content`;
const shellFiles = ['v1.html','v1-admin.html','v1-certificate.html','my-training.html','my-training.css','my-training.js?v=training-unified-1','offline.html','v1.css?v=1.0.0-5','v1.js?v=training-unified-1','v1-admin.js?v=training-unified-1','v1-store.js?v=1.0.0-5','admin-i18n.js?v=training-unified-1','quiz-core.js','environment.js?v=1.0.0-5','supabase-client.js?v=1.0.0-5','pwa.js','manifest.webmanifest','icons/serveup-192.png','icons/serveup-512.png','icons/serveup-maskable-192.png','icons/serveup-maskable-512.png'];
self.addEventListener('install', event => {
    event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(shellFiles.map(path => new URL(path, self.registration.scope).href))));
});
self.addEventListener('activate', event => {
    event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith('serveup-v1-') || key.startsWith('serveup-training-')) && ![SHELL,CONTENT].includes(key)).map(key => caches.delete(key)))), self.clients.claim()]));
});
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match(new URL('offline.html', self.registration.scope).href)));
        return;
    }
    if (/\/data\/(courses|questions)\.json$/.test(url.pathname)) {
        event.respondWith(fetch(request).then(response => { if (response.ok) { const copy=response.clone(); event.waitUntil(caches.open(CONTENT).then(cache=>cache.put(request,copy))); } return response; }).catch(() => caches.match(request)));
        return;
    }
    event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
});
