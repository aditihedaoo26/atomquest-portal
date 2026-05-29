import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { addGoal, addAuditLog, getAllGoals } from "../../firebase/db";
import { THRUST_AREAS, UOM_OPTIONS, validateGoals } from "../../utils/helpers";
import { TEAM_MEMBERS } from "../../context/AuthContext";

const TEAM = [
  { id:"emp_001", name:"Riya Sharma",  email:"employee@atomquest.com" },
  { id:"emp_002", name:"Karan Patel",  email:"karan@atomquest.com"    },
  { id:"emp_003", name:"Sneha Joshi",  email:"sneha@atomquest.com"    },
];

export default function SharedGoals() {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1); // 1=define, 2=assign, 3=done
  const [goal, setGoal] = useState({ title:"", description:"", thrustArea:"", uom:"min", target:"", defaultWeightage:"20" });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberWeights, setMemberWeights] = useState({});
  const [saving, setSaving] = useState(false);
  const [pushed, setPushed] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    // Load already-pushed shared goals
    getAllGoals().then(goals => {
      setPushed(goals.filter(g => g.isShared && g.createdBy === currentUser.id));
    });
  }, []);

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
    );
    setMemberWeights(prev => ({ ...prev, [id]: goal.defaultWeightage }));
  };

  const validate = () => {
    const errs = [];
    if (!goal.title.trim())    errs.push("Goal title is required.");
    if (!goal.thrustArea)      errs.push("Thrust area is required.");
    if (!goal.target)          errs.push("Target is required.");
    if (!selectedMembers.length) errs.push("Select at least one team member.");
    setErrors(errs);
    return errs.length === 0;
  };

  const handlePush = async () => {
    if (!validate()) return;
    setSaving(true);
    const sharedId = `shared_${Date.now()}`;
    for (const memberId of selectedMembers) {
      const member = TEAM.find(m => m.id === memberId);
      await addGoal({
        ...goal,
        weightage: memberWeights[memberId] || goal.defaultWeightage,
        employeeId: memberId,
        employeeName: member?.name || memberId,
        managerId: currentUser.id,
        department: "Engineering",
        submissionStatus: "approved", // shared goals auto-approved
        locked: true,
        isShared: true,
        sharedId,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        sharedGoalReadOnly: true, // title + target locked
        checkInStatus: "not_started",
        achievement: "",
        quarter: "Q2",
      });
    }
    await addAuditLog({
      user: currentUser.name, role: "manager",
      action: "Pushed shared goal to team",
      detail: `"${goal.title}" → ${selectedMembers.length} employees`,
    });
    setSaving(false);
    setStep(3);
    // Reload pushed goals
    const goals = await getAllGoals();
    setPushed(goals.filter(g => g.isShared && g.createdBy === currentUser.id));
  };

  return (
    <div>
      <div style={{ marginBottom:"16px" }}>
        <div className="page-title">Shared Goals</div>
        <div className="page-subtitle">Push a departmental KPI to multiple team members. Recipients can only adjust their weightage.</div>
      </div>

      {/* Already pushed */}
      {pushed.length > 0 && (
        <div style={{ marginBottom:"16px" }}>
          <div style={{ fontSize:"10px", fontWeight:700, color:"#AAA", textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:"8px" }}>Previously Pushed</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {[...new Map(pushed.map(g=>[g.sharedId,g])).values()].map(g => {
              const count = pushed.filter(p=>p.sharedId===g.sharedId).length;
              return (
                <div key={g.sharedId} style={{ background:"#fff", border:"1px solid #E5E5E5", borderRadius:"7px", padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:"13px" }}>{g.title}</div>
                    <div style={{ fontSize:"11px", color:"#AAA", marginTop:"2px" }}>{g.thrustArea} · Target: {g.target} · Pushed to {count} employee{count>1?"s":""}</div>
                  </div>
                  <span className="badge badge-blue">Shared</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div style={{ display:"flex", gap:"0", marginBottom:"20px", background:"#F5F5F5", borderRadius:"7px", padding:"3px" }}>
        {[{n:1,l:"Define Goal"},{n:2,l:"Assign to Team"},{n:3,l:"Done"}].map(s=>(
          <div key={s.n} style={{
            flex:1, textAlign:"center", padding:"6px",
            background: step===s.n?"#111":"transparent",
            borderRadius:"5px",
            fontSize:"11.5px", fontWeight:700,
            color: step===s.n?"#FFC400": step>s.n?"#16A34A":"#AAA",
            transition:"all 0.2s",
          }}>
            {step>s.n?"✓ ":""}{s.l}
          </div>
        ))}
      </div>

      {/* STEP 1 — Define Goal */}
      {step === 1 && (
        <div style={{ background:"#fff", border:"1px solid #E5E5E5", borderRadius:"8px", padding:"20px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div style={{ gridColumn:"1/-1" }} className="form-group">
              <label className="form-label">Goal Title *</label>
              <input className="form-input" placeholder="e.g. Achieve 95% Customer Satisfaction Score"
                value={goal.title} onChange={e=>setGoal(g=>({...g,title:e.target.value}))} />
            </div>
            <div style={{ gridColumn:"1/-1" }} className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} placeholder="Describe this departmental KPI..."
                value={goal.description} onChange={e=>setGoal(g=>({...g,description:e.target.value}))} style={{resize:"none"}} />
            </div>
            <div className="form-group">
              <label className="form-label">Thrust Area *</label>
              <select className="form-input" value={goal.thrustArea} onChange={e=>setGoal(g=>({...g,thrustArea:e.target.value}))}>
                <option value="">Select...</option>
                {THRUST_AREAS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit of Measurement *</label>
              <select className="form-input" value={goal.uom} onChange={e=>setGoal(g=>({...g,uom:e.target.value}))}>
                {UOM_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target *</label>
              <input className="form-input" type="number" placeholder="Numeric target"
                value={goal.target} onChange={e=>setGoal(g=>({...g,target:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Default Weightage (%) <span style={{fontWeight:400,color:"#AAA"}}>per member</span></label>
              <input className="form-input" type="number" min="10" max="50" placeholder="20"
                value={goal.defaultWeightage} onChange={e=>setGoal(g=>({...g,defaultWeightage:e.target.value}))} />
            </div>
          </div>

          {/* Info box */}
          <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:"6px", padding:"10px 12px", marginTop:"4px", fontSize:"11.5px", color:"#1D4ED8" }}>
            ℹ️ <strong>Shared Goal rules:</strong> Once pushed, the Goal Title and Target are read-only for recipients. Each member can only adjust their own weightage. Achievement updates by the primary owner sync across all linked sheets.
          </div>

          {errors.length > 0 && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"6px", padding:"10px 12px", marginTop:"10px" }}>
              {errors.map((e,i)=><div key={i} style={{fontSize:"11.5px",color:"#DC2626"}}>⚠ {e}</div>)}
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"16px" }}>
            <button className="btn btn-primary" onClick={()=>{ if(goal.title&&goal.thrustArea&&goal.target){setErrors([]);setStep(2);}else setErrors(["Fill all required fields."]) }}
              style={{ background:"#111", color:"#FFC400" }}>
              Next: Assign to Team →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Assign */}
      {step === 2 && (
        <div style={{ background:"#fff", border:"1px solid #E5E5E5", borderRadius:"8px", padding:"20px" }}>
          {/* Goal summary */}
          <div style={{ background:"#111", borderRadius:"7px", padding:"12px 16px", marginBottom:"16px" }}>
            <div style={{ fontSize:"9px", fontWeight:700, color:"#444", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"3px" }}>Shared Goal</div>
            <div style={{ fontSize:"14px", fontWeight:800, color:"#FFC400" }}>{goal.title}</div>
            <div style={{ fontSize:"11px", color:"#555", marginTop:"2px" }}>{goal.thrustArea} · Target: {goal.target} · {UOM_OPTIONS.find(u=>u.value===goal.uom)?.label?.split("—")[0]?.trim()}</div>
          </div>

          <div style={{ fontSize:"11px", fontWeight:700, color:"#777", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"10px" }}>
            Select Team Members ({selectedMembers.length} selected)
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"16px" }}>
            {TEAM.map(member => {
              const isSelected = selectedMembers.includes(member.id);
              return (
                <div key={member.id} style={{
                  border:`1.5px solid ${isSelected?"#FFC400":"#E5E5E5"}`,
                  background: isSelected?"#FFFBEB":"#FAFAFA",
                  borderRadius:"7px", padding:"12px 14px",
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  cursor:"pointer", transition:"all 0.12s",
                }} onClick={() => toggleMember(member.id)}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{
                      width:"20px", height:"20px", borderRadius:"4px",
                      background: isSelected?"#FFC400":"#fff",
                      border:`2px solid ${isSelected?"#FFC400":"#CCC"}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"11px", color:"#111", flexShrink:0,
                    }}>{isSelected?"✓":""}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:"13px" }}>{member.name}</div>
                      <div style={{ fontSize:"11px", color:"#AAA" }}>{member.email}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <label style={{ fontSize:"10px", color:"#777", fontWeight:600 }}>Weight:</label>
                      <input type="number" min="10" max="50"
                        value={memberWeights[member.id] || goal.defaultWeightage}
                        onChange={e => { e.stopPropagation(); setMemberWeights(p=>({...p,[member.id]:e.target.value})); }}
                        onClick={e=>e.stopPropagation()}
                        style={{ width:"56px", padding:"3px 6px", border:"1px solid #E5E5E5", borderRadius:"4px", fontSize:"12px", fontWeight:700, textAlign:"center", fontFamily:"'JetBrains Mono',monospace" }} />
                      <span style={{ fontSize:"11px", color:"#777" }}>%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {errors.length > 0 && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"6px", padding:"10px", marginBottom:"12px" }}>
              {errors.map((e,i)=><div key={i} style={{fontSize:"11.5px",color:"#DC2626"}}>⚠ {e}</div>)}
            </div>
          )}

          <div style={{ display:"flex", gap:"8px", justifyContent:"space-between" }}>
            <button className="btn btn-outline" onClick={()=>setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={handlePush} disabled={saving}
              style={{ background:"#111", color:"#FFC400" }}>
              {saving ? "Pushing..." : `Push to ${selectedMembers.length} Member${selectedMembers.length!==1?"s":""} →`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Done */}
      {step === 3 && (
        <div style={{ background:"#F0FDF4", border:"1.5px solid #BBF7D0", borderRadius:"8px", padding:"32px", textAlign:"center" }}>
          <div style={{ fontSize:"32px", marginBottom:"12px" }}>✅</div>
          <div style={{ fontSize:"16px", fontWeight:800, color:"#166534", marginBottom:"4px" }}>Goal Pushed Successfully</div>
          <div style={{ fontSize:"12px", color:"#16A34A", marginBottom:"16px" }}>
            "{goal.title}" has been pushed to {selectedMembers.length} team member{selectedMembers.length!==1?"s":""}. Goals are auto-approved and locked.
          </div>
          <button className="btn btn-primary" onClick={()=>{ setStep(1); setGoal({title:"",description:"",thrustArea:"",uom:"min",target:"",defaultWeightage:"20"}); setSelectedMembers([]); setMemberWeights({}); }}
            style={{ background:"#111", color:"#FFC400" }}>
            Push Another Goal
          </button>
        </div>
      )}
    </div>
  );
}
