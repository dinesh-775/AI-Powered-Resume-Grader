import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { PASSWORD_RULES, isPasswordValid } from "../lib/passwordRules.js";

const inputClass =
  "w-full rounded-lg border bg-slate-950/60 text-slate-100 placeholder-slate-500 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordValid = isPasswordValid(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setTouched(true);
      setError("Please choose a password that meets all the requirements below.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/analyze", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/30 p-8">
        <h1 className="text-2xl font-extrabold mb-1 text-white">Create your account</h1>
        <p className="text-slate-400 text-sm mb-6">Save and revisit every resume analysis.</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-200">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`${inputClass} border-slate-700`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`${inputClass} border-slate-700`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(true)}
              required
              minLength={8}
              className={`${inputClass} ${touched && !passwordValid ? "border-red-500/60" : "border-slate-700"}`}
            />

            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                  <li
                    key={rule.id}
                    className={`flex items-center gap-2 text-xs ${
                      ok ? "text-emerald-400" : touched ? "text-red-400" : "text-slate-500"
                    }`}
                  >
                    <span className="inline-block w-3.5 text-center font-bold">
                      {ok ? "✓" : "•"}
                    </span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !passwordValid}
            className="w-full py-3 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-slate-400 mt-5 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-400 font-semibold hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
