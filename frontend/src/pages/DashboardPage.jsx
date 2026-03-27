import { computeDashboard } from "../projectModel.js";

function StatCard({ label, value, hint }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{hint}</p>
    </article>
  );
}

export function DashboardPage({ project, onSaveProject }) {
  const stats = computeDashboard(project);

  async function handleMetadataChange(key, value) {
    await onSaveProject({
      ...project,
      [key]: value,
    });
  }

  return (
    <>
      <section className="page-head">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h1>{project.name}</h1>
          <p className="muted">{project.address || "Add an address to complete this project."}</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Active works"
          value={stats.activeWorks}
          hint={`${project.works.length} total work packages`}
        />
        <StatCard
          label="Milestones"
          value={`${stats.completedMilestones}/${stats.totalMilestones}`}
          hint="Completed milestones"
        />
        <StatCard
          label="Quoted value"
          value={`$${stats.totalQuoteAmount.toLocaleString()}`}
          hint={`${project.quotes.length} quote record(s)`}
        />
        <StatCard
          label="Inspections"
          value={stats.inspectionCount}
          hint={stats.nextInspection?.name || "No inspections scheduled"}
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Project metadata</h2>
            <p>These top-level fields are stored as columns in the `projects` table.</p>
          </div>
        </div>
        <div className="form-grid">
          {[
            ["name", "Project name"],
            ["street", "Street"],
            ["city", "City"],
            ["county", "County"],
            ["state", "State"],
            ["zip", "ZIP"],
            ["permit", "Permit"],
            ["apn", "APN"],
            ["type", "Occupancy / type"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                value={project[key] || ""}
                onChange={(event) => handleMetadataChange(key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Section inventory</h2>
            <p>The nested arrays still travel with the project, now inside the row’s `data` JSON.</p>
          </div>
        </div>
        <div className="card-grid compact">
          {[
            ["works", project.works.length],
            ["milestones", project.milestones.length],
            ["quotes", project.quotes.length],
            ["plans", project.plans.length],
            ["inspections", project.inspections.length],
            ["invoices", project.invoices.length],
            ["vendors", project.vendors.length],
            ["checklist", project.checklist.length],
            ["qaqcLog", project.qaqcLog.length],
          ].map(([label, value]) => (
            <div key={label} className="mini-card">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
