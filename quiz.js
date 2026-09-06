(function () {
    "use strict";

    function byId(id) {
        return document.getElementById(id);
    }

    function setText(id, text) {
        const element = byId(id);
        if (element) element.textContent = text;
    }

    window.ServeUpQuiz = {
        init(config) {
            const state = { current: 0, score: 0, answered: false };
            const questions = config.questions;
            const getAnswers = question => question.answers || question.options;
            const getCorrect = question => question.correct ?? question.answer;
            const answerContainer = byId(config.answerContainerId);
            const nextButton = byId(config.nextButtonId);
            const feedback = byId("feedback");

            function showQuestion() {
                state.answered = false;
                const question = questions[state.current];
                const answers = getAnswers(question);

                setText("progress", "Question " + (state.current + 1) + " / " + questions.length);
                setText("question", question.question);
                answerContainer.innerHTML = "";
                if (feedback) feedback.style.display = "none";
                nextButton.style.display = "none";
                nextButton.textContent = config.nextLabel || "Next →";

                answers.forEach((answer, index) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = config.optionClass;
                    button.textContent = String.fromCharCode(65 + index) + ". " + answer;
                    button.addEventListener("click", () => selectAnswer(index, button));
                    answerContainer.appendChild(button);
                });
            }

            function showFeedback(question, selected, button) {
                const correct = getCorrect(question);
                const buttons = answerContainer.querySelectorAll("button");

                buttons.forEach(item => { item.disabled = true; });
                if (selected === correct) {
                    state.score++;
                    button.classList.add("correct");
                } else {
                    button.classList.add(config.incorrectClass || "incorrect");
                    buttons[correct].classList.add("correct");
                }

                if (config.feedbackMode === "detailed") {
                    feedback.className = "feedback " + (selected === correct ? "correct" : "incorrect");
                    setText("feedbackIcon", selected === correct ? "✓" : "×");
                    setText("feedbackTitle", selected === correct ? "Correct" : "Not quite");
                    setText("correctAnswer", "The correct answer is " + String.fromCharCode(65 + correct) + ". " + getAnswers(question)[correct]);
                    setText("explanation", question.explanation);
                } else if (config.feedbackMode === "keypoint") {
                    const title = byId("feedbackTitle");
                    title.innerHTML = selected === correct
                        ? '<span class="feedback-icon correct">✓</span> Correct!'
                        : '<span class="feedback-icon wrong">✕</span> Not quite.';
                    setText("feedbackText", question.explanation);
                    setText("keyPoint", "Key point: " + question.key);
                } else {
                    const outcome = selected === correct
                        ? '<div class="feedback-title"><span class="feedback-icon correct">✓</span> Correct!</div><div>'
                        : '<div class="feedback-title"><span class="feedback-icon wrong">✕</span> Not quite.</div><div>The correct answer is <strong>' + String.fromCharCode(65 + correct) + '</strong>.<br><br>';
                    feedback.innerHTML = outcome + question.explanation + "</div>";
                }

                feedback.style.display = "block";
                nextButton.textContent = state.current === questions.length - 1
                    ? (config.resultsLabel || "See Results →")
                    : (config.nextLabel || "Next →");
                nextButton.style.display = "block";
            }

            function selectAnswer(selected, button) {
                if (state.answered) return;
                state.answered = true;
                showFeedback(questions[state.current], selected, button);
            }

            function showResult() {
                const percentage = Math.round((state.score / questions.length) * 100);
                const passed = percentage >= (config.passScore || 80);
                byId(config.quizId).style.display = "none";
                byId(config.resultId).style.display = "block";
                setText("score", percentage + "%");

                if (passed) {
                    localStorage.setItem(config.storageKey, "true");

                    if (window.ServeUpProgress) {
                        window.ServeUpProgress
                            .saveCompletion(config.storageKey, percentage)
                            .catch(error => console.error("Could not save training progress.", error));
                    }
                }

                if (config.resultMode === "restaurant") {
                    setText("resultTitle", passed ? "Training Complete!" : "Keep practicing!");
                    const status = byId("resultStatus");
                    status.textContent = passed ? "Passed ✓" : "Not Passed ×";
                    status.className = "result-status " + (passed ? "passed" : "not-passed");
                    setText("resultMessage", "You answered " + state.score + " out of " + questions.length + " questions correctly. " + (passed ? "Great job!" : "You need 80% or higher to pass."));
                } else if (config.resultMode === "customer") {
                    setText("resultTitle", passed ? "Well done! ✓" : "Keep practicing!");
                    setText("resultMessage", passed
                        ? "Passed! You answered " + state.score + " out of " + questions.length + " questions correctly. Keep using these customer service principles in your daily work."
                        : "Not passed yet. You answered " + state.score + " out of " + questions.length + " questions correctly. Review the customer service principles and try again. You need 80% or higher to pass.");
                } else {
                    setText("resultTitle", passed ? "Well done! ✓" : "Keep practicing!");
                    setText("resultText", "You answered " + state.score + " out of " + questions.length + " questions correctly.");
                    setText("statusTitle", passed ? "Passed!" : "Not passed yet.");
                    setText("statusText", passed
                        ? "You have successfully completed the " + config.courseName + " Training. Keep practicing these " + config.courseName.toLowerCase() + " principles in your daily work."
                        : "Review the " + config.courseName.toLowerCase() + " principles and try again. You need 80% or higher to pass.");
                }
            }

            function nextQuestion() {
                if (!state.answered) return;
                state.current++;
                if (state.current < questions.length) {
                    showQuestion();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                    showResult();
                }
            }

            function restartQuiz() {
                state.current = 0;
                state.score = 0;
                state.answered = false;
                byId(config.resultId).style.display = "none";
                byId(config.quizId).style.display = "block";
                showQuestion();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }

            nextButton.addEventListener("click", nextQuestion);
            window.nextQuestion = nextQuestion;
            window.restartQuiz = restartQuiz;
            showQuestion();
        }
    };
}());
