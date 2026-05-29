import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listenGoalsByEmployee, updateGoal, addAuditLog, addNotification } from "../../firebase/db";
import { GOAL_STATUS, STATUS_META, computeScore, computeAnnualScore, getScoreColor, getScoreLabel, UOM_OPTIONS } from "../../utils/helpers";
import ConfidencePicker from "../shared/ConfidencePicker";
import { useCycleWindow } from "../../hooks/useCycleWindow";

function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:"4px",
      background:m.bg, color:m.color,
      border:`1px solid ${m.border}`,
      borderRadius:"4px", padding:"2px 8px",
      fontSize:"10px", fontWeight:700,
      textTransform:"uppercase", letterSpacing:"0.05em",
      whiteSpace:"nowrap",
    }}>
      {m.label}
    </span>
  );
}

function GoalCard({ goal, onCheckIn, onResubmit, canLogCheckIn }) {
  const [expanded, setExpanded] = useState(false);
  const score = computeScore(goal.uom, goal.target, goal.achievement);
  const scoreColor = getScoreColor(score);
  const isApproved = goal.submissionStatus === GOAL_STATUS.APPROVED;
  const needsChanges = goal.submissionStatus === GOAL_STATUS.CHANGES_NEEDED;
  const uomLabel = UOM_OPTIONS.find(u => u.value === goal.uom)?.label || goal.uom;

  return (
    <div style={{
      background:"#fff", border:"1.5px solid",
      borderColor: needsChanges ? "#FECACA" : isApproved && goal.achievement ? "#BBF7D0" : "#E5E5E5",
      borderRadius:"8px", overflow:"hidden",
      boxShadow:"0 1px 3px rgba(0,0,0,0.05)",
      transition:"box-shadow 0.15s",
    }}>
      {/* Changes needed banner */}
      {needsChanges && (
        <div style={{
          background:"#FEF2F2", borderBottom:"1px solid #FECACA",
          padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <span style={{ fontSize:"13px" }}>⚠️</span>
            <div>
              <div style={{ fontSize:"11px", fontWeight:700, color:"#DC2626" }}>Manager requested changes</div>
              {goal.managerComment && (
                <div style={{ fontSize:"11px", color:"#991B1B", marginTop:"1px" }}>"{goal.managerComment}"</div>
              )}
            </div>
          </div>
          <button onClick={() => onResubmit(goal)}
            style={{ background:"#DC2626", color:"#fff", border:"none", borderRadius:"5px", padding:"5px 12px", cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
            Edit & Resubmit →
          </button>
        </div>
      )}

      {/* Main row */}
      <div style={{ padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}
        onClick={() => setExpanded(e => !e)}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
            <span style={{ fontWeight:600, fontSize:"13px", color:"#111", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{goal.title}</span>
            {goal.locked && <span style={{ fontSize:"9px", color:"#777", background:"#F5F5F5", borderRadius:"3px", padding:"1px 5px", flexShrink:0 }}>🔒 Locked</span>}
          </div>
          <div style={{ display:"flex", gap:"10px", fontSize:"11px", color:"#AAA" }}>
            <span>{goal.thrustArea}</span>
            <span>·</span>
            <span>{uomLabel.split("—")[0].trim()}</span>
            <span>·</span>
            <span>Weight: {goal.weightage}%</span>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0, marginLeft:"12px" }}>
          {goal.achievement && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"14px", fontWeight:800, color:scoreColor, letterSpacing:"-0.03em" }}>{score.toFixed(0)}%</div>
              <div style={{ fontSize:"9.5px", color:scoreColor, fontWeight:600 }}>{getScoreLabel(score)}</div>
            </div>
          )}
          <StatusPill status={goal.submissionStatus} />
          {isApproved && !goal.achievement && canLogCheckIn && (
            <button onClick={e => { e.stopPropagation(); onCheckIn(goal); }}
              style={{ background:"#FFC400", color:"#111", border:"none", borderRadius:"5px", padding:"5px 10px", cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap" }}>
              Log
            </button>
          )}
          {isApproved && goal.achievement && canLogCheckIn && (
            <button onClick={e => { e.stopPropagation(); onCheckIn(goal); }}
              style={{ background:"#F5F5F5", color:"#555", border:"1px solid #E5E5E5", borderRadius:"5px", padding:"5px 10px", cursor:"pointer", fontSize:"11px", fontWeight:600, fontFamily:"'Inter',sans-serif" }}>
              Update
            </button>
          )}
          <span style={{ color:"#CCC", fontSize:"11px" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Progress bar */}
      {goal.achievement && (
        <div style={{ padding:"0 14px 10px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10.5px", color:"#AAA", marginBottom:"4px" }}>
            <span>Achievement: <strong style={{color:"#111"}}>{goal.achievement}</strong> / Target: {goal.target}</span>
            {goal.confidence && (
              <span style={{ color: goal.confidence==="high"?"#16A34A":goal.confidence==="low"?"#DC2626":"#D97706", fontWeight:600 }}>
                {goal.confidence==="high"?"🟢":goal.confidence==="low"?"🔴":"🟡"} {goal.confidence} confidence
              </span>
            )}
          </div>
          <div style={{ height:"4px", background:"#F0F0F0", borderRadius:"99px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.min(score,100)}%`, background:scoreColor, borderRadius:"99px", transition:"width 0.7s" }} />
          </div>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop:"1px solid #F5F5F5", padding:"12px 14px", background:"#FAFAFA" }}>
          {goal.description && <p style={{ fontSize:"12px", color:"#555", marginBottom:"8px", lineHeight:1.5 }}>{goal.description}</p>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
            {[
              { label:"Target",       value:goal.target },
              { label:"Achievement",  value:goal.achievement || "—" },
              { label:"Weightage",    value:`${goal.weightage}%` },
            ].map(item => (
              <div key={item.label} style={{ background:"#fff", border:"1px solid #E5E5E5", borderRadius:"6px", padding:"8px 10px" }}>
                <div style={{ fontSize:"9px", fontWeight:700, color:"#AAA", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"3px" }}>{item.label}</div>
                <div style={{ fontSize:"13px", fontWeight:700, color:"#111", fontFamily:"'JetBrains Mono',monospace" }}>{item.value}</div>
              </div>
            ))}
          </div>
          {goal.managerComment && goal.submissionStatus === GOAL_STATUS.APPROVED && (
            <div style={{ marginTop:"8px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:"6px", padding:"8px 10px" }}>
              <div style={{ fontSize:"9.5px", fontWeight:700, color:"#16A34A", textTransform:"uppercase", marginBottom:"2px" }}>Manager Note</div>
              <div style={{ fontSize:"11.5px", color:"#166534" }}>"{goal.managerComment}"</div>
            </div>
          )}
          {goal.selfRating && (
            <div style={{ marginTop:"8px", fontSize:"11px", color:"#777" }}>
              Self-rated: <strong style={{color:"#111"}}>{goal.selfRating}/5</strong>
              {goal.selfComment && <span> · "{goal.selfComment}"</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckInModal({ goal, onClose, onSave }) {
  const [achievement, setAchievement] = useState(goal.achievement || "");
  const [confidence, setConfidence] = useState(goal.confidence || "medium");
  const [comment, setComment] = useState(goal.employeeComment || "");
  const [saving, setSaving] = useState(false);
  const score = achievement ? computeScore(goal.uom, goal.target, achievement) : 0;

  const handleSave = async () => {
    setSaving(true);
    await onSave(goal, { achievement, confidence, employeeComment: comment });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:"#fff", borderRadius:"12px", width:"100%", maxWidth:"480px", overflow:"hidden", boxShadow:"0 20px 48px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ background:"#111", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"11px", fontWeight:700, color:"#FFC400", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"2px" }}>Q2 Check-in</div>
            <div style={{ fontSize:"14px", fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"340px" }}>{goal.title}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:"18px", lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:"20px" }}>
          {/* Target reminder */}
          <div style={{ background:"#F8F8F6", border:"1px solid #E5E5E5", borderRadius:"6px", padding:"10px 12px", marginBottom:"16px", display:"flex", gap:"16px" }}>
            <div><div style={{ fontSize:"9px", fontWeight:700, color:"#AAA", textTransform:"uppercase", marginBottom:"2px" }}>Target</div><div style={{ fontSize:"15px", fontWeight:800, color:"#111", fontFamily:"'JetBrains Mono',monospace" }}>{goal.target}</div></div>
            <div style={{ width:"1px", background:"#E5E5E5" }} />
            <div><div style={{ fontSize:"9px", fontWeight:700, color:"#AAA", textTransform:"uppercase", marginBottom:"2px" }}>UoM</div><div style={{ fontSize:"12px", fontWeight:600, color:"#555" }}>{UOM_OPTIONS.find(u=>u.value===goal.uom)?.label?.split("—")[0]?.trim()}</div></div>
            {achievement && <>
              <div style={{ width:"1px", background:"#E5E5E5" }} />
              <div><div style={{ fontSize:"9px", fontWeight:700, color:"#AAA", textTransform:"uppercase", marginBottom:"2px" }}>Score</div><div style={{ fontSize:"15px", fontWeight:800, color:getScoreColor(score), fontFamily:"'JetBrains Mono',monospace" }}>{score.toFixed(0)}%</div></div>
            </>}
          </div>

          {/* Achievement input */}
          <div className="form-group">
            <label className="form-label">Actual Achievement *</label>
            <input className="form-input" type="number" placeholder={`Target is ${goal.target}`}
              value={achievement} onChange={e => setAchievement(e.target.value)}
              style={{ fontSize:"16px", fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }} />
          </div>

          {/* Live score preview */}
          {achievement && (
            <div style={{ background: getScoreColor(score)+"11", border:`1px solid ${getScoreColor(score)}33`, borderRadius:"6px", padding:"8px 12px", marginBottom:"12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:"11.5px", color:"#555" }}>Current score for this goal</span>
              <span style={{ fontSize:"16px", fontWeight:900, color:getScoreColor(score), letterSpacing:"-0.03em" }}>{score.toFixed(0)}% — {getScoreLabel(score)}</span>
            </div>
          )}

          {/* Confidence */}
          <div style={{ marginBottom:"12px" }}>
            <ConfidencePicker value={confidence} onChange={setConfidence} />
          </div>

          {/* Comment */}
          <div className="form-group">
            <label className="form-label">Your Notes (optional)</label>
            <textarea className="form-input" rows={2} placeholder="What went well? Any blockers?"
              value={comment} onChange={e => setComment(e.target.value)} style={{ resize:"none" }} />
          </div>

          <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end", marginTop:"4px" }}>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !achievement}
              style={{ background:"#111", color:"#FFC400" }}>
              {saving ? "Saving..." : "Save Achievement →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoalLifecycle({ setActiveTab }) {
  const { currentUser } = useAuth();
  const { canLogCheckIn, activeLabel, activePeriod } = useCycleWindow();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInGoal, setCheckInGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const unsub = listenGoalsByEmployee(currentUser.id, (data) => {
      setGoals(data);
      setLoading(false);
    });
    const t = setTimeout(() => setLoading(false), 3000);
    return () => { unsub(); clearTimeout(t); };
  }, [currentUser.id]);

  const handleCheckIn = async (goal, data) => {
    await updateGoal(goal.id, {
      achievement: data.achievement,
      confidence: data.confidence,
      employeeComment: data.employeeComment,
      checkInStatus: "completed",
      checkInQ: "q2",
    });
    await addAuditLog({
      user: currentUser.name, role: "employee",
      action: "Logged quarterly achievement",
      detail: `"${goal.title}" — Achievement: ${data.achievement} (${computeScore(goal.uom,goal.target,data.achievement).toFixed(0)}%)`,
    });
  };

  const annualScore = computeAnnualScore(goals);
  const approved = goals.filter(g => g.submissionStatus === "approved");
  const pending = goals.filter(g => g.submissionStatus === "pending");
  const needsChanges = goals.filter(g => g.submissionStatus === "changes_needed");
  const withCheckIn = approved.filter(g => g.achievement);

  const FILTERS = [
    { key:"all",            label:`All (${goals.length})` },
    { key:"approved",       label:`Approved (${approved.length})` },
    { key:"changes_needed", label:`Changes Needed (${needsChanges.length})`, alert:needsChanges.length>0 },
    { key:"pending",        label:`Pending (${pending.length})` },
  ];

  const filtered = filter === "all" ? goals : goals.filter(g => g.submissionStatus === filter);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:"72px", borderRadius:"8px" }} />)}
    </div>
  );

  return (
    <div>
      {/* Annual score strip */}
      {approved.length > 0 && (
        <div style={{ background:"#111", borderRadius:"8px", padding:"14px 18px", marginBottom:"16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"9px", fontWeight:700, color:"#444", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"3px" }}>Annual Performance Score</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:"6px" }}>
              <span style={{ fontSize:"32px", fontWeight:900, color:"#FFC400", letterSpacing:"-0.06em", lineHeight:1 }}>{annualScore}</span>
              <span style={{ fontSize:"14px", color:"#555", fontWeight:600 }}>/100</span>
              <span style={{ fontSize:"11px", color: annualScore>=70?"#16A34A":annualScore>=50?"#D97706":"#DC2626", fontWeight:700, marginLeft:"4px" }}>
                {getScoreLabel(annualScore)}
              </span>
            </div>
            <div style={{ fontSize:"10px", color:"#555", marginTop:"2px" }}>Based on {withCheckIn.length} of {approved.length} goals with data</div>
          </div>
          <div style={{ display:"flex", gap:"16px" }}>
            {[
              { label:"Approved", value:approved.length, color:"#16A34A" },
              { label:"Check-ins", value:`${withCheckIn.length}/${approved.length}`, color:"#FFC400" },
              { label:"Changes Needed", value:needsChanges.length, color:needsChanges.length>0?"#DC2626":"#333" },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"18px", fontWeight:900, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
                <div style={{ fontSize:"9px", color:"#444", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts for changes needed */}
      {needsChanges.length > 0 && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"8px", padding:"10px 14px", marginBottom:"12px", display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"14px" }}>⚠️</span>
          <div style={{ fontSize:"12px", color:"#991B1B" }}>
            <strong>{needsChanges.length} goal{needsChanges.length>1?"s":""}</strong> need{needsChanges.length===1?"s":""} your attention — manager requested changes.
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              background: filter===f.key ? "#111" : "#fff",
              color: filter===f.key ? "#FFC400" : f.alert ? "#DC2626" : "#777",
              border: `1.5px solid ${filter===f.key?"#111":f.alert?"#FECACA":"#E5E5E5"}`,
              borderRadius:"5px", padding:"4px 12px",
              cursor:"pointer", fontSize:"11.5px", fontWeight:700,
              fontFamily:"'Inter',sans-serif", transition:"all 0.1s",
            }}>
            {f.label}
          </button>
        ))}
        <button onClick={() => setActiveTab("create")}
          style={{ marginLeft:"auto", background:"#FFC400", color:"#111", border:"none", borderRadius:"5px", padding:"4px 14px", cursor:"pointer", fontSize:"11.5px", fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
          + New Goal
        </button>
      </div>

      {/* Goal list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">No goals here</div>
          <div className="empty-state-sub">
            {filter==="all" ? "Create your first goal to get started." : `No ${filter.replace("_"," ")} goals.`}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {filtered.map(goal => (
            <GoalCard key={goal.id} goal={goal}
              onCheckIn={setCheckInGoal}
              onResubmit={g => setActiveTab("create")}
              canLogCheckIn={canLogCheckIn} />
          ))}
        </div>
      )}

      {checkInGoal && (
        <CheckInModal goal={checkInGoal}
          onClose={() => setCheckInGoal(null)}
          onSave={handleCheckIn} />
      )}
    </div>
  );
}
