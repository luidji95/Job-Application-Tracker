import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "../../features/components/context/useJobs";
import type { StageId } from "../../features/components/StageColumn";
import { computeJobStats } from "../../lib/jobs/jobStats";
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

export const StatisticsPage = () => {
  const navigate = useNavigate();
  const { jobs, isLoading, error } = useJobs();

  const stats = useMemo(() => computeJobStats(jobs), [jobs]);

  if (isLoading) {
    return <div className="page-loading">Loading statistics...</div>;
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
          {[
            { label: "Applied", value: stats.totalApplications },
            { label: "HR Interview", value: stats.reachedHR },
            { label: "Technical", value: stats.reachedTechnical },
            { label: "Final", value: stats.reachedFinal },
            { label: "Offer", value: stats.reachedOffer },
          ].map((row) => (
            <div className="stage-breakdown-item" key={row.label}>
              <span>{row.label}</span>
              <div className="stage-breakdown-bar">
                <i
                  style={{
                    width: `${
                      stats.totalApplications > 0
                        ? (row.value / stats.totalApplications) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};