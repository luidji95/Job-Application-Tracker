import { useState } from "react";
import "./css/kanbanBoard.css";
import { DUMMY_JOBS } from "../../data/dummyData";
import { DEFAULT_STAGES } from "../../data/dummyData";
import { StageColumn, type JobType, type StageId } from "./StageColumn";
import { NewApplicationModal } from "./ModalComponents/NewApplicatonModal";
import { EditApplicationModal } from "./ModalComponents/EditApplicationModal"; // DODAJ OVAJ IMPORT

// Tip za podatke iz modala
type NewJobData = {
  company: string;
  position: string;
  location?: string;
  salary?: string;
  tags?: string;
  notes?: string;
};

export const KanbanBoard = () => {
  const [jobs, setJobs] = useState<JobType[]>(DUMMY_JOBS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);

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

  // ADD: Funkcija za dodavanje nove prijave
  const addJob = (jobData: NewJobData) => {
    const newJob: JobType = {
      id: Date.now().toString(),
      companyName: jobData.company,
      position: jobData.position,
      location: jobData.location || undefined,
      salary: jobData.salary || undefined,
      tags: jobData.tags 
        ? jobData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : undefined,
      stage: 'applied',
      status: 'active',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    setJobs(prev => [...prev, newJob]);
    setModalOpen(false);
  };

  // DELETE: Funkcija za brisanje prijave
  const deleteJob = (jobId: string) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      setJobs(prev => prev.filter(job => job.id !== jobId));
    }
  };

  // EDIT: Funkcija za otvaranje edit modala
  const editJob = (jobId: string) => {
    const jobToEdit = jobs.find(job => job.id === jobId);
    if (jobToEdit) {
      setEditingJob(jobToEdit);
      setEditModalOpen(true);
    }
  };

  // UPDATE: Funkcija za ažuriranje prijave
  const updateJob = (jobId: string, updatedData: NewJobData) => {
    setJobs(prevJobs =>
      prevJobs.map(job => {
        if (job.id !== jobId) return job;
        
        return {
          ...job,
          companyName: updatedData.company,
          position: updatedData.position,
          location: updatedData.location || undefined,
          salary: updatedData.salary || undefined,
          tags: updatedData.tags 
            ? updatedData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            : undefined,
        };
      })
    );
    setEditModalOpen(false);
    setEditingJob(null);
  };

  const handleUpdateSubmit = (data: NewJobData) => {
    if (editingJob) {
      updateJob(editingJob.id, data);
    }
  };

  return (
    <>
      <div className="kanban-board">
        {DEFAULT_STAGES.map((s) => (
          <StageColumn
            key={s.id}
            id={s.id}
            title={s.title}
            color={s.color}
            jobs={jobs.filter((job) => job.stage === s.id)}
            onAddJob={() => setModalOpen(true)}
            onMoveJob={moveJob}
            onRestoreJob={restoreJob}
            onEditJob={editJob} // OVDE TREBA editJob, NE updateJob() !!!
            onDeleteJob={deleteJob}
            allStages={DEFAULT_STAGES}
          />
        ))}
      </div>

      {modalOpen && (
        <NewApplicationModal
          onClose={() => setModalOpen(false)}
          onSubmit={addJob}
        />
      )}

      {editModalOpen && editingJob && (
        <EditApplicationModal
          onClose={() => {
            setEditModalOpen(false);
            setEditingJob(null);
          }}
          onSubmit={handleUpdateSubmit}
          job={editingJob}
        />
      )}
    </>
  );
};