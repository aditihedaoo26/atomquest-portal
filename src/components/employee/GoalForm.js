import React, { useState } from "react";
import { THRUST_AREAS, UOM_OPTIONS, validateGoals } from "../../utils/helpers";
import { addGoal, addAuditLog } from "../../firebase/db";
import { useAuth } from "../../context/AuthContext";
import AIGoalCoach from "./AIGoalCoach";
import SmartGoalSuggestions from "./SmartGoalSuggestions";

const emptyGoal = () => ({ title:"", description:"", thrustArea:"", uom:"min", target:"", weightage:"", status:"draft" });

export default function GoalForm({ onSaved }) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([emptyGoal()]);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeAI, setActiveAI] = useState(null); // "coach" | "suggest" | null

  const totalWeight = goals.reduce((s,g)=>s+(parseFloat(g.weightage)||0),0);
  const weightOk = Math.round(totalWeight)===100;

  const updateGoalField = (i,field,value) => {
    setGoals(prev=>prev.map((g,idx)=>idx===i?{...g,[field]:value}:g));
    setErrors([]);
  };

  // AI Coach adds one goal
  const handleAIGoal = (result) => {
    if (goals.length >= 8) return;
    const newGoal = { title:result.title, description:result.description, thrustArea:result.thrustArea, uom:result.uom, target:result.target, weightage:result.weightage, status:"draft" };
    setGoals(prev=>{
      // Replace first empty goal or append
      const emptyIdx = prev.findIndex(g=>!g.title);
      if(emptyIdx>=0){ const n=[...prev]; n[emptyIdx]=newGoal; return n; }
      return [...prev, newGoal];
    });
    setActiveAI(null);
  };

  // Suggestions loads multiple goals
  const handleSuggestions = (suggested) => {
    const mapped = suggested.map(g=>({ title:g.title, description:g.description, thrustArea:g.thrustArea, uom:g.uom, target:g.target, weightage:String(g.weightage), status:"draft" }));
    setGoals(mapped.slice(0,8));
    setActiveAI(null);
  };

  const handleSubmit = async (asDraft=false) => {
    if(!asDraft){const errs=validateGoals(goals);if(errs.length){setErrors(errs);return;}}
    setSaving(true);
    try {
      for(const g of goals){
        await addGoal({...g,employeeId:currentUser.id,employeeName:currentUser.name,managerId:currentUser.managerId,department:currentUser.department,submissionStatus:asDraft?"draft":"pending",locked:false,quarter:"Q1",achievement:"",checkInStatus:"not_started"});
      }
      await addAuditLog({user:currentUser.name,role:"employee",action:asDraft?"Saved goals as draft":"Submitted goals for approval",detail:`${goals.length} goals`});
      setSuccess(true);setGoals([emptyGoal()]);setErrors([]);
      setTimeout(()=>{setSuccess(false);onSaved?.();},1800);
    } catch(e){setErrors(["Failed to save. Check Firebase connection."]);}
    setSaving(false);
  };

  return (
    <div style={{maxWidth:"820px"}}>
      {/* Page title */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.25rem"}}>
        <div>
          <h2 style={{fontSize:"1.1rem",fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Create Goal Sheet</h2>
          <p style={{fontSize:"0.8rem",color:"#777",marginTop:"0.25rem"}}>Add up to 8 goals. Total weightage must equal exactly 100%.</p>
        </div>
        <div className={`weight-meter ${weightOk?"ok":totalWeight>100?"over":""}`} style={{minWidth:"110px"}}>
          <div className="weight-value" style={{color:weightOk?"#22C55E":totalWeight>100?"#EF4444":"#111"}}>{totalWeight.toFixed(0)}%</div>
          <div style={{fontSize:"0.65rem",color:"#999",marginTop:"0.1rem"}}>of 100%</div>
        </div>
      </div>

      {/* AI Tools Bar */}
      <div style={{background:"#111",borderRadius:"10px",padding:"0.85rem 1.25rem",marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"}}>
        <span style={{fontSize:"0.75rem",fontWeight:600,color:"#888"}}>⚡ AI Tools:</span>
        <button onClick={()=>setActiveAI(activeAI==="coach"?null:"coach")}
          style={{background:activeAI==="coach"?"#F5C500":"#1a1a1a",color:activeAI==="coach"?"#111":"#F5C500",border:"1px solid #333",borderRadius:"6px",padding:"0.4rem 0.85rem",cursor:"pointer",fontSize:"0.75rem",fontWeight:700,fontFamily:"'Sora',sans-serif",transition:"all 0.15s"}}>
          🧠 AI Goal Coach
        </button>
        <button onClick={()=>setActiveAI(activeAI==="suggest"?null:"suggest")}
          style={{background:activeAI==="suggest"?"#F5C500":"#1a1a1a",color:activeAI==="suggest"?"#111":"#F5C500",border:"1px solid #333",borderRadius:"6px",padding:"0.4rem 0.85rem",cursor:"pointer",fontSize:"0.75rem",fontWeight:700,fontFamily:"'Sora',sans-serif",transition:"all 0.15s"}}>
          🎯 Smart Suggestions
        </button>
        <span style={{fontSize:"0.7rem",color:"#555",marginLeft:"auto"}}>AI writes SMART goals for you</span>
      </div>

      {/* AI Panels */}
      {activeAI==="coach" && <AIGoalCoach onGoalGenerated={handleAIGoal} />}
      {activeAI==="suggest" && <SmartGoalSuggestions onSuggestionsLoaded={handleSuggestions} />}

      {/* Errors & success */}
      {errors.length>0&&(
        <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:"8px",padding:"0.85rem 1rem",marginBottom:"1.25rem"}}>
          {errors.map((e,i)=><div key={i} style={{color:"#991B1B",fontSize:"0.8rem"}}>⚠ {e}</div>)}
        </div>
      )}
      {success&&(
        <div style={{background:"#DCFCE7",border:"1px solid #BBF7D0",borderRadius:"8px",padding:"0.85rem 1rem",marginBottom:"1.25rem",color:"#15803D",fontSize:"0.85rem",textAlign:"center"}}>
          ✅ Goals saved successfully!
        </div>
      )}

      {/* Goal rows */}
      <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
        {goals.map((g,i)=>(
          <div key={i} style={{background:"#fff",border:"1.5px solid #EBEBEB",borderRadius:"10px",padding:"1.5rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.65rem"}}>
                <div style={{width:"28px",height:"28px",background:"#111",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.75rem",fontWeight:800,color:"#F5C500"}}>{i+1}</div>
                <span style={{fontSize:"0.8rem",fontWeight:600,color:"#555"}}>Goal {i+1} of {goals.length}</span>
                {g.title && <span style={{fontSize:"0.68rem",background:"#DCFCE7",color:"#15803D",borderRadius:"4px",padding:"0.1rem 0.4rem",fontWeight:600}}>✓ AI filled</span>}
              </div>
              {goals.length>1&&<button onClick={()=>setGoals(prev=>prev.filter((_,idx)=>idx!==i))} style={{background:"#FEE2E2",border:"none",color:"#991B1B",borderRadius:"5px",padding:"0.25rem 0.6rem",cursor:"pointer",fontSize:"0.72rem",fontWeight:600}}>Remove</button>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.85rem"}}>
              <div style={{gridColumn:"1/-1"}} className="form-group">
                <label className="form-label">Goal Title *</label>
                <input className="form-input" placeholder="e.g. Increase quarterly sales by 20%" value={g.title} onChange={e=>updateGoalField(i,"title",e.target.value)} />
              </div>
              <div style={{gridColumn:"1/-1"}} className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} placeholder="How you plan to achieve this..." value={g.description} onChange={e=>updateGoalField(i,"description",e.target.value)} style={{resize:"vertical"}} />
              </div>
              <div className="form-group">
                <label className="form-label">Thrust Area *</label>
                <select className="form-input" value={g.thrustArea} onChange={e=>updateGoalField(i,"thrustArea",e.target.value)}>
                  <option value="">Select thrust area</option>
                  {THRUST_AREAS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit of Measurement *</label>
                <select className="form-input" value={g.uom} onChange={e=>updateGoalField(i,"uom",e.target.value)}>
                  {UOM_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div style={{fontSize:"0.68rem",color:"#999",marginTop:"0.2rem"}}>e.g. {UOM_OPTIONS.find(o=>o.value===g.uom)?.example}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Target *</label>
                <input className="form-input" type="number" placeholder="Enter numeric target" value={g.target} onChange={e=>updateGoalField(i,"target",e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Weightage (%) * <span style={{fontWeight:400,textTransform:"none",color:"#AAA"}}>min 10%</span></label>
                <input className="form-input" type="number" min="10" max="100" placeholder="e.g. 30" value={g.weightage} onChange={e=>updateGoalField(i,"weightage",e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {goals.length<8&&(
        <button onClick={()=>setGoals(prev=>[...prev,emptyGoal()])}
          style={{marginTop:"0.85rem",width:"100%",background:"transparent",border:"1.5px dashed #DCDCDC",borderRadius:"8px",padding:"0.85rem",color:"#999",cursor:"pointer",fontSize:"0.82rem",fontFamily:"'Sora',sans-serif",transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#F5C500";e.currentTarget.style.color="#111";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#DCDCDC";e.currentTarget.style.color="#999";}}>
          + Add Goal ({goals.length}/8)
        </button>
      )}

      <div style={{display:"flex",gap:"0.75rem",marginTop:"1.25rem",justifyContent:"flex-end"}}>
        <button className="btn btn-outline" onClick={()=>handleSubmit(true)} disabled={saving}>Save Draft</button>
        <button className="btn btn-primary" onClick={()=>handleSubmit(false)} disabled={saving}>{saving?"Submitting...":"Submit Goals →"}</button>
      </div>
    </div>
  );
}
