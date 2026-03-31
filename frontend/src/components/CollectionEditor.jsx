import { useEffect, useMemo, useState } from "react";
import { SECTION_CONFIGS } from "../projectModel.js";

function makeBlankItem(config) {
  const blank = { id: crypto.randomUUID() };
  for (const field of config.fields) {
    blank[field.key] = field.type === "number" ? 0 : "";
  }
  return blank;
}

function getItemLabel(item) {
  return (
    item.name ||
    item.vendor ||
    item.client ||
    item.contractNo ||
    item.invoiceNo ||
    item.refNo ||
    item.ref ||
    item.id
  );
}

function getItemMeta(item) {
  return item.status || item.date || item.inspDate || item.invoiceDate || item.category || "Draft";
}

export function CollectionEditor({ project, sectionKey, onSave }) {
  const config = SECTION_CONFIGS[sectionKey];
  const [draft, setDraft] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const list = Array.isArray(project?.[sectionKey]) ? project[sectionKey] : [];
    setDraft(list);
    setSelectedId(list[0]?.id || null);
  }, [project, sectionKey]);

  const selectedItem = useMemo(
    () => draft.find((item) => item.id === selectedId) || null,
    [draft, selectedId],
  );

  if (!config) {
    return (
      <section className="panel">
        <h2>Unsupported section</h2>
        <p>This section is not configured yet.</p>
      </section>
    );
  }

  function updateItem(updatedItem) {
    setDraft((current) =>
      current.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  }

  function addItem() {
    const item = makeBlankItem(config);
    setDraft((current) => [item, ...current]);
    setSelectedId(item.id);
  }

  function removeItem(id) {
    const remaining = draft.filter((item) => item.id !== id);
    setDraft(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0]?.id || null);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        ...project,
        [sectionKey]: draft,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="page-head">
        <div>
          <h1>{config.title}</h1>
          <p className="muted">{config.subtitle || `${draft.length} item(s)`}</p>
        </div>
        <div className="button-row wrap">
          <button className="button primary" onClick={addItem}>
            {config.addLabel || `+ Add ${config.itemTitle}`}
          </button>
          <button className="button ghost" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      <div className="split-grid legacy-sections">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{config.title}</h2>
              <p>{draft.length} record(s)</p>
            </div>
          </div>

          <div className="list-stack">
            {draft.length === 0 ? (
              <div className="empty-state">No items yet.</div>
            ) : (
              draft.map((item) => (
                <button
                  key={item.id}
                  className={`list-card ${selectedId === item.id ? "active" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div>
                    <strong>{getItemLabel(item)}</strong>
                    <span className="muted">{getItemMeta(item)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{selectedItem ? getItemLabel(selectedItem) : `Select ${config.itemTitle}`}</h2>
              <p>
                {selectedItem
                  ? "Edit the selected record and save it for this project."
                  : "Pick a record on the left or create a new one."}
              </p>
            </div>
            {selectedItem ? (
              <button className="button ghost danger" onClick={() => removeItem(selectedItem.id)}>
                Delete
              </button>
            ) : null}
          </div>

          {selectedItem ? (
            <div className="form-grid">
              {config.fields.map((field) => (
                <label key={field.key} className={field.type === "textarea" ? "span-two" : ""}>
                  {field.label}
                  {field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={selectedItem[field.key] ?? ""}
                      onChange={(event) =>
                        updateItem({
                          ...selectedItem,
                          [field.key]: event.target.value,
                        })
                      }
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={selectedItem[field.key] ?? ""}
                      onChange={(event) =>
                        updateItem({
                          ...selectedItem,
                          [field.key]:
                            field.type === "number"
                              ? Number(event.target.value)
                              : event.target.value,
                        })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="empty-state">Select a record to edit details.</div>
          )}
        </section>
      </div>
    </>
  );
}
