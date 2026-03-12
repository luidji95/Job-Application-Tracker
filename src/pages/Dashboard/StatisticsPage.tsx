import { useMemo } from "react";
import { useJobs } from "../../features/components/context/useJobs";
import type { StageId } from "../../features/components/StageColumn";
import "./statistics.css";

const STAGE_LABELS: Record<StageId, string> = {
  applied: "Applied",
  "hr-interview": "HR Interview",
  technical: "Technical",
  final: "Final",
  offer: "Offer",
  rejected: "Rejected",
};

export const StatisticsPage = () => {
  const { jobs, isLoading, error } = useJobs();

  const stats = useMemo(() => {
    const totalApplications = jobs.length;

    const rejectedApplications = jobs.filter(
      (job) => job.status === "rejected" || job.stage === "rejected"
    ).length;

    const activeApplications = jobs.filter(
      (job) => job.status === "active"
    ).length;

    const stageBreakdown: Record<StageId, number> = {
      applied: 0,
      "hr-interview": 0,
      technical: 0,
      final: 0,
      offer: 0,
      rejected: 0,
    };

    for (const job of jobs) {
      stageBreakdown[job.stage] += 1;
    }

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
      activeApplications,
      rejectedApplications,
      mostCommonRejectionStage,
      highestRejectCount,
      stageBreakdown,
    };
  }, [jobs]);

  if (isLoading) {
    return <div className="statistics-page">Loading statistics...</div>;
  }

  if (error) {
    return <div className="statistics-page">Error: {error}</div>;
  }

  return (
    <div className="statistics-page">
      <div className="statistics-header">
        <h1>Statistics</h1>
        <p>Quick overview of your application pipeline.</p>
      </div>

      <div className="statistics-grid">
        <div className="stat-card">
          <h3>Total applications</h3>
          <p>{stats.totalApplications}</p>
        </div>

        <div className="stat-card">
          <h3>Active applications</h3>
          <p>{stats.activeApplications}</p>
        </div>

        <div className="stat-card">
          <h3>Rejected applications</h3>
          <p>{stats.rejectedApplications}</p>
        </div>

        <div className="stat-card">
          <h3>Most common rejection stage</h3>
          <p>
            {stats.mostCommonRejectionStage
              ? `${STAGE_LABELS[stats.mostCommonRejectionStage]} (${stats.highestRejectCount})`
              : "No rejected applications yet"}
          </p>
        </div>
      </div>

      <div className="statistics-section">
        <h2>Stage breakdown</h2>

        <div className="stage-breakdown-list">
          {(Object.keys(stats.stageBreakdown) as StageId[]).map((stage) => (
            <div key={stage} className="stage-breakdown-item">
              <span>{STAGE_LABELS[stage]}</span>
              <strong>{stats.stageBreakdown[stage]}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};