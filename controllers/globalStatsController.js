import { getSupabaseClient } from "../utilities/db.js";

export const getGlobalStats = async (req, res) => {

    const supabase = getSupabaseClient(req);

    try {
        console.log("📡 Globale stats ophalen...");

        const { data, error } = await supabase.rpc("get_global_quiz_statistics");

        if (error) {
            console.error("❌ Supabase RPC error:", error);
            return res.status(500).json({ error: "Databasefout bij ophalen global stats" });
        }

        console.log("✅ Globale quiz statistieken opgehaald:", data);
        res.status(200).json(data);

    } catch (error) {
        console.error("❌ Onverwachte fout bij ophalen global stats:", error);
        res.status(500).json({ error: "Interne serverfout" });
    }
};
