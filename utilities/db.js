import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// ✅ Export standaard service client (mag nog voor admin-taken zonder RLS)
export const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ✅ Export helper om Supabase client met JWT token aan te maken
export function getSupabaseClient(req) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new Error("Geen Authorization token gevonden in de headers");
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY, // belangrijk: gebruik public key voor RLS
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}
