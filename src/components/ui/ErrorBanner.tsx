import "./css/errorBanner.css"

type ErrorBannerProps = {
  message: string;
  onClose?: () => void;
};

export const ErrorBanner = ({ message, onClose }: ErrorBannerProps) => {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__text">{message} Failed to load jobs...</span>

      {onClose && (
        <button
          type="button"
          className="error-banner__close"
          aria-label="Dismiss error"
          onClick={onClose}
        >
          ✕
        </button>
      )}
    </div>
  );
};
