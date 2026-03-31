import { useEffect, useState } from "react";
import { buildAddress } from "../projectModel.js";

const DEFAULT_PROJECT = {
  name: "",
  ownerName: "",
  ownerEmail: "",
  street: "",
  city: "",
  county: "",
  state: "CA",
  zip: "",
  address: "",
  permit: "",
  apn: "",
  type: "R-3 Single-Family Residential",
  color: "#1A6BC4",
};

const STATE_OPTIONS = ["CA", "AZ", "NV", "TX"];
const OCCUPANCY_OPTIONS = [
  "R-3 Single-Family Residential",
  "R-2 Multi-Family Residential",
  "B Business Occupancy",
  "M Mercantile Occupancy",
  "S Storage Occupancy",
];

export function ProjectFormDialog({ open, project, onClose, onSubmit }) {
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
      <div className="dialog legacy-project-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="legacy-project-dialog-head">
          <div>
            <h2>{project ? "Edit Project" : "New Project"}</h2>
          </div>
          <button className="legacy-dialog-close" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form className="project-form legacy-project-form" onSubmit={handleSubmit}>
          <label className="span-two legacy-field">
            <span>Project Name *</span>
            <input
              placeholder="e.g. 1510 Madera Drive"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
          </label>

          <label className="legacy-field">
            <span>Client / Owner Name</span>
            <input
              placeholder="e.g. John Smith / ABC Development"
              value={form.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
            />
          </label>

          <label className="legacy-field">
            <span>Client / Owner Email</span>
            <input
              type="email"
              placeholder="client@example.com"
              value={form.ownerEmail}
              onChange={(event) => updateField("ownerEmail", event.target.value)}
            />
          </label>

          <label className="span-two legacy-field">
            <span>Street Address</span>
            <input
              placeholder="e.g. 1510 Madera Drive"
              value={form.street}
              onChange={(event) => updateField("street", event.target.value)}
            />
          </label>

          <label className="legacy-field">
            <span>City</span>
            <input
              placeholder="e.g. Cupertino"
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
            />
          </label>

          <label className="legacy-field">
            <span>State</span>
            <select
              value={form.state}
              onChange={(event) => updateField("state", event.target.value)}
            >
              {STATE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="legacy-field">
            <span>County</span>
            <input
              placeholder="e.g. Santa Clara County"
              value={form.county}
              onChange={(event) => updateField("county", event.target.value)}
            />
          </label>

          <label className="legacy-field">
            <span>ZIP Code</span>
            <input
              placeholder="e.g. 95014"
              value={form.zip}
              onChange={(event) => updateField("zip", event.target.value)}
            />
          </label>

          <label className="legacy-field">
            <span>Permit Number</span>
            <input
              placeholder="e.g. CUPR-2025-00891"
              value={form.permit}
              onChange={(event) => updateField("permit", event.target.value)}
            />
          </label>

          <label className="legacy-field">
            <span>APN</span>
            <input
              placeholder="e.g. 326-10-044"
              value={form.apn}
              onChange={(event) => updateField("apn", event.target.value)}
            />
          </label>

          <label className="span-two legacy-field">
            <span>Occupancy / Type</span>
            <select
              value={form.type}
              onChange={(event) => updateField("type", event.target.value)}
            >
              {OCCUPANCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="span-two legacy-field">
            <span>Project Color</span>
            <div className="project-color-row">
              <input
                className="project-color-picker"
                type="color"
                value={form.color}
                onChange={(event) => updateField("color", event.target.value)}
              />
              <div className="project-color-value">{form.color}</div>
            </div>
          </label>

          <div className="dialog-actions span-two legacy-dialog-actions">
            <button type="button" className="button ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary">
              Save Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
