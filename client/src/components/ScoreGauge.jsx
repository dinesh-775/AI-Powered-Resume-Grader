const GRADE_COLORS = {
  O: "#16a34a",
  A: "#22c55e",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

export default function ScoreGauge({ score = 0, grade = "F", size = 160 }) {
  const stroke = 12;
  const radius = size / 2;
  const normalized = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalized;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circumference - (pct / 100) * circumference;
  const color = GRADE_COLORS[grade] || "#6366f1";

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={radius} cy={radius} r={normalized} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle
          cx={radius}
          cy={radius}
          r={normalized}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${radius} ${radius})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="50%" y="46%" textAnchor="middle" className="fill-white" style={{ fontSize: size * 0.26, fontWeight: 800 }}>
          {pct}
        </text>
        <text x="50%" y="62%" textAnchor="middle" className="fill-slate-500" style={{ fontSize: size * 0.1 }}>
          / 100
        </text>
      </svg>
      <span
        className="mt-2 px-4 py-1 rounded-full text-white text-sm font-bold"
        style={{ background: color }}
      >
        Grade {grade}
      </span>
    </div>
  );
}
