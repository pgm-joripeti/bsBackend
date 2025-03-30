// rewardController.js
import { getSupabaseClient } from "../utilities/db.js";

export async function rewardQbit(req, res) {
  const { amount } = req.body;
  const supabase = getSupabaseClient(req);
  const userId = req.user.id;

  const { error } = await supabase.rpc("increment_qbits", {
    uid: userId,
    increment: amount,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}

export async function rewardXp(req, res) {
  const { amount } = req.body;
  const supabase = getSupabaseClient(req);
  const userId = req.user.id;

  const { error } = await supabase.rpc("increment_xp", {
    uid: userId,
    increment: amount,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
}
