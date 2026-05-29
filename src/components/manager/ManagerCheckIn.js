import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listenGoalsByManager, updateGoal, addAuditLog } from "../../firebase/db";
import { computeScore, getScoreColor, getScoreLabel, UOM_OPTIONS } from "../../utils/helpers";
import { useCycleWindow } from "../../hooks/useCycleWindow";

export default function ManagerCheckIn() {
  const { currentUser } = useAuth();
  const { activeLabel, activePeriod, canLogCheckIn } = useCycleWindow();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState({});
  const [selectedEmp, setSelectedEmp] = useState(null);

  useEffect(() => {
    const unsub = listenGoalsByManager(currentUser.id, data => {
      setGoals(data.filter(g => g.submissionStatus === "approved"));
      setLoading(false);
    });
    const t = setTimeout(() => setLoading(false), 3000);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  // Group by employee
  const byEmployee = goals.reduce((acc, g) => {
    if (!acc[g.employeeId]) acc[g.employeeId] = { name:g.employeeName, goals:[] };
    acc[g.employeeId].goals.push(g);
    return acc;
  }, {});

  const employees = Object.entries(byEmployee);

  const saveComment = async (goal) => {
    const comment = comments[goal.id];
    if (!comment?.trim()) return;
    setSaving(goal.id);
    await updateGoal(goal.id, { managerCheckInComment: comment, managerCheckInBy: currentUser.name, managerCheckInAt: new Date().toISOString() });
    await addAuditLog({ user:currentUser.name, role:"manager", action:"Added check-in comment", detail:`"${goal.title}" — ${goal.employeeName}: "${comment}"` });
    setSaved(p => ({...p, [goal.id]:true}));
    setSaving(null);
    setTimeout(() => setSaved(p => ({...p,[goal.id]:false})), 2000);
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      {[1,2].map(i=><div key={i} className="skeleton" style={{height:"100px",borderRadius:"8px"}}/>)}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
        <div>
          <div className="page-title">Team Check-ins</div>
          <div className="page-subtitle">Review planned vs actual for each team member and add structured check-in comments</div>
        </div>
        <div style={{ background:"#111", borderRadius:"7px", padding:"8px 14px", textAlign:"right" }}>
          <div style={{ fontSize:"9px", fontWeight:700, color:"#444", textTransform:"uppercase", letterSpacing:"0.1em" }}>Active Window</div>
          <div style={{ fontSize:"13px", fontWeight:800, color:"#FFC400" }}>{activeLabel}</div>
          {activePeriod && <div style={{ fontSize:"10px", color:"#555" }}>{activePeriod}</div>}
        </div>
      </div>

      {!canLogCheckIn && (
        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:"8px", padding:"12px 16px", marginBottom:"14px", display:"flex", gap:"8px", alignItems:"center" }}>
          <span>⚠️</span>
          <div style={{ fontSize:"12px", color:"#92400E" }}>
            <strong>No active check-in window.</strong> Check-in comments can only be added when a quarterly window is open. Current status: <strong>{activeLabel}</strong>.
          </div>
        </div>
      )}

      {employees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">No approved goals yet</div>
          <div className="empty-state-sub">Approve team goals first before conducting check-ins.</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:"12px" }}>
          {/* Employee list */}
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {employees.map(([empId, { name, goals:empGoals }]) => {
              const withData = empGoals.filter(g=>g.achievement).length;
              const withComment = empGoals.filter(g=>g.managerCheckInComment).length;
              const isActive = selectedEmp === empId;
              return (
                <div key={empId} onClick={() => setSelectedEmp(empId)}
                  style={{
                    background: isActive?"#111":"#fff",
                    border:`1.5px solid ${isActive?"#111":"#E5E5E5"}`,
                    borderRadius:"7px", padding:"10px 12px", cursor:"pointer",
                    transition:"all 0.12s",
                  }}>
                  <div style={{ fontWeight:700, fontSize:"12.5px", color:isActive?"#FFC400":"#111" }}>{name}</div>
                  <div style={{ fontSize:"10px", color:isActive?"#555":"#AAA", marginTop:"2px" }}>
                    {withData}/{empGoals.length} achievements · {withComment}/{empGoals.length} comments
                  </div>
                  {withComment === empGoals.length && withData === empGoals.length && (
                    <span style={{ fontSize:"9px", fontWeight:700, color:"#16A34A" }}>✓ Complete</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Goal detail */}
          <div>
            {!selectedEmp ? (
              <div className="empty-state" style={{ height:"100%" }}>
                <div className="empty-state-icon">←</div>
                <div className="empty-state-title">Select a team member</div>
                <div className="empty-state-sub">Click a name to review their goals</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {/* Summary bar */}
                {(() => {
                  const empGoals = byEmployee[selectedEmp]?.goals || [];
                  const withData = empGoals.filter(g=>g.achievement);
                  const scores = withData.map(g=>computeScore(g.uom,g.target,g.achievement));
                  const avg = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
                  return (
                    <div style={{ background:"#111", borderRadius:"7px", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontWeight:700, fontSize:"14px", color:"#fff" }}>{byEmployee[selectedEmp]?.name}</div>
                      <div style={{ display:"flex", gap:"16px" }}>
                        {[
                          { label:"Avg Score", value: avg>0?avg.toFixed(0)+"%":"—", color:avg>0?getScoreColor(avg):"#555" },
                          { label:"Goals with Data", value:`${withData.length}/${empGoals.length}`, color:"#FFC400" },
                        ].map(s=>(
                          <div key={s.label} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:"18px", fontWeight:900, color:s.color, letterSpacing:"-0.04em" }}>{s.value}</div>
                            <div style={{ fontSize:"9px", color:"#444", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Per-goal check-in */}
                {(byEmployee[selectedEmp]?.goals || []).map(goal => {
                  const score = goal.achievement ? computeScore(goal.uom,goal.target,goal.achievement) : null;
                  const uomLabel = UOM_OPTIONS.find(u=>u.value===goal.uom)?.label?.split("—")[0]?.trim();
                  return (
                    <div key={goal.id} style={{ background:"#fff", border:"1px solid #E5E5E5", borderRadius:"8px", overflow:"hidden" }}>
                      {/* Goal header */}
                      <div style={{ padding:"12px 14px", borderBottom:"1px solid #F5F5F5" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:"13px", color:"#111", marginBottom:"3px" }}>{goal.title}</div>
                            <div style={{ fontSize:"10.5px", color:"#AAA" }}>{goal.thrustArea} · {uomLabel} · Weight: {goal.weightage}%</div>
                          </div>
                          {score !== null && (
                            <div style={{ textAlign:"right", flexShrink:0, marginLeft:"12px" }}>
                              <div style={{ fontSize:"20px", fontWeight:900, color:getScoreColor(score), letterSpacing:"-0.04em" }}>{score.toFixed(0)}%</div>
                              <div style={{ fontSize:"9.5px", fontWeight:700, color:getScoreColor(score) }}>{getScoreLabel(score)}</div>
                            </div>
                          )}
                        </div>

                        {/* Planned vs Actual */}
                        <div style={{ display:"flex", gap:"12px", marginTop:"10px" }}>
                          {[
                            { label:"Planned Target", value:goal.target, mono:true },
                            { label:"Actual Achievement", value:goal.achievement||"—", mono:true, highlight:!!goal.achievement },
                            { label:"Check-in Status", value:goal.checkInStatus?.replace("_"," ")||"Not Started", mono:false },
                            { label:"Confidence", value:goal.confidence||"—", mono:false },
                          ].map(item=>(
                            <div key={item.label} style={{ flex:1, background:"#F8F8F6", border:"1px solid #EEEEEE", borderRadius:"5px", padding:"7px 9px" }}>
                              <div style={{ fontSize:"9px", fontWeight:700, color:"#AAA", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"3px" }}>{item.label}</div>
                              <div style={{ fontSize:"13px", fontWeight:800, color:item.highlight?"#16A34A":"#111", fontFamily:item.mono?"'JetBrains Mono',monospace":"inherit", textTransform:"capitalize" }}>{item.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Employee's own note */}
                        {goal.employeeComment && (
                          <div style={{ marginTop:"8px", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:"5px", padding:"7px 10px", fontSize:"11.5px", color:"#1D4ED8" }}>
                            <strong>Employee note:</strong> "{goal.employeeComment}"
                          </div>
                        )}
                        {/* Self assessment */}
                        {goal.selfRating && (
                          <div style={{ marginTop:"6px", fontSize:"11px", color:"#777" }}>
                            Self-rated: <strong>{goal.selfRating}/5</strong>
                            {goal.selfComment && <span> · "{goal.selfComment}"</span>}
                          </div>
                        )}
                      </div>

                      {/* Manager check-in comment */}
                      <div style={{ padding:"12px 14px", background:"#FAFAFA" }}>
                        {goal.managerCheckInComment ? (
                          <div>
                            <div style={{ fontSize:"9.5px", fontWeight:700, color:"#16A34A", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"4px" }}>✓ Your Check-in Comment</div>
                            <div style={{ fontSize:"12px", color:"#166534", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:"5px", padding:"8px 10px" }}>"{goal.managerCheckInComment}"</div>
                            <button onClick={()=>setComments(p=>({...p,[goal.id]:goal.managerCheckInComment}))}
                              style={{ background:"none", border:"none", color:"#AAA", cursor:"pointer", fontSize:"10.5px", marginTop:"4px", fontFamily:"'Inter',sans-serif" }}>
                              Edit comment
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize:"9.5px", fontWeight:700, color:"#AAA", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"6px" }}>Add Check-in Comment *</div>
                            <textarea
                              className="form-input"
                              rows={2} style={{ resize:"none", marginBottom:"7px" }}
                              placeholder="Document the check-in discussion, observations, and guidance for this goal..."
                              value={comments[goal.id]||""}
                              onChange={e=>setComments(p=>({...p,[goal.id]:e.target.value}))}
                              disabled={!canLogCheckIn}
                            />
                            <button onClick={()=>saveComment(goal)}
                              disabled={saving===goal.id || !comments[goal.id]?.trim() || !canLogCheckIn}
                              style={{ background:"#111", color:"#FFC400", border:"none", borderRadius:"5px", padding:"5px 14px", cursor:"pointer", fontSize:"11.5px", fontWeight:700, fontFamily:"'Inter',sans-serif", opacity:(!comments[goal.id]?.trim()||!canLogCheckIn)?0.4:1 }}>
                              {saved[goal.id]?"✓ Saved!":saving===goal.id?"Saving...":"Save Comment →"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
