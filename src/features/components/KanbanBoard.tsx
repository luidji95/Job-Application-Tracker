import { useState } from "react";
import "./css/kanbanBoard.css";
import { DUMMY_JOBS } from "../../data/dummyData";
import { DEFAULT_STAGES } from "../../data/dummyData";
import { StageColumn, type JobType, type StageId } from "./StageColumn";

export const KanbanBoard = () => {
  const [jobs, setJobs] = useState<JobType[]>(DUMMY_JOBS);

  const moveJob = (jobId: string, toStage: StageId) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== jobId) return job;

        const fromStage = job.stage;

        if (toStage === "rejected") {
          return {
            ...job,
            stage: "rejected",
            status: "rejected",
            rejectedFromStage: fromStage,
          };
        }

        if (fromStage === "rejected") {
          return {
            ...job,
            stage: toStage,
            status: "active",
            rejectedFromStage: null,
          };
        }

        return {
          ...job,
          stage: toStage,
        };
      })
    );
  };

  const restoreJob = (jobId: string) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== jobId) return job;
        if (job.stage !== "rejected") return job;

        const backTo = job.rejectedFromStage ?? "applied";

        return {
          ...job,
          stage: backTo,
          status: "active",
          rejectedFromStage: null,
        };
      })
    );
  };

  return (
    <div className="kanban-board">
      {DEFAULT_STAGES.map((s) => (
        <StageColumn
          key={s.id}
          id={s.id}
          title={s.title}
          color={s.color}
          jobs={jobs.filter((job) => job.stage === s.id)}
          onAddJob={(stageId) => console.log("Add job to:", stageId)}
          onMoveJob={moveJob}
          onRestoreJob={restoreJob}
          allStages={DEFAULT_STAGES}
        />
      ))}
    </div>
  );
};
