import ScoreGauge from "./ScoreGauge.jsx";

export default function ResultCard({ result }) {
  if (!result) return null;
  const { grade, score, missingSkills = [], feedback, suggestions = [], guest, saved } = result;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/20 p-6">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <ScoreGauge score={score} grade={grade} />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold mb-1 text-white">ATS Evaluation</h2>
          <p className="text-slate-300 leading-relaxed">{feedback}</p>
          <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300">
              Powered by Gemini AI
            </span>
            {guest ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300">
                Guest mode · not saved
              </span>
            ) : saved ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300">
                Saved to history
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-6">
        <div>
          <h3 className="font-semibold mb-3 text-slate-100">Missing / Weak Skills</h3>
          {missingSkills.length ? (
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No major skill gaps detected.</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-slate-100">Suggestions</h3>
          {suggestions.length ? (
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-brand-400 font-bold">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">No suggestions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
