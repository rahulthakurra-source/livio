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

function drawTextRight(page, value, options) {
  const {
    x,
    y,
    font,
    size = 11,
    color = rgb(0.14, 0.14, 0.14),
  } = options;
  const textValue = clean(value) || "-";
  const width = font.widthOfTextAtSize(textValue, size);
  page.drawText(textValue, { x: x - width, y, size, font, color });
}

function drawDivider(page, y, color = rgb(0.8, 0.8, 0.8)) {
  page.drawLine({
    start: { x: 36, y },
    end: { x: 576, y },
    thickness: 1,
    color,
  });
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

  const blue = rgb(0.18, 0.46, 0.71);
  const border = rgb(0.8, 0.8, 0.8);
  const muted = rgb(0.43, 0.43, 0.43);
  const text = rgb(0.14, 0.14, 0.14);
  const shade = rgb(0.95, 0.95, 0.95);

  const projectName = clean(project.name) || "Project";
  const projectAddress = clean(
    project.address || [project.street, project.city, project.state, project.zip].filter(Boolean).join(", "),
  );
  const clientName = clean(invoice.clientName || contract.clientName) || "Client";
  const clientEmail = clean(invoice.clientEmail || contract.clientEmail);
  const contractTitle = clean(contract.contractTitle || contract.contractNo);
  const invoiceNumber = clean(invoice.invoiceNo) || "-";
  const invoiceDate = dateText(invoice.invoiceDate);
  const dueDate = clean(invoice.dueDate) ? dateText(invoice.dueDate) : "";
  const status = clean(invoice.status) || "Draft";
  const amount = money(invoice.amount);
  const balance = money(invoice.balanceDue);
  const description = clean(invoice.description) || "No description provided.";
  const notes = clean(invoice.notes);

  page.drawText("LIVIO BUILDING SYSTEM", {
    x: 48,
    y: 748,
    size: 16,
    font: bold,
    color: blue,
  });
  page.drawText("INVOICE", {
    x: 48,
    y: 716,
    size: 20,
    font: bold,
    color: text,
  });

  page.drawRectangle({ x: 36, y: 594, width: 540, height: 94, borderColor: border, borderWidth: 1 });
  page.drawLine({ start: { x: 306, y: 594 }, end: { x: 306, y: 688 }, thickness: 1, color: border });

  page.drawText("Invoice Number:", { x: 50, y: 664, size: 11, font: bold, color: text });
  page.drawText(invoiceNumber, { x: 50, y: 647, size: 11, font, color: text });
  page.drawText("Invoice Date:", { x: 50, y: 624, size: 11, font: bold, color: text });
  page.drawText(invoiceDate, { x: 50, y: 607, size: 11, font, color: text });
  page.drawText("Due Date:", { x: 180, y: 624, size: 11, font: bold, color: text });
  page.drawText(dueDate || "-", { x: 180, y: 607, size: 11, font, color: text });

  page.drawText("Bill To:", { x: 320, y: 664, size: 11, font: bold, color: text });
  page.drawText(clientName, { x: 320, y: 647, size: 12, font: bold, color: text });
  let billToY = 630;
  if (clientEmail) {
    page.drawText(clientEmail, { x: 320, y: billToY, size: 10, font, color: text });
    billToY -= 14;
  }
  if (projectAddress) {
    billToY = drawWrapped(page, projectAddress, {
      x: 320,
      y: billToY,
      width: 236,
      font,
      size: 10,
      lineHeight: 12,
      color: text,
    });
  }

  const tableTop = 548;
  const descriptionWidth = 320;
  const qtyWidth = 80;
  const rowHeight = 110;
  const totalRowHeight = 30;
  const tableLeft = 36;
  const tableRight = 576;
  const descriptionRight = tableLeft + descriptionWidth;
  const qtyRight = descriptionRight + qtyWidth;

  page.drawRectangle({ x: tableLeft, y: tableTop, width: 540, height: 26, color: blue });
  page.drawText("Description", { x: 48, y: tableTop + 8, size: 11, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Quantity", { x: descriptionRight + 14, y: tableTop + 8, size: 11, font: bold, color: rgb(1, 1, 1) });
  drawTextRight(page, "Amount", { x: tableRight - 14, y: tableTop + 8, font: bold, size: 11, color: rgb(1, 1, 1) });

  const itemBottom = tableTop - rowHeight;
  page.drawRectangle({ x: tableLeft, y: itemBottom, width: 540, height: rowHeight, borderColor: border, borderWidth: 1 });
  page.drawLine({ start: { x: descriptionRight, y: itemBottom }, end: { x: descriptionRight, y: tableTop }, thickness: 1, color: border });
  page.drawLine({ start: { x: qtyRight, y: itemBottom }, end: { x: qtyRight, y: tableTop }, thickness: 1, color: border });

  let descY = tableTop - 20;
  page.drawText(contractTitle || projectName || "Client Billing", {
    x: 48,
    y: descY,
    size: 11,
    font: bold,
    color: text,
  });
  descY -= 16;

  if (projectName) {
    descY = drawWrapped(page, `Project: ${projectName}`, {
      x: 48,
      y: descY,
      width: descriptionWidth - 24,
      font,
      size: 10,
      lineHeight: 12,
      color: text,
    }) - 4;
  }
  if (projectAddress) {
    descY = drawWrapped(page, `Location: ${projectAddress}`, {
      x: 48,
      y: descY,
      width: descriptionWidth - 24,
      font,
      size: 10,
      lineHeight: 12,
      color: text,
    }) - 4;
  }
  drawWrapped(page, description, {
    x: 48,
    y: descY,
    width: descriptionWidth - 24,
    font,
    size: 10,
    lineHeight: 12,
    color: text,
  });

  page.drawText("1", {
    x: descriptionRight + 36,
    y: itemBottom + rowHeight / 2 - 6,
    size: 11,
    font,
    color: text,
  });
  drawTextRight(page, amount, {
    x: tableRight - 14,
    y: itemBottom + rowHeight / 2 - 6,
    font: bold,
    size: 11,
    color: text,
  });

  const totalBottom = itemBottom - totalRowHeight;
  page.drawRectangle({ x: tableLeft, y: totalBottom, width: 540, height: totalRowHeight, borderColor: border, borderWidth: 1, color: shade });
  page.drawLine({ start: { x: descriptionRight, y: totalBottom }, end: { x: descriptionRight, y: itemBottom }, thickness: 1, color: border });
  page.drawLine({ start: { x: qtyRight, y: totalBottom }, end: { x: qtyRight, y: itemBottom }, thickness: 1, color: border });
  drawTextRight(page, "TOTAL:", {
    x: qtyRight - 14,
    y: totalBottom + 10,
    font: bold,
    size: 11,
    color: text,
  });
  drawTextRight(page, amount, {
    x: tableRight - 14,
    y: totalBottom + 8,
    font: bold,
    size: 13,
    color: text,
  });

  let y = totalBottom - 32;
  page.drawText("Billing Detail:", { x: 48, y, size: 13, font: bold, color: text });
  y -= 20;

  const detailLines = [
    contractTitle ? `Contract: ${contractTitle}` : "",
    `Invoice Status: ${status}`,
    `Invoice Amount: ${amount}`,
    `Balance Due: ${balance}`,
    dueDate ? `Payment Due: ${dueDate}` : "",
  ].filter(Boolean);

  for (const line of detailLines) {
    y = drawWrapped(page, line, {
      x: 48,
      y,
      width: 520,
      font,
      size: 10,
      lineHeight: 13,
      color: text,
    }) - 4;
  }

  y -= 8;
  page.drawText("Payment Terms:", { x: 48, y, size: 12, font: bold, color: text });
  y -= 16;
  y = drawWrapped(
    page,
    dueDate ? `Payment is due by ${dueDate}.` : "Payment is due upon receipt of this invoice.",
    {
      x: 48,
      y,
      width: 520,
      font,
      size: 10,
      lineHeight: 13,
      color: text,
    },
  );

  if (notes) {
    y -= 20;
    page.drawText("Additional Notes:", { x: 48, y, size: 12, font: bold, color: text });
    y -= 16;
    y = drawWrapped(page, notes, {
      x: 48,
      y,
      width: 520,
      font,
      size: 10,
      lineHeight: 13,
      color: text,
    });
  }

  drawDivider(page, 72, border);
  page.drawText("Thank you for your business!", {
    x: 48,
    y: 56,
    size: 10,
    font,
    color: muted,
  });

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
