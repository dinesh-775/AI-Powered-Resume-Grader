import mammoth from "mammoth";
import { createRequire } from "module";

// pdf-parse ships as CommonJS; import its internal lib entry directly to avoid
// the package's debug-mode that reads a test file when required as main.
const require = createRequire(import.meta.url);

/**
 * Clean raw extracted text: normalize whitespace, fix broken lines,
 * strip obvious duplicate consecutive lines and stray control chars.
 */
export function cleanText(raw = "") {
  if (!raw) return "";

  let text = String(raw)
    .replace(/\r\n?/g, "\n") // normalize newlines
    .replace(/\u0000/g, "") // null chars
    .replace(/[ \t]+\n/g, "\n") // trailing spaces before newline
    .replace(/\n{3,}/g, "\n\n") // collapse big gaps
    .replace(/[ \t]{2,}/g, " "); // collapse runs of spaces

  // Remove consecutive duplicate lines (common in OCR / copy artifacts)
  const lines = text.split("\n");
  const deduped = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (deduped.length && deduped[deduped.length - 1].trim() === trimmed && trimmed !== "") {
      continue;
    }
    deduped.push(line);
  }

  return deduped.join("\n").trim();
}

async function extractPdf(buffer) {
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const data = await pdfParse(buffer);
  return data.text || "";
}

async function extractDocx(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}

async function extractImage(buffer) {
  // Lazy-load tesseract so the server boots fast and only pays the cost on demand.
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text || "";
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract text from an uploaded file (multer memory buffer).
 * Returns { text, source }.
 */
export async function extractFromFile(file) {
  const { mimetype, buffer, originalname } = file;

  let raw = "";
  let source = "text";

  if (mimetype === "application/pdf") {
    raw = await extractPdf(buffer);
    source = "pdf";
  } else if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    raw = await extractDocx(buffer);
    source = "docx";
  } else if (mimetype.startsWith("image/")) {
    raw = await extractImage(buffer);
    source = "image";
  } else if (mimetype === "text/plain") {
    raw = buffer.toString("utf-8");
    source = "text";
  } else {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }

  return { text: cleanText(raw), source, fileName: originalname || "" };
}
