import { extractFromFile, cleanText } from "../services/extractText.js";
import { analyzeWithGemini } from "../services/geminiService.js";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  buildAssetUrl,
} from "../config/cloudinary.js";
import { Analysis } from "../models/Analysis.js";

/**
 * POST /api/analyze
 * Public route (optionalAuth). Works for guests and authenticated users.
 *
 * Accepts multipart/form-data:
 *   - resume: file (pdf | docx | image) [optional if resumeText provided]
 *   - resumeText: string [optional if file provided]
 *   - jobDescription: string (required)
 *   - jobTitle: string (optional)
 *
 * Guests: analysis is returned but NOT stored, and the file is NOT uploaded.
 * Authenticated users: file -> Cloudinary, result + metadata -> MongoDB.
 */
export async function analyze(req, res, next) {
  try {
    const jobDescription = (req.body?.jobDescription || "").trim();
    const jobTitle = (req.body?.jobTitle || "").trim();

    if (!jobDescription) {
      return res.status(400).json({ error: "Job description is required." });
    }

    let resumeText = "";
    let source = "text";

    if (req.file) {
      const extracted = await extractFromFile(req.file);
      resumeText = extracted.text;
      source = extracted.source;
    } else if (req.body?.resumeText) {
      resumeText = cleanText(req.body.resumeText);
      source = "text";
    }

    if (!resumeText || resumeText.trim().length < 10) {
      return res
        .status(400)
        .json({ error: "Could not read resume content. Upload a valid file or paste resume text." });
    }

    // --- AI analysis (Gemini) ---
    const result = await analyzeWithGemini(resumeText, jobDescription);

    // --- Not a resume: tell the user, do NOT persist or upload anything ---
    if (result.isResume === false) {
      return res.status(422).json({
        ...result,
        saved: false,
        notResume: true,
        error: result.feedback || "Give a proper resume",
      });
    }

    // --- Guest: return without persisting ---
    if (!req.user) {
      return res.json({ ...result, saved: false, guest: true });
    }

    // --- Authenticated: upload file to Cloudinary (if present) + store history ---
    let fileMeta = {
      fileName: "",
      fileUrl: "",
      filePublicId: "",
      fileResourceType: "",
      fileMime: "",
    };
    if (req.file) {
      try {
        const uploaded = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
        if (uploaded) {
          fileMeta = {
            fileName: req.file.originalname || "",
            fileUrl: uploaded.url,
            filePublicId: uploaded.publicId,
            fileResourceType: uploaded.resourceType || "",
            fileMime: req.file.mimetype || "",
          };
        } else {
          fileMeta.fileName = req.file.originalname || "";
          fileMeta.fileMime = req.file.mimetype || "";
        }
      } catch (e) {
        console.warn(`[cloudinary] upload failed: ${e.message}`);
        fileMeta.fileName = req.file.originalname || "";
        fileMeta.fileMime = req.file.mimetype || "";
      }
    }

    const doc = await Analysis.create({
      user: req.user._id,
      ...result,
      jobTitle,
      jobDescription,
      resumeText,
      source,
      ...fileMeta,
    });

    return res.json({ ...result, saved: true, guest: false, id: doc._id, hasFile: Boolean(doc.filePublicId) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/analyze/history - current user's analyses, newest first. */
export async function getHistory(req, res, next) {
  try {
    const items = await Analysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ items });
  } catch (err) {
    next(err);
  }
}

/** GET /api/analyze/history/:id - a single analysis owned by the user. */
export async function getAnalysisById(req, res, next) {
  try {
    const item = await Analysis.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!item) return res.status(404).json({ error: "Analysis not found." });
    return res.json({ item });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/analyze/history/:id - delete an analysis (and its Cloudinary file). */
export async function deleteAnalysis(req, res, next) {
  try {
    const item = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ error: "Analysis not found." });

    if (item.filePublicId) {
      await deleteFromCloudinary(item.filePublicId, item.fileResourceType);
    }
    await item.deleteOne();

    return res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analyze/history/:id/download
 * Streams the stored resume file back to the authenticated owner so the
 * browser downloads it (works even though Cloudinary raw URLs are signed).
 */
export async function downloadResume(req, res, next) {
  try {
    const item = await Analysis.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!item) return res.status(404).json({ error: "Analysis not found." });
    if (!item.filePublicId || !item.fileUrl) {
      return res.status(404).json({ error: "No resume file is stored for this analysis." });
    }

    // Prefer a freshly signed URL; fall back to the stored secure URL.
    const signed = buildAssetUrl(item.filePublicId, item.fileResourceType || "raw");
    const sourceUrl = signed || item.fileUrl;

    const upstream = await fetch(sourceUrl);
    if (!upstream.ok) {
      // Retry with the plain stored URL if the signed one failed.
      const retry = sourceUrl !== item.fileUrl ? await fetch(item.fileUrl) : null;
      if (!retry || !retry.ok) {
        return res.status(502).json({ error: "Could not retrieve the file from storage." });
      }
      return streamDownload(retry, item, res);
    }

    return streamDownload(upstream, item, res);
  } catch (err) {
    next(err);
  }
}

/** Pipe a fetch Response to the Express response as a file download. */
async function streamDownload(upstream, item, res) {
  const fileName = item.fileName || `resume-${item._id}`;
  const contentType =
    item.fileMime || upstream.headers.get("content-type") || "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName.replace(/"/g, "")}"`
  );

  const arrayBuffer = await upstream.arrayBuffer();
  res.send(Buffer.from(arrayBuffer));
}
