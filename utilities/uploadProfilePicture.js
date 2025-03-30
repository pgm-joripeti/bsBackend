import { getSupabaseClient } from "../utilities/db.js";

export const uploadProfilePictureUtil = async (req, file, userId) => {

    const supabase = getSupabaseClient(req);

    const fileExt = file.mimetype.split("/")[1];
    const filePath = `avatars/${userId}.${fileExt}`; // 🔥 Gebruik een vast pad om de oude te overschrijven

    console.log("📂 Upload naar Supabase:", filePath);

    // 🔥 Eerst de oude avatar verwijderen (indien die bestaat)
    await supabase.storage.from("avatars").remove([filePath]);

    // 🚀 Vervolgens de nieuwe avatar uploaden
    const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file.buffer, {
            cacheControl: "3600",
            contentType: file.mimetype,
            upsert: true // 🔥 Overschrijf altijd de vorige afbeelding
        });

    if (uploadError) {
        console.error("❌ Fout bij uploaden naar Supabase:", uploadError.message);
        throw uploadError;
    }

    // ✅ Haal de correcte Public URL als STRING (nu goed uit het object gehaald)
    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = publicUrlData.publicUrl; // 🔥 Dit haalt de string uit het object
    console.log("✅ Public URL gegenereerd:", publicUrl);

    return publicUrl; // 🔥 Geef alleen de STRING terug, geen object
};
