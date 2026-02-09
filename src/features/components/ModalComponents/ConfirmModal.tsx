import "../css/newAplicationModal.css";

type Props = {
  title: string;
  description: string;

  confirmText: string;
  cancelText?: string;

  danger?: boolean;
  isLoading?: boolean;

  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export const ConfirmModal = ({
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  danger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: Props) => {
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
            onClick={onCancel}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            className={`btn btn-primary ${danger ? "btn-danger" : ""}`}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Working..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
