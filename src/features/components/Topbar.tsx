
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import "./css/topbar.css";

import { LogOut, Search, Plus } from "lucide-react";

type TopbarProps = {
  userName: string;
  avatarUrl?: string;
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
        

          <div className="profile-info">
            <div className="profile-avatar" />
            <span className="profile-name">{userName}</span>
          </div>

          <div className="logout-btn">
            <button onClick={handleLogout}><LogOut size={16}></LogOut></button>
          </div>
        </div>
      </div>

      <div className="topbar-toolbar">
        <div className="toolbar-search">
          <input type="text" placeholder="Search jobs"  /><Search></Search>
          
        </div>

        <div className="toolbar-actions">
          <button>Add job</button>
          <button>Add column</button>
        </div>
      </div>

      
    </header>
  );
};
