import { createClient } from "@supabase/supabase-js";
import { env } from "../env.js";

// Secret key: används bara i backend, går förbi RLS
const supabase = createClient(env.supabaseUrl, env.supabaseKey);

export default supabase;
