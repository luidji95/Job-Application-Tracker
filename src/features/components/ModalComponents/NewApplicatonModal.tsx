import "../css/newAplicationModal.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { newJobSchema } from "../../../schemas/newJobSchema";
import type { z } from "zod";

type NewJobData = z.infer<typeof newJobSchema>;

type Props = {
  onClose: () => void;
  onSubmit: (data: NewJobData) => Promise<void> | void;
};

export const NewApplicationModal = ({ onClose, onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<NewJobData>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      company_name: "",
      position: "",
      location: "",
      salary: "",
      tags: "",
      notes: "",
    },
  });

  const handleFormSubmit = async (data: NewJobData) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <h2>New application</h2>
            <p>Add details for a new job you applied for.</p>
          </div>

          <button
            className="modal-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form 
          className="modal-form" 
          onSubmit={handleSubmit(handleFormSubmit)}
        >
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
              {isSubmitting ? "Adding..." : "Add application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};