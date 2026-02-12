import { useEffect, useState } from "react";
import "./dashboard.css";

import { Topbar } from "../../features/components/Topbar";
import { Sidebar } from "../../features/components/Sidebar";
import { KanbanBoard } from "../../features/components/KanbanBoard";
import { supabase } from "../../lib/supabaseClient";

import { seedDummyJobs } from "../../script/seedData";
import { deleteAllJobsDb } from "../../lib/jobs/jobsApi";
import { ConfirmModal } from "../../features/components/ModalComponents/ConfirmModal";
import { toast } from "sonner";

type Profile = {
  userName: string | null;
  email: string | null;
};

export type SearchResult = {
  id: string;
  company_name: string;
  position: string;
  stage: string;
};

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

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

  const handleSeedClick = async () => {
    try {
      const result = await seedDummyJobs();
      if (result.success) {
        toast.success(`Successfully seeded ${result.count} jobs!`);
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Seed failed:", error);
      toast.error("Failed to seed jobs. Check console for details.");
    }
  };

  const handleDeleteAllClick = () => {
    setDeleteAllOpen(true);
  };

  const confirmDeleteAll = async () => {
    try {
      setIsDeletingAll(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const uid = session?.user?.id;
      if (!uid) {
        toast.error("Not authenticated.");
        return;
      }

      await deleteAllJobsDb(uid);

      toast.success("All applications deleted.");
      setRefreshKey((prev) => prev + 1);
      setDeleteAllOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete all applications.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="dash">
      <aside className="dash__sidebar">
        <Sidebar />
      </aside>

      <div className="dash__right">
        <div className="dash__topbar">
          <Topbar
            userName={profile?.userName ?? profile?.email ?? "User"}
            onSeedClick={handleSeedClick}
            onDeleteAll={handleDeleteAllClick}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            results={searchResults}
            onPickResult={(id) => setActiveJobId(id)}
          />
        </div>

        <div className="dash__kanban">
          <KanbanBoard
            key={refreshKey}
            searchValue={searchValue}
            activeJobId={activeJobId}
            onSearchResultsChange={setSearchResults}
            onJumpHandled={() => setActiveJobId(null)}
          />
        </div>
      </div>

      {deleteAllOpen && (
        <ConfirmModal
          title="Delete all applications?"
          description="This will permanently delete ALL applications. This cannot be undone."
          confirmText="Delete all"
          cancelText="Cancel"
          danger
          isLoading={isDeletingAll}
          onCancel={() => setDeleteAllOpen(false)}
          onConfirm={confirmDeleteAll}
        />
      )}
    </div>
  );
};

export default Dashboard;
