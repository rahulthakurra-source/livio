import { useEffect, useMemo, useState } from "react";
import { SECTION_CONFIGS } from "../projectModel.js";

function makeBlankItem(config) {
  const blank = { id: crypto.randomUUID() };
  for (const field of config.fields) {
    blank[field.key] = field.type === "number" ? 0 : "";
  }
  return blank;
}

export function CollectionEditor({
  project,
  sectionKey,
  onSave,
}) {
  const config = SECTION_CONFIGS[sectionKey];
  const [draft, setDraft] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

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
    await onSave({
      ...project,
      [sectionKey]: draft,
    });
  }

  return (
    <div className="split-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{config.title}</h2>
            <p>{draft.length} item(s)</p>
          </div>
          <button className="button primary" onClick={addItem}>
            Add {config.itemTitle}
          </button>
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
                  <strong>{item.name || item.vendor || item.refNo || item.id}</strong>
                  <span className="muted">
                    {item.status || item.date || item.invoiceNo || item.category || "Draft"}
                  </span>
                </div>
                <span className="pill">{item.id}</span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{selectedItem ? config.itemTitle : "Select an item"}</h2>
            <p>Edit the selected item and save changes for this project.</p>
          </div>
          <button className="button primary" onClick={handleSave}>
            Save section
          </button>
        </div>

        {selectedItem ? (
          <>
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

            <div className="json-block">
              <div className="json-head">
                <strong>Raw item JSON</strong>
                <button className="button ghost" onClick={() => removeItem(selectedItem.id)}>
                  Delete item
                </button>
              </div>
              <pre>{JSON.stringify(selectedItem, null, 2)}</pre>
            </div>
          </>
        ) : (
          <div className="empty-state">Pick a row on the left or create a new item.</div>
        )}
      </section>
    </div>
  );
}
