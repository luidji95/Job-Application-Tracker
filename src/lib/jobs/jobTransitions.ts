import type { JobType, StageId } from "../../features/components/StageColumn";

export type StagePatch = {
  stage: StageId;
  status?: JobType["status"];
  rejected_from_stage?: StageId | null;
};

/**
  What changes when a job moves to another stage.

  - TO rejected: status becomes "rejected" and the stage it came from is remembered
  - FROM rejected to any other stage: status becomes "active" and the memory is cleared
  - otherwise only the stage changes; status stays as it was
 */
export const buildMovePatch = (fromStage: StageId, toStage: StageId): StagePatch => {
  if (toStage === "rejected") {
    return {
      stage: "rejected",
      status: "rejected",
      // a job that is already rejected keeps no "rejected from rejected" memory
      rejected_from_stage: fromStage === "rejected" ? null : fromStage,
    };
  }

  if (fromStage === "rejected") {
    return { stage: toStage, status: "active", rejected_from_stage: null };
  }

  return { stage: toStage };
};

/**
  A rejected job goes back to the stage it was rejected from, or to "applied"
  when that stage is not known.
 */
export const buildRestorePatch = (
  job: Pick<JobType, "rejected_from_stage">
): Required<StagePatch> => ({
  stage: job.rejected_from_stage ?? "applied",
  status: "active",
  rejected_from_stage: null,
});

/**
  The list as it looks right after a job is moved, before the server answers.
  Used to show the move immediately; the real data replaces it on refetch.
 */
export const applyMove = (jobs: JobType[], jobId: string, toStage: StageId): JobType[] =>
  jobs.map((job) =>
    job.id === jobId ? { ...job, ...buildMovePatch(job.stage, toStage) } : job
  );
