import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getGoalsByEmployee, updateGoal, addAuditLog } from "../../firebase/db";
import { computeScore, getScoreColor, getScoreLabel, formatDate } from "../../utils/helpers";
import ConfidencePicker from "../shared/ConfidencePicker";

const statusConfig = {
  draft:    { label:"Draft",            bg:"#F3F4F6", color:"#6B7280", border:"#E5E7EB" },
  pending:  { label:"Pending Approval", bg:"#FEF9C3", color:"#854D0E", border:"#FDE68A" },
  approved: { label:"Approved",         bg:"#DCFCE7", color:"#15803D", border:"#BBF7D0" },
  rejected: { label:"Rejected",         bg:"#FEE2E2", color:"#991B1B", border:"#FECACA" },
};

export default function GoalList({ refresh }) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCheckin, setEditingCheckin] = useState(null);
  const [achievement, setAchievement] = useState("");
  const [checkStatus, setCheckStatus] = useState("not_started");
  const [confidence, setConfidence] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const loadTimeout = setTimeout(() => setLoading(false), 3000);
    const data = await getGoalsByEmployee(currentUser.id);
    setGoals(data);
    clearTimeout(loadTimeout);
      setLoading(false);
  };

  useEffect(() => { load(); }, [refresh]);

  const openCheckin = (goal) => {
    setEditingCheckin(goal.id);
    setAchievement(goal.achievement || "");
    setCheckStatus(goal.checkInStatus || "not_started");
    setConfidence(goal.confidence || "medium");
  };

  const saveCheckin = async (goal) => {
    setSaving(true);
    await updateGoal(goal.id, { achievement, checkInStatus: checkStatus, confidence });
    await addAuditLog({
      user: currentUser.name, role: "employee",
      action: "Updated quarterly achievement",
      detail: `Goal: "${goal.title}" | Achievement: ${achievement} | Confidence: ${confidence}`,
    });
    setEditingCheckin(null);
    setSaving(false);
    load();
  };

  const filtered = filter === "all" ? goals : goals.filter(g => g.submissionStatus === filter);
  const counts = { all: goals.length, draft: goals.filter(g=>g.submissionStatus==="draft").length, pending: goals.filter(g=>g.submissionStatus==="pending").length, approved: goals.filter(g=>g.submissionStatus==="approved").length };

  if (loading) return <div style={{textAlign:"center",padding:"4rem",color:"#999",fontSize:"0.85rem"}}>Loading goals...</div>;

  if (!goals.length) return (
    <div style={{textAlign:"center",padding:"4rem",background:"#fff",border:"1.5px dashed #EBEBEB",borderRadius:"12px"}}>
      <div style={{fontSize:"3rem",marginBottom:"1rem"}}>🎯</div>
      <div style={{color:"#999",fontSize:"0.9rem"}}>No goals yet. Create your first goal sheet!</div>
    </div>
  );

  return (
    <div>
      {/* Header + filter */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
        <h2 style={{fontSize:"1.1rem",fontWeight:700,margin:0}}>My Goals</h2>
        <div style={{display:"flex",gap:"0.5rem"}}>
          {[
            {key:"all",label:`All (${counts.all})`},
            {key:"pending",label:`Pending (${counts.pending})`},
            {key:"approved",label:`Approved (${counts.approved})`},
            {key:"draft",label:`Draft (${counts.draft})`},
          ].map(f => (
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{
              background: filter===f.key ? "#111" : "#fff",
              color: filter===f.key ? "#F5C500" : "#777",
              border: `1.5px solid ${filter===f.key ? "#111" : "#E5E5E5"}`,
              borderRadius:"6px", padding:"0.35rem 0.75rem",
              cursor:"pointer", fontSize:"0.75rem", fontWeight:700,
              fontFamily:"'Sora',sans-serif",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"0.85rem"}}>
        {filtered.map(goal => {
          const s = statusConfig[goal.submissionStatus] || statusConfig.draft;
          const score = computeScore(goal.uom, goal.target, goal.achievement);
          const isApproved = goal.submissionStatus === "approved";
          const isEditing = editingCheckin === goal.id;
          const confColors = { high:"#15803D", medium:"#854D0E", low:"#991B1B" };
          const confEmoji = { high:"🟢", medium:"🟡", low:"🔴" };

          return (
            <div key={goal.id} style={{
              background:"#fff",
              border:`1.5px solid ${isEditing?"#F5C500":"#EBEBEB"}`,
              borderRadius:"10px", overflow:"hidden",
              transition:"border-color 0.2s",
            }}>
              {/* Goal row */}
              <div style={{padding:"1rem 1.25rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.65rem",marginBottom:"0.3rem"}}>
                    <span style={{fontWeight:700,fontSize:"0.9rem",color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{goal.title}</span>
                    {goal.locked && <span style={{fontSize:"0.65rem",background:"#F0F0F0",color:"#777",borderRadius:"4px",padding:"0.1rem 0.4rem",flexShrink:0}}>🔒 Locked</span>}
                    {goal.confidence && <span title={`Confidence: ${goal.confidence}`} style={{flexShrink:0}}>{confEmoji[goal.confidence]}</span>}
                  </div>
                  <div style={{fontSize:"0.75rem",color:"#999"}}>
                    {goal.thrustArea} · {goal.uom?.toUpperCase()} · Weight: {goal.weightage}%
                    {goal.selfRating && <span style={{marginLeft:"0.5rem",color:"#555"}}>· Self-rated: {goal.selfRating}/5</span>}
                  </div>
                </div>

                <div style={{display:"flex",alignItems:"center",gap:"0.65rem",flexShrink:0,marginLeft:"1rem"}}>
                  <span style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`,borderRadius:"4px",padding:"0.2rem 0.6rem",fontSize:"0.68rem",fontWeight:700,textTransform:"uppercase"}}>
                    {s.label}
                  </span>
                  {isApproved && !isEditing && (
                    <button onClick={()=>openCheckin(goal)} style={{
                      background:"#F5C500",color:"#111",border:"none",
                      borderRadius:"6px",padding:"0.35rem 0.75rem",
                      cursor:"pointer",fontSize:"0.75rem",fontWeight:700,
                      fontFamily:"'Sora',sans-serif",
                    }}>
                      Log Achievement
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar (if achievement logged) */}
              {goal.achievement && !isEditing && (
                <div style={{padding:"0.65rem 1.25rem",background:"#FAFAFA",borderTop:"1px solid #F5F5F5"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.35rem"}}>
                    <span style={{fontSize:"0.75rem",color:"#777"}}>
                      Achievement: <strong style={{color:"#111"}}>{goal.achievement}</strong> / Target: {goal.target}
                    </span>
                    <span style={{fontSize:"0.78rem",fontWeight:700,color:getScoreColor(score)}}>
                      {score.toFixed(0)}% — {getScoreLabel(score)}
                    </span>
                  </div>
                  <div className="prog-bar" style={{width:"100%"}}>
                    <div className="prog-fill" style={{width:`${Math.min(score,100)}%`,background:getScoreColor(score)}} />
                  </div>
                </div>
              )}

              {/* Check-in editor */}
              {isEditing && (
                <div style={{padding:"1.25rem",background:"#FFFBF0",borderTop:"1px solid #FDE68A"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.85rem",marginBottom:"1rem"}}>
                    <div>
                      <label className="form-label">Actual Achievement</label>
                      <input className="form-input" type="number" placeholder={`Target: ${goal.target}`}
                        value={achievement} onChange={e=>setAchievement(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Check-in Status</label>
                      <select className="form-input" value={checkStatus} onChange={e=>setCheckStatus(e.target.value)}>
                        <option value="not_started">Not Started</option>
                        <option value="on_track">On Track</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <ConfidencePicker value={confidence} onChange={setConfidence} />
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"0.65rem",justifyContent:"flex-end"}}>
                    <button className="btn btn-outline" onClick={()=>setEditingCheckin(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={()=>saveCheckin(goal)} disabled={saving}
                      style={{background:"#111",color:"#F5C500"}}>
                      {saving?"Saving...":"Save Achievement →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
