import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { supabase } from "./supabaseClient.js";

const ATTACHMENTS_TABLE = "attachments";
const ATTACHMENT_BUCKET_OPTIONS = {
  public: false,
  fileSizeLimit: 200 * 1024 * 1024,
  allowedMimeTypes: null,
};
let attachmentBucketReadyPromise = null;

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

async function ensureSupabaseAttachmentBucket() {
  if (!attachmentBucketReadyPromise) {
    attachmentBucketReadyPromise = (async () => {
      const { data: bucket, error: getBucketError } = await supabase.storage.getBucket(
        config.attachmentBucket,
      );

      if (getBucketError) {
        const notFound =
          getBucketError.statusCode === 404 ||
          /not found/i.test(String(getBucketError.message || ""));

        if (!notFound) {
          throw getBucketError;
        }

        const { error: createBucketError } = await supabase.storage.createBucket(
          config.attachmentBucket,
          ATTACHMENT_BUCKET_OPTIONS,
        );

        if (createBucketError) {
          throw createBucketError;
        }

        return;
      }

      const needsUpdate =
        bucket?.public !== ATTACHMENT_BUCKET_OPTIONS.public ||
        Number(bucket?.file_size_limit || 0) !== ATTACHMENT_BUCKET_OPTIONS.fileSizeLimit ||
        Array.isArray(bucket?.allowed_mime_types);

      if (!needsUpdate) {
        return;
      }

      const { error: updateBucketError } = await supabase.storage.updateBucket(
        config.attachmentBucket,
        ATTACHMENT_BUCKET_OPTIONS,
      );

      if (updateBucketError) {
        throw updateBucketError;
      }
    })().catch((error) => {
      attachmentBucketReadyPromise = null;
      throw error;
    });
  }

  return attachmentBucketReadyPromise;
}

async function insertAttachmentRecord({
  id,
  projectId,
  fileName,
  contentType,
  size,
  bucket,
  storagePath,
}) {
  const { data, error } = await supabase
    .from(ATTACHMENTS_TABLE)
    .insert({
      id,
      project_id: projectId || null,
      name: fileName || "file",
      size: Number(size || 0),
      content_type: contentType || "application/octet-stream",
      bucket,
      storage_path: storagePath,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return normalizeAttachment(data);
}

export function usesDirectAttachmentUploads() {
  return false;
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

  await ensureSupabaseAttachmentBucket();

  const { error: uploadError } = await supabase.storage
    .from(config.attachmentBucket)
    .upload(storagePath, buffer, {
      contentType: contentType || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  try {
    return await insertAttachmentRecord({
      id,
      projectId,
      fileName,
      contentType,
      size,
      bucket: config.attachmentBucket,
      storagePath,
    });
  } catch (error) {
    await supabase.storage.from(config.attachmentBucket).remove([storagePath]);
    throw error;
  }
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
    .from(attachment.bucket || config.attachmentBucket)
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

  await supabase.storage
    .from(attachment.bucket || config.attachmentBucket)
    .remove([attachment.storagePath]);

  const { error } = await supabase
    .from(ATTACHMENTS_TABLE)
    .delete()
    .eq("id", attachmentId);

  if (error) {
    throw error;
  }

  return attachment;
}
