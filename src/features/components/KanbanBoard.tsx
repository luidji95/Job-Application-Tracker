import { useEffect, useState } from "react";
import "./css/kanbanBoard.css";

import { DEFAULT_STAGES } from "../../data/dummyData";
import { StageColumn, type JobType, type StageId } from "./StageColumn";
import { NewApplicationModal } from "./ModalComponents/NewApplicatonModal";
import { EditApplicationModal } from "./ModalComponents/EditApplicationModal";

import { supabase } from "../../lib/supabaseClient";
import { fetchJobs } from "../../lib/jobs/jobsApi";

// Tip za podatke iz modala
type NewJobData = {
  company_name: string;
  position: string;
  location?: string;
  salary?: string;
  tags?: string;
  notes?: string;
};

export const KanbanBoard = () => {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ucitavamo userId iz session-a (auth)
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        setError("Not authenticated.");
        setIsLoading(false);
        return;
      }

      setUserId(session.user.id);
      console.log("SESSION USER:", session.user.id);

    };

    loadUser();
  }, []);

  // Kad userId postoji  povuci jobs iz baze
  useEffect(() => {
    if (!userId) return;

    const loadJobs = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const data = await fetchJobs(userId);
        console.log("FETCHED JOBS:", data);


        
        setJobs(data ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [userId]);

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
            rejected_from_stage: fromStage,
          };
        }

        if (fromStage === "rejected") {
          return {
            ...job,
            stage: toStage,
            status: "active",
            rejected_from_stage: null,
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

        const backTo = job.rejected_from_stage ?? "applied";

        return {
          ...job,
          stage: backTo,
          status: "active",
          rejected_from_stage: null,
        };
      })
    );
  };

  //  lokalno dodavanje (za sad)
  const addJob = (jobData: NewJobData) => {
    const newJob: JobType = {
      id: crypto.randomUUID(),
      company_name: jobData.company_name,
      position: jobData.position,
      location: jobData.location || undefined,
      salary: jobData.salary || undefined,
      tags: jobData.tags
        ? jobData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined,
      stage: "applied",
      status: "active",
      applied_date: new Date().toISOString(),
    };

    setJobs((prev) => [newJob, ...prev]);
    setModalOpen(false);
  };

  const deleteJob = (jobId: string) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
    }
  };

  const editJob = (jobId: string) => {
    const jobToEdit = jobs.find((job) => job.id === jobId);
    if (jobToEdit) {
      setEditingJob(jobToEdit);
      setEditModalOpen(true);
    }
  };

  const updateJob = (jobId: string, updatedData: NewJobData) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== jobId) return job;

        return {
          ...job,
          company_name: updatedData.company_name,
          position: updatedData.position,
          location: updatedData.location || undefined,
          salary: updatedData.salary || undefined,
          tags: updatedData.tags
            ? updatedData.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined,
        };
      })
    );
    setEditModalOpen(false);
    setEditingJob(null);
  };

  const handleUpdateSubmit = (data: NewJobData) => {
    if (editingJob) updateJob(editingJob.id, data);
  };

  // UI guard: loading/error
  if (isLoading) {
    return <div className="kanban-board">Loading jobs...</div>;
  }

  if (error) {
    return <div className="kanban-board">Failed to load jobs: {error}</div>;
  }

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
            onEditJob={editJob}
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
