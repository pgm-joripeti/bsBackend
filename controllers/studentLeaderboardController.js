import { getSupabaseClient } from "../utilities/db.js";

const assignToLeastFullLeague = async (userId, today) => {
    console.log(`🔄 Gebruiker ${userId} wordt toegewezen aan een league...`);

    const supabase = getSupabaseClient(req);

    // ✅ Haal alle leagues op
    const { data: leagues, error: leaguesError } = await supabase
        .from("leagues")
        .select("id, name");

    if (leaguesError || !leagues || leagues.length === 0) {
        console.error("❌ Fout bij ophalen leagues of geen leagues beschikbaar:", leaguesError);
        return null;
    }

    let assignedLeague = null;

    for (const league of leagues) {
        const { count, error: countError } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("league_id", league.id);

        if (countError) {
            console.error(`❌ Fout bij tellen users in league ${league.name}:`, countError);
            continue; 
        }

        if (count < 100) {
            const { error: updateError, data } = await supabase
                .from("users")
                .update({ 
                    league_id: league.id, 
                    league_assigned_at: today.toISOString()
                })
                .eq("id", userId)
                .select("league_id")
                .single();

            if (updateError) {
                console.error("❌ Fout bij updaten league:", updateError);
                return null;
            }

            console.log(`✅ Gebruiker ${userId} toegevoegd aan league: ${league.name}`);
            assignedLeague = data.league_id;
            break;
        }
    }

    if (!assignedLeague) {
        const lastLeague = leagues[leagues.length - 1];
        const { error: lastLeagueError, data: updatedUser } = await supabase
            .from("users")
            .update({ 
                league_id: lastLeague.id, 
                league_assigned_at: today.toISOString()
            })
            .eq("id", userId)
            .select("league_id")
            .single();

        if (lastLeagueError || !updatedUser) {
            console.error("❌ Fout bij toewijzen aan laatste league:", lastLeagueError);
            return null;
        }

        console.log(`⚠️ Alle leagues vol. ${userId} toegevoegd aan ${lastLeague.name}`);
        assignedLeague = updatedUser.league_id;
    }

    return assignedLeague;
};

export const assignUserToLeague = async (userId, role) => {

    const supabase = getSupabaseClient(req);

    console.log(`🔍 Controleer league-toewijzing voor ${role} met ID ${userId}...`);

    if (!userId || typeof userId !== "string") {
        console.error("❌ Ongeldig userId formaat:", userId);
        return null;
    }

    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("league_id, league_assigned_at")
        .eq("id", userId)
        .single();

    if (userError || !userData) {
        console.error("❌ Fout bij ophalen gebruiker of gebruiker bestaat niet:", userError);
        return null;
    }

    console.log("✅ Opgehaalde gebruiker:", userData);

    const today = new Date();
    const lastAssigned = userData.league_assigned_at ? new Date(userData.league_assigned_at) : null;

    if (!userData.league_id) {
        console.log("⚠️ Geen league_id gevonden. Gebruiker krijgt voor het eerst een league.");
        return await assignToLeastFullLeague(userId, today);
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);

    if (!lastAssigned || lastAssigned < oneWeekAgo) {
        console.log(`🔄 ${role} ${userId} krijgt een nieuwe league voor de nieuwe week.`);
        return await assignToLeastFullLeague(userId, today);
    }

    console.log(`✅ ${role} ${userId} blijft in dezelfde league (${userData.league_id}).`);
    return userData.league_id;
};

// ✅ **Leaderboard ophalen**
export const getStudentLeaderboard = async (req, res) => {
    const { user } = req;

    const supabase = getSupabaseClient(req);

    console.log("🔍 Debug: Ontvangen user object in getStudentLeaderboard:", user);

    if (!user || !user.id) {
        console.error("❌ ERROR: User ID ontbreekt in request.");
        return res.status(400).json({ error: "User ID ontbreekt in request." });
    }

    // ✅ Haal de league_id én league naam op via een JOIN
    const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("league_id, leagues(name, icon_url)")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
        console.error("❌ Fout bij ophalen league_id:", profileError);
        return res.status(400).json({ error: profileError?.message || "League niet gevonden." });
    }

    console.log("✅ Debug: Opgehaalde league info:", profile);

    if (!profile.league_id) {
        console.error("❌ ERROR: league_id is NULL voor gebruiker:", user.id);
        return res.status(400).json({ error: "Gebruiker heeft geen league toegewezen." });
    }

    // ✅ Haal de top spelers in de league op (gesorteerd op XP en Qbits)
    const { data: leaderboard, error } = await supabase
  .rpc("get_leaderboard_for_user", { user_id: user.id });

if (error) {
  console.error("❌ Fout bij ophalen leaderboard:", error);
  return res.status(500).json({ error: error.message });
}

res.status(200).json({
  league: profile.leagues.name,
  league_logo: profile.leagues.icon_url,
  players: leaderboard
});


};

// ✅ **Ranking ophalen**
export const getStudentRanking = async (req, res) => {
    console.log("🔍 Debug: Ontvangen user object in getStudentRanking:", req.user);

    const supabase = getSupabaseClient(req);

    if (!req.user || !req.user.id) {
        return res.status(400).json({ error: "User ID ontbreekt in request." });
    }

    const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("league_id, nickname")
        .eq("id", req.user.id)
        .single();

    if (profileError || !profile) {
        return res.status(400).json({ error: profileError?.message || "League niet gevonden." });
    }

    const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .select("name")
        .eq("id", profile.league_id)
        .single();

    if (leagueError) {
        return res.status(400).json({ error: leagueError?.message || "League naam niet gevonden." });
    }

    const { data: allStudents, error } = await supabase
        .from("users")
        .select("id")
        .eq("league_id", profile.league_id)
        .order("xp_points", { ascending: false })
        .order("qbits", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const ranking = allStudents.findIndex(student => student.id === req.user.id) + 1;

    res.status(200).json({ ranking, league: league.name, user_id: req.user.id });
};
