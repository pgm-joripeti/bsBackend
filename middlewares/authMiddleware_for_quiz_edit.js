import { getSupabaseClient } from "../utilities/db.js"

const authMiddleware_for_quiz_edit = async (req, res, next) => {
    console.time("🔍 AuthMiddleware duur");
    console.log("🔍 AuthMiddleware aangeroepen voor:", req.originalUrl);

    const supabase = getSupabaseClient(req);

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.warn("🚨 Geen token gevonden in request");
            return res.status(401).json({ error: "Geen token aanwezig" });
        }

        const token = authHeader.split(" ")[1];
        console.log("🔍 Ontvangen token:", token);

        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            console.error("❌ Ongeldige of verlopen token:", userError);
            return res.status(401).json({ error: "Ongeldige gebruiker of token verlopen" });
        }

        console.log("✅ Ingelogde gebruiker ID:", user.id);

        console.time("🔍 Supabase DB query duur");
        const { data: userData, error: userDataError } = await supabase
            .from("users")
            .select("id, role, program_id, grade_id")
            .eq("id", user.id)
            .limit(1);
        console.timeEnd("🔍 Supabase DB query duur");

        if (userDataError || !userData) {
            console.warn("⚠️ Geen profiel gevonden in de 'users' tabel voor user:", user.id);
            return res.status(403).json({ error: "Geen toegang - profiel niet gevonden" });
        }

        console.log("✅ Gebruikersprofiel gevonden:", userData.id);
        console.timeEnd("🔍 AuthMiddleware duur");

        req.user = { id: user.id, role: userData.role, program: userData.program_id, grade: userData.grade_id };
        return next();

    } catch (err) {
        console.error("❌ Interne fout in authMiddleware:", err.message);
        console.timeEnd("🔍 AuthMiddleware duur");
        return res.status(500).json({ error: "Interne serverfout bij authenticatie" });
    }
};

export default authMiddleware_for_quiz_edit;