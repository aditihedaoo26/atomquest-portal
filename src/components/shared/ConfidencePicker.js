import React from "react";

const levels = [
  { value: "high", label: "High", emoji: "🟢", color: "#15803D", bg: "#DCFCE7", border: "#BBF7D0", desc: "On track, no blockers" },
  { value: "medium", label: "Medium", emoji: "🟡", color: "#854D0E", bg: "#FEF9C3", border: "#FDE68A", desc: "Some risks, manageable" },
  { value: "low", label: "Low", emoji: "🔴", color: "#991B1B", bg: "#FEE2E2", border: "#FECACA", desc: "At risk, need help" },
];

export default function ConfidencePicker({ value, onChange, compact = false }) {
  if (compact) {
    const current = levels.find(l => l.value === value) || levels[1];
    return (
      <div style={{ display: "flex", gap: "0.35rem" }}>
        {levels.map(l => (
          <button key={l.value} onClick={() => onChange(l.value)}
            title={l.desc}
            style={{
              background: value === l.value ? l.bg : "#F5F5F5",
              border: `1.5px solid ${value === l.value ? l.border : "#E5E5E5"}`,
              borderRadius: "6px", padding: "0.25rem 0.5rem",
              cursor: "pointer", fontSize: "0.75rem", fontFamily: "'Sora',sans-serif",
              color: value === l.value ? l.color : "#999",
              fontWeight: value === l.value ? 700 : 400,
              transition: "all 0.15s",
            }}>
            {l.emoji} {l.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#777", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
        Confidence Level
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {levels.map(l => (
          <button key={l.value} onClick={() => onChange(l.value)}
            style={{
              flex: 1, background: value === l.value ? l.bg : "#FAFAFA",
              border: `1.5px solid ${value === l.value ? l.border : "#E5E5E5"}`,
              borderRadius: "8px", padding: "0.65rem 0.5rem",
              cursor: "pointer", textAlign: "center", transition: "all 0.15s",
            }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>{l.emoji}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: value === l.value ? l.color : "#555" }}>{l.label}</div>
            <div style={{ fontSize: "0.65rem", color: "#999", marginTop: "0.15rem" }}>{l.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { levels as confidenceLevels };
