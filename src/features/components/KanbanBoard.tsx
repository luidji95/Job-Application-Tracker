import { useState } from "react";
import "./css/kanbanBoard.css";
import { DEFAULT_STAGES, DUMMY_JOBS } from "./dummyData";
import { StageColumn, type JobType, type StageId } from "./StageColumn";

export const KanbanBoard = () => {
  const [jobs, setJobs] = useState<JobType[]>(DUMMY_JOBS);

 const moveJob = (jobId: string, toStage: StageId) => {
  setJobs(prevJobs =>
    prevJobs.map(job => {
      if (job.id !== jobId) return job;

      const fromStage = job.stage;

      // 1️⃣ ulazak u rejected
      if (toStage === "rejected") {
        return {
          ...job,
          stage: "rejected",
          status: "rejected",
          rejectedFromStage: fromStage,
        };
      }

      // 2️⃣ izlazak iz rejected (restore / move)
      if (fromStage === "rejected") {
        return {
          ...job,
          stage: toStage,
          status: "active",
          rejectedFromStage: null,
        };
      }

      // 3️⃣ normalno pomeranje
      return {
        ...job,
        stage: toStage,
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
        />
      ))}
    </div>
  );
};
