import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useJobs } from "./context/useJobs";
import type { JobType } from "./StageColumn";
import "../components/css/aiPopover.css";

type AiInsightResult = {
  focusAreas: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  tips: string[];
};

type AiInsightModalProps = {
  job: JobType;
  onClose: () => void;
};

const parseAiJson = (raw: string) => {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("AI returned invalid format. Try again.");
    }

    const jsonSlice = trimmed.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(jsonSlice);
    } catch {
      throw new Error("AI returned invalid JSON format. Try again.");
    }
  }
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const AiInsightModal = ({ job, onClose }: AiInsightModalProps) => {
  const { editJob } = useJobs();

  const [jobDescription, setJobDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AiInsightResult | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = jobDescription.trim();

    if (!trimmed) {
      setError("Please paste the job description first.");
      return;
    }

    setError(null);
    setSaveMessage(null);
    setIsSubmitting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-job", {
        body: {
          jobDescription: trimmed,
          companyName: job.company_name,
          position: job.position,
        },
      });

      if (error) {
        const errorMessage =
          typeof error === "object" &&
          error !== null &&
          "context" in error &&
          error.context instanceof Response
            ? await error.context.text()
            : error.message || "Failed to call AI function.";

        throw new Error(errorMessage);
      }

      if (!data?.content) {
        throw new Error(data?.error || "AI did not return any content.");
      }

      const parsed = parseAiJson(data.content);

      setResult({
        focusAreas: normalizeStringArray(parsed.focusAreas),
        mustHaveSkills: normalizeStringArray(parsed.mustHaveSkills),
        niceToHaveSkills: normalizeStringArray(parsed.niceToHaveSkills),
        tips: normalizeStringArray(parsed.tips),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AI analysis failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setError(null);
    setSaveMessage(null);
    setIsSaving(true);

    const aiNotesBlock = `
AI INSIGHT

What to focus on:
${result.focusAreas.map((item) => `- ${item}`).join("\n")}

Must-have skills:
${result.mustHaveSkills.map((item) => `- ${item}`).join("\n")}

Nice-to-have skills:
${result.niceToHaveSkills.map((item) => `- ${item}`).join("\n")}

Tips:
${result.tips.map((item) => `- ${item}`).join("\n")}
    `.trim();

    const mergedNotes = job.notes?.trim()
      ? `${job.notes.trim()}\n\n--------------------\n\n${aiNotesBlock}`
      : aiNotesBlock;

    try {
      await editJob(job.id, {
        company_name: job.company_name,
        position: job.position,
        location: job.location ?? "",
        salary: job.salary ?? "",
        tags: (job.tags ?? []).join(", "),
        notes: mergedNotes,
      });

      setSaveMessage("AI insight saved to notes.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save AI insight.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="ai-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      onClick={handleBackdropClick}
    >
      <div className="ai-modal-card">
        <div className="ai-modal-header">
          <div>
            <h2 id="ai-modal-title">AI Insight</h2>
            <p className="ai-modal-subtitle">
              Analyze job description for {job.company_name} — {job.position}
            </p>
          </div>

          <button
            type="button"
            className="ai-modal-close"
            onClick={onClose}
            disabled={isSubmitting || isSaving}
            aria-label="Close AI insight modal"
          >
            ✕
          </button>
        </div>

        <form className="ai-modal-form" onSubmit={handleSubmit}>
          <label className="ai-modal-label" htmlFor="job-description">
            Job description
          </label>

          <textarea
            id="job-description"
            className="ai-modal-textarea"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={10}
            disabled={isSubmitting || isSaving}
          />

          <p className="ai-modal-hint">
            Tip: paste the full role description so AI can give more useful feedback.
          </p>

          {error && <div className="ai-modal-error">{error}</div>}
          {saveMessage && <div className="ai-modal-success">{saveMessage}</div>}

          <div className="ai-modal-actions">
            <button
              type="button"
              className="ai-btn ai-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting || isSaving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ai-btn ai-btn-primary"
              disabled={isSubmitting || isSaving}
            >
              {isSubmitting ? "Analyzing..." : "Analyze with AI"}
            </button>
          </div>
        </form>

        {result && (
          <div className="ai-result">
            <div className="ai-result-section">
              <h3>What to focus on</h3>
              <ul>
                {result.focusAreas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="ai-result-section">
              <h3>Must-have skills</h3>
              <div className="ai-tag-list">
                {result.mustHaveSkills.map((skill) => (
                  <span key={skill} className="ai-tag ai-tag-primary">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="ai-result-section">
              <h3>Nice-to-have skills</h3>
              <div className="ai-tag-list">
                {result.niceToHaveSkills.map((skill) => (
                  <span key={skill} className="ai-tag ai-tag-secondary">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="ai-result-section">
              <h3>3 practical tips</h3>
              <ul>
                {result.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="ai-modal-actions">
              <button
                type="button"
                className="ai-btn ai-btn-secondary"
                onClick={handleSave}
                disabled={isSaving || isSubmitting}
              >
                {isSaving ? "Saving..." : "Save to notes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};