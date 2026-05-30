import { Link } from "react-router-dom";
import ResumeAnalyzer from "../components/ResumeAnalyzer.jsx";

const FEATURES = [
  { title: "ATS Scoring", desc: "Get a 0–100 score and an O–F grade based on real ATS criteria." },
  { title: "Skill Gap Detection", desc: "See exactly which required skills your resume is missing." },
  { title: "Actionable Feedback", desc: "Concrete suggestions to improve and beat the bots." },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-brand-600/20 via-indigo-900/10 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <section className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 text-xs font-semibold mb-4 border border-brand-500/20">
            AI-Powered · Built on the MERN stack
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Beat the ATS. <span className="text-brand-400">Land the interview.</span>
          </h1>
          <p className="text-lg text-slate-400 mb-6">
            Upload your resume and a job description. Our Gemini-powered grader scores your match,
            finds missing skills, and tells you exactly how to improve — in seconds.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="#analyze"
              className="px-6 py-3 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-500"
            >
              Try it free
            </a>
            <Link
              to="/register"
              className="px-6 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold hover:bg-slate-700"
            >
              Create account
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            No sign-up needed to try. Create an account to save your history.
          </p>
        </section>

        <section className="grid sm:grid-cols-3 gap-4 mb-14">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl shadow-black/20"
            >
              <h3 className="font-bold mb-1 text-white">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </section>

        <section id="analyze" className="scroll-mt-20">
          <h2 className="text-2xl font-extrabold mb-6 text-center text-white">Analyze your resume now</h2>
          <ResumeAnalyzer />
        </section>
      </div>
    </div>
  );
}
