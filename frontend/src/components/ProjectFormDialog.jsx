import { useEffect, useState } from "react";
import { buildAddress } from "../projectModel.js";

const DEFAULT_PROJECT = {
  name: "",
  street: "",
  city: "",
  county: "",
  state: "CA",
  zip: "",
  address: "",
  permit: "",
  apn: "",
  type: "",
  color: "#1A6BC4",
};

export function ProjectFormDialog({
  open,
  project,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(DEFAULT_PROJECT);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      ...DEFAULT_PROJECT,
      ...(project || {}),
    });
  }, [open, project]);

  if (!open) {
    return null;
  }

  function updateField(key, value) {
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };
      next.address = buildAddress(next);
      return next;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      address: buildAddress(form),
    });
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-head">
          <div>
            <h2>{project ? "Edit project" : "New project"}</h2>
            <p>Each project is stored as its own row in the backend.</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <label>
            Project name
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
          </label>
          <label>
            Street
            <input
              value={form.street}
              onChange={(event) => updateField("street", event.target.value)}
            />
          </label>
          <label>
            City
            <input
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
            />
          </label>
          <label>
            County
            <input
              value={form.county}
              onChange={(event) => updateField("county", event.target.value)}
            />
          </label>
          <label>
            State
            <input
              value={form.state}
              onChange={(event) => updateField("state", event.target.value)}
            />
          </label>
          <label>
            ZIP
            <input
              value={form.zip}
              onChange={(event) => updateField("zip", event.target.value)}
            />
          </label>
          <label>
            Permit
            <input
              value={form.permit}
              onChange={(event) => updateField("permit", event.target.value)}
            />
          </label>
          <label>
            APN
            <input
              value={form.apn}
              onChange={(event) => updateField("apn", event.target.value)}
            />
          </label>
          <label>
            Occupancy / type
            <input
              value={form.type}
              onChange={(event) => updateField("type", event.target.value)}
            />
          </label>
          <label>
            Color
            <input
              type="color"
              value={form.color}
              onChange={(event) => updateField("color", event.target.value)}
            />
          </label>

          <div className="dialog-actions">
            <button type="button" className="button ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary">
              Save project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
