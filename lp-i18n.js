(function () {
    "use strict";

    const english = {
        "本文へ移動": "Skip to content",
        "機能": "Features",
        "研修内容": "Courses",
        "導入の流れ": "How it works",
        "よくある質問": "Frequently asked questions",
        "言語": "Language",
        "導入を相談する": "Talk to us",
        "飲食店の新人研修を、": "Restaurant staff training,",
        "もっと伝わる形に。": "made easier to understand.",
        "ServeUpは、新人・外国人スタッフが、接客・衛生・店舗業務を自分の言語で学べる研修サービスです。": "ServeUp helps new and international restaurant staff learn service, hygiene, and daily operations in a language they understand.",
        "デモ・導入を相談する": "Book a demo",
        "どんなサービス？": "See how it works",
        "日本語・英語・ヒンディー語": "Japanese, English, and Hindi",
        "スマートフォン対応": "Works on smartphones",
        "店長の実技確認": "Manager practical checks",
        "学習状況": "Training progress",
        "衛": "H",
        "衛生・食品安全": "Hygiene & Food Safety",
        "テスト合格 · 90%": "Quiz passed · 90%",
        "接": "S",
        "接客の基本": "Guest Service Basics",
        "学習を続ける": "Continue learning",
        "安": "E",
        "安全・緊急対応": "Safety & Emergency",
        "未開始": "Not started",
        "最新スコア": "Latest score",
        "合格": "Passed",
        "日本語": "Japanese",
        "実務コース": "practical courses",
        "確認問題": "quiz questions",
        "対応言語": "supported languages",
        "アプリのように利用": "app-like experience",
        "こんな研修の悩み、": "Are these training challenges",
        "現場だけに任せていませんか？": "being left to your busy team?",
        "教える内容が人によって違う": "Training changes from one trainer to another",
        "忙しい時間帯に、店長や先輩が同じ説明を何度も繰り返している。": "Managers and experienced staff repeat the same explanations during already busy shifts.",
        "言葉の壁で理解に差が出る": "Language barriers create gaps in understanding",
        "日本語だけのマニュアルでは、細かな理由や判断基準まで伝わりにくい。": "Japanese-only manuals often fail to explain the reasons and judgment behind each action.",
        "「読んだ」と「できる」が分からない": "Finishing a manual does not prove practical ability",
        "研修を終えても、現場で実践できるか、誰が確認したかが残らない。": "Even after training, it is unclear whether the learner can perform the task or who verified it.",
        "ServeUpなら、": "ServeUp connects ",
        "学ぶ・確認する・現場で認める": "learning, testing, and manager approval",
        "を、ひとつにつなげます。": " in one clear process.",
        "研修の流れを、": "A simpler way to",
        "シンプルに整える。": "run staff training.",
        "スタッフは自分のペースで学習。店長は進捗と実技を確認。研修のばらつきを減らし、現場で必要な行動までつなげます。": "Staff learn at their own pace while managers track progress and verify practical skills. Everyone receives more consistent training that connects directly to real work.",
        "短く、分かりやすい多言語学習": "Short, clear multilingual lessons",
        "やさしい日本語・英語・ヒンディー語に対応。外国人スタッフも、内容を切り替えて確認できます。": "Lessons are available in simple Japanese, English, and Hindi, so international staff can learn in the language that works best for them.",
        "確認し、伝えてから行動する。": "Check, communicate, then act.",
        "ランダムテストと復習": "Randomized quizzes and review",
        "問題バンクから毎回ランダムに出題。不正解の理由と大切な点を確認できます。": "Each attempt draws from a question bank. Learners can review why an answer was wrong and understand the key point.",
        "店長による実技確認": "Practical checks by managers",
        "クイズ合格後、現場で一人でできるかを店長が確認。コメントと確認日時も残せます。": "After a learner passes the quiz, a manager confirms whether they can perform the skill independently and records comments and the review date.",
        "スタッフごとの進捗管理": "Progress tracking for every staff member",
        "最新・最高スコア、受験回数、最終学習、実技、修了証を一覧で確認できます。": "See latest and best scores, attempts, recent activity, practical checks, and certificates in one place.",
        "スタッフ": "Staff",
        "コース": "Course",
        "クイズ": "Quiz",
        "実技": "Practical",
        "飲食店の現場で必要なことを、": "Everything restaurant staff need,",
        "8つのコースに。": "organized into 8 courses.",
        "単純な暗記だけでなく、「この場面でどう動くか」を考える状況判断問題を中心に学びます。": "Scenario-based questions help learners decide what to do in real situations instead of only memorizing rules.",
        "店舗オリエンテーション": "Restaurant Orientation",
        "身だしなみ、出勤、遅刻・欠勤、勤務ルール": "Grooming, attendance, lateness, absence, and workplace rules",
        "手洗い、食品保管、交差汚染、清掃、体調不良": "Handwashing, food storage, cross-contamination, cleaning, and illness",
        "挨拶、表情、姿勢、案内、料理提供、日本式接客": "Greetings, expression, posture, seating guests, serving food, and Japanese hospitality",
        "職場のコミュニケーション": "Workplace Communication",
        "報告・連絡・相談、復唱、質問、ミスの報告": "Reporting, sharing information, confirming instructions, questions, and mistakes",
        "アレルギー・食事制限": "Allergies & Dietary Requirements",
        "食物アレルギー、ヴィーガン、宗教上の食事制限": "Food allergies, vegan requirements, and religious dietary needs",
        "火災、けが、やけど、転倒、地震、停電": "Fire, injuries, burns, falls, earthquakes, and power outages",
        "注文・配膳・会計": "Order, Serving & Payment",
        "オーダー、復唱、テーブル確認、料理提供、会計": "Taking and confirming orders, table checks, serving, and payment",
        "苦情・難しい場面": "Complaints & Difficult Situations",
        "料理の遅延、注文間違い、苦情、店長への引き継ぎ": "Delays, incorrect orders, complaints, and escalation to a manager",
        "導入から研修まで、3ステップ。": "Get started in 3 simple steps.",
        "店舗とスタッフを準備": "Set up your store and staff",
        "利用人数や運用方法を確認し、学習アカウントを準備します。": "Confirm the number of learners and your training process, then prepare staff accounts.",
        "スマホで学習・テスト": "Learn and take quizzes on a smartphone",
        "スタッフは自分の言語を選び、短いコースと確認テストを進めます。": "Staff choose their language and work through short lessons and knowledge checks.",
        "店長が進捗と実技を確認": "Managers review progress and practical skills",
        "管理画面で学習状況を確認し、現場でできることを実技項目に記録します。": "Managers review learning progress and record the skills each employee can perform on the job.",
        "いつものスマートフォンで、": "Learn right away on",
        "すぐに学べる。": "the smartphone you already use.",
        "ブラウザから利用でき、ホーム画面に追加すればアプリのように起動できます。専用端末やApp Storeからのダウンロードは必要ありません。": "ServeUp runs in the browser and can be added to the home screen for an app-like experience. No dedicated device or App Store download is required.",
        "iPhone・Androidに対応": "Works on iPhone and Android",
        "大きなボタンで操作しやすい画面": "Large, easy-to-use controls",
        "途中保存と再ログイン後の再開": "Save progress and resume after signing in again",
        "ホーム画面から起動": "Launch from the home screen",
        "外国人スタッフ以外も利用できますか？": "Can staff of any nationality use ServeUp?",
        "はい。新人スタッフ、アルバイト、既存スタッフの再確認など、国籍に関係なく利用できます。": "Yes. ServeUp can support new hires, part-time employees, and refresher training for existing staff, regardless of nationality.",
        "どの言語に対応していますか？": "Which languages are supported?",
        "現在は日本語・英語・ヒンディー語に対応しています。追加言語については導入相談時にお聞かせください。": "ServeUp currently supports Japanese, English, and Hindi. Tell us about any additional language needs during your consultation.",
        "店舗独自のルールも追加できますか？": "Can we add our own store rules?",
        "現在の標準コースを基に、店舗固有ルールへ対応できる構造を準備しています。必要な内容を確認したうえでご案内します。": "The platform is designed to support store-specific rules alongside the standard courses. We will confirm your requirements and explain the available options.",
        "料金はいくらですか？": "How much does ServeUp cost?",
        "店舗数・利用人数・必要な運用支援を確認してご案内します。まずは導入相談からお問い合わせください。": "Pricing depends on the number of stores, learners, and the support you need. Contact us for an introductory consultation.",
        "食品安全やアレルギー情報はそのまま運用できますか？": "Can we use the food safety and allergy content as-is?",
        "安全に関わる教材は、各店舗の責任者が自社ルールや最新の公的情報と照らし合わせて確認してから運用してください。": "Safety-related content should be reviewed by each store's responsible manager against company procedures and current official guidance before operational use.",
        "まずは、あなたの店舗の": "Tell us about your restaurant's",
        "研修課題を聞かせてください。": "training challenges.",
        "利用人数、スタッフの言語、現在の研修方法を確認し、ServeUpの使い方をご案内します。": "We will discuss your team size, staff languages, and current training process, then show you how ServeUp can help.",
        "導入について相談する": "Talk to us about ServeUp",
        "利用者ログイン": "Learner sign in"
    };

    const attributeEnglish = {
        "ServeUp トップ": "ServeUp home",
        "メインナビゲーション": "Main navigation",
        "ServeUpの特徴": "ServeUp highlights",
        "ServeUpの学習画面イメージ": "Preview of the ServeUp learner dashboard",
        "サービス概要": "Service overview",
        "フッターナビゲーション": "Footer navigation",
        "言語": "Language"
    };

    const metadata = {
        ja: {
            title: "ServeUp | 飲食店スタッフの多言語研修",
            description: "ServeUpは、新人・外国人の飲食スタッフが接客・衛生・店舗業務を多言語で学べる研修サービスです。クイズ、実技確認、進捗管理をひとつにまとめます。",
            ogTitle: "ServeUp | 飲食店の新人研修を、もっと伝わる形に。",
            ogDescription: "新人・外国人スタッフ向けの多言語レストラン研修。学習、確認テスト、店長の実技確認までひとつに。"
        },
        en: {
            title: "ServeUp | Multilingual Restaurant Staff Training",
            description: "ServeUp is multilingual restaurant training for new and international staff, combining lessons, quizzes, practical checks, and progress tracking.",
            ogTitle: "ServeUp | Restaurant staff training, made easier to understand.",
            ogDescription: "Multilingual restaurant training for new and international staff, from lessons and quizzes to manager practical checks."
        }
    };

    const englishMailLinks = [
        "mailto:taiki708@icloud.com?subject=ServeUp%20consultation",
        "mailto:taiki708@icloud.com?subject=ServeUp%20demo%20and%20consultation&body=Number%20of%20stores%3A%0D%0ANumber%20of%20staff%3A%0D%0AHow%20can%20we%20help%3F%3A",
        "mailto:taiki708@icloud.com?subject=ServeUp%20consultation&body=Number%20of%20stores%3A%0D%0ANumber%20of%20staff%3A%0D%0ARequired%20languages%3A%0D%0ACurrent%20training%20challenges%3A"
    ];

    const select = document.getElementById("lpLanguage");
    if (!select) return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentElement || ["SCRIPT", "STYLE"].includes(node.parentElement.tagName)) continue;
        textNodes.push({ node, original: node.nodeValue });
    }

    const attributed = Array.from(document.querySelectorAll("[aria-label]")).map(element => ({
        element,
        original: element.getAttribute("aria-label")
    }));
    const mailLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(element => ({
        element,
        original: element.getAttribute("href")
    }));

    function replaceText(original, language) {
        if (language !== "en") return original;
        const trimmed = original.trim();
        if (!english[trimmed]) return original;
        return original.replace(trimmed, english[trimmed]);
    }

    function setMeta(selector, value) {
        const element = document.querySelector(selector);
        if (element) element.setAttribute("content", value);
    }

    function applyLanguage(language) {
        const current = language === "en" ? "en" : "ja";
        document.documentElement.lang = current;
        select.value = current;
        localStorage.setItem("serveupLanguage", current);
        textNodes.forEach(item => { item.node.nodeValue = replaceText(item.original, current); });
        attributed.forEach(item => {
            item.element.setAttribute("aria-label", current === "en" ? (attributeEnglish[item.original] || item.original) : item.original);
        });
        mailLinks.forEach((item, index) => {
            item.element.setAttribute("href", current === "en" ? englishMailLinks[index] : item.original);
        });
        document.title = metadata[current].title;
        setMeta('meta[name="description"]', metadata[current].description);
        setMeta('meta[property="og:title"]', metadata[current].ogTitle);
        setMeta('meta[property="og:description"]', metadata[current].ogDescription);
    }

    select.addEventListener("change", () => applyLanguage(select.value));
    const saved = localStorage.getItem("serveupLanguage");
    applyLanguage(saved === "en" || saved === "hi" ? "en" : "ja");
}());
