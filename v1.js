(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const core = window.ServeUpQuizCore;
    const store = window.ServeUpV1Store;
    const environment = window.ServeUpEnvironment || { isStaging:false, route:(path, values = {}) => {
        const query = new URLSearchParams(values); return query.size ? `${path}?${query}` : path;
    }};
    const labels = {
        en: { courses:'Courses', training:'My training', manager:'Manager', title:'Your training', lead:'Learn practical restaurant skills, one short test at a time.', complete:'Courses passed', rate:'Quiz completion rate', open:'Open course →', quiz:'Quiz', practical:'Practical', latest:'Latest score', best:'Best score', attempts:'Attempts', start:'Start 10-question test', resume:'Resume test', retry:'Try another set', review:'Review wrong answers', noWrong:'No wrong answers in your latest test.', noHistory:'Question-level answers are not available for this imported legacy completion.', question:'Question', next:'Next →', result:'See result →', correct:'Correct', incorrect:'Not quite', explanation:'Why', key:'Key point', passed:'Quiz passed', failed:'Not passed yet', need:'Passing score', saved:'Saved across devices', local:'Saved on this device only. Database setup is still needed for cross-device progress.', practicalTitle:'Practical check', checked:'Checked', unchecked:'Not checked', practicing:'Practicing', independent:'Can perform independently', needsReview:'Needs review', certTitle:'Certificate', certPending:'A certificate has not been issued yet.', certReady:'View certificate →', certPractical:'This course also requires manager confirmation.', signIn:'Please sign in to use ServeUp Training.', offline:'Could not load training data. Please check your connection.', all:'← All courses', install:'Install ServeUp', installText:'On iPhone: Share → Add to Home Screen. On Android: browser menu → Install app or Add to Home Screen.', installButton:'Install app', reviewDraft:'Safety-related draft questions need manager review before operational use.' },
        ja: { courses:'コース', training:'学習状況', manager:'店長画面', title:'あなたの学習', lead:'飲食店で必要な対応を、短いテストで学びましょう。', complete:'クイズ合格コース', rate:'クイズ完了率', open:'コースを見る →', quiz:'クイズ', practical:'実技', latest:'最新の点数', best:'最高点', attempts:'受験回数', start:'10問のテストを始める', resume:'途中から再開', retry:'別の問題で再受験', review:'不正解を復習', noWrong:'直近のテストに不正解はありません。', noHistory:'旧コースから引き継いだ完了記録には、問題ごとの回答履歴がありません。', question:'問題', next:'次へ →', result:'結果を見る →', correct:'正解', incorrect:'不正解', explanation:'解説', key:'大切な点', passed:'クイズ合格', failed:'まだ合格していません', need:'合格点', saved:'端末間で保存済み', local:'この端末だけに保存しました。端末間の同期にはDB設定が必要です。', practicalTitle:'実技確認', checked:'確認済み', unchecked:'未確認', practicing:'練習中', independent:'一人でできる', needsReview:'再確認が必要', certTitle:'修了証', certPending:'修了証はまだ発行されていません。', certReady:'修了証を見る →', certPractical:'このコースは店長による実技確認も必要です。', signIn:'V1の学習にはログインしてください。', offline:'学習データを読み込めません。通信を確認してください。', all:'← 全コース', install:'ServeUpをインストール', installText:'iPhone: 共有 → ホーム画面に追加。Android: ブラウザのメニュー → アプリをインストール、またはホーム画面に追加。', installButton:'インストール', reviewDraft:'安全に関する問題は、業務に使う前に管理者の確認が必要です。' },
        hi: { courses:'कोर्स', training:'मेरी प्रगति', manager:'प्रबंधक', title:'आपकी ट्रेनिंग', lead:'छोटे टेस्ट से रेस्तरां के व्यावहारिक कौशल सीखें।', complete:'पास हुए कोर्स', rate:'क्विज़ पूर्णता', open:'कोर्स खोलें →', quiz:'क्विज़', practical:'व्यावहारिक', latest:'नया स्कोर', best:'सर्वश्रेष्ठ स्कोर', attempts:'प्रयास', start:'10 प्रश्नों का टेस्ट शुरू करें', resume:'टेस्ट फिर शुरू करें', retry:'नए प्रश्नों से फिर प्रयास करें', review:'गलत उत्तर देखें', noWrong:'पिछले टेस्ट में कोई गलत उत्तर नहीं।', noHistory:'पुराने कोर्स से लाए गए रिकॉर्ड में प्रश्न-स्तर के उत्तर उपलब्ध नहीं हैं।', question:'प्रश्न', next:'आगे →', result:'नतीजा देखें →', correct:'सही', incorrect:'सही नहीं', explanation:'कारण', key:'मुख्य बात', passed:'क्विज़ पास', failed:'अभी पास नहीं', need:'पास अंक', saved:'सभी डिवाइस पर सहेजा', local:'केवल इस डिवाइस पर सहेजा। अन्य डिवाइस के लिए डेटाबेस सेटअप चाहिए।', practicalTitle:'व्यावहारिक जाँच', checked:'जाँचा गया', unchecked:'अभी नहीं जाँचा', practicing:'अभ्यास जारी', independent:'स्वतंत्र रूप से कर सकता है', needsReview:'फिर जाँच चाहिए', certTitle:'प्रमाणपत्र', certPending:'प्रमाणपत्र अभी जारी नहीं हुआ।', certReady:'प्रमाणपत्र देखें →', certPractical:'इस कोर्स में प्रबंधक की व्यावहारिक पुष्टि भी चाहिए।', signIn:'V1 ट्रेनिंग के लिए साइन इन करें।', offline:'ट्रेनिंग डेटा नहीं मिला। इंटरनेट जाँचें।', all:'← सभी कोर्स', install:'ServeUp इंस्टॉल करें', installText:'iPhone: Share → Add to Home Screen। Android: ब्राउज़र मेनू → Install app या Add to Home Screen।', installButton:'इंस्टॉल करें', reviewDraft:'सुरक्षा के प्रश्न काम में उपयोग से पहले प्रबंधक द्वारा जाँचे जाने चाहिए।' }
    };
    Object.assign(labels.en, { courses:'Training', training:'My account' });
    Object.assign(labels.ja, { courses:'トレーニング', training:'マイアカウント', signIn:'ServeUp Trainingの利用にはログインしてください。' });
    Object.assign(labels.hi, { courses:'प्रशिक्षण', training:'मेरा खाता', signIn:'ServeUp Training के लिए साइन इन करें।' });
    const state = { locale: ['en','ja','hi'].includes(localStorage.getItem('serveupLanguage')) ? localStorage.getItem('serveupLanguage') : 'en', user:null, courses:[], bank:[], settings:[], selected:null, attempts:[], practical:[], certificate:null, session:null, sync:true };
    const t = key => labels[state.locale][key];
    const text = (id, value) => { const node = $(id); if (node) node.textContent = value; };
    const translation = (obj, locale = state.locale) => obj?.[locale] || obj?.en;
    const courseConfig = course => ({ ...course, ...(state.settings.find(item => item.course_id === course.id) || {}) });
    const safeNumber = (value, fallback, min, max) => Number.isInteger(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;
    const message = value => text('message', value);

    function applyLabels() {
        document.documentElement.lang = state.locale;
        $('locale').value = state.locale;
        text('allCoursesLink', t('courses')); text('myTrainingLink', t('training')); text('adminLink', t('manager'));
        text('dashboardTitle', t('title')); text('dashboardLead', t('lead')); text('completionLabel', t('complete')); text('rateLabel', t('rate'));
        text('latestLabel', t('latest')); text('bestLabel', t('best')); text('attemptLabel', t('attempts'));
        text('reviewButton', t('review')); text('resultReviewButton', t('review')); text('reviewTitle', t('review'));
        text('retryButton', t('retry')); text('practicalTitle', t('practicalTitle')); text('certificateTitle', t('certTitle')); text('backLink', t('all'));
        text('installTitle', t('install')); text('installText', t('installText')); text('installButton', t('installButton'));
    }
    function element(tag, className, content) {
        const node = document.createElement(tag); if (className) node.className = className; if (content !== undefined) node.textContent = content; return node;
    }
    async function dashboard() {
        $('dashboard').hidden = false; $('courseView').hidden = true;
        const holder = $('courseCards'); holder.replaceChildren();
        let passed = 0;
        const allAttempts = await Promise.all(state.courses.map(course => store.attempts(state.user.id, course.id)));
        for (const [courseIndex, course] of state.courses.entries()) {
            const attempts = allAttempts[courseIndex];
            const didPass = attempts.some(item => item.passed);
            if (didPass) passed++;
            const card = element('article', 'course-card');
            card.append(element('span', 'eyebrow', `${state.courses.indexOf(course) + 1} / 8 · 30 ${t('question')}`));
            card.append(element('h2', '', translation(course.title)));
            card.append(element('p', '', translation(course.description)));
            card.append(element('p', '', `${t('quiz')}: ${didPass ? t('passed') : t('failed')} · ${t('attempts')}: ${attempts.length}`));
            const link = element('a', '', t('open')); link.href = environment.route('v1.html', { course:course.id }); card.append(link); holder.append(card);
        }
        text('completion', `${passed} / ${state.courses.length}`);
        text('completionRate', `${Math.round(100 * passed / state.courses.length)}%`);
    }
    function questionById(id) { return state.bank.find(question => question.id === id); }
    function currentQuestion() { return questionById(state.session.questionIds[state.session.current]); }
    async function selectCourse(course) {
        state.selected = course; $('dashboard').hidden = true; $('courseView').hidden = false;
        text('courseTitle', translation(course.title)); text('courseDescription', translation(course.description));
        state.attempts = await store.attempts(state.user.id, course.id);
        state.practical = await store.practical(state.user.id, course.id);
        state.certificate = await store.certificate(state.user.id, course.id);
        if (!state.certificate && state.attempts.some(item => item.passed)) {
            try { await store.issueCertificate(course.id); state.certificate = await store.certificate(state.user.id, course.id); }
            catch (error) { console.info('Certificate prerequisites pending.', error); }
        }
        state.session = await store.session(state.user.id, course.id);
        if (state.session && (!Array.isArray(state.session.questionIds) || state.session.questionIds.some(id => !questionById(id)))) state.session = null;
        if (state.session) {
            const config = courseConfig(course);
            const expectedCount = safeNumber(config.question_count ?? config.questionCount, 10, 1, 30);
            if (state.session.questionIds.length !== expectedCount) {
                await store.clearSession(state.user.id, course.id); state.session = null;
            } else {
                state.session.passScore = safeNumber(config.pass_score ?? config.passScore, 80, 1, 100);
            }
        }
        renderCourse();
    }
    function renderCourse() {
        const course = state.selected; if (!course) return;
        const config = courseConfig(course);
        text('courseTitle', translation(course.title)); text('courseDescription', translation(course.description));
        const latest = state.attempts[0]; const best = Math.max(0, ...state.attempts.map(item => item.score));
        text('latestScore', latest ? `${latest.score}%` : '—'); text('bestScore', state.attempts.length ? `${best}%` : '—'); text('attemptCount', String(state.attempts.length));
        const required = safeNumber(config.pass_score ?? config.passScore, 80, 1, 100);
        const configuredCount = safeNumber(config.question_count ?? config.questionCount, 10, 1, 30);
        const passed = state.attempts.some(item => item.passed);
        text('courseStatus', `${t('quiz')}: ${passed ? t('passed') : t('failed')} · ${t('need')}: ${required}%${state.sync ? '' : ' · ' + t('local')}${['hygiene-food-safety','allergies-dietary','safety-emergency'].includes(course.id) ? ' · ' + t('reviewDraft') : ''}`);
        text('startButton', state.session ? t('resume') : t('start').replace('10', String(configuredCount)));
        $('reviewButton').disabled = !latest; $('resultReviewButton').disabled = !latest;
        renderPractical(); renderCertificate();
        if (state.session) showQuestion(); else $('quizPanel').hidden = true;
    }
    function renderPractical() {
        const course = state.selected;
        const host = $('practicalItems'); host.replaceChildren();
        const complete = course.practicalItems.filter(item => state.practical.some(review => review.item_id === item.id && review.status === 'independent')).length;
        text('practicalSummary', `${t('checked')}: ${complete} / ${course.practicalItems.length}`);
        for (const item of course.practicalItems) {
            const review = state.practical.find(row => row.item_id === item.id);
            const status = review ? ({ not_checked:t('unchecked'), practicing:t('practicing'), independent:t('independent'), needs_review:t('needsReview') }[review.status] || t('unchecked')) : t('unchecked');
            const li = element('li', '', `${translation(item)} — ${status}`);
            if (review?.comment) li.append(element('small', '', ` · ${review.comment}`));
            host.append(li);
        }
    }
    function renderCertificate() {
        const config = courseConfig(state.selected);
        text('certificateStatus', state.certificate ? `${t('checked')} · ${new Date(state.certificate.issued_at).toLocaleDateString(state.locale)}` : `${t('certPending')} ${config.certificate_requirement === 'quiz_and_practical' || config.certificateRequirement === 'quiz_and_practical' ? t('certPractical') : ''}`);
        const link = $('certificateLink'); link.hidden = !state.certificate;
        if (state.certificate) { link.href = environment.route('v1-certificate.html', { course:state.selected.id }); link.textContent = t('certReady'); }
    }
    async function startQuiz(forceNew = false) {
        const course = state.selected;
        if (!state.session || forceNew) {
            const config = courseConfig(course);
            const pool = core.eligibleQuestions(state.bank, course.id, state.locale);
            const previous = state.attempts[0]?.question_ids || [];
            const count = safeNumber(config.question_count ?? config.questionCount, 10, 1, 30);
            const chosen = core.selectQuestions(pool, count, previous);
            if (!chosen.length) { message(t('offline')); return; }
            state.session = { questionIds: chosen.map(question => question.id), answers: {}, current: 0, passScore: safeNumber(config.pass_score ?? config.passScore, 80, 1, 100) };
            const saved = await store.saveSession(state.user.id, course.id, state.session); state.session = saved.state; state.sync = saved.synced;
        }
        $('resultPanel').hidden = true; $('reviewPanel').hidden = true; showQuestion(); $('quizPanel').scrollIntoView({ block:'start', behavior:'smooth' });
    }
    function showQuestion() {
        if (!state.session) return;
        const question = currentQuestion(); if (!question) return;
        const translated = translation(question.translations);
        const answered = Object.hasOwn(state.session.answers, question.id);
        text('quizProgress', `${t('question')} ${state.session.current + 1} / ${state.session.questionIds.length}`);
        text('questionText', translated.question);
        const host = $('answerButtons'); host.replaceChildren();
        translated.options.forEach((answer, index) => {
            const button = element('button', answered && index === question.correctAnswer ? 'correct' : answered && state.session.answers[question.id] === index ? 'wrong' : '', `${index + 1}. ${answer}`);
            button.type = 'button'; button.disabled = answered; button.addEventListener('click', () => answerQuestion(index)); host.append(button);
        });
        $('feedback').hidden = !answered;
        if (answered) {
            const correct = state.session.answers[question.id] === question.correctAnswer;
            $('feedback').className = `feedback${correct ? '' : ' wrong'}`;
            text('feedback', `${correct ? t('correct') : t('incorrect')}\n${t('explanation')}: ${translated.explanation}\n${t('key')}: ${translated.keyPoint}`);
        }
        $('nextButton').hidden = !answered;
        text('nextButton', state.session.current === state.session.questionIds.length - 1 ? t('result') : t('next'));
        $('quizPanel').hidden = false;
    }
    async function answerQuestion(index) {
        const question = currentQuestion();
        if (!question || Object.hasOwn(state.session.answers, question.id)) return;
        state.session.answers[question.id] = index;
        const saved = await store.saveSession(state.user.id, state.selected.id, state.session);
        state.session = saved.state; state.sync = saved.synced; showQuestion();
    }
    async function nextQuestion() {
        if (!state.session || !Object.hasOwn(state.session.answers, currentQuestion().id)) return;
        if (state.session.current < state.session.questionIds.length - 1) {
            state.session.current++;
            const saved = await store.saveSession(state.user.id, state.selected.id, state.session);
            state.session = saved.state; state.sync = saved.synced; showQuestion(); return;
        }
        const questions = state.session.questionIds.map(questionById);
        const result = core.scoreAnswers(questions, state.session.answers, state.session.passScore);
        const saved = await store.saveAttempt(state.user.id, state.selected.id, state.session, result); state.sync = saved.synced;
        const finalResult = saved.synced ? saved.row : result;
        await store.clearSession(state.user.id, state.selected.id); state.session = null;
        state.attempts = await store.attempts(state.user.id, state.selected.id);
        if (finalResult.passed && saved.synced) {
            try { await store.issueCertificate(state.selected.id); state.certificate = await store.certificate(state.user.id, state.selected.id); }
            catch (error) { console.warn('Certificate not available yet.', error); }
        }
        $('quizPanel').hidden = true; $('resultPanel').hidden = false;
        text('resultTitle', finalResult.passed ? t('passed') : t('failed'));
        text('resultText', `${result.correct} / ${result.total} · ${finalResult.score}% · ${t('need')}: ${courseConfig(state.selected).pass_score ?? state.selected.passScore}%${saved.synced ? '' : ' · ' + t('local')}`);
        renderCourse(); $('resultPanel').hidden = false; $('resultPanel').scrollIntoView({ block:'start', behavior:'smooth' });
    }
    function reviewWrong() {
        const latest = state.attempts[0]; if (!latest) return;
        const host = $('reviewItems'); host.replaceChildren();
        if (!latest.question_ids?.length) { host.append(element('p', '', t('noHistory'))); $('reviewPanel').hidden = false; $('reviewPanel').scrollIntoView({ block:'start', behavior:'smooth' }); return; }
        const questions = latest.question_ids.map(questionById).filter(Boolean);
        const wrong = core.scoreAnswers(questions, latest.answers || {}).wrongIds;
        if (!wrong.length) host.append(element('p', '', t('noWrong')));
        wrong.forEach(id => {
            const question = questionById(id); const translated = translation(question.translations);
            const item = element('div', 'review-item'); item.append(element('h3', '', translated.question));
            item.append(element('p', '', `${t('correct')}: ${translated.options[question.correctAnswer]}`));
            item.append(element('p', '', `${t('explanation')}: ${translated.explanation}`));
            item.append(element('p', '', `${t('key')}: ${translated.keyPoint}`)); host.append(item);
        });
        $('reviewPanel').hidden = false; $('reviewPanel').scrollIntoView({ block:'start', behavior:'smooth' });
    }
    async function init() {
        applyLabels();
        $('locale').addEventListener('change', async event => {
            state.locale = event.target.value; localStorage.setItem('serveupLanguage', state.locale); applyLabels();
            if (state.user) store.saveLanguage(state.user.id, state.locale);
            if (state.selected) renderCourse(); else await dashboard();
        });
        $('startButton').addEventListener('click', () => startQuiz());
        $('retryButton').addEventListener('click', () => startQuiz(true));
        $('nextButton').addEventListener('click', nextQuestion);
        $('reviewButton').addEventListener('click', reviewWrong);
        $('resultReviewButton').addEventListener('click', reviewWrong);
        document.addEventListener('keydown', event => {
            if (!state.session || event.altKey || event.metaKey || event.ctrlKey || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
            if (/^[1-4]$/.test(event.key)) $('answerButtons').children[Number(event.key)-1]?.click();
            if (event.key.toLowerCase() === 'n' && !$('nextButton').hidden) $('nextButton').click();
        });
        try {
            state.user = await window.ServeUpProgress.getCurrentUser();
            if (!state.user) { message(t('signIn')); const a=element('a','',t('training')); a.href=environment.route('auth.html', { returnTo:'v1.html' }); $('message').append(a); return; }
            store.saveLanguage(state.user.id, state.locale);
            try { if (await window.ServeUpProgress.getMyRole() === 'admin') $('adminLink').hidden = false; } catch (error) { console.warn(error); }
            const [coursesResponse, bankResponse, settings] = await Promise.all([fetch('data/courses.json', { cache:'no-store' }), fetch('data/questions.json', { cache:'no-store' }), store.settings()]);
            if (!coursesResponse.ok || !bankResponse.ok) throw new Error('Content load failed');
            state.courses = await coursesResponse.json(); state.bank = await bankResponse.json(); state.settings = settings;
            const id = new URLSearchParams(location.search).get('course');
            const course = state.courses.find(item => item.id === id);
            if (course) await selectCourse(course); else await dashboard();
        } catch (error) { console.error(error); message(t('offline')); }
    }
    init();
}());
