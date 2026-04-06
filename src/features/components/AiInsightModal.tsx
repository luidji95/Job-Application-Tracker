import { useEffect, useState } from "react";
import "../components/css/aiPopover.css";
import { supabase } from "../../lib/supabaseClient";

type AiInsightResult = {
  focusAreas: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  tips: string[];
};

type AiInsightModalProps = {
  companyName?: string;
  position?: string;
  onClose: () => void;
};

export const AiInsightModal = ({
  companyName,
  position,
  onClose,
}: AiInsightModalProps) => {
  const [jobDescription, setJobDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  setIsSubmitting(true);
  setResult(null);

  try {
    const { data, error } = await supabase.functions.invoke("analyze-job", {
      body: { jobDescription: trimmed },
    });

    console.log("EDGE DATA:", data);
    console.log("EDGE ERROR:", error);

    if (error) {
      throw new Error(error.message || "Failed to call AI function.");
    }

    if (!data?.content) {
      throw new Error(data?.error || "AI did not return any content.");
    }

    const parsed = JSON.parse(data.content);

    setResult({
      focusAreas: parsed.focusAreas ?? [],
      mustHaveSkills: parsed.mustHaveSkills ?? [],
      niceToHaveSkills: parsed.niceToHaveSkills ?? [],
      tips: parsed.tips ?? [],
    });
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "AI analysis failed.");
  } finally {
    setIsSubmitting(false);
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
              {companyName || position
                ? `Analyze job description for ${companyName ?? "this company"}${position ? ` — ${position}` : ""}`
                : "Paste a job description and get actionable insights."}
            </p>
          </div>

          <button
            type="button"
            className="ai-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />

          <p className="ai-modal-hint">
            Tip: paste the full role description so AI can give more useful feedback.
          </p>

          {error && <div className="ai-modal-error">{error}</div>}

          <div className="ai-modal-actions">
            <button
              type="button"
              className="ai-btn ai-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ai-btn ai-btn-primary"
              disabled={isSubmitting}
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
          </div>
        )}
      </div>
    </div>
  );
};