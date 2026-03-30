import nodemailer from "nodemailer";
import { config } from "./config.js";

function normalize(value) {
  return String(value || "").trim();
}

function isPlaceholderValue(value) {
  const normalized = normalize(value).toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    normalized.includes("example.com") ||
    normalized.includes("your-smtp-") ||
    normalized.includes("your gmail") ||
    normalized.includes("your-gmail") ||
    normalized.includes("your_email") ||
    normalized.includes("your-email") ||
    normalized.includes("your-resend")
  );
}

function hasConfiguredValue(value) {
  return Boolean(normalize(value)) && !isPlaceholderValue(value);
}

function isGmailHost() {
  return normalize(config.smtpHost).toLowerCase() === "smtp.gmail.com";
}

function hasSmtpAuth() {
  return hasConfiguredValue(config.smtpUser) && hasConfiguredValue(config.smtpPass);
}

function getResendState() {
  const apiKeyConfigured = hasConfiguredValue(config.resendApiKey);
  const fromConfigured = hasConfiguredValue(config.resendFrom);
  const issues = [
    !apiKeyConfigured ? "Set RESEND_API_KEY to use Resend email delivery." : null,
    !fromConfigured ? "Set RESEND_FROM to a verified Resend sender, for example Rahul <noreply@yourdomain.com>." : null,
  ].filter(Boolean);

  return {
    configured: apiKeyConfigured && fromConfigured && issues.length === 0,
    apiKeyConfigured,
    fromConfigured,
    replyToConfigured: hasConfiguredValue(config.resendReplyTo),
    issues,
  };
}

function getSmtpState() {
  const hostConfigured = hasConfiguredValue(config.smtpHost);
  const fromConfigured = hasConfiguredValue(config.smtpFrom);
  const hasPartialAuth =
    hasConfiguredValue(config.smtpUser) || hasConfiguredValue(config.smtpPass);
  const hasConnection = Boolean(hostConfigured && config.smtpPort && fromConfigured);
  const usingGmail = isGmailHost();
  const gmailPortIssue =
    usingGmail && config.smtpSecure && config.smtpPort !== 465
      ? "For Gmail SSL, set SMTP_PORT=465 when SMTP_SECURE=true."
      : usingGmail && !config.smtpSecure && config.smtpPort !== 587
        ? "For Gmail STARTTLS, set SMTP_PORT=587 when SMTP_SECURE=false."
        : null;
  const gmailTlsIssue =
    usingGmail && !config.smtpSecure && !config.smtpRequireTls
      ? "For Gmail on port 587, set SMTP_REQUIRE_TLS=true."
      : null;
  const issues = [
    !hostConfigured ? "Set SMTP_HOST. For Gmail, use smtp.gmail.com." : null,
    !config.smtpPort ? "Set SMTP_PORT. For Gmail, use 587 or 465." : null,
    !fromConfigured
      ? "Set SMTP_FROM to a real sender address, for example Livio Legacy AI <your@gmail.com>."
      : null,
    hasPartialAuth && !hasSmtpAuth() ? "SMTP_USER and SMTP_PASS must both be set." : null,
    usingGmail && !hasSmtpAuth()
      ? "Gmail SMTP requires SMTP_USER and SMTP_PASS. Use your full Gmail address for SMTP_USER and a Google App Password for SMTP_PASS."
      : null,
    gmailPortIssue,
    gmailTlsIssue,
  ].filter(Boolean);

  return {
    configured: issues.length === 0 && hasConnection,
    hostConfigured,
    fromConfigured,
    hasPartialAuth,
    usingGmail,
    issues,
  };
}

function getEmailProviderState() {
  const resend = getResendState();
  const smtp = getSmtpState();

  if (resend.configured) {
    return { provider: "resend", resend, smtp };
  }

  if (smtp.configured) {
    return { provider: "smtp", resend, smtp };
  }

  return { provider: "none", resend, smtp };
}

export function isEmailConfigured() {
  return getEmailProviderState().provider !== "none";
}

export function getEmailStatus() {
  const state = getEmailProviderState();

  return {
    configured: state.provider !== "none",
    provider: state.provider,
    resendConfigured: state.resend.configured,
    resendApiKeyConfigured: state.resend.apiKeyConfigured,
    resendFromConfigured: state.resend.fromConfigured,
    resendReplyToConfigured: state.resend.replyToConfigured,
    hostConfigured: state.smtp.hostConfigured,
    port: config.smtpPort,
    secure: config.smtpSecure,
    fromConfigured: state.smtp.fromConfigured,
    replyToConfigured: Boolean(config.smtpReplyTo),
    authConfigured: hasSmtpAuth(),
    usingGmail: state.smtp.usingGmail,
    requiresTls: config.smtpRequireTls,
    ignoresTls: config.smtpIgnoreTls,
    issues:
      state.provider === "none"
        ? [...state.resend.issues, ...state.smtp.issues]
        : state.provider === "resend"
          ? []
          : state.smtp.issues,
  };
}

function createTransporter() {
  if (!getSmtpState().configured) {
    throw new Error("SMTP is not configured on the backend.");
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    requireTLS: config.smtpRequireTls,
    ignoreTLS: config.smtpIgnoreTls,
    auth: hasSmtpAuth()
      ? {
          user: config.smtpUser,
          pass: config.smtpPass,
        }
      : undefined,
  });
}

function toBase64Content(content) {
  if (Buffer.isBuffer(content)) {
    return content.toString("base64");
  }

  return Buffer.from(String(content || ""), "utf8").toString("base64");
}

async function sendViaResend({ to, subject, text, html, attachments = [] }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.resendFrom,
      to: Array.isArray(to) ? to : [to],
      reply_to: config.resendReplyTo || undefined,
      subject,
      text,
      html,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: toBase64Content(attachment.content),
      })),
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data?.message ||
      data?.error ||
      `Resend request failed with status ${response.status}.`;
    throw new Error(message);
  }
}

async function sendViaSmtp({ to, subject, text, html, attachments = [] }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: config.smtpFrom,
    replyTo: config.smtpReplyTo || undefined,
    to,
    subject,
    text,
    html,
    attachments,
  });
}

export async function sendClientInvoiceEmail({
  to,
  subject,
  text,
  html,
  pdfBytes,
  filename,
}) {
  return sendEmail({
    to,
    subject,
    text,
    html,
    attachments: [
      {
        filename,
        content: Buffer.from(pdfBytes),
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  attachments = [],
}) {
  const state = getEmailProviderState();

  if (state.provider === "resend") {
    await sendViaResend({ to, subject, text, html, attachments });
    return;
  }

  if (state.provider === "smtp") {
    await sendViaSmtp({ to, subject, text, html, attachments });
    return;
  }

  throw new Error(
    "Email is not configured on the backend. Add RESEND_API_KEY and RESEND_FROM, or configure SMTP.",
  );
}
