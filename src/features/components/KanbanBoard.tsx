import "./css/kanbanBoard.css";
import { DEFAULT_STAGES, DUMMY_JOBS } from "./dummyData";
import { StageColumn } from "./StageColumn";

export const KanbanBoard = () => {
  return (
    <div className="kanban-board">
      {DEFAULT_STAGES.map((s) => (
        <StageColumn
          key={s.id}
          id={s.id}
          title={s.title}
          color={s.color}
          jobs={DUMMY_JOBS.filter((job) => job.stage === s.id)}  // 👈 OVO JE KLJUČ
          onAddJob={(stageId) => {
            console.log("Add job to:", stageId);
          }}
        />
      ))}
    </div>
  );
};
