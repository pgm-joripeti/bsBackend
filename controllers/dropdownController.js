import { supabaseService } from "../utilities/db.js";

export const getPrograms = async (req, res) => {
    const { data, error } = await supabaseService.from("programs").select("id, program_name");
    if (error) return res.status(500).json({ error: "Kon studierichtingen niet ophalen" });
    res.status(200).json(data);
};

export const getGrades = async (req, res) => {
    const { data, error } = await supabaseService.from("grades").select("id, grade_name");
    if (error) return res.status(500).json({ error: "Kon graden niet ophalen" });
    res.status(200).json(data);
};

export const getSubjects = async (req, res) => {
    const { data, error } = await supabaseService.from("subjects").select("id, subject_name");
    if (error) return res.status(500).json({ error: "Kon vakken niet ophalen" });
    res.status(200).json(data);
};
