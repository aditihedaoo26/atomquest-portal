import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { getAllGoals } from "../../firebase/db";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { addAuditLog } from "../../firebase/db";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_CYCLES = [
  { id: "goal_setting", label: "Goal Setting", period: "01 May – 31 May 2024", status: "completed", description: "Employees create and submit goals" },
  { id: "q1", label: "Q1 Check-in", period: "01 Jul – 31 Jul 2024", status: "completed", description: "First quarterly progress review" },
  { id: "q2", label: "Q2 Check-in", period: "01 Oct – 31 Dec 2024", status: "active", description: "Mid-year progress review" },
  { id: "q3", label: "Q3 Check-in", period: "01 Jan – 31 Jan 2025", status: "upcoming", description: "Third quarter review" },
  { id: "q4", label: "Q4 / Annual", period: "01 Mar – 30 Apr 2025", status: "upcoming", description: "Annual appraisal and wrap-up" },
];

const statusConfig = {
  completed: { label: "Completed", color: "#15803D", bg: "#DCFCE7", border: "#BBF7D0" },
  active: { label: "Active", color: "#111", bg: "#F5C500", border: "#F5C500" },
  upcoming: { label: "Upcoming", color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" },
  locked: { label: "Locked", color: "#991B1B", bg: "#FEE2E2", border: "#FECACA" },
};

export default function CycleManager() {
  const { currentUser } = useAuth();
  const [cycles, setCycles] = useState(DEFAULT_CYCLES);
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "cycles"));
        if (snap.exists()) setCycles(snap.data().cycles || DEFAULT_CYCLES);
      } catch(e) {}
    })();
  }, []);

  const updateStatus = async (cycleId, newStatus) => {
    setSaving(cycleId);
    const updated = cycles.map(c => c.id === cycleId ? { ...c, status: newStatus } : c);
    setCycles(updated);
    try {
      await setDoc(doc(db, "config", "cycles"), { cycles: updated });
      await addAuditLog({
        user: currentUser.name, role: "admin",
        action: `Changed cycle status: ${cycleId} → ${newStatus}`,
        detail: `Cycle management update`,
      });
      setMsg({ type: "success", text: `${cycleId} status updated to ${newStatus}` });
    } catch(e) {
      setMsg({ type: "error", text: "Failed to save. Check Firebase connection." });
    }
    setSaving(null);
    setTimeout(() => setMsg(null), 3000);
  };

  const activeCycle = cycles.find(c => c.status === "active");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Cycle Management</h2>
          <p style={{ fontSize: "0.8rem", color: "#777", marginTop: "0.25rem" }}>
            Control which quarter is open for check-ins. Only one cycle can be active at a time.
          </p>
        </div>
        {activeCycle && (
          <div style={{ background: "#F5C500", borderRadius: "8px", padding: "0.6rem 1rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#111" }}>CURRENT ACTIVE</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111" }}>{activeCycle.label}</div>
          </div>
        )}
      </div>

      {msg && (
        <div style={{ background: msg.type === "success" ? "#DCFCE7" : "#FEE2E2", border: `1px solid ${msg.type === "success" ? "#BBF7D0" : "#FECACA"}`, borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", color: msg.type === "success" ? "#15803D" : "#991B1B", fontSize: "0.82rem" }}>
          {msg.type === "success" ? "✅" : "⚠"} {msg.text}
        </div>
      )}

      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0", position: "relative" }}>
        {cycles.map((cycle, i) => {
          const s = statusConfig[cycle.status];
          const isLast = i === cycles.length - 1;
          return (
            <div key={cycle.id} style={{ display: "flex", gap: "1rem", paddingBottom: isLast ? 0 : "0" }}>
              {/* Timeline line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "24px", flexShrink: 0 }}>
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: s.bg, border: `2px solid ${s.border}`, flexShrink: 0, marginTop: "1.25rem", zIndex: 1 }} />
                {!isLast && <div style={{ width: "2px", flex: 1, background: "#F0F0F0", minHeight: "24px" }} />}
              </div>

              {/* Card */}
              <div style={{ flex: 1, background: "#fff", border: `1.5px solid ${cycle.status === "active" ? "#F5C500" : "#EBEBEB"}`, borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "0.75rem", boxShadow: cycle.status === "active" ? "0 4px 12px rgba(245,197,0,0.15)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>{cycle.label}</span>
                      <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "4px", padding: "0.15rem 0.5rem", fontSize: "0.65rem", fontWeight: 700 }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: "0.2rem" }}>{cycle.period}</div>
                    <div style={{ fontSize: "0.78rem", color: "#555" }}>{cycle.description}</div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, marginLeft: "1rem" }}>
                    {cycle.status !== "active" && cycle.status !== "completed" && (
                      <button className="btn btn-yellow" onClick={() => updateStatus(cycle.id, "active")}
                        disabled={saving === cycle.id}
                        style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}>
                        {saving === cycle.id ? "..." : "▶ Activate"}
                      </button>
                    )}
                    {cycle.status === "active" && (
                      <button className="btn btn-success" onClick={() => updateStatus(cycle.id, "completed")}
                        disabled={saving === cycle.id}
                        style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}>
                        {saving === cycle.id ? "..." : "✓ Close"}
                      </button>
                    )}
                    {cycle.status !== "locked" && (
                      <button className="btn btn-danger" onClick={() => updateStatus(cycle.id, "locked")}
                        disabled={saving === cycle.id}
                        style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}>
                        🔒
                      </button>
                    )}
                    {cycle.status === "locked" && (
                      <button className="btn btn-outline" onClick={() => updateStatus(cycle.id, "upcoming")}
                        disabled={saving === cycle.id}
                        style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}>
                        🔓
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
