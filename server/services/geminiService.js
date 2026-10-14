
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  scoreToGrade,
} from "./prompt.js";

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta";

function normalizeResult(obj) {
  const isResume = obj?.isResume === true;
  const isJobDescriptionAppropriate =
    obj?.isJobDescriptionAppropriate === true;

  const feedback =
    typeof obj?.feedback === "string"
      ? obj.feedback.trim()
      : "";

  const missingSkills = Array.isArray(obj?.missingSkills)
    ? obj.missingSkills.map(String).filter(Boolean)
    : [];

  const suggestions = Array.isArray(obj?.suggestions)
    ? obj.suggestions.map(String).filter(Boolean)
    : [];

  if (!isResume) {
    return {
      isResume: false,
      isJobDescriptionAppropriate,
      grade: "F",
      score: 0,
      missingSkills: [],
      feedback: "Give a proper resume",
      suggestions: [],
    };
  }

  if (!isJobDescriptionAppropriate) {
    return {
      isResume: true,
      isJobDescriptionAppropriate: false,
      grade: "F",
      score: 0,
      missingSkills: [],
      feedback:
        feedback ||
        "Job description rejected. Please provide a legitimate job description.",
      suggestions: [],
    };
  }

  const numericScore = Number(obj?.score);
  const score = Number.isFinite(numericScore)
    ? Math.max(0, Math.min(100, Math.round(numericScore)))
    : 0;

  return {
    isResume: true,
    isJobDescriptionAppropriate: true,
    grade: scoreToGrade(score),
    score,
    missingSkills,
    feedback,
    suggestions,
  };
}

function parseJsonLoose(text) {
  if (!text) return null;

  const cleaned = String(text)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

export async function analyzeWithGemini(
  resumeText,
  jobDescription
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY is not configured on the server."
    );
    err.status = 503;
    throw err;
  }

  if (
    typeof resumeText !== "string" ||
    !resumeText.trim() ||
    typeof jobDescription !== "string" ||
    !jobDescription.trim()
  ) {
    const err = new Error(
      "Both resume text and job description are required."
    );
    err.status = 400;
    throw err;
  }

  const model =
    process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const url =
    `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildUserPrompt(resumeText, jobDescription),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  let res;

  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    const err = new Error(
      e.name === "TimeoutError"
        ? "Gemini request timed out. Please try again."
        : `Failed to reach Gemini API: ${e.message}`
    );
    err.status = 502;
    throw err;
  }

  if (!res.ok) {
    const detail = await res.text();
    const err = new Error(
      `Gemini API error (${res.status}): ${detail.slice(0, 300)}`
    );
    err.status = 502;
    throw err;
  }

  const data = await res.json();

  if (data?.promptFeedback?.blockReason) {
    const err = new Error(
      "The request was blocked by Gemini safety filters."
    );
    err.status = 422;
    throw err;
  }

  const responseText =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

  const parsed = parseJsonLoose(responseText);

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    typeof parsed.isResume !== "boolean" ||
    typeof parsed.isJobDescriptionAppropriate !== "boolean"
  ) {
    const err = new Error(
      "Gemini returned an invalid evaluation response. Please try again."
    );
    err.status = 502;
    throw err;
  }

  return normalizeResult(parsed);
}
