import { useEffect, useState } from "react";
import { api } from "./api.js";
import { normalizeProject } from "./projectModel.js";
import { DailyTrackerPage } from "./pages/DailyTrackerPage.jsx";
import { MomentumPage } from "./pages/MomentumPage.jsx";

function DailyTrackerStandalone() {
  const params = new URLSearchParams(window.location.search);
  const requestedProjectId = params.get("projectId") || "";
  const user = {
    username: params.get("username") || "admin",
    role: params.get("role") || "Admin",
  };

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      setLoading(true);
      setError("");
      try {
        const response = await api.listProjects();
        if (!mounted) return;
        const allProjects = (response.projects || []).map(normalizeProject);
        const matchedProject =
          allProjects.find((entry) => entry.id === requestedProjectId) || allProjects[0] || null;
        setProject(matchedProject);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError.message || "Unable to load Daily Tracker project.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProject();
    return () => {
      mounted = false;
    };
  }, [requestedProjectId]);

  async function handleSaveProject(nextProject) {
    const normalizedProject = normalizeProject(nextProject);
    const response = await api.updateProject(normalizedProject.id, normalizedProject);
    const savedProject = normalizeProject(response.project || normalizedProject);
    setProject(savedProject);
    return savedProject;
  }

  if (loading) {
    return <div className="app-loading tracker-standalone-shell">Loading Daily Tracker...</div>;
  }

  if (error) {
    return <div className="empty-state large tracker-standalone-shell">{error}</div>;
  }

  if (!project) {
    return <div className="empty-state large tracker-standalone-shell">No project found.</div>;
  }

  return (
    <div className="tracker-standalone-shell">
      <DailyTrackerPage project={project} onSaveProject={handleSaveProject} user={user} />
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "daily-tracker-react") {
    return <DailyTrackerStandalone />;
  }

  if (params.get("view") === "momentum") {
    return <MomentumPage />;
  }

  const legacyVersion = "2026-03-31-legacy-combined";

  return (
    <div className="legacy-shell">
      <div className="legacy-bar">
        <div className="legacy-title">Livio Legacy AI</div>
      </div>

      <iframe
        className="legacy-frame"
        title="Livio Legacy AI"
        src={`/legacy/livio-combined.html?v=${legacyVersion}`}
      />
    </div>
  );
}
