import { supabase } from "../supabaseClient";
import type { JobType, StageId } from "../../features/components/StageColumn";

type DbJobRow = {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  stage: StageId;
  status: "active" | "accepted" | "rejected";
  applied_date: string;
  rejected_from_stage: StageId | null;
  accepted_at: string | null;
  location: string | null;
  salary: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchJobs(userId: string): Promise<JobType[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, company_name, position, stage, status, applied_date, rejected_from_stage, created_at, location, salary, tags"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as DbJobRow[];

  return rows.map((row) => ({
    id: row.id,
    company_name: row.company_name,
    position: row.position,
    stage: row.stage,
    status: row.status,
    applied_date: row.applied_date,
    rejectedFromStage: row.rejected_from_stage ?? null,
    acceptedAt: row.accepted_at ?? undefined,
    location: row.location ?? undefined,
    salary: row.salary ?? undefined,
    tags: row.tags ?? undefined,
  }));
}



