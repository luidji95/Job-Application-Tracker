import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import "./css/topbar.css";

import { LogOut, Search, Github,  } from "lucide-react";
import { Button } from "../../components/ui/Button";

type TopbarProps = {
  userName: string;
  avatarUrl?: string;
  onSeedClick?: () => void;
 
};

const GITHUB_REPO_URL = "https://github.com/luidji95/Job-Application-Tracker"; 

export const Topbar = ({ userName, onSeedClick}: TopbarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
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
          {/* GORNJI RED */}
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

          {/* DONJI RED */}
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
          <input type="text" placeholder="Search jobs" />
        </div>

        <div className="toolbar-actions">
          <Button variant="danger" size="md" className="toolbar-btn">
            
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
