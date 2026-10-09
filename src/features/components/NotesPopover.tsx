import { useEffect, useRef } from "react";
import "./css/notesPopover.css";

type NotesPopoverProps = {
  anchorRect: DOMRect;
  companyName: string;
  notes: string;
  onClose: () => void;
};

export const NotesPopover = ({
  anchorRect,
  companyName,
  notes,
  onClose,
}: NotesPopoverProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Opens to the right of the button; when there is no room, below it and inside the screen.
  const POPOVER_WIDTH = Math.min(320, window.innerWidth - 32);
  const fitsRight = anchorRect.right + 12 + POPOVER_WIDTH <= window.innerWidth - 16;

  const style: React.CSSProperties = {
    position: "fixed",
    top: fitsRight
      ? Math.max(16, Math.min(anchorRect.top, window.innerHeight - 220))
      : Math.min(anchorRect.bottom + 8, window.innerHeight - 220),
    left: fitsRight
      ? anchorRect.right + 12
      : Math.max(16, Math.min(anchorRect.left, window.innerWidth - POPOVER_WIDTH - 16)),
    zIndex: 1000,
  };

  return (
    <div ref={ref} className="notes-popover" style={style}>
      <div className="notes-popover-header">
        <strong>Notes for {companyName}</strong>
        <button className="notes-close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="notes-popover-content">
        {notes ? notes : <em>No notes yet.</em>}
      </div>
    </div>
  );
};
