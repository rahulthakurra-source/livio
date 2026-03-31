import { useEffect, useRef, useState } from "react";
import { normalizeDailyTracker } from "../projectModel.js";

const BASE_CHECKLIST_SECTIONS = [
  {
    key: "foundation",
    label: "Foundation Work",
    icon: "🏛️",
    items: [
      { id: "f1", text: "Excavation depth and dimensions verified", pts: 10 },
      { id: "f2", text: "Soil condition checked and documented", pts: 8 },
      { id: "f3", text: "Bottom of excavation leveled and compacted", pts: 8 },
      { id: "f4", text: "Waterproofing or anti-termite treatment reviewed", pts: 6 },
      { id: "f5", text: "Foundation width and depth match drawings", pts: 10 },
    ],
  },
  {
    key: "rebar",
    label: "Rebar Work",
    icon: "🔩",
    items: [
      { id: "r1", text: "Rebar diameter matches structural drawing", pts: 10 },
      { id: "r2", text: "Rebar spacing is correct", pts: 10 },
      { id: "r3", text: "Cover blocks or spacers installed", pts: 8 },
      { id: "r4", text: "Lap length meets code requirements", pts: 8 },
      { id: "r5", text: "All bar intersections tied securely", pts: 6 },
    ],
  },
  {
    key: "formwork",
    label: "Form Work",
    icon: "🪵",
    items: [
      { id: "fw1", text: "Formwork is plumb and level", pts: 10 },
      { id: "fw2", text: "Dimensions match drawing requirements", pts: 10 },
      { id: "fw3", text: "Release agent applied properly", pts: 6 },
      { id: "fw4", text: "Joints sealed to avoid slurry leakage", pts: 7 },
      { id: "fw5", text: "Props and bracing checked", pts: 8 },
    ],
  },
];

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function formatDateLabel(value) {
  if (!value) return "No date";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDateLabel(value) {
  if (!value) return "No date";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

function formatTopbarDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(value) {
  if (value) return value;
  return new Date().toISOString().slice(0, 10);
}

function normalizeDay(day = {}, index = 0) {
  return {
    id: day.id || makeId("day"),
    dayNum: Number(day.dayNum || index + 1),
    date: day.date || toDateInputValue(),
    location: day.location || "",
    staff: day.staff || day.inspector || "",
    notes: day.notes || "",
    checks: day.checks && typeof day.checks === "object" ? day.checks : {},
    comments: day.comments && typeof day.comments === "object" ? day.comments : {},
    customItems: day.customItems && typeof day.customItems === "object" ? day.customItems : {},
    customSections:
      day.customSections && typeof day.customSections === "object" ? day.customSections : {},
    removedChecklistItems:
      day.removedChecklistItems && typeof day.removedChecklistItems === "object"
        ? day.removedChecklistItems
        : {},
    removedChecklistSections: Array.isArray(day.removedChecklistSections)
      ? day.removedChecklistSections
      : [],
    sectionOverrides:
      day.sectionOverrides && typeof day.sectionOverrides === "object" ? day.sectionOverrides : {},
    itemOverrides:
      day.itemOverrides && typeof day.itemOverrides === "object" ? day.itemOverrides : {},
    media: Array.isArray(day.media) ? day.media : [],
    mediaDraftCategory: day.mediaDraftCategory || "",
  };
}

function normalizeDiscussion(item = {}, index = 0) {
  return {
    id: item.id || makeId("discussion"),
    num: Number(item.num || index + 1),
    title: item.title || "Untitled topic",
    status: item.status || "pending",
    notes: item.notes || "",
    date: item.date || toDateInputValue(),
    comments: Array.isArray(item.comments) ? item.comments : [],
  };
}

function normalizeTrackerState(tracker) {
  const nextTracker = normalizeDailyTracker(tracker);
  return {
    days: nextTracker.days.map((day, index) => normalizeDay(day, index)),
    discussions: nextTracker.discussions.map((item, index) => normalizeDiscussion(item, index)),
  };
}

function getChecklistSections(day) {
  const removed = day.removedChecklistSections || [];
  const overrides = day.sectionOverrides || {};
  const baseSections = BASE_CHECKLIST_SECTIONS.filter((section) => !removed.includes(section.key)).map(
    (section) => ({
      ...section,
      ...(overrides[section.key] || {}),
      custom: false,
    }),
  );
  const customSections = Object.entries(day.customSections || {}).map(([key, section]) => ({
    key,
    label: section.label,
    icon: section.icon || "🗂️",
    items: [],
    custom: true,
  }));
  return [...baseSections, ...customSections];
}

function getChecklistItems(day, sectionKey) {
  const baseSection = BASE_CHECKLIST_SECTIONS.find((section) => section.key === sectionKey);
  const baseItems = baseSection?.items || [];
  const customItems = day.customItems?.[sectionKey] || [];
  const removedItems = day.removedChecklistItems?.[sectionKey] || [];
  const itemOverrides = day.itemOverrides || {};
  return [...baseItems, ...customItems]
    .filter((item) => !removedItems.includes(item.id))
    .map((item) => ({ ...item, ...(itemOverrides[item.id] || {}) }));
}

function getMediaDraftCategory(day) {
  const sections = getChecklistSections(day);
  if (!sections.length) return "";
  return sections.some((section) => section.key === day.mediaDraftCategory)
    ? day.mediaDraftCategory
    : sections[0].key;
}

function scoreDay(day) {
  let done = 0;
  let total = 0;
  getChecklistSections(day).forEach((section) => {
    getChecklistItems(day, section.key).forEach((item) => {
      total += 1;
      if (day.checks?.[item.id] === "checked") {
        done += 1;
      }
    });
  });
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

function countNaItems(day) {
  let count = 0;
  getChecklistSections(day).forEach((section) => {
    getChecklistItems(day, section.key).forEach((item) => {
      if (day.checks?.[item.id] === "na") {
        count += 1;
      }
    });
  });
  return count;
}

function sectionTone(sectionKey) {
  if (sectionKey === "foundation") return "f";
  if (sectionKey === "rebar") return "r";
  if (sectionKey === "formwork") return "fw";
  return "cust";
}

function discussionStatusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "done") return "done";
  if (value === "in-progress" || value === "in progress") return "prog";
  if (value === "discussion") return "disc";
  return "pend";
}

function promptDay(day) {
  const date = window.prompt("Date (YYYY-MM-DD)", day?.date || toDateInputValue());
  if (date === null) return null;
  const location = window.prompt("Site / Location", day?.location || "");
  if (location === null) return null;
  const staff = window.prompt("Site lead / staff", day?.staff || "");
  if (staff === null) return null;
  const notes = window.prompt("Start of day notes", day?.notes || "");
  if (notes === null) return null;

  return {
    date: date.trim() || toDateInputValue(),
    location: location.trim(),
    staff: staff.trim(),
    notes: notes.trim(),
  };
}

function promptDiscussion(item) {
  const title = window.prompt("Topic title", item?.title || "");
  if (title === null || !title.trim()) return null;
  const notes = window.prompt("Topic notes", item?.notes || "");
  if (notes === null) return null;
  const status = window.prompt(
    "Status (pending, in-progress, done)",
    item?.status || "pending",
  );
  if (status === null) return null;
  return {
    title: title.trim(),
    notes: notes.trim(),
    status: status.trim() || "pending",
    date: item?.date || toDateInputValue(),
  };
}

export function DailyTrackerPage({ project, onSaveProject, user }) {
  const fileInputRef = useRef(null);
  const [tracker, setTracker] = useState(() => normalizeTrackerState(project.dailyTracker));
  const [selectedDayId, setSelectedDayId] = useState("");
  const [selectedDiscussionId, setSelectedDiscussionId] = useState("");
  const [sideView, setSideView] = useState("days");
  const [dayTab, setDayTab] = useState("checklist");
  const [daySearch, setDaySearch] = useState("");
  const [discussionSearch, setDiscussionSearch] = useState("");
  const [mediaLightbox, setMediaLightbox] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextTracker = normalizeTrackerState(project.dailyTracker);
    setTracker(nextTracker);
    setSelectedDayId((current) => current || nextTracker.days[0]?.id || "");
    setSelectedDiscussionId((current) => current || nextTracker.discussions[0]?.id || "");
  }, [project]);

  const selectedDay = tracker.days.find((day) => day.id === selectedDayId) || null;
  const selectedDiscussion =
    tracker.discussions.find((item) => item.id === selectedDiscussionId) || null;

  async function persist(nextTracker, options = {}) {
    const normalized = {
      days: nextTracker.days.map((day, index) => normalizeDay({ ...day, dayNum: index + 1 }, index)),
      discussions: nextTracker.discussions.map((item, index) =>
        normalizeDiscussion({ ...item, num: index + 1 }, index),
      ),
    };

    setTracker(normalized);
    if (options.selectedDayId !== undefined) setSelectedDayId(options.selectedDayId);
    if (options.selectedDiscussionId !== undefined) setSelectedDiscussionId(options.selectedDiscussionId);
    if (options.dayTab) setDayTab(options.dayTab);

    setSaving(true);
    setError("");
    try {
      await onSaveProject({
        ...project,
        dailyTracker: normalized,
      });
    } catch (saveError) {
      setError(saveError.message || "Unable to save Daily Tracker changes.");
    } finally {
      setSaving(false);
    }
  }

  async function addDay() {
    const payload = promptDay();
    if (!payload) return;
    const nextDay = normalizeDay(
      {
        id: makeId("day"),
        dayNum: tracker.days.length + 1,
        ...payload,
      },
      tracker.days.length,
    );
    await persist(
      {
        ...tracker,
        days: [nextDay, ...tracker.days],
      },
      { selectedDayId: nextDay.id, dayTab: "checklist" },
    );
  }

  async function editDay(dayId) {
    const day = tracker.days.find((entry) => entry.id === dayId);
    if (!day) return;
    const payload = promptDay(day);
    if (!payload) return;
    await persist(
      {
        ...tracker,
        days: tracker.days.map((entry) => (entry.id === dayId ? { ...entry, ...payload } : entry)),
      },
      { selectedDayId: dayId },
    );
  }

  async function deleteDay(dayId) {
    if (!window.confirm("Delete this day?")) return;
    const remaining = tracker.days.filter((entry) => entry.id !== dayId);
    await persist(
      {
        ...tracker,
        days: remaining,
      },
      { selectedDayId: remaining[0]?.id || "", dayTab: "checklist" },
    );
  }

  async function addDiscussion() {
    const payload = promptDiscussion();
    if (!payload) return;
    const nextItem = normalizeDiscussion(
      {
        id: makeId("discussion"),
        num: tracker.discussions.length + 1,
        ...payload,
        comments: [],
      },
      tracker.discussions.length,
    );
    await persist(
      {
        ...tracker,
        discussions: [nextItem, ...tracker.discussions],
      },
      { selectedDiscussionId: nextItem.id },
    );
  }

  async function editDiscussion(discussionId) {
    const item = tracker.discussions.find((entry) => entry.id === discussionId);
    if (!item) return;
    const payload = promptDiscussion(item);
    if (!payload) return;
    await persist(
      {
        ...tracker,
        discussions: tracker.discussions.map((entry) =>
          entry.id === discussionId ? { ...entry, ...payload } : entry,
        ),
      },
      { selectedDiscussionId: discussionId },
    );
  }

  async function deleteDiscussion(discussionId) {
    if (!window.confirm("Delete this discussion topic?")) return;
    const remaining = tracker.discussions.filter((entry) => entry.id !== discussionId);
    await persist(
      {
        ...tracker,
        discussions: remaining,
      },
      { selectedDiscussionId: remaining[0]?.id || "" },
    );
  }

  async function updateDay(mutator, options = {}) {
    if (!selectedDay) return;
    const nextDays = tracker.days.map((day) =>
      day.id === selectedDay.id ? mutator(day) : day,
    );
    await persist({ ...tracker, days: nextDays }, { selectedDayId: selectedDay.id, ...options });
  }

  async function addChecklistCategory() {
    if (!selectedDay) return;
    const label = window.prompt("Category name");
    if (!label || !label.trim()) return;
    const key = makeId("category");
    await updateDay((day) => ({
      ...day,
      customSections: {
        ...(day.customSections || {}),
        [key]: {
          label: label.trim(),
          icon: "🗂️",
        },
      },
    }));
  }

  async function editChecklistCategory(sectionKey) {
    if (!selectedDay) return;
    const section = getChecklistSections(selectedDay).find((entry) => entry.key === sectionKey);
    if (!section) return;
    const label = window.prompt("Edit category name", section.label);
    if (label === null || !label.trim()) return;
    await updateDay((day) => {
      if (section.custom) {
        return {
          ...day,
          customSections: {
            ...(day.customSections || {}),
            [sectionKey]: {
              ...(day.customSections?.[sectionKey] || {}),
              label: label.trim(),
            },
          },
        };
      }

      return {
        ...day,
        sectionOverrides: {
          ...(day.sectionOverrides || {}),
          [sectionKey]: {
            ...(day.sectionOverrides?.[sectionKey] || {}),
            label: label.trim(),
          },
        },
      };
    });
  }

  async function deleteChecklistCategory(sectionKey) {
    if (!selectedDay || !window.confirm("Delete this category?")) return;
    const section = getChecklistSections(selectedDay).find((entry) => entry.key === sectionKey);
    if (!section) return;
    await updateDay((day) => {
      const nextDay = {
        ...day,
        checks: { ...(day.checks || {}) },
        comments: { ...(day.comments || {}) },
        customItems: { ...(day.customItems || {}) },
        sectionOverrides: { ...(day.sectionOverrides || {}) },
        removedChecklistItems: { ...(day.removedChecklistItems || {}) },
      };

      getChecklistItems(day, sectionKey).forEach((item) => {
        delete nextDay.checks[item.id];
        delete nextDay.comments[item.id];
      });

      delete nextDay.customItems[sectionKey];
      delete nextDay.sectionOverrides[sectionKey];
      delete nextDay.removedChecklistItems[sectionKey];

      if (section.custom) {
        const nextCustomSections = { ...(day.customSections || {}) };
        delete nextCustomSections[sectionKey];
        nextDay.customSections = nextCustomSections;
      } else {
        nextDay.removedChecklistSections = Array.from(
          new Set([...(day.removedChecklistSections || []), sectionKey]),
        );
      }

      if (day.mediaDraftCategory === sectionKey) {
        const nextSections = getChecklistSections(nextDay).filter(
          (entry) => entry.key !== sectionKey,
        );
        nextDay.mediaDraftCategory = nextSections[0]?.key || "";
      }

      return nextDay;
    });
  }

  async function addChecklistItem(sectionKey) {
    if (!selectedDay) return;
    const text = window.prompt("Checklist item");
    if (!text || !text.trim()) return;
    await updateDay((day) => ({
      ...day,
      customItems: {
        ...(day.customItems || {}),
        [sectionKey]: [
          ...(day.customItems?.[sectionKey] || []),
          {
            id: makeId("item"),
            text: text.trim(),
            pts: 5,
          },
        ],
      },
    }));
  }

  async function editChecklistItem(sectionKey, itemId) {
    if (!selectedDay) return;
    const item = getChecklistItems(selectedDay, sectionKey).find((entry) => entry.id === itemId);
    if (!item) return;
    const text = window.prompt("Edit checklist item", item.text);
    if (text === null || !text.trim()) return;
    await updateDay((day) => {
      const isCustom = Boolean(day.customItems?.[sectionKey]?.some((entry) => entry.id === itemId));
      if (isCustom) {
        return {
          ...day,
          customItems: {
            ...(day.customItems || {}),
            [sectionKey]: (day.customItems?.[sectionKey] || []).map((entry) =>
              entry.id === itemId ? { ...entry, text: text.trim() } : entry,
            ),
          },
        };
      }

      return {
        ...day,
        itemOverrides: {
          ...(day.itemOverrides || {}),
          [itemId]: {
            ...(day.itemOverrides?.[itemId] || {}),
            text: text.trim(),
          },
        },
      };
    });
  }

  async function deleteChecklistItem(sectionKey, itemId) {
    if (!selectedDay || !window.confirm("Delete this checklist item?")) return;
    await updateDay((day) => {
      const isCustom = Boolean(day.customItems?.[sectionKey]?.some((entry) => entry.id === itemId));
      if (isCustom) {
        const nextItems = (day.customItems?.[sectionKey] || []).filter((entry) => entry.id !== itemId);
        const nextCustomItems = { ...(day.customItems || {}) };
        if (nextItems.length) {
          nextCustomItems[sectionKey] = nextItems;
        } else {
          delete nextCustomItems[sectionKey];
        }
        return {
          ...day,
          customItems: nextCustomItems,
          checks: Object.fromEntries(Object.entries(day.checks || {}).filter(([key]) => key !== itemId)),
          comments: Object.fromEntries(
            Object.entries(day.comments || {}).filter(([key]) => key !== itemId),
          ),
        };
      }

      return {
        ...day,
        removedChecklistItems: {
          ...(day.removedChecklistItems || {}),
          [sectionKey]: Array.from(
            new Set([...(day.removedChecklistItems?.[sectionKey] || []), itemId]),
          ),
        },
        checks: Object.fromEntries(Object.entries(day.checks || {}).filter(([key]) => key !== itemId)),
        comments: Object.fromEntries(
          Object.entries(day.comments || {}).filter(([key]) => key !== itemId),
        ),
      };
    });
  }

  async function updateChecklistState(itemId, value) {
    await updateDay((day) => ({
      ...day,
      checks: {
        ...(day.checks || {}),
        [itemId]: value,
      },
    }));
  }

  async function clearChecklistState(itemId) {
    await updateDay((day) => {
      const nextChecks = { ...(day.checks || {}) };
      delete nextChecks[itemId];
      return {
        ...day,
        checks: nextChecks,
      };
    });
  }

  async function saveRemark(itemId, value) {
    await updateDay((day) => ({
      ...day,
      comments: {
        ...(day.comments || {}),
        [itemId]: value,
      },
    }));
  }

  function openUpload() {
    if (!selectedDay) return;
    const nextCategory = getMediaDraftCategory(selectedDay);
    if (nextCategory !== selectedDay.mediaDraftCategory) {
      updateDay(
        (day) => ({
          ...day,
          mediaDraftCategory: nextCategory,
        }),
        { dayTab: "media" },
      );
    }
    fileInputRef.current?.click();
  }

  async function handleUpload(event) {
    if (!selectedDay) return;
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const categoryKey = getMediaDraftCategory(selectedDay);
    const categoryLabel =
      getChecklistSections(selectedDay).find((section) => section.key === categoryKey)?.label ||
      "Uncategorized";

    const uploads = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: makeId("media"),
                name: file.name,
                type: file.type,
                data: String(reader.result || ""),
                categoryKey,
                categoryLabel,
                createdAt: new Date().toISOString(),
              });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    );

    await updateDay(
      (day) => ({
        ...day,
        mediaDraftCategory: categoryKey,
        media: [...(day.media || []), ...uploads],
      }),
      { dayTab: "media" },
    );
    event.target.value = "";
  }

  async function removeMedia(mediaId) {
    await updateDay(
      (day) => ({
        ...day,
        media: (day.media || []).filter((item) => item.id !== mediaId),
      }),
      { dayTab: "media" },
    );
  }

  async function setMediaCategory(sectionKey) {
    await updateDay(
      (day) => ({
        ...day,
        mediaDraftCategory: sectionKey,
      }),
      { dayTab: "media" },
    );
  }

  async function addDiscussionComment(text) {
    if (!selectedDiscussion || !text.trim()) return;
    const nextDiscussions = tracker.discussions.map((item) =>
      item.id === selectedDiscussion.id
        ? {
            ...item,
            comments: [
              ...(item.comments || []),
              {
                id: makeId("comment"),
                text: text.trim(),
                author: user?.username || "User",
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : item,
    );
    await persist(
      { ...tracker, discussions: nextDiscussions },
      { selectedDiscussionId: selectedDiscussion.id },
    );
  }

  function exportTracker() {
    const payload = {
      projectId: project.id,
      projectName: project.name,
      exportedAt: new Date().toISOString(),
      dailyTracker: tracker,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-daily-tracker.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const filteredDays = tracker.days.filter((day) => {
    const query = daySearch.trim().toLowerCase();
    if (!query) return true;
    return [day.date, day.location, day.staff].some((value) =>
      String(value || "").toLowerCase().includes(query),
    );
  });

  const filteredDiscussions = tracker.discussions.filter((item) => {
    const query = discussionSearch.trim().toLowerCase();
    if (!query) return true;
    return [item.title, item.notes, item.status].some((value) =>
      String(value || "").toLowerCase().includes(query),
    );
  });

  const groupedMedia = selectedDay
    ? getChecklistSections(selectedDay).map((section) => ({
        ...section,
        media: (selectedDay.media || []).filter((item) => item.categoryKey === section.key),
      }))
    : [];

  const uncategorizedMedia = selectedDay
    ? (selectedDay.media || []).filter(
        (item) => !getChecklistSections(selectedDay).some((section) => section.key === item.categoryKey),
      )
    : [];

  const topbarDate = formatTopbarDate(
    selectedDay?.date || selectedDiscussion?.date || toDateInputValue(),
  );
  const selectedDayScore = selectedDay ? scoreDay(selectedDay) : null;
  const selectedDayNaCount = selectedDay
    ? getChecklistSections(selectedDay).reduce(
        (count, section) =>
          count +
          getChecklistItems(selectedDay, section.key).filter(
            (item) => selectedDay.checks?.[item.id] === "na",
          ).length,
        0,
      )
    : 0;
  const selectedDayRemaining = selectedDayScore
    ? Math.max(selectedDayScore.total - selectedDayScore.done - selectedDayNaCount, 0)
    : 0;

  return (
    <div className="tracker-page">
      <section className="tracker-topbar">
        <div className="tracker-brand">
          <div className="tracker-brand-badge">{"\u{1F4CB}"}</div>
          <div className="tracker-brand-copy">
            <strong>
              Daily<em>Tracker</em>
            </strong>
            <span>{project.name || "Project Tracker"}</span>
          </div>
        </div>
        <div className="tracker-date-pill">{topbarDate}</div>
        <div className="tracker-topbar-actions">
          <button className="tracker-action tracker-action-ghost" onClick={exportTracker}>
            Export
          </button>
          {sideView === "days" ? (
            <button className="tracker-action tracker-action-primary" onClick={addDay}>
              + New Day
            </button>
          ) : (
            <button className="tracker-action tracker-action-primary" onClick={addDiscussion}>
              + New Topic
            </button>
          )}
        </div>
      </section>

      {error ? <div className="status-banner warn">{error}</div> : null}
      {saving ? <div className="status-banner ok">Saving Daily Tracker changes...</div> : null}

      <div className="tracker-shell">
        <aside className="tracker-sidebar">
          <div className="tracker-switch">
            <button
              className={`tracker-switch-btn ${sideView === "days" ? "active" : ""}`}
              onClick={() => setSideView("days")}
            >
              {"\u{1F4C5}"} Days
            </button>
            <button
              className={`tracker-switch-btn ${sideView === "discussions" ? "active" : ""}`}
              onClick={() => setSideView("discussions")}
            >
              {"\u{1F4AC}"} Discussions
            </button>
          </div>

          {sideView === "days" ? (
            <>
              <div className="tracker-sidebar-label">Daily Site Log</div>
              <input
                className="tracker-search"
                placeholder="Search by date, site, site lead..."
                value={daySearch}
                onChange={(event) => setDaySearch(event.target.value)}
              />
              <div className="tracker-list">
                {filteredDays.length ? (
                  filteredDays.map((day) => {
                    const score = scoreDay(day);
                    return (
                      <button
                        key={day.id}
                        className={`tracker-list-card ${selectedDayId === day.id ? "active" : ""}`}
                        onClick={() => {
                          setSelectedDayId(day.id);
                          setDayTab("checklist");
                        }}
                      >
                        <div className="tracker-list-daynum">
                          <strong>{day.dayNum}</strong>
                          <span>DAY</span>
                        </div>
                        <div className="tracker-list-content">
                          <strong>{formatShortDateLabel(day.date)}</strong>
                          <span>{day.location || day.staff || "No site/location added"}</span>
                          <div className="tracker-progress">
                            <div className="tracker-progress-bar">
                              <span style={{ width: `${score.pct}%` }} />
                            </div>
                            <small>{score.pct}%</small>
                          </div>
                        </div>
                        <div className="tracker-list-actions">
                            <span
                              className="inline-link"
                              onClick={(event) => {
                                event.stopPropagation();
                                editDay(day.id);
                              }}
                            >
                              Edit
                            </span>
                            <span
                              className="inline-link danger"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteDay(day.id);
                              }}
                            >
                              Delete
                            </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="tracker-sidebar-empty">No days yet</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="tracker-sidebar-label">Discussion Items</div>
              <input
                className="tracker-search"
                placeholder="Search topics..."
                value={discussionSearch}
                onChange={(event) => setDiscussionSearch(event.target.value)}
              />
              <div className="tracker-list">
                {filteredDiscussions.length ? (
                  filteredDiscussions.map((item) => (
                    <button
                      key={item.id}
                      className={`tracker-list-card ${selectedDiscussionId === item.id ? "active" : ""}`}
                      onClick={() => setSelectedDiscussionId(item.id)}
                    >
                      <div className="tracker-list-daynum">
                        <strong>#{item.num}</strong>
                        <span>TOPIC</span>
                      </div>
                      <div className="tracker-list-content">
                        <strong>{item.title}</strong>
                        <span className="tracker-topic-status">{item.status}</span>
                      </div>
                      <div className="tracker-list-actions">
                        <span
                          className="inline-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            editDiscussion(item.id);
                          }}
                        >
                          Edit
                        </span>
                        <span
                          className="inline-link danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteDiscussion(item.id);
                          }}
                        >
                          Delete
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="tracker-sidebar-empty">No discussion topics yet</div>
                )}
              </div>
            </>
          )}
        </aside>

        <section className="tracker-main">
          {sideView === "days" ? (
            selectedDay ? (
              <>
                <section className="tracker-hero">
                  <div>
                    <div className="eyebrow">Daily Site Work Review</div>
                    <h2>
                      Day {selectedDay.dayNum} <span className="tracker-day-sub">Daily Site Report</span>
                    </h2>
                    <div className="tracker-meta-row">
                      <span className="tracker-meta-chip">{formatDateLabel(selectedDay.date)}</span>
                      <span className="tracker-meta-chip">
                        {selectedDay.location || "No site/location added"}
                      </span>
                      <span className="tracker-meta-chip">
                        {selectedDay.staff || "No site lead yet"}
                      </span>
                    </div>
                  </div>
                  <div className="tracker-toolbar">
                    <button
                      className="tracker-action tracker-action-ghost"
                      onClick={() => editDay(selectedDay.id)}
                    >
                      Edit day
                    </button>
                    <button
                      className="tracker-action tracker-action-danger"
                      onClick={() => deleteDay(selectedDay.id)}
                    >
                      Delete day
                    </button>
                  </div>
                </section>

                <section className="stats-grid">
                  <article className="stat-card">
                    <span>Checked</span>
                    <strong>{selectedDayScore?.done ?? 0}</strong>
                    <p>{selectedDayScore?.pct ?? 0}% progress</p>
                  </article>
                  <article className="stat-card">
                    <span>Remaining</span>
                    <strong>{selectedDayRemaining}</strong>
                    <p>Checklist items still open</p>
                  </article>
                  <article className="stat-card">
                    <span>N/A Items</span>
                    <strong>{selectedDayNaCount}</strong>
                    <p>Marked not applicable</p>
                  </article>
                  <article className="stat-card">
                    <span>Media</span>
                    <strong>{selectedDay.media.length}</strong>
                    <p>Photos grouped by category</p>
                  </article>
                </section>

                <div className="tracker-tabs">
                  <button
                    className={`tracker-tab ${dayTab === "checklist" ? "active" : ""}`}
                    onClick={() => setDayTab("checklist")}
                  >
                    Checklist
                  </button>
                  <button
                    className={`tracker-tab ${dayTab === "media" ? "active" : ""}`}
                    onClick={() => setDayTab("media")}
                  >
                    Media
                  </button>
                  <button
                    className={`tracker-tab ${dayTab === "history" ? "active" : ""}`}
                    onClick={() => setDayTab("history")}
                  >
                    History
                  </button>
                </div>

                {dayTab === "checklist" ? (
                  <div className="tracker-section-stack">
                    <div className="tracker-toolbar tracker-toolbar-right">
                      <button className="tracker-action tracker-action-ghost" onClick={addChecklistCategory}>
                        Add category
                      </button>
                    </div>

                    {getChecklistSections(selectedDay).map((section) => {
                      const items = getChecklistItems(selectedDay, section.key);
                      const checked = items.filter(
                        (item) => selectedDay.checks?.[item.id] === "checked",
                      ).length;
                      const pct = items.length ? Math.round((checked / items.length) * 100) : 0;
                      return (
                        <article key={section.key} className="tracker-card">
                          <div className="tracker-card-head">
                            <div>
                              <h3>
                                {section.icon} {section.label}
                              </h3>
                              <p>
                                {checked}/{items.length} complete
                              </p>
                            </div>
                            <div className="tracker-toolbar tracker-toolbar-wrap">
                              <button
                                className="tracker-action tracker-action-ghost"
                                onClick={() => addChecklistItem(section.key)}
                              >
                                Add item
                              </button>
                              <button
                                className="tracker-action tracker-action-ghost"
                                onClick={() => editChecklistCategory(section.key)}
                              >
                                Edit category
                              </button>
                              <button
                                className="tracker-action tracker-action-danger"
                                onClick={() => deleteChecklistCategory(section.key)}
                              >
                                Delete category
                              </button>
                              <span className="tracker-score-pill">{pct}%</span>
                            </div>
                          </div>

                          {items.length ? (
                            <div className="tracker-item-stack">
                              {items.map((item) => {
                                const state = selectedDay.checks?.[item.id] || "";
                                return (
                                  <div key={item.id} className={`tracker-item ${state === "checked" ? "checked" : ""}`}>
                                    <label className="tracker-item-check">
                                      <input
                                        type="checkbox"
                                        checked={state === "checked"}
                                        onChange={(event) =>
                                          event.target.checked
                                            ? updateChecklistState(item.id, "checked")
                                            : clearChecklistState(item.id)
                                        }
                                      />
                                      <span>{item.text}</span>
                                    </label>
                                    <div className="tracker-item-controls">
                                      <span className="tracker-points-pill">+{item.pts} pts</span>
                                      <button
                                        className={`tracker-action tracker-action-ghost tracker-action-small ${
                                          state === "na" ? "is-active" : ""
                                        }`}
                                        onClick={() =>
                                          state === "na"
                                            ? clearChecklistState(item.id)
                                            : updateChecklistState(item.id, "na")
                                        }
                                      >
                                        N/A
                                      </button>
                                      <button
                                        className="tracker-action tracker-action-ghost tracker-action-small"
                                        onClick={() => editChecklistItem(section.key, item.id)}
                                      >
                                        Edit item
                                      </button>
                                      <button
                                        className="tracker-action tracker-action-danger tracker-action-small"
                                        onClick={() => deleteChecklistItem(section.key, item.id)}
                                      >
                                        Delete item
                                      </button>
                                    </div>
                                    <input
                                      className="tracker-remark"
                                      placeholder="Add site remark"
                                      defaultValue={selectedDay.comments?.[item.id] || ""}
                                      onBlur={(event) => saveRemark(item.id, event.target.value)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="empty-state">No items in this category yet.</div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : null}

                {dayTab === "media" ? (
                  <div className="tracker-section-stack">
                    <article className="tracker-card">
                      <div className="tracker-card-head">
                        <div>
                          <h3>Category-wise media</h3>
                          <p>Categories come directly from the checklist for this day.</p>
                        </div>
                        <div className="tracker-toolbar tracker-toolbar-wrap">
                          <select
                            className="tracker-select"
                            value={getMediaDraftCategory(selectedDay)}
                            onChange={(event) => setMediaCategory(event.target.value)}
                          >
                            {getChecklistSections(selectedDay).map((section) => (
                              <option key={section.key} value={section.key}>
                                {section.label}
                              </option>
                            ))}
                          </select>
                          <button className="tracker-action tracker-action-primary" onClick={openUpload}>
                            Upload pictures
                          </button>
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleUpload}
                      />

                      <div className="tracker-section-stack">
                        {groupedMedia.map((section) => (
                          <div key={section.key} className="tracker-media-group">
                            <div className="tracker-media-head">
                              <strong>{section.label}</strong>
                              <span className="pill">{section.media.length} files</span>
                            </div>
                            {section.media.length ? (
                              <div className="tracker-media-grid">
                                {section.media.map((item) => (
                                  <div key={item.id} className="tracker-media-card">
                                    <button className="tracker-media-thumb" onClick={() => setMediaLightbox(item.data)}>
                                      <img src={item.data} alt={item.name} />
                                    </button>
                                    <div className="tracker-media-row">
                                      <span>{item.name}</span>
                                      <button
                                        className="tracker-action tracker-action-danger tracker-action-small"
                                        onClick={() => removeMedia(item.id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-state">No pictures in this category yet.</div>
                            )}
                          </div>
                        ))}

                        {uncategorizedMedia.length ? (
                          <div className="tracker-media-group">
                            <div className="tracker-media-head">
                              <strong>Uncategorized</strong>
                              <span className="pill">{uncategorizedMedia.length} files</span>
                            </div>
                            <div className="tracker-media-grid">
                              {uncategorizedMedia.map((item) => (
                                <div key={item.id} className="tracker-media-card">
                                  <button className="tracker-media-thumb" onClick={() => setMediaLightbox(item.data)}>
                                    <img src={item.data} alt={item.name} />
                                  </button>
                                  <div className="tracker-media-row">
                                    <span>{item.name}</span>
                                    <button
                                      className="tracker-action tracker-action-danger tracker-action-small"
                                      onClick={() => removeMedia(item.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  </div>
                ) : null}

                {dayTab === "history" ? (
                  <article className="tracker-card">
                    <div className="tracker-card-head">
                      <div>
                        <h3>Day history</h3>
                        <p>Project-wise day list with progress snapshot.</p>
                      </div>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Location</th>
                            <th>Site lead</th>
                            <th>Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tracker.days.map((day) => (
                            <tr key={day.id}>
                              <td>{formatDateLabel(day.date)}</td>
                              <td>{day.location || "-"}</td>
                              <td>{day.staff || "-"}</td>
                              <td>{scoreDay(day).pct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ) : null}
              </>
            ) : (
              <div className="tracker-empty-hero">
                <div className="tracker-empty-badge">SITE</div>
                <h2>No day selected</h2>
                <p>Add or select a site day to begin.</p>
                <button className="tracker-action tracker-action-primary" onClick={addDay}>
                  + Add First Day
                </button>
              </div>
            )
          ) : selectedDiscussion ? (
            <div className="tracker-section-stack">
              <article className="tracker-card">
                <div className="tracker-card-head">
                  <div>
                    <div className="eyebrow">Discussion</div>
                    <h2>{selectedDiscussion.title}</h2>
                    <p className="tracker-hero-copy">
                      {selectedDiscussion.notes || "No notes added yet."}
                    </p>
                  </div>
                  <div className="tracker-toolbar tracker-toolbar-wrap">
                    <span className="tracker-score-pill">{selectedDiscussion.status}</span>
                    <button
                      className="tracker-action tracker-action-ghost"
                      onClick={() => editDiscussion(selectedDiscussion.id)}
                    >
                      Edit topic
                    </button>
                    <button
                      className="tracker-action tracker-action-danger"
                      onClick={() => deleteDiscussion(selectedDiscussion.id)}
                    >
                      Delete topic
                    </button>
                  </div>
                </div>

                <div className="tracker-comments">
                  {(selectedDiscussion.comments || []).length ? (
                    selectedDiscussion.comments.map((comment) => (
                      <div key={comment.id} className="tracker-comment">
                        <strong>{comment.author}</strong>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                        <p>{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No comments yet.</div>
                  )}
                </div>

                <form
                  className="tracker-comment-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const text = String(form.get("comment") || "");
                    addDiscussionComment(text);
                    event.currentTarget.reset();
                  }}
                >
                  <textarea name="comment" rows={3} placeholder="Add a dated comment to this topic" />
                  <button className="tracker-action tracker-action-primary" type="submit">
                    Add comment
                  </button>
                </form>
              </article>
            </div>
          ) : (
            <div className="tracker-empty-hero">
              <div className="tracker-empty-badge">TOPIC</div>
              <h2>No discussion selected</h2>
              <p>Add or select a topic to start project conversations.</p>
              <button className="tracker-action tracker-action-primary" onClick={addDiscussion}>
                + Add First Topic
              </button>
            </div>
          )}
        </section>
      </div>

      {mediaLightbox ? (
        <div className="tracker-lightbox" onClick={() => setMediaLightbox("")}>
          <img src={mediaLightbox} alt="Daily tracker media preview" />
        </div>
      ) : null}
    </div>
  );
}
