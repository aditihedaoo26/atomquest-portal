import React, { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const KPI_STRIP = [
  { label:"Employees Tracked", value:"1,248" },
  { label:"Goals Active",      value:"6,842" },
  { label:"Avg Completion",    value:"74%"   },
  { label:"Check-ins Done",    value:"3,291" },
];

const ROLES = [
  { key:"employee", label:"Employee",    name:"Riya Sharma",  email:"employee@atomquest.com", desc:"Create goals, log achievements, track progress.", initials:"RS" },
  { key:"manager",  label:"Manager L1",  name:"Arjun Mehta",  email:"manager@atomquest.com",  desc:"Approve goals, conduct check-ins, manage team.", initials:"AM" },
  { key:"admin",    label:"Admin / HR",  name:"Priya Nair",   email:"admin@atomquest.com",    desc:"Manage cycles, audit logs, org-wide visibility.", initials:"PN" },
];

function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;

    const dots = Array.from({length:40}, () => ({
      angle: Math.random()*Math.PI*2,
      r: 60 + Math.random()*80,
      speed: (Math.random()-0.5)*0.003,
      size: Math.random()*1.5+0.5,
      opacity: Math.random()*0.5+0.2,
    }));

    let frame;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      dots.forEach(d => {
        d.angle += d.speed;
        const x = cx + Math.cos(d.angle)*d.r;
        const y = cy + Math.sin(d.angle)*d.r;
        ctx.beginPath();
        ctx.arc(x, y, d.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(245,196,0,${d.opacity})`;
        ctx.fill();
        // connect nearby dots
        dots.forEach(d2 => {
          const x2 = cx + Math.cos(d2.angle)*d2.r;
          const y2 = cy + Math.sin(d2.angle)*d2.r;
          const dist = Math.hypot(x-x2, y-y2);
          if (dist < 60) {
            ctx.beginPath();
            ctx.moveTo(x,y); ctx.lineTo(x2,y2);
            ctx.strokeStyle = `rgba(245,196,0,${0.06*(1-dist/60)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} />;
}

export default function LoginPage() {
  const { login } = useAuth();
  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", fontFamily:"'Inter',sans-serif", position:"relative", overflow:"hidden" }}>
      {/* Grid */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(38,38,38,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(38,38,38,0.5) 1px,transparent 1px)", backgroundSize:"40px 40px", opacity:0.3, pointerEvents:"none" }} />
      {/* Ambient glow */}
      <div style={{ position:"fixed", top:"20%", left:"50%", transform:"translateX(-50%)", width:"600px", height:"400px", background:"radial-gradient(ellipse,rgba(245,196,0,0.04) 0%,transparent 70%)", pointerEvents:"none" }} />

      {/* Logo section */}
      <div style={{ textAlign:"center", marginBottom:"36px", position:"relative" }}>
        {/* Particle canvas */}
        <div style={{ position:"relative", width:"180px", height:"180px", margin:"0 auto 16px" }}>
          <ParticleCanvas />
          {/* Center mark */}
          <div style={{
            position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
            width:"56px", height:"56px", background:"#F5C400",
            borderRadius:"13px", display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:"26px", color:"#0A0A0A",
            boxShadow:"0 0 32px rgba(245,196,0,0.4), 0 0 64px rgba(245,196,0,0.15)",
            animation:"logoGlow 3s ease-in-out infinite",
          }}>a</div>
        </div>

        <div style={{ fontSize:"22px", fontWeight:900, color:"#F5F5F5", letterSpacing:"-0.05em", marginBottom:"6px" }}>
          atom<span style={{color:"#F5C400"}}>Align</span>
        </div>
        <div style={{ fontSize:"11px", fontWeight:600, color:"#52525B", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:"4px" }}>
          AI Performance Operating System
        </div>
        <div style={{ fontSize:"10px", color:"#3F3F46" }}>AtomQuest Hackathon 1.0</div>
      </div>

      {/* KPI strip */}
      <div style={{ display:"flex", gap:0, border:"1px solid #262626", borderRadius:"8px", background:"#151515", overflow:"hidden", marginBottom:"28px" }}>
        {KPI_STRIP.map((k,i) => (
          <div key={k.label} style={{ padding:"11px 18px", borderRight:i<KPI_STRIP.length-1?"1px solid #262626":"none", textAlign:"center", minWidth:"110px" }}>
            <div style={{ fontSize:"18px", fontWeight:900, color:"#F5F5F5", letterSpacing:"-0.05em", lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:"9px", color:"#52525B", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.09em", marginTop:"4px" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Role label */}
      <div style={{ fontSize:"9px", fontWeight:700, color:"#3F3F46", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:"10px" }}>Select role to continue</div>

      {/* Role cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,220px)", gap:"8px", marginBottom:"28px" }}>
        {ROLES.map(role => (
          <button key={role.key} onClick={() => login(role.key)}
            style={{ background:"#151515", border:"1px solid #262626", borderRadius:"9px", padding:"18px 16px", cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", gap:"10px", transition:"all 0.18s cubic-bezier(0.4,0,0.2,1)", boxShadow:"none" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(245,196,0,0.3)"; e.currentTarget.style.background="#1A1A1A"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(245,196,0,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#262626"; e.currentTarget.style.background="#151515"; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ width:"32px", height:"32px", background:"rgba(245,196,0,0.1)", border:"1px solid rgba(245,196,0,0.2)", borderRadius:"7px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:800, color:"#F5C400" }}>{role.initials}</div>
            <div>
              <div style={{ fontSize:"8.5px", fontWeight:700, color:"#52525B", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"3px" }}>{role.label}</div>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#F5F5F5", marginBottom:"2px", letterSpacing:"-0.02em" }}>{role.name}</div>
              <div style={{ fontSize:"10px", color:"#3F3F46" }}>{role.email}</div>
            </div>
            <div style={{ fontSize:"11.5px", color:"#71717A", lineHeight:1.5 }}>{role.desc}</div>
            <div style={{ fontSize:"11px", fontWeight:700, color:"rgba(245,196,0,0.7)", marginTop:"2px" }}>Enter Portal →</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize:"10px", color:"#27272A" }}>© 2025 AtomQuest · Hackathon 1.0</div>

      <style>{`
        @keyframes logoGlow {
          0%,100% { box-shadow: 0 0 32px rgba(245,196,0,0.4), 0 0 64px rgba(245,196,0,0.15); }
          50%      { box-shadow: 0 0 48px rgba(245,196,0,0.6), 0 0 96px rgba(245,196,0,0.25); }
        }
      `}</style>
    </div>
  );
}
