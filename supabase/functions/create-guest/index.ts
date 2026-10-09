/// <reference lib="deno.ns" />

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// How many guest accounts one address may create per hour, and how many in total.
// The total is a backstop in case someone rotates addresses.
const GUESTS_PER_IP_PER_HOUR = 5;
const GUESTS_TOTAL_PER_HOUR = 60;
// Guest accounts are removed after this many hours.
const GUEST_LIFETIME_HOURS = 24;
const CLEANUP_BATCH = 25;

const GUEST_EMAIL_PATTERN = "guest_%@demo.local";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// The address is stored only as a hash, enough to count requests from the same place.
async function hashIp(req: Request) {
  // cf-connecting-ip is set by the platform and cannot be supplied by the caller;
  // x-forwarded-for is only a fallback.
  const ip =
    req.headers.get("cf-connecting-ip")?.trim() ||
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "unknown";
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Deletes guest accounts older than GUEST_LIFETIME_HOURS, a few per call.
async function cleanUpOldGuests(admin: SupabaseClient) {
  const cutoff = Date.now() - GUEST_LIFETIME_HOURS * 60 * 60 * 1000;

  const { data: guests } = await admin
    .from("profiles")
    .select("id")
    .like("email", GUEST_EMAIL_PATTERN)
    .limit(CLEANUP_BATCH);

  for (const guest of guests ?? []) {
    const { data, error } = await admin.auth.admin.getUserById(guest.id);
    const user = data?.user;

    // still fresh: leave it alone
    if (user && new Date(user.created_at).getTime() > cutoff) continue;
    // lookup failed for a reason other than "no such user": try again next time
    if (!user && error && error.status !== 404) continue;

    await admin.from("jobs").delete().eq("user_id", guest.id);
    await admin.from("profiles").delete().eq("id", guest.id);
    if (user) await admin.auth.admin.deleteUser(guest.id);
  }

  await admin
    .from("guest_signups")
    .delete()
    .lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
}

Deno.serve(async (req) => {
  // Preflight (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Missing env vars");

    const admin = createClient(url, serviceKey);

    // Rate limit
    const ipHash = await hashIp(req);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [fromIp, total] = await Promise.all([
      admin
        .from("guest_signups")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", hourAgo),
      admin
        .from("guest_signups")
        .select("id", { count: "exact", head: true })
        .gte("created_at", hourAgo),
    ]);

    if (fromIp.error || total.error) throw fromIp.error ?? total.error;

    if ((fromIp.count ?? 0) >= GUESTS_PER_IP_PER_HOUR || (total.count ?? 0) >= GUESTS_TOTAL_PER_HOUR) {
      return json(
        { error: "Too many demo sessions were started recently. Try again in an hour, or create a free account." },
        429
      );
    }

    const { error: signupErr } = await admin.from("guest_signups").insert({ ip_hash: ipHash });
    if (signupErr) throw signupErr;

    const suffix = crypto.randomUUID().slice(0, 8);
    const email = `guest_${suffix}@demo.local`;
    const password = `G_${crypto.randomUUID()}!`;

    // Create confirmed guest user (no email confirmation needed)
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createErr || !created.user) throw createErr ?? new Error("User not created");

    const userId = created.user.id;
    const now = new Date().toISOString();

    // Create/Upsert profile
    const { error: profileErr } = await admin.from("profiles").upsert({
      id: userId,
      email,
      firstName: "Guest",
      lastName: "",
      userName: `guest-${suffix}`,
    });

    if (profileErr) throw profileErr;

    // Seed a few demo jobs
    const { error: jobsErr } = await admin.from("jobs").insert([
      {
        user_id: userId,
        company_name: "Demo Company",
        position: "Frontend Developer",
        stage: "applied",
        status: "active",
        applied_date: now,
        location: "Remote",
        salary: null,
        notes: "Demo job – try moving/editing.",
        rejected_from_stage: null,
        tags: ["React", "TypeScript"],
      },
      {
        user_id: userId,
        company_name: "Bluefin",
        position: "React Engineer",
        stage: "hr-interview",
        status: "active",
        applied_date: now,
        location: "Belgrade",
        salary: null,
        notes: "Demo job – add notes.",
        rejected_from_stage: null,
        tags: ["React", "Redux"],
      },
      {
        user_id: userId,
        company_name: "Northwind",
        position: "Junior FE (Demo)",
        stage: "rejected",
        status: "rejected",
        applied_date: now,
        location: "Hybrid",
        salary: null,
        notes: "Demo job – try restore.",
        rejected_from_stage: "applied",
        tags: ["CSS", "UI"],
      },
    ]);

    if (jobsErr) throw jobsErr;

    // Old guests are removed after the response is sent, so the visitor doesn't wait for it.
    const cleanup = cleanUpOldGuests(admin).catch((e) => console.error("guest cleanup failed", e));
    const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(cleanup);
    else await cleanup;

    return json({ email, password }, 200);
  } catch (e) {
    console.error("create-guest failed", e);
    return json({ error: "The demo could not be started. Please try again." }, 500);
  }
});
