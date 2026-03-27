import { downloadJson } from "../projectModel.js";

export function ExportPage({ project }) {
  return (
    <>
      <section className="page-head">
        <div>
          <div className="eyebrow">Export</div>
          <h1>Project export</h1>
          <p className="muted">
            This React version keeps export simple while the richer document generators are rebuilt.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>JSON backup</h2>
            <p>Downloads the full project object exactly as it is sent to the API.</p>
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
