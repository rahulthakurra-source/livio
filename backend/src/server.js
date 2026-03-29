import cors from "cors";
import express from "express";
import multer from "multer";
import {
  buildClientInvoiceEmail,
  buildClientInvoiceFilename,
  buildClientInvoicePdf,
} from "./clientInvoiceDocument.js";
import {
  buildVendorContractEmail,
  buildVendorContractFilename,
  buildVendorContractPdf,
} from "./vendorContractDocument.js";
import {
  createAttachment,
  deleteAttachmentById,
  downloadAttachment,
} from "./attachmentStore.js";
import { config } from "./config.js";
import {
  getEmailStatus,
  isEmailConfigured,
  sendClientInvoiceEmail,
  sendEmail,
} from "./emailClient.js";
import {
  createEmptyProject,
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  replaceProjects,
  updateProject,
} from "./projectStore.js";
import { getAppState, saveAppState } from "./appStateStore.js";
import {
  createUser,
  deleteUser,
  listUsers,
  listUsersRaw,
  loginUser,
  replaceUsers,
  updateUser,
} from "./userStore.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
});

function getClientInvoicePayload(body = {}) {
  const project = body.project && typeof body.project === "object" ? body.project : {};
  const invoice = body.invoice && typeof body.invoice === "object" ? body.invoice : {};
  const contract = body.contract && typeof body.contract === "object" ? body.contract : {};

  if (!invoice || (!invoice.id && !invoice.invoiceNo)) {
    throw new Error("Client invoice payload is required.");
  }

  return { project, invoice, contract };
}

function getVendorContractPayload(body = {}) {
  const project = body.project && typeof body.project === "object" ? body.project : {};
  const contract = body.contract && typeof body.contract === "object" ? body.contract : {};

  if (!contract || (!contract.id && !contract.contractNo && !contract.vendor)) {
    throw new Error("Vendor contract payload is required.");
  }

  return { project, contract };
}

function buildPasswordResetEmail({ username, code }) {
  const safeName = String(username || "").trim() || "User";
  const safeCode = String(code || "").trim();
  const subject = "Livio password reset code";
  const text = [
    `Hello ${safeName},`,
    "",
    "You requested a password reset for your Livio account.",
    `Your reset code is: ${safeCode}`,
    "",
    "This code is valid for 30 minutes.",
    "",
    "If you did not request this, you can ignore this email.",
    "",
    "Livio Legacy AI",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f1f1f;line-height:1.6">
      <h2 style="margin:0 0 12px;color:#0C1B2E">Password Reset</h2>
      <p>Hello ${safeName},</p>
      <p>You requested a password reset for your Livio account.</p>
      <p>Your reset code is:</p>
      <div style="display:inline-block;padding:10px 14px;background:#0C1B2E;color:#fff;font-size:20px;font-weight:700;letter-spacing:2px;border-radius:8px">${safeCode}</div>
      <p style="margin-top:16px">This code is valid for 30 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>Livio Legacy AI</p>
    </div>
  `;
  return { subject, text, html };
}

function isAllowedOrigin(origin) {
  return true;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "livio-backend",
    email: getEmailStatus(),
  });
});

app.get("/api/email/status", (_req, res) => {
  res.json({ email: getEmailStatus() });
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const user = await loginUser(username, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/bootstrap", async (_req, res, next) => {
  try {
    const [projects, users, appState] = await Promise.all([
      listProjects(),
      listUsersRaw(),
      getAppState(),
    ]);

    res.json({
      db: {
        projects,
        activeId: appState.activeId || projects[0]?.id || "",
      },
      users,
      roles: appState.roles || [],
      perms: appState.perms || {},
      resets: appState.resets || {},
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/bootstrap", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const db = payload.db && typeof payload.db === "object" ? payload.db : {};
    const projects = Array.isArray(db.projects) ? db.projects : [];
    const activeId = typeof db.activeId === "string" ? db.activeId : "";
    const users = Array.isArray(payload.users) ? payload.users : [];

    const [savedProjects, savedUsers, savedAppState] = await Promise.all([
      replaceProjects(projects),
      replaceUsers(users),
      saveAppState({
        activeId,
        roles: payload.roles,
        perms: payload.perms,
        resets: payload.resets,
      }),
    ]);

    res.json({
      db: {
        projects: savedProjects,
        activeId: savedAppState.activeId || savedProjects[0]?.id || "",
      },
      users: savedUsers,
      roles: savedAppState.roles,
      perms: savedAppState.perms,
      resets: savedAppState.resets,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/client-invoices/pdf", async (req, res, next) => {
  try {
    const payload = getClientInvoicePayload(req.body);
    const pdfBytes = await buildClientInvoicePdf(payload);
    const filename = buildClientInvoiceFilename(payload);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    next(error);
  }
});

app.post("/api/client-invoices/email", async (req, res, next) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(400).json({
        error: "SMTP is not configured on the backend. Add SMTP settings on Render first.",
      });
    }

    const payload = getClientInvoicePayload(req.body);
    const to = String(payload.invoice.clientEmail || payload.contract.clientEmail || "").trim();
    if (!to) {
      return res.status(400).json({ error: "Client email is required for invoice sending." });
    }

    const pdfBytes = await buildClientInvoicePdf(payload);
    const filename = buildClientInvoiceFilename(payload);
    const message = buildClientInvoiceEmail(payload);

    await sendClientInvoiceEmail({
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      pdfBytes,
      filename,
    });

    return res.json({ ok: true, to });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/vendor-contracts/email", async (req, res, next) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(400).json({
        error: "SMTP is not configured on the backend. Add SMTP settings on Render first.",
      });
    }

    const payload = getVendorContractPayload(req.body);
    const to = String(payload.contract.vendorEmail || "").trim();
    if (!to) {
      return res.status(400).json({ error: "Vendor email is required for contract sending." });
    }

    const pdfBytes = await buildVendorContractPdf(payload);
    const filename = buildVendorContractFilename(payload);
    const message = buildVendorContractEmail(payload);

    await sendEmail({
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBytes),
          contentType: "application/pdf",
        },
      ],
    });

    return res.json({ ok: true, to });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/forgot-password", async (req, res, next) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(400).json({
        error: "SMTP is not configured on the backend. Add SMTP settings on Render first.",
      });
    }

    const username = String(req.body?.username || "").trim();
    const email = String(req.body?.email || "").trim();
    const code = String(req.body?.code || "").trim();
    if (!username || !email || !code) {
      return res.status(400).json({ error: "Username, email, and reset code are required." });
    }

    const message = buildPasswordResetEmail({ username, code });
    await sendEmail({
      to: email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return res.json({ ok: true, to: email });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/attachments/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Attachment file is required." });
    }

    const attachment = await createAttachment({
      projectId: String(req.body?.projectId || "").trim(),
      fileName: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    });

    return res.status(201).json({ attachment });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/attachments/:attachmentId/download", async (req, res, next) => {
  try {
    const { attachment, buffer } = await downloadAttachment(req.params.attachmentId);
    res.setHeader("Content-Type", attachment.contentType || "application/octet-stream");
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${String(attachment.name || "file").replace(/"/g, "")}"`,
    );
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/attachments/:attachmentId", async (req, res, next) => {
  try {
    await deleteAttachmentById(req.params.attachmentId);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

app.get("/api/projects", async (_req, res, next) => {
  try {
    const projects = await listProjects();
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

app.get("/api/projects/template", (_req, res) => {
  res.json({ project: createEmptyProject() });
});

app.get("/api/projects/:projectId", async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.projectId);
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

app.post("/api/projects", async (req, res, next) => {
  try {
    const project = await createProject(req.body || {});
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

app.put("/api/projects/:projectId", async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const projectPayload =
      body.project && typeof body.project === "object" ? body.project : body;
    const expectedUpdatedAt =
      typeof body.expectedUpdatedAt === "string" ? body.expectedUpdatedAt : "";
    const project = await updateProject(req.params.projectId, projectPayload, {
      expectedUpdatedAt,
    });
    res.json({ project });
  } catch (error) {
    if (Number(error?.statusCode || error?.status) === 409) {
      return res.status(409).json({
        error: error.message || "Project update conflict.",
        project: error.project || null,
      });
    }
    next(error);
  }
});

app.delete("/api/projects/:projectId", async (req, res, next) => {
  try {
    await deleteProject(req.params.projectId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users", async (req, res, next) => {
  try {
    const users = Array.isArray(req.body?.users) ? req.body.users : [];
    const savedUsers = await replaceUsers(users);
    res.json({ users: savedUsers });
  } catch (error) {
    next(error);
  }
});

app.put("/api/app-state", async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const savedAppState = await saveAppState({
      activeId: typeof body.activeId === "string" ? body.activeId : "",
      roles: body.roles,
      perms: body.perms,
      resets: body.resets,
    });

    res.json({
      activeId: savedAppState.activeId,
      roles: savedAppState.roles,
      perms: savedAppState.perms,
      resets: savedAppState.resets,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", async (req, res, next) => {
  try {
    const user = await createUser(req.body || {});
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:userId", async (req, res, next) => {
  try {
    const user = await updateUser(req.params.userId, req.body || {});
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/:userId", async (req, res, next) => {
  try {
    await deleteUser(req.params.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status =
    (error && Number(error.statusCode || error.status)) ||
    (error && error.code === "LIMIT_FILE_SIZE" ? 413 : 500);

  res.status(status).json({
    error: error.message || "Unexpected server error.",
  });
});

app.listen(config.port, () => {
  console.log(`Livio backend listening on http://localhost:${config.port}`);
  const emailStatus = getEmailStatus();
  if (emailStatus.configured) {
    console.log("SMTP is configured and ready for outbound email.");
  } else {
    console.warn(
      `SMTP is not fully configured. ${emailStatus.issues.join(" ") || "Email sending is disabled."}`,
    );
  }
});
