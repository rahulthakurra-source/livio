export function CompliancePage({ project }) {
  const checklistOpen = project.checklist.filter((item) => item.status !== "done").length;
  const qaqcOpen = project.qaqcLog.filter((item) => item.status !== "closed").length;
  const inspectionCount = project.inspections.length;

  return (
    <>
      <section className="page-head">
        <div>
          <div className="eyebrow">Compliance</div>
          <h1>Compliance and quality snapshot</h1>
          <p className="muted">
            This first React pass keeps compliance as a summary instead of recreating the entire
            legacy presentation layer.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Open checklist items</span>
          <strong>{checklistOpen}</strong>
          <p>Actionable items not yet marked done</p>
        </article>
        <article className="stat-card">
          <span>Open QA/QC items</span>
          <strong>{qaqcOpen}</strong>
          <p>Observations and punch items still active</p>
        </article>
        <article className="stat-card">
          <span>Inspections logged</span>
          <strong>{inspectionCount}</strong>
          <p>Inspection records currently stored</p>
        </article>
      </section>
    </>
  );
}
