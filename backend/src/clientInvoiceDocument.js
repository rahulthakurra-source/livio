import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function clean(value) {
  return String(value || "").trim();
}

function money(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function dateText(value) {
  if (!value) return "-";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function wrapText(text, maxChars = 86) {
  const source = clean(text);
  if (!source) return [];
  const words = source.replace(/\r/g, "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrapped(page, text, options) {
  const {
    x,
    y,
    width,
    font,
    size = 11,
    lineHeight = 14,
    color = rgb(0.16, 0.16, 0.16),
  } = options;
  const maxChars = Math.max(20, Math.floor(width / (size * 0.52)));
  const lines = wrapText(text, maxChars);
  let nextY = y;
  for (const line of lines) {
    page.drawText(line, { x, y: nextY, size, font, color });
    nextY -= lineHeight;
  }
  return nextY;
}

function slug(value) {
  return clean(value)
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "") || "client-invoice";
}

export function buildClientInvoiceFilename({ project = {}, invoice = {} }) {
  const invoiceNo = slug(invoice.invoiceNo || "invoice");
  const projectName = slug(project.name || "project");
  return `${projectName}_${invoiceNo}.pdf`;
}

export async function buildClientInvoicePdf({ project = {}, invoice = {}, contract = {} }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.05, 0.11, 0.18);
  const blue = rgb(0.1, 0.42, 0.77);
  const muted = rgb(0.42, 0.42, 0.39);
  const text = rgb(0.14, 0.14, 0.14);

  page.drawRectangle({ x: 36, y: 728, width: 540, height: 28, color: navy });
  page.drawText("CLIENT INVOICE", { x: 48, y: 736, size: 16, font: bold, color: rgb(1, 1, 1) });

  page.drawText("LIVIO LEGACY AI", { x: 48, y: 690, size: 20, font: bold, color: navy });
  page.drawText("Invoice prepared for client billing", { x: 48, y: 674, size: 10, font, color: muted });

  const projectName = clean(project.name) || "Project";
  const projectAddress = clean(project.address || [project.street, project.city, project.state, project.zip].filter(Boolean).join(", "));
  const clientName = clean(invoice.clientName || contract.clientName) || "Client";
  const clientEmail = clean(invoice.clientEmail || contract.clientEmail);
  const contractTitle = clean(contract.contractTitle || contract.contractNo);

  page.drawText("Project", { x: 360, y: 690, size: 9, font: bold, color: muted });
  page.drawText(projectName, { x: 360, y: 676, size: 12, font: bold, color: navy });
  if (projectAddress) {
    drawWrapped(page, projectAddress, { x: 360, y: 660, width: 200, font, size: 10, lineHeight: 12, color: text });
  }

  page.drawRectangle({ x: 36, y: 590, width: 250, height: 66, borderColor: rgb(0.88, 0.87, 0.84), borderWidth: 1 });
  page.drawRectangle({ x: 326, y: 590, width: 250, height: 66, borderColor: rgb(0.88, 0.87, 0.84), borderWidth: 1 });

  page.drawText("Bill To", { x: 48, y: 638, size: 9, font: bold, color: muted });
  page.drawText(clientName, { x: 48, y: 621, size: 13, font: bold, color: navy });
  if (clientEmail) {
    page.drawText(clientEmail, { x: 48, y: 606, size: 10, font, color: blue });
  }

  page.drawText("Invoice Details", { x: 338, y: 638, size: 9, font: bold, color: muted });
  page.drawText(`Invoice #: ${clean(invoice.invoiceNo) || "-"}`, { x: 338, y: 621, size: 11, font: bold, color: text });
  page.drawText(`Invoice Date: ${dateText(invoice.invoiceDate)}`, { x: 338, y: 606, size: 10, font, color: text });
  page.drawText(`Due Date: ${dateText(invoice.dueDate)}`, { x: 338, y: 592, size: 10, font, color: text });

  page.drawText("Financial Summary", { x: 48, y: 554, size: 10, font: bold, color: navy });
  page.drawRectangle({ x: 36, y: 486, width: 540, height: 56, borderColor: rgb(0.88, 0.87, 0.84), borderWidth: 1 });
  page.drawText("Invoice Amount", { x: 52, y: 522, size: 9, font: bold, color: muted });
  page.drawText(money(invoice.amount), { x: 52, y: 500, size: 18, font: bold, color: navy });
  page.drawText("Balance Due", { x: 250, y: 522, size: 9, font: bold, color: muted });
  page.drawText(money(invoice.balanceDue), { x: 250, y: 500, size: 18, font: bold, color: Number(invoice.balanceDue || 0) > 0 ? rgb(0.62, 0.07, 0.22) : rgb(0.06, 0.46, 0.43) });
  page.drawText("Status", { x: 448, y: 522, size: 9, font: bold, color: muted });
  page.drawText(clean(invoice.status) || "Draft", { x: 448, y: 500, size: 14, font: bold, color: text });

  let y = 456;
  if (contractTitle) {
    page.drawText("Linked Contract", { x: 48, y, size: 9, font: bold, color: muted });
    y -= 16;
    y = drawWrapped(page, contractTitle, { x: 48, y, width: 520, font: bold, size: 12, lineHeight: 14, color: text }) - 12;
  }

  page.drawText("Description", { x: 48, y, size: 9, font: bold, color: muted });
  y -= 16;
  y = drawWrapped(page, clean(invoice.description) || "No description provided.", { x: 48, y, width: 520, font, size: 11, lineHeight: 14, color: text }) - 12;

  if (clean(invoice.notes)) {
    page.drawText("Internal Notes", { x: 48, y, size: 9, font: bold, color: muted });
    y -= 16;
    y = drawWrapped(page, invoice.notes, { x: 48, y, width: 520, font, size: 10, lineHeight: 13, color: text }) - 12;
  }

  page.drawLine({ start: { x: 36, y: 72 }, end: { x: 576, y: 72 }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
  page.drawText(`Generated ${new Date().toLocaleDateString("en-US")} by Livio Legacy AI`, { x: 48, y: 56, size: 9, font, color: muted });

  return pdfDoc.save();
}

export function buildClientInvoiceEmail({ project = {}, invoice = {}, contract = {} }) {
  const projectName = clean(project.name) || "Project";
  const clientName = clean(invoice.clientName || contract.clientName) || "Client";
  const invoiceNo = clean(invoice.invoiceNo) || "Invoice";
  const amount = money(invoice.amount);
  const balance = money(invoice.balanceDue);
  const dueDate = dateText(invoice.dueDate);
  const contractTitle = clean(contract.contractTitle || contract.contractNo);

  const subject = `${projectName} - Invoice ${invoiceNo}`;
  const text = [
    `Hello ${clientName},`,
    "",
    `Please find attached invoice ${invoiceNo} for ${projectName}.`,
    `Invoice amount: ${amount}`,
    `Balance due: ${balance}`,
    `Due date: ${dueDate}`,
    contractTitle ? `Linked contract: ${contractTitle}` : "",
    clean(invoice.description) ? `Description: ${clean(invoice.description)}` : "",
    "",
    "Thank you,",
    "Livio Legacy AI",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f1f1f;line-height:1.6">
      <h2 style="margin:0 0 12px;color:#0C1B2E">Invoice ${invoiceNo}</h2>
      <p>Hello ${clientName},</p>
      <p>Please find attached your invoice for <strong>${projectName}</strong>.</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Invoice amount</td><td style="padding:4px 0;font-weight:700">${amount}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Balance due</td><td style="padding:4px 0;font-weight:700">${balance}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Due date</td><td style="padding:4px 0">${dueDate}</td></tr>
        ${contractTitle ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Linked contract</td><td style="padding:4px 0">${contractTitle}</td></tr>` : ""}
      </table>
      ${clean(invoice.description) ? `<p style="margin-top:12px">${clean(invoice.description)}</p>` : ""}
      <p style="margin-top:18px">Thank you,<br/>Livio Legacy AI</p>
    </div>
  `;

  return { subject, text, html };
}
