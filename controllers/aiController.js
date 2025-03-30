import { getSupabaseClient } from "../utilities/db.js";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log("✅ OpenAI API Key geladen:", process.env.OPENAI_API_KEY ? "Ja" : "Nee");

export const getAiTip = async (req, res) => {

    const supabase = getSupabaseClient(req);

    const {
        userId,
        questionText,
        quizId,
        snippet_type,
        snippet_value,
        image_url
      } = req.body;      

    if (!userId || !questionText || !quizId) {
        return res.status(400).json({ error: "Ongeldige aanvraag. quizId ontbreekt!" });
    }

    try {
        // ✅ Stap 1: Controleer huidige Qbit balans
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("qbits")
            .eq("id", userId)
            .single();

        if (userError || !user || user.qbits < 1) {
            return res.status(400).json({ error: "Niet genoeg Qbits." });
        }

        // ✅ Stap 2: Haal vak en quiz titel op (indien beschikbaar)
        let subjectName = "een onbekend vak";
        let quizTitle = "deze quiz";

        const { data: quizData, error: quizError } = await supabase
            .from("quizzes")
            .select("title, subject:subjects(subject_name)") // 🚀 Haalt vak (subject) en quiz titel op
            .eq("id", quizId)
            .single();

        if (!quizError && quizData) {
            quizTitle = quizData.title || "deze quiz";
            subjectName = quizData.subject?.subject_name || "een onbekend vak";
        } else {
            console.warn("⚠️ Kon vak en onderwerp niet ophalen, doorgaan zonder extra context.");
        }

        // ✅ Stap 2b: Haal mogelijke antwoordopties op voor deze vraag
        let answerOptions = [];
        const { data: questionData, error: questionError } = await supabase
            .from("questions")
            .select("options")
            .eq("question_text", questionText)
            .eq("quiz_id", quizId) // ✅ Belangrijk om de juiste quiz te gebruiken
            .single();

        if (!questionError && questionData) {
            answerOptions = questionData.options || [];
        } else {
            console.warn("⚠️ Kon geen antwoordopties ophalen, vraag wordt zonder opties verstuurd.");
        }

        console.log(`🔍 AI Tip wordt opgehaald voor quiz: ${quizTitle}, vak: ${subjectName}, met opties:`, answerOptions);

        const prompt = `
        Je bent een behulpzame tutor. Geef een educatieve hint bij onderstaande quizvraag. 
        ⚠️ Je mag het antwoord **niet verklappen**, maar je mag wel didactische tips of analogieën geven.

        De vraag luidt:

        "${questionText}"

        ${
        snippet_type
            ? `De vraag bevat ook een ${snippet_type === "math" ? "wiskundige formule" : snippet_type === "code" ? "code-snippet" : snippet_type === "excel" ? "Excel-fragment" : "wetenschappelijke formule"}:
            
        ${snippet_value}`
            : ""
        }

        ${image_url ? `Er is ook een afbeelding die deel uitmaakt van de vraag: ${image_url}` : ""}

        ${
        answerOptions.length > 0
            ? `Mogelijke antwoordopties: ${answerOptions.join(", ")}`
            : ""
        }

        Geef nu een duidelijke hint om de student in de juiste richting te helpen. 
        Geen oplossingen, wél begrijpelijke uitleg of een analogie.
        `;

        // ✅ Stap 3: Vraag OpenAI om een contextuele tip
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { 
                    role: "system", 
                    content: `Je bent een ervaren docent in het vakgebied ${subjectName}. 
                    Je helpt studenten door hints te geven die hen helpen het antwoord te vinden **zonder het expliciet te verklappen**.
                    Gebruik begrijpelijke taal en zorg ervoor dat de hint specifiek en toepasbaar is op de vraag. Jouw tip mag niet langer zijn dan 100 karakters. Wees dus erg beknopt, concreet, zakelijk en duidelijk. Wijd niet uit.
                    Gebruik indien mogelijk analogieën of context die het makkelijker maken om het antwoord te begrijpen.` 
                },
                { 
                    role: "user", 
                    content: prompt
                  }                  
            ],
            max_tokens: 100
        });

        const aiTip = completion.choices[0].message.content.trim();

        // ✅ Stap 4: Trek 1 Qbit af
        const nieuweQbits = user.qbits - 30;
        await supabase
            .from("users")
            .update({ qbits: nieuweQbits })
            .eq("id", userId);

        console.log(`✅ AI-tip gegenereerd: ${aiTip} (Nieuwe Qbits: ${nieuweQbits})`);
        res.status(200).json({ aiTip });
    } catch (error) {
        console.error("❌ Fout bij ophalen AI-tip:", error);
        res.status(500).json({ error: "Fout bij ophalen AI-tip." });
    }
};
