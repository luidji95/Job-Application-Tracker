import { supabase } from "../lib/supabaseClient";
import { DUMMY_JOBS } from "../data/dummyData";
import type { JobType } from "../features/components/StageColumn";

import { normalizeStage, normalizeStatus, normalizeTags, pickStringOrNull } from "../lib/jobs/jobUtils";

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
        // NormalizeStatus i NormalizeStage vracaju StageId i StatusVariant type a meni treba string 
      const status = normalizeStatus(job.status) as string; /* as string */
      const stage = normalizeStage(job.stage) as string;  /* as string */

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
          ? normalizeStage(job.rejected_from_stage ?? stage) as string // cast
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
