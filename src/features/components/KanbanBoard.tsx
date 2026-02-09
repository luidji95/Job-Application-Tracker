import { useEffect, useState, useCallback } from "react";
import "./css/kanbanBoard.css";

import { DEFAULT_STAGES } from "../../data/dummyData";
import { StageColumn, type JobType, type StageId } from "./StageColumn";
import { NotesPopover } from "./NotesPopover";

import { supabase } from "../../lib/supabaseClient";
import {
  fetchJobs,
  createJob,
  updateJob,
  deleteJobDb,
  moveJobDb,
  restoreJobDb,
} from "../../lib/jobs/jobsApi";

import { toast } from "sonner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";

import { ApplicationModal } from "./ModalComponents/ApplicationModal";
import { ConfirmModal } from "./ModalComponents/ConfirmModal";

// Tip za podatke iz modala
type NewJobData = {
  company_name: string;
  position: string;
  location?: string;
  salary?: string;
  tags?: string;
  notes?: string;
};

type CardActionType = "move" | "delete" | "restore" | "update";
type ActionState =
  | { type: "add" }
  | { type: CardActionType; jobId: string }
  | null;

type NotesStateProps =
  | {
      jobId: string;
      anchorRect: DOMRect;
    }
  | null;

type ConfirmType =
  | { type: "delete-one"; jobId: string }
  | null;

export const KanbanBoard = () => {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingJob, setEditingJob] = useState<JobType | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState<ActionState>(null);

  const [notesState, setNotesState] = useState<NotesStateProps>(null);

  const [confirm, setConfirm] = useState<ConfirmType>(null);

  const getJobAction = (jobId: string): CardActionType | null => {
    if (!action) return null;
    if (action.type === "add") return null;
    return action.jobId === jobId ? action.type : null;
  };

  const isAdding = action?.type === "add";
  const isConfirmBusy = action?.type === "delete";

  // Helper: refetch jobs (single source of truth)
  const refetch = useCallback(async (uid: string) => {
    const data = await fetchJobs(uid);
    setJobs(data ?? []);
  }, []);

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
    };

    loadUser();
  }, []);

  // Kad userId postoji povuci jobs iz baze
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

  // MOVE (persist u DB + refetch)
  const moveJob = async (jobId: string, toStage: StageId) => {
    if (!userId) return;

    const current = jobs.find((j) => j.id === jobId);
    if (!current) return;

    try {
      setError(null);
      setAction({ type: "move", jobId });

      await moveJobDb(userId, current, toStage);
      toast.success("Application moved");

      await refetch(userId);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to move application";
      setError(message);
      toast.error(message);
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
      setAction({ type: "restore", jobId });

      await restoreJobDb(userId, current);
      toast.success(
        "Applicaton successfully restored to stage where it was rejected from"
      );

      await refetch(userId);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to restore application";
      setError(message);
      toast.error(message);
    } finally {
      setAction(null);
    }
  };

  // ADD (insert u DB + refetch)
  const addJob = async (jobData: NewJobData) => {
    if (!userId) return;

    try {
      setError(null);
      setAction({ type: "add" });

      await createJob(userId, {
        company: jobData.company_name,
        position: jobData.position,
        location: jobData.location,
        salary: jobData.salary,
        tags: jobData.tags,
        notes: jobData.notes,
      });

      toast.success("Successfully added new application!");
      await refetch(userId);

      setModalOpen(false);
      setEditingJob(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create job";
      setError(message);
      toast.error(message);
    } finally {
      setAction(null);
    }
  };

  // DELETE ONE: samo otvori confirm modal
  const requestDeleteJob = (jobId: string) => {
    setConfirm({ type: "delete-one", jobId });
  };

  // EDIT open (otvara isti modal)
  const editJob = (jobId: string) => {
    const jobToEdit = jobs.find((job) => job.id === jobId);
    if (!jobToEdit) return;

    setModalMode("edit");
    setEditingJob(jobToEdit);
    setModalOpen(true);
  };

  // UPDATE (update u DB + refetch)
  const handleUpdateSubmit = async (data: NewJobData) => {
    if (!userId || !editingJob) return;

    try {
      setError(null);
      setAction({ type: "update", jobId: editingJob.id });

      await updateJob(userId, editingJob.id, {
        company: data.company_name,
        position: data.position,
        location: data.location,
        salary: data.salary,
        tags: data.tags,
        notes: data.notes,
      });

      toast.success("Successfully edited");
      await refetch(userId);

      setModalOpen(false);
      setEditingJob(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update job";
      setError(message);
      toast.error(message);
    } finally {
      setAction(null);
    }
  };

  // Notes
  const hanldeOpenNotes = (jobId: string, anchorRect: DOMRect) => {
    setNotesState({ jobId, anchorRect });
  };

  const selectedJob = notesState
    ? jobs.find((j) => j.id === notesState.jobId)
    : null;

  // CONFIRM delete-one
  const handleConfirmDelete = async () => {
    if (!userId || !confirm) return;

    try {
      setError(null);
      setAction({ type: "delete", jobId: confirm.jobId });

      await deleteJobDb(userId, confirm.jobId);
      toast.success("Application deleted");

      await refetch(userId);
      setConfirm(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Delete failed";
      setError(message);
      toast.error(message);
    } finally {
      setAction(null);
    }
  };

  // UI guard - loading/error
  if (isLoading) {
    return <div className="kanban-board">Loading jobs...</div>;
  }

  return (
    <>
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <div className="kanban-board">
        {DEFAULT_STAGES.map((s) => (
          <StageColumn
            key={s.id}
            id={s.id}
            title={s.title}
            color={s.color}
            jobs={jobs.filter((job) => job.stage === s.id)}
            onAddJob={() => {
              setModalMode("create");
              setEditingJob(null);
              setModalOpen(true);
            }}
            onMoveJob={moveJob}
            onRestoreJob={restoreJob}
            onEditJob={editJob}
            onDeleteJob={requestDeleteJob}
            allStages={DEFAULT_STAGES}
            getJobAction={getJobAction}
            isAdding={isAdding}
            onOpenNotes={hanldeOpenNotes}
          />
        ))}
      </div>

      {notesState && selectedJob && (
        <NotesPopover
          anchorRect={notesState.anchorRect}
          companyName={selectedJob.company_name}
          notes={selectedJob.notes ?? ""}
          onClose={() => setNotesState(null)}
        />
      )}

      {modalOpen && (
        <ApplicationModal
          mode={modalMode}
          initialValues={editingJob}
          onClose={() => {
            setModalOpen(false);
            setEditingJob(null);
          }}
          onSubmit={modalMode === "create" ? addJob : handleUpdateSubmit}
        />
      )}

      {confirm && (
        <ConfirmModal
          title="Delete this application?"
          description="This will permanently delete this application. This cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          danger
          isLoading={isConfirmBusy}
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};
