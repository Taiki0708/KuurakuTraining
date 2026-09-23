(function () {
    "use strict";

    const courseNames = {
        "customer-service": "Customer Service",
        "food-safety": "Food Safety",
        "japanese-hospitality": "Japanese Hospitality",
        "restaurant-basics": "Restaurant Basics"
    };
    const t = value => window.ServeUpAdminI18n?.t(value) || value;
    let managedCourses = [];
    let currentReport = [];
    let visibleReport = [];
    let currentAssignments = [];
    let currentLearners = [];
    let managedQuestions = [];
    let selectedQuestionId = null;

    function appendCells(row, values, labels) {
        values.forEach((value, index) => {
            const cell = document.createElement("td");
            if (value instanceof Node) cell.appendChild(value);
            else cell.textContent = value;
            cell.dataset.label = t(labels[index]);
            row.appendChild(cell);
        });
    }

    function learnerRecord(email, userId) {
        return currentLearners.find(learner => (userId && learner.user_id === userId) || learner.email === email);
    }

    function learnerDisplayName(email, userId) {
        return learnerRecord(email, userId)?.display_name?.trim() || email;
    }

    function learnerIdentity(email, userId) {
        const wrapper = document.createElement("span");
        wrapper.className = "learner-identity";
        const name = document.createElement("strong");
        name.textContent = learnerDisplayName(email, userId);
        wrapper.appendChild(name);
        if (name.textContent !== email) {
            const address = document.createElement("small");
            address.textContent = email;
            wrapper.appendChild(address);
        }
        return wrapper;
    }

    function activateAdminTab(panelId, moveFocus = false) {
        const tabs = Array.from(document.querySelectorAll("[data-admin-tab]"));
        tabs.forEach(tab => {
            const selected = tab.dataset.adminTab === panelId;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
            const panel = document.getElementById(tab.dataset.adminTab);
            if (panel) panel.hidden = !selected;
            if (selected && moveFocus) tab.focus();
        });
    }

    function initialiseTabs() {
        const tabs = Array.from(document.querySelectorAll("[data-admin-tab]"));
        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => activateAdminTab(tab.dataset.adminTab));
            tab.addEventListener("keydown", event => {
                if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
                event.preventDefault();
                const available = tabs.filter(item => !item.hidden);
                const position = available.indexOf(tab);
                const offset = event.key === 'ArrowRight' ? 1 : -1;
                const next = available[(position + offset + available.length) % available.length];
                activateAdminTab(next.dataset.adminTab, true);
            });
        });
        document.querySelectorAll("[data-open-tab]").forEach(button => button.addEventListener("click", () => {
            activateAdminTab(button.dataset.openTab, true);
            document.querySelector('.admin-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));
        activateAdminTab("overviewPanel");
    }

    async function initialise() {
        initialiseTabs();
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

            const platformAdmin = await window.ServeUpProgress.isPlatformAdmin();
            const [report, learners, assignments, courses] = await Promise.all([
                window.ServeUpProgress.getManagerReport(),
                window.ServeUpProgress.getAdminLearners(),
                window.ServeUpProgress.getAdminAssignments(),
                platformAdmin ? window.ServeUpProgress.getAdminCourses() : Promise.resolve([])
            ]);
            managedCourses = courses;
            currentLearners = learners;
            accessMessage.hidden = true;
            content.hidden = false;
            currentReport = report;
            currentAssignments = assignments;
            populateReportCourses(report);
            renderReport(report);
            document.getElementById("learnerSearch").addEventListener("input", () => renderReport(currentReport));
            document.getElementById("progressCourseFilter").addEventListener("change", () => renderReport(currentReport));
            document.getElementById("exportReport").addEventListener("click", exportReport);
            populateLearners(learners);
            renderAssignments(assignments);
            renderFollowUp(assignments, report);
            document.getElementById("assignmentForm").addEventListener("submit", submitAssignment);
            if (platformAdmin) {
                ["platformCourseAdmin", "platformQuestionAdmin", "announcementAdmin"].forEach(id => {
                    const panel = document.getElementById(id);
                    if (panel) panel.hidden = false;
                });
                document.getElementById("contentTabButton").hidden = false;
                populateManagedCourses();
                populateQuestionCourses();
                await loadQuestions();
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
            }
        } catch (error) {
            console.error("Could not load the manager report.", error);
            accessMessage.textContent = "The report could not be loaded. Please try again.";
        }
    }

    function populateReportCourses(report) {
        const select = document.getElementById("progressCourseFilter");
        const ids = Array.from(new Set(report.map(item => item.course_id)));
        ids.sort((left, right) => (courseNames[left] || left).localeCompare(courseNames[right] || right));
        ids.forEach(id => {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = courseNames[id] || id;
            select.appendChild(option);
        });
    }

    function populateLearners(learners) {
        const select = document.getElementById("learnerSelect");
        select.innerHTML = "";
        learners.forEach(learner => {
            const option = document.createElement("option");
            option.value = learner.user_id;
            option.textContent = learner.display_name?.trim() ? learner.display_name + " · " + learner.email : learner.email;
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
        if (!window.confirm(t("Delete this question? This cannot be undone."))) return;
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
            appendCells(row, [learnerIdentity(item.email, item.user_id), courseNames[item.course_id] || item.course_id, item.due_date || "No deadline", isOverdue ? "Overdue" : "Due soon"], ["Learner", "Course", "Due date", "Follow-up"]);
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
            appendCells(row, [learnerIdentity(assignment.email, assignment.user_id), courseNames[assignment.course_id] || assignment.course_id, assignment.due_date ? new Date(assignment.due_date + "T00:00:00").toLocaleDateString() : "No deadline", overdue ? "Overdue" : "On schedule"], ["Learner", "Assigned course", "Due date", "Status"]);
            rows.appendChild(row);
        });
    }

    async function submitAssignment(event) {
        event.preventDefault();
        const status = document.getElementById("assignmentStatus");
        status.textContent = "Saving assignment…";
        try {
            await window.ServeUpProgress.assignCourse(document.getElementById("learnerSelect").value, document.getElementById("courseSelect").value, document.getElementById("dueDate").value);
            currentAssignments = await window.ServeUpProgress.getAdminAssignments();
            renderAssignments(currentAssignments);
            renderFollowUp(currentAssignments, currentReport);
            status.textContent = "Course assigned.";
        } catch (error) {
            console.error("Could not assign course.", error);
            status.textContent = "The assignment could not be saved.";
        }
    }

    function exportReport() {
        const rows = [[t("Learner"), "Email", t("Course"), t("Score"), t("Completed")]].concat(visibleReport.map(item => [learnerDisplayName(item.email, item.user_id), item.email, courseNames[item.course_id] || item.course_id, item.score, item.completed_at]));
        const csv = rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(",")).join("\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        link.download = "serveup-training-progress.csv";
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function renderReport(report) {
        const filter = document.getElementById("learnerSearch").value.trim().toLowerCase();
        const course = document.getElementById("progressCourseFilter").value;
        visibleReport = report
            .filter(item => (item.email + " " + learnerDisplayName(item.email, item.user_id)).toLowerCase().includes(filter))
            .filter(item => !course || item.course_id === course)
            .sort((left, right) => Date.parse(right.completed_at) - Date.parse(left.completed_at));
        const rows = document.getElementById("reportRows");
        rows.replaceChildren();
        const uniqueLearners = new Set(report.map(item => item.email));
        const average = report.length ? Math.round(report.reduce((total, item) => total + item.score, 0) / report.length) : 0;
        document.getElementById("completionCount").textContent = report.length;
        document.getElementById("learnerCount").textContent = uniqueLearners.size;
        document.getElementById("averageScore").textContent = average + "%";
        document.getElementById("resultCount").textContent = visibleReport.length + (visibleReport.length === 1 ? " result" : " results");
        document.getElementById("exportReport").disabled = visibleReport.length === 0;
        document.getElementById("emptyState").hidden = visibleReport.length > 0;
        if (!visibleReport.length) return;
        visibleReport.forEach(item => {
            const row = document.createElement("tr");
            appendCells(row, [learnerIdentity(item.email, item.user_id), courseNames[item.course_id] || item.course_id, item.score + "%", new Date(item.completed_at).toLocaleDateString()], ["Learner", "Course", "Score", "Completed"]);
            rows.appendChild(row);
        });
    }

    initialise();
}());
