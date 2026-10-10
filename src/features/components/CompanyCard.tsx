import { useEffect, useRef, useState } from "react";
import { MapPin, MoreHorizontal, Sparkles, StickyNote } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import "./css/companyCard.css";
import type { JobType, StageId } from "./StageColumn";

type StageOption = {
  id: StageId;
  title: string;
};

type CompanyCardProps = JobType & {
  onMove?: (jobId: string, toStage: StageId) => void;
  onRestore?: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onOpenNotes?: (jobId: string, anchorRect: DOMRect) => void;
  onOpenAi?: (jobId: string) => void;
  allStages: StageOption[];
  disabled?: boolean;
  busyLabel?: string | null;
  isActive?: boolean;
};

// all dark enough for white initials
const getCompanyColor = (name: string) => {
  const colors = [
    "#3445e0",
    "#0b7a6e",
    "#0b7a5a",
    "#a85a00",
    "#1d6fb8",
    "#b4232c",
    "#5b4bd6",
    "#9a3fa8",
    "#56607a",
  ];

  const safe = (name ?? "").trim();
  const index = safe ? safe.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const getCompanyInitials = (name: string) => {
  const safe = (name ?? "").trim();
  if (!safe) return "??";

  return safe
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatApplied = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export const CompanyCard = ({
  id,
  company_name,
  position,
  applied_date,
  location,
  stage,
  salary,
  tags = [],
  notes,
  status,
  rejected_from_stage,
  onMove,
  onRestore,
  onEdit,
  onDelete,
  onOpenNotes,
  onOpenAi,
  allStages,
  disabled = false,
  busyLabel = null,
  isActive = false,
}: CompanyCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // The whole card can be dragged to another column; the menu stays as the other way to move it.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
    attributes: { role: "group", roleDescription: "draggable application" },
  });

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setMoveOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const stageOptions = allStages.filter((s) => s.id !== stage);

  const handleMove = (toStage: StageId) => {
    if (disabled) return;
    onMove?.(id, toStage);
    setMenuOpen(false);
    setMoveOpen(false);
  };

  const rejectedFromTitle = rejected_from_stage
    ? allStages.find((s) => s.id === rejected_from_stage)?.title ?? rejected_from_stage
    : null;

  const meta = [location, salary].filter(Boolean);
  const hasNotes = Boolean(notes && notes.trim());

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      id={`job-${id}`}
      className={`company_card company_card--${status} ${disabled ? "is-busy" : ""} ${
        isActive ? "is-active" : ""
      } ${isDragging ? "is-dragging" : ""}`}
      data-id={id}
      aria-label={`${company_name}, ${position}`}
    >
      <div className="company_card_header">
        <div
          className="company_card_avatar"
          style={{ backgroundColor: getCompanyColor(company_name) }}
          aria-hidden="true"
        >
          {getCompanyInitials(company_name)}
        </div>

        <div className="company_card_text">
          <h4>{company_name}</h4>
          <p>{position}</p>
        </div>
      </div>

      {meta.length > 0 && (
        <p className="company_card_meta">
          {location && <MapPin size={13} aria-hidden="true" />}
          {meta.join(" · ")}
        </p>
      )}

      {tags.length > 0 && (
        <div className="company_card_tags">
          {tags.map((tag) => (
            <span key={tag} className="company_card_tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {status === "accepted" && <span className="company_card_status">Accepted</span>}

      {stage === "rejected" && (
        <div className="company_card_rejected">
          <span>{rejectedFromTitle ? `After ${rejectedFromTitle}` : "Rejected"}</span>
          <button type="button" disabled={disabled} onClick={() => onRestore?.(id)}>
            Restore
          </button>
        </div>
      )}

      {busyLabel && <div className="company_card_busy">{busyLabel}</div>}

      <div className="company_card_footer">
        <span className="company_card_date" title="Date applied">
          {formatApplied(applied_date)}
        </span>

        <div className="company_card_actions">
          <button
            type="button"
            className={`card_icon_btn ${hasNotes ? "has-content" : ""}`}
            aria-label={hasNotes ? "Notes" : "Notes (empty)"}
            title="Notes"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              onOpenNotes?.(id, rect);
            }}
          >
            <StickyNote size={17} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="card_icon_btn"
            aria-label="AI insight"
            title="AI insight"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onOpenAi?.(id);
            }}
          >
            <Sparkles size={17} aria-hidden="true" />
          </button>

          <div className="company_card_menu" ref={menuRef}>
            <button
              className="card_icon_btn"
              type="button"
              aria-label="More actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (disabled) return;
                setMenuOpen((prev) => !prev);
                setMoveOpen(false);
              }}
            >
              <MoreHorizontal size={17} aria-hidden="true" />
            </button>

            {menuOpen && !disabled && (
              <div className="card_menu" role="menu" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="card_menu_item"
                  role="menuitem"
                  onClick={() => {
                    onEdit?.(id);
                    setMenuOpen(false);
                    setMoveOpen(false);
                  }}
                >
                  Edit
                </button>

                {stage === "rejected" ? (
                  <button
                    type="button"
                    className="card_menu_item"
                    role="menuitem"
                    onClick={() => {
                      onRestore?.(id);
                      setMenuOpen(false);
                      setMoveOpen(false);
                    }}
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    className="card_menu_item card_menu_item--submenu"
                    role="menuitem"
                    aria-expanded={moveOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveOpen((prev) => !prev);
                    }}
                  >
                    Move to <span className="submenu_arrow">{moveOpen ? "▾" : "▸"}</span>
                  </button>
                )}

                {moveOpen && stage !== "rejected" && (
                  <div className="card_submenu" role="menu">
                    {stageOptions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="card_menu_item"
                        role="menuitem"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(s.id);
                        }}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="card_menu_item card_menu_item--danger"
                  role="menuitem"
                  onClick={() => {
                    onDelete?.(id);
                    setMenuOpen(false);
                    setMoveOpen(false);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
