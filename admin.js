(function () {
    "use strict";

    const courseNames = {
        "customer-service": "Customer Service",
        "food-safety": "Food Safety",
        "japanese-hospitality": "Japanese Hospitality",
        "restaurant-basics": "Restaurant Basics"
    };
    let managedCourses = [];

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

            const [report, learners, assignments, courses] = await Promise.all([
                window.ServeUpProgress.getManagerReport(),
                window.ServeUpProgress.getAdminLearners(),
                window.ServeUpProgress.getAdminAssignments(),
                window.ServeUpProgress.getAdminCourses()
            ]);
            managedCourses = courses;
            accessMessage.hidden = true;
            content.hidden = false;
            renderReport(report);
            populateLearners(learners);
            renderAssignments(assignments);
            populateManagedCourses();
            document.getElementById("assignmentForm").addEventListener("submit", submitAssignment);
            document.getElementById("courseForm").addEventListener("submit", submitCourse);
            document.getElementById("managedCourseSelect").addEventListener("change", populateCourseForm);
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

    function populateManagedCourses() {
        const select = document.getElementById("managedCourseSelect");
        select.innerHTML = "";
        managedCourses.forEach(course => {
            const option = document.createElement("option");
            option.value = course.id;
            option.textContent = course.title || course.id;
            select.appendChild(option);
        });
        populateCourseForm();
    }

    function populateCourseForm() {
        const id = document.getElementById("managedCourseSelect").value;
        const course = managedCourses.find(item => item.id === id);
        if (!course) return;
        document.getElementById("managedCourseTitle").value = course.title || "";
        document.getElementById("managedCourseDescription").value = course.description || "";
        document.getElementById("managedCourseOrder").value = course.sort_order;
        document.getElementById("managedCourseActive").checked = course.is_active;
    }

    async function submitCourse(event) {
        event.preventDefault();
        const status = document.getElementById("courseStatus");
        const id = document.getElementById("managedCourseSelect").value;
        status.textContent = "Saving course settings…";
        try {
            await window.ServeUpProgress.saveTrainingCourse(
                id,
                Number(document.getElementById("managedCourseOrder").value),
                document.getElementById("managedCourseActive").checked,
                document.getElementById("managedCourseTitle").value,
                document.getElementById("managedCourseDescription").value
            );
            managedCourses = await window.ServeUpProgress.getAdminCourses();
            populateManagedCourses();
            document.getElementById("managedCourseSelect").value = id;
            populateCourseForm();
            status.textContent = "Course settings saved.";
        } catch (error) {
            console.error("Could not save course settings.", error);
            status.textContent = "The course settings could not be saved.";
        }
    }

    function renderAssignments(assignments) {
        const rows = document.getElementById("assignmentRows");
        rows.innerHTML = "";
        document.getElementById("assignmentEmptyState").hidden = assignments.length > 0;

        assignments.forEach(assignment => {
            const row = document.createElement("tr");
            const overdue = assignment.due_date && new Date(assignment.due_date + "T23:59:59") < new Date();
            if (overdue) row.className = "overdue-row";
            [assignment.email, courseNames[assignment.course_id] || assignment.course_id,
                assignment.due_date ? new Date(assignment.due_date + "T00:00:00").toLocaleDateString() : "No deadline",
                overdue ? "Overdue" : "On schedule"]
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
