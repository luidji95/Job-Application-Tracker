import { supabase } from "../lib/supabaseClient";
import { DUMMY_JOBS } from "../data/dummyData";

// DB row shape (samo kolone koje postoje u tabeli)
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
type DummyJob = {
  company_name?: string;
  company?: string;
  position?: string;
  title?: string;
  stage?: string;
  status?: string;
  location?: string;
  salary?: string;
  tags?: string | string[];
  notes?: string;
  applied_date?: string;
  rejected_from_stage?: string;
};



// helpers
const toLowerSafe = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");

const normalizeStage = (stage: unknown) => {
  const s = toLowerSafe(stage);
  const allowed = new Set(["applied", "hr-interview", "tecnical", "final", "offer", "rejected"]);
  if (allowed.has(s)) return s;
  // fallback
  return "applied";
};

const normalizeStatus = (status: unknown) => {
  const s = toLowerSafe(status);
  const allowed = new Set(["active", "accepted", "rejected"]);
  if (allowed.has(s)) return s;
  return "active";
};

const normalizeTags = (tags: unknown): string[] => {
  // DB je text[] => MORA biti array stringova
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
    // 1 Pronalazimo trenutno logovanog usera
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Morate biti ulogovani da biste seedovali poslove.");
    }

    // 2 brisemo samo user-ove jobove
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    // 3 map dummy -> DB rows
    const nowIso = new Date().toISOString();

    const rows: JobRowInsert[] = DUMMY_JOBS.map((job: DummyJob) => {
      const status = normalizeStatus(job.status);
      const stage = normalizeStage(job.stage);

      const companyName =
        typeof job.company_name === "string"
          ? job.company_name.trim()
          : typeof job.company === "string"
          ? job.company.trim()
          : "";

      const position =
        typeof job.position === "string"
          ? job.position.trim()
          : typeof job.title === "string"
          ? job.title.trim()
          : "";

      return {
        user_id: user.id,
        company_name: companyName || "Unknown Company",
        position: position || "Unknown Position",
        stage,
        status,
        location: pickStringOrNull(job.location),
        salary: pickStringOrNull(job.salary), 
        tags: normalizeTags(job.tags), 
        notes: pickStringOrNull(job.notes),
        applied_date: typeof job.applied_date === "string" ? job.applied_date : nowIso,
        rejected_from_stage: status === "rejected" ? normalizeStage(job.rejected_from_stage ?? stage) : null,
      };
    });

    // 4 insert u bazu 
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
    const message = error instanceof Error ? error.message : 'Doslo je do greske';
    return {
      success: false,
      count: 0,
      message,
      error,
    };
  }
};
