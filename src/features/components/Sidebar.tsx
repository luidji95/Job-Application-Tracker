import { useNavigate, useLocation } from "react-router-dom";
import "./css/sidebar.css";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-title">Job Application Tracker</div>

      <nav className="sidebar-main">
        <ul>
          <li
            className={`sidebar-item ${
              location.pathname === "/dashboard/statistics" ? "active" : ""
            }`}
            onClick={() => navigate("/dashboard/statistics")}
          >
            Statistics
          </li>

          <li className="sidebar-item">Settings (coming soon)</li>
        </ul>
      </nav>
    </aside>
  );
};