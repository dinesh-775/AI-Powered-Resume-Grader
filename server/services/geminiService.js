import { SYSTEM_PROMPT, buildUserPrompt, scoreToGrade } from "./prompt.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Guarantee a valid, well-typed result object regardless of model output. */
function normalizeResult(obj) {
  const isResume = obj?.isResume !== false; // default to true unless explicitly false
  const score = Math.max(0, Math.min(100, Math.round(Number(obj?.score) || 0)));
  const missingSkills = Array.isArray(obj?.missingSkills)
    ? obj.missingSkills.map(String).filter(Boolean)
    : [];
  const suggestions = Array.isArray(obj?.suggestions)
    ? obj.suggestions.map(String).filter(Boolean)
    : [];
  const feedback = typeof obj?.feedback === "string" ? obj.feedback.trim() : "";

  // When the content is not a resume, force a clear, consistent response.
  if (!isResume) {
    return {
      isResume: false,
      grade: "F",
      score: 0,
      missingSkills: [],
      feedback: feedback || "Give a proper resume",
      suggestions: [],
    };
  }

  // Numeric score always determines the grade for consistency.
  return {
    isResume: true,
    grade: scoreToGrade(score),
    score,
    missingSkills,
    feedback,
    suggestions,
  };
}

function parseJsonLoose(text) {
  if (!text) return null;
  let t = String(text).trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Analyze a resume against a job description using Google Gemini.
 * Throws a descriptive error if the API key is missing or the call fails.
 */
export async function analyzeWithGemini(resumeText, jobDescription) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY is not configured on the server.");
    err.status = 503;
    throw err;
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      { role: "user", parts: [{ text: buildUserPrompt(resumeText, jobDescription) }] },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  };

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const err = new Error(`Failed to reach Gemini API: ${e.message}`);
    err.status = 502;
    throw err;
  }

  if (!res.ok) {
    const detail = await res.text();
    const err = new Error(`Gemini API error (${res.status}): ${detail.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  const parsed = parseJsonLoose(text);

  if (!parsed) {
    const err = new Error("Gemini returned a response that could not be parsed as JSON.");
    err.status = 502;
    throw err;
  }

  return normalizeResult(parsed);
}
