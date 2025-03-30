import { getSupabaseClient } from "../utilities/db.js";

export const getTeacherLeaderboard = async (req, res) => {
    const { user } = req;

    const supabase = getSupabaseClient(req);

    // ✅ Haal alle teachers op met totaal aantal attempts op hun quizzes
    const { data: leaderboard, error } = await supabase
        .from("users")
        .select("nickname, school_id, avatar_url, league_id, quizzes(id), quiz_results!inner(quiz_id)")
        .eq("role", "leerkracht")
        .order("quiz_results.count", { ascending: false })
        .limit(10);

    if (error) return res.status(500).json({ error: error.message });

    res.status(200).json(leaderboard);
};
