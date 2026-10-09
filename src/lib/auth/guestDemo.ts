import { supabase } from "../supabaseClient";

// Creates a temporary guest account through the edge function and signs in with it.
// Throws on failure; the caller shows the message.
export async function signInAsGuest() {
  const { data, error } = await supabase.functions.invoke("create-guest");

  if (error) throw error;

  const { email, password } = data as {
    email: string;
    password: string;
  };

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) throw signInErr;

  localStorage.setItem("is_demo", "1");
}
