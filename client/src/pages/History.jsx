import { useEffect, useState } from "react";
import api from "../lib/axios.js";
import ResultCard from "../components/ResultCard.jsx";

const GRADE_BG = {
  O: "bg-green-600",
  A: "bg-green-500",
  B: "bg-lime-500",
  C: "bg-yellow-500",
  D: "bg-orange-500",
  F: "bg-red-500",
};

function formatDate(d) {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/analyze/history");
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this analysis? This also removes the resume file from storage. This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/analyze/history/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(item) {
    setDownloadingId(item._id);
    try {
      const res = await api.get(`/analyze/history/${item._id}/download`, {
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = item.fileName || `resume-${item._id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Blob error bodies need to be read as text to get the message.
      let message = err.message;
      if (err.status && err.response?.data instanceof Blob) {
        try {
          message = JSON.parse(await err.response.data.text()).error || message;
        } catch {
          /* keep default */
        }
      }
      alert(message || "Could not download the resume file.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Analysis History</h1>
          <p className="text-slate-400 mt-1">Your previous resume evaluations.</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold hover:bg-slate-700">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-slate-700 border-t-brand-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-500/20 text-red-300 font-bold">
              !
            </span>
            <div className="flex-1">
              <h3 className="font-bold text-red-200">Couldn't load your history</h3>
              <p className="text-red-300/90 text-sm mt-1">{error}</p>
              <button
                onClick={load}
                className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/50 border border-dashed border-slate-700 p-12 text-center text-slate-500">
          No analyses yet. Run your first resume analysis to see it here.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className={`rounded-xl bg-slate-900 border p-4 flex items-center gap-4 cursor-pointer transition ${
                  selected?._id === item._id ? "border-brand-500 ring-2 ring-brand-500/20" : "border-slate-800 hover:border-slate-700"
                }`}
                onClick={() => setSelected(item)}
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white font-extrabold ${GRADE_BG[item.grade] || "bg-brand-600"}`}
                >
                  {item.grade}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-slate-100">
                    {item.jobTitle || item.fileName || "Untitled analysis"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.score}/100 · {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.filePublicId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      disabled={downloadingId === item._id}
                      title="Download resume file"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-300 hover:bg-brand-500/10 disabled:opacity-50"
                    >
                      {downloadingId === item._id ? "…" : "Download"}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item._id);
                    }}
                    disabled={deletingId === item._id}
                    title="Delete analysis and stored file"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {deletingId === item._id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-20">
            {selected ? (
              <div className="space-y-3">
                <ResultCard result={selected} />
                {selected.filePublicId && (
                  <button
                    onClick={() => handleDownload(selected)}
                    disabled={downloadingId === selected._id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-semibold text-brand-300 hover:bg-slate-700 disabled:opacity-50"
                  >
                    {downloadingId === selected._id ? "Downloading…" : "⬇ Download resume file"}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/50 border border-dashed border-slate-700 p-12 text-center text-slate-500">
                Select an analysis to view full details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
