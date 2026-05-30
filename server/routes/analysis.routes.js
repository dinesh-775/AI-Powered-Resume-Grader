import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import {
  analyze,
  getHistory,
  getAnalysisById,
  deleteAnalysis,
  downloadResume,
} from "../controllers/analysis.controller.js";

const router = Router();

// Public analysis (guests + authenticated). optionalAuth attaches req.user if logged in.
router.post("/", optionalAuth, upload.single("resume"), analyze);

// Authenticated history management.
router.get("/history", requireAuth, getHistory);
router.get("/history/:id", requireAuth, getAnalysisById);
router.get("/history/:id/download", requireAuth, downloadResume);
router.delete("/history/:id", requireAuth, deleteAnalysis);

export default router;
