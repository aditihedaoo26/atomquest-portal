import React, { useEffect, useState, useRef } from "react";
import { computeScore } from "../../utils/helpers";

export function computeHealthScore(goals) {
  const approved = goals.filter(g => g.submissionStatus === "approved");
  if (!approved.length) return { score:0, label:"No Goals", color:"#52525B", breakdown:[], prediction:null, atRisk:[] };
  const withData = approved.filter(g => g.achievement);
  const scores   = withData.map(g => computeScore(g.uom, g.target, g.achievement));
  const progressScore   = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
  const checkInScore    = (withData.length/approved.length)*100;
  const submissionScore = (approved.length/Math.max(goals.length,1))*100;
  const health = (progressScore*0.5)+(checkInScore*0.3)+(submissionScore*0.2);
  const score  = Math.round(Math.min(health,100));
  const label  = score>=80?"Excellent":score>=65?"On Track":score>=45?"At Risk":"Critical";
  const color  = score>=80?"#22C55E":score>=65?"#F5C400":score>=45?"#F59E0B":"#EF4444";
  return {
    score, label, color,
    breakdown:[
      { label:"Goal Progress",   score:Math.round(progressScore),   weight:"50%" },
      { label:"Check-ins",       score:Math.round(checkInScore),    weight:"30%" },
      { label:"Submission Rate", score:Math.round(submissionScore), weight:"20%" },
    ],
    prediction: score<65 ? `At current pace, ${Math.max(1,Math.round((100-score)/12))} goal(s) at risk of year-end miss.` : null,
    atRisk: approved.filter(g => g.achievement && computeScore(g.uom,g.target,g.achievement) < 60),
  };
}

function AnimatedGauge({ score, color, size=120 }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 200);
    return () => clearTimeout(t);
  }, [score]);
  const r = 44; const circ = 2*Math.PI*r;
  const dash = (Math.min(displayed,100)/100)*circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* Track */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="#262626" strokeWidth="7" />
      {/* Glow ring */}
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7" strokeOpacity="0.15" />
      {/* Progress */}
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition:"stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)", filter:`drop-shadow(0 0 6px ${color})` }}
      />
      {/* Score text */}
      <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="900"
        fill={color} fontFamily="Inter,-apple-system,sans-serif" letterSpacing="-2">
        {displayed}
      </text>
      <text x="50" y="59" textAnchor="middle" fontSize="7.5" fill="#52525B"
        fontFamily="Inter,-apple-system,sans-serif" letterSpacing="1">
        / 100
      </text>
    </svg>
  );
}

function WaveformBar({ score, color }) {
  const bars = 24;
  return (
    <div style={{ display:"flex", gap:"2px", alignItems:"center", height:"20px" }}>
      {Array.from({length:bars},(_,i)=>{
        const h = Math.sin((i/bars)*Math.PI)*score/100;
        const opacity = 0.3 + h*0.7;
        return (
          <div key={i} style={{
            width:"2px", flex:1,
            height:`${Math.max(2, h*18)}px`,
            background:color, opacity, borderRadius:"1px",
            animation:`waveAnim ${0.8+i*0.05}s ease-in-out infinite alternate`,
            animationDelay:`${i*0.04}s`,
          }} />
        );
      })}
      <style>{`@keyframes waveAnim { from{transform:scaleY(0.6)} to{transform:scaleY(1.1)} }`}</style>
    </div>
  );
}

export default function GoalHealthScore({ goals }) {
  const [h, setH] = useState(null);
  useEffect(() => { setH(computeHealthScore(goals)); }, [goals]);
  if (!h) return null;

  // eslint-disable-next-line no-unused-vars
  const isHealthy  = h.score >= 65;
  const isCritical = h.score < 45;

  return (
    <div style={{
      background:"#151515", border:`1px solid ${h.color}30`,
      borderRadius:"8px", overflow:"hidden",
      boxShadow: isCritical ? `0 0 24px ${h.color}12` : `0 0 16px rgba(0,0,0,0.4)`,
      position:"relative",
    }}>
      {/* Scan line effect on critical */}
      {isCritical && (
        <div style={{
          position:"absolute", left:0, right:0, height:"2px",
          background:`linear-gradient(90deg,transparent,${h.color}60,transparent)`,
          animation:"scanLine 2s linear infinite", pointerEvents:"none", zIndex:10,
        }} />
      )}

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${h.color}18 0%, transparent 60%)`,
        borderBottom:`1px solid ${h.color}20`,
        padding:"8px 16px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
          <span style={{ fontSize:"10px", fontWeight:700, color:h.color, textTransform:"uppercase", letterSpacing:"0.1em" }}>
            Live Goal Health Score
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
          <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:h.color, animation:`pulse ${isCritical?"0.8s":"2s"} ease-in-out infinite`, boxShadow:`0 0 6px ${h.color}` }} />
          <span style={{ fontSize:"9px", fontWeight:700, color:h.color, opacity:0.7 }}>LIVE</span>
        </div>
      </div>

      <div style={{ padding:"16px 18px", display:"flex", gap:"20px", alignItems:"center" }}>
        {/* Gauge */}
        <div style={{ flexShrink:0, textAlign:"center" }}>
          <AnimatedGauge score={h.score} color={h.color} size={110} />
          <div style={{ fontSize:"12px", fontWeight:800, color:h.color, marginTop:"3px", letterSpacing:"-0.02em" }}>{h.label}</div>
          <div style={{ marginTop:"8px" }}>
            <WaveformBar score={h.score} color={h.color} />
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ flex:1 }}>
          {h.breakdown.map(b => {
            const bColor = b.score>=70?"#22C55E":b.score>=50?"#F59E0B":"#EF4444";
            return (
              <div key={b.label} style={{ marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                  <span style={{ fontSize:"11px", fontWeight:500, color:"#A1A1AA" }}>{b.label}</span>
                  <span style={{ fontSize:"11px", color:"#52525B" }}>{b.weight} · <strong style={{color:bColor}}>{b.score}</strong></span>
                </div>
                <div style={{ height:"3px", background:"#262626", borderRadius:"99px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${b.score}%`, background:bColor, borderRadius:"99px", transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)", boxShadow:`0 0 4px ${bColor}60` }} />
                </div>
              </div>
            );
          })}

          {/* AI Prediction */}
          {h.prediction && (
            <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"5px", padding:"8px 10px", display:"flex", gap:"6px" }}>
              <span style={{ fontSize:"11px", flexShrink:0 }}>⚠</span>
              <div>
                <span style={{ fontSize:"10.5px", fontWeight:700, color:"#EF4444" }}>AI Prediction: </span>
                <span style={{ fontSize:"10.5px", color:"rgba(239,68,68,0.8)" }}>{h.prediction}</span>
              </div>
            </div>
          )}

          {!h.prediction && h.score >= 65 && (
            <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:"5px", padding:"8px 10px", fontSize:"10.5px", color:"rgba(34,197,94,0.8)", display:"flex", gap:"5px", alignItems:"center" }}>
              <span>✓</span> On track to meet annual goals.
            </div>
          )}

          {h.atRisk?.length > 0 && (
            <div style={{ marginTop:"8px" }}>
              {h.atRisk.slice(0,2).map(g=>{
                const s = computeScore(g.uom,g.target,g.achievement);
                return (
                  <div key={g.id} style={{ display:"flex", justifyContent:"space-between", padding:"5px 8px", background:"rgba(239,68,68,0.06)", borderRadius:"4px", marginTop:"3px", border:"1px solid rgba(239,68,68,0.12)" }}>
                    <span style={{ fontSize:"10.5px", color:"#A1A1AA", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"180px" }}>{g.title}</span>
                    <span style={{ fontSize:"11px", fontWeight:800, color:"#EF4444", flexShrink:0 }}>{s.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 0%;   opacity:0.8; }
          100% { top: 100%; opacity:0; }
        }
      `}</style>
    </div>
  );
}
