// import { createClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../utilities/db.js"

// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export const getQuizzesForStudent = async (req, res) => {
    // console.log("🔍 DEBUG: Ontvangen gebruiker:", req.user);

    const supabase = getSupabaseClient(req);

    const student_id = req.user.id;

    try {
        // ✅ Zoek de richting en graad van de student op
        const { data: studentData, error: studentError } = await supabase
            .from("users")
            .select("program_id, grade_id") // ✅ Fix: Correcte select
            .eq("id", student_id)
            .single();

        if (studentError || !studentData) {
            console.error("❌ Student niet gevonden:", studentError);
            return res.status(400).json({ error: "Leerling niet gevonden." });
        }

        const program_id = studentData.program_id;
        const grade_id = studentData.grade_id;

        // console.log("✅ DEBUG: Opgehaalde student data:", studentData);
        // console.log("✅ DEBUG: Program ID:", program_id, " | Grade ID:", grade_id);
        // console.log("✅ Type program_id:", typeof program_id, " | Type grade_id:", typeof grade_id);


        if (!program_id || !grade_id) {
            return res.status(400).json({ error: "Program ID of Grade ID is ongeldig." });
        }

        // Haal quiz-ids op uit junction tabel voor deze richting
        const { data: programQuizzes, error: programQuizError } = await supabase
            .from("program_quiz")
            .select("quiz_id")
            .eq("program_id", program_id);

        if (programQuizError || !programQuizzes.length) {
            console.warn("⚠️ Geen quizzen gekoppeld aan deze richting:", programQuizError);
            return res.status(200).json([]);
        }

        const quizIds = programQuizzes.map(pq => pq.quiz_id);


        // ✅ Zoek alle quizzes voor die richting én graad
        const { data: quizzes, error: quizError } = await supabase
            .from("quizzes")
            .select("id, title, difficulty, subject:subjects(subject_name), grade_id")
            .in("id", quizIds)
            .eq("grade_id", grade_id);

        if (quizError) {
            console.error("❌ Fout bij ophalen quizzes:", quizError);
            return res.status(400).json({ error: quizError.message });
        }

        // ✅ Als er geen quizzes zijn, stuur een lege array terug in plaats van een error
        if (!quizzes || quizzes.length === 0) {
            console.warn("⚠️ Geen quizzen gevonden voor deze student.");
            return res.status(200).json([]); // ✅ Stuur een lege array ipv een fout
        }

        // console.log("✅ DEBUG: Opgehaalde quizzes:", quizzes);
        res.status(200).json(quizzes);

    } catch (err) {
        console.error("❌ Interne serverfout:", err);
        res.status(500).json({ error: "Interne serverfout" });
    }
};

export const getTeacherQuizzes = async (req, res) => {
    const { user } = req;

    const supabase = getSupabaseClient(req);

    // Controleer of de gebruiker een leerkracht is
    const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || profile.role !== "leerkracht") {
        return res.status(403).json({ error: "Toegang geweigerd" });
    }

    // Haal quizzen op die door deze leerkracht zijn aangemaakt
    const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select(`
        id, 
        title, 
        difficulty, 
        created_at, 
        subject:subjects(subject_name), 
        program:programs(program_name), 
        grade:grades(grade_name)
    `)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

    if (quizError) {
        console.error("❌ Fout bij ophalen quizzen:", quizError.message);
        return res.status(500).json({ error: "Kon quizzen niet ophalen." });
    }

    res.status(200).json(quizzes);
};

// export const createQuiz = async (req, res) => {
//     const { user } = req;
//     const { title, subject_id, difficulty, program_id, grade_id, questions } = req.body;

//     const supabase = getSupabaseClient(req);

//     if (!title || !subject_id || !difficulty || !program_id || !grade_id || questions.length !== 10) {
//         return res.status(400).json({ error: "Alle velden en precies 10 vragen zijn verplicht." });
//     }

//     try {
//         // ✅ Quiz opslaan in de database
//         const { data: quiz, error: quizError } = await supabase
//             .from("quizzes")
//             .insert([{ teacher_id: user.id, title, subject_id, difficulty, program_id, grade_id }])
//             .select()
//             .single();

//         if (quizError) throw quizError;

//         // ✅ Vragen opslaan
//         const vragenData = questions.map(q => ({
//             quiz_id: quiz.id,
//             question_text: q.question_text,
//             type: q.type,
//             options: q.options ? q.options : null,
//             correct_answers: `{${q.correct_answers.map(ans => `"${ans}"`).join(",")}}`, // ✅ PostgreSQL formaat: {“antwoord1”, “antwoord2”} ipv [] json array
//             time_limit: q.time_limit,
//             image_url: q.image_url || null, 
//             snippet_type: q.snippet_type || null, 
//             snippet_value: q.snippet_value || null 
//         }));

//         const { error: vragenError } = await supabase.from("questions").insert(vragenData);

//         if (vragenError) throw vragenError;

//         res.status(201).json({ message: "Quiz succesvol aangemaakt!" });
//     } catch (err) {
//         console.error("❌ Fout bij aanmaken quiz:", err);
//         res.status(500).json({ error: "Er is een fout opgetreden bij het opslaan van de quiz." });
//     }
// };

// 🔹 Vragen van een quiz ophalen
export const getQuizQuestions = async (req, res) => {
    // console.log("✅ Debug: Headers ontvangen in backend:", req.headers);

    const { authorization } = req.headers;

    const supabase = getSupabaseClient(req);

    if (!authorization) {
        console.error("❌ Geen autorisatieheader ontvangen!");
        return res.status(401).json({ error: "⚠️ Geen autorisatieheader ontvangen" });
    }

    // console.log("✅ Ontvangen Authorization-header:", authorization);

    const { quizId } = req.params;

    try {
        console.log(`🔍 Ophalen vragen voor quiz: ${quizId}`);

        const { data: questions, error } = await supabase
            .from("questions")
            .select("id, question_text, type, options, correct_answers, time_limit, snippet_type, snippet_value, image_url")
            .eq("quiz_id", quizId)
            .order("id", { ascending: true });

        if (error) {
            console.error("❌ Fout bij ophalen vragen:", error);
            return res.status(500).json({ error: error.message });
        }

        if (!questions || questions.length === 0) {
            console.warn("⚠️ Geen vragen gevonden voor quiz:", quizId);
            return res.status(404).json({ error: "Geen vragen gevonden" });
        }

        // console.log("✅ Gevonden vragen:", questions);
        res.status(200).json(questions);
    } catch (error) {
        console.error("❌ Interne serverfout:", error);
        res.status(500).json({ error: "Interne serverfout" });
    }
};

export const getQuizById = async (req, res) => {
    const { id } = req.params;
    // console.log(`🔍 [Backend] Ophalen quiz met ID: ${id}`);

    const supabase = getSupabaseClient(req);

    try {
        // console.log(`🔍 Ophalen quiz met ID: ${id}`);

        // ✅ Stap 1: Haal de quiz zelf op
        const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select(`
            id, title, subject_id, difficulty, grade_id, created_at,
            subjects(subject_name),
            grades(grade_name),
            program_quiz(programs(id, program_name))
        `)
        .eq("id", id)
        .single();

        if (quizError || !quiz) {
            console.error("❌ Quiz niet gevonden:", quizError);
            return res.status(404).json({ error: "Quiz niet gevonden" });
        }

        // ✅ Stap 2: Haal de bijbehorende vragen op
        const { data: questions, error: questionsError } = await supabase
            .from("questions")
            .select("id, question_text, type, options, correct_answers, time_limit, snippet_type, snippet_value, image_url")
            .eq("quiz_id", id)
            .order("id", { ascending: true });

        if (questionsError) {
            console.error("❌ Fout bij ophalen vragen:", questionsError);
            return res.status(500).json({ error: "Fout bij ophalen van quizvragen." });
        }

        // Stap 3: Voeg vragen en programma’s toe aan response
        quiz.questions = questions || [];
        quiz.programs = quiz.program_quiz.map(pq => pq.programs);

        // verwijder overbodige nesting
        delete quiz.program_quiz;

        // console.log("✅ Quiz en vragen succesvol opgehaald:", quiz);
        res.status(200).json(quiz);
        
    } catch (error) {
        console.error("❌ Interne serverfout:", error);
        res.status(500).json({ error: "Interne serverfout" });
    }
};

export const updateQuiz = async (req, res) => {
    const { id } = req.params; // ✅ ID uit de URL
    const { title, subject_id, difficulty, program_ids, grade_id, questions } = req.body;

    const supabase = getSupabaseClient(req);

    try {
        console.log(`🔄 Updaten van quiz met ID: ${id}`);
        console.log("🔎 Request body:", req.body);

        // ✅ Stap 1: Controleer of de quiz bestaat
        const { data: existingQuiz, error: quizError } = await supabase
            .from("quizzes")
            .select("id")
            .eq("id", id)
            .single();

        if (quizError || !existingQuiz) {
            console.error("❌ Quiz niet gevonden:", quizError);
            return res.status(404).json({ error: "Quiz niet gevonden" });
        }

        // ✅ Stap 2: Update de quizgegevens
        const { error: updateError } = await supabase
            .from("quizzes")
            .update({ title, subject_id, difficulty, grade_id })
            .eq("id", id);

        if (updateError) {
            console.error("❌ Fout bij updaten quiz:", updateError);
            return res.status(500).json({ error: "Kon quiz niet updaten." });
        }

        // ✅ Verwijder bestaande koppelingen met programma's eerst
        const { error: deleteProgramsError } = await supabase
            .from("program_quiz")
            .delete()
            .eq("quiz_id", id);

            if (deleteProgramsError) {
                console.error("❌ Fout bij verwijderen oude programmakoppelingen:", deleteProgramsError);
                return res.status(500).json({ error: "Kon oude programmakoppelingen niet verwijderen." });
            }

        // ✅ Voeg nieuwe programmakoppelingen toe indien er programma's zijn
        if (program_ids?.length) {
            const programInsertData = program_ids.map(program_id => ({
                quiz_id: id,
                program_id
            }));

            const { error: insertProgramError } = await supabase
                .from("program_quiz")
                .insert(programInsertData);

            if (insertProgramError) {
                console.error("❌ Fout bij invoegen nieuwe programmakoppelingen:", insertProgramError);
                return res.status(500).json({ error: "Kon programmakoppelingen niet opslaan." });
            }
        }

        // ✅ Stap 3: Verwijder bestaande vragen van de quiz
        const { error: deleteError } = await supabase
            .from("questions")
            .delete()
            .eq("quiz_id", id);

        if (deleteError) {
            console.error("❌ Fout bij verwijderen oude vragen:", deleteError);
            return res.status(500).json({ error: "Kon oude vragen niet verwijderen." });
        }

        // ✅ Stap 4: Voeg de nieuwe vragen toe
        const vragenData = questions.map(q => ({
            quiz_id: id,
            question_text: q.question_text,
            type: q.type,
            options: q.options ? q.options : null,
            correct_answers: `{${q.correct_answers.map(ans => `"${ans}"`).join(",")}}`, // ✅ PostgreSQL Array
            time_limit: q.time_limit,
            snippet_type: q.snippet_type || null,
            snippet_value: q.snippet_value || null,
            image_url: q.image_url || null
        }));

        const { error: insertError } = await supabase.from("questions").insert(vragenData);

        if (insertError) {
            console.error("❌ Fout bij invoegen nieuwe vragen:", insertError);
            return res.status(500).json({ error: "Kon nieuwe vragen niet opslaan." });
        }

        console.log("✅ Quiz succesvol geüpdatet!");
        res.status(200).json({ message: "Quiz succesvol geüpdatet!" });
    } catch (error) {
        console.error("❌ Interne serverfout:", error);
        res.status(500).json({ error: "Interne serverfout." });
    }
};

export const deleteQuiz = async (req, res) => {
    const { id } = req.params;

    const supabase = getSupabaseClient(req);


    try {
        console.log(`🗑️ Verwijderen van quiz met ID: ${id}`);

        // ✅ Stap 1: Controleer of de quiz bestaat
        const { data: existingQuiz, error: quizError } = await supabase
            .from("quizzes")
            .select("id")
            .eq("id", id)
            .single();

        if (quizError || !existingQuiz) {
            console.error("❌ Quiz niet gevonden:", quizError);
            return res.status(404).json({ error: "Quiz niet gevonden" });
        }

        // ✅ Stap 2: Verwijder eerst de vragen van deze quiz
        const { error: deleteQuestionsError } = await supabase
            .from("questions")
            .delete()
            .eq("quiz_id", id);

        if (deleteQuestionsError) {
            console.error("❌ Fout bij verwijderen vragen:", deleteQuestionsError);
            return res.status(500).json({ error: "Kon vragen niet verwijderen." });
        }

        // ✅ Stap 3: Verwijder de quiz zelf
        const { error: deleteQuizError } = await supabase
            .from("quizzes")
            .delete()
            .eq("id", id);

        if (deleteQuizError) {
            console.error("❌ Fout bij verwijderen quiz:", deleteQuizError);
            return res.status(500).json({ error: "Kon quiz niet verwijderen." });
        }

        console.log("✅ Quiz succesvol verwijderd!");
        res.status(200).json({ message: "Quiz succesvol verwijderd!" });

    } catch (error) {
        console.error("❌ Interne serverfout bij verwijderen quiz:", error);
        res.status(500).json({ error: "Interne serverfout." });
    }
};

export const submitAnswer = async (req, res) => {
    const { quizId } = req.params;
    const { questionId, userAnswer } = req.body;
    const { user } = req;

    const supabase = getSupabaseClient(req);

    try {
        // ✅ Stap 1: Haal het correcte antwoord op
        const { data: question, error } = await supabase
            .from("questions")
            .select("correct_answers")
            .eq("id", questionId)
            .single();

        if (error || !question) {
            return res.status(500).json({ error: "Vraag niet gevonden of databasefout." });
        }

        // ✅ Stap 2: Gebruik `correct_answers` direct als array
        const correctAnswers = question.correct_answers;

        if (!Array.isArray(correctAnswers)) {
            return res.status(500).json({ error: "Fout: correct_answers is geen array." });
        }

        // console.log("✅ Verwachte antwoorden:", correctAnswers);
        // console.log("✅ Gebruiker gaf in:", userAnswer);

        // ✅ Stap 3: Controleer of het antwoord correct is
        const isCorrect = Array.isArray(userAnswer)
            ? userAnswer.every(ans => correctAnswers.includes(ans)) && userAnswer.length === correctAnswers.length
            : correctAnswers.includes(userAnswer);

        // console.log("✅ Antwoord correct?", isCorrect);

        // ✅ Stap 4: Stuur correct-status terug naar de frontend
        res.status(200).json({ correct: isCorrect });

    } catch (err) {
        console.error("❌ Fout in submitAnswer:", err);
        res.status(500).json({ error: "Interne serverfout bij het verwerken van het antwoord." });
    }
};

export const finishQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { userId, qbitsEarned } = req.body; // ✅ Ontvang qbits uit frontend

    const supabase = getSupabaseClient(req);

    console.log("🔍 Debug Backend: Ontvangen quizId =", quizId);
    console.log("🔍 Debug Backend: Ontvangen userId =", userId);
    console.log("🔍 Debug Backend: Ontvangen qbitsEarned =", qbitsEarned);
    console.log("📩 Headers ontvangen:", req.headers["content-type"]);
    console.log("📥 Body ontvangen:", req.body);
    console.log("✅ qbitsEarned ontvangen?", req.body.qbitsEarned);

    
    if (!quizId || !userId) {
        console.error("❌ Fout: quizId of userId is undefined!");
        return res.status(400).json({ error: "quizId of userId ontbreekt in request" });
    }

    try {
        // ✅ Stap 1: Haal bestaande attempt op
        const { data: newAttemptData, error: attemptError } = await supabase
            .rpc("get_next_attempt_number", {
                uid: userId,
                qid: quizId
            });

            if (attemptError || newAttemptData === null) {
            console.error("❌ Fout bij ophalen volgende attempt:", attemptError);
            return res.status(500).json({ error: "Kon volgende attempt niet bepalen." });
            }

            const newAttempt = newAttemptData;

        // ✅ Stap 3: XP +10
        const xpEarned = 2;

        // ✅ Stap 4: Quiz-resultaat opslaan
        const { error: insertError } = await supabase.from("quiz_results").insert([
            {
                user_id: userId,
                quiz_id: quizId,
                attempt_number: newAttempt,
                score: qbitsEarned, // ✅ Score = aantal correcte antwoorden
                xp_earned: xpEarned,
                qbits_earned: qbitsEarned // ✅ 1 Qbit per correct antwoord
            }
        ]);

        if (insertError) throw insertError;

        // ✅ Update de totale Qbits van de gebruiker
        const { data: userData, error: userError } = await supabase
        .from("users")
        .select("xp_points, qbits")
        .eq("id", userId)
        .single();

        if (userError || !userData) {
        console.error("❌ Kon gebruiker niet vinden om Qbits bij te werken:", userError);
        } else {
        const nieuweQbits = userData.qbits + qbitsEarned;
        const nieuweXpPoints = userData.xp_points + xpEarned;

        // console.log(`🔍 Huidige Qbits: ${userData.qbits}, Nieuwe Qbits: ${nieuweQbits}`);
        // console.log(`🔍 Huidige XP: ${userData.xp_points}, Nieuwe XP: ${nieuweXpPoints}`);

        // ✅ Stap 6: Update de gebruiker met nieuwe XP en Qbits
        const { error: updateUserError } = await supabase
        .from("users")
        .update({ qbits: nieuweQbits, xp_points: nieuweXpPoints })
        .eq("id", userId);

        if (updateUserError) {
            console.error("❌ Fout bij updaten van gebruikers-Qbits:", updateUserError);
        } else {
            console.log(`✅ Gebruiker ${userId} heeft nu ${nieuweQbits} Qbits.`);
        }
        }

        // console.log("✅ Quiz succesvol voltooid!", {
        //     userId,
        //     quizId,
        //     attempt: newAttempt,
        //     xpEarned,
        //     qbitsEarned,
        // });

        res.status(200).json({
            message: "Quiz voltooid!",
            attempt: newAttempt,
            xpEarned,
            qbitsEarned
        });

    } catch (error) {
        console.error("❌ Fout bij voltooien quiz:", error);
        res.status(500).json({ error: "Fout bij voltooien van de quiz." });
    }
};

export const getQuizResults = async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user?.id;

    const supabase = getSupabaseClient(req);

    if (!quizId || !userId) {
        console.error("❌ Fout: quizId of userId is niet beschikbaar!");
        return res.status(400).json({ error: "Quiz ID of user ID ontbreekt" });
    }

    try {
        // ✅ 1. Haal laatste quizresultaat op
        const { data: result, error } = await supabase
            .from("quiz_results")
            .select("score, xp_earned, qbits_earned, completed_at")
            .eq("quiz_id", quizId)
            .eq("user_id", userId)
            .order("attempt_number", { ascending: false })
            .limit(1)
            .maybeSingle(); // ✅ laat lege respons toe

        if (error) {
            console.error("❌ Fout bij ophalen quizresultaten:", error);
            return res.status(500).json({ error: "Interne serverfout" });
        }

        if (!result) {
            console.warn("⚠️ Geen resultaten gevonden voor deze quiz.");
            return res.status(200).json({ score: 0, xp_earned: 0, qbits_earned: 0, new_badges: [] });
        }

        // ✅ 2. Haal recent verdiende badges op (laatste 5 minuten)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { data: newBadges, error: badgeError } = await supabase
            .from("badge_user")
            .select(`badge_id, earned_at, badges(description, icon_url)`)
            .eq("user_id", userId)
            .gte("earned_at", fiveMinutesAgo);

        if (badgeError) {
            console.error("❌ Fout bij ophalen badges:", badgeError.message);
            return res.status(500).json({ error: badgeError.message });
        }

        // ✅ 3. Combineer resultaat en nieuwe badges
        res.status(200).json({
            score: result.score,
            xp_earned: result.xp_earned,
            qbits_earned: result.qbits_earned,
            new_badges: newBadges.map(b => ({
                id: b.badge_id,
                description: b.badges.description,
                icon_url: b.badges.icon_url,
                earned_at: b.earned_at
            }))
        });

    } catch (error) {
        console.error("❌ Fout bij ophalen quizresultaten:", error);
        res.status(500).json({ error: "Interne serverfout" });
    }
};


