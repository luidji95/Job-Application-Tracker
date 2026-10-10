import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "../../features/components/context/useJobs";
import type { StageId } from "../../features/components/StageColumn";
import { computeJobStats } from "../../lib/jobs/jobStats";
import { computeHistoryStats, MIN_SAMPLE } from "../../lib/jobs/historyStats";
import { formatDay, type JobEvent } from "../../lib/jobs/jobHistory";
import { fetchAllEvents } from "../../lib/jobs/jobsApi";
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

// one decimal below ten days, whole days above
const dayCount = (value: number) => {
  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded} ${rounded === 1 ? "day" : "days"}`;
};

const NOT_ENOUGH = "Not enough history yet";

export const StatisticsPage = () => {
  const navigate = useNavigate();
  const { jobs, userId, isLoading, error } = useJobs();

  // null while loading or when the history cannot be read; the page then shows the older numbers
  const [events, setEvents] = useState<JobEvent[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    fetchAllEvents(userId)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {
        if (!cancelled) setEvents(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, jobs]);

  const stats = useMemo(() => computeJobStats(jobs), [jobs]);
  const history = useMemo(
    () => (events ? computeHistoryStats(jobs, events, new Date()) : null),
    [jobs, events]
  );

  if (isLoading) {
    return <div className="page-loading">Loading statistics...</div>;
  }

  if (error) {
    return <div className="statistics-page">Error: {error}</div>;
  }

  // With a history the funnel counts where applications really were;
  // without one it falls back to the furthest stage each application reached.
  const funnel = history
    ? history.funnel
    : {
        total: stats.totalApplications,
        visits: {
          applied: stats.totalApplications,
          "hr-interview": stats.reachedHR,
          technical: stats.reachedTechnical,
          final: stats.reachedFinal,
          offer: stats.reachedOffer,
        },
        pastScreening: stats.reachedHR,
        pastHR: stats.reachedTechnical,
        pastTechnical: stats.reachedFinal,
        offers: stats.reachedOffer,
        screeningPassRate: stats.screeningPassRate,
        hrPassRate: stats.hrPassRate,
        technicalPassRate: stats.technicalPassRate,
        offerConversion: stats.offerConversion,
        recordedJobs: 0,
        assumedJobs: stats.totalApplications,
      };

  const funnelRows = [
    { label: "Applied", value: funnel.visits.applied },
    { label: "HR Interview", value: funnel.visits["hr-interview"] },
    { label: "Technical", value: funnel.visits.technical },
    { label: "Final", value: funnel.visits.final },
    { label: "Offer", value: funnel.visits.offer },
  ];

  const firstResponseKnown =
    history !== null &&
    history.firstResponse.averageDays !== null &&
    history.firstResponse.sample >= MIN_SAMPLE;

  const hasWeeklyActivity = history !== null && history.weeks.some((w) => w.added > 0 || w.responses > 0);

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
          <p>{funnel.total}</p>
          <small>All tracked applications</small>
        </div>

        <div className="stat-card">
          <h3>Screening pass rate</h3>
          <p>{percent(funnel.screeningPassRate)}</p>
          <small>{funnel.pastScreening} got past Applied</small>
        </div>

        <div className="stat-card">
          <h3>HR pass rate</h3>
          <p>{percent(funnel.hrPassRate)}</p>
          <small>{funnel.pastHR} moved beyond HR</small>
        </div>

        <div className="stat-card">
          <h3>Technical pass rate</h3>
          <p>{percent(funnel.technicalPassRate)}</p>
          <small>{funnel.pastTechnical} moved beyond Technical</small>
        </div>

        <div className="stat-card">
          <h3>Offer conversion</h3>
          <p>{percent(funnel.offerConversion)}</p>
          <small>{funnel.offers} reached Offer</small>
        </div>
      </div>

      {history && (
        <div className="statistics-section">
          <h2>Timing</h2>
          <p className="section-subtitle">
            {history.recordedSince
              ? `From what has been recorded since ${formatDay(new Date(`${history.recordedSince}T12:00:00`))}.`
              : "Fills in as your applications move from stage to stage."}
          </p>

          <div className="timing-grid">
            <div className="timing-item">
              <span className="timing-item__label">First response</span>
              <strong className={firstResponseKnown ? "" : "is-empty"}>
                {firstResponseKnown ? dayCount(history.firstResponse.averageDays ?? 0) : NOT_ENOUGH}
              </strong>
              <small>
                {firstResponseKnown
                  ? `on average, from ${history.firstResponse.sample} applications`
                  : `${history.firstResponse.sample} of ${MIN_SAMPLE} answered applications needed`}
              </small>
            </div>

            <div className="timing-item">
              <span className="timing-item__label">Waiting two weeks or more</span>
              <strong>{history.waiting.count}</strong>
              <small>
                {history.waiting.count === 0
                  ? "no application in Applied is that old"
                  : "still in Applied without an answer"}
              </small>
            </div>
          </div>

          {history.waiting.longest.length > 0 && (
            <ul className="waiting-list">
              {history.waiting.longest.map((job) => (
                <li key={job.id}>
                  <span>
                    <strong>{job.company_name}</strong> · {job.position}
                  </span>
                  <span className="waiting-list__days">{job.days} days</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {history && (
        <div className="statistics-section">
          <h2>Time in each stage</h2>
          <p className="section-subtitle">
            Average length of stages that have ended. A stage an application is still in is not
            counted.
          </p>

          {history.stageDurations.length === 0 ? (
            <p className="stats-empty">{NOT_ENOUGH}. It appears after the first application moves on.</p>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th scope="col">Stage</th>
                  <th scope="col" className="num">
                    Average
                  </th>
                  <th scope="col" className="num">
                    Based on
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.stageDurations.map((row) => (
                  <tr key={row.stage}>
                    <th scope="row">{STAGE_LABELS[row.stage]}</th>
                    <td className="num">{dayCount(row.averageDays)}</td>
                    <td className="num muted">
                      {row.sample} {row.sample === 1 ? "application" : "applications"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {history && (
        <div className="statistics-section">
          <h2>Last eight weeks</h2>
          <p className="section-subtitle">
            Applications you added, and moves or rejections that followed, by week.
          </p>

          {!hasWeeklyActivity ? (
            <p className="stats-empty">Nothing was added or moved in the last eight weeks.</p>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th scope="col">Week of</th>
                  <th scope="col" className="num">
                    Added
                  </th>
                  <th scope="col" className="num">
                    Responses
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.weeks.map((week) => (
                  <tr key={week.start}>
                    <th scope="row">{week.label}</th>
                    <td className={`num ${week.added === 0 ? "muted" : ""}`}>{week.added}</td>
                    <td className={`num ${week.responses === 0 ? "muted" : ""}`}>{week.responses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

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
          {history && funnel.recordedJobs > 0
            ? `How many applications were in each stage. ${funnel.recordedJobs} ${
                funnel.recordedJobs === 1 ? "path was" : "paths were"
              } recorded${
                funnel.assumedJobs > 0
                  ? `; for ${funnel.assumedJobs} older ${
                      funnel.assumedJobs === 1 ? "application" : "applications"
                    } the earlier stages are assumed.`
                  : "."
              }`
            : "Based on the furthest stage each application reached."}
        </p>

        <div className="stage-breakdown-list">
          {funnelRows.map((row) => (
            <div className="stage-breakdown-item" key={row.label}>
              <span>{row.label}</span>
              <div className="stage-breakdown-bar">
                <i
                  style={{
                    width: `${funnel.total > 0 ? (row.value / funnel.total) * 100 : 0}%`,
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
