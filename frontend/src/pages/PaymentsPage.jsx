import { computePayments } from "../projectModel.js";

export function PaymentsPage({ project }) {
  const { rows, summary } = computePayments(project);

  return (
    <>
      <section className="page-head">
        <div>
          <div className="eyebrow">Payments</div>
          <h1>Payment overview</h1>
          <p className="muted">
            This page is derived from milestones, quote payment milestones, and invoices.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Scheduled</span>
          <strong>${summary.scheduled.toLocaleString()}</strong>
          <p>Total planned amount</p>
        </article>
        <article className="stat-card">
          <span>Received</span>
          <strong>${summary.received.toLocaleString()}</strong>
          <p>Marked as paid</p>
        </article>
        <article className="stat-card">
          <span>Balance</span>
          <strong>${summary.balance.toLocaleString()}</strong>
          <p>Remaining due</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Payment ledger</h2>
            <p>Read-only in this first React pass.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Line item</th>
                <th>Scheduled</th>
                <th>Received</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-cell">
                    No payment rows derived yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.label}-${row.id}`}>
                    <td>{row.label}</td>
                    <td>${row.scheduled.toLocaleString()}</td>
                    <td>${row.received.toLocaleString()}</td>
                    <td>${row.balance.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
