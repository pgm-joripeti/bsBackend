// controller om avatar up te loaden

import { getSupabaseClient } from "../utilities/db.js";

// 🔹 Upload avatar naar Supabase Storage en update de database
export const uploadAvatar = async (req, res) => {

    const supabase = getSupabaseClient(req);

    const { user } = req;
    if (!req.file) return res.status(400).json({ error: "Geen bestand geüpload" });

    const fileBuffer = req.file.buffer;
    const filePath = `avatars/${user.id}.jpg`;

    // Upload bestand naar Supabase Storage
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, fileBuffer, {
        contentType: "image/jpeg",
        upsert: true
    });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    // Genereer de URL van de avatar
    const avatarUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}.jpg`;

    // Update de avatar-URL in de database
    const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    res.status(200).json({ avatar_url: avatarUrl });
};
