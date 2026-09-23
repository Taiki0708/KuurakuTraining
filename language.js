(function () {
    "use strict";

    const select = document.getElementById("languageSelect");
    if (!select) return;

    const copy = {
        en: {
            skipToContent: "Skip to content",
            brandTagline: "Restaurant Training Made Simple",
            languageLabel: "Language",
            announcementTitle: "Training reminder",
            announcementMessage: "Check your assigned courses and due dates.",
            myTraining: "My training",
            dashboardEyebrow: "Your learning dashboard",
            welcomeTitle: "Welcome to ServeUp",
            welcomeCopy: "Build practical restaurant skills at your own pace. Continue your training, check your progress, and get ready for confident service.",
            continueTraining: "Continue training",
            viewMyTraining: "View my training",
            statCourses: "practical training courses",
            statQuestions: "multilingual questions",
            statLanguages: "supported languages",
            trainingSummaryAria: "ServeUp training summary",
            progressSidebarAria: "Training progress",
            courseCompletionAria: "Course completion",
            footerAria: "Footer",
            learnAtYourPace: "Learn at your pace",
            trainingLibrary: "Training library",
            trainingLibraryCopy: "Start with the latest ServeUp program or revisit a foundation course.",
            recommended: "Recommended",
            v1Title: "ServeUp V1 · Complete program",
            v1Copy: "8 courses, randomized tests, wrong-answer review, and practical checks by your manager.",
            openV1: "Open V1 training",
            foundationCourses: "Foundation courses",
            startTraining: "Start training",
            yourProgress: "Your progress",
            progressHelp: "Completed courses are saved to your account when you are signed in.",
            assignedTraining: "Assigned training",
            aboutServeUp: "About ServeUp",
            pricingPlans: "Pricing plans"
        },
        ja: {
            skipToContent: "本文へ移動",
            brandTagline: "飲食店トレーニングを、もっとシンプルに",
            languageLabel: "言語",
            announcementTitle: "トレーニングのお知らせ",
            announcementMessage: "割り当てられたコースと期限を確認しましょう。",
            myTraining: "マイトレーニング",
            dashboardEyebrow: "学習ダッシュボード",
            welcomeTitle: "ServeUpへようこそ",
            welcomeCopy: "実践的な飲食店スキルを、自分のペースで学びましょう。学習を続け、進捗を確認し、自信を持って接客できるよう準備します。",
            continueTraining: "学習を続ける",
            viewMyTraining: "学習状況を見る",
            statCourses: "実践トレーニングコース",
            statQuestions: "多言語対応の問題",
            statLanguages: "対応言語",
            trainingSummaryAria: "ServeUpトレーニングの概要",
            progressSidebarAria: "学習の進捗",
            courseCompletionAria: "コース完了率",
            footerAria: "フッター",
            learnAtYourPace: "自分のペースで学ぶ",
            trainingLibrary: "トレーニング一覧",
            trainingLibraryCopy: "最新のServeUpプログラムから始めるか、基礎コースを復習できます。",
            recommended: "おすすめ",
            v1Title: "ServeUp V1 · 総合プログラム",
            v1Copy: "8コース、ランダムテスト、不正解復習、店長による実技確認に対応しています。",
            openV1: "V1トレーニングを開く",
            foundationCourses: "基礎コース",
            startTraining: "トレーニングを始める",
            yourProgress: "学習の進捗",
            progressHelp: "ログイン中は、完了したコースがアカウントに保存されます。",
            assignedTraining: "割り当てられた研修",
            aboutServeUp: "ServeUpについて",
            pricingPlans: "料金プラン"
        },
        hi: {
            skipToContent: "मुख्य सामग्री पर जाएँ",
            brandTagline: "रेस्तरां प्रशिक्षण, अब और आसान",
            languageLabel: "भाषा",
            announcementTitle: "प्रशिक्षण अनुस्मारक",
            announcementMessage: "अपने निर्धारित कोर्स और उनकी समय-सीमा देखें।",
            myTraining: "मेरा प्रशिक्षण",
            dashboardEyebrow: "आपका लर्निंग डैशबोर्ड",
            welcomeTitle: "ServeUp में आपका स्वागत है",
            welcomeCopy: "अपनी गति से व्यावहारिक रेस्तरां कौशल सीखें। प्रशिक्षण जारी रखें, प्रगति देखें और आत्मविश्वास के साथ सेवा के लिए तैयार हों।",
            continueTraining: "प्रशिक्षण जारी रखें",
            viewMyTraining: "मेरा प्रशिक्षण देखें",
            statCourses: "व्यावहारिक प्रशिक्षण कोर्स",
            statQuestions: "बहुभाषी प्रश्न",
            statLanguages: "समर्थित भाषाएँ",
            trainingSummaryAria: "ServeUp प्रशिक्षण सारांश",
            progressSidebarAria: "प्रशिक्षण प्रगति",
            courseCompletionAria: "कोर्स पूर्णता",
            footerAria: "फुटर",
            learnAtYourPace: "अपनी गति से सीखें",
            trainingLibrary: "प्रशिक्षण लाइब्रेरी",
            trainingLibraryCopy: "नए ServeUp कार्यक्रम से शुरू करें या बुनियादी कोर्स दोहराएँ।",
            recommended: "सुझाया गया",
            v1Title: "ServeUp V1 · पूरा कार्यक्रम",
            v1Copy: "8 कोर्स, रैंडम टेस्ट, गलत उत्तरों की समीक्षा और मैनेजर द्वारा प्रैक्टिकल जाँच।",
            openV1: "V1 प्रशिक्षण खोलें",
            foundationCourses: "बुनियादी कोर्स",
            startTraining: "प्रशिक्षण शुरू करें",
            yourProgress: "आपकी प्रगति",
            progressHelp: "साइन इन रहने पर पूरे किए गए कोर्स आपके खाते में सेव होते हैं।",
            assignedTraining: "निर्धारित प्रशिक्षण",
            aboutServeUp: "ServeUp के बारे में",
            pricingPlans: "मूल्य योजनाएँ"
        }
    };

    const courseFallbacks = {
        ja: {
            "customer-service": { title: "接客サービス", description: "プロフェッショナルな接客の基本と、ゲストに良い体験を提供する方法を学びます。" },
            "food-safety": { title: "食品衛生", description: "食品安全の基本、衛生管理、安全な店舗業務の手順を学びます。" },
            "japanese-hospitality": { title: "日本のおもてなし", description: "相手の気持ちを考え、一歩先の心配りをするサービスを学びます。" },
            "restaurant-basics": { title: "飲食店の基礎", description: "飲食店で働くための基本知識と、日々の実践方法を学びます。" }
        },
        hi: {
            "customer-service": { title: "ग्राहक सेवा", description: "पेशेवर ग्राहक सेवा की बुनियादी बातें और अतिथि को अच्छा अनुभव देने के तरीके सीखें।" },
            "food-safety": { title: "खाद्य सुरक्षा", description: "खाद्य सुरक्षा, स्वच्छता और सुरक्षित रेस्तरां प्रक्रियाओं की आवश्यक बातें सीखें।" },
            "japanese-hospitality": { title: "जापानी आतिथ्य", description: "अतिथि की भावना को समझकर विचारशील सेवा देना सीखें।" },
            "restaurant-basics": { title: "रेस्तरां की बुनियाद", description: "रेस्तरां में प्रभावी ढंग से काम करने के लिए आवश्यक ज्ञान और दैनिक अभ्यास सीखें।" }
        }
    };

    function matchesLocale(value, locale) {
        if (locale === "ja") return /[\u3040-\u30ff\u3400-\u9fff]/.test(value || "");
        if (locale === "hi") return /[\u0900-\u097f]/.test(value || "");
        return true;
    }

    const savedLanguage = localStorage.getItem("serveupLanguage") || "en";
    select.value = copy[savedLanguage] ? savedLanguage : "en";

    async function applyLanguage() {
        const locale = copy[select.value] ? select.value : "en";
        localStorage.setItem("serveupLanguage", locale);
        document.documentElement.lang = locale;

        document.querySelectorAll("[data-i18n]").forEach(element => {
            const value = copy[locale][element.dataset.i18n];
            if (value) element.textContent = value;
        });

        document.querySelectorAll("[data-i18n-aria-label]").forEach(element => {
            const value = copy[locale][element.dataset.i18nAriaLabel];
            if (value) element.setAttribute("aria-label", value);
        });

        await Promise.all(Array.from(document.querySelectorAll("[data-course-id]")).map(async card => {
            try {
                const translation = await window.ServeUpProgress.getCourseTranslation(card.dataset.courseId, locale);
                const fallback = courseFallbacks[locale]?.[card.dataset.courseId];
                const localized = matchesLocale(translation?.title, locale) && matchesLocale(translation?.description, locale)
                    ? translation
                    : fallback;
                if (!localized) return;
                card.querySelector("h3").textContent = localized.title;
                card.querySelector("p").textContent = localized.description;
            } catch (error) {
                console.error("Could not load course translation.", error);
            }
        }));

        document.dispatchEvent(new CustomEvent("serveup:languagechange", { detail: { locale } }));
    }

    select.addEventListener("change", applyLanguage);
    applyLanguage();
}());
