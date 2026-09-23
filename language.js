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
            trainingLibraryCopy: "One training program brings all restaurant basics and advanced skills together.",
            officialProgram: "Official program",
            programTitle: "ServeUp Training",
            programCopy: "Build the skills needed for everyday restaurant work through one clear, step-by-step program.",
            openTraining: "Open training",
            programCoursesAria: "ServeUp Training courses",
            courseOrientation: "Restaurant Orientation",
            courseHygiene: "Hygiene & Food Safety",
            courseService: "Guest Service Basics",
            courseCommunication: "Workplace Communication",
            courseAllergies: "Allergies & Dietary Requirements",
            courseSafety: "Safety & Emergency",
            courseOrder: "Order, Serving & Payment",
            courseComplaints: "Complaints & Difficult Situations",
            oneProgram: "One clear program",
            programBenefitCourses: "8 courses and 240 multilingual questions",
            programBenefitReview: "Random tests and wrong-answer review",
            programBenefitPractical: "Quiz results and manager practical checks",
            viewCourses: "View all courses",
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
            trainingLibraryCopy: "飲食店の基礎から応用までを、1つの研修プログラムで学べます。",
            officialProgram: "正式プログラム",
            programTitle: "ServeUp Training",
            programCopy: "飲食店の仕事に必要なスキルを、分かりやすいステップで学べます。",
            openTraining: "研修を開く",
            programCoursesAria: "ServeUp Trainingのコース",
            courseOrientation: "飲食店オリエンテーション",
            courseHygiene: "衛生・食品安全",
            courseService: "接客の基本",
            courseCommunication: "職場のコミュニケーション",
            courseAllergies: "アレルギー・食事制限",
            courseSafety: "安全・緊急対応",
            courseOrder: "注文・提供・会計",
            courseComplaints: "苦情・難しい状況への対応",
            oneProgram: "迷わない1つの研修体系",
            programBenefitCourses: "8コース・240問を3言語で学習",
            programBenefitReview: "ランダムテストと不正解復習",
            programBenefitPractical: "クイズ結果と店長による実技確認",
            viewCourses: "全コースを見る",
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
            trainingLibraryCopy: "रेस्तरां की बुनियादी और उन्नत कौशल अब एक ही प्रशिक्षण कार्यक्रम में हैं।",
            officialProgram: "आधिकारिक कार्यक्रम",
            programTitle: "ServeUp Training",
            programCopy: "रेस्तरां के रोज़मर्रा के काम के लिए ज़रूरी कौशल आसान चरणों में सीखें।",
            openTraining: "प्रशिक्षण खोलें",
            programCoursesAria: "ServeUp Training कोर्स",
            courseOrientation: "रेस्तरां परिचय",
            courseHygiene: "स्वच्छता और खाद्य सुरक्षा",
            courseService: "अतिथि सेवा की मूल बातें",
            courseCommunication: "कार्यस्थल संचार",
            courseAllergies: "एलर्जी और आहार आवश्यकताएँ",
            courseSafety: "सुरक्षा और आपातकाल",
            courseOrder: "ऑर्डर, परोसना और भुगतान",
            courseComplaints: "शिकायतें और कठिन परिस्थितियाँ",
            oneProgram: "एक स्पष्ट प्रशिक्षण कार्यक्रम",
            programBenefitCourses: "8 कोर्स और 240 बहुभाषी प्रश्न",
            programBenefitReview: "रैंडम टेस्ट और गलत उत्तरों की समीक्षा",
            programBenefitPractical: "क्विज़ परिणाम और मैनेजर प्रैक्टिकल जाँच",
            viewCourses: "सभी कोर्स देखें",
            assignedTraining: "निर्धारित प्रशिक्षण",
            aboutServeUp: "ServeUp के बारे में",
            pricingPlans: "मूल्य योजनाएँ"
        }
    };

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

        document.dispatchEvent(new CustomEvent("serveup:languagechange", { detail: { locale } }));
    }

    select.addEventListener("change", applyLanguage);
    applyLanguage();
}());
