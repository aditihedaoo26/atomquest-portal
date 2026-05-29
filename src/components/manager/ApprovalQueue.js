import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listenGoalsByManager, updateGoal, addAuditLog, addNotification } from "../../firebase/db";
import { GOAL_STATUS, STATUS_META, computeScore, getScoreColor, UOM_OPTIONS } from "../../utils/helpers";

function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return <span style={{ background:m.bg, color:m.color, border:`1px solid ${m.border}`, borderRadius:"4px", padding:"2px 7px", fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>{m.label}</span>;
}

export default function ApprovalQueue() {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [expanded, setExpanded] = useState({});
  const [comments, setComments] = useState({});
  const [edits, setEdits] = useState({});
  const [actionModal, setActionModal] = useState(null); // { goal, action }

  useEffect(() => {
    const unsub = listenGoalsByManager(currentUser.id, data => {
      setGoals(data);
      setLoading(false);
    });
    const t = setTimeout(() => setLoading(false), 3000);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  const handleAction = async (goal, action, comment) => {
    setSaving(goal.id + action);
    const isApprove = action === "approve";
    const isChanges = action === "changes";

    let newStatus = isApprove ? GOAL_STATUS.APPROVED : isChanges ? GOAL_STATUS.CHANGES_NEEDED : GOAL_STATUS.REJECTED;
    let locked = isApprove;

    await updateGoal(goal.id, {
      submissionStatus: newStatus,
      locked,
      managerComment: comment || "",
      ...(edits[goal.id] || {}),
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString(),
    });

    // Notify employee
    await addNotification({
      userId: goal.employeeId,
      title: isApprove ? "Goal Approved ✓" : isChanges ? "Changes Requested" : "Goal Rejected",
      message: isApprove
        ? `Your goal "${goal.title}" was approved by ${currentUser.name}.`
        : `${currentUser.name} requested changes on "${goal.title}": ${comment}`,
      type: isApprove ? "success" : isChanges ? "warning" : "error",
    });

    await addAuditLog({
      user: currentUser.name, role: "manager",
      action: isApprove ? "Approved goal" : isChanges ? "Requested changes" : "Rejected goal",
      detail: `"${goal.title}" — ${goal.employeeName}`,
      oldValue: goal.submissionStatus, newValue: newStatus,
    });

    setSaving(null);
    setActionModal(null);
  };

  // Group by employee
  const byEmployee = goals
    .filter(g => filter === "all" || g.submissionStatus === filter)
    .reduce((acc, g) => {
      if (!acc[g.employeeId]) acc[g.employeeId] = { name:g.employeeName, goals:[] };
      acc[g.employeeId].goals.push(g);
      return acc;
    }, {});

  const counts = {
    pending:        goals.filter(g => g.submissionStatus === "pending").length,
    changes_needed: goals.filter(g => g.submissionStatus === "changes_needed").length,
    approved:       goals.filter(g => g.submissionStatus === "approved").length,
    rejected:       goals.filter(g => g.submissionStatus === "rejected").length,
  };

  const FILTERS = [
    { key:"pending",        label:`Pending (${counts.pending})` },
    { key:"changes_needed", label:`Changes Sent (${counts.changes_needed})` },
    { key:"approved",       label:`Approved (${counts.approved})` },
    { key:"all",            label:"All" },
  ];

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      {[1,2].map(i => <div key={i} className="skeleton" style={{ height:"120px", borderRadius:"8px" }} />)}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
        <div>
          <div className="page-title">Goal Approvals</div>
          <div className="page-subtitle">Review, edit, and approve or request changes on team goals</div>
        </div>
        <div style={{ display:"flex", gap:"6px" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ background:filter===f.key?"#111":"#fff", color:filter===f.key?"#FFC400":"#777", border:`1.5px solid ${filter===f.key?"#111":"#E5E5E5"}`, borderRadius:"5px", padding:"4px 12px", cursor:"pointer", fontSize:"11.5px", fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(byEmployee).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No {filter === "all" ? "" : filter.replace("_"," ")} goals</div>
          <div className="empty-state-sub">Goals submitted by your team will appear here.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {Object.entries(byEmployee).map(([empId, { name, goals: empGoals }]) => {
            const totalWeight = empGoals.reduce((s,g) => s+(parseFloat(g.weightage)||0), 0);
            const weightOk = Math.round(totalWeight) === 100;
            const isOpen = expanded[empId] !== false;

            return (
              <div key={empId} style={{ background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:"8px", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                {/* Employee header */}
                <div style={{ padding:"12px 16px", background:"#FAFAFA", borderBottom:"1px solid #EEEEEE", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}
                  onClick={() => setExpanded(e => ({ ...e, [empId]: !isOpen }))}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{ width:"32px", height:"32px", background:"#111", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:800, color:"#FFC400" }}>
                      {name.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:"13px", color:"#111" }}>{name}</div>
                      <div style={{ fontSize:"10.5px", color:"#AAA" }}>{empGoals.length} goals</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ fontSize:"11.5px", fontWeight:700, color:weightOk?"#16A34A":"#DC2626" }}>
                      Total Weight: {totalWeight.toFixed(0)}% {weightOk?"✓":"⚠"}
                    </span>
                    <span style={{ color:"#CCC", fontSize:"11px" }}>{isOpen?"▲":"▼"}</span>
                  </div>
                </div>

                {isOpen && (
                  <>
                    {/* Goals table */}
                    <table className="data-table" style={{ tableLayout:"fixed" }}>
                      <thead>
                        <tr>
                          <th style={{ width:"35%" }}>Goal</th>
                          <th style={{ width:"12%" }}>Weight</th>
                          <th style={{ width:"12%" }}>Target</th>
                          <th style={{ width:"12%" }}>UoM</th>
                          <th style={{ width:"14%" }}>Status</th>
                          <th style={{ width:"15%" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empGoals.map(goal => {
                          const isPending = goal.submissionStatus === "pending";
                          const editData = edits[goal.id] || {};
                          return (
                            <tr key={goal.id}>
                              <td>
                                <div style={{ fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{goal.title}</div>
                                {goal.selfRating && <div style={{ fontSize:"10px", color:"#AAA", marginTop:"2px" }}>Self-rated: {goal.selfRating}/5 {goal.confidence && `· ${goal.confidence==="high"?"🟢":goal.confidence==="low"?"🔴":"🟡"}`}</div>}
                                {goal.managerComment && goal.submissionStatus === "changes_needed" && <div style={{ fontSize:"10px", color:"#DC2626", marginTop:"2px" }}>📌 "{goal.managerComment}"</div>}
                              </td>
                              <td>
                                {isPending ? (
                                  <input className="form-input" type="number" value={editData.weightage ?? goal.weightage}
                                    onChange={e => setEdits(p => ({...p,[goal.id]:{...p[goal.id],weightage:e.target.value}}))}
                                    style={{ padding:"3px 6px", fontSize:"12px", width:"64px" }} />
                                ) : <span className="mono" style={{ fontSize:"12px" }}>{goal.weightage}%</span>}
                              </td>
                              <td>
                                {isPending ? (
                                  <input className="form-input" type="number" value={editData.target ?? goal.target}
                                    onChange={e => setEdits(p => ({...p,[goal.id]:{...p[goal.id],target:e.target.value}}))}
                                    style={{ padding:"3px 6px", fontSize:"12px", width:"72px" }} />
                                ) : <span className="mono" style={{ fontSize:"12px" }}>{goal.target}</span>}
                              </td>
                              <td><span style={{ fontSize:"10px", fontWeight:600, color:"#777", textTransform:"uppercase" }}>{goal.uom}</span></td>
                              <td><StatusPill status={goal.submissionStatus} /></td>
                              <td>
                                {isPending ? (
                                  <div style={{ display:"flex", gap:"4px" }}>
                                    <button onClick={() => setActionModal({ goal:{ ...goal, ...(edits[goal.id]||{}) }, action:"approve" })}
                                      style={{ background:"#F0FDF4", color:"#16A34A", border:"1px solid #BBF7D0", borderRadius:"4px", padding:"3px 8px", cursor:"pointer", fontSize:"10.5px", fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
                                      ✓
                                    </button>
                                    <button onClick={() => setActionModal({ goal:{ ...goal, ...(edits[goal.id]||{}) }, action:"changes" })}
                                      style={{ background:"#FFFBEB", color:"#D97706", border:"1px solid #FDE68A", borderRadius:"4px", padding:"3px 8px", cursor:"pointer", fontSize:"10.5px", fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
                                      ✎
                                    </button>
                                    <button onClick={() => setActionModal({ goal, action:"reject" })}
                                      style={{ background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", borderRadius:"4px", padding:"3px 8px", cursor:"pointer", fontSize:"10.5px", fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize:"10.5px", color:"#CCC" }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Bulk approve if all pending */}
                    {empGoals.every(g => g.submissionStatus === "pending") && weightOk && (
                      <div style={{ padding:"10px 16px", background:"#FAFAFA", borderTop:"1px solid #EEEEEE", display:"flex", justifyContent:"flex-end", gap:"8px" }}>
                        <span style={{ fontSize:"11px", color:"#AAA", alignSelf:"center" }}>All goals look good?</span>
                        <button
                          onClick={async () => {
                            for (const g of empGoals) await handleAction(g, "approve", "");
                          }}
                          style={{ background:"#111", color:"#FFC400", border:"none", borderRadius:"5px", padding:"6px 16px", cursor:"pointer", fontSize:"12px", fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
                          Approve All Goals ✓
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action confirmation modal */}
      {actionModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
          <div style={{ background:"#fff", borderRadius:"12px", width:"100%", maxWidth:"420px", overflow:"hidden", boxShadow:"0 20px 48px rgba(0,0,0,0.2)" }}>
            <div style={{ background:"#111", padding:"14px 18px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:"#FFC400", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"2px" }}>
                {actionModal.action==="approve"?"Approve Goal":actionModal.action==="changes"?"Request Changes":"Reject Goal"}
              </div>
              <div style={{ fontSize:"13px", fontWeight:600, color:"#fff" }}>{actionModal.goal.title}</div>
            </div>
            <div style={{ padding:"18px" }}>
              <div className="form-group">
                <label className="form-label">
                  {actionModal.action==="approve" ? "Optional note for employee" : actionModal.action==="changes" ? "What needs to change? *" : "Reason for rejection *"}
                </label>
                <textarea className="form-input" rows={3}
                  placeholder={actionModal.action==="approve" ? "Great goals! Focus on Q2 deliverables..." : actionModal.action==="changes" ? "Please revise the target for goal 2 — it should be..." : "Reason for rejection..."}
                  value={comments[actionModal.goal.id] || ""}
                  onChange={e => setComments(p => ({...p,[actionModal.goal.id]:e.target.value}))}
                  style={{ resize:"none" }} />
              </div>
              <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
                <button className="btn btn-outline" onClick={() => setActionModal(null)}>Cancel</button>
                <button
                  onClick={() => handleAction(actionModal.goal, actionModal.action, comments[actionModal.goal.id]||"")}
                  disabled={saving === actionModal.goal.id + actionModal.action || (actionModal.action !== "approve" && !comments[actionModal.goal.id]?.trim())}
                  style={{
                    background: actionModal.action==="approve"?"#111":actionModal.action==="changes"?"#D97706":"#DC2626",
                    color:"#fff", border:"none", borderRadius:"5px", padding:"7px 16px",
                    cursor:"pointer", fontSize:"12px", fontWeight:700, fontFamily:"'Inter',sans-serif",
                    opacity: (actionModal.action !== "approve" && !comments[actionModal.goal.id]?.trim()) ? 0.4 : 1,
                  }}>
                  {saving ? "Saving..." : actionModal.action==="approve"?"Approve & Lock ✓":actionModal.action==="changes"?"Send Changes ✎":"Reject ✕"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
