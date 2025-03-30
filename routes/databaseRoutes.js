import express from "express";
import { supabaseService } from "../utilities/db.js";

const router = express.Router();

// ✅ API om scholen veilig op te halen
router.get("/schools", async (req, res) => {
    console.log("➡️ Backend API /schools aangeroepen");
    
    const { data, error } = await supabaseService.from("schools").select("id, school_name");

    if (error) {
        console.error("❌ Fout bij het ophalen van scholen:", error);
        return res.status(500).json({ error: "Fout bij het ophalen van scholen." });
    }

    // console.log("✅ Scholen succesvol opgehaald:", data);
    res.json(data);
});

// ✅ API om graden veilig op te halen
router.get("/grades", async (req, res) => {
    console.log("➡️ Backend API /grades aangeroepen");
    const { data, error } = await supabaseService.from("grades").select("id, grade_name");

    if (error) {
        console.error("❌ Fout bij het ophalen van graden:", error);
        return res.status(500).json({ error: "Fout bij het ophalen van graden." });
    }

    res.json(data);
});

// ✅ API om richtingen veilig op te halen
router.get("/programs", async (req, res) => {
    console.log("➡️ Backend API /programs aangeroepen");
    const { data, error } = await supabaseService.from("programs").select("id, program_name");

    if (error) {
        console.error("❌ Fout bij het ophalen van richtingen:", error);
        return res.status(500).json({ error: "Fout bij het ophalen van richtingen." });
    }

    res.json(data);
});

export default router;
