(function () {
    "use strict";

    const courseNames = {
        "customer-service": "Customer Service",
        "food-safety": "Food Safety",
        "japanese-hospitality": "Japanese Hospitality",
        "restaurant-basics": "Restaurant Basics"
    };
    let managedCourses = [];
    let currentReport = [];
    let managedQuestions = [];
    let selectedQuestionId = null;

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
            currentReport = report;
            renderReport(report);
            document.getElementById("learnerSearch").addEventListener("input", event => renderReport(currentReport, event.target.value));
            document.getElementById("exportReport").addEventListener("click", exportReport);
            populateLearners(learners);
            renderAssignments(assignments);
            renderFollowUp(assignments, report);
            populateManagedCourses();
            populateQuestionCourses();
            await loadQuestions();
            document.getElementById("assignmentForm").addEventListener("submit", submitAssignment);
            document.getElementById("courseForm").addEventListener("submit", submitCourse);
            document.getElementById("managedCourseSelect").addEventListener("change", populateCourseForm);
            document.getElementById("questionCourseSelect").addEventListener("change", loadQuestions);
            document.getElementById("questionLocaleSelect").addEventListener("change", loadQuestions);
            document.getElementById("managedQuestionSelect").addEventListener("change", populateQuestionForm);
            document.getElementById("newQuestionButton").addEventListener("click", createNewQuestion);
            document.getElementById("questionForm").addEventListener("submit", submitQuestion);
            document.getElementById("deleteQuestionButton").addEventListener("click", deleteQuestion);
            ["answer1", "answer2", "answer3", "answer4"].forEach(id =>
                document.getElementById(id).addEventListener("input", updateCorrectAnswerOptions)
            );
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

    function populateQuestionCourses() {
        const select = document.getElementById("questionCourseSelect");
        select.innerHTML = "";
        managedCourses.forEach(course => {
            const option = document.createElement("option");
            option.value = course.id;
            option.textContent = course.title || course.id;
            select.appendChild(option);
        });
    }

    function populateCourseForm() {
        const course = managedCourses.find(item => item.id === document.getElementById("managedCourseSelect").value);
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
            await window.ServeUpProgress.saveTrainingCourse(id, Number(document.getElementById("managedCourseOrder").value), document.getElementById("managedCourseActive").checked, document.getElementById("managedCourseTitle").value, document.getElementById("managedCourseDescription").value);
            managedCourses = await window.ServeUpProgress.getAdminCourses();
            populateManagedCourses();
            populateQuestionCourses();
            document.getElementById("managedCourseSelect").value = id;
            populateCourseForm();
            status.textContent = "Course settings saved.";
        } catch (error) {
            console.error("Could not save course settings.", error);
            status.textContent = "The course settings could not be saved.";
        }
    }

    async function loadQuestions() {
        const status = document.getElementById("questionStatus");
        status.textContent = "Loading questions…";
        try {
            managedQuestions = await window.ServeUpProgress.getAdminCourseQuestionsLocale(document.getElementById("questionCourseSelect").value, document.getElementById("questionLocaleSelect").value);
            const select = document.getElementById("managedQuestionSelect");
            select.innerHTML = "";
            managedQuestions.forEach((question, index) => {
                const option = document.createElement("option");
                option.value = question.id;
                option.textContent = (index + 1) + ". " + question.question_text;
                select.appendChild(option);
            });
            if (managedQuestions.length) populateQuestionForm();
            else createNewQuestion();
            status.textContent = managedQuestions.length ? managedQuestions.length + " question(s) loaded." : "No saved questions yet. Create the first one.";
        } catch (error) {
            console.error("Could not load questions.", error);
            status.textContent = "The questions could not be loaded.";
        }
    }

    function populateQuestionForm() {
        const question = managedQuestions.find(item => item.id === document.getElementById("managedQuestionSelect").value);
        if (!question) return createNewQuestion();
        selectedQuestionId = question.id;
        document.getElementById("questionText").value = question.question_text;
        document.getElementById("questionExplanation").value = question.explanation || "";
        document.getElementById("questionOrder").value = question.sort_order;
        for (let i = 0; i < 4; i += 1) document.getElementById("answer" + (i + 1)).value = question.answers[i] || "";
        updateCorrectAnswerOptions(question.correct_answer);
        document.getElementById("deleteQuestionButton").hidden = false;
    }

    function createNewQuestion() {
        selectedQuestionId = null;
        document.getElementById("managedQuestionSelect").value = "";
        document.getElementById("questionForm").reset();
        document.getElementById("questionOrder").value = managedQuestions.length + 1;
        updateCorrectAnswerOptions(0);
        document.getElementById("deleteQuestionButton").hidden = true;
        document.getElementById("questionText").focus();
    }

    function updateCorrectAnswerOptions(selectedIndex) {
        const select = document.getElementById("correctAnswer");
        const previous = Number.isInteger(selectedIndex) ? selectedIndex : Number(select.value || 0);
        select.innerHTML = "";
        for (let i = 0; i < 4; i += 1) {
            const value = document.getElementById("answer" + (i + 1)).value.trim();
            if (!value) continue;
            const option = document.createElement("option");
            option.value = i;
            option.textContent = "Answer " + (i + 1);
            select.appendChild(option);
        }
        if (select.options.length) select.value = String(previous);
        if (select.value === "") select.selectedIndex = 0;
    }

    async function submitQuestion(event) {
        event.preventDefault();
        const status = document.getElementById("questionStatus");
        const answers = [1, 2, 3, 4].map(number => document.getElementById("answer" + number).value.trim()).filter(Boolean);
        const correctInputIndex = Number(document.getElementById("correctAnswer").value);
        const answerSlots = [1, 2, 3, 4].map(number => document.getElementById("answer" + number).value.trim());
        const correctAnswer = answerSlots.slice(0, correctInputIndex).filter(Boolean).length;
        if (answers.length < 2) {
            status.textContent = "Please provide at least two answers.";
            return;
        }
        status.textContent = "Saving question…";
        try {
            await window.ServeUpProgress.saveTrainingQuestionLocale(selectedQuestionId, document.getElementById("questionCourseSelect").value, document.getElementById("questionLocaleSelect").value, document.getElementById("questionText").value, answers, correctAnswer, document.getElementById("questionExplanation").value, Number(document.getElementById("questionOrder").value));
            await loadQuestions();
            status.textContent = "Question saved.";
        } catch (error) {
            console.error("Could not save question.", error);
            status.textContent = "The question could not be saved.";
        }
    }

    async function deleteQuestion() {
        if (!selectedQuestionId) return;
        const status = document.getElementById("questionStatus");
        if (!window.confirm("Delete this question? This cannot be undone.")) return;
        status.textContent = "Deleting question…";
        try {
            await window.ServeUpProgress.deleteTrainingQuestion(selectedQuestionId, document.getElementById("questionCourseSelect").value);
            await loadQuestions();
            status.textContent = "Question deleted.";
        } catch (error) {
            console.error("Could not delete question.", error);
            status.textContent = "The question could not be deleted.";
        }
    }

    function renderFollowUp(assignments, report) {
        const completed = new Set(report.map(item => item.email + "|" + item.course_id));
        const now = new Date();
        const soon = new Date(now); soon.setDate(now.getDate() + 7);
        const rows = document.getElementById("followUpRows");
        rows.innerHTML = "";
        let overdue = 0, dueSoon = 0, uncompleted = 0;
        assignments.forEach(item => {
            const done = completed.has(item.email + "|" + item.course_id);
            if (!done) uncompleted += 1;
            const due = item.due_date ? new Date(item.due_date + "T23:59:59") : null;
            const isOverdue = !done && due && due < now;
            const isDueSoon = !done && due && due >= now && due <= soon;
            if (isOverdue) overdue += 1;
            if (isDueSoon) dueSoon += 1;
            if (!isOverdue && !isDueSoon) return;
            const row = document.createElement("tr");
            [item.email, courseNames[item.course_id] || item.course_id, item.due_date || "No deadline", isOverdue ? "Overdue" : "Due soon"].forEach(value => { const cell = document.createElement("td"); cell.textContent = value; row.appendChild(cell); });
            rows.appendChild(row);
        });
        document.getElementById("overdueCount").textContent = overdue;
        document.getElementById("dueSoonCount").textContent = dueSoon;
        document.getElementById("uncompletedCount").textContent = uncompleted;
        document.getElementById("followUpEmpty").hidden = rows.children.length > 0;
    }

    function renderAssignments(assignments) {
        const rows = document.getElementById("assignmentRows");
        rows.innerHTML = "";
        document.getElementById("assignmentEmptyState").hidden = assignments.length > 0;
        assignments.forEach(assignment => {
            const row = document.createElement("tr");
            const overdue = assignment.due_date && new Date(assignment.due_date + "T23:59:59") < new Date();
            if (overdue) row.className = "overdue-row";
            [assignment.email, courseNames[assignment.course_id] || assignment.course_id, assignment.due_date ? new Date(assignment.due_date + "T00:00:00").toLocaleDateString() : "No deadline", overdue ? "Overdue" : "On schedule"].forEach(value => {
                const cell = document.createElement("td"); cell.textContent = value; row.appendChild(cell);
            });
            rows.appendChild(row);
        });
    }

    async function submitAssignment(event) {
        event.preventDefault();
        const status = document.getElementById("assignmentStatus");
        status.textContent = "Saving assignment…";
        try {
            await window.ServeUpProgress.assignCourse(document.getElementById("learnerSelect").value, document.getElementById("courseSelect").value, document.getElementById("dueDate").value);
            renderAssignments(await window.ServeUpProgress.getAdminAssignments());
            status.textContent = "Course assigned.";
        } catch (error) {
            console.error("Could not assign course.", error);
            status.textContent = "The assignment could not be saved.";
        }
    }

    function exportReport() {
        const rows = [["Learner", "Course", "Score", "Completed"]].concat(currentReport.map(item => [item.email, courseNames[item.course_id] || item.course_id, item.score, item.completed_at]));
        const csv = rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(",")).join("\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        link.download = "serveup-training-progress.csv";
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function renderReport(report, filter = "") {
        report = report.filter(item => item.email.toLowerCase().includes(filter.toLowerCase()));
        const rows = document.getElementById("reportRows");
        const uniqueLearners = new Set(report.map(item => item.email));
        const average = report.length ? Math.round(report.reduce((total, item) => total + item.score, 0) / report.length) : 0;
        document.getElementById("completionCount").textContent = report.length;
        document.getElementById("learnerCount").textContent = uniqueLearners.size;
        document.getElementById("averageScore").textContent = average + "%";
        if (!report.length) { document.getElementById("emptyState").hidden = false; return; }
        report.forEach(item => {
            const row = document.createElement("tr");
            [item.email, courseNames[item.course_id] || item.course_id, item.score + "%", new Date(item.completed_at).toLocaleDateString()].forEach(value => {
                const cell = document.createElement("td"); cell.textContent = value; row.appendChild(cell);
            });
            rows.appendChild(row);
        });
    }

    initialise();
}());
