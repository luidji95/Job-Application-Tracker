
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import "./css/topbar.css";

type TopbarProps = {
  userName: string;
};

export const Topbar = ({ userName }: TopbarProps) => {
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
          <button className="notification-btn">
            <span className="notification-icon">🔔</span>
          </button>

          <div className="profile-info">
            <div className="profile-avatar" />
            <span className="profile-name">{userName}</span>
          </div>

          <div className="logout-btn">
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="topbar-toolbar">
        <div className="toolbar-search">
          <input type="text" placeholder="Search jobs" />
        </div>

        <div className="toolbar-actions">
          <button>Add job</button>
          <button>Add column</button>
        </div>
      </div>

      
    </header>
  );
};
