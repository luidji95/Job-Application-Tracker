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
  companyName: string;
  position: string;
  stage: StageId;
  appliedDate: string;
  status: StatusVariant;
  salary?: string;
  location?: string;
  tags?: string[];
};

type StageColumnProps = {
  id: StageId;              // 👈 BITNO: id je stage id
  title: string;
  color: string;
  jobs: JobType[];
  onAddJob?: (stageId: StageId) => void;   // 👈 da znaš u koju kolonu dodaješ
};

export const StageColumn = ({ id, title, color, jobs, onAddJob }: StageColumnProps) => {
  return (
    <div className="stage_column" data-stage={id}>
      <div className="stage_column_header" style={{ borderTopColor: color }}>
        <h3>{title}</h3>
        <span className="jobs_column_count">{jobs.length}</span>

        {onAddJob && (
          <button
            className="stage_column_add_btn"
            onClick={() => onAddJob(id)}
            title={`Add job to ${title}`}
            aria-label={`Add job to ${title}`}
            type="button"
          >
            <Plus />
          </button>
        )}
      </div>

      <div className="stage_column_body">
        {jobs.length === 0 ? (
          <p className="stage_column_empty">No jobs yet</p>
        ) : (
          jobs.map((job) => <CompanyCard key={job.id} {...job} />)
        )}
      </div>
    </div>
  );
};
