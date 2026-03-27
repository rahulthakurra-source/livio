import { PAGE_DEFINITIONS } from "../projectModel.js";

export function Layout({
  user,
  page,
  setPage,
  activeProject,
  onLogout,
  children,
}) {
  const visiblePages = PAGE_DEFINITIONS.filter(
    (entry) => !entry.adminOnly || user?.role === "Admin",
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">LIVIO</div>
          <p className="brand-sub">React migration with project-row storage</p>
        </div>

        <nav className="nav-list">
          {visiblePages.map((entry) => (
            <button
              key={entry.id}
              className={`nav-link ${page === entry.id ? "active" : ""}`}
              onClick={() => setPage(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="pill">Signed in as {user?.username}</div>
          <div className="pill">Role: {user?.role}</div>
          {activeProject ? (
            <div className="pill pill-active">Project: {activeProject.name}</div>
          ) : (
            <div className="pill">No active project</div>
          )}
          <button className="button ghost" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}
