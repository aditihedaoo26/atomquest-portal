import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./components/auth/LoginPage";
import EmployeePage from "./components/employee/EmployeePage";
import ManagerPage from "./components/manager/ManagerPage";
import AdminPage from "./components/admin/AdminPage";
import { seedDemoData } from "./firebase/seed";
import "./index.css";

function SplashScreen() {
  const [pct, setPct] = useState(8);
  const [step, setStep] = useState(0);
  const steps = ["Initialising systems...", "Connecting workspace...", "Loading intelligence..."];

  useEffect(() => {
    const t1 = setTimeout(() => { setPct(45); setStep(1); }, 500);
    const t2 = setTimeout(() => { setPct(82); setStep(2); }, 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      minHeight:"100vh", background:"#0A0A0A",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'Inter',-apple-system,sans-serif",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(38,38,38,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(38,38,38,0.4) 1px,transparent 1px)", backgroundSize:"40px 40px", opacity:0.25 }} />
      <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translateX(-50%)", width:"500px", height:"400px", background:"radial-gradient(ellipse,rgba(245,196,0,0.05) 0%,transparent 70%)", pointerEvents:"none" }} />

      <div style={{ position:"relative", textAlign:"center" }}>
        <div style={{
          width:"64px", height:"64px",
          background:"linear-gradient(135deg,#F5C400,#FFD740)",
          borderRadius:"16px",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, fontSize:"30px", color:"#0A0A0A",
          margin:"0 auto 20px",
          animation:"splashGlow 2.5s ease-in-out infinite",
        }}>a</div>

        <div style={{ fontSize:"22px", fontWeight:900, color:"#F5F5F5", letterSpacing:"-0.05em", marginBottom:"5px" }}>
          atom<span style={{color:"#F5C400"}}>Align</span>
        </div>
        <div style={{ fontSize:"9.5px", fontWeight:700, color:"#3F3F46", textTransform:"uppercase", letterSpacing:"0.16em", marginBottom:"32px" }}>
          AI Performance Operating System
        </div>

        {/* Progress bar */}
        <div style={{ width:"180px", height:"1px", background:"#1A1A1A", borderRadius:"99px", margin:"0 auto 12px", overflow:"hidden" }}>
          <div style={{ height:"100%", background:"#F5C400", borderRadius:"99px", width:`${pct}%`, transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)", boxShadow:"0 0 8px rgba(245,196,0,0.6)" }} />
        </div>

        <div style={{ fontSize:"10.5px", color:"#3F3F46", letterSpacing:"0.02em", height:"16px" }}>
          {steps[step]}
        </div>
      </div>

      <style>{`
        @keyframes splashGlow {
          0%,100% { box-shadow:0 0 24px rgba(245,196,0,0.3),0 0 48px rgba(245,196,0,0.1); }
          50%      { box-shadow:0 0 40px rgba(245,196,0,0.5),0 0 80px rgba(245,196,0,0.2); }
        }
      `}</style>
    </div>
  );
}

function AppRoutes() {
  const { currentUser } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const maxWait = setTimeout(() => setReady(true), 1800);
    seedDemoData().finally(() => { clearTimeout(maxWait); setReady(true); });
  }, []);

  if (!ready) return <SplashScreen />;
  if (!currentUser) return <LoginPage />;
  if (currentUser.role === "employee") return <EmployeePage />;
  if (currentUser.role === "manager")  return <ManagerPage />;
  if (currentUser.role === "admin")    return <AdminPage />;
  return <LoginPage />;
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
