import "./css/stageColumn.css";
import { Plus } from "lucide-react";
import { CompanyCard } from "./CompanyCard";

type StatusVariant = "active" | "accepted" | "rejected";

export type StageId =
  | "applied"
  | "hr-interview"
  | "technical"
  | "final"
  | "offer"
  | "rejected";

export type JobType = {
  id: string;
  company_name: string;
  position: string;
  stage: StageId;
  applied_date: string;
  status: StatusVariant;

  rejected_from_stage?: StageId | null;
  accepted_at?: string;

  salary?: string;
  location?: string;
  tags?: string[];
  notes?: string;
};

type StageOption = {
  id: StageId;
  title: string;
};

type StageColumnProps = {
  id: StageId;
  title: string;
  color: string;
  jobs: JobType[];

  onAddJob?: (stageId: StageId) => void;
  onMoveJob?: (jobId: string, toStage: StageId) => void;
  onRestoreJob?: (jobId: string) => void;
  onEditJob?: (jobId: string) => void;
  onDeleteJob?: (jobId: string) => void;

  allStages: StageOption[];

  getJobAction?: (jobId: string) => "move" | "delete" | "restore" | "update" | null;
  isAdding?: boolean;
};

export const StageColumn = ({
  id,
  title,
  color,
  jobs,
  onAddJob,
  onMoveJob,
  onRestoreJob,
  onEditJob,
  onDeleteJob,
  allStages,
  getJobAction,
  isAdding = false,
}: StageColumnProps) => {
  const isApplied = id === "applied";

  return (
    <div className="stage_column" data-stage={id}>
      <div className="stage_column_header" style={{ borderTopColor: color }}>
        <h3>{title}</h3>
        <span className="jobs_column_count">{jobs.length}</span>

        {isApplied && onAddJob && (
          <button
            className="stage_column_add_btn"
            onClick={() => onAddJob(id)}
            title={`Add job to ${title}`}
            aria-label={`Add job to ${title}`}
            type="button"
            disabled={isAdding}
          >
            <Plus />
          </button>
        )}
      </div>

      <div className="stage_column_body">
        {jobs.length === 0 ? (
          <p className="stage_column_empty">No jobs yet</p>
        ) : (
          jobs.map((job) => {
            const action = getJobAction?.(job.id) ?? null;

            const disabled = action !== null;

            const busyLabel =
              action === "delete"
                ? "Deleting..."
                : action === "move"
                ? "Moving..."
                : action === "restore"
                ? "Restoring..."
                : action === "update"
                ? "Saving..."
                : null;

            return (
              <CompanyCard
                key={job.id}
                {...job}
                onMove={onMoveJob}
                onRestore={onRestoreJob}
                onEdit={onEditJob}
                onDelete={onDeleteJob}
                allStages={allStages}
                disabled={disabled}
                busyLabel={busyLabel}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
