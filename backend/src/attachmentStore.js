import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { supabase } from "./supabaseClient.js";

const ATTACHMENTS_TABLE = "attachments";

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeAttachment(row = {}) {
  return {
    id: row.id,
    projectId: row.project_id || "",
    name: row.name || "file",
    size: Number(row.size || 0),
    contentType: row.content_type || "application/octet-stream",
    bucket: row.bucket || config.attachmentBucket,
    storagePath: row.storage_path || "",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function buildStoragePath(projectId, fileName) {
  const safeProject = sanitizeSegment(projectId || "unassigned") || "unassigned";
  const safeName = sanitizeSegment(fileName || "file") || "file";
  return `${safeProject}/${Date.now()}_${randomUUID()}_${safeName}`;
}

export async function createAttachment({
  projectId = "",
  fileName,
  contentType,
  size,
  buffer,
}) {
  const id = `att_${randomUUID()}`;
  const storagePath = buildStoragePath(projectId, fileName);

  const { error: uploadError } = await supabase.storage
    .from(config.attachmentBucket)
    .upload(storagePath, buffer, {
      contentType: contentType || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from(ATTACHMENTS_TABLE)
    .insert({
      id,
      project_id: projectId || null,
      name: fileName || "file",
      size: Number(size || 0),
      content_type: contentType || "application/octet-stream",
      bucket: config.attachmentBucket,
      storage_path: storagePath,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(config.attachmentBucket).remove([storagePath]);
    throw error;
  }

  return normalizeAttachment(data);
}

export async function getAttachmentById(attachmentId) {
  const { data, error } = await supabase
    .from(ATTACHMENTS_TABLE)
    .select("*")
    .eq("id", attachmentId)
    .single();

  if (error) {
    throw error;
  }

  return normalizeAttachment(data);
}

export async function downloadAttachment(attachmentId) {
  const attachment = await getAttachmentById(attachmentId);
  const { data, error } = await supabase.storage
    .from(attachment.bucket)
    .download(attachment.storagePath);

  if (error) {
    throw error;
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    attachment,
    buffer: Buffer.from(arrayBuffer),
  };
}

export async function deleteAttachmentById(attachmentId) {
  const attachment = await getAttachmentById(attachmentId);

  const { error: storageError } = await supabase.storage
    .from(attachment.bucket)
    .remove([attachment.storagePath]);

  if (storageError) {
    throw storageError;
  }

  const { error } = await supabase
    .from(ATTACHMENTS_TABLE)
    .delete()
    .eq("id", attachmentId);

  if (error) {
    throw error;
  }

  return attachment;
}
