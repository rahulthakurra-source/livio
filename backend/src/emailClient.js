import nodemailer from "nodemailer";
import { config } from "./config.js";

function hasSmtpAuth() {
  return Boolean(config.smtpUser && config.smtpPass);
}

export function isEmailConfigured() {
  const hasConnection = Boolean(config.smtpHost && config.smtpPort && config.smtpFrom);
  const hasPartialAuth = Boolean(config.smtpUser || config.smtpPass);
  return hasConnection && (!hasPartialAuth || hasSmtpAuth());
}

export function getEmailStatus() {
  const hasConnection = Boolean(config.smtpHost && config.smtpPort && config.smtpFrom);
  const hasPartialAuth = Boolean(config.smtpUser || config.smtpPass);

  return {
    configured: isEmailConfigured(),
    hostConfigured: Boolean(config.smtpHost),
    port: config.smtpPort,
    secure: config.smtpSecure,
    fromConfigured: Boolean(config.smtpFrom),
    replyToConfigured: Boolean(config.smtpReplyTo),
    authConfigured: hasSmtpAuth(),
    requiresTls: config.smtpRequireTls,
    ignoresTls: config.smtpIgnoreTls,
    issues: [
      !hasConnection ? "Missing SMTP host, port, or from address." : null,
      hasPartialAuth && !hasSmtpAuth() ? "SMTP username and password must both be set." : null,
    ].filter(Boolean),
  };
}

function createTransporter() {
  if (!isEmailConfigured()) {
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
