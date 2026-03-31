export const PAGE_DEFINITIONS = [
  { id: "projects", label: "Projects", type: "root" },
  { id: "dailyTracker", label: "Daily Tracker", type: "dailyTracker" },
  { id: "dashboard", label: "Dashboard", type: "dashboard" },
  { id: "works", label: "Works", type: "section", sectionKey: "works" },
  { id: "milestones", label: "Milestones", type: "section", sectionKey: "milestones" },
  { id: "quotes", label: "Quotes", type: "section", sectionKey: "quotes" },
  { id: "plans", label: "Plans", type: "section", sectionKey: "plans" },
  { id: "inspections", label: "Inspections", type: "section", sectionKey: "inspections" },
  { id: "payments", label: "Payments", type: "payments" },
  { id: "invoices", label: "Invoices", type: "section", sectionKey: "invoices" },
  { id: "vendors", label: "Vendors", type: "section", sectionKey: "vendors" },
  { id: "checklist", label: "Checklist", type: "section", sectionKey: "checklist" },
  { id: "qaqc", label: "QA/QC", type: "section", sectionKey: "qaqcLog" },
  { id: "compliance", label: "Compliance", type: "compliance" },
  { id: "export", label: "Export", type: "export" },
  { id: "users", label: "Users", type: "users", adminOnly: true },
];

export const PROJECT_COLLECTION_DEFAULTS = {
  works: [],
  milestones: [],
  quotes: [],
  plans: [],
  inspections: [],
  invoices: [],
  vendors: [],
  clientContracts: [],
  clientInvoices: [],
  checklist: [],
  qaqcLog: [],
  chkCategories: [],
};

export const DAILY_TRACKER_DEFAULT = {
  days: [],
  discussions: [],
};

export function normalizeDailyTracker(tracker = {}) {
  const nextTracker = {
    ...DAILY_TRACKER_DEFAULT,
    ...(tracker && typeof tracker === "object" ? tracker : {}),
  };

  nextTracker.days = Array.isArray(nextTracker.days) ? nextTracker.days : [];
  nextTracker.discussions = Array.isArray(nextTracker.discussions) ? nextTracker.discussions : [];

  return nextTracker;
}

export function normalizeProject(project = {}) {
  const nextProject = {
    id: project.id || "",
    name: project.name || "Untitled Project",
    street: project.street || "",
    city: project.city || "",
    county: project.county || "",
    state: project.state || "CA",
    zip: project.zip || "",
    address: project.address || "",
    permit: project.permit || "",
    apn: project.apn || "",
    type: project.type || "",
    color: project.color || "#1A6BC4",
    createdAt: project.createdAt || "",
    updatedAt: project.updatedAt || "",
    ...project,
  };

  Object.keys(PROJECT_COLLECTION_DEFAULTS).forEach((key) => {
    nextProject[key] = Array.isArray(nextProject[key]) ? nextProject[key] : [];
  });

  nextProject.dailyTracker = normalizeDailyTracker(nextProject.dailyTracker);

  return nextProject;
}

export const SECTION_CONFIGS = {
  works: {
    title: "Works at Site",
    itemTitle: "Work item",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "ref", label: "Reference", type: "text" },
      { key: "contractor", label: "Contractor", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "pct", label: "Progress %", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  milestones: {
    title: "Milestones",
    itemTitle: "Milestone",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "ref", label: "Reference", type: "text" },
      { key: "date", label: "Date", type: "date" },
      { key: "status", label: "Status", type: "text" },
      { key: "payAmt", label: "Contract amount", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  quotes: {
    title: "Quotes",
    itemTitle: "Quote",
    fields: [
      { key: "vendor", label: "Vendor", type: "text" },
      { key: "scope", label: "Scope", type: "textarea" },
      { key: "ref", label: "Reference", type: "text" },
      { key: "csi", label: "CSI", type: "text" },
      { key: "amount", label: "Amount", type: "number" },
      { key: "date", label: "Date", type: "date" },
      { key: "status", label: "Status", type: "text" },
    ],
  },
  plans: {
    title: "Plans and Documents",
    itemTitle: "Plan file",
    fields: [
      { key: "name", label: "File name", type: "text" },
      { key: "type", label: "Type", type: "text" },
      { key: "size", label: "Size", type: "number" },
    ],
  },
  inspections: {
    title: "Inspections",
    itemTitle: "Inspection",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "inspDate", label: "Date", type: "date" },
      { key: "inspTime", label: "Time", type: "time" },
      { key: "location", label: "Location", type: "text" },
      { key: "refs", label: "References", type: "text" },
      { key: "ahj", label: "AHJ", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  invoices: {
    title: "Invoices",
    itemTitle: "Invoice",
    fields: [
      { key: "vendor", label: "Vendor", type: "text" },
      { key: "invoiceNo", label: "Invoice no.", type: "text" },
      { key: "amount", label: "Amount", type: "number" },
      { key: "invoiceDate", label: "Invoice date", type: "date" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "approvalStatus", label: "Approval status", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  vendors: {
    title: "Vendor Contracts",
    itemTitle: "Vendor contract",
    fields: [
      { key: "vendor", label: "Vendor", type: "text" },
      { key: "contractNo", label: "Contract no.", type: "text" },
      { key: "amount", label: "Amount", type: "number" },
      { key: "contractType", label: "Contract type", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "startDate", label: "Start date", type: "date" },
      { key: "endDate", label: "End date", type: "date" },
      { key: "scope", label: "Scope", type: "textarea" },
    ],
  },
  checklist: {
    title: "Checklist",
    itemTitle: "Checklist item",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "priority", label: "Priority", type: "text" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "assignee", label: "Assignee", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  qaqcLog: {
    title: "QA/QC Log",
    itemTitle: "QA/QC item",
    fields: [
      { key: "refNo", label: "Reference no.", type: "text" },
      { key: "type", label: "Type", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "location", label: "Location", type: "text" },
      { key: "date", label: "Date", type: "date" },
      { key: "raisedBy", label: "Raised by", type: "text" },
      { key: "assignedTo", label: "Assigned to", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "correctiveAction", label: "Corrective action", type: "textarea" },
    ],
  },
};

export function buildAddress(project) {
  return [project.street, project.city, project.state, project.zip]
    .filter(Boolean)
    .join(", ");
}

export function computeDashboard(project) {
  const works = project.works || [];
  const milestones = project.milestones || [];
  const quotes = project.quotes || [];
  const inspections = project.inspections || [];

  const activeWorks = works.filter((work) =>
    ["active", "inprogress", "starting"].includes(work.status),
  ).length;
  const completedMilestones = milestones.filter((item) => item.status === "done").length;
  const totalQuoteAmount = quotes.reduce(
    (sum, quote) => sum + Number(quote.amount || 0),
    0,
  );
  const nextInspection = [...inspections]
    .sort((a, b) => String(a.inspDate || "").localeCompare(String(b.inspDate || "")))[0];

  return {
    activeWorks,
    completedMilestones,
    totalMilestones: milestones.length,
    totalQuoteAmount,
    inspectionCount: inspections.length,
    nextInspection,
  };
}

export function computePayments(project) {
  const milestones = project.milestones || [];
  const invoices = project.invoices || [];
  const quotes = project.quotes || [];

  const milestoneTotals = milestones.map((milestone) => {
    const scheduled = Number(milestone.payAmt || 0);
    const progressPayments = milestone.progressPayments || [];
    const received = progressPayments
      .filter((payment) => payment.paid)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return {
      id: milestone.id,
      label: milestone.name,
      scheduled,
      received,
      balance: scheduled - received,
    };
  });

  const quoteMilestones = quotes.flatMap((quote) =>
    (quote.payMilestones || []).map((payment) => ({
      id: payment.id,
      label: `${quote.vendor}: ${payment.name}`,
      scheduled: Number(payment.amount || 0),
      received: payment.paid ? Number(payment.amount || 0) : 0,
      balance: payment.paid ? 0 : Number(payment.amount || 0),
    })),
  );

  const invoiceTotals = invoices.map((invoice) => ({
    id: invoice.id,
    label: `${invoice.vendor || "Vendor"}: ${invoice.invoiceNo || invoice.id}`,
    scheduled: Number(invoice.amount || 0),
    received: invoice.paid ? Number(invoice.amount || 0) : 0,
    balance: invoice.paid ? 0 : Number(invoice.amount || 0),
  }));

  const rows = [...milestoneTotals, ...quoteMilestones, ...invoiceTotals];
  const summary = rows.reduce(
    (acc, row) => {
      acc.scheduled += row.scheduled;
      acc.received += row.received;
      acc.balance += row.balance;
      return acc;
    },
    { scheduled: 0, received: 0, balance: 0 },
  );

  return { rows, summary };
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
