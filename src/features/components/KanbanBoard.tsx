import { useEffect, useMemo, useState } from "react";
import "./css/kanbanBoard.css";

import { DEFAULT_STAGES } from "../../data/dummyData";
import { StageColumn, type JobType, type StageId } from "./StageColumn";
import { NotesPopover } from "./NotesPopover";
import { AiInsightModal } from "./AiInsightModal";
import { useJobs } from "./context/useJobs";

import { toast } from "sonner";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ApplicationModal } from "./ModalComponents/ApplicationModal";
import { ConfirmModal } from "./ModalComponents/ConfirmModal";

import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../../pages/Dashboard/DashboardLayout";

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

type ConfirmType = { type: "delete-one"; jobId: string } | null;

type SearchResult = {
  id: string;
  company_name: string;
  position: string;
  stage: string;
};

type AiStateProps =
  | {
      jobId: string;
    }
  | null;

export const KanbanBoard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingJob, setEditingJob] = useState<JobType | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionState>(null);
  const [notesState, setNotesState] = useState<NotesStateProps>(null);
  const [confirm, setConfirm] = useState<ConfirmType>(null);
  const [aiState, setAiState] = useState<AiStateProps>(null);

  const {
    searchValue,
    activeJobId,
    onSearchResultsChange,
    onJumpHandled,
  } = useOutletContext<DashboardOutletContext>();

  const {
    jobs,
    isLoading,
    addJob,
    editJob,
    deleteJob,
    moveJob,
    restoreJob,
  } = useJobs();

  const getJobAction = (jobId: string): CardActionType | null => {
    if (!action) return null;
    if (action.type === "add") return null;
    return action.jobId === jobId ? action.type : null;
  };

  const isAdding = action?.type === "add";
  const isConfirmBusy = action?.type === "delete";

  const filteredJobs = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return jobs;

    return jobs.filter((j) => {
      const company = (j.company_name ?? "").toLowerCase();
      const position = (j.position ?? "").toLowerCase();
      const location = (j.location ?? "").toLowerCase();
      const tags = (j.tags ?? []).join(" ").toLowerCase();

      return (
        company.includes(q) ||
        position.includes(q) ||
        location.includes(q) ||
        tags.includes(q)
      );
    });
  }, [jobs, searchValue]);

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchValue.trim();
    if (!q) return [];

    return filteredJobs.slice(0, 8).map((j) => ({
      id: j.id,
      company_name: j.company_name,
      position: j.position,
      stage: j.stage,
    }));
  }, [filteredJobs, searchValue]);

  useEffect(() => {
    onSearchResultsChange(searchResults);
  }, [searchResults, onSearchResultsChange]);

  useEffect(() => {
    if (!activeJobId) return;

    const el = document.getElementById(`job-${activeJobId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const t = window.setTimeout(() => {
      onJumpHandled();
    }, 1400);

    return () => window.clearTimeout(t);
  }, [activeJobId, onJumpHandled]);

  const handleMoveJob = async (jobId: string, toStage: StageId) => {
    try {
      setError(null);
      setAction({ type: "move", jobId });

      await moveJob(jobId, toStage);
      toast.success("Application moved");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to move application";
      setError(message);
      toast.error(message);
    } finally {
      setAction(null);
    }
  };

  const handleRestoreJob = async (jobId: string) => {
    try {
      setError(null);
      setAction({ type: "restore", jobId });

      await restoreJob(jobId);
      toast.success(
        "Application successfully restored to stage where it was rejected from"
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to restore application";
      setError(message);
      toast.error(message);
    } finally {
      setAction(null);
    }
  };

  const handleAddJob = async (jobData: NewJobData) => {
    try {
      setError(null);
      setAction({ type: "add" });

      await addJob(jobData);

      toast.success("Successfully added new application!");
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

  const requestDeleteJob = (jobId: string) => {
    setConfirm({ type: "delete-one", jobId });
  };

  const openEditJob = (jobId: string) => {
    const jobToEdit = jobs.find((job) => job.id === jobId);
    if (!jobToEdit) return;

    setModalMode("edit");
    setEditingJob(jobToEdit);
    setModalOpen(true);
  };

  const handleUpdateSubmit = async (data: NewJobData) => {
    if (!editingJob) return;

    try {
      setError(null);
      setAction({ type: "update", jobId: editingJob.id });

      await editJob(editingJob.id, data);

      toast.success("Successfully edited");
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

  const handleOpenNotes = (jobId: string, anchorRect: DOMRect) => {
    setNotesState({ jobId, anchorRect });
  };

  const handleOpenAi = (jobId: string) => {
    setAiState({ jobId });
  };

  const selectedNotesJob = notesState
    ? jobs.find((j) => j.id === notesState.jobId)
    : null;

  const selectedAiJob = aiState
    ? jobs.find((j) => j.id === aiState.jobId)
    : null;

  const handleConfirmDelete = async () => {
    if (!confirm) return;

    try {
      setError(null);
      setAction({ type: "delete", jobId: confirm.jobId });

      await deleteJob(confirm.jobId);
      toast.success("Application deleted");
      setConfirm(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Delete failed";
      setError(message);
      toast.error(message);
    } finally {
      setAction(null);
    }
  };

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
            jobs={filteredJobs.filter((job) => job.stage === s.id)}
            onAddJob={() => {
              setModalMode("create");
              setEditingJob(null);
              setModalOpen(true);
            }}
            onMoveJob={handleMoveJob}
            onRestoreJob={handleRestoreJob}
            onEditJob={openEditJob}
            onDeleteJob={requestDeleteJob}
            allStages={DEFAULT_STAGES}
            getJobAction={getJobAction}
            isAdding={isAdding}
            onOpenNotes={handleOpenNotes}
            onOpenAi={handleOpenAi}
            activeJobId={activeJobId}
          />
        ))}
      </div>

      {notesState && selectedNotesJob && (
        <NotesPopover
          anchorRect={notesState.anchorRect}
          companyName={selectedNotesJob.company_name}
          notes={selectedNotesJob.notes ?? ""}
          onClose={() => setNotesState(null)}
        />
      )}

      {aiState && selectedAiJob && (
        <AiInsightModal
          companyName={selectedAiJob.company_name}
          position={selectedAiJob.position}
          onClose={() => setAiState(null)}
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
          onSubmit={modalMode === "create" ? handleAddJob : handleUpdateSubmit}
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