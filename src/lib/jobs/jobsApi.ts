
import { supabase } from "../supabaseClient";
import type { StageId, JobType } from "../../features/components/StageColumn";

import { normalizeStage, normalizeStatus, pickStringOrNull, normalizeTags } from "./jobUtils";

export type JobRow = {
  id: string;
  user_id: string;

  company_name: string;
  position: string;

  stage: string; 
  status: string; 

  location: string | null;
  salary: string | null;
  tags: string[] | null; 
  notes: string | null;

  applied_date: string;
  rejected_from_stage: string | null;

  // optional 
  accepted_at?: string | null;

  created_at?: string;
};

export type NewJobData = {
  company: string;
  position: string;
  location?: string;
  salary?: string;
  tags?: string; 
  notes?: string;
};

export type UpdateJobData = {
  company?: string;
  position?: string;
  location?: string;
  salary?: string;
  tags?: string; 
  notes?: string;
};

const TABLE = "jobs";





const rowToJob = (row: JobRow): JobType => {
  return {
    id: row.id,
    company_name: row.company_name,
    position: row.position,
    stage: normalizeStage(row.stage),
    status: normalizeStatus(row.status),
    applied_date: row.applied_date,
    rejected_from_stage: row.rejected_from_stage ? normalizeStage(row.rejected_from_stage) : null,
    accepted_at: row.accepted_at ?? undefined,
    location: row.location ?? undefined,
    salary: row.salary ?? undefined,
    tags: (row.tags ?? []) as string[],
    notes: row.notes ?? undefined,
  };
};

const requireUserId = (userId: string | null | undefined) => {
  if (!userId) throw new Error("Missing userId (not authenticated).");
};




 //Fetch all jobs for user (source of truth).

export const fetchJobs = async (userId: string): Promise<JobType[]> => {
  requireUserId(userId);

  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "id,user_id,company_name,position,stage,status,location,salary,tags,notes,applied_date,rejected_from_stage,created_at"
    )
    .eq("user_id", userId)
    
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => rowToJob(row as JobRow));
};

/**
  Create job (from modal data).
  Stage is always "applied" initially.
 */
export const createJob = async (userId: string, payload: NewJobData): Promise<JobType> => {
  requireUserId(userId);

  const insertRow = {
    user_id: userId,
    company_name: payload.company.trim(),
    position: payload.position.trim(),
    stage: "applied",
    status: "active",
    location: pickStringOrNull(payload.location),
    salary: pickStringOrNull(payload.salary),
    tags: normalizeTags(payload.tags),
    notes: pickStringOrNull(payload.notes),
    applied_date: new Date().toISOString(),
    rejected_from_stage: null,
  };

  const { data, error } = await supabase.from(TABLE).insert(insertRow).select().single();
  if (error) throw error;

  return rowToJob(data as JobRow);
};

/**
  Update basic fields (edit modal).
  Does NOT change stage/status unless we include them explicitly.
 */
export const updateJob = async (
  userId: string,
  jobId: string,
  payload: UpdateJobData
): Promise<JobType> => {
  requireUserId(userId);

  // Build patch
  const patch: Record<string, unknown> = {};
  if (payload.company !== undefined) patch.company_name = payload.company.trim();
  if (payload.position !== undefined) patch.position = payload.position.trim();
  if (payload.location !== undefined) patch.location = pickStringOrNull(payload.location);
  if (payload.salary !== undefined) patch.salary = pickStringOrNull(payload.salary);
  if (payload.tags !== undefined) patch.tags = normalizeTags(payload.tags);
  if (payload.notes !== undefined) patch.notes = pickStringOrNull(payload.notes);

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", jobId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToJob(data as JobRow);
};

/**
  Move job between stages.
  Handles  "rejected" logic and "restore from rejected" logic.
 
  - If moving TO rejected: stage="rejected", status="rejected", rejected_from_stage=fromStage
  - If moving FROM rejected to any other: stage=toStage, status="active", rejected_from_stage=null
  - Else: just stage=toStage
 */
export const moveJobDb = async (
  userId: string,
  job: JobType,
  toStage: StageId
): Promise<JobType> => {
  requireUserId(userId);

  const fromStage = job.stage;

  const patch: Record<string, unknown> = {};

  if (toStage === "rejected") {
    patch.stage = "rejected";
    patch.status = "rejected";
    patch.rejected_from_stage = fromStage;
  } else if (fromStage === "rejected") {
    patch.stage = toStage;
    patch.status = "active";
    patch.rejected_from_stage = null;
  } else {
    patch.stage = toStage;
    // status stays same (usually "active") 
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", job.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToJob(data as JobRow);
};

/**
 * Restore a rejected job back to rejected_from_stage (or "applied" if null).
 * Equivalent to  local restore logic, but persisted.
 */
export const restoreJobDb = async (userId: string, job: JobType): Promise<JobType> => {
  requireUserId(userId);

  const backTo: StageId = job.rejected_from_stage ?? "applied";

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      stage: backTo,
      status: "active",
      rejected_from_stage: null,
    })
    .eq("id", job.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToJob(data as JobRow);
};

// Delete job
export const deleteJobDb = async (userId: string, jobId: string): Promise<void> => {
  requireUserId(userId);

  const { error } = await supabase.from(TABLE).delete().eq("id", jobId).eq("user_id", userId);
  if (error) throw error;
};


 // Optional helper - count jobs for seed gating
 
export const countJobs = async (userId: string): Promise<number> => {
  requireUserId(userId);

  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
};
