(function () {
    'use strict';
    const params = new URLSearchParams(window.location.search);
    const isStaging = params.get('environment') === 'staging';
    const route = (path, values = {}) => {
        const url = new URL(path, window.location.href);
        if (isStaging) url.searchParams.set('environment', 'staging');
        Object.entries(values).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
        });
        return `${url.pathname.split('/').pop()}${url.search}`;
    };

    window.ServeUpEnvironment = { name: isStaging ? 'staging' : 'production', isStaging, route };
    if (isStaging) {
        window.SERVEUP_SUPABASE_CONFIG = {
            url: 'https://kphwbearafqzfgnsfmiy.supabase.co',
            publishableKey: 'sb_publishable_PMQAtEcoIPdSi1_m6gRqEQ_qZHttMkM'
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!isStaging) return;
        document.documentElement.dataset.environment = 'staging';
        const banner = document.createElement('div');
        banner.className = 'environment-banner';
        banner.setAttribute('role', 'status');
        banner.textContent = 'STAGING · Test data only';
        document.body.prepend(banner);
        const destinations = {
            allCoursesLink: 'v1.html',
            backLink: 'v1.html',
            adminLink: 'v1-admin.html',
            v1BrandLink: 'v1.html',
            v1TrainingLink: 'v1.html',
            v1CertificateBack: 'v1.html',
            authHomeLink: 'v1.html',
            authBackLink: 'v1.html'
        };
        Object.entries(destinations).forEach(([id, path]) => {
            const link = document.getElementById(id);
            if (link) link.href = route(path);
        });
        for (const id of ['myTrainingLink','previousAdminLink']) {
            const productionOnly = document.getElementById(id);
            if (productionOnly) productionOnly.hidden = true;
        }
        const signUp = document.getElementById('signUpButton');
        if (signUp) signUp.hidden = true;
    });
}());
