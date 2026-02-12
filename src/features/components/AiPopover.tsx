import { useEffect, useRef } from "react";
import "./css/notesPopover.css"; 

type AiPopoverProps = {
  anchorRect: DOMRect;
  onClose: () => void;
};

export const AiPopover = ({ anchorRect, onClose }: AiPopoverProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const style: React.CSSProperties = {
    position: "fixed",
    top: anchorRect.bottom + 8,
    left: anchorRect.left,
    zIndex: 9999,
  };

  return (
    <div ref={ref} style={style} className="notes-popover">
      <div className="notes-popover-header">
        <strong>AI Insight</strong>
        <button className="notes-popover-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="notes-popover-body">
        <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
          Coming soon.
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6b7280" }}>
          Plan: paste job description → get Must-have / Nice-to-have + tips.
        </p>
      </div>
    </div>
  );
};
