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
    .replace(/^_+|_+$/g, "") || "vendor-contract";
}

export function buildVendorContractFilename({ project = {}, contract = {} }) {
  const vendor = slug(contract.vendor || "vendor");
  const projectName = slug(project.name || "project");
  return `${projectName}_${vendor}_contract.pdf`;
}

export async function buildVendorContractPdf({ project = {}, contract = {} }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.05, 0.11, 0.18);
  const blue = rgb(0.1, 0.42, 0.77);
  const muted = rgb(0.42, 0.42, 0.39);
  const text = rgb(0.14, 0.14, 0.14);

  page.drawRectangle({ x: 36, y: 728, width: 540, height: 28, color: navy });
  page.drawText("VENDOR CONTRACT", { x: 48, y: 736, size: 16, font: bold, color: rgb(1, 1, 1) });

  page.drawText("LIVIO LEGACY AI", { x: 48, y: 690, size: 20, font: bold, color: navy });
  page.drawText("Subcontract agreement summary", { x: 48, y: 674, size: 10, font, color: muted });

  const projectName = clean(project.name) || "Project";
  const projectAddress = clean(
    project.address || [project.street, project.city, project.state, project.zip].filter(Boolean).join(", "),
  );
  const vendorName = clean(contract.vendor) || "Vendor";
  const vendorEmail = clean(contract.vendorEmail);

  page.drawText("Project", { x: 360, y: 690, size: 9, font: bold, color: muted });
  page.drawText(projectName, { x: 360, y: 676, size: 12, font: bold, color: navy });
  if (projectAddress) {
    drawWrapped(page, projectAddress, { x: 360, y: 660, width: 200, font, size: 10, lineHeight: 12, color: text });
  }

  page.drawRectangle({ x: 36, y: 590, width: 250, height: 66, borderColor: rgb(0.88, 0.87, 0.84), borderWidth: 1 });
  page.drawRectangle({ x: 326, y: 590, width: 250, height: 66, borderColor: rgb(0.88, 0.87, 0.84), borderWidth: 1 });

  page.drawText("Vendor", { x: 48, y: 638, size: 9, font: bold, color: muted });
  page.drawText(vendorName, { x: 48, y: 621, size: 13, font: bold, color: navy });
  if (vendorEmail) {
    page.drawText(vendorEmail, { x: 48, y: 606, size: 10, font, color: blue });
  }

  page.drawText("Contract Details", { x: 338, y: 638, size: 9, font: bold, color: muted });
  page.drawText(`Contract #: ${clean(contract.contractNo) || "-"}`, { x: 338, y: 621, size: 11, font: bold, color: text });
  page.drawText(`Status: ${clean(contract.status) || "-"}`, { x: 338, y: 606, size: 10, font, color: text });
  page.drawText(`Type: ${clean(contract.contractType) || "-"}`, { x: 338, y: 592, size: 10, font, color: text });

  page.drawText("Financial Summary", { x: 48, y: 554, size: 10, font: bold, color: navy });
  page.drawRectangle({ x: 36, y: 486, width: 540, height: 56, borderColor: rgb(0.88, 0.87, 0.84), borderWidth: 1 });
  page.drawText("Contract Amount", { x: 52, y: 522, size: 9, font: bold, color: muted });
  page.drawText(money(contract.amount), { x: 52, y: 500, size: 18, font: bold, color: navy });
  page.drawText("Start Date", { x: 250, y: 522, size: 9, font: bold, color: muted });
  page.drawText(dateText(contract.startDate), { x: 250, y: 500, size: 14, font: bold, color: text });
  page.drawText("End Date", { x: 448, y: 522, size: 9, font: bold, color: muted });
  page.drawText(dateText(contract.endDate), { x: 448, y: 500, size: 14, font: bold, color: text });

  let y = 456;
  if (clean(contract.scope)) {
    page.drawText("Scope", { x: 48, y, size: 9, font: bold, color: muted });
    y -= 16;
    y = drawWrapped(page, contract.scope, { x: 48, y, width: 520, font, size: 11, lineHeight: 14, color: text }) - 12;
  }

  const milestones = Array.isArray(contract.milestones) ? contract.milestones.filter((item) => clean(item?.name)) : [];
  if (milestones.length) {
    page.drawText("Milestones", { x: 48, y, size: 9, font: bold, color: muted });
    y -= 16;
    for (const milestone of milestones.slice(0, 8)) {
      const line = `${clean(milestone.name)}  |  ${money(milestone.amount)}  |  Due ${dateText(milestone.dueDate)}`;
      y = drawWrapped(page, line, { x: 48, y, width: 520, font, size: 10, lineHeight: 13, color: text }) - 6;
      if (y < 110) break;
    }
  }

  if (clean(contract.notes) && y > 110) {
    page.drawText("Notes", { x: 48, y, size: 9, font: bold, color: muted });
    y -= 16;
    drawWrapped(page, contract.notes, { x: 48, y, width: 520, font, size: 10, lineHeight: 13, color: text });
  }

  page.drawLine({ start: { x: 36, y: 72 }, end: { x: 576, y: 72 }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
  page.drawText(`Generated ${new Date().toLocaleDateString("en-US")} by Livio Legacy AI`, { x: 48, y: 56, size: 9, font, color: muted });

  return pdfDoc.save();
}

export function buildVendorContractEmail({ project = {}, contract = {} }) {
  const projectName = clean(project.name) || "Project";
  const vendorName = clean(contract.vendor) || "Vendor";
  const amount = money(contract.amount);
  const contractNo = clean(contract.contractNo) || "-";
  const milestones = Array.isArray(contract.milestones) ? contract.milestones.filter((item) => clean(item?.name)) : [];

  const subject = `${projectName} - Vendor Contract ${contractNo}`;
  const lines = [
    `Hello ${vendorName},`,
    "",
    `Please find attached the subcontract agreement for ${projectName}.`,
    `Contract number: ${contractNo}`,
    `Contract value: ${amount}`,
    clean(contract.scope) ? `Scope: ${clean(contract.scope)}` : "",
    milestones.length
      ? `Milestones: ${milestones.map((item) => `${clean(item.name)} (${money(item.amount)})`).join(", ")}`
      : "",
    "",
    "Please review, sign, and return at your earliest convenience.",
    "",
    "Thank you,",
    "Livio Legacy AI",
  ].filter(Boolean);

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f1f1f;line-height:1.6">
      <h2 style="margin:0 0 12px;color:#0C1B2E">Vendor Contract ${contractNo}</h2>
      <p>Hello ${vendorName},</p>
      <p>Please find attached the subcontract agreement for <strong>${projectName}</strong>.</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Contract #</td><td style="padding:4px 0">${contractNo}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Contract value</td><td style="padding:4px 0;font-weight:700">${amount}</td></tr>
        ${clean(contract.contractType) ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Type</td><td style="padding:4px 0">${clean(contract.contractType)}</td></tr>` : ""}
      </table>
      ${clean(contract.scope) ? `<p>${clean(contract.scope)}</p>` : ""}
      ${milestones.length
        ? `<p style="margin-top:12px"><strong>Milestones:</strong> ${milestones.map((item) => `${clean(item.name)} (${money(item.amount)})`).join(", ")}</p>`
        : ""}
      <p style="margin-top:18px">Please review, sign, and return at your earliest convenience.</p>
      <p>Thank you,<br/>Livio Legacy AI</p>
    </div>
  `;

  return { subject, text: lines.join("\n"), html };
}
