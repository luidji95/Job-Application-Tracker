import { useEffect, useState } from "react";
import "./dashboard.css";

import { Topbar } from "../../features/components/Topbar";
import { Sidebar } from "../../features/components/Sidebar";
import { KanbanBoard } from "../../features/components/KanbanBoard";
import { supabase } from "../../lib/supabaseClient";

type Profile = {
  userName: string | null;
  email: string | null;
};

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("userName, email")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Failed to load profile:", error.message);
        return;
      }

      setProfile(data);
    };

    loadProfile();
  }, []);

  return (
  <div className="dash">
    <aside className="dash__sidebar">
      <Sidebar />
    </aside>

    <div className="dash__right">
      <div className="dash__topbar">
        <Topbar userName={profile?.userName ?? profile?.email ?? "User"} />
      </div>

      <div className="dash__kanban">
        <KanbanBoard />
      </div>
    </div>
  </div>
);

};

export default Dashboard;
