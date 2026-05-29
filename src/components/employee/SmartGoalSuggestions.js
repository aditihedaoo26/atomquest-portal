import React, { useState } from "react";

const ROLES = ["Software Engineer","Product Manager","Sales Executive","Marketing Manager","Operations Manager","Finance Analyst","HR Business Partner","Customer Success Manager","Data Analyst","QA Engineer"];
const DEPARTMENTS = ["Engineering","Sales & Marketing","Operations","Finance","Human Resources","Customer Success","Product","Quality & Compliance"];

export default function SmartGoalSuggestions({ onSuggestionsLoaded }) {
  const [role, setRole] = useState("");
  const [dept, setDept] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [selected, setSelected] = useState([]);

  const generate = async () => {
    if (!role || !dept) return;
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setSelected([]);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: `You are an OKR expert. Generate exactly 6 SMART goals for a ${role} in the ${dept} department.
Return ONLY a JSON array (no markdown, no backticks):
[{
  "title": "Concise SMART goal (max 60 chars)",
  "description": "How to achieve in 1 sentence",
  "thrustArea": one of ["Sales & Revenue","Customer Success","Operations","Product & Engineering","Finance & Cost","People & Culture","Quality & Compliance","Innovation"],
  "uom": one of ["min","max","zero","timeline"],
  "target": "numeric value as string",
  "weightage": number between 10-25,
  "difficulty": "easy"|"medium"|"hard",
  "impact": "high"|"medium"|"low"
}]
Make sure total weightage sums close to 100. Mix different thrust areas.`,
          messages: [{ role:"user", content:`Generate 6 SMART goals for a ${role} in ${dept}` }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setSuggestions(parsed);
      setSelected(parsed.map((_,i)=>i)); // select all by default
    } catch(e) {
      setError("Failed to generate suggestions. Check API connection.");
    }
    setLoading(false);
  };

  const toggle = (i) => setSelected(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev,i]);

  const diffColor = { easy:"#15803D", medium:"#854D0E", hard:"#991B1B" };
  const diffBg = { easy:"#DCFCE7", medium:"#FEF9C3", hard:"#FEE2E2" };
  const impactColor = { high:"#1D4ED8", medium:"#6B7280", low:"#9CA3AF" };

  return (
    <div style={{ background:"#fff", border:"1.5px solid #EBEBEB", borderRadius:"12px", overflow:"hidden", marginBottom:"1.5rem" }}>
      {/* Header */}
      <div style={{ background:"#111", padding:"1rem 1.5rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
        <div style={{ fontSize:"1.5rem" }}>🎯</div>
        <div>
          <div style={{ color:"#F5C500", fontWeight:700, fontSize:"0.95rem" }}>Smart Goal Suggestions</div>
          <div style={{ color:"#888", fontSize:"0.75rem" }}>AI generates 6 role-specific goals tailored to your position</div>
        </div>
      </div>

      <div style={{ padding:"1.25rem" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:"0.75rem", marginBottom:"1rem", alignItems:"flex-end" }}>
          <div>
            <label className="form-label">Your Role</label>
            <select className="form-input" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="">Select role...</option>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="form-input" value={dept} onChange={e=>setDept(e.target.value)}>
              <option value="">Select department...</option>
              {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button
            onClick={generate}
            disabled={loading || !role || !dept}
            className="btn btn-primary"
            style={{ whiteSpace:"nowrap", background:(!role||!dept||loading)?"#EEE":"#111", color:(!role||!dept||loading)?"#999":"#F5C500", height:"38px" }}
          >
            {loading ? "🎯 Generating..." : "🎯 Suggest Goals"}
          </button>
        </div>

        {error && <div style={{ background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:"6px", padding:"0.75rem", color:"#991B1B", fontSize:"0.8rem", marginBottom:"1rem" }}>⚠ {error}</div>}

        {loading && (
          <div style={{ textAlign:"center", padding:"3rem", color:"#999" }}>
            <div style={{ fontSize:"2rem", marginBottom:"0.75rem", animation:"pulse 1.5s infinite" }}>🤖</div>
            <div style={{ fontSize:"0.85rem" }}>Analysing {role} role in {dept}...</div>
            <div style={{ fontSize:"0.75rem", color:"#BBB", marginTop:"0.25rem" }}>Generating SMART goals tailored to your position</div>
          </div>
        )}

        {suggestions && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.85rem" }}>
              <div style={{ fontSize:"0.8rem", color:"#555" }}>
                <strong style={{ color:"#111" }}>{selected.length} of {suggestions.length}</strong> goals selected · Total weight: <strong style={{ color: selected.reduce((s,i)=>s+(suggestions[i]?.weightage||0),0)===100?"#22C55E":"#F97316" }}>{selected.reduce((s,i)=>s+(suggestions[i]?.weightage||0),0)}%</strong>
              </div>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <button onClick={()=>setSelected(suggestions.map((_,i)=>i))} className="btn btn-outline" style={{ fontSize:"0.72rem", padding:"0.3rem 0.65rem" }}>Select All</button>
                <button onClick={()=>setSelected([])} className="btn btn-ghost" style={{ fontSize:"0.72rem", padding:"0.3rem 0.65rem" }}>Clear</button>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem", marginBottom:"1rem" }}>
              {suggestions.map((g,i)=>{
                const isSelected = selected.includes(i);
                return (
                  <div key={i} onClick={()=>toggle(i)} style={{
                    border:`1.5px solid ${isSelected?"#F5C500":"#EBEBEB"}`,
                    borderRadius:"8px", padding:"1rem",
                    cursor:"pointer", transition:"all 0.15s",
                    background: isSelected?"#FFFBEB":"#FAFAFA",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ display:"flex", gap:"0.65rem", alignItems:"flex-start", flex:1 }}>
                        <div style={{
                          width:"20px", height:"20px", borderRadius:"4px", flexShrink:0, marginTop:"0.1rem",
                          background:isSelected?"#F5C500":"#fff",
                          border:`2px solid ${isSelected?"#F5C500":"#DCDCDC"}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:"0.65rem", color:"#111",
                        }}>{isSelected?"✓":""}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:"0.85rem", color:"#111", marginBottom:"0.25rem" }}>{g.title}</div>
                          <div style={{ fontSize:"0.75rem", color:"#666", marginBottom:"0.5rem" }}>{g.description}</div>
                          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                            <span style={{ background:"#F0F0F0", borderRadius:"4px", padding:"0.15rem 0.5rem", fontSize:"0.65rem", color:"#555" }}>{g.thrustArea}</span>
                            <span style={{ background:"#F0F0F0", borderRadius:"4px", padding:"0.15rem 0.5rem", fontSize:"0.65rem", color:"#555" }}>Target: {g.target}</span>
                            <span style={{ background:"#F0F0F0", borderRadius:"4px", padding:"0.15rem 0.5rem", fontSize:"0.65rem", color:"#555" }}>Weight: {g.weightage}%</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem", alignItems:"flex-end", flexShrink:0, marginLeft:"0.75rem" }}>
                        <span style={{ background:diffBg[g.difficulty], color:diffColor[g.difficulty], borderRadius:"4px", padding:"0.15rem 0.5rem", fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase" }}>{g.difficulty}</span>
                        <span style={{ fontSize:"0.65rem", color:impactColor[g.impact], fontWeight:600 }}>↑ {g.impact} impact</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display:"flex", gap:"0.65rem", justifyContent:"flex-end" }}>
              <button className="btn btn-outline" onClick={()=>{setSuggestions(null);setRole("");setDept("");}}>Start Over</button>
              <button className="btn btn-primary" style={{ background:"#111", color:"#F5C500" }}
                disabled={selected.length===0}
                onClick={()=>onSuggestionsLoaded(selected.map(i=>suggestions[i]))}>
                Load {selected.length} Goals into Form →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
