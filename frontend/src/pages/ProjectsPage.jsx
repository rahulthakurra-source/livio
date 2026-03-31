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
          <h1>All Projects</h1>
          <p className="muted">Manage multiple construction sites</p>
        </div>
        <button className="button primary" onClick={openCreate}>
          + New Project
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
                    <div className="project-card-name">{project.name}</div>
                    <div className="project-card-addr">{project.city || project.address || "No city yet"}</div>
                    <div className="project-card-addr">
                      {project.county || "No county"} {project.permit ? `| ${project.permit}` : ""}
                    </div>
                  </div>
                  <div className="button-row">
                    <button className="button ghost compact" onClick={() => openEdit(project)}>
                      Edit
                    </button>
                    <button className="button ghost compact danger" onClick={() => onDeleteProject(project.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="project-card-foot">
                <div className="metric-row">
                  <div>
                    <strong>{stats.activeWorks}</strong>
                    <span>Active</span>
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
                <button className="button primary compact" onClick={() => setActiveProjectId(project.id)}>
                  {isActive ? "Active" : "Click to open"}
                </button>
              </div>
            </article>
          );
        })}

        <button className="add-card" onClick={openCreate}>
          <div className="add-card-plus">+</div>
          <div>Add New Project</div>
        </button>
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
