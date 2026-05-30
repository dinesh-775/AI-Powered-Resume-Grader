import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Analyze from "./pages/Analyze.jsx";
import History from "./pages/History.jsx";

export default function App() {
  return (
    <div className="min-h-full flex flex-col bg-slate-950 text-slate-200">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        AI-Powered Resume Grader · MongoDB · Express · React · Node · Gemini AI
      </footer>
    </div>
  );
}
