import { getSupabaseClient } from "../utilities/db.js";

export const getTeacherStats = async (req, res) => {

    const supabase = getSupabaseClient(req);

    try {
        console.log("📡 Teacher stats ophalen...");
        const { user } = req;

        if (!user || !user.id) {
            console.error("❌ Geen geldige gebruiker");
            return res.status(400).json({ error: "Geen geldige gebruiker" });
        }

        console.log("🔍 Teacher ID:", user.id);

        const { data, error } = await supabase.rpc("get_teacher_quiz_statistics", { teacher_id: user.id });

        if (error) {
            console.error("❌ Supabase RPC error:", error);
            return res.status(500).json({ error: error.message });
        }

        console.log("✅ Teacher quiz statistieken opgehaald:", data); // 🔥 Belangrijke debug
        res.status(200).json(data);

    } catch (error) {
        console.error("❌ Onverwachte fout bij ophalen teacher stats:", error);
        res.status(500).json({ error: "Interne serverfout" });
    }
};
