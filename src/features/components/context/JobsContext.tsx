import { createContext } from "react";
import type { JobType, StageId } from "../StageColumn";

type NewJobData = {
  company_name: string;
  position: string;
  location?: string;
  salary?: string;
  tags?: string;
  notes?: string;
};

export type JobsContextValue = {
  userId: string | null;
  jobs: JobType[];
  isLoading: boolean;
  error: string | null;

  refetch: () => Promise<void>;

  addJob: (data: NewJobData) => Promise<void>;
  editJob: (jobId: string, data: NewJobData) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  moveJob: (jobId: string, toStage: StageId) => Promise<void>;
  restoreJob: (jobId: string) => Promise<void>;
};

export const JobsContext = createContext<JobsContextValue | null>(null);