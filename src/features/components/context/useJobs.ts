import { useContext } from "react";
import { JobsContext } from "./JobsContext";

export const useJobs = () => {
  const context = useContext(JobsContext);

  if (!context) {
    throw new Error("useJobs must be used inside JobsProvider");
  }

  return context;
};