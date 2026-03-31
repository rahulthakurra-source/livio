import { startTransition, useEffect, useState } from "react";
import { api } from "./api.js";
import { CollectionEditor } from "./components/CollectionEditor.jsx";
import { Layout } from "./components/Layout.jsx";
import { DailyTrackerPage } from "./pages/DailyTrackerPage.jsx";
import { CompliancePage } from "./pages/CompliancePage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { ExportPage } from "./pages/ExportPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { PaymentsPage } from "./pages/PaymentsPage.jsx";
import { ProjectsPage } from "./pages/ProjectsPage.jsx";
import { UsersPage } from "./pages/UsersPage.jsx";
import { normalizeProject, PAGE_DEFINITIONS } from "./projectModel.js";

const SESSION_KEY = "livio-react-session";
const DEFAULT_USER = {
  username: "admin",
  role: "Admin",
  email: "admin@liviobuilding.com",
};

function readStoredUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return DEFAULT_USER;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
}

function renderPage(page, project, props) {
  const pageDefinition = PAGE_DEFINITIONS.find((entry) => entry.id === page);
  if (!pageDefinition) {
    return <div className="empty-state large">Page not found.</div>;
  }

  if (pageDefinition.type === "root") {
    return (
      <ProjectsPage
        projects={props.projects}
        activeProjectId={props.activeProjectId}
        setActiveProjectId={props.setActiveProjectId}
        onCreateProject={props.onCreateProject}
        onUpdateProject={props.onUpdateProject}
        onDeleteProject={props.onDeleteProject}
      />
    );
  }

  if (pageDefinition.type === "users") {
    return (
      <UsersPage
        users={props.users}
        onCreateUser={props.onCreateUser}
        onUpdateUser={props.onUpdateUser}
        onDeleteUser={props.onDeleteUser}
      />
    );
  }

  if (!project) {
    return <div className="empty-state large">Select a project to continue.</div>;
  }

  if (pageDefinition.type === "dailyTracker") {
    return <DailyTrackerPage project={project} onSaveProject={props.onSaveProject} user={props.user} />;
  }

  if (pageDefinition.type === "dashboard") {
    return <DashboardPage project={project} onSaveProject={props.onSaveProject} />;
  }

  if (pageDefinition.type === "payments") {
    return <PaymentsPage project={project} />;
  }

  if (pageDefinition.type === "compliance") {
    return <CompliancePage project={project} />;
  }

  if (pageDefinition.type === "export") {
    return <ExportPage project={project} />;
  }

  if (pageDefinition.type === "section") {
    return (
      <CollectionEditor
        project={project}
        sectionKey={pageDefinition.sectionKey}
        onSave={props.onSaveProject}
      />
    );
  }

  return <div className="empty-state large">This page is not available yet.</div>;
}

export default function App() {
  const [user, setUser] = useState(() => readStoredUser());
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [page, setPage] = useState("projects");
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState("");
  const [backendStatus, setBackendStatus] = useState({
    ok: true,
    message: "React app is ready.",
  });

  useEffect(() => {
    let mounted = true;

    async function checkHealth() {
      try {
        const health = await api.health();
        if (!mounted) return;
        setBackendStatus({
          ok: Boolean(health?.ok),
          message: health?.ok
            ? "Backend connected. React project workspace is active."
            : "Backend responded with a warning.",
        });
      } catch (error) {
        if (!mounted) return;
        setBackendStatus({
          ok: false,
          message: error.message || "Backend is unreachable.",
        });
      }
    }

    checkHealth();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setAppError("");

      try {
        const [projectResponse, userResponse] = await Promise.all([
          api.listProjects(),
          user?.role === "Admin" ? api.listUsers() : Promise.resolve({ users: [] }),
        ]);

        if (!mounted) return;

        const nextProjects = (projectResponse.projects || []).map(normalizeProject);
        setProjects(nextProjects);
        setUsers(userResponse.users || []);
        setActiveProjectId((current) => {
          if (current && nextProjects.some((project) => project.id === current)) {
            return current;
          }
          return nextProjects[0]?.id || "";
        });
      } catch (error) {
        if (!mounted) return;
        setAppError(error.message || "Unable to load data.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [user]);

  const activeProject = projects.find((project) => project.id === activeProjectId) || null;

  async function handleLogin(credentials) {
    const response = await api.login(credentials);
    setUser(response.user);
  }

  function handleLogout() {
    setUser(null);
    setProjects([]);
    setUsers([]);
    setActiveProjectId("");
    setPage("projects");
  }

  async function handleCreateProject(project) {
    const response = await api.createProject(normalizeProject(project));
    const nextProject = normalizeProject(response.project);
    setProjects((current) => [nextProject, ...current]);
    setActiveProjectId(nextProject.id);
    startTransition(() => setPage("dashboard"));
  }

  async function handleUpdateProject(projectId, project) {
    const response = await api.updateProject(projectId, normalizeProject(project));
    const savedProject = normalizeProject(response.project);
    setProjects((current) =>
      current.map((entry) => (entry.id === savedProject.id ? savedProject : entry)),
    );
    return savedProject;
  }

  async function handleDeleteProject(projectId) {
    if (!window.confirm("Delete this project?")) return;
    await api.deleteProject(projectId);
    setProjects((current) => current.filter((entry) => entry.id !== projectId));
    if (activeProjectId === projectId) {
      const remaining = projects.filter((entry) => entry.id !== projectId);
      setActiveProjectId(remaining[0]?.id || "");
      startTransition(() => setPage("projects"));
    }
  }

  async function handleSaveProject(project) {
    return handleUpdateProject(project.id, project);
  }

  async function handleCreateUser(nextUser) {
    const response = await api.createUser(nextUser);
    setUsers((current) => [...current, response.user].sort((a, b) => a.username.localeCompare(b.username)));
  }

  async function handleUpdateUser(userId, nextUser) {
    const response = await api.updateUser(userId, nextUser);
    setUsers((current) =>
      current
        .map((entry) => (entry.id === userId ? response.user : entry))
        .sort((a, b) => a.username.localeCompare(b.username)),
    );
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm("Delete this user?")) return;
    await api.deleteUser(userId);
    setUsers((current) => current.filter((entry) => entry.id !== userId));
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} backendStatus={backendStatus} />;
  }

  if (loading) {
    return <div className="app-loading">Loading React workspace…</div>;
  }

  return (
    <Layout
      user={user}
      page={page}
      setPage={(nextPage) => startTransition(() => setPage(nextPage))}
      projects={projects}
      activeProject={activeProject}
      onLogout={handleLogout}
    >
      {appError ? <div className="status-banner warn">{appError}</div> : null}
      {renderPage(page, activeProject, {
        user,
        users,
        projects,
        activeProjectId,
        setActiveProjectId,
        onCreateProject: handleCreateProject,
        onUpdateProject: handleUpdateProject,
        onDeleteProject: handleDeleteProject,
        onSaveProject: handleSaveProject,
        onCreateUser: handleCreateUser,
        onUpdateUser: handleUpdateUser,
        onDeleteUser: handleDeleteUser,
      })}
    </Layout>
  );
}
