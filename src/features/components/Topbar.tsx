import "./css/topbar.css";

import { Search, Github, Trash2, DatabaseZap } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useState } from "react";
import type { SearchResult } from "../../pages/Dashboard/DashboardLayout";

type TopbarProps = {
  onSeedClick?: () => void;
  onDeleteAll?: () => void;

  searchValue: string;
  setSearchValue: (value: string) => void;

  results: SearchResult[];
  onPickResult: (jobId: string) => void;
};

const GITHUB_REPO_URL = "https://github.com/luidji95/Job-Application-Tracker";

export const Topbar = ({
  onSeedClick,
  onDeleteAll,
  searchValue,
  setSearchValue,
  results,
  onPickResult,
}: TopbarProps) => {
  const [open, setOpen] = useState(false);

  const trimmed = searchValue.trim();
  const showDropdown = open && trimmed.length > 0 && results.length > 0;

  return (
    <header className="topbar">
      <div className="toolbar-search">
        <Search className="search-icon" size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="job-search">
          Search applications
        </label>
        <input
          id="job-search"
          type="search"
          placeholder="Search company, position, tag"
          value={searchValue}
          onChange={(e) => {
            const v = e.target.value;
            setSearchValue(v);

            if (v.trim().length === 0) setOpen(false);
            else setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />

        {showDropdown && (
          <div className="search-dropdown" role="listbox">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                className="search-item"
                onClick={() => {
                  onPickResult(r.id);
                  setOpen(false);
                }}
              >
                <div className="search-item-top">
                  <strong>{r.company_name}</strong>
                  <span className="search-item-stage">{r.stage}</span>
                </div>
                <div className="search-item-sub">{r.position}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-actions">
        <Button variant="ghost" size="md" className="toolbar-btn" onClick={onSeedClick}>
          <DatabaseZap size={16} aria-hidden="true" />
          <span>Load sample data</span>
        </Button>

        <Button
          variant="danger"
          size="md"
          className="toolbar-btn"
          onClick={onDeleteAll}
          disabled={!onDeleteAll}
        >
          <Trash2 size={16} aria-hidden="true" />
          <span>Delete all</span>
        </Button>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-oss"
          aria-label="Source code on GitHub"
        >
          <Github size={18} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
};
