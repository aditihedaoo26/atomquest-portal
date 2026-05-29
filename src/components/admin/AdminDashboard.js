import React, { useEffect, useState } from "react";
import { getAllGoals, getAllAuditLogs, getAllCheckIns, updateGoal, addAuditLog } from "../../firebase/db";
import { useAuth } from "../../context/AuthContext";
import { computeScore, computeAnnualScore, getScoreColor, getScoreLabel, exportToCSV, formatDate, formatTime, STATUS_META } from "../../utils/helpers";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard({ refresh, activeTab }) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3000);
    (async () => {
      const [g, l] = await Promise.all([getAllGoals(), getAllAuditLogs()]);
      setGoals(g); setLogs(l);
      clearTimeout(t); setLoading(false);
    })();
  }, [refresh]);

  const handleUnlock = async (goal) => {
    setUnlocking(goal.id);
    await updateGoal(goal.id, { locked:false, submissionStatus:"pending" });
    await addAuditLog({ user:currentUser.name, role:"admin", action:"Unlocked goal", detail:`"${goal.title}" — ${goal.employeeName}` });
    const g = await getAllGoals(); setGoals(g);
    setUnlocking(null);
  };

  const handleExport = () => {
    const rows = goals.map(g => {
      const score = g.achievement ? computeScore(g.uom,g.target,g.achievement) : null;
      return {
        "Employee Name":              g.employeeName || "",
        "Department":                 g.department || "",
        "Goal Title":                 g.title || "",
        "Thrust Area":                g.thrustArea || "",
        "Unit of Measurement (UoM)":  g.uom || "",
        "Planned Target":             g.target || "",
        "Actual Achievement":         g.achievement || "",
        "Weightage (%)":              g.weightage || "",
        "Progress Score (%)":         score ? score.toFixed(1) : "",
        "Score Label":                score ? getScoreLabel(score) : "",
        "Approval Status":            g.submissionStatus || "",
        "Check-in Status":            g.checkInStatus || "",
        "Confidence Level":           g.confidence || "",
        "Self Rating (1-5)":          g.selfRating || "",
        "Self Comment":               g.selfComment || "",
        "Manager Check-in Comment":   g.managerCheckInComment || "",
        "Manager":                    g.reviewedBy || "",
        "Goal Locked":                g.locked ? "Yes" : "No",
        "Is Shared Goal":             g.isShared ? "Yes" : "No",
        "Quarter":                    g.quarter || "Q2",
      };
    });
    exportToCSV(rows, "atomalign-achievement-report.csv");
  };

  // Computed stats
  const total      = goals.length;
  const approved   = goals.filter(g => g.submissionStatus==="approved").length;
  const pending    = goals.filter(g => g.submissionStatus==="pending").length;
  const changes    = goals.filter(g => g.submissionStatus==="changes_needed").length;
  const locked     = goals.filter(g => g.locked).length;
  const withData   = goals.filter(g => g.achievement).length;
  const employees  = [...new Set(goals.map(g=>g.employeeName).filter(Boolean))];
  const checkedIn  = [...new Set(goals.filter(g=>g.achievement).map(g=>g.employeeName))];

  // Per-employee completion
  const byEmp = goals.reduce((acc,g) => {
    if (!g.employeeName) return acc;
    if (!acc[g.employeeName]) acc[g.employeeName]={ total:0, approved:0, withData:0, goals:[] };
    acc[g.employeeName].total++;
    if (g.submissionStatus==="approved") acc[g.employeeName].approved++;
    if (g.achievement) acc[g.employeeName].withData++;
    acc[g.employeeName].goals.push(g);
    return acc;
  },{});

  const pieData = [
    { name:"Approved",       value:approved,                      color:"#16A34A" },
    { name:"Pending",        value:pending,                       color:"#D97706" },
    { name:"Changes Needed", value:changes,                       color:"#DC2626" },
    { name:"Draft",          value:goals.filter(g=>g.submissionStatus==="draft").length, color:"#AAA" },
  ].filter(d=>d.value>0);

  const barData = Object.entries(byEmp).map(([name,d])=>({
    name: name.split(" ")[0],
    approved: d.approved,
    pending: d.total - d.approved,
  }));

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"10px" }}>
        {[1,2,3,4,5].map(i=><div key={i} className="skeleton" style={{height:"80px",borderRadius:"8px"}} />)}
      </div>
    </div>
  );

  // ── OVERVIEW TAB ──
  if (activeTab === "overview" || !activeTab) return (
    <div>
      {/* Stats row */}
      <div className="stat-row" style={{ marginBottom:"14px" }}>
        {[
          { label:"Total Goals",    value:total,   accent:false },
          { label:"Approved",       value:approved, accent:true },
          { label:"Pending Review", value:pending,  accent:false, alert:pending>0 },
          { label:"Changes Needed", value:changes,  accent:false, alert:changes>0 },
          { label:"Check-ins Done", value:`${checkedIn.length}/${employees.length}`, accent:false },
        ].map(s=>(
          <div key={s.label} className={`stat-cell ${s.accent?"stat-cell-accent":""}`}>
            <div className="stat-cell-label">{s.label}</div>
            <div className="stat-cell-value" style={{color:s.alert&&(s.value>0)?"#DC2626":"var(--ink)"}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:"12px", marginBottom:"12px" }}>
        {/* Pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">Goal Status</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} dataKey="value" paddingAngle={2}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{background:"#151515",border:"1px solid #262626",borderRadius:"6px",fontSize:"11px",color:"#F5F5F5"}} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", justifyContent:"center" }}>
              {pieData.map(d=>(
                <div key={d.name} style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"10.5px", color:"#555" }}>
                  <div style={{width:"7px",height:"7px",borderRadius:"2px",background:d.color}} />
                  {d.name}: <strong>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar */}
        <div className="card">
          <div className="card-header"><span className="card-title">Goals per Employee</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{top:4,right:8,left:-20,bottom:0}}>
                <XAxis dataKey="name" tick={{fontSize:11,fill:"#AAA"}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:11,fill:"#AAA"}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{background:"#151515",border:"1px solid #262626",borderRadius:"6px",fontSize:"11px",color:"#F5F5F5"}} />
                <Bar dataKey="approved" name="Approved" fill="#16A34A" radius={[3,3,0,0]} />
                <Bar dataKey="pending"  name="Pending"  fill="#FFC400" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee completion table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Employee Completion Status</span>
          <button className="btn btn-outline btn-sm" onClick={handleExport}>↓ Export CSV</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Goals</th>
              <th>Approved</th>
              <th>Check-ins</th>
              <th>Annual Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byEmp).map(([name,d])=>{
              const annual = computeAnnualScore(d.goals);
              const complete = d.withData === d.approved && d.approved > 0;
              return (
                <tr key={name}>
                  <td style={{fontWeight:600}}>{name}</td>
                  <td className="mono">{d.total}</td>
                  <td className="mono">{d.approved}</td>
                  <td className="mono">{d.withData}/{d.approved}</td>
                  <td>
                    <span style={{fontWeight:800,color:getScoreColor(annual),fontFamily:"'JetBrains Mono',monospace"}}>
                      {annual > 0 ? annual+"%" : "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${complete?"badge-green":d.withData>0?"badge-yellow":"badge-gray"}`}>
                      {complete?"Complete":d.withData>0?"In Progress":"Not Started"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── GOALS TAB ──
  if (activeTab === "goals") return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
        <div>
          <div className="page-title">All Goals</div>
          <div className="page-subtitle">{total} goals · {locked} locked · Click unlock to allow re-editing</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleExport}>↓ Export CSV</button>
      </div>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Goal</th>
              <th>Thrust Area</th>
              <th>Weight</th>
              <th>Target</th>
              <th>Achievement</th>
              <th>Score</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {goals.map(g=>{
              const score = g.achievement ? computeScore(g.uom,g.target,g.achievement) : null;
              const sm = STATUS_META[g.submissionStatus] || STATUS_META.draft;
              return (
                <tr key={g.id}>
                  <td style={{fontWeight:600,fontSize:"11.5px"}}>{g.employeeName}</td>
                  <td style={{maxWidth:"180px"}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{g.title}</div></td>
                  <td style={{fontSize:"11px",color:"#777"}}>{g.thrustArea}</td>
                  <td className="mono">{g.weightage}%</td>
                  <td className="mono">{g.target}</td>
                  <td className="mono" style={{color:g.achievement?"#111":"#CCC"}}>{g.achievement||"—"}</td>
                  <td><span style={{fontWeight:800,color:score?getScoreColor(score):"#CCC",fontFamily:"'JetBrains Mono',monospace"}}>{score?score.toFixed(0)+"%":"—"}</span></td>
                  <td><span style={{background:sm.bg,color:sm.color,border:`1px solid ${sm.border}`,borderRadius:"4px",padding:"2px 6px",fontSize:"9.5px",fontWeight:700,textTransform:"uppercase"}}>{sm.label}</span></td>
                  <td>
                    {g.locked && (
                      <button onClick={()=>handleUnlock(g)} disabled={unlocking===g.id}
                        style={{background:"#F0F0F0",border:"1px solid #E5E5E5",color:"#555",borderRadius:"4px",padding:"2px 8px",cursor:"pointer",fontSize:"10px",fontWeight:600,fontFamily:"'Inter',sans-serif"}}>
                        {unlocking===g.id?"...":"🔓 Unlock"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── AUDIT TAB ──
  if (activeTab === "audit") return (
    <div>
      <div style={{ marginBottom:"14px" }}>
        <div className="page-title">Audit Logs</div>
        <div className="page-subtitle">{logs.length} entries — every action automatically logged</div>
      </div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Time</th><th>User</th><th>Role</th><th>Action</th><th>Detail</th></tr></thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} style={{textAlign:"center",padding:"28px",color:"#AAA",fontSize:"12px"}}>No logs yet. Actions will appear here as users interact.</td></tr>
            ) : logs.map(log=>(
              <tr key={log.id}>
                <td style={{fontSize:"10.5px",color:"#AAA",whiteSpace:"nowrap"}}>{formatDate(log.timestamp)}</td>
                <td style={{fontWeight:600}}>{log.user}</td>
                <td>
                  <span style={{
                    background:log.role==="admin"?"#FFFBEB":log.role==="manager"?"#EFF6FF":"#F5F5F5",
                    color:log.role==="admin"?"#D97706":log.role==="manager"?"#2563EB":"#555",
                    borderRadius:"4px",padding:"2px 6px",fontSize:"9.5px",fontWeight:700,textTransform:"uppercase",
                  }}>{log.role}</span>
                </td>
                <td style={{fontWeight:500}}>{log.action}</td>
                <td style={{fontSize:"11px",color:"#777",maxWidth:"240px"}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{log.detail}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return null;
}
