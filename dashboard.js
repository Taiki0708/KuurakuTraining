(function () {
    "use strict";

    const storageKeys = [
        "customerServiceCompleted",
        "foodSafetyCompleted",
        "japaneseHospitalityCompleted",
        "restaurantBasicsCompleted"
    ];

    const statusIds = {
        "customer-service": "customerServiceStatus",
        "food-safety": "foodSafetyStatus",
        "japanese-hospitality": "japaneseHospitalityStatus",
        "restaurant-basics": "restaurantBasicsStatus"
    };

    const messages = {
        en: {
            completed: "✓ Completed",
            progress: (done, total) => `${done} / ${total} courses completed`,
            signInMessage: "Sign in to save your training progress.",
            signIn: "Sign in",
            signOut: "Sign out",
            myTraining: "My training",
            adminDashboard: "Admin dashboard",
            assignedMessage: "Courses assigned to you by your manager:",
            due: "Due",
            courseNames: {
                "customer-service": "Customer Service",
                "food-safety": "Food Safety",
                "japanese-hospitality": "Japanese Hospitality",
                "restaurant-basics": "Restaurant Basics"
            }
        },
        ja: {
            completed: "✓ 完了",
            progress: (done, total) => `${total}コース中 ${done}コース完了`,
            signInMessage: "ログインすると学習進捗を保存できます。",
            signIn: "ログイン",
            signOut: "ログアウト",
            myTraining: "マイトレーニング",
            adminDashboard: "管理ダッシュボード",
            assignedMessage: "店長から割り当てられたコース：",
            due: "期限",
            courseNames: {
                "customer-service": "接客サービス",
                "food-safety": "食品衛生",
                "japanese-hospitality": "日本のおもてなし",
                "restaurant-basics": "飲食店の基本"
            }
        },
        hi: {
            completed: "✓ पूरा हुआ",
            progress: (done, total) => `${total} में से ${done} कोर्स पूरे`,
            signInMessage: "अपनी प्रशिक्षण प्रगति सेव करने के लिए साइन इन करें।",
            signIn: "साइन इन",
            signOut: "साइन आउट",
            myTraining: "मेरा प्रशिक्षण",
            adminDashboard: "एडमिन डैशबोर्ड",
            assignedMessage: "आपके मैनेजर द्वारा निर्धारित कोर्स:",
            due: "समय-सीमा",
            courseNames: {
                "customer-service": "ग्राहक सेवा",
                "food-safety": "खाद्य सुरक्षा",
                "japanese-hospitality": "जापानी आतिथ्य",
                "restaurant-basics": "रेस्तरां की बुनियादी बातें"
            }
        }
    };

    const state = {
        user: null,
        completed: [],
        assignments: []
    };

    function locale() {
        const saved = localStorage.getItem("serveupLanguage") || "en";
        return messages[saved] ? saved : "en";
    }

    function text() {
        return messages[locale()];
    }

    function renderProgress(completed) {
        Object.values(statusIds).forEach(id => {
            const status = document.getElementById(id);
            if (status) status.textContent = "";
        });

        completed.forEach(key => {
            const courseId = {
                customerServiceCompleted: "customer-service",
                foodSafetyCompleted: "food-safety",
                japaneseHospitalityCompleted: "japanese-hospitality",
                restaurantBasicsCompleted: "restaurant-basics"
            }[key];
            const status = document.getElementById(statusIds[courseId]);
            if (status) status.textContent = text().completed;
        });

        const percentage = Math.round((completed.length / storageKeys.length) * 100);
        const progressText = document.getElementById("progressText");
        const progressPercent = document.getElementById("progressPercent");
        const progressFill = document.getElementById("progressFill");
        const progressBar = document.querySelector(".progress-bar");
        if (progressText) progressText.textContent = text().progress(completed.length, storageKeys.length);
        if (progressPercent) progressPercent.textContent = `${percentage}%`;
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressBar) progressBar.setAttribute("aria-valuenow", String(percentage));
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

    function applyCourseVisibility(courses) {
        const active = new Set(courses.map(course => course.id));
        document.querySelectorAll("[data-course-id]").forEach(card => {
            card.hidden = !active.has(card.dataset.courseId);
        });
    }

    function rerenderLocalizedContent() {
        renderAccount(state.user);
        renderProgress(state.completed);
        renderAssignments(state.assignments);
    }

    async function initialise() {
        state.user = await window.ServeUpProgress.getCurrentUser();
        renderAccount(state.user);

        if (!state.user) {
            state.completed = storageKeys.filter(key => localStorage.getItem(key) === "true");
            renderProgress(state.completed);
            return;
        }

        try {
            const [courses, assignments, activeCourses] = await Promise.all([
                window.ServeUpProgress.getCompletedCourses(),
                window.ServeUpProgress.getMyAssignments(),
                window.ServeUpProgress.getActiveCourses()
            ]);
            applyCourseVisibility(activeCourses);
            state.assignments = assignments;
            state.completed = courses.map(course => ({
                "customer-service": "customerServiceCompleted",
                "food-safety": "foodSafetyCompleted",
                "japanese-hospitality": "japaneseHospitalityCompleted",
                "restaurant-basics": "restaurantBasicsCompleted"
            }[course.course_id])).filter(Boolean);
            renderAssignments(state.assignments);
            renderProgress(state.completed);
        } catch (error) {
            console.error("Could not load training progress.", error);
            state.completed = [];
            renderProgress(state.completed);
        }
    }

    document.addEventListener("serveup:languagechange", rerenderLocalizedContent);
    initialise();
}());
