import { randomUUID } from "node:crypto";
import { supabase } from "./supabaseClient.js";

const PROJECTS_TABLE = "projects";

const PROJECT_DATA_DEFAULTS = {
  works: [],
  milestones: [],
  quotes: [],
  plans: [],
  inspections: [],
  invoices: [],
  vendors: [],
  vendorProfiles: [],
  clientContracts: [],
  clientInvoices: [],
  checklist: [],
  qaqcLog: [],
  chkCategories: [],
  attachments: [],
};

const META_KEYS = [
  "id",
  "name",
  "street",
  "city",
  "county",
  "state",
  "zip",
  "address",
  "permit",
  "apn",
  "type",
  "color",
  "createdAt",
  "updatedAt",
];

function normalizeProjectData(data = {}) {
  const merged = {
    ...PROJECT_DATA_DEFAULTS,
    ...data,
  };

  for (const key of Object.keys(PROJECT_DATA_DEFAULTS)) {
    if (!Array.isArray(merged[key])) {
      merged[key] = [];
    }
  }

  return merged;
}

function splitProject(project = {}) {
  const {
    id,
    name,
    street = "",
    city = "",
    county = "",
    state = "CA",
    zip = "",
    address = "",
    permit = "",
    apn = "",
    type = "",
    color = "#1A6BC4",
    createdAt,
    updatedAt,
    ...rest
  } = project;

  const data = normalizeProjectData(rest);

  return {
    id: id || `proj_${randomUUID()}`,
    name: name?.trim() || "Untitled Project",
    street,
    city,
    county,
    state,
    zip,
    address,
    permit,
    apn,
    type,
    color,
    createdAt,
    updatedAt,
    data,
  };
}

function rowToProject(row) {
  const data = normalizeProjectData(row.data || {});

  return {
    id: row.id,
    name: row.name,
    street: row.street || "",
    city: row.city || "",
    county: row.county || "",
    state: row.state || "CA",
    zip: row.zip || "",
    address: row.address || "",
    permit: row.permit || "",
    apn: row.apn || "",
    type: row.type || "",
    color: row.color || "#1A6BC4",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...data,
  };
}

function projectToRow(project) {
  const split = splitProject(project);

  return {
    id: split.id,
    name: split.name,
    street: split.street,
    city: split.city,
    county: split.county,
    state: split.state,
    zip: split.zip,
    address: split.address,
    permit: split.permit,
    apn: split.apn,
    type: split.type,
    color: split.color,
    data: split.data,
    updated_at: new Date().toISOString(),
  };
}

function createProjectConflictError(message, project) {
  const error = new Error(message);
  error.statusCode = 409;
  if (project) {
    error.project = project;
  }
  return error;
}

export async function listProjects() {
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(rowToProject);
}

export async function getProjectById(projectId) {
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    throw error;
  }

  return rowToProject(data);
}

export async function createProject(project) {
  const row = projectToRow(project);
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return rowToProject(data);
}

export async function updateProject(projectId, project, options = {}) {
  const expectedUpdatedAt =
    options && typeof options.expectedUpdatedAt === "string"
      ? options.expectedUpdatedAt.trim()
      : "";
  const row = projectToRow({
    ...project,
    id: projectId,
  });

  let query = supabase.from(PROJECTS_TABLE).update(row).eq("id", projectId);
  if (expectedUpdatedAt) {
    query = query.eq("updated_at", expectedUpdatedAt);
  }

  const { data, error } = await query.select("*").maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const latestProject = await getProjectById(projectId).catch(() => null);
    if (latestProject) {
      throw createProjectConflictError(
        "This project was updated by someone else. Reload the latest project before saving again.",
        latestProject,
      );
    }

    const notFoundError = new Error("Project not found.");
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  return rowToProject(data);
}

export async function deleteProject(projectId) {
  const { error } = await supabase
    .from(PROJECTS_TABLE)
    .delete()
    .eq("id", projectId);

  if (error) {
    throw error;
  }
}

export async function replaceProjects(projects = []) {
  const nextProjects = Array.isArray(projects) ? projects : [];
  const nextRows = nextProjects.map(projectToRow);

  const { data: existing, error: existingError } = await supabase
    .from(PROJECTS_TABLE)
    .select("id");

  if (existingError) {
    throw existingError;
  }

  const nextIds = nextRows.map((row) => row.id);
  const existingIds = (existing || []).map((row) => row.id);
  const deleteIds = existingIds.filter((id) => !nextIds.includes(id));

  if (deleteIds.length) {
    const { error: deleteError } = await supabase
      .from(PROJECTS_TABLE)
      .delete()
      .in("id", deleteIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  if (nextRows.length) {
    const { error: upsertError } = await supabase
      .from(PROJECTS_TABLE)
      .upsert(nextRows);

    if (upsertError) {
      throw upsertError;
    }
  }

  return listProjects();
}

export function createEmptyProject(seed = {}) {
  const split = splitProject({
    ...PROJECT_DATA_DEFAULTS,
    createdAt: new Date().toISOString(),
    ...seed,
  });

  return {
    id: split.id,
    name: split.name,
    street: split.street,
    city: split.city,
    county: split.county,
    state: split.state,
    zip: split.zip,
    address: split.address,
    permit: split.permit,
    apn: split.apn,
    type: split.type,
    color: split.color,
    createdAt: split.createdAt || new Date().toISOString(),
    updatedAt: split.updatedAt || new Date().toISOString(),
    ...split.data,
  };
}

export function extractProjectData(project) {
  const result = {};

  for (const key of Object.keys(project || {})) {
    if (!META_KEYS.includes(key)) {
      result[key] = project[key];
    }
  }

  return normalizeProjectData(result);
}
