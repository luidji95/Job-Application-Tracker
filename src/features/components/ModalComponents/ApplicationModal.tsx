import "../css/newAplicationModal.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { DefaultValues } from "react-hook-form";
import { newJobSchema } from "../../../schemas/newJobSchema";
import type { z } from "zod";
import type { JobType } from "../StageColumn";
import { useMemo } from "react";


import { normalizeTags } from "../../../lib/jobs/jobUtils";

import "../css/newAplicationModal.css"

type NewJobData = z.infer<typeof newJobSchema>;

type Props = {
  mode: "create" | "edit";
  initialValues?: JobType | null;

  onClose: () => void;
  onSubmit: (data: NewJobData) => Promise<void> | void;
};

export const ApplicationModal = ({
  onClose,
  onSubmit,
  mode,
  initialValues,
}: Props) => {


  const defaultValues = useMemo<DefaultValues<NewJobData>>(() => {
  if (mode === "edit" && initialValues) {
    return {
      company_name: initialValues.company_name ?? "",
      position: initialValues.position ?? "",
      location: initialValues.location ?? "",
      salary: initialValues.salary ?? "",
      tags: normalizeTags(initialValues.tags).join(", "),
      notes: initialValues.notes ?? "",
    };
  }

  return {
    company_name: "",
    position: "",
    location: "",
    salary: "",
    tags: "",
    notes: "",
  };
}, [mode, initialValues]);


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<NewJobData>({
    resolver: zodResolver(newJobSchema),
    defaultValues,
  });

  // RHF ne update-uje defaultValues sam -> reset kad se promene propsi
  useEffect(() => {
    reset(defaultValues);
  }, [reset, mode, defaultValues]); 

  const handleFormSubmit = async (data: NewJobData) => {
    await onSubmit(data);

    if (mode === "create") reset(); // za edit nema potrebe
    onClose();
  };

  const title = mode === "create" ? "New application" : "Edit application";
  const description =
    mode === "create"
      ? "Add details for a new job you applied for."
      : `Update details for ${initialValues?.company_name ?? "this application"}.`;

  const submitText = mode === "create" ? "Add application" : "Save changes";
  const submittingText = mode === "create" ? "Adding..." : "Saving...";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <button
            className="modal-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="form-grid">
            <div className="field">
              <label>Company</label>
              <input
                type="text"
                placeholder="e.g. Microsoft"
                {...register("company_name")}
              />
              {errors.company_name && (
                <span className="field-error">{errors.company_name.message}</span>
              )}
            </div>

            <div className="field">
              <label>Position</label>
              <input
                type="text"
                placeholder="e.g. Frontend Developer"
                {...register("position")}
              />
              {errors.position && (
                <span className="field-error">{errors.position.message}</span>
              )}
            </div>

            <div className="field">
              <label>Location</label>
              <input
                type="text"
                placeholder="e.g. Belgrade / Remote"
                {...register("location")}
              />
            </div>

            <div className="field">
              <label>Salary</label>
              <input
                type="text"
                placeholder="e.g. 2000€ / 60k"
                {...register("salary")}
              />
            </div>

            <div className="field field-full">
              <label>Tags</label>
              <input
                type="text"
                placeholder="e.g. remote, react, referral"
                {...register("tags")}
              />
              <p className="field-hint">Separate with commas</p>
            </div>

            <div className="field field-full">
              <label>Notes</label>
              <textarea
                rows={4}
                placeholder="Links, recruiter name, next steps, etc."
                {...register("notes")}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? submittingText : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
