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

    function renderProgress(completed) {
        storageKeys.forEach(key => {
            const status = document.getElementById(key.replace("Completed", "Status"));
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
            if (status) status.textContent = "✓ Completed";
        });

        const percentage = (completed.length / storageKeys.length) * 100;
        document.getElementById("progressText").textContent =
            completed.length + " / " + storageKeys.length + " Courses Completed";
        document.getElementById("progressFill").style.width = percentage + "%";
    }

    function renderAccount(user) {
        const accountArea = document.getElementById("accountArea");
        accountArea.innerHTML = "";

        if (!user) {
            const message = document.createElement("span");
            message.textContent = "Sign in to save your training progress.";
            const link = document.createElement("a");
            link.href = "auth.html";
            link.className = "account-link";
            link.textContent = "Sign in";
            accountArea.append(message, link);
            return;
        }

        const message = document.createElement("span");
        message.textContent = user.email;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sign-out-button";
        button.textContent = "Sign out";
        button.addEventListener("click", async () => {
            await window.ServeUpProgress.client.auth.signOut();
            window.location.reload();
        });
        accountArea.append(message, button);
    }

    async function initialise() {
        const user = await window.ServeUpProgress.getCurrentUser();
        renderAccount(user);

        if (!user) {
            const legacyProgress = storageKeys.filter(key => localStorage.getItem(key) === "true");
            renderProgress(legacyProgress);
            return;
        }

        try {
            const courses = await window.ServeUpProgress.getCompletedCourses();
            const completed = courses
                .map(course => ({
                    "customer-service": "customerServiceCompleted",
                    "food-safety": "foodSafetyCompleted",
                    "japanese-hospitality": "japaneseHospitalityCompleted",
                    "restaurant-basics": "restaurantBasicsCompleted"
                }[course.course_id]))
                .filter(Boolean);
            renderProgress(completed);
        } catch (error) {
            console.error("Could not load training progress.", error);
            renderProgress([]);
        }
    }

    initialise();
}());
