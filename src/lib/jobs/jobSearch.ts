import type { JobType } from "../../features/components/StageColumn";

// Case-insensitive search across company, position, location and tags.
// An empty query returns every job.
export const filterJobs = (jobs: JobType[], query: string): JobType[] => {
  const q = query.trim().toLowerCase();
  if (!q) return jobs;

  return jobs.filter((j) => {
    const company = (j.company_name ?? "").toLowerCase();
    const position = (j.position ?? "").toLowerCase();
    const location = (j.location ?? "").toLowerCase();
    const tags = (j.tags ?? []).join(" ").toLowerCase();

    return (
      company.includes(q) ||
      position.includes(q) ||
      location.includes(q) ||
      tags.includes(q)
    );
  });
};
