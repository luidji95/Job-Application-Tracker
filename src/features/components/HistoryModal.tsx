import { useEffect, useState } from "react";
import { ArrowRightLeft, CalendarClock } from "lucide-react";

import { fetchJobEvents } from "../../lib/jobs/jobsApi";
import { buildTimeline, type TimelineItem } from "../../lib/jobs/jobHistory";
import type { JobType } from "./StageColumn";

import "./css/newAplicationModal.css";
import "./css/historyModal.css";

type Props = {
  job: JobType;
  onClose: () => void;
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: TimelineItem[] };

// Everything that happened to one application, oldest first.
export const HistoryModal = ({ job, onClose }: Props) => {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetchJobEvents(job.id)
      .then((events) => {
        if (!cancelled) setState({ status: "ready", items: buildTimeline(events) });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "The history could not be loaded.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [job.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const hasInferred = state.status === "ready" && state.items.some((item) => item.inferred);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card history-card">
        <div className="modal-header">
          <div className="modal-title">
            <h2 id="history-title">History</h2>
            <p>
              {job.company_name} · {job.position}
            </p>
          </div>

          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        {state.status === "loading" && <p className="history-note">Loading history...</p>}

        {state.status === "error" && (
          <p className="form-error" role="alert">
            {state.message}
          </p>
        )}

        {state.status === "ready" && state.items.length === 0 && (
          <p className="history-note">Nothing has been recorded for this application yet.</p>
        )}

        {state.status === "ready" && state.items.length > 0 && (
          <ol className="history-list">
            {state.items.map((item) => (
              <li key={item.id} className={`history-item history-item--${item.kind}`}>
                <span className="history-item__icon" aria-hidden="true">
                  {item.kind === "stage" ? <ArrowRightLeft size={14} /> : <CalendarClock size={14} />}
                </span>
                <div className="history-item__body">
                  <strong>{item.title}</strong>
                  {item.detail && <span>{item.detail}</span>}
                </div>
                <time className="history-item__date">{item.date}</time>
              </li>
            ))}
          </ol>
        )}

        {hasInferred && (
          <p className="history-note">
            This application is older than the history. Earlier moves were not recorded, so only
            where it was at that point is shown.
          </p>
        )}
      </div>
    </div>
  );
};
