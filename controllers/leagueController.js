import { getSupabaseClient } from "../utilities/db.js";

// ✅ Haalt de huidige league van een student op
export async function getUserLeague(req, res) {

    const supabase = getSupabaseClient(req);

    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Geen geldige userId meegegeven" });

    try {
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("role, league_id, league_assigned_at")
            .eq("id", userId)
            .single();

        if (userError) throw userError;
        if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });

        console.log(`🔍 Backend: Gebruiker ${userId} heeft rol ${user.role}`);

        // ✅ Als het een leerkracht is, expliciet "geen leagues"
        if (user.role !== "leerling") {
            return res.json({ message: "Leerkrachten hebben geen leagues", league: null });
        }

        // ✅ Als het een leerling is, stuur dan correct de league info terug
        res.json({
            role: user.role,  // hierop zal frontend checken om league toe te kennen of niet (league.js in utilities map)
            league: user.league_id || null,  // Null als er nog geen league is
            assigned_at: user.league_assigned_at || null
        });

    } catch (error) {
        console.error("❌ Fout bij ophalen league:", error.message);
        res.status(500).json({ error: "Kon league niet ophalen" });
    }
}

// ✅ Wijs een league toe als de student er geen heeft of 7+ dagen in dezelfde zit
export async function assignUserLeague(req, res) {

    const supabase = getSupabaseClient(req);

    
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Geen geldige userId meegegeven" });

    try {
        // ✅ Haal gebruiker op
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("role, league_id, league_assigned_at")
            .eq("id", userId)
            .single();

        if (userError) throw userError;
        if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });

        // 🛑 Geen leagues voor leerkrachten
        if (user.role !== "leerling") {
            return res.json({ message: "Leerkrachten hebben geen leagues", league: null });
        }

        // ✅ Controleer of de league ouder is dan 7 dagen
        if (user.league_id) {
            const daysInLeague = (Date.now() - new Date(user.league_assigned_at)) / (1000 * 60 * 60 * 24);
            if (daysInLeague < 7) {
                return res.json({ message: "League blijft ongewijzigd", league_id: user.league_id });
            }
        }

        // ✅ Zoek een beschikbare league (max 10 gebruikers)
        const { data: league, error: leagueError } = await supabase.rpc("find_least_populated_league");

        let newLeagueId = league?.id;

        // ✅ Als alle leagues vol zitten, begin opnieuw bij league 1
        if (!newLeagueId) {
            const { data: firstLeague, error: firstLeagueError } = await supabase
                .from("leagues")
                .select("id")
                .order("id", { ascending: true })
                .limit(1)
                .single();

            if (firstLeagueError || !firstLeague) {
                return res.status(500).json({ error: "Geen beschikbare leagues" });
            }

            newLeagueId = firstLeague.id;
        }

        // ✅ Wijs de gebruiker toe aan de nieuwe league
        const { error: updateError } = await supabase
            .from("users")
            .update({
                league_id: newLeagueId,
                league_assigned_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (updateError) throw updateError;

        console.log(`✅ Gebruiker ${userId} succesvol toegewezen aan league ${newLeagueId}`);
        res.json({ league: newLeagueId });

    } catch (error) {
        console.error("❌ Fout bij league-toewijzing:", error.message);
        res.status(500).json({ error: "Kon geen league toewijzen" });
    }
}
