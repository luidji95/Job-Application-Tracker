import { useEffect, useState, useCallback } from "react";
import "./css/kanbanBoard.css";

import { DEFAULT_STAGES } from "../../data/dummyData";
import { StageColumn, type JobType, type StageId } from "./StageColumn";
import { NewApplicationModal } from "./ModalComponents/NewApplicatonModal";
import { EditApplicationModal } from "./ModalComponents/EditApplicationModal";

import { supabase } from "../../lib/supabaseClient";
import {
  fetchJobs,
  createJob,
  updateJob,
  deleteJobDb,
  moveJobDb,
  restoreJobDb,
} from "../../lib/jobs/jobsApi";





// Tip za podatke iz modala 
type NewJobData = {
  company_name: string;
  position: string;
  location?: string;
  salary?: string;
  tags?: string;
  notes?: string;
};

type ActionType = "move" | "delete" | "restore" | "update";
type ActionState =
  | { type: "add" }
  | { type: ActionType; jobId: string }
  | null;

export const KanbanBoard = () => {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState<ActionState>(null);

  const getJobAction = (jobId: string) : ActionType | null => {
    if(!action) return null;
    if(action.type === 'add') return null;
    return action.jobId === jobId ? action.type : null;
  }

  const isAdding = action?.type === "add";

  // Helper: refetch jobs (single source of truth)
  const refetch = useCallback(async (uid: string) => {
    const data = await fetchJobs(uid);
    setJobs(data ?? []);
  }, []);

  //  Ucitavamo userId iz session-a (auth)
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
    };

    loadUser();
  }, []);

  //  Kad userId postoji povuci jobs iz baze
  useEffect(() => {
    if (!userId) return;

    const loadJobs = async () => {
      try {
        setError(null);
        setIsLoading(true);
        await refetch(userId);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [userId, refetch]);

  //  MOVE (persist u DB + refetch)
  const moveJob = async (jobId: string, toStage: StageId) => {
    if (!userId) return;

    const current = jobs.find((j) => j.id === jobId);
    if (!current) return;

    try {
      setError(null);
      setAction({type: 'move', jobId});


      await moveJobDb(userId, current, toStage);
      await refetch(userId);

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to move job";
      setError(message);
    } finally {
      setAction(null);
    }
  };

  // RESTORE (persist u DB + refetch)
  const restoreJob = async (jobId: string) => {
    if (!userId) return;

    const current = jobs.find((j) => j.id === jobId);
    if (!current) return;

    try {
      setError(null);
      setAction({type: 'restore', jobId});

      await restoreJobDb(userId, current);
      await refetch(userId);

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to restore job";
      setError(message);
    } finally {
      setAction(null);
    }
  };

  //  ADD (insert u DB + refetch)
  const addJob = async (jobData: NewJobData) => {
    if (!userId) return;

    try {
      setError(null);
      setAction({type: 'add'});

      
      await createJob(userId, {
        company: jobData.company_name,
        position: jobData.position,
        location: jobData.location,
        salary: jobData.salary,
        tags: jobData.tags,
        notes: jobData.notes,
      });

      setModalOpen(false);
      await refetch(userId);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create job";
      setError(message);
    } finally {
      setAction(null);
    }
  };

  //  DELETE (delete iz DB + refetch)
  const deleteJob = async (jobId: string) => {
    if (!userId) return;

    const ok = window.confirm("Are you sure you want to delete this application?");
    if (!ok) return;

    try {
      setError(null);
      setAction({type: 'delete', jobId});

      await deleteJobDb(userId, jobId);
      await refetch(userId);

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete job";
      setError(message);
    } finally {
      setAction(null);
    }
  };

  //  EDIT open
  const editJob = (jobId: string) => {
    const jobToEdit = jobs.find((job) => job.id === jobId);
    if (jobToEdit) {
      setEditingJob(jobToEdit);
      setEditModalOpen(true);
    }
  };

  //  UPDATE (update u DB + refetch)
  const handleUpdateSubmit = async (data: NewJobData) => {
    if (!userId || !editingJob) return;

    try {
      setError(null);
      setAction({type: 'update', jobId: editingJob.id})

      await updateJob(userId, editingJob.id, {
        company: data.company_name,
        position: data.position,
        location: data.location,
        salary: data.salary,
        tags: data.tags,
        notes: data.notes,
      });

      setEditModalOpen(false);
      setEditingJob(null);

      await refetch(userId);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update job";
      setError(message);
    } finally {
      setAction(null);
    }
  };

  // UI guard - loading/error
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

            getJobAction={getJobAction}
            isAdding={isAdding}
          />
        ))}
      </div>

      {modalOpen && (
        <NewApplicationModal onClose={() => setModalOpen(false)} onSubmit={addJob} />
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



/**
 * 1️⃣ Mali UX polish (30 min)

Disable dugmad dok traje async (isLoadingAction)

Toast umesto alert

Spinner samo u koloni koja se update-uje (nije must)

2️⃣ Seed UX (optional, ali lepo)

Umesto da seed “ćuti” kad ima poslove:

pokaži poruku tipa
“Seed disabled — you already have jobs. Delete all jobs to seed again.”
 */
