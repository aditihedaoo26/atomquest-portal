import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getGoalsByEmployee, updateGoal } from "../../firebase/db";

export default function Initiatives({ refresh }) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [newItem, setNewItem] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getGoalsByEmployee(currentUser.id);
      setGoals(data.filter(g => g.submissionStatus === "approved"));
      setLoading(false);
    })();
  }, [refresh]);

  const addInitiative = async (goal) => {
    const text = newItem[goal.id]?.trim();
    if (!text) return;
    setSaving(goal.id);
    const current = goal.initiatives || [];
    const updated = [...current, { id: Date.now(), text, done: false, createdAt: new Date().toISOString() }];
    await updateGoal(goal.id, { initiatives: updated });
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, initiatives: updated } : g));
    setNewItem(prev => ({ ...prev, [goal.id]: "" }));
    setSaving(null);
  };

  const toggleDone = async (goal, itemId) => {
    const updated = (goal.initiatives || []).map(i => i.id === itemId ? { ...i, done: !i.done } : i);
    await updateGoal(goal.id, { initiatives: updated });
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, initiatives: updated } : g));
  };

  const deleteInitiative = async (goal, itemId) => {
    const updated = (goal.initiatives || []).filter(i => i.id !== itemId);
    await updateGoal(goal.id, { initiatives: updated });
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, initiatives: updated } : g));
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Initiatives & Action Items</h2>
        <p style={{ fontSize: "0.8rem", color: "#777", marginTop: "0.25rem" }}>
          Break each goal into concrete action steps. Track what you're actually doing to hit your targets.
        </p>
      </div>

      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "#fff", border: "1.5px dashed #EBEBEB", borderRadius: "12px", color: "#999" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚡</div>
          No approved goals yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {goals.map(goal => {
            const items = goal.initiatives || [];
            const done = items.filter(i => i.done).length;
            const pct = items.length ? Math.round((done / items.length) * 100) : 0;
            const isOpen = expanded[goal.id] !== false;

            return (
              <div key={goal.id} style={{ background: "#fff", border: "1.5px solid #EBEBEB", borderRadius: "10px", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: isOpen ? "1px solid #F0F0F0" : "none" }}
                  onClick={() => setExpanded(e => ({ ...e, [goal.id]: !isOpen }))}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111" }}>{goal.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem" }}>
                      <div style={{ flex: 1, maxWidth: "160px", height: "5px", background: "#F0F0F0", borderRadius: "999px" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#22C55E" : "#F5C500", borderRadius: "999px", transition: "width 0.4s" }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "#777" }}>{done}/{items.length} actions done</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {pct === 100 && <span style={{ fontSize: "0.72rem", background: "#DCFCE7", color: "#15803D", borderRadius: "4px", padding: "0.15rem 0.5rem", fontWeight: 700 }}>✓ All Done</span>}
                    <span style={{ color: "#CCC" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: "1rem 1.25rem" }}>
                    {/* Initiative list */}
                    {items.length === 0 ? (
                      <div style={{ fontSize: "0.8rem", color: "#CCC", textAlign: "center", padding: "1rem", fontStyle: "italic" }}>
                        No actions yet. Add your first initiative below.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.85rem" }}>
                        {items.map(item => (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.5rem 0.65rem", background: item.done ? "#F9FFF9" : "#FAFAFA", borderRadius: "6px", border: `1px solid ${item.done ? "#BBF7D0" : "#F0F0F0"}` }}>
                            <input type="checkbox" checked={item.done} onChange={() => toggleDone(goal, item.id)}
                              style={{ width: "15px", height: "15px", accentColor: "#F5C500", cursor: "pointer", flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: "0.82rem", color: item.done ? "#AAA" : "#333", textDecoration: item.done ? "line-through" : "none" }}>
                              {item.text}
                            </span>
                            <button onClick={() => deleteInitiative(goal, item.id)}
                              style={{ background: "none", border: "none", color: "#DDD", cursor: "pointer", fontSize: "0.8rem", padding: "0.1rem 0.25rem" }}
                              onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                              onMouseLeave={e => e.currentTarget.style.color = "#DDD"}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new */}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input className="form-input" style={{ flex: 1 }}
                        placeholder="Add an action item... (e.g. Schedule weekly customer calls)"
                        value={newItem[goal.id] || ""}
                        onChange={e => setNewItem(prev => ({ ...prev, [goal.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addInitiative(goal)}
                      />
                      <button className="btn btn-primary" onClick={() => addInitiative(goal)}
                        disabled={saving === goal.id || !newItem[goal.id]?.trim()}
                        style={{ background: "#111", color: "#F5C500", whiteSpace: "nowrap" }}>
                        + Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
