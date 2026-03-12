import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  fetchJobs,
  createJob,
  updateJob,
  deleteJobDb,
  moveJobDb,
  restoreJobDb,
} from "../../../lib/jobs/jobsApi";
import type { JobType, StageId } from "../StageColumn";
import { JobsContext, type JobsContextValue } from "./JobsContext";

type NewJobData = {
  company_name: string;
  position: string;
  location?: string;
  salary?: string;
  tags?: string;
  notes?: string;
};

export const JobsProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const refetch = useCallback(async () => {
    if (!userId) return;

    const data = await fetchJobs(userId);
    setJobs(data ?? []);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const loadJobs = async () => {
      try {
        setError(null);
        setIsLoading(true);
        await refetch();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [userId, refetch]);

  const addJob = useCallback(
    async (data: NewJobData) => {
      if (!userId) throw new Error("Not authenticated.");

      await createJob(userId, {
        company: data.company_name,
        position: data.position,
        location: data.location,
        salary: data.salary,
        tags: data.tags,
        notes: data.notes,
      });

      await refetch();
    },
    [userId, refetch]
  );

  const editJob = useCallback(
    async (jobId: string, data: NewJobData) => {
      if (!userId) throw new Error("Not authenticated.");

      await updateJob(userId, jobId, {
        company: data.company_name,
        position: data.position,
        location: data.location,
        salary: data.salary,
        tags: data.tags,
        notes: data.notes,
      });

      await refetch();
    },
    [userId, refetch]
  );

  const deleteJob = useCallback(
    async (jobId: string) => {
      if (!userId) throw new Error("Not authenticated.");

      await deleteJobDb(userId, jobId);
      await refetch();
    },
    [userId, refetch]
  );

  const moveJob = useCallback(
    async (jobId: string, toStage: StageId) => {
      if (!userId) throw new Error("Not authenticated.");

      const current = jobs.find((j) => j.id === jobId);
      if (!current) throw new Error("Job not found.");

      await moveJobDb(userId, current, toStage);
      await refetch();
    },
    [userId, jobs, refetch]
  );

  const restoreJob = useCallback(
    async (jobId: string) => {
      if (!userId) throw new Error("Not authenticated.");

      const current = jobs.find((j) => j.id === jobId);
      if (!current) throw new Error("Job not found.");

      await restoreJobDb(userId, current);
      await refetch();
    },
    [userId, jobs, refetch]
  );

  const value = useMemo<JobsContextValue>(
    () => ({
      userId,
      jobs,
      isLoading,
      error,
      refetch,
      addJob,
      editJob,
      deleteJob,
      moveJob,
      restoreJob,
    }),
    [userId, jobs, isLoading, error, refetch, addJob, editJob, deleteJob, moveJob, restoreJob]
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};