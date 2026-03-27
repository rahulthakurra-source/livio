import nodemailer from "nodemailer";
import { config } from "./config.js";

export function isEmailConfigured() {
  return Boolean(
    config.smtpHost &&
    config.smtpPort &&
    config.smtpUser &&
    config.smtpPass &&
    config.smtpFrom,
  );
}

function createTransporter() {
  if (!isEmailConfigured()) {
    throw new Error("SMTP is not configured on the backend.");
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
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
    to,
    subject,
    text,
    html,
    attachments,
  });
}
