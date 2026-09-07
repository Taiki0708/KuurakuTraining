(function () {
    "use strict";

    const courseNames = {
        "customer-service": "Customer Service",
        "food-safety": "Food Safety",
        "japanese-hospitality": "Japanese Hospitality",
        "restaurant-basics": "Restaurant Basics"
    };

    async function initialise() {
        const accessMessage = document.getElementById("accessMessage");
        const content = document.getElementById("reportContent");
        const user = await window.ServeUpProgress.getCurrentUser();

        if (!user) {
            accessMessage.textContent = "Sign in with an administrator account to view this page.";
            return;
        }

        try {
            const role = await window.ServeUpProgress.getMyRole();
            if (role !== "admin") {
                accessMessage.textContent = "You do not have permission to view this page.";
                return;
            }

            const [report, learners, assignments] = await Promise.all([
                window.ServeUpProgress.getManagerReport(),
                window.ServeUpProgress.getAdminLearners(),
                window.ServeUpProgress.getAdminAssignments()
            ]);
            accessMessage.hidden = true;
            content.hidden = false;
            renderReport(report);
            populateLearners(learners);
            renderAssignments(assignments);
            document.getElementById("assignmentForm").addEventListener("submit", submitAssignment);
        } catch (error) {
            console.error("Could not load the manager report.", error);
            accessMessage.textContent = "The report could not be loaded. Please try again.";
        }
    }

    function populateLearners(learners) {
        const select = document.getElementById("learnerSelect");
        select.innerHTML = "";
        learners.forEach(learner => {
            const option = document.createElement("option");
            option.value = learner.user_id;
            option.textContent = learner.email;
            select.appendChild(option);
        });
    }

    function renderAssignments(assignments) {
        const rows = document.getElementById("assignmentRows");
        rows.innerHTML = "";
        document.getElementById("assignmentEmptyState").hidden = assignments.length > 0;

        assignments.forEach(assignment => {
            const row = document.createElement("tr");
            [assignment.email, courseNames[assignment.course_id] || assignment.course_id,
                assignment.due_date ? new Date(assignment.due_date + "T00:00:00").toLocaleDateString() : "No deadline"]
                .forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    row.appendChild(cell);
                });
            rows.appendChild(row);
        });
    }

    async function submitAssignment(event) {
        event.preventDefault();
        const status = document.getElementById("assignmentStatus");
        status.textContent = "Saving assignment…";
        try {
            await window.ServeUpProgress.assignCourse(
                document.getElementById("learnerSelect").value,
                document.getElementById("courseSelect").value,
                document.getElementById("dueDate").value
            );
            const assignments = await window.ServeUpProgress.getAdminAssignments();
            renderAssignments(assignments);
            status.textContent = "Course assigned.";
        } catch (error) {
            console.error("Could not assign course.", error);
            status.textContent = "The assignment could not be saved.";
        }
    }

    function renderReport(report) {
        const rows = document.getElementById("reportRows");
        const uniqueLearners = new Set(report.map(item => item.email));
        const average = report.length
            ? Math.round(report.reduce((total, item) => total + item.score, 0) / report.length)
            : 0;

        document.getElementById("completionCount").textContent = report.length;
        document.getElementById("learnerCount").textContent = uniqueLearners.size;
        document.getElementById("averageScore").textContent = average + "%";

        if (!report.length) {
            document.getElementById("emptyState").hidden = false;
            return;
        }

        report.forEach(item => {
            const row = document.createElement("tr");
            const values = [
                item.email,
                courseNames[item.course_id] || item.course_id,
                item.score + "%",
                new Date(item.completed_at).toLocaleDateString()
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });
            rows.appendChild(row);
        });
    }

    initialise();
}());
