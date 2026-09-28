import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Add them to backend/.env (see .env.example)."
  );
}

// Secret key: används bara i backend, går förbi RLS
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
