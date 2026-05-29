import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getGoalsByEmployee, updateGoal, addAuditLog } from "../../firebase/db";
import { computeScore } from "../../utils/helpers";
import ConfidencePicker from "../shared/ConfidencePicker";

const RATING_SCALE = [
  { value: 5, label: "Exceptional", color: "#15803D", bg: "#DCFCE7" },
  { value: 4, label: "Exceeds", color: "#0369A1", bg: "#DBEAFE" },
  { value: 3, label: "Meets", color: "#854D0E", bg: "#FEF9C3" },
  { value: 2, label: "Partial", color: "#9A3412", bg: "#FFEDD5" },
  { value: 1, label: "Below", color: "#991B1B", bg: "#FEE2E2" },
];

export default function SelfAssessment({ refresh }) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [assessments, setAssessments] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getGoalsByEmployee(currentUser.id);
      const approved = data.filter(g => g.submissionStatus === "approved");
      setGoals(approved);
      // Pre-fill existing
      const existing = {};
      approved.forEach(g => {
        existing[g.id] = {
          selfRating: g.selfRating || 3,
          selfComment: g.selfComment || "",
          confidence: g.confidence || "medium",
        };
      });
      setAssessments(existing);
      setLoading(false);
    })();
  }, [refresh]);

  const update = (goalId, field, value) => {
    setAssessments(prev => ({ ...prev, [goalId]: { ...prev[goalId], [field]: value } }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    for (const goal of goals) {
      const a = assessments[goal.id] || {};
      await updateGoal(goal.id, {
        selfRating: a.selfRating,
        selfComment: a.selfComment,
        confidence: a.confidence,
        selfAssessedAt: new Date().toISOString(),
      });
    }
    await addAuditLog({
      user: currentUser.name, role: "employee",
      action: "Submitted self-assessment",
      detail: `Assessed ${goals.length} goals`,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const overallRating = goals.length
    ? (Object.values(assessments).reduce((s, a) => s + (a.selfRating || 3), 0) / goals.length).toFixed(1)
    : 0;

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>Loading...</div>;

  if (goals.length === 0) return (
    <div style={{ textAlign: "center", padding: "4rem", background: "#fff", border: "1.5px dashed #EBEBEB", borderRadius: "12px", color: "#999" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📝</div>
      No approved goals to assess yet.
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Self Assessment</h2>
          <p style={{ fontSize: "0.8rem", color: "#777", marginTop: "0.25rem" }}>
            Rate yourself on each goal before your manager reviews. Be honest — this builds trust.
          </p>
        </div>
        <div style={{ background: "#fff", border: "1.5px solid #EBEBEB", borderRadius: "10px", padding: "0.85rem 1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#999", textTransform: "uppercase", marginBottom: "0.25rem" }}>Overall Rating</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#111" }}>{overallRating}<span style={{ fontSize: "1rem", color: "#999" }}>/5</span></div>
        </div>
      </div>

      {saved && (
        <div style={{ background: "#DCFCE7", border: "1px solid #BBF7D0", borderRadius: "8px", padding: "0.85rem", marginBottom: "1.25rem", color: "#15803D", fontSize: "0.85rem", textAlign: "center" }}>
          ✅ Self-assessment saved! Your manager can now review it.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {goals.map(goal => {
          const a = assessments[goal.id] || {};
          const score = computeScore(goal.uom, goal.target, goal.achievement);
          const rating = RATING_SCALE.find(r => r.value === a.selfRating) || RATING_SCALE[2];

          return (
            <div key={goal.id} style={{ background: "#fff", border: "1.5px solid #EBEBEB", borderRadius: "10px", padding: "1.5rem" }}>
              {/* Goal title */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111" }}>{goal.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "#999", marginTop: "0.2rem" }}>
                    Target: {goal.target} · Achievement: {goal.achievement || "—"} · Progress: {goal.achievement ? score.toFixed(0) + "%" : "Not logged"}
                  </div>
                </div>
                <div style={{ background: rating.bg, color: rating.color, borderRadius: "6px", padding: "0.3rem 0.75rem", fontSize: "0.78rem", fontWeight: 700 }}>
                  {rating.label}
                </div>
              </div>

              {/* Rating scale */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#777", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                  Self Rating
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {RATING_SCALE.map(r => (
                    <button key={r.value} onClick={() => update(goal.id, "selfRating", r.value)}
                      style={{
                        flex: 1, padding: "0.6rem 0.25rem",
                        background: a.selfRating === r.value ? r.bg : "#FAFAFA",
                        border: `1.5px solid ${a.selfRating === r.value ? r.color + "55" : "#E5E5E5"}`,
                        borderRadius: "6px", cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                      }}>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: a.selfRating === r.value ? r.color : "#CCC" }}>{r.value}</div>
                      <div style={{ fontSize: "0.65rem", color: a.selfRating === r.value ? r.color : "#AAA", fontWeight: 600 }}>{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence */}
              <div style={{ marginBottom: "1.25rem" }}>
                <ConfidencePicker value={a.confidence} onChange={v => update(goal.id, "confidence", v)} />
              </div>

              {/* Comment */}
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#777", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                  Your Comments
                </div>
                <textarea
                  className="form-input" rows={2}
                  placeholder="What went well? What were the blockers? What will you do differently?"
                  value={a.selfComment || ""}
                  onChange={e => update(goal.id, "selfComment", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}
          style={{ background: "#111", color: "#F5C500" }}>
          {saving ? "Saving..." : "Submit Self-Assessment →"}
        </button>
      </div>
    </div>
  );
}
