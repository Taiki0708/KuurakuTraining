(function () {
    "use strict";

    const translations = {
        en: {
            introKicker: "Learn. Practice. Grow.", introTitle: "Build confidence for every shift.", introCopy: "Short, practical restaurant training you can complete at your own pace.",
            benefitOne: "8 practical courses", benefitTwo: "Progress saved securely", benefitThree: "Learn in 3 languages", backHome: "← Back to home", language: "Language",
            signInTab: "Sign in", signUpTab: "Create account", signInTitle: "Welcome back", signInLead: "Sign in to continue your training.", signUpTitle: "Create your account", signUpLead: "Enter your email and choose a password. It only takes a minute.",
            emailLabel: "Email address", passwordLabel: "Password", passwordHint: "At least 6 characters", passwordGuidance: "Use 6 or more characters. Avoid passwords you use elsewhere.", confirmPasswordLabel: "Confirm password", showPassword: "Show", hidePassword: "Hide",
            signInButton: "Sign in", signUpButton: "Create account", signingIn: "Signing in…", creatingAccount: "Creating account…", securityNote: "Your account is protected by Supabase authentication. We never display your password.",
            confirmationTitle: "Check your email", confirmationCopy: "We sent a confirmation link to:", confirmationHelp: "Open the link in the email, then return here and sign in. Check your spam folder if it does not arrive.", returnToSignIn: "Return to sign in", resend: "Resend confirmation email", resendWait: seconds => `Resend in ${seconds}s`,
            passwordsDoNotMatch: "The passwords do not match.", invalidCredentials: "The email or password is incorrect.", emailNotConfirmed: "Please confirm your email before signing in.", weakPassword: "Choose a stronger password with at least 6 characters.", signupDisabled: "New account creation is currently unavailable.", alreadyRegistered: "An account may already exist for this email. Try signing in instead.",
            waitBeforeRetry: seconds => `Please wait ${seconds} seconds before trying again.`, retryIn: seconds => `Try again in ${seconds}s`, emailLimit: "Too many confirmation emails have been requested. Please wait and try again later.", genericError: "Something went wrong. Please try again.", resendSuccess: "A new confirmation email was sent."
        },
        ja: {
            introKicker: "学ぶ・練習する・成長する", introTitle: "毎日の仕事に、自信を。", introCopy: "飲食店で役立つ実践的な研修を、自分のペースで学べます。",
            benefitOne: "8つの実践コース", benefitTwo: "進捗を安全に保存", benefitThree: "3言語で学習", backHome: "← ホームへ戻る", language: "言語",
            signInTab: "ログイン", signUpTab: "アカウント作成", signInTitle: "おかえりなさい", signInLead: "ログインして学習を続けましょう。", signUpTitle: "アカウントを作成", signUpLead: "メールアドレスとパスワードを入力するだけで始められます。",
            emailLabel: "メールアドレス", passwordLabel: "パスワード", passwordHint: "6文字以上", passwordGuidance: "6文字以上で、他のサービスとは違うパスワードをおすすめします。", confirmPasswordLabel: "パスワードを再入力", showPassword: "表示", hidePassword: "隠す",
            signInButton: "ログイン", signUpButton: "アカウントを作成", signingIn: "ログイン中…", creatingAccount: "アカウントを作成中…", securityNote: "アカウントはSupabase認証で保護されています。パスワードが画面に公開されることはありません。",
            confirmationTitle: "メールを確認してください", confirmationCopy: "確認リンクを次のアドレスへ送りました：", confirmationHelp: "メール内のリンクを開いたあと、この画面へ戻ってログインしてください。届かない場合は迷惑メールフォルダも確認してください。", returnToSignIn: "ログイン画面へ戻る", resend: "確認メールを再送する", resendWait: seconds => `${seconds}秒後に再送できます`,
            passwordsDoNotMatch: "パスワードが一致していません。", invalidCredentials: "メールアドレスまたはパスワードが違います。", emailNotConfirmed: "先に確認メール内のリンクを開いてください。", weakPassword: "6文字以上の、より安全なパスワードを設定してください。", signupDisabled: "現在、新しいアカウントを作成できません。", alreadyRegistered: "このメールアドレスは登録済みの可能性があります。ログインをお試しください。",
            waitBeforeRetry: seconds => `あと${seconds}秒待ってから、もう一度お試しください。`, retryIn: seconds => `あと${seconds}秒で再試行できます`, emailLimit: "確認メールの送信上限に達しました。時間をおいてから、もう一度お試しください。", genericError: "処理に失敗しました。もう一度お試しください。", resendSuccess: "新しい確認メールを送信しました。"
        },
        hi: {
            introKicker: "सीखें। अभ्यास करें। आगे बढ़ें।", introTitle: "हर शिफ्ट के लिए आत्मविश्वास बनाएँ।", introCopy: "छोटा और व्यावहारिक रेस्तरां प्रशिक्षण, जिसे आप अपनी गति से पूरा कर सकते हैं।",
            benefitOne: "8 व्यावहारिक कोर्स", benefitTwo: "प्रगति सुरक्षित रूप से सेव", benefitThree: "3 भाषाओं में सीखें", backHome: "← होम पर वापस जाएँ", language: "भाषा",
            signInTab: "साइन इन", signUpTab: "खाता बनाएँ", signInTitle: "वापसी पर स्वागत है", signInLead: "अपना प्रशिक्षण जारी रखने के लिए साइन इन करें।", signUpTitle: "अपना खाता बनाएँ", signUpLead: "ईमेल और पासवर्ड डालें। इसमें केवल एक मिनट लगता है।",
            emailLabel: "ईमेल पता", passwordLabel: "पासवर्ड", passwordHint: "कम से कम 6 अक्षर", passwordGuidance: "6 या अधिक अक्षर रखें और किसी दूसरे खाते वाला पासवर्ड इस्तेमाल न करें।", confirmPasswordLabel: "पासवर्ड दोबारा लिखें", showPassword: "दिखाएँ", hidePassword: "छिपाएँ",
            signInButton: "साइन इन", signUpButton: "खाता बनाएँ", signingIn: "साइन इन हो रहा है…", creatingAccount: "खाता बनाया जा रहा है…", securityNote: "आपका खाता Supabase प्रमाणीकरण से सुरक्षित है। हम आपका पासवर्ड कभी प्रदर्शित नहीं करते।",
            confirmationTitle: "अपना ईमेल देखें", confirmationCopy: "हमने पुष्टि लिंक यहाँ भेजा है:", confirmationHelp: "ईमेल में लिंक खोलें, फिर यहाँ लौटकर साइन इन करें। ईमेल न मिले तो स्पैम फ़ोल्डर देखें।", returnToSignIn: "साइन इन पर वापस जाएँ", resend: "पुष्टि ईमेल फिर भेजें", resendWait: seconds => `${seconds} सेकंड बाद फिर भेजें`,
            passwordsDoNotMatch: "दोनों पासवर्ड मेल नहीं खाते।", invalidCredentials: "ईमेल या पासवर्ड सही नहीं है।", emailNotConfirmed: "साइन इन से पहले अपना ईमेल पुष्टि करें।", weakPassword: "कम से कम 6 अक्षर वाला अधिक सुरक्षित पासवर्ड चुनें।", signupDisabled: "अभी नया खाता बनाना उपलब्ध नहीं है।", alreadyRegistered: "इस ईमेल का खाता पहले से हो सकता है। साइन इन करके देखें।",
            waitBeforeRetry: seconds => `फिर प्रयास करने से पहले ${seconds} सेकंड प्रतीक्षा करें।`, retryIn: seconds => `${seconds} सेकंड बाद फिर प्रयास करें`, emailLimit: "बहुत अधिक पुष्टि ईमेल माँगे गए हैं। कुछ समय बाद फिर प्रयास करें।", genericError: "कुछ गलत हुआ। फिर प्रयास करें।", resendSuccess: "नया पुष्टि ईमेल भेज दिया गया है।"
        }
    };

    const form = document.getElementById("authForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const confirmPasswordField = document.getElementById("confirmPasswordField");
    const passwordHint = document.getElementById("passwordHint");
    const passwordGuidance = document.getElementById("passwordGuidance");
    const signInModeButton = document.getElementById("signInModeButton");
    const signUpModeButton = document.getElementById("signUpButton");
    const submitButton = document.getElementById("submitButton");
    const submitButtonText = document.getElementById("submitButtonText");
    const message = document.getElementById("message");
    const languageSelect = document.getElementById("authLanguage");
    const authPanel = document.getElementById("authPanel");
    const confirmationPanel = document.getElementById("confirmationPanel");
    const confirmationEmail = document.getElementById("confirmationEmail");
    const resendButton = document.getElementById("resendButton");
    const resendMessage = document.getElementById("resendMessage");
    const environment = window.ServeUpEnvironment || { isStaging: false, route: path => path };
    const params = new URLSearchParams(window.location.search);
    const requestedReturn = params.get("returnTo");
    const returnPage = ["v1.html", "v1-admin.html"].includes(requestedReturn) ? requestedReturn : (environment.isStaging ? "v1.html" : "index.html");

    let mode = params.get("mode") === "signup" && !environment.isStaging ? "signup" : "signin";
    let busy = false;
    let lastSignupEmail = "";
    let cooldownTimer = null;
    let submitCooldownTimer = null;
    let submitCooldownEndsAt = 0;

    function locale() {
        return translations[languageSelect.value] ? languageSelect.value : "en";
    }

    function t(key, value) {
        const translated = translations[locale()][key];
        return typeof translated === "function" ? translated(value) : translated;
    }

    function applyLanguage() {
        localStorage.setItem("serveupLanguage", locale());
        document.documentElement.lang = locale();
        document.querySelectorAll("[data-auth-i18n]").forEach(element => {
            const translated = t(element.dataset.authI18n);
            if (translated) element.textContent = translated;
        });
        document.getElementById("formHeading").textContent = t(mode === "signup" ? "signUpTitle" : "signInTitle");
        document.getElementById("formLead").textContent = t(mode === "signup" ? "signUpLead" : "signInLead");
        if (!busy && submitCooldownEndsAt <= Date.now()) submitButtonText.textContent = t(mode === "signup" ? "signUpButton" : "signInButton");
        document.getElementById("passwordToggle").textContent = t(passwordInput.type === "password" ? "showPassword" : "hidePassword");
        if (confirmationPanel.hidden === false) updateCooldownLabel();
    }

    function showMessage(target, content, type) {
        target.textContent = content || "";
        target.className = `message${type ? ` ${type}` : ""}`;
    }

    function setBusy(value) {
        busy = value;
        submitButton.disabled = value || submitCooldownEndsAt > Date.now();
        signInModeButton.disabled = value;
        signUpModeButton.disabled = value;
        submitButton.dataset.loading = String(value);
        if (value) {
            submitButtonText.textContent = t(mode === "signup" ? "creatingAccount" : "signingIn");
        } else if (submitCooldownEndsAt > Date.now()) {
            updateSubmitCooldown();
        } else {
            submitButtonText.textContent = t(mode === "signup" ? "signUpButton" : "signInButton");
        }
    }

    function setMode(nextMode) {
        if (busy || (nextMode === "signup" && environment.isStaging)) return;
        mode = nextMode;
        const signingUp = mode === "signup";
        signInModeButton.setAttribute("aria-selected", String(!signingUp));
        signUpModeButton.setAttribute("aria-selected", String(signingUp));
        [confirmPasswordField, passwordHint, passwordGuidance].forEach(element => { element.hidden = !signingUp; });
        confirmPasswordInput.required = signingUp;
        passwordInput.autocomplete = signingUp ? "new-password" : "current-password";
        confirmPasswordInput.value = "";
        confirmPasswordInput.setCustomValidity("");
        showMessage(message, "", "");
        applyLanguage();
    }

    function secondsFromError(error) {
        const match = String(error?.message || "").match(/(?:after|in)\s+(\d+)\s+seconds?/i);
        return match ? Math.max(1, Number(match[1])) : 60;
    }

    function isShortRateLimit(error) {
        return error?.status === 429 && /after|seconds?|security purposes/i.test(String(error.message || ""));
    }

    function friendlyError(error) {
        const code = error?.code || "";
        if (isShortRateLimit(error)) return t("waitBeforeRetry", secondsFromError(error));
        if (code === "over_email_send_rate_limit" || error?.status === 429) return t("emailLimit");
        if (code === "invalid_credentials") return t("invalidCredentials");
        if (code === "email_not_confirmed") return t("emailNotConfirmed");
        if (code === "weak_password") return t("weakPassword");
        if (code === "signup_disabled") return t("signupDisabled");
        if (code === "user_already_exists") return t("alreadyRegistered");
        return t("genericError");
    }

    function validateForm() {
        emailInput.value = emailInput.value.trim();
        emailInput.setAttribute("aria-invalid", "false");
        passwordInput.setAttribute("aria-invalid", "false");
        confirmPasswordInput.setAttribute("aria-invalid", "false");
        confirmPasswordInput.setCustomValidity("");

        if (mode === "signup" && passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity(t("passwordsDoNotMatch"));
            confirmPasswordInput.setAttribute("aria-invalid", "true");
        }
        const valid = form.reportValidity();
        if (!valid && mode === "signup" && passwordInput.value !== confirmPasswordInput.value) {
            showMessage(message, t("passwordsDoNotMatch"), "error");
        }
        return valid;
    }

    function showConfirmation(email) {
        lastSignupEmail = email;
        confirmationEmail.textContent = email;
        authPanel.hidden = true;
        confirmationPanel.hidden = false;
        showMessage(resendMessage, "", "");
        startCooldown(60);
    }

    let cooldownEndsAt = 0;
    function updateCooldownLabel() {
        const remaining = Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
        resendButton.disabled = remaining > 0;
        resendButton.textContent = remaining > 0 ? t("resendWait", remaining) : t("resend");
        if (remaining === 0 && cooldownTimer) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
        }
    }

    function startCooldown(seconds) {
        if (cooldownTimer) clearInterval(cooldownTimer);
        cooldownEndsAt = Date.now() + seconds * 1000;
        updateCooldownLabel();
        cooldownTimer = window.setInterval(updateCooldownLabel, 500);
    }

    function updateSubmitCooldown() {
        const remaining = Math.max(0, Math.ceil((submitCooldownEndsAt - Date.now()) / 1000));
        if (remaining > 0) {
            submitButton.disabled = true;
            submitButtonText.textContent = t("retryIn", remaining);
            return;
        }
        if (submitCooldownTimer) clearInterval(submitCooldownTimer);
        submitCooldownTimer = null;
        if (!busy) {
            submitButton.disabled = false;
            submitButtonText.textContent = t(mode === "signup" ? "signUpButton" : "signInButton");
        }
    }

    function startSubmitCooldown(seconds) {
        if (submitCooldownTimer) clearInterval(submitCooldownTimer);
        submitCooldownEndsAt = Date.now() + seconds * 1000;
        updateSubmitCooldown();
        submitCooldownTimer = window.setInterval(updateSubmitCooldown, 500);
    }

    async function signIn(email, password) {
        const { error } = await window.ServeUpProgress.client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = environment.route(returnPage);
    }

    async function signUp(email, password) {
        const { data, error } = await window.ServeUpProgress.client.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
            window.location.href = environment.route(returnPage);
            return;
        }
        showConfirmation(email);
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (busy || !validateForm()) return;
        showMessage(message, "", "");
        setBusy(true);
        try {
            if (mode === "signup") await signUp(emailInput.value, passwordInput.value);
            else await signIn(emailInput.value, passwordInput.value);
        } catch (error) {
            showMessage(message, friendlyError(error), "error");
            if (isShortRateLimit(error)) startSubmitCooldown(secondsFromError(error));
        } finally {
            setBusy(false);
        }
    });

    signInModeButton.addEventListener("click", () => setMode("signin"));
    signUpModeButton.addEventListener("click", () => setMode("signup"));
    languageSelect.addEventListener("change", () => {
        showMessage(message, "", "");
        showMessage(resendMessage, "", "");
        applyLanguage();
    });
    document.getElementById("passwordToggle").addEventListener("click", () => {
        passwordInput.type = passwordInput.type === "password" ? "text" : "password";
        applyLanguage();
        passwordInput.focus();
    });
    document.getElementById("returnToSignIn").addEventListener("click", () => {
        confirmationPanel.hidden = true;
        authPanel.hidden = false;
        passwordInput.value = "";
        setMode("signin");
        emailInput.focus();
    });
    resendButton.addEventListener("click", async () => {
        if (resendButton.disabled || !lastSignupEmail) return;
        resendButton.disabled = true;
        showMessage(resendMessage, "", "");
        try {
            const { error } = await window.ServeUpProgress.client.auth.resend({ type: "signup", email: lastSignupEmail });
            if (error) throw error;
            showMessage(resendMessage, t("resendSuccess"), "success");
            startCooldown(60);
        } catch (error) {
            showMessage(resendMessage, friendlyError(error), "error");
            startCooldown(isShortRateLimit(error) ? secondsFromError(error) : 60);
        }
    });

    if (environment.isStaging) {
        signUpModeButton.hidden = true;
        signUpModeButton.parentElement.style.gridTemplateColumns = "1fr";
    }
    languageSelect.value = translations[localStorage.getItem("serveupLanguage")] ? localStorage.getItem("serveupLanguage") : "en";
    setMode(mode);
}());
