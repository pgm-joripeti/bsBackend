import { getSupabaseClient, supabaseService } from "../utilities/db.js"; // ✅ beide importeren

const authMiddleware = async (req, res, next) => {
    console.log("🔍 AuthMiddleware aangeroepen...");

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.warn("🚨 Geen token gevonden in request");
            return res.status(401).json({ error: "Geen token aanwezig" });
        }

        const token = authHeader.split(" ")[1];
        // console.log("🔍 Ontvangen token:", token);

        // ✅ Decode JWT → alleen met supabaseService
        const { data: { user }, error: userError } = await supabaseService.auth.getUser(token);
        if (userError || !user) {
            console.error("❌ Ongeldige of verlopen token:", userError);
            return res.status(401).json({ error: "Ongeldige gebruiker of token verlopen" });
        }

        console.log("✅ Ingelogde gebruiker ID:", user.id);

        // ✅ Gebruik JWT-authenticated Supabase client
        const supabase = getSupabaseClient(req);

        const { data: userData, error: userDataError } = await supabase
            .from("users")
            .select("id, role, program_id, grade_id")
            .eq("id", user.id)
            .single();

        console.log("🔍 Opgehaalde userData:", userData);

        if (userDataError || !userData) {
            console.warn("⚠️ Geen profiel gevonden in de 'users' tabel voor user:", user.id);
            return res.status(403).json({ error: "Geen toegang - profiel niet gevonden" });
        }

        req.user = {
            id: user.id,
            role: userData.role,
            program: userData.program_id,
            grade: userData.grade_id
        };

        next();

    } catch (err) {
        console.error("❌ Interne fout in authMiddleware:", err.message);
        res.status(500).json({ error: "Interne serverfout bij authenticatie" });
    }
};

export default authMiddleware;
