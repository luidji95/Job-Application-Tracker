import "./css/stageColumn.css";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
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

  // what to do next and when (YYYY-MM-DD), and the link to the job ad
  next_step?: string;
  next_step_date?: string;
  job_url?: string;
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
  onOpenNotes?: (jobId: string, anchorRect: DOMRect) => void;
  onOpenAi?: (jobId: string) => void;
  onCompleteStep?: (jobId: string) => void;
  onOpenHistory?: (jobId: string) => void;
  // job id -> when the job entered its current stage
  stageSince?: Record<string, string>;

  allStages: StageOption[];
  getJobAction?: (jobId: string) => "move" | "delete" | "restore" | "update" | null;
  isAdding?: boolean;
  activeJobId?: string | null;
  // stage of the card being dragged right now, or null when nothing is dragged
  draggedFromStage?: StageId | null;
};

const EMPTY_TEXT: Record<StageId, string> = {
  applied: "No applications yet. Add the first one.",
  "hr-interview": "Nothing here yet. Move a card when you get the call.",
  technical: "Nothing here yet. Move a card when you get to this round.",
  final: "Nothing here yet. Move a card when you get to this round.",
  offer: "No offers yet.",
  rejected: "No rejections.",
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
  onOpenNotes,
  onOpenAi,
  onCompleteStep,
  onOpenHistory,
  stageSince,
  activeJobId,
  draggedFromStage = null,
}: StageColumnProps) => {
  const isApplied = id === "applied";

  const { setNodeRef, isOver } = useDroppable({ id });
  // dropping a card on the column it is already in does nothing, so don't invite it
  const isDropTarget = isOver && draggedFromStage !== null && draggedFromStage !== id;

  return (
    <section
      ref={setNodeRef}
      className={`stage_column ${isDropTarget ? "is-drop-target" : ""}`}
      id={`stage-${id}`}
      data-stage={id}
    >
      <div className="stage_column_header">
        <span className="stage_column_dot" style={{ background: color }} />
        <h3>{title}</h3>
        <span className="jobs_column_count">{jobs.length}</span>
      </div>

      <div className="stage_column_body">
        {jobs.length === 0 ? (
          <p className="stage_column_empty">{EMPTY_TEXT[id]}</p>
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
                onOpenNotes={onOpenNotes}
                onOpenAi={onOpenAi}
                onCompleteStep={onCompleteStep}
                onOpenHistory={onOpenHistory}
                stageSince={stageSince?.[job.id]}
                allStages={allStages}
                disabled={disabled}
                busyLabel={busyLabel}
                isActive={activeJobId === job.id}
              />
            );
          })
        )}
      </div>

      {isApplied && onAddJob && (
        <button
          type="button"
          className="stage_column_add"
          disabled={isAdding}
          onClick={() => onAddJob(id)}
        >
          <Plus size={15} aria-hidden="true" />
          Add
        </button>
      )}
    </section>
  );
};
