import type { JobType, StageId } from "../../features/components/StageColumn";

export type JobStats = {
  totalApplications: number;
  reachedHR: number;
  reachedTechnical: number;
  reachedFinal: number;
  reachedOffer: number;
  rejectedCount: number;
  currentlyInApplied: number;
  screeningPassRate: number;
  hrPassRate: number;
  technicalPassRate: number;
  offerConversion: number;
  stageBreakdown: Record<StageId, number>;
  mostCommonRejectionStage: StageId | null;
  highestRejectCount: number;
};

// The furthest stage a job reached. A rejected job counts at the stage it was rejected from.
export const getPipelineStage = (job: JobType): StageId => {
  if (job.stage === "rejected" && job.rejected_from_stage) {
    return job.rejected_from_stage;
  }

  return job.stage;
};

const rate = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

export const computeJobStats = (jobs: JobType[]): JobStats => {
  const totalApplications = jobs.length;

  // historical funnel
  const pipelineStages = jobs.map(getPipelineStage);

  const reachedHR = pipelineStages.filter(
    (stage) =>
      stage === "hr-interview" ||
      stage === "technical" ||
      stage === "final" ||
      stage === "offer"
  ).length;

  const reachedTechnical = pipelineStages.filter(
    (stage) => stage === "technical" || stage === "final" || stage === "offer"
  ).length;

  const reachedFinal = pipelineStages.filter(
    (stage) => stage === "final" || stage === "offer"
  ).length;

  const reachedOffer = pipelineStages.filter((stage) => stage === "offer").length;

  // current state
  const rejectedCount = jobs.filter((job) => job.status === "rejected").length;

  const currentlyInApplied = jobs.filter(
    (job) => job.stage === "applied" && job.status === "active"
  ).length;

  const stageBreakdown: Record<StageId, number> = {
    applied: 0,
    "hr-interview": 0,
    technical: 0,
    final: 0,
    offer: 0,
    rejected: 0,
  };

  for (const stage of pipelineStages) {
    stageBreakdown[stage] += 1;
  }

  // most common rejection stage
  const rejectionStageCount: Partial<Record<StageId, number>> = {};

  for (const job of jobs) {
    if (job.status === "rejected" && job.rejected_from_stage) {
      rejectionStageCount[job.rejected_from_stage] =
        (rejectionStageCount[job.rejected_from_stage] ?? 0) + 1;
    }
  }

  let mostCommonRejectionStage: StageId | null = null;
  let highestRejectCount = 0;

  for (const stage of Object.keys(rejectionStageCount) as StageId[]) {
    const count = rejectionStageCount[stage] ?? 0;
    if (count > highestRejectCount) {
      highestRejectCount = count;
      mostCommonRejectionStage = stage;
    }
  }

  return {
    totalApplications,
    reachedHR,
    reachedTechnical,
    reachedFinal,
    reachedOffer,
    rejectedCount,
    currentlyInApplied,
    screeningPassRate: rate(reachedHR, totalApplications),
    hrPassRate: rate(reachedTechnical, reachedHR),
    technicalPassRate: rate(reachedFinal, reachedTechnical),
    offerConversion: rate(reachedOffer, totalApplications),
    stageBreakdown,
    mostCommonRejectionStage,
    highestRejectCount,
  };
};
