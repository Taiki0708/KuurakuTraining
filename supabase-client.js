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

    async getManagerReport() {
        const { data, error } = await supabaseClient.rpc("get_training_report");
        if (error) throw error;
        return data || [];
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
