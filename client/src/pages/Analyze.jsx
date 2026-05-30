import ResumeAnalyzer from "../components/ResumeAnalyzer.jsx";
import { useAuthStore } from "../store/authStore.js";

export default function Analyze() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Resume Analysis</h1>
        <p className="text-slate-400 mt-1">
          {user
            ? "Your analyses are saved to your history automatically."
            : "Analyze your resume against any job description."}
        </p>
      </div>
      <ResumeAnalyzer />
    </div>
  );
}
