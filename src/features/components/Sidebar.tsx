import { Link, useLocation } from "react-router-dom";
import { BarChart3, Kanban, LogOut, Settings } from "lucide-react";
import { Logo } from "../../components/ui/Logo";
import "./css/sidebar.css";

type SidebarProps = {
  userName: string;
  isDemo?: boolean;
  onLogout: () => void;
};

const getInitials = (name: string) =>
  name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

export const Sidebar = ({ userName, isDemo = false, onLogout }: SidebarProps) => {
  const location = useLocation();
  const isStatistics = location.pathname === "/dashboard/statistics";

  return (
    <div className="sidebar">
      <Link to="/dashboard" className="sidebar-brand" aria-label="JobFlowTracker">
        <Logo size={24} tone="light" />
        <span className="sidebar-label">JobFlowTracker</span>
      </Link>

      <nav className="sidebar-main" aria-label="Dashboard">
        <Link
          to="/dashboard"
          className={`sidebar-item ${!isStatistics ? "active" : ""}`}
          aria-current={!isStatistics ? "page" : undefined}
        >
          <Kanban size={18} aria-hidden="true" />
          <span>Board</span>
        </Link>

        <Link
          to="/dashboard/statistics"
          className={`sidebar-item ${isStatistics ? "active" : ""}`}
          aria-current={isStatistics ? "page" : undefined}
        >
          <BarChart3 size={18} aria-hidden="true" />
          <span>Statistics</span>
        </Link>

        <span className="sidebar-item sidebar-item--soon">
          <Settings size={18} aria-hidden="true" />
          <span className="sidebar-label">Settings</span>
          <span className="sidebar-soon">soon</span>
        </span>
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user__row">
          <span className="sidebar-avatar">{getInitials(userName)}</span>
          <span className="sidebar-user__text">
            <strong>{userName}</strong>
            {isDemo && <small>Guest demo</small>}
          </span>
        </div>

        <button type="button" className="sidebar-logout" onClick={onLogout} aria-label="Log out">
          <LogOut size={16} aria-hidden="true" />
          <span className="sidebar-label">Log out</span>
        </button>
      </div>
    </div>
  );
};
