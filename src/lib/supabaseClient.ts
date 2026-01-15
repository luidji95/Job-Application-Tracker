import { createClient } from "@supabase/supabase-js";

const supabseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supbaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;





export const supabase = createClient(supabseUrl,supbaseAnonKey);