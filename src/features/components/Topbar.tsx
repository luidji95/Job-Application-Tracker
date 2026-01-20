
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import "./css/topbar.css";

import { LogOut, Search, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";

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
          <Search className="search-icon"></Search>
          <input type="text" placeholder="Search jobs"></input>
          
        </div>

        <div className="toolbar-actions">
          <Button 
           variant="primary" 
           size="md"
            className="toolbar-btn"
          >
            <Plus size={16} /> 
            <span style={{ marginLeft: "8px" }}>New Application</span>
           </Button>
  
          <Button 
            variant="primary" 
            size="md"
            className="toolbar-btn"
          >
          <Plus size={16} />
          <span style={{ marginLeft: "8px" }}>Add stage</span>
          </Button>
        </div>
      </div>

      
    </header>
  );
};
