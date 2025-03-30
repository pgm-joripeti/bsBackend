import { getSupabaseClient } from "../utilities/db.js";

export const createQuiz = async (req, res) => {
    const supabase = getSupabaseClient(req);
    const { title, difficulty, grade_id, questions, subject_id, program_ids } = req.body;
    const user = req.user;

    // ✅ Check of gebruiker leerkracht is
    const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile.role !== "leerkracht") {
        return res.status(403).json({ error: "Toegang geweigerd" });
    }

    // Check verplichte velden
    if (!title || !difficulty || !grade_id || !subject_id || !Array.isArray(program_ids) || program_ids.length === 0) {
        return res.status(400).json({ error: "Gelieve alle velden correct in te vullen." });
    }

    // ✅ Quiz aanmaken
    const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert([{
      teacher_id: user.id,
      title,
      difficulty,
      grade_id,
      subject_id
    }])
    .select()
    .single();

    console.log("❌ Quiz insert error:", quizError);
    if (quizError) return res.status(500).json({ error: quizError.message });

    // ❗ Beveiliging: max 20 program_ids toegestaan
    if (program_ids.length === 0 || program_ids.length > 20) {
        console.log("🚫 Ongeldige program_ids:", program_ids);
        return res.status(400).json({ error: "Je moet minstens 1 en maximaal 20 richtingen kiezen." });
    }

    // ✅ Richtingen koppelen (via program_quiz)
    const programQuizInserts = program_ids.map(program_id => ({
        quiz_id: quiz.id,
        program_id
    }));
        const { error: linkError } = await supabase
            .from("program_quiz")
            .insert(programQuizInserts);

    if (linkError) {
        console.error("🚨 Supabase program_quiz insert error:", linkError);
        return res.status(500).json({ error: linkError.message });
        }

    // ✅ Vragen toevoegen
    for (let question of questions) {
        const {
            question_text,
            type,
            options,
            correct_answers,
            time_limit,
            snippet_type,
            snippet_value,
            image_url
        } = question;

        const vraagData = {
            quiz_id: quiz.id,
            question_text,
            type,
            options,
            correct_answers,
            time_limit,
        };

        if (snippet_type === "image" && image_url) {
            vraagData.snippet_type = "image";
            vraagData.image_url = image_url;
        } else if (snippet_type && snippet_value) {
            vraagData.snippet_type = snippet_type;
            vraagData.snippet_value = snippet_value;
        }

        const { error: vraagError } = await supabase
        .from("questions")
        .insert([vraagData]);

        if (vraagError) {
            console.error("🚨 Supabase question insert error:", vraagError);
            return res.status(500).json({ error: vraagError.message });
        }
    }

    console.log("🔎 USER:", user);
    console.log("🧠 Ontvangen body:", req.body);
    console.log("❌ Quiz insert error:", quizError);
    console.log("🚫 Ongeldige program_ids:", program_ids);

    res.status(201).json({ message: "Quiz aangemaakt!" });
};
