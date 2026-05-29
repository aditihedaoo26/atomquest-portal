import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getGoalsByEmployee, updateGoal } from "../../firebase/db";

export default function WeightManager({ refresh }) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getGoalsByEmployee(currentUser.id);
      const editable = data.filter(g => !g.locked);
      setGoals(editable);
      const w = {};
      editable.forEach(g => { w[g.id] = parseFloat(g.weightage) || 10; });
      setWeights(w);
      setLoading(false);
    })();
  }, [refresh]);

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = Math.round(total) === 100;

  const updateWeight = (id, value) => {
    setWeights(prev => ({ ...prev, [id]: Math.max(10, Math.min(100, parseFloat(value) || 10)) }));
  };

  const autoBalance = () => {
    const equal = Math.floor(100 / goals.length);
    const remainder = 100 - (equal * goals.length);
    const newW = {};
    goals.forEach((g, i) => { newW[g.id] = equal + (i === 0 ? remainder : 0); });
    setWeights(newW);
  };

  const saveWeights = async () => {
    if (!isValid) return;
    setSaving(true);
    for (const goal of goals) {
      await updateGoal(goal.id, { weightage: weights[goal.id] });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const COLORS = ["#F5C500", "#0EA5E9", "#8B5CF6", "#10B981", "#F97316", "#EF4444", "#06B6D4", "#84CC16"];

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>Loading...</div>;

  if (goals.length === 0) return (
    <div style={{ textAlign: "center", padding: "4rem", background: "#fff", border: "1.5px dashed #EBEBEB", borderRadius: "12px", color: "#999" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚖️</div>
      No unlocked goals to rebalance.
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Goal Weight Manager</h2>
          <p style={{ fontSize: "0.8rem", color: "#777", marginTop: "0.25rem" }}>
            Adjust how much each goal contributes to your overall score. Total must equal 100%.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
          <button className="btn btn-outline" onClick={autoBalance} style={{ fontSize: "0.78rem" }}>
            ⚖ Auto-Balance
          </button>
          <div style={{ background: isValid ? "#DCFCE7" : "#FEE2E2", border: `2px solid ${isValid ? "#BBF7D0" : "#FECACA"}`, borderRadius: "10px", padding: "0.65rem 1.25rem", textAlign: "center", minWidth: "100px" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: isValid ? "#15803D" : "#991B1B", letterSpacing: "-0.04em", lineHeight: 1 }}>{total.toFixed(0)}%</div>
            <div style={{ fontSize: "0.65rem", color: isValid ? "#15803D" : "#991B1B", fontWeight: 600 }}>{isValid ? "✓ Perfect" : total > 100 ? "Over 100%" : `${(100 - total).toFixed(0)}% remaining`}</div>
          </div>
        </div>
      </div>

      {/* Stacked bar visualization */}
      <div style={{ background: "#fff", border: "1.5px solid #EBEBEB", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Weight Distribution</div>
        <div style={{ display: "flex", height: "28px", borderRadius: "6px", overflow: "hidden", gap: "2px", marginBottom: "0.75rem" }}>
          {goals.map((g, i) => (
            <div key={g.id} style={{ flex: weights[g.id] || 0, background: COLORS[i % COLORS.length], transition: "flex 0.4s ease", minWidth: weights[g.id] > 0 ? "2px" : 0 }} title={`${g.title}: ${weights[g.id]}%`} />
          ))}
          {total < 100 && <div style={{ flex: 100 - total, background: "#F0F0F0" }} />}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {goals.map((g, i) => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "#555" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: COLORS[i % COLORS.length] }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{g.title}</span>
              <span style={{ fontWeight: 700, color: "#111" }}>{weights[g.id]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {goals.map((g, i) => (
          <div key={g.id} style={{ background: "#fff", border: "1.5px solid #EBEBEB", borderRadius: "10px", padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#111" }}>{g.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button onClick={() => updateWeight(g.id, weights[g.id] - 5)} style={{ width: "24px", height: "24px", background: "#F5F5F5", border: "1px solid #E5E5E5", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>−</button>
                <input type="number" value={weights[g.id]} min={10} max={100}
                  onChange={e => updateWeight(g.id, e.target.value)}
                  style={{ width: "56px", textAlign: "center", border: "1.5px solid #E5E5E5", borderRadius: "6px", padding: "0.25rem", fontSize: "0.85rem", fontWeight: 700, fontFamily: "'Sora',sans-serif" }} />
                <span style={{ fontSize: "0.8rem", color: "#555" }}>%</span>
                <button onClick={() => updateWeight(g.id, weights[g.id] + 5)} style={{ width: "24px", height: "24px", background: "#F5F5F5", border: "1px solid #E5E5E5", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>+</button>
              </div>
            </div>
            <input type="range" min={10} max={80} value={weights[g.id]}
              onChange={e => updateWeight(g.id, e.target.value)}
              style={{ width: "100%", accentColor: COLORS[i % COLORS.length], cursor: "pointer" }} />
            <div style={{ fontSize: "0.7rem", color: "#AAA", marginTop: "0.2rem" }}>{g.thrustArea} · min 10%</div>
          </div>
        ))}
      </div>

      {saved && <div style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: "8px", padding: "0.75rem", marginTop: "1rem", color: "#15803D", fontSize: "0.82rem", textAlign: "center" }}>✅ Weights saved!</div>}

      <div style={{ display: "flex", gap: "0.65rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <button className="btn btn-outline" onClick={autoBalance}>Reset to Equal</button>
        <button className="btn btn-primary" onClick={saveWeights} disabled={!isValid || saving}
          style={{ background: isValid ? "#111" : "#EEE", color: isValid ? "#F5C500" : "#AAA" }}>
          {saving ? "Saving..." : "Save Weights →"}
        </button>
      </div>
    </div>
  );
}
