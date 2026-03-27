import { useState } from "react";

export function LoginPage({ onLogin, backendStatus }) {
  const [form, setForm] = useState({ username: "admin", password: "livio2026" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onLogin(form);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-eyebrow">Livio Project Control</div>
        <h1>React Frontend + Render-Ready API</h1>
        <p className="muted">
          This migration stores each project as its own database row and keeps auth on the
          backend.
        </p>

        <div className={`status-banner ${backendStatus.ok ? "ok" : "warn"}`}>
          {backendStatus.message}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Username
            <input
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>
          {error ? <div className="status-banner warn">{error}</div> : null}
          <button className="button primary" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
