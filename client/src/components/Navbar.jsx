import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-extrabold">
            R
          </span>
          <span className="font-extrabold text-lg tracking-tight text-white">
            Resume<span className="text-brand-400">Grader</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          {user ? (
            <>
              <Link className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white" to="/analyze">
                Resume Analysis
              </Link>
              <Link className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white" to="/history">
                History
              </Link>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline text-slate-400">Hi, {user.name.split(" ")[0]}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white" to="/analyze">
                Resume Analysis
              </Link>
              <Link className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white" to="/login">
                Sign In
              </Link>
              <Link
                className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-500"
                to="/register"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
