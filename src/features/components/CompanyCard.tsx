import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clock,
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { getNextStep } from "../../lib/jobs/nextStep";
import { getStageAge } from "../../lib/jobs/jobHistory";
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
  onCompleteStep?: (jobId: string) => void;
  onOpenHistory?: (jobId: string) => void;
  // when the job entered its current stage, if the history knows
  stageSince?: string;
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

const MENU_WIDTH = 190;
// tallest the menu gets, with the "Move to" list open
const MENU_MAX_HEIGHT = 330;

type MenuPosition = { left: number; top: number | "auto"; bottom: number | "auto" };

// The menu is placed against the screen (position: fixed) next to its button:
// below it when there is room, above it otherwise, and never past the screen edge.
const placeMenu = (button: DOMRect): MenuPosition => {
  const left = Math.max(8, Math.min(button.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
  const fitsBelow = button.bottom + MENU_MAX_HEIGHT <= window.innerHeight;
  const fitsAbove = button.top - MENU_MAX_HEIGHT >= 0;

  return fitsBelow || !fitsAbove
    ? { left, top: button.bottom + 2, bottom: "auto" }
    : { left, top: "auto", bottom: window.innerHeight - button.top + 2 };
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
  next_step,
  next_step_date,
  job_url,
  status,
  rejected_from_stage,
  onMove,
  onRestore,
  onEdit,
  onDelete,
  onOpenNotes,
  onOpenAi,
  onCompleteStep,
  onOpenHistory,
  stageSince,
  allStages,
  disabled = false,
  busyLabel = null,
  isActive = false,
}: CompanyCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

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

  // The menu does not follow its card, so it closes when anything scrolls or the window changes.
  useEffect(() => {
    if (!menuOpen) return;

    const close = () => {
      setMenuOpen(false);
      setMoveOpen(false);
    };

    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuOpen]);

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
  const nextStep = getNextStep({ stage, next_step, next_step_date }, new Date());
  // How long it has been waiting matters only while the application is still open.
  const stageAge = status === "active" ? getStageAge(stageSince, new Date()) : null;

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

      {stageAge && (
        <button
          type="button"
          className={`company_card_age ${stageAge.isLong ? "is-long" : ""}`}
          title="Show the history of this application"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onOpenHistory?.(id);
          }}
        >
          <Clock size={13} aria-hidden="true" />
          {stageAge.label}
        </button>
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

      {nextStep && (
        <div className={`company_card_step company_card_step--${nextStep.state}`}>
          {nextStep.state === "overdue" ? (
            <AlertTriangle size={15} aria-hidden="true" />
          ) : (
            <CalendarClock size={15} aria-hidden="true" />
          )}
          <span className="company_card_step_text">
            <strong>{nextStep.label}</strong>
            {nextStep.dateLabel && <small>{nextStep.dateLabel}</small>}
          </span>
          <button
            type="button"
            className="company_card_step_done"
            aria-label={`Mark "${nextStep.label}" as done`}
            title="Mark as done"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onCompleteStep?.(id);
            }}
          >
            <Check size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {busyLabel && <div className="company_card_busy">{busyLabel}</div>}

      <div className="company_card_footer">
        <span className="company_card_date" title="Date applied">
          {formatApplied(applied_date)}
        </span>

        <div className="company_card_actions">
          {job_url && (
            <a
              className="card_icon_btn has-content"
              href={job_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the job ad in a new tab"
              title="Open the job ad"
              onClick={(e) => e.stopPropagation()}
              // a link is draggable by default; the card is what should be dragged
              draggable={false}
            >
              <ExternalLink size={17} aria-hidden="true" />
            </a>
          )}

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
                setMenuPosition(placeMenu(e.currentTarget.getBoundingClientRect()));
                setMenuOpen((prev) => !prev);
                setMoveOpen(false);
              }}
            >
              <MoreHorizontal size={17} aria-hidden="true" />
            </button>

            {menuOpen && !disabled && menuPosition && (
              <div
                className="card_menu"
                role="menu"
                style={{ ...menuPosition, width: MENU_WIDTH }}
                onClick={(e) => e.stopPropagation()}
                // a press inside the menu must not start dragging the card
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
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
                  className="card_menu_item"
                  role="menuitem"
                  onClick={() => {
                    onOpenHistory?.(id);
                    setMenuOpen(false);
                    setMoveOpen(false);
                  }}
                >
                  History
                </button>

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
