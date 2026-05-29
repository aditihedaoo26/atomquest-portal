import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getGoalsByManager } from "../../firebase/db";
import { computeScore, getScoreColor, getScoreLabel } from "../../utils/helpers";

export default function TeamDashboard({ refresh }) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
    const loadTimeout = setTimeout(() => setLoading(false), 3000);
      const data = await getGoalsByManager(currentUser.id);
      setGoals(data);
      clearTimeout(loadTimeout);
      setLoading(false);
    })();
  }, [refresh]);

  const byEmployee = goals.reduce((acc, g) => {
    if (!acc[g.employeeId]) acc[g.employeeId] = { name: g.employeeName, goals: [] };
    acc[g.employeeId].goals.push(g);
    return acc;
  }, {});

  const runAIAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    const summary = Object.entries(byEmployee).map(([id, { name, goals: empGoals }]) => {
      const approved = empGoals.filter(g => g.submissionStatus === "approved");
      const withData = approved.filter(g => g.achievement);
      const scores = withData.map(g => computeScore(g.uom, g.target, g.achievement));
      const avgScore = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null;
      return { name, totalGoals: approved.length, goalsWithData: withData.length, avgProgressScore: avgScore ? avgScore.toFixed(1) : "No data yet", goals: approved.map(g => ({ title: g.title, target: g.target, achievement: g.achievement || "Not logged", score: g.achievement ? computeScore(g.uom,g.target,g.achievement).toFixed(1)+"%" : "N/A", status: g.checkInStatus })) };
    });
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are an AI performance management assistant. Return ONLY a JSON object (no markdown, no backticks): {"riskFlags":[{"employee":string,"risk":"high"|"medium"|"low","reason":string,"recommendation":string}],"teamHealth":"good"|"moderate"|"at_risk","summary":string,"quickWins":[string]}`,
          messages: [{ role: "user", content: `Analyze this team goal data:\n${JSON.stringify(summary, null, 2)}` }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setAiInsights(parsed);
    } catch(e) { setAiError("AI analysis failed. Check your API connection."); }
    setAiLoading(false);
  };

  const healthColor = { good:"#15803D", moderate:"#854D0E", at_risk:"#991B1B" };
  const healthBg = { good:"#DCFCE7", moderate:"#FEF9C3", at_risk:"#FEE2E2" };
  const riskColor = { high:"#991B1B", medium:"#854D0E", low:"#15803D" };
  const riskBg = { high:"#FEE2E2", medium:"#FEF9C3", low:"#DCFCE7" };

  if (loading) return <div style={{textAlign:"center",padding:"4rem",color:"#999",fontSize:"0.85rem"}}>Loading team data...</div>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem"}}>
        <div>
          <h2 style={{fontSize:"1.1rem",fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Team Dashboard</h2>
          <p style={{fontSize:"0.8rem",color:"#777",marginTop:"0.25rem"}}>Real-time progress across your team's goals</p>
        </div>
        <button onClick={runAIAnalysis} disabled={aiLoading} className="btn btn-primary"
          style={{background: aiLoading?"#EEE":"#111",color:aiLoading?"#999":"#F5C500",display:"flex",alignItems:"center",gap:"0.5rem"}}>
          {aiLoading ? "⚙ Analysing..." : "🤖 AI Risk Analysis"}
        </button>
      </div>

      {/* AI Insights */}
      {aiError && (
        <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:"8px",padding:"1rem",marginBottom:"1.25rem",color:"#991B1B",fontSize:"0.82rem"}}>
          ⚠ {aiError}
        </div>
      )}
      {aiInsights && (
        <div style={{background:"#fff",border:"1.5px solid #EBEBEB",borderRadius:"10px",padding:"1.5rem",marginBottom:"1.25rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
            <div style={{fontWeight:700,fontSize:"0.95rem"}}>🤖 AI Risk Analysis</div>
            <span className="badge" style={{background:healthBg[aiInsights.teamHealth],color:healthColor[aiInsights.teamHealth]}}>
              Team Health: {aiInsights.teamHealth?.replace("_"," ").toUpperCase()}
            </span>
          </div>
          <p style={{color:"#555",fontSize:"0.82rem",marginBottom:"1rem",lineHeight:1.6}}>{aiInsights.summary}</p>
          <div style={{display:"flex",flexDirection:"column",gap:"0.65rem",marginBottom:"1rem"}}>
            {aiInsights.riskFlags?.map((flag,i) => (
              <div key={i} style={{background:riskBg[flag.risk],border:`1px solid ${riskColor[flag.risk]}33`,borderRadius:"8px",padding:"0.85rem 1rem",display:"flex",gap:"1rem",alignItems:"flex-start"}}>
                <span className="badge" style={{background:riskColor[flag.risk],color:"#fff",flexShrink:0}}>{flag.risk.toUpperCase()} RISK</span>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.82rem",color:"#111"}}>{flag.employee}</div>
                  <div style={{color:"#555",fontSize:"0.78rem",marginTop:"0.2rem"}}>{flag.reason}</div>
                  <div style={{color:"#854D0E",fontSize:"0.78rem",marginTop:"0.3rem"}}>💡 {flag.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
          {aiInsights.quickWins?.length > 0 && (
            <div style={{background:"#FAFAFA",borderRadius:"6px",padding:"0.75rem 1rem"}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.4rem"}}>Quick Actions</div>
              {aiInsights.quickWins.map((w,i) => (
                <div key={i} style={{fontSize:"0.8rem",color:"#444",marginBottom:"0.25rem"}}>→ {w}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team cards */}
      {Object.keys(byEmployee).length === 0 ? (
        <div style={{background:"#fff",border:"1.5px dashed #EBEBEB",borderRadius:"10px",textAlign:"center",padding:"4rem",color:"#999"}}>
          <div style={{fontSize:"2.5rem",marginBottom:"1rem"}}>👥</div>
          <div style={{fontSize:"0.9rem"}}>No team goals found. Team members need to submit goals first.</div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1rem"}}>
          {Object.entries(byEmployee).map(([empId,{name,goals:empGoals}]) => {
            const approved = empGoals.filter(g=>g.submissionStatus==="approved");
            const withData = approved.filter(g=>g.achievement);
            const scores = withData.map(g=>computeScore(g.uom,g.target,g.achievement));
            const avg = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
            const pending = empGoals.filter(g=>g.submissionStatus==="pending").length;
            return (
              <div key={empId} style={{background:"#fff",border:"1.5px solid #EBEBEB",borderRadius:"10px",padding:"1.25rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
                  <div style={{display:"flex",gap:"0.65rem",alignItems:"center"}}>
                    <div style={{width:"38px",height:"38px",background:"#111",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.72rem",fontWeight:800,color:"#F5C500"}}>
                      {name.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:"0.88rem",color:"#111"}}>{name}</div>
                      <div style={{fontSize:"0.72rem",color:"#999"}}>{approved.length} approved goals</div>
                    </div>
                  </div>
                  {pending>0&&<span className="badge badge-yellow">{pending} pending</span>}
                </div>
                {scores.length>0&&(
                  <div style={{marginBottom:"1rem"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.35rem"}}>
                      <span style={{fontSize:"0.72rem",color:"#999"}}>Avg Progress</span>
                      <span style={{fontSize:"0.78rem",fontWeight:700,color:getScoreColor(avg)}}>{avg.toFixed(0)}% — {getScoreLabel(avg)}</span>
                    </div>
                    <div className="prog-bar" style={{width:"100%"}}>
                      <div className="prog-fill" style={{width:`${Math.min(avg,100)}%`,background:getScoreColor(avg)}} />
                    </div>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                  {approved.slice(0,4).map(g=>{
                    const s=computeScore(g.uom,g.target,g.achievement);
                    return (
                      <div key={g.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.35rem 0.5rem",background:"#FAFAFA",borderRadius:"5px",fontSize:"0.75rem"}}>
                        <span style={{color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"160px"}}>{g.title}</span>
                        <span style={{fontWeight:700,color:g.achievement?getScoreColor(s):"#DDD",flexShrink:0}}>{g.achievement?`${s.toFixed(0)}%`:"—"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
