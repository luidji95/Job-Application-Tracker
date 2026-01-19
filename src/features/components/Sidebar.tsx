
import "./css/sidebar.css";

export const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Job Application Tracker</div>

      <nav className="sidebar-main">
        <ul>
          <li className="sidebar-item">🤖 AI Tools</li>
          <li className="sidebar-item">📊 Statistics</li>
          <li className="sidebar-item">👥 Contacts</li>
          <li className="sidebar-item">⏰ Reminders</li>
          <li className="sidebar-item">⚙️ Settings</li>
          <li className="sidebar-item">🌍 Community</li>
        </ul>
      </nav>
    </aside>
  );
};