import dotenv from "dotenv";

dotenv.config();

const DEFAULT_FRONTEND_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "null",
];

function parseBoolean(value, fallback = false) {
  if (value == null || value === "") {
    return fallback;
  }
  return String(value).toLowerCase() === "true";
}

function parseNumber(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendOrigins: [
    ...new Set(
      [
        ...(process.env.FRONTEND_ORIGIN || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        ...DEFAULT_FRONTEND_ORIGINS,
      ],
    ),
  ],
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  resendApiKey: process.env.RESEND_API_KEY || "",
  resendFrom: process.env.RESEND_FROM || "",
  resendReplyTo: process.env.RESEND_REPLY_TO || "",
  gcsProjectId: process.env.GCS_PROJECT_ID || "",
  gcsBucket: process.env.GCS_BUCKET || "",
  gcsClientEmail: process.env.GCS_CLIENT_EMAIL || "",
  gcsPrivateKey: (process.env.GCS_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  gcsBucketLocation: process.env.GCS_BUCKET_LOCATION || "US",
  gcsSignedUrlTtlSeconds: parseNumber(process.env.GCS_SIGNED_URL_TTL_SECONDS, 900),
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: parseBoolean(process.env.SMTP_SECURE),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
  smtpReplyTo: process.env.SMTP_REPLY_TO || "",
  smtpRequireTls: parseBoolean(process.env.SMTP_REQUIRE_TLS),
  smtpIgnoreTls: parseBoolean(process.env.SMTP_IGNORE_TLS),
  attachmentBucket: process.env.ATTACHMENT_BUCKET || "project-files",
};
