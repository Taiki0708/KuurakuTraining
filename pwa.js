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
    // Updates remain in the waiting state until all ServeUp tabs are closed.
    // The latest app shell is then applied naturally on the next launch without
    // interrupting a quiz or displaying an update banner over the interface.
    navigator.serviceWorker.register('sw.js').catch(error => console.warn('PWA setup unavailable.', error));
}());
