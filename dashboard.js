(function () {
    "use strict";

    const messages = {
        en: {
            signInMessage: "Sign in to save your training progress.",
            signIn: "Sign in",
            signOut: "Sign out",
            myTraining: "My training",
            adminDashboard: "Admin dashboard",
            assignedMessage: "Courses assigned to you by your manager:",
            due: "Due",
            courseNames: {
                "customer-service": "Guest Service Basics",
                "food-safety": "Hygiene & Food Safety",
                "japanese-hospitality": "Guest Service Basics",
                "restaurant-basics": "Restaurant Orientation",
                "restaurant-orientation": "Restaurant Orientation",
                "hygiene-food-safety": "Hygiene & Food Safety",
                "guest-service-basics": "Guest Service Basics",
                "workplace-communication": "Workplace Communication",
                "allergies-dietary": "Allergies & Dietary Requirements",
                "safety-emergency": "Safety & Emergency",
                "order-serving-payment": "Order, Serving & Payment",
                "complaints-difficult": "Complaints & Difficult Situations"
            }
        },
        ja: {
            signInMessage: "ログインすると学習進捗を保存できます。",
            signIn: "ログイン",
            signOut: "ログアウト",
            myTraining: "マイトレーニング",
            adminDashboard: "管理ダッシュボード",
            assignedMessage: "店長から割り当てられたコース：",
            due: "期限",
            courseNames: {
                "customer-service": "接客の基本",
                "food-safety": "衛生・食品安全",
                "japanese-hospitality": "接客の基本",
                "restaurant-basics": "飲食店オリエンテーション",
                "restaurant-orientation": "飲食店オリエンテーション",
                "hygiene-food-safety": "衛生・食品安全",
                "guest-service-basics": "接客の基本",
                "workplace-communication": "職場のコミュニケーション",
                "allergies-dietary": "アレルギー・食事制限",
                "safety-emergency": "安全・緊急対応",
                "order-serving-payment": "注文・提供・会計",
                "complaints-difficult": "苦情・難しい状況への対応"
            }
        },
        hi: {
            signInMessage: "अपनी प्रशिक्षण प्रगति सेव करने के लिए साइन इन करें।",
            signIn: "साइन इन",
            signOut: "साइन आउट",
            myTraining: "मेरा प्रशिक्षण",
            adminDashboard: "एडमिन डैशबोर्ड",
            assignedMessage: "आपके मैनेजर द्वारा निर्धारित कोर्स:",
            due: "समय-सीमा",
            courseNames: {
                "customer-service": "अतिथि सेवा की मूल बातें",
                "food-safety": "स्वच्छता और खाद्य सुरक्षा",
                "japanese-hospitality": "अतिथि सेवा की मूल बातें",
                "restaurant-basics": "रेस्तरां परिचय",
                "restaurant-orientation": "रेस्तरां परिचय",
                "hygiene-food-safety": "स्वच्छता और खाद्य सुरक्षा",
                "guest-service-basics": "अतिथि सेवा की मूल बातें",
                "workplace-communication": "कार्यस्थल संचार",
                "allergies-dietary": "एलर्जी और आहार आवश्यकताएँ",
                "safety-emergency": "सुरक्षा और आपातकाल",
                "order-serving-payment": "ऑर्डर, परोसना और भुगतान",
                "complaints-difficult": "शिकायतें और कठिन परिस्थितियाँ"
            }
        }
    };

    const state = {
        user: null,
        assignments: []
    };

    function locale() {
        const saved = localStorage.getItem("serveupLanguage") || "en";
        return messages[saved] ? saved : "en";
    }

    function text() {
        return messages[locale()];
    }

    function renderAssignments(assignments) {
        const card = document.getElementById("assignedCourses");
        const list = document.getElementById("assignmentList");
        const message = document.getElementById("assignmentMessage");
        if (!card || !list || !message) return;

        list.innerHTML = "";
        card.hidden = assignments.length === 0;
        if (!assignments.length) return;

        message.textContent = text().assignedMessage;
        assignments.forEach(assignment => {
            const item = document.createElement("li");
            item.textContent = text().courseNames[assignment.course_id] || assignment.course_id;
            if (assignment.due_date) {
                const due = new Date(`${assignment.due_date}T23:59:59`);
                const displayDate = new Date(`${assignment.due_date}T00:00:00`).toLocaleDateString(locale());
                item.textContent += ` — ${text().due} ${displayDate}`;
                if (due < new Date()) item.className = "overdue-item";
            }
            list.appendChild(item);
        });
    }

    function renderAccount(user) {
        const accountArea = document.getElementById("accountArea");
        if (!accountArea) return;
        accountArea.innerHTML = "";

        if (!user) {
            const message = document.createElement("span");
            message.textContent = text().signInMessage;
            const link = document.createElement("a");
            link.href = "auth.html";
            link.className = "account-link";
            link.textContent = text().signIn;
            accountArea.append(message, link);
            return;
        }

        const message = document.createElement("span");
        message.textContent = user.email;
        message.title = user.email;
        window.ServeUpProgress.getMyProfile().then(profile => {
            if (profile?.display_name) message.textContent = profile.display_name;
        }).catch(error => console.warn("Could not load display name.", error));

        const myLink = document.createElement("a");
        myLink.href = "my-training.html";
        myLink.className = "account-link";
        myLink.textContent = text().myTraining;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "sign-out-button";
        button.textContent = text().signOut;
        button.addEventListener("click", async () => {
            await window.ServeUpProgress.client.auth.signOut();
            window.location.reload();
        });

        accountArea.append(message, myLink, button);
        window.ServeUpProgress.getMyRole().then(role => {
            if (role !== "admin" || !button.isConnected) return;
            const adminLink = document.createElement("a");
            adminLink.href = "admin.html";
            adminLink.className = "account-link";
            adminLink.textContent = text().adminDashboard;
            accountArea.insertBefore(adminLink, button);
        }).catch(error => console.error("Could not load user role.", error));
    }

    function rerenderLocalizedContent() {
        renderAccount(state.user);
        renderAssignments(state.assignments);
    }

    async function initialise() {
        state.user = await window.ServeUpProgress.getCurrentUser();
        renderAccount(state.user);

        if (!state.user) return;

        try {
            const assignments = await window.ServeUpProgress.getMyAssignments();
            state.assignments = assignments;
            renderAssignments(state.assignments);
        } catch (error) {
            console.error("Could not load training progress.", error);
        }
    }

    document.addEventListener("serveup:languagechange", rerenderLocalizedContent);
    initialise();
}());
