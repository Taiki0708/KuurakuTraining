(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const api = window.ServeUpProgress;
    const store = window.ServeUpV1Store;
    const state = { courses:[], learners:[], attempts:[], practical:[], certificates:[], languages:[], settings:[] };
    const make = (tag, value) => { const node = document.createElement(tag); node.textContent = value; return node; };
    const locale = localStorage.getItem('serveupLanguage') || 'en';
    const name = course => course.title[locale] || course.title.en;
    const permitted = (userId, courseId) => state.attempts.some(attempt => attempt.user_id === userId && attempt.course_id === courseId && attempt.passed);
    const reviews = (userId, courseId) => state.practical.filter(row => row.user_id === userId && row.course_id === courseId);
    const practicalComplete = (userId, course) => course.practicalItems.every(item => reviews(userId, course.id).some(row => row.item_id === item.id && row.status === 'independent'));
    const setting = course => state.settings.find(row => row.course_id === course.id) || course;

    function fillSelect(select, rows, label) {
        select.replaceChildren();
        rows.forEach(row => { const option = make('option', label(row)); option.value = row.id || row.user_id; select.append(option); });
    }
    function renderReport() {
        const host = $('reportRows'); host.replaceChildren();
        const staffText = $('staffFilter').value.toLowerCase(); const courseFilter = $('courseFilter').value; const status = $('statusFilter').value;
        const storeFilter = $('storeFilter').value; const roleFilter = $('roleFilter').value;
        for (const learner of state.learners) {
            if (staffText && !learner.email?.toLowerCase().includes(staffText)) continue;
            if (storeFilter && (learner.store_name || learner.organization_name || '') !== storeFilter) continue;
            if (roleFilter && (learner.job_role || learner.staff_role || learner.role || '') !== roleFilter) continue;
            for (const course of state.courses) {
                if (courseFilter && course.id !== courseFilter) continue;
                const attempts = state.attempts.filter(item => item.user_id === learner.user_id && item.course_id === course.id).sort((a,b) => Date.parse(b.completed_at)-Date.parse(a.completed_at));
                const pass = attempts.some(item => item.passed); const pract = practicalComplete(learner.user_id, course);
                const requirement = setting(course).certificate_requirement ?? course.certificateRequirement;
                const complete = pass && (requirement === 'quiz_only' || pract);
                if (status === 'incomplete' && complete) continue;
                if (status === 'passed' && !pass) continue;
                if (status === 'practical' && !pract) continue;
                const certificate = state.certificates.some(item => item.user_id === learner.user_id && item.course_id === course.id);
                const language = state.languages.find(item => item.user_id === learner.user_id)?.locale || '—';
                const row = document.createElement('tr');
                [learner.email || learner.user_id, name(course), attempts.length ? `${attempts[0].score}%` : '—', attempts.length ? `${Math.max(...attempts.map(item => item.score))}%` : '—', String(attempts.length), attempts.length ? new Date(attempts[0].completed_at).toLocaleDateString() : '—', pass ? 'Passed' : 'Not passed', `${reviews(learner.user_id, course.id).filter(item=>item.status==='independent').length}/${course.practicalItems.length}${pract?' ✓':''}`, certificate ? 'Issued' : 'Not issued', language].forEach(value => row.append(make('td', value)));
                host.append(row);
            }
        }
        if (!host.children.length) { const row = document.createElement('tr'); const cell = make('td', 'No matching staff or courses.'); cell.colSpan = 10; row.append(cell); host.append(row); }
    }
    function renderPracticalEditor() {
        const userId = $('learnerSelect').value; const course = state.courses.find(item => item.id === $('practicalCourseSelect').value);
        const host = $('practicalEditor'); host.replaceChildren();
        if (!course || !userId) return;
        if (!permitted(userId, course.id)) { host.append(make('p', 'Quiz not passed yet. Practical assessment is available after a passing quiz.')); return; }
        for (const item of course.practicalItems) {
            const existing = reviews(userId, course.id).find(row => row.item_id === item.id);
            const row = document.createElement('div'); row.className = 'review-row';
            row.append(make('h3', item[locale] || item.en));
            const form = document.createElement('form'); form.className = 'form-row';
            const statusLabel = make('label', 'Status'); const select = document.createElement('select');
            [['not_checked','Not checked'],['practicing','Practicing'],['independent','Can perform independently'],['needs_review','Needs review']].forEach(([value,label]) => { const option = make('option', label); option.value = value; select.append(option); });
            select.value = existing?.status || 'not_checked'; statusLabel.append(select);
            const commentLabel = make('label', 'Comment'); const comment = document.createElement('textarea'); comment.maxLength = 500; comment.value = existing?.comment || ''; commentLabel.append(comment);
            const button = make('button', 'Save check'); button.type = 'submit'; form.append(statusLabel, commentLabel, button);
            if (existing) row.append(make('small', `Checked ${new Date(existing.reviewed_at).toLocaleString()} by ${existing.reviewer_id}`));
            form.addEventListener('submit', async event => {
                event.preventDefault(); button.disabled = true; $('practicalStatus').textContent = 'Saving…';
                try { await store.savePractical(userId, course.id, item.id, select.value, comment.value);
                    [state.practical, state.certificates] = await Promise.all([store.managerPracticals(), store.managerCertificates()]); renderReport(); renderPracticalEditor(); $('practicalStatus').textContent = 'Practical check saved.';
                } catch (error) { $('practicalStatus').textContent = `Could not save: ${error.message}`; button.disabled = false; }
            });
            row.append(form); host.append(row);
        }
    }
    function renderSettings() {
        const course = state.courses.find(item => item.id === $('settingsCourse').value); if (!course) return;
        const config = setting(course);
        $('questionCount').value = config.question_count ?? config.questionCount;
        $('passScore').value = config.pass_score ?? config.passScore;
        $('certificateRequirement').value = config.certificate_requirement ?? config.certificateRequirement;
    }
    async function saveSettings(event) {
        event.preventDefault(); const courseId = $('settingsCourse').value;
        const row = { course_id:courseId, question_count:Number($('questionCount').value), pass_score:Number($('passScore').value), certificate_requirement:$('certificateRequirement').value };
        const result = await api.client.from('v1_course_settings').upsert(row, { onConflict:'course_id' });
        if (result.error) { $('settingsStatus').textContent = `Could not save: ${result.error.message}`; return; }
        state.settings = await store.settings(); $('settingsStatus').textContent = 'Settings saved.';
    }
    async function init() {
        try {
            const user = await api.getCurrentUser(); if (!user || await api.getMyRole() !== 'admin') { $('status').textContent = 'Manager sign-in is required.'; return; }
            const [response, learners, attempts, practical, certificates, languages, settings] = await Promise.all([fetch('data/courses.json',{cache:'no-store'}), api.getAdminLearners(), store.managerAttempts(), store.managerPracticals(), store.managerCertificates(), store.managerLanguages(), store.settings()]);
            if (!response.ok) throw new Error('Could not load courses.');
            Object.assign(state, { courses:await response.json(), learners, attempts, practical, certificates, languages, settings });
            $('status').textContent = ''; $('content').hidden = false;
            fillSelect($('learnerSelect'), learners, item => item.email || item.user_id);
            fillSelect($('practicalCourseSelect'), state.courses, name);
            fillSelect($('settingsCourse'), state.courses, name);
            state.courses.forEach(course => { const option=make('option',name(course)); option.value=course.id; $('courseFilter').append(option); });
            for (const value of new Set(learners.map(item => item.store_name || item.organization_name).filter(Boolean))) { const option=make('option',value); option.value=value; $('storeFilter').append(option); }
            for (const value of new Set(learners.map(item => item.job_role || item.staff_role || item.role).filter(Boolean))) { const option=make('option',value); option.value=value; $('roleFilter').append(option); }
            ['staffFilter','courseFilter','storeFilter','roleFilter','statusFilter'].forEach(id => $(id).addEventListener('input', renderReport));
            ['learnerSelect','practicalCourseSelect'].forEach(id => $(id).addEventListener('change', renderPracticalEditor));
            $('settingsCourse').addEventListener('change', renderSettings); $('settingsForm').addEventListener('submit', saveSettings);
            if (await api.isPlatformAdmin()) { $('settingsPanel').hidden = false; renderSettings(); }
            renderReport(); renderPracticalEditor();
        } catch (error) { console.error(error); $('status').textContent = `Manager V1 data unavailable: ${error.message}. Apply the reviewed V1 database migration before using practical approval.`; }
    }
    init();
}());
