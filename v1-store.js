(function () {
    'use strict';
    const api = window.ServeUpProgress;
    const client = api.client;
    const key = (kind, organizationId, userId, courseId) => `serveup-v1:${kind}:${organizationId}:${userId}:${courseId}`;
    const legacyKey = (kind, userId, courseId) => `serveup-v1:${kind}:${userId}:${courseId}`;
    const read = storageKey => {
        try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; }
    };
    const write = (storageKey, value) => localStorage.setItem(storageKey, JSON.stringify(value));
    const warn = error => console.warn(`ServeUp Training sync unavailable; retaining local progress. ${error?.code || 'UNKNOWN'}: ${error?.message || String(error)}`);
    const submit = row => client.rpc('submit_v1_attempt', { p_attempt_id: row.id, p_course_id: row.course_id,
        p_question_ids: row.question_ids, p_answers: row.answers });
    const readScoped = async (kind, organizationId, userId, courseId) => {
        const scopedKey = key(kind, organizationId, userId, courseId);
        const scoped = read(scopedKey);
        if (scoped !== null) return scoped;
        const organizations = await api.getOrganizationContext();
        if (organizations.length !== 1) return null;
        const legacy = read(legacyKey(kind, userId, courseId));
        if (legacy !== null) write(scopedKey, legacy);
        return legacy;
    };

    window.ServeUpV1Store = {
        async saveLanguage(userId, locale) {
            const { error } = await client.from('v1_profile_preferences').upsert({ user_id: userId, locale, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
            if (error) warn(error);
        },
        async settings() {
            const { data, error } = await client.from('v1_course_settings').select('*');
            if (error) { warn(error); return []; }
            return data || [];
        },
        async session(userId, courseId) {
            const organizationId = await api.getCurrentOrganizationId();
            const local = await readScoped('session', organizationId, userId, courseId);
            const { data, error } = await client.from('v1_quiz_sessions').select('state, updated_at').eq('organization_id', organizationId).eq('user_id', userId).eq('course_id', courseId).maybeSingle();
            if (error) { warn(error); return local; }
            if (local && (!data || Date.parse(local.updatedAt) > Date.parse(data.updated_at))) {
                await this.saveSession(userId, courseId, local);
                return local;
            }
            return data?.state || null;
        },
        async saveSession(userId, courseId, state) {
            const organizationId = await api.getCurrentOrganizationId();
            const saved = { ...state, updatedAt: new Date().toISOString() };
            write(key('session', organizationId, userId, courseId), saved);
            const { error } = await client.from('v1_quiz_sessions').upsert({ organization_id: organizationId, user_id: userId, course_id: courseId, state: saved, updated_at: saved.updatedAt }, { onConflict: 'organization_id,user_id,course_id' });
            if (error) warn(error);
            return { state: saved, synced: !error };
        },
        async clearSession(userId, courseId) {
            const organizationId = await api.getCurrentOrganizationId();
            localStorage.removeItem(key('session', organizationId, userId, courseId));
            const { error } = await client.from('v1_quiz_sessions').delete().eq('organization_id', organizationId).eq('user_id', userId).eq('course_id', courseId);
            if (error) warn(error);
        },
        async attempts(userId, courseId) {
            const organizationId = await api.getCurrentOrganizationId();
            const local = await readScoped('attempts', organizationId, userId, courseId) || [];
            const { data, error } = await client.from('v1_quiz_attempts').select('*').eq('organization_id', organizationId).eq('user_id', userId).eq('course_id', courseId).order('completed_at', { ascending: false });
            if (error) { warn(error); return local; }
            const remoteIds = new Set((data || []).map(item => item.id));
            for (const item of local.filter(value => !remoteIds.has(value.id))) {
                const result = await submit(item);
                if (result.error) warn(result.error);
            }
            return [...new Map([...local, ...(data || [])].map(item => [item.id, item])).values()].sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at));
        },
        async saveAttempt(userId, courseId, state, score) {
            const organizationId = await api.getCurrentOrganizationId();
            const row = { id: crypto.randomUUID(), organization_id: organizationId, user_id: userId, course_id: courseId,
                question_ids: state.questionIds, answers: state.answers, score: score.score, passed: score.passed,
                completed_at: new Date().toISOString() };
            const storageKey = key('attempts', organizationId, userId, courseId);
            write(storageKey, [...(await readScoped('attempts', organizationId, userId, courseId) || []), row]);
            const { data, error } = await submit(row);
            if (error) warn(error);
            const serverRow = Array.isArray(data) ? data[0] : data;
            if (!error && serverRow) write(storageKey, (read(storageKey) || []).map(item => item.id === row.id ? serverRow : item));
            return { row: !error && serverRow ? serverRow : row, synced: !error };
        },
        async practical(userId, courseId) {
            const organizationId = await api.getCurrentOrganizationId();
            const { data, error } = await client.from('v1_practical_reviews').select('*').eq('organization_id', organizationId).eq('user_id', userId).eq('course_id', courseId);
            if (error) { warn(error); return []; }
            return data || [];
        },
        async savePractical(userId, courseId, itemId, status, comment) {
            const reviewer = await api.getCurrentUser();
            if (!reviewer) throw new Error('Sign-in required.');
            const organizationId = await api.getCurrentOrganizationId();
            const { error } = await client.from('v1_practical_reviews').upsert({ organization_id: organizationId, user_id: userId, course_id: courseId, item_id: itemId,
                status, comment: comment.trim().slice(0, 500), reviewer_id: reviewer.id, reviewed_at: new Date().toISOString() },
                { onConflict: 'organization_id,user_id,course_id,item_id' });
            if (error) throw error;
        },
        async certificate(userId, courseId) {
            const organizationId = await api.getCurrentOrganizationId();
            const { data, error } = await client.from('v1_certificates').select('*').eq('organization_id', organizationId).eq('user_id', userId).eq('course_id', courseId).maybeSingle();
            if (error) { warn(error); return null; }
            return data;
        },
        async issueCertificate(courseId) {
            const { data, error } = await client.rpc('issue_v1_certificate', { p_course_id: courseId });
            if (error) throw error;
            return data;
        },
        async managerAttempts() {
            const organizationId = await api.getCurrentOrganizationId();
            const { data, error } = await client.from('v1_quiz_attempts').select('*').eq('organization_id', organizationId).order('completed_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        async managerPracticals() {
            const organizationId = await api.getCurrentOrganizationId();
            const { data, error } = await client.from('v1_practical_reviews').select('*').eq('organization_id', organizationId);
            if (error) throw error;
            return data || [];
        },
        async managerCertificates() {
            const organizationId = await api.getCurrentOrganizationId();
            const { data, error } = await client.from('v1_certificates').select('*').eq('organization_id', organizationId);
            if (error) throw error;
            return data || [];
        },
        async managerLanguages() {
            const { data, error } = await client.from('v1_profile_preferences').select('user_id, locale');
            if (error) throw error;
            return data || [];
        }
    };
}());
