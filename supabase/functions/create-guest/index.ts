/// <reference lib="deno.ns" />


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Preflight (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Missing env vars");

    const admin = createClient(url, serviceKey);

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
        stage: "interview",
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

    return new Response(JSON.stringify({ email, password }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
