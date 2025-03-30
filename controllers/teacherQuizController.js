// import { createClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../utilities/db.js";

// 🔹 Haal alle quizzen van de leerkracht op
export const getTeacherQuizzes = async (req, res) => {

    const supabase = getSupabaseClient(req);

    const { user } = req;

    // Controleer of de gebruiker een leerkracht is
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile.role !== "leerkracht") {
        return res.status(403).json({ error: "Toegang geweigerd" });
    }

    // Haal quizzen op die door deze leerkracht zijn aangemaakt
    const { data: quizzes, error: quizError } = await supabase
        .from("quizzes")
        .select("id, titel, moeilijkheidsgraad, richting, graad, created_at")
        .eq("leerkracht_id", user.id)
        .order("created_at", { ascending: false });

    if (quizError) return res.status(500).json({ error: quizError.message });

    res.status(200).json(quizzes);
};

// 🔹 Verwijder een quiz (alleen als deze nog niet gespeeld is)
export const deleteQuiz = async (req, res) => {

    const supabase = getSupabaseClient(req);
    
    const { quizId } = req.params;
    const { user } = req;

    // Controleer of er quizresultaten zijn
    const { data: results, error: resultError } = await supabase
        .from("quiz_results")
        .select("id")
        .eq("quiz_id", quizId);

    if (resultError) return res.status(500).json({ error: resultError.message });

    if (results.length > 0) {
        return res.status(400).json({ error: "Quiz kan niet verwijderd worden, er zijn al resultaten." });
    }

    // Verwijder de quiz
    const { error: deleteError } = await supabase.from("quizzes").delete().eq("id", quizId);

    if (deleteError) return res.status(500).json({ error: deleteError.message });

    res.status(200).json({ message: "Quiz succesvol verwijderd" });
};
