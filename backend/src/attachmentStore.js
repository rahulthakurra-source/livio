import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { config } from "./config.js";
import { supabase } from "./supabaseClient.js";

const ATTACHMENTS_TABLE = "attachments";
const ATTACHMENT_BUCKET_OPTIONS = {
  public: false,
  fileSizeLimit: 200 * 1024 * 1024,
  allowedMimeTypes: null,
};
const GCS_BUCKET_PREFIX = "gcs:";
let attachmentBucketReadyPromise = null;
let gcsBucketReadyPromise = null;
let gcsClient = null;

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

function hasGoogleCloudStorageConfigured() {
  return Boolean(
    config.gcsProjectId &&
      config.gcsBucket &&
      config.gcsClientEmail &&
      config.gcsPrivateKey,
  );
}

function getStoredBucketValue(providerBucket) {
  if (hasGoogleCloudStorageConfigured() && providerBucket === config.gcsBucket) {
    return `${GCS_BUCKET_PREFIX}${providerBucket}`;
  }

  return providerBucket;
}

function parseStoredBucketValue(storedBucket = "") {
  const bucket = String(storedBucket || "");
  if (bucket.startsWith(GCS_BUCKET_PREFIX)) {
    return {
      provider: "gcs",
      bucketName: bucket.slice(GCS_BUCKET_PREFIX.length),
    };
  }

  return {
    provider: "supabase",
    bucketName: bucket || config.attachmentBucket,
  };
}

function getGoogleCloudStorageClient() {
  if (!hasGoogleCloudStorageConfigured()) {
    throw new Error("Google Cloud Storage is not configured.");
  }

  if (!gcsClient) {
    gcsClient = new Storage({
      projectId: config.gcsProjectId,
      credentials: {
        client_email: config.gcsClientEmail,
        private_key: config.gcsPrivateKey,
      },
    });
  }

  return gcsClient;
}

function getGoogleCloudBucket() {
  return getGoogleCloudStorageClient().bucket(config.gcsBucket);
}

function getAttachmentBucketCors() {
  return [
    {
      origin: ["*"],
      method: ["GET", "HEAD", "PUT"],
      responseHeader: ["Content-Type", "Content-Length", "Content-Disposition"],
      maxAgeSeconds: 3600,
    },
  ];
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

async function ensureGoogleCloudBucket() {
  if (!hasGoogleCloudStorageConfigured()) {
    throw new Error("Google Cloud Storage is not configured.");
  }

  if (!gcsBucketReadyPromise) {
    gcsBucketReadyPromise = (async () => {
      const bucket = getGoogleCloudBucket();
      const [exists] = await bucket.exists();

      if (!exists) {
        await getGoogleCloudStorageClient().createBucket(config.gcsBucket, {
          location: config.gcsBucketLocation,
          cors: getAttachmentBucketCors(),
        });
        return;
      }

      await bucket.setMetadata({
        cors: getAttachmentBucketCors(),
      });
    })().catch((error) => {
      gcsBucketReadyPromise = null;
      throw error;
    });
  }

  return gcsBucketReadyPromise;
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

async function removeStoredFile(bucketValue, storagePath) {
  const target = parseStoredBucketValue(bucketValue);

  if (target.provider === "gcs") {
    const file = getGoogleCloudStorageClient().bucket(target.bucketName).file(storagePath);
    await file.delete({ ignoreNotFound: true });
    return;
  }

  await supabase.storage.from(target.bucketName).remove([storagePath]);
}

async function uploadBufferToGoogleCloud({
  storagePath,
  contentType,
  buffer,
}) {
  await ensureGoogleCloudBucket();
  const file = getGoogleCloudBucket().file(storagePath);
  await file.save(buffer, {
    contentType: contentType || "application/octet-stream",
    resumable: false,
  });
}

export function usesDirectAttachmentUploads() {
  return hasGoogleCloudStorageConfigured();
}

export async function createAttachmentUpload({
  projectId = "",
  fileName,
  contentType,
  size,
}) {
  if (!hasGoogleCloudStorageConfigured()) {
    throw new Error("Google Cloud Storage direct uploads are not configured.");
  }

  await ensureGoogleCloudBucket();

  const id = `att_${randomUUID()}`;
  const storagePath = buildStoragePath(projectId, fileName);
  const bucket = getStoredBucketValue(config.gcsBucket);
  const attachment = await insertAttachmentRecord({
    id,
    projectId,
    fileName,
    contentType,
    size,
    bucket,
    storagePath,
  });

  try {
    const file = getGoogleCloudBucket().file(storagePath);
    const expires =
      Date.now() + Math.max(60, Number(config.gcsSignedUrlTtlSeconds || 900)) * 1000;
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires,
      contentType: contentType || "application/octet-stream",
    });

    return {
      attachment,
      upload: {
        method: "PUT",
        url,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
        },
        expiresAt: new Date(expires).toISOString(),
      },
    };
  } catch (error) {
    await supabase.from(ATTACHMENTS_TABLE).delete().eq("id", id);
    throw error;
  }
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

  if (hasGoogleCloudStorageConfigured()) {
    await uploadBufferToGoogleCloud({
      storagePath,
      contentType,
      buffer,
    });

    try {
      return await insertAttachmentRecord({
        id,
        projectId,
        fileName,
        contentType,
        size,
        bucket: getStoredBucketValue(config.gcsBucket),
        storagePath,
      });
    } catch (error) {
      await removeStoredFile(getStoredBucketValue(config.gcsBucket), storagePath);
      throw error;
    }
  }

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
    await removeStoredFile(config.attachmentBucket, storagePath);
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
  const target = parseStoredBucketValue(attachment.bucket);

  if (target.provider === "gcs") {
    const [buffer] = await getGoogleCloudStorageClient()
      .bucket(target.bucketName)
      .file(attachment.storagePath)
      .download();

    return {
      attachment,
      buffer,
    };
  }

  const { data, error } = await supabase.storage
    .from(target.bucketName)
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

  await removeStoredFile(attachment.bucket, attachment.storagePath);

  const { error } = await supabase
    .from(ATTACHMENTS_TABLE)
    .delete()
    .eq("id", attachmentId);

  if (error) {
    throw error;
  }

  return attachment;
}
