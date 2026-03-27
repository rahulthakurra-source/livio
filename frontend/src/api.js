const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://livio-mbol.onrender.com/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export const api = {
  health: () => request("/health"),
  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  listProjects: () => request("/projects"),
  createProject: (project) =>
    request("/projects", {
      method: "POST",
      body: JSON.stringify(project),
    }),
  updateProject: (projectId, project) =>
    request(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(project),
    }),
  deleteProject: (projectId) =>
    request(`/projects/${projectId}`, {
      method: "DELETE",
    }),
  listUsers: () => request("/users"),
  createUser: (user) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(user),
    }),
  updateUser: (userId, user) =>
    request(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(user),
    }),
  deleteUser: (userId) =>
    request(`/users/${userId}`, {
      method: "DELETE",
    }),
};
