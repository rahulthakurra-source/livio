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
      <section className="page-head page-head-legacy">
        <div>
          <h1>All Projects</h1>
          <p className="muted">Manage multiple construction sites</p>
        </div>
        <button className="button primary" onClick={openCreate}>
          + New Project
        </button>
      </section>

      <section className="projects-grid-legacy">
        {sortedProjects.map((project) => {
          const stats = computeDashboard(project);
          const isActive = project.id === activeProjectId;
          const locationLine = project.city || project.address || "Cupertino";
          const countyLine = project.county || "Santa Clara County";
          const permitLine = project.permit || "--";

          return (
            <article
              key={project.id}
              className={`project-card legacy-project-card ${isActive ? "active" : ""}`}
              style={{ borderColor: project.color || "#1A6BC4" }}
            >
              <div
                className="project-card-bar"
                style={{ background: project.color || "#1A6BC4" }}
              />
              <div className="project-card-body">
                <div className="project-card-top">
                  <div>
                    <div className="project-card-name">{project.name}</div>
                    <div className="project-card-addr">{locationLine}</div>
                    <div className="project-card-addr">
                      {countyLine} {"\u00B7"} {permitLine}
                    </div>
                  </div>
                  <div className="project-card-tools">
                    <button
                      className="project-icon-button"
                      onClick={() => openEdit(project)}
                      title="Edit project"
                      type="button"
                    >
                      {"\u270E"}
                    </button>
                    <button
                      className="project-icon-button danger"
                      onClick={() => onDeleteProject(project.id)}
                      title="Delete project"
                      type="button"
                    >
                      {"\u2715"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="project-card-foot">
                <div className="metric-row project-metric-row">
                  <div className="project-metric amber">
                    <strong>{stats.activeWorks}</strong>
                    <span>Active</span>
                  </div>
                  <div className="project-metric green">
                    <strong>
                      {stats.completedMilestones}/{stats.totalMilestones}
                    </strong>
                    <span>Milestones</span>
                  </div>
                  <div className="project-metric blue">
                    <strong>${stats.totalQuoteAmount.toLocaleString()}</strong>
                    <span>Quoted</span>
                  </div>
                </div>
                <button
                  className={`project-open-button ${isActive ? "active" : ""}`}
                  onClick={() => setActiveProjectId(project.id)}
                  type="button"
                >
                  {isActive ? "Active" : "Click to open"}
                </button>
              </div>
            </article>
          );
        })}

        <button className="add-card legacy-add-card" onClick={openCreate} type="button">
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
