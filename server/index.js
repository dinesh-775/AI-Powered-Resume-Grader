import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { connectDB } from "./config/db.js";
import { isCloudinaryEnabled } from "./config/cloudinary.js";
import authRoutes from "./routes/auth.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";

const app = express();

// Allowed origins come from CLIENT_ORIGIN (comma-separated). In production set it
// to your Vercel URL, e.g. https://ai-resume-grader.vercel.app
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no origin) and any whitelisted origin.
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Simple root route so platform health checks / browsers see something friendly.
app.get("/", (_req, res) => {
  res.json({ service: "AI Resume Grader API", status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    gemini: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    cloudinary: isCloudinaryEnabled(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/analyze", analysisRoutes);

// 404 handler for unknown API routes -> JSON, not HTML.
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler -> always JSON, with full diagnostics in the log.
app.use((err, _req, res, _next) => {
  // Full detail in the server console so you can see the real cause.
  console.error("\n[error] ----------------------------------------");
  console.error(`[error] name:    ${err.name}`);
  console.error(`[error] message: ${err.message}`);
  if (err.code) console.error(`[error] code:    ${err.code}`);
  console.error(err.stack);
  console.error("[error] ----------------------------------------\n");

  let status = err.status || 500;
  if (/Unsupported file type|File too large|LIMIT_FILE_SIZE/.test(err.message || "")) status = 400;
  if (err.name === "ValidationError") status = 400; // Mongoose schema validation
  if (err.code === 11000) status = 409; // Mongo duplicate key

  const payload = { error: err.message || "Internal server error" };

  // In development, expose extra detail to the client so debugging is easy.
  if (process.env.NODE_ENV !== "production") {
    payload.name = err.name;
    if (err.code) payload.code = err.code;
    payload.detail = err.message;
  }

  res.status(status).json(payload);
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] API running on http://localhost:${PORT}`);
    console.log(`[server] Gemini: ${process.env.GEMINI_API_KEY ? "configured" : "NOT configured"}`);
    console.log(`[server] Cloudinary: ${isCloudinaryEnabled() ? "configured" : "NOT configured"}`);
  });
});
