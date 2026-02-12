// Topbar.tsx
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import "./css/topbar.css";

import { LogOut, Search, Github } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { deleteAllJobsDb } from "../../lib/jobs/jobsApi";

type TopbarProps = {
  userName: string;
  avatarUrl?: string;
  onSeedClick?: () => void;
  onDeleteAll?: () => void;

  // ✅ controlled input props
  searchValue: string;
  setSearchValue: (value: string) => void;
};

const GITHUB_REPO_URL = "https://github.com/luidji95/Job-Application-Tracker";

export const Topbar = ({
  userName,
  onSeedClick,
  onDeleteAll,
  searchValue,
  setSearchValue,
}: TopbarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const isDemo = localStorage.getItem("is_demo") === "1";

    if (isDemo) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        await deleteAllJobsDb(user.id);
      }

      localStorage.removeItem("is_demo");
    }

    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-main">
        <div className="topbar-brand">
          <p>Job Hunt</p>
        </div>

        <div className="topbar-profile">
          <div className="profile-row">
            <div className="profile-info">
              <div className="profile-avatar" />
              <span className="profile-name">{userName}</span>
            </div>

            <div className="logout-btn">
              <button onClick={handleLogout} aria-label="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="profile-oss"
          >
            <Github size={18} />
            <span>Open source</span>
          </a>
        </div>
      </div>

      <div className="topbar-toolbar">
        <div className="toolbar-search">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search jobs"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <Button
            variant="danger"
            size="md"
            className="toolbar-btn"
            onClick={onDeleteAll}
            disabled={!onDeleteAll}
          >
            <span style={{ marginLeft: 8 }}>Delete all applications</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            className="toolbar-btn"
            onClick={onSeedClick}
          >
            <span style={{ marginLeft: 8 }}>Seed dummy</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
