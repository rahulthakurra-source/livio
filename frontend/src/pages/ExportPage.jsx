import { downloadJson } from "../projectModel.js";

export function ExportPage({ project }) {
  return (
    <>
      <section className="page-head">
        <div>
          <h1>Export</h1>
          <p className="muted">Download a full project backup for records and transfer</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Project JSON Backup</h2>
            <p>Downloads the complete project object exactly as stored by the API.</p>
          </div>
          <button
            className="button primary"
            onClick={() => downloadJson(`${project.name || "project"}.json`, project)}
          >
            Download JSON
          </button>
        </div>

        <div className="json-block">
          <pre>{JSON.stringify(project, null, 2)}</pre>
        </div>
      </section>
    </>
  );
}
