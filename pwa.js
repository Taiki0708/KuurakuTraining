(function () {
    'use strict';
    const ASSET_VERSION = 'task2-org-20260925';
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
    navigator.serviceWorker.register(`sw.js?v=${ASSET_VERSION}`, { updateViaCache: 'none' })
        .catch(error => console.warn('PWA setup unavailable.', error));
}());
