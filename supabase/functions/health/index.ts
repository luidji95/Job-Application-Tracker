/// <reference lib="deno.ns" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Public status check, called by a scheduled GitHub Actions workflow.
//
// Supabase pauses a free project after about a week without activity, and a
// paused project means nobody can sign in. One cheap read through the API
// twice a week keeps the project awake. The function needs no key and returns
// nothing but "ok" and the time, so it can be public.

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Missing env vars");

    const admin = createClient(url, serviceKey);

    // a count that reads no rows: enough to count as database activity
    const { error } = await admin.from("guest_signups").select("id", { count: "exact", head: true });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, time: new Date().toISOString() }), { status: 200, headers });
  } catch (e) {
    console.error("health check failed", e);
    return new Response(JSON.stringify({ ok: false }), { status: 503, headers });
  }
});
