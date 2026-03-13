import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "../../features/components/context/useJobs";
import type { StageId, JobType } from "../../features/components/StageColumn";
import "./statistics.css";

const STAGE_LABELS: Record<StageId, string> = {
  applied: "Applied",
  "hr-interview": "HR Interview",
  technical: "Technical",
  final: "Final",
  offer: "Offer",
  rejected: "Rejected",
};

const percent = (value: number) => `${Math.round(value)}%`;

// istorijski funnel stage
const getPipelineStage = (job: JobType): StageId => {
  if (job.stage === "rejected" && job.rejected_from_stage) {
    return job.rejected_from_stage;
  }

  return job.stage;
};

export const StatisticsPage = () => {
  const navigate = useNavigate();
  const { jobs, isLoading, error } = useJobs();

  const stats = useMemo(() => {
    const totalApplications = jobs.length;

    // istorijski funnel
    const pipelineStages = jobs.map(getPipelineStage);

    const reachedHR = pipelineStages.filter(
      (stage) =>
        stage === "hr-interview" ||
        stage === "technical" ||
        stage === "final" ||
        stage === "offer"
    ).length;

    const reachedTechnical = pipelineStages.filter(
      (stage) =>
        stage === "technical" || stage === "final" || stage === "offer"
    ).length;

    const reachedFinal = pipelineStages.filter(
      (stage) => stage === "final" || stage === "offer"
    ).length;

    const reachedOffer = pipelineStages.filter(
      (stage) => stage === "offer"
    ).length;

    // trenutni status
    const rejectedCount = jobs.filter(
      (job) => job.status === "rejected"
    ).length;

    const currentlyInApplied = jobs.filter(
      (job) => job.stage === "applied" && job.status === "active"
    ).length;

    // stope
    const screeningPassRate =
      totalApplications > 0 ? (reachedHR / totalApplications) * 100 : 0;

    const hrPassRate =
      reachedHR > 0 ? (reachedTechnical / reachedHR) * 100 : 0;

    const technicalPassRate =
      reachedTechnical > 0 ? (reachedFinal / reachedTechnical) * 100 : 0;

    const offerConversion =
      totalApplications > 0 ? (reachedOffer / totalApplications) * 100 : 0;

    // stage breakdown (istorijski funnel)
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
      screeningPassRate,
      hrPassRate,
      technicalPassRate,
      offerConversion,
      stageBreakdown,
      mostCommonRejectionStage,
      highestRejectCount,
    };
  }, [jobs]);

  if (isLoading) {
    return <div className="statistics-page">Loading...</div>;
  }

  if (error) {
    return <div className="statistics-page">Error: {error}</div>;
  }

  return (
    <div className="statistics-page">
      <span className="stats-back" onClick={() => navigate("/dashboard")}>
        ← Back to Kanban
      </span>

      <div className="statistics-header">
        <h1>Statistics</h1>
        <p>Insights from your job search pipeline.</p>
      </div>

      <div className="statistics-grid">
        <div className="stat-card">
          <h3>Total applications</h3>
          <p>{stats.totalApplications}</p>
          <small>All tracked applications</small>
        </div>

        <div className="stat-card">
          <h3>Screening pass rate</h3>
          <p>{percent(stats.screeningPassRate)}</p>
          <small>{stats.reachedHR} reached HR or later</small>
        </div>

        <div className="stat-card">
          <h3>HR pass rate</h3>
          <p>{percent(stats.hrPassRate)}</p>
          <small>{stats.reachedTechnical} moved beyond HR</small>
        </div>

        <div className="stat-card">
          <h3>Technical pass rate</h3>
          <p>{percent(stats.technicalPassRate)}</p>
          <small>{stats.reachedFinal} moved beyond Technical</small>
        </div>

        <div className="stat-card">
          <h3>Offer conversion</h3>
          <p>{percent(stats.offerConversion)}</p>
          <small>{stats.reachedOffer} reached Offer</small>
        </div>
      </div>

      <div className="statistics-section">
        <h2>Insights</h2>

        <div className="insight-item">
          <strong>Most common rejection stage:</strong>{" "}
          {stats.mostCommonRejectionStage
            ? STAGE_LABELS[stats.mostCommonRejectionStage]
            : "No rejected applications yet"}
        </div>

        <div className="insight-item">
          <strong>Applications currently waiting in Applied:</strong>{" "}
          {stats.currentlyInApplied}
        </div>

        <div className="insight-item">
          <strong>Rejected applications:</strong> {stats.rejectedCount}
        </div>
      </div>

      <div className="statistics-section">
        <h2>Recruitment Funnel</h2>
        <p className="section-subtitle">
          Based on the highest stage each application reached.
        </p>

        <div className="stage-breakdown-list">
          <div className="stage-breakdown-item">
            <span>Applied</span>
            <strong>{stats.totalApplications}</strong>
          </div>

          <div className="stage-breakdown-item">
            <span>HR Interview</span>
            <strong>{stats.reachedHR}</strong>
          </div>

          <div className="stage-breakdown-item">
            <span>Technical</span>
            <strong>{stats.reachedTechnical}</strong>
          </div>

          <div className="stage-breakdown-item">
            <span>Final</span>
            <strong>{stats.reachedFinal}</strong>
          </div>

          <div className="stage-breakdown-item">
            <span>Offer</span>
            <strong>{stats.reachedOffer}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};