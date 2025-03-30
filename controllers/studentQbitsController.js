import { getSupabaseClient } from "../utilities/db.js";

export const getQbitBalance = async (req, res) => {
  const supabase = getSupabaseClient(req);
  const { user } = req;

  const { data, error } = await supabase
    .from("users")
    .select("qbits")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    console.error("❌ Fout bij ophalen Qbit balans:", error);
    return res.status(500).json({ error: "Fout bij ophalen Qbit balans." });
  }

  res.status(200).json({ qbits: data.qbits });
};
