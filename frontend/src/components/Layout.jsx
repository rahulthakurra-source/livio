import { PAGE_DEFINITIONS } from "../projectModel.js";

export function Layout({
  user,
  page,
  setPage,
  projects,
  activeProject,
  onLogout,
  children,
}) {
  const visiblePages = PAGE_DEFINITIONS.filter(
    (entry) => !entry.adminOnly || user?.role === "Admin",
  );
  const activePage = PAGE_DEFINITIONS.find((entry) => entry.id === page);

  function getCount(entry) {
    if (entry.type === "root") return projects?.length || 0;
    if (!activeProject) return 0;
    if (entry.type === "dailyTracker") return activeProject.dailyTracker?.days?.length || 0;
    if (
      entry.type === "dashboard" ||
      entry.type === "payments" ||
      entry.type === "compliance" ||
      entry.type === "export"
    ) {
      return "";
    }
    const list = activeProject[entry.sectionKey];
    return Array.isArray(list) ? list.length : 0;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">LIVIO LEGACY AI</div>
          <p className="brand-sub">Construction management workspace</p>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Active Project</div>
          <div className="active-project-card">
            <strong>{activeProject?.name || "No active project"}</strong>
            <span className="active-project-switch">⇄</span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Pages</div>
          <nav className="nav-list">
            {visiblePages.map((entry) => (
              <button
                key={entry.id}
                className={`nav-link ${page === entry.id ? "active" : ""}`}
                onClick={() => setPage(entry.id)}
              >
                <span className="nav-link-main">
                  <span className="nav-link-icon">{entry.icon || "*"}</span>
                  <span className="nav-link-label">{entry.label}</span>
                </span>
                {getCount(entry) !== "" ? <span className="nav-count">{getCount(entry)}</span> : null}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-foot-meta">
            {activeProject ? (
              <>
                <div>
                  {activeProject.city || ""}
                  {activeProject.county ? ` | ${activeProject.county}` : ""}
                </div>
                <div>Permit: {activeProject.permit || "-"}</div>
                <div>APN: {activeProject.apn || "-"}</div>
              </>
            ) : (
              <div>No project selected</div>
            )}
          </div>
          <div className="sidebar-foot-user">
            <span>{user?.username}</span>
            <span>{user?.role}</span>
          </div>
          <button className="button ghost compact" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <div className="topbar">
          <div className="tb-title">{activePage?.label || "Livio"}</div>
          <div className="tb-right">
            <button className="button ghost compact" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </div>
        <div className="content-wrap">{children}</div>
      </main>
    </div>
  );
}
