import { getSupabaseClient } from "../utilities/db.js";
import { uploadProfilePictureUtil } from "../utilities/uploadProfilePicture.js";

// 🔹 Profielgegevens ophalen voor leerkrachten (gebruikmakend van de "users" tabel)
export const getTeacherProfile = async (req, res) => {

  const supabase = getSupabaseClient(req);

  const { user } = req;

  console.log("📡 Teacher profiel ophalen voor ID:", user.id); // 🔥 Debugging

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(`
        nickname, 
        email, 
        avatar_url, 
        school: schools( school_name ), 
        program:programs ( program_name ),
        grade:grades ( grade_name )
        `)
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("❌ Fout bij ophalen van teacher profiel:", profileError); // 🔥 Debugging
    return res.status(400).json({ error: profileError.message });
  }

  // console.log("✅ Teacher profiel opgehaald:", profile); // ✅ Debugging

  const { data: quizStats, error: quizStatsError } = await supabase
    .rpc("get_teacher_quiz_statistics", { teacher_id: user.id });

    if (quizStatsError) {
      console.error("❌ Fout bij get_teacher_quiz_statistics:", quizStatsError.message);
      return res.status(500).json({ error: quizStatsError.message });
    }
  
    // console.log("✅ Teacher quiz statistieken opgehaald:", quizStats); // ✅ Debugging  

  res.status(200).json({
    profile,
    quizStats
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