import { getSupabaseClient } from "../utilities/db.js";
import { uploadProfilePictureUtil } from "../utilities/uploadProfilePicture.js";


// 🔹 Profielgegevens ophalen voor leerlingen (gebruikmakend van de "users" tabel)
export const getStudentProfile = async (req, res) => {

  const supabase = getSupabaseClient(req);

  const { user } = req;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(`
        nickname, 
        email, 
        avatar_url, 
        school:schools ( school_name ), 
        program:programs ( program_name ),
        grade:grades ( grade_name ),
        xp_points, 
        qbits, 
        league_id,
        leagues(name) as league_name
        `) // schools, programs en grades zijn relationele tabellen die we hier aanroepen en de ..._name kolom telkens opvragen (de link tussen users en de schools, programs, grades tabellen is de id van de user)
    .eq("id", user.id)
    .single();

  if (profileError) return res.status(400).json({ error: profileError.message });

  const { data: badges, error: badgeError } = await supabase
    .from("badge_user")
    .select(`
      badge_id,
      badges(description, icon_url)
  `)
    .eq("user_id", user.id);

  if (badgeError) return res.status(500).json({ error: badgeError.message });

  const { data: quizStats, error: quizStatsError } = await supabase
    .rpc("get_quiz_statistics", { user_id: user.id })
    .single();


    if (quizStatsError) {
        console.error("Fout bij get_quiz_statistics:", quizStatsError.message);
        return res.status(500).json({ error: quizStatsError.message });
      }

//   const { data: quotes, error: quoteError } = await supabase
//     .from("motivation_quotes")
//     .select("text, meme_url")
//     .order("random()")
//     .limit(1);

//   if (quoteError) return res.status(500).json({ error: quoteError.message });
  // console.log("🎖️ Raw badges data from Supabase:", badges);

  res.status(200).json({
    profile,
    badges: badges.map(b => ({
      id: b.badge_id,
      description: b.badges.description,
      icon_url: b.badges.icon_url
    })),
    quizStats,
    // motivation: quotes[0]
  });
};

// 🔹 Profielfoto uploaden voor leerlingen met de centrale utility
export const uploadProfilePicture = async (req, res) => {

  const supabase = getSupabaseClient(req);
  
  const { user } = req;
  if (!req.file) return res.status(400).json({ error: "Geen bestand geüpload" });

  try {
    const publicUrl = await uploadProfilePictureUtil(req, req.file, user.id);

      // console.log("🚀 Public URL:", publicUrl);

      // **Updaten van de avatar URL in de users tabel**
      const { error: updateError } = await supabase
          .from("users")
          .update({ avatar_url: publicUrl })
          .eq("id", user.id);

      if (updateError) {
          console.error("❌ Fout bij updaten van de database:", updateError.message);
          return res.status(500).json({ error: updateError.message });
      }

      res.status(200).json({ avatar_url: publicUrl });
  } catch (error) {
      console.error("❌ Upload fout:", error);
      res.status(500).json({ error: "Er is een fout opgetreden bij het uploaden" });
  }
};
