import { useMemo, useState } from "react";
import { computeDashboard } from "../projectModel.js";
import { ProjectFormDialog } from "../components/ProjectFormDialog.jsx";

export function ProjectsPage({
  projects,
  activeProjectId,
  setActiveProjectId,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}) {
  const [editingProject, setEditingProject] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) =>
        String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
      ),
    [projects],
  );

  function openCreate() {
    setEditingProject(null);
    setDialogOpen(true);
  }

  function openEdit(project) {
    setEditingProject(project);
    setDialogOpen(true);
  }

  async function handleSubmit(project) {
    if (editingProject) {
      await onUpdateProject(editingProject.id, project);
    } else {
      await onCreateProject(project);
    }
    setDialogOpen(false);
    setEditingProject(null);
  }

  return (
    <>
      <section className="page-head">
        <div>
          <div className="eyebrow">Projects</div>
          <h1>Project library</h1>
          <p className="muted">
            Each project now lives in its own database row instead of one shared snapshot.
          </p>
        </div>
        <button className="button primary" onClick={openCreate}>
          New project
        </button>
      </section>

      <section className="card-grid">
        {sortedProjects.map((project) => {
          const stats = computeDashboard(project);
          const isActive = project.id === activeProjectId;

          return (
            <article
              key={project.id}
              className={`project-card ${isActive ? "active" : ""}`}
              style={{ borderColor: project.color || "#1A6BC4" }}
            >
              <div className="project-card-bar" style={{ background: project.color || "#1A6BC4" }} />
              <div className="project-card-body">
                <div className="project-card-top">
                  <div>
                    <h2>{project.name}</h2>
                    <p>{project.address || project.city || "No address yet"}</p>
                  </div>
                  <span className="pill">{project.permit || "No permit"}</span>
                </div>

                <div className="metric-row">
                  <div>
                    <strong>{stats.activeWorks}</strong>
                    <span>Active works</span>
                  </div>
                  <div>
                    <strong>
                      {stats.completedMilestones}/{stats.totalMilestones}
                    </strong>
                    <span>Milestones</span>
                  </div>
                  <div>
                    <strong>${stats.totalQuoteAmount.toLocaleString()}</strong>
                    <span>Quoted</span>
                  </div>
                </div>

                <div className="button-row">
                  <button className="button primary" onClick={() => setActiveProjectId(project.id)}>
                    {isActive ? "Active" : "Open"}
                  </button>
                  <button className="button ghost" onClick={() => openEdit(project)}>
                    Edit
                  </button>
                  <button className="button ghost" onClick={() => onDeleteProject(project.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <ProjectFormDialog
        open={dialogOpen}
        project={editingProject}
        onClose={() => {
          setDialogOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
