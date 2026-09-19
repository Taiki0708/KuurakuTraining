(function () {
    'use strict';
    const standalone = matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const help = document.getElementById('installHelp');
    const button = document.getElementById('installButton');
    if (help && !standalone) help.hidden = false;
    let installEvent;
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault(); installEvent = event; if (button) button.hidden = false;
    });
    if (button) button.addEventListener('click', async () => {
        if (!installEvent) return;
        installEvent.prompt(); await installEvent.userChoice; installEvent = null; button.hidden = true;
    });
    window.addEventListener('appinstalled', () => { if (help) help.hidden = true; });
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').then(registration => {
        const announce = worker => {
            if (!worker || !navigator.serviceWorker.controller) return;
            if (document.getElementById('serveupUpdate')) return;
            const bar = document.createElement('div'); bar.id = 'serveupUpdate'; bar.className = 'panel'; bar.style.cssText = 'position:fixed;inset:auto 12px 12px;z-index:1000;max-width:500px;margin:auto;box-shadow:0 8px 24px #0002';
            const message = document.createElement('span'); message.textContent = 'ServeUp update available / 更新できます';
            const apply = document.createElement('button'); apply.type = 'button'; apply.textContent = 'Update / 更新'; apply.style.marginLeft = '12px';
            apply.addEventListener('click', () => worker.postMessage('SKIP_WAITING'));
            bar.append(message, apply); document.body.append(bar);
        };
        if (registration.waiting) announce(registration.waiting);
        registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            worker?.addEventListener('statechange', () => { if (worker.state === 'installed') announce(worker); });
        });
        let changed = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => { if (!changed) { changed = true; location.reload(); } });
    }).catch(error => console.warn('PWA setup unavailable.', error));
}());
