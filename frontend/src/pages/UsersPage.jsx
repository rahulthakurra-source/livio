import { useMemo, useState } from "react";

const EMPTY_USER = {
  username: "",
  password: "",
  role: "Manager",
  email: "",
};

export function UsersPage({ users, onCreateUser, onUpdateUser, onDeleteUser }) {
  const [draft, setDraft] = useState(EMPTY_USER);
  const orderedUsers = useMemo(
    () => [...users].sort((a, b) => a.username.localeCompare(b.username)),
    [users],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreateUser(draft);
    setDraft(EMPTY_USER);
  }

  return (
    <>
      <section className="page-head">
        <div>
          <div className="eyebrow">Users</div>
          <h1>User administration</h1>
          <p className="muted">These rows are stored in the `app_users` table through the backend.</p>
        </div>
      </section>

      <div className="split-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Current users</h2>
              <p>{orderedUsers.length} account(s)</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    <td>{user.email || "—"}</td>
                    <td>
                      <div className="button-row">
                        <button
                          className="button ghost"
                          onClick={() => {
                            const password = prompt(`New password for ${user.username}`);
                            if (!password) return;
                            onUpdateUser(user.id, {
                              ...user,
                              password,
                            });
                          }}
                        >
                          Password
                        </button>
                        <button className="button ghost" onClick={() => onDeleteUser(user.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Add user</h2>
              <p>This mirrors the legacy user-management feature set at a simpler level.</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Username
              <input
                value={draft.username}
                onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={draft.password}
                onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </label>
            <label>
              Role
              <input
                value={draft.role}
                onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <div className="dialog-actions">
              <button className="button primary" type="submit">
                Create user
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
