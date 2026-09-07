const SUPABASE_URL = "https://wngljrvtoifrrsewcixx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-pK8oYgClXDfOfxUIzE8Xw_l-GRXcVV";

if (!window.supabase) {
    throw new Error("Supabase client library failed to load.");
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const courseIds = {
    customerServiceCompleted: "customer-service",
    foodSafetyCompleted: "food-safety",
    japaneseHospitalityCompleted: "japanese-hospitality",
    restaurantBasicsCompleted: "restaurant-basics"
};

window.ServeUpProgress = {
    client: supabaseClient,

    async getCurrentUser() {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) return null;
        return data.user;
    },

    async getCompletedCourses() {
        const user = await this.getCurrentUser();
        if (!user) return [];

        const { data, error } = await supabaseClient
            .from("course_progress")
            .select("course_id, score, completed_at")
            .order("completed_at", { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getMyRole() {
        const user = await this.getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabaseClient
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) throw error;
        return data ? data.role : "learner";
    },

    async getMyAssignments() {
        const user = await this.getCurrentUser();
        if (!user) return [];

        const { data, error } = await supabaseClient
            .from("course_assignments")
            .select("course_id, due_date")
            .order("due_date", { ascending: true, nullsFirst: false });

        if (error) throw error;
        return data || [];
    },

    async getAdminLearners() {
        const { data, error } = await supabaseClient.rpc("get_training_learners");
        if (error) throw error;
        return data || [];
    },

    async getAdminAssignments() {
        const { data, error } = await supabaseClient.rpc("get_training_assignments");
        if (error) throw error;
        return data || [];
    },

    async getTrainingGroups() { const { data, error } = await supabaseClient.rpc("get_training_groups"); if (error) throw error; return data || []; },
    async createTrainingGroup(name, description) { const { data, error } = await supabaseClient.rpc("create_training_group", { p_name: name, p_description: description }); if (error) throw error; return data; },
    async getTrainingGroupMembers(groupId) { const { data, error } = await supabaseClient.rpc("get_training_group_members", { p_group_id: groupId }); if (error) throw error; return data || []; },
    async addTrainingGroupMember(groupId, userId) { const { error } = await supabaseClient.rpc("add_training_group_member", { p_group_id: groupId, p_user_id: userId }); if (error) throw error; },
    async assignTrainingGroupCourse(groupId, courseId, dueDate) { const { data, error } = await supabaseClient.rpc("assign_training_group_course", { p_group_id: groupId, p_course_id: courseId, p_due_date: dueDate || null }); if (error) throw error; return data; },

    async getAdminCourses() {
        const { data, error } = await supabaseClient.rpc("get_admin_courses");
        if (error) throw error;
        return data || [];
    },

    async saveTrainingCourse(id, sortOrder, isActive, title, description) {
        const { error } = await supabaseClient.rpc("save_training_course", {
            p_id: id,
            p_sort_order: sortOrder,
            p_is_active: isActive,
            p_title: title,
            p_description: description
        });
        if (error) throw error;
    },

    async getAdminCourseQuestions(courseId) {
        const { data, error } = await supabaseClient.rpc("get_admin_course_questions", {
            p_course_id: courseId
        });
        if (error) throw error;
        return data || [];
    },

    async getPublishedQuizQuestions(storageKey) {
        const user = await this.getCurrentUser();
        const courseId = courseIds[storageKey];
        if (!user || !courseId) return [];

        const { data, error } = await supabaseClient
            .from("course_questions")
            .select("question_text, answers, correct_answer, explanation, sort_order")
            .eq("course_id", courseId)
            .eq("locale", "en")
            .order("sort_order", { ascending: true });

        if (error) throw error;
        return (data || []).map(question => ({
            question: question.question_text,
            answers: question.answers,
            correct: question.correct_answer,
            explanation: question.explanation || "",
            key: ""
        }));
    },

    async saveTrainingQuestion(id, courseId, questionText, answers, correctAnswer, explanation, sortOrder) {
        const { data, error } = await supabaseClient.rpc("save_training_question", {
            p_id: id,
            p_course_id: courseId,
            p_question_text: questionText,
            p_answers: answers,
            p_correct_answer: correctAnswer,
            p_explanation: explanation,
            p_sort_order: sortOrder
        });
        if (error) throw error;
        return data;
    },

    async deleteTrainingQuestion(id, courseId) {
        const { error } = await supabaseClient.rpc("delete_training_question", {
            p_id: id,
            p_course_id: courseId
        });
        if (error) throw error;
    },

    async assignCourse(userId, courseId, dueDate) {
        const { error } = await supabaseClient.rpc("assign_training_course", {
            p_user_id: userId,
            p_course_id: courseId,
            p_due_date: dueDate || null
        });
        if (error) throw error;
    },

    async getManagerReport() {
        const { data, error } = await supabaseClient.rpc("get_training_report");
        if (error) throw error;
        return data || [];
    },

    async recordAttempt(storageKey, score) {
        const user = await this.getCurrentUser();
        const courseId = courseIds[storageKey];
        if (!user || !courseId) return false;

        const { error } = await supabaseClient.from("training_attempts").insert({
            user_id: user.id,
            course_id: courseId,
            score,
            passed: score >= 80
        });
        if (error) throw error;
        return true;
    },

    async saveCompletion(storageKey, score) {
        const user = await this.getCurrentUser();
        const courseId = courseIds[storageKey];

        if (!user || !courseId) return false;

        const now = new Date().toISOString();
        const { error } = await supabaseClient
            .from("course_progress")
            .upsert({
                user_id: user.id,
                course_id: courseId,
                score,
                completed_at: now,
                updated_at: now
            }, { onConflict: "user_id,course_id" });

        if (error) throw error;
        return true;
    }
};
