import { supabase } from "../lib/supabaseClient";
import { DUMMY_JOBS } from "../data/dummyData";
import type { JobType } from "../features/components/StageColumn";

// DB row shape - striktno za Supabase insert
type JobRowInsert = {
  user_id: string;
  stage: string;
  position: string;
  status: string;
  location: string | null;
  salary: string | null;
  tags: string[]; 
  notes: string | null;
  company_name: string;
  applied_date: string; 
  rejected_from_stage: string | null;
};

// helpers 
const toLowerSafe = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");

const normalizeStage = (stage: unknown) => {
  const s = toLowerSafe(stage);
  const allowed = new Set(["applied", "hr-interview", "technical", "final", "offer", "rejected"]);
  return allowed.has(s) ? s : "applied";
};

const normalizeStatus = (status: unknown) => {
  const s = toLowerSafe(status);
  const allowed = new Set(["active", "accepted", "rejected"]);
  return allowed.has(s) ? s : "active";
};

const normalizeTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

const pickStringOrNull = (v: unknown) => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
};

export const seedDummyJobs = async (tableName: string = "jobs") => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Morate biti ulogovani da biste seedovali poslove.");

    // Proveri da li vec postoji makar 1 job
    const { count, error: countError } = await supabase
      .from(tableName)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) throw countError;

    //Ako ima bar 1 - ne seeduj
    if ((count ?? 0) > 0) {
      return {
        success: false,
        count: 0,
        message: `Seed blocked: already have ${count} jobs. Delete all jobs first.`,
      };
    }

    //  Ako je 0 - seeduj
    const nowIso = new Date().toISOString();

    const rows: JobRowInsert[] = DUMMY_JOBS.map((job: JobType) => {
      const status = normalizeStatus(job.status);
      const stage = normalizeStage(job.stage);

      const companyName = job.company_name?.trim() || "Unknown Company";
      const position = job.position?.trim() || "Unknown Position";

      return {
        user_id: user.id,
        company_name: companyName,
        position,
        stage,
        status,
        location: pickStringOrNull(job.location),
        salary: pickStringOrNull(job.salary),
        tags: normalizeTags(job.tags),
        notes: pickStringOrNull(job.notes),
        applied_date: job.applied_date || nowIso,
        rejected_from_stage: status === "rejected"
          ? normalizeStage(job.rejected_from_stage ?? stage)
          : null,
      };
    });

    const { data: insertedJobs, error: insertError } = await supabase
      .from(tableName)
      .insert(rows)
      .select();

    if (insertError) throw insertError;

    return {
      success: true,
      count: insertedJobs?.length ?? 0,
      message: `Seedovano ${(insertedJobs?.length ?? 0)} poslova za ${user.email}`,
      jobs: insertedJobs,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Doslo je do greske";
    return { success: false, count: 0, message, error };
  }
};
