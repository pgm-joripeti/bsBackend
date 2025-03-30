// controllers/uploadController.js
import { getSupabaseClient } from "../utilities/db.js"

export const uploadImageToSupabase = async (req, res) => {
    const { path } = req.query;

    const supabase = getSupabaseClient(req);

    if (!req.file || !path) {
        return res.status(400).json({ error: "Geen bestand of path meegegeven" });
    }

    try {
        const { data, error } = await supabase
            .storage
            .from("images")
            .upload(path, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase
            .storage
            .from("images")
            .getPublicUrl(path);

        res.status(200).json({ url: publicUrlData.publicUrl });
    } catch (err) {
        console.error("❌ Upload mislukt:", err.message);
        res.status(500).json({ error: "Upload naar Supabase mislukt" });
    }
};
