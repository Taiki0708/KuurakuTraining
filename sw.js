// Keep this value in sync with the versioned local assets referenced by HTML.
const ASSET_VERSION = 'task2-org-20260925';
const VERSION = `serveup-training-${ASSET_VERSION}`;
const SHELL = `${VERSION}-shell`;
const CONTENT = `${VERSION}-content`;
const SERVEUP_CACHE_PREFIXES = ['serveup-v1-', 'serveup-training-'];
const shellFiles = [
    `my-training.css?v=${ASSET_VERSION}`,
    `my-training.js?v=${ASSET_VERSION}`,
    'offline.html',
    `v1.css?v=${ASSET_VERSION}`,
    `v1.js?v=${ASSET_VERSION}`,
    `v1-admin.js?v=${ASSET_VERSION}`,
    `v1-store.js?v=${ASSET_VERSION}`,
    `admin-i18n.js?v=${ASSET_VERSION}`,
    `quiz-core.js?v=${ASSET_VERSION}`,
    `environment.js?v=${ASSET_VERSION}`,
    `supabase-client.js?v=${ASSET_VERSION}`,
    `pwa.js?v=${ASSET_VERSION}`,
    `manifest.webmanifest?v=${ASSET_VERSION}`,
    'icons/serveup-192.png',
    'icons/serveup-512.png',
    'icons/serveup-maskable-192.png',
    'icons/serveup-maskable-512.png'
];
const isServeUpCache = key => SERVEUP_CACHE_PREFIXES.some(prefix => key.startsWith(prefix));
const canonicalAssetUrl = path => new URL(`${path}?v=${ASSET_VERSION}`, self.registration.scope).href;

self.addEventListener('install', event => {
    event.waitUntil(Promise.all([
        caches.open(SHELL).then(cache => cache.addAll(shellFiles.map(path => new URL(path, self.registration.scope).href))),
        self.skipWaiting()
    ]));
});
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        const obsolete = keys.filter(key => isServeUpCache(key) && ![SHELL, CONTENT].includes(key));
        const isUpgrade = obsolete.length > 0;
        await Promise.all(obsolete.map(key => caches.delete(key)));
        await self.clients.claim();

        // The previous production worker had no controller-change listener.
        // Reload controlled ServeUp windows once on this upgrade so an open
        // installed PWA cannot keep pre-Task-2 JavaScript in memory.
        if (isUpgrade) {
            const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            await Promise.all(windows.map(client => {
                const clientUrl = new URL(client.url);
                const scopeUrl = new URL(self.registration.scope);
                if (clientUrl.origin !== scopeUrl.origin || !clientUrl.pathname.startsWith(scopeUrl.pathname)) return undefined;
                return typeof client.navigate === 'function'
                    ? Promise.resolve(client.navigate(client.url)).catch(() => undefined)
                    : undefined;
            }));
        }
    })());
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
    if (/\/(supabase-client|v1-store)\.js$/.test(url.pathname)) {
        // Normalize even an old HTML URL to the Task-2-compatible asset. This
        // protects clients whose browser HTTP cache still contains old HTML.
        const canonical = /\/v1-store\.js$/.test(url.pathname)
            ? canonicalAssetUrl('v1-store.js')
            : canonicalAssetUrl('supabase-client.js');
        event.respondWith(caches.open(SHELL).then(cache => cache.match(canonical)).then(hit => hit || fetch(canonical, { cache: 'no-store' })));
        return;
    }
    if (/\/data\/(courses|questions)\.json$/.test(url.pathname)) {
        event.respondWith(fetch(request).then(response => { if (response.ok) { const copy=response.clone(); event.waitUntil(caches.open(CONTENT).then(cache=>cache.put(request,copy))); } return response; }).catch(() => caches.match(request)));
        return;
    }
    event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
});
