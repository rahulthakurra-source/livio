import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const legacyDir = path.join(rootDir, "public", "legacy");
const livioPath = path.join(legacyDir, "livio.html");
const trackerPath = path.join(legacyDir, "daily-tracker.html");
const outputPath = path.join(legacyDir, "livio-combined.html");

const [livioHtml, trackerHtml] = await Promise.all([
  fs.readFile(livioPath, "utf8"),
  fs.readFile(trackerPath, "utf8"),
]);

const injectedScript = `<script>window.__DAILY_TRACKER_HTML__=${JSON.stringify(trackerHtml)};</script>`;
const marker = "</head>";
const combinedHtml = livioHtml.includes(marker)
  ? livioHtml.replace(marker, `${injectedScript}\n${marker}`)
  : `${injectedScript}\n${livioHtml}`;

await fs.writeFile(outputPath, combinedHtml, "utf8");
console.log(`Built single-file legacy page: ${path.relative(rootDir, outputPath)}`);
