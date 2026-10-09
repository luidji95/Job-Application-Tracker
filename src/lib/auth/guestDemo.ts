import { supabase } from "../supabaseClient";
import { getFunctionErrorMessage } from "../functionsError";

// Creates a temporary guest account through the edge function and signs in with it.
// Throws on failure; the caller shows the message.
export async function signInAsGuest() {
  const { data, error } = await supabase.functions.invoke("create-guest");

  if (error) {
    throw new Error(await getFunctionErrorMessage(error, "The demo could not be started."));
  }

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
