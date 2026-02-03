

import type { StageId, JobType } from "../../features/components/StageColumn";



export const toLowerSafe = (v: unknown): string => 
  (typeof v === "string" ? v.trim().toLowerCase() : "");


export const normalizeStage = (stage: unknown): StageId => {
  const s = toLowerSafe(stage);
  const allowed: StageId[] = ["applied", "hr-interview", "technical", "final", "offer", "rejected"];
  return (allowed as string[]).includes(s) ? (s as StageId) : "applied";
};


export const normalizeStatus = (status: unknown): JobType["status"] => {
  const s = toLowerSafe(status);
  const allowed: JobType["status"][] = ["active", "accepted", "rejected"];
  return (allowed as string[]).includes(s) ? (s as JobType["status"]) : "active";
};

export const normalizeTags = (tags: unknown): string[] => {
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

export const pickStringOrNull = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
};

// Type guard za StageId
export const isValidStageId = (stage: string): stage is StageId => {
  const allowed = new Set(["applied", "hr-interview", "technical", "final", "offer", "rejected"]);
  return allowed.has(stage);
};

// Type guard za Status
export const isValidStatus = (status: string): status is JobType["status"] => {
  const allowed = new Set(["active", "accepted", "rejected"]);
  return allowed.has(status);
};