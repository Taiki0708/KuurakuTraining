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

    function renderAssignments(assignments) {
        const card = document.getElementById("assignedCourses");
        const list = document.getElementById("assignmentList");
        const message = document.getElementById("assignmentMessage");
        if (!assignments.length) return;

        const courseNames = {
            "customer-service": "Customer Service",
            "food-safety": "Food Safety",
            "japanese-hospitality": "Japanese Hospitality",
            "restaurant-basics": "Restaurant Basics"
        };

        card.hidden = false;
        message.textContent = "Courses assigned to you by your manager:";
        assignments.forEach(assignment => {
            const item = document.createElement("li");
            item.textContent = courseNames[assignment.course_id] || assignment.course_id;
            if (assignment.due_date) {
                item.textContent += " — Due " + new Date(assignment.due_date + "T00:00:00").toLocaleDateString();
            }
            list.appendChild(item);
        });
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

        window.ServeUpProgress.getMyRole().then(role => {
            if (role !== "admin") return;
            const adminLink = document.createElement("a");
            adminLink.href = "admin.html";
            adminLink.className = "account-link";
            adminLink.textContent = "Admin dashboard";
            accountArea.insertBefore(adminLink, button);
        }).catch(error => console.error("Could not load user role.", error));
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
            const [courses, assignments] = await Promise.all([
                window.ServeUpProgress.getCompletedCourses(),
                window.ServeUpProgress.getMyAssignments()
            ]);
            renderAssignments(assignments);
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
