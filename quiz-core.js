(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.ServeUpQuizCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function eligibleQuestions(bank, courseId, locale) {
        return bank.filter(question => question.courseId === courseId && question.active && question.translations && question.translations[locale]);
    }

    function selectQuestions(bank, count, previousIds = [], random = Math.random) {
        const unique = [...new Map(bank.map(question => [question.id, question])).values()];
        const previous = new Set(previousIds);
        const shuffle = items => {
            const result = [...items];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        };
        const target = Math.min(Math.max(0, count), unique.length);
        const fresh = shuffle(unique.filter(question => !previous.has(question.id)));
        const repeat = shuffle(unique.filter(question => previous.has(question.id)));
        const picked = [];
        const usedGroups = new Set();
        for (const candidate of [...fresh, ...repeat]) {
            const group = candidate.scenarioGroup || candidate.id;
            if (picked.length < target && !usedGroups.has(group)) {
                picked.push(candidate);
                usedGroups.add(group);
            }
        }
        for (const candidate of [...fresh, ...repeat]) {
            if (picked.length >= target) break;
            if (!picked.includes(candidate)) picked.push(candidate);
        }
        return picked;
    }

    function scoreAnswers(questions, answers, passScore = 80) {
        const correct = questions.reduce((total, question) => total + (answers[question.id] === question.correctAnswer ? 1 : 0), 0);
        const score = questions.length ? Math.round(correct * 100 / questions.length) : 0;
        return { correct, total: questions.length, score, passed: questions.length > 0 && score >= passScore,
            wrongIds: questions.filter(question => answers[question.id] !== question.correctAnswer).map(question => question.id) };
    }

    return { eligibleQuestions, selectQuestions, scoreAnswers };
}));
