import type { JobType } from "../../features/components/StageColumn";

// Builds a job for tests; pass only the fields the test is about.
let nextId = 1;

export const makeJob = (overrides: Partial<JobType> = {}): JobType => ({
  id: `job-${nextId++}`,
  company_name: "Northwind Labs",
  position: "Frontend Developer",
  stage: "applied",
  status: "active",
  applied_date: "2026-09-01T10:00:00.000Z",
  rejected_from_stage: null,
  ...overrides,
});

// A job that was rejected while in the given stage.
export const rejectedFrom = (stage: JobType["rejected_from_stage"]): JobType =>
  makeJob({ stage: "rejected", status: "rejected", rejected_from_stage: stage });
