import { useState } from "react";
import api from "../lib/axios.js";
import ResultCard from "./ResultCard.jsx";

const ACCEPT = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950/60 text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500";

export default function ResumeAnalyzer() {
  const [mode, setMode] = useState("file"); // file | text
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (mode === "file" && !file) return setError("Please choose a resume file.");
    if (mode === "text" && !resumeText.trim()) return setError("Please paste your resume text.");
    if (!jobDescription.trim()) return setError("Please provide the job description.");

    setLoading(true);
    try {
      const form = new FormData();
      if (mode === "file") form.append("resume", file);
      else form.append("resumeText", resumeText);
      form.append("jobDescription", jobDescription);
      if (jobTitle) form.append("jobTitle", jobTitle);

      const { data } = await api.post("/analyze", form);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/20 p-6"
      >
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition ${
              mode === "file" ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition ${
              mode === "text" ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Paste text
          </button>
        </div>

        {mode === "file" ? (
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1.5 text-slate-200">
              Resume (PDF, DOCX, or image)
            </label>
            <input
              type="file"
              accept={ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-300 file:font-semibold hover:file:bg-brand-500/30 cursor-pointer"
            />
            {file && <p className="mt-1 text-xs text-slate-500">{file.name}</p>}
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1.5 text-slate-200">Resume text</label>
            <textarea
              rows={7}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content here..."
              className={inputClass}
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5 text-slate-200">Job title (optional)</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. MERN Stack Developer"
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5 text-slate-200">Job description</label>
          <textarea
            rows={7}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className={inputClass}
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Analyzing with Gemini…" : "Analyze Resume"}
        </button>
      </form>

      <div>
        {loading && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/20 p-10 flex flex-col items-center gap-4 text-slate-400">
            <div className="h-10 w-10 rounded-full border-4 border-slate-700 border-t-brand-500 animate-spin" />
            <p>Extracting text and scoring against the job description…</p>
          </div>
        )}
        {!loading && result && <ResultCard result={result} />}
        {!loading && !result && (
          <div className="rounded-2xl bg-slate-900/50 border border-dashed border-slate-700 p-10 text-center text-slate-500">
            Your ATS evaluation will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
