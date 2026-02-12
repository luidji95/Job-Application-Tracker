import { useEffect, useRef, useState } from "react";
import "./css/companyCard.css";
import type { JobType, StageId } from "./StageColumn";
import { Button } from "../../components/ui/Button";


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

  allStages: StageOption[];

  disabled?: boolean;
  busyLabel?: string | null;

  isActive?: boolean;
};

const getCompanyColor = (name: string) => {
  const colors = [
    "#4f46e5",
    "#08ecd9",
    "#059669",
    "#d97706",
    "#3b82f6",
    "#ef4444",
    "#0e8cc7",
    "#e91780",
    "#dcff13",
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

export const CompanyCard = ({
  id,
  company_name,
  position,
  applied_date,
  location,
  stage,
  salary,
  tags = [],
  status,
  rejected_from_stage,
  onMove,
  onRestore,
  onEdit,
  onDelete,
  onOpenNotes,
  allStages,
  disabled = false,
  busyLabel = null,
  isActive = false,
}: CompanyCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // close on outside click
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

  const toggleExpanded = () => {
    if (disabled) return;
    setExpanded((p) => !p);
  };

  return (
    <div 
      id={`job-${id}`}
      className={`company_card {company_card--${status} ${expanded ? "is-expanded" : ""} ${
        disabled ? "is-busy" : ""
      } ${isActive ? "is-active" : ""}`}
      data-id={id}
    >
      {/* HEADER (COMPACT) */}
      <div className="company_card_header">
        <div className="company_card_info">
          <div
            className="company_card_avatar"
            style={{ backgroundColor: getCompanyColor(company_name) }}
          >
            {getCompanyInitials(company_name)}
          </div>

          <div className="company_card_text">
            <h4>{company_name}</h4>
            <p>{position}</p>
            {location && <p>📍 {location}</p>}
          </div>
        </div>

        {/* MENU */}
        <div className="company_card_menu" ref={menuRef}>
          <button
            className="menu_btn"
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (disabled) return;
              setMenuOpen((p) => !p);
              setMoveOpen(false);
            }}
          >
            ⋯
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

              <button
                type="button"
                className="card_menu_item"
                role="menuitem"
                onClick={() => {
                  onDelete?.(id);
                  setMenuOpen(false);
                  setMoveOpen(false);
                }}
              >
                Delete
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setMoveOpen((p) => !p);
                  }}
                >
                  Move to <span className="submenu_arrow">›</span>
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
            </div>
          )}
        </div>
      </div>

      {/* COMPACT FOOTER ROW: status + expand */}
      <div className="company_card_compact_footer">
        <span className={`company_card_status company_card_status--${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>

        <button
          type="button"
          className="company_card_expand_btn"
          onClick={toggleExpanded}
          disabled={disabled}
          aria-expanded={expanded}
        >
          {expanded ? "Hide" : "See more"}
        </button>
      </div>

      {/* BUSY LABEL (small) */}
      {busyLabel && <div className="company_card_busy">{busyLabel}</div>}

      {/* DETAILS (COLLAPSIBLE) */}
      <div className={`company_card_details ${expanded ? "is-open" : ""}`}>
        <div className="details_item">
          <span className="detail_label">Applied:</span>
          <span className="detail_value">{new Date(applied_date).toLocaleDateString()}</span>
        </div>

        <div className="details_item">
          <span className="detail_label">Stage:</span>
          <span className="detail_value">{stage}</span>
        </div>

        {status === "rejected" && rejected_from_stage && (
          <div className="details_item">
            <span className="detail_label">Rejected at:</span>
            <span className="detail_value">{rejected_from_stage}</span>
          </div>
        )}

        {salary && (
          <div className="details_item">
            <span className="detail_label">Salary:</span>
            <span className="detail_value">{salary}</span>
          </div>
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
        

        <div className="panel">
             <Button
                variant="secondary"
                 onClick={(e) => {
                     e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    onOpenNotes?.(id, rect);
                }}
               >
                Notes 
              </Button>
          
          <Button variant="secondary">AI Insight (coming soon) </Button>
        </div>

     

      </div>
    </div>
  );
};
