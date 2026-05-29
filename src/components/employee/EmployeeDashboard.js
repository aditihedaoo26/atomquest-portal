import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getGoalsByEmployee } from "../../firebase/db";
import { computeScore, getScoreColor, getScoreLabel } from "../../utils/helpers";
import GoalHealthScore from "../shared/GoalHealthScore";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const SCHEDULE = [
  { label:"Goal Setting",  date:"01 May – 31 May 2024",  status:"completed" },
  { label:"Q1 Check-in",   date:"01 Jul – 31 Jul 2024",  status:"completed" },
  { label:"Q2 Check-in",   date:"01 Oct – 31 Dec 2024",  status:"active"    },
  { label:"Q3 Check-in",   date:"01 Jan – 31 Jan 2025",  status:"upcoming"  },
  { label:"Q4 / Annual",   date:"01 Mar – 30 Apr 2025",  status:"upcoming"  },
];
const DOT_COLOR = { completed:"#16A34A", active:"#FFC400", upcoming:"#CCCCCC" };
const STATUS_BADGE = {
  completed: <span className="badge badge-green">Done</span>,
  active:    <span style={{ background:"#FFC400", color:"#111", padding:"2px 7px", borderRadius:"4px", fontSize:"9.5px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>Active</span>,
  upcoming:  <span className="badge badge-gray">Soon</span>,
};
const ACTIVITY = [
  { icon:"✅", bg:"#F0FDF4", text:"Goal 'Reduce Customer Complaints' updated — achievement logged", time:"2h ago" },
  { icon:"📅", bg:"#EFF6FF", text:"Q2 Check-in window is now active. Deadline: 31 Dec 2024", time:"1d ago" },
  { icon:"💬", bg:"#FAF5FF", text:"Manager commented on 'Improve NPS Score'", time:"2d ago" },
  { icon:"✓",  bg:"#F0FDF4", text:"'Increase Online Sales Revenue' approved by Arjun Mehta", time:"5d ago" },
];

function SkeletonRow() {
  return (
    <tr>
      {[180,50,60,60,90,60].map((w,i) => (
        <td key={i} style={{padding:"10px 14px"}}>
          <div className="skeleton" style={{height:"12px", width:`${w}px`}} />
        </td>
      ))}
    </tr>
  );
}

export default function EmployeeDashboard({ refresh, setActiveTab }) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 3000);
    (async () => {
      const data = await getGoalsByEmployee(currentUser.id);
      setGoals(data);
      clearTimeout(t);
      setLoading(false);
    })();
  }, [refresh]);

  const approved  = goals.filter(g => g.submissionStatus === "approved");
  const withData  = approved.filter(g => g.achievement);
  const scores    = withData.map(g => computeScore(g.uom, g.target, g.achievement));
  const avg       = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
  const pending   = goals.filter(g => g.submissionStatus === "pending").length;

  const trendData = [
    { q:"Q1", score:42 },
    { q:"Q2", score:Math.round(avg) || 68 },
    { q:"Q3", score:null },
    { q:"Q4", score:null },
  ];

  return (
    <div className="animate-in">
      {/* Cycle banner */}
      <div className="cycle-banner">
        <div>
          <div className="cycle-banner-label">Current Period</div>
          <div className="cycle-banner-title">Q2 Check-in Window</div>
          <div className="cycle-banner-period">01 Oct – 31 Dec 2024 · 14 days remaining</div>
        </div>
        <button className="btn btn-yellow btn-sm" onClick={() => setActiveTab("mygoals")}>
          Log Achievement →
        </button>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        {[
          { label:"My Goals", value:`${goals.length}/8`, sub:"Active Goals", icon:"🎯" },
          { label:"Avg Progress", value:`${Math.round(avg)}%`, sub:"Overall Achievement", icon:"📊", color: avg>=70?"#16A34A":avg>=50?"#D97706":"#DC2626" },
          { label:"Check-ins Done", value:`${withData.length}/${approved.length}`, sub:"This Quarter", icon:"📅" },
          { label:"Pending Actions", value:pending, sub:"Needs Attention", icon:"⚠️", color:pending>0?"#DC2626":undefined },
        ].map(k => (
          <div key={k.label} className="kpi-card" onClick={k.label==="Pending Actions"?()=>setActiveTab("mygoals"):undefined} style={{cursor:k.label==="Pending Actions"?"pointer":"default"}}>
            <div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{color:k.color||"var(--ink)"}}>{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
            <div className="kpi-icon">{k.icon}</div>
          </div>
        ))}
      </div>

      {/* Health Score — HERO */}
      <div style={{marginBottom:"12px"}}>
        <GoalHealthScore goals={goals} />
      </div>

      {/* Main grid */}
      <div className="content-grid">
        {/* Left */}
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

          {/* Goal progress table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Goal Progress Overview</span>
              <span className="card-action" onClick={()=>setActiveTab("mygoals")}>View All →</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Goal Title</th>
                  <th>UoM</th>
                  <th>Target</th>
                  <th>Achievement</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3].map(i => <SkeletonRow key={i} />)
                ) : approved.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:"center",padding:"28px",color:"var(--gray-400)",fontSize:"12px"}}>
                    No approved goals yet. <span style={{color:"#FFC400",cursor:"pointer",fontWeight:600}} onClick={()=>setActiveTab("create")}>Create goals →</span>
                  </td></tr>
                ) : approved.map(g => {
                  const s = computeScore(g.uom, g.target, g.achievement);
                  const col = s>=90?"green":s>=60?"":s>=40?"orange":"red";
                  const lbl = g.achievement ? getScoreLabel(s) : "Not Started";
                  const bcls = s>=90?"badge-green":s>=60?"badge-yellow":s>=40?"badge-orange":g.achievement?"badge-red":"badge-gray";
                  return (
                    <tr key={g.id}>
                      <td style={{fontWeight:600, maxWidth:"200px"}}>
                        <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.title}</div>
                      </td>
                      <td><span style={{fontSize:"10px",fontWeight:700,color:"var(--gray-400)",textTransform:"uppercase"}}>{g.uom}</span></td>
                      <td className="mono" style={{fontSize:"12px"}}>{g.target}</td>
                      <td className="mono" style={{fontSize:"12px",color:g.achievement?"var(--ink)":"var(--gray-300)"}}>{g.achievement||"—"}</td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                          <div className="prog-bar" style={{width:"72px"}}>
                            <div className={`prog-fill ${col}`} style={{width:`${Math.min(s,100)}%`}} />
                          </div>
                          <span style={{fontSize:"11px",fontWeight:700,color:getScoreColor(s),minWidth:"32px"}}>{g.achievement?s.toFixed(0)+"%":"—"}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${bcls}`}>{lbl}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Trend */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quarterly Progress Trend</span>
            </div>
            <div className="card-body" style={{padding:"12px 16px"}}>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={trendData} margin={{top:8,right:8,left:-24,bottom:0}}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FFC400" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#FFC400" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="q" tick={{fontSize:11,fill:"#AAA"}} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} tick={{fontSize:11,fill:"#AAA"}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:"#151515",border:"1px solid #262626",borderRadius:"6px",fontSize:"11px",color:"#F5F5F5"}} />
                  <Area type="monotone" dataKey="score" stroke="#FFC400" strokeWidth={2} fill="url(#areaGrad)" dot={{fill:"#FFC400",r:3,strokeWidth:0}} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          {/* Check-in schedule */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Check-in Schedule</span>
              <span className="card-action">Calendar →</span>
            </div>
            <div className="card-body" style={{padding:"8px 16px"}}>
              {SCHEDULE.map((item,i) => (
                <div key={i} className="timeline-item">
                  <div style={{display:"flex",alignItems:"center",gap:"8px",flex:1}}>
                    <div className="timeline-dot" style={{background:DOT_COLOR[item.status]}} />
                    <div>
                      <div className="timeline-label">{item.label}</div>
                      <div className="timeline-date">{item.date}</div>
                    </div>
                  </div>
                  {STATUS_BADGE[item.status]}
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Activity</span>
              <span className="card-action">View All →</span>
            </div>
            <div className="card-body" style={{padding:"6px 16px"}}>
              {ACTIVITY.map((a,i) => (
                <div key={i} className="activity-item">
                  <div className="activity-icon" style={{background:a.bg}}>{a.icon}</div>
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
