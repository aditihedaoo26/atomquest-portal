import React from "react";
import { useAuth } from "../../context/AuthContext";

const NAV = {
  employee: [
    { section:"GOALS", items:[
      { key:"dashboard",   label:"Dashboard",      icon:"⊞" },
      { key:"mygoals",     label:"My Goals",        icon:"◎" },
      { key:"create",      label:"Create Goals",    icon:"+" },
      { key:"weights",     label:"Weight Manager",  icon:"⚖" },
    ]},
    { section:"CHECK-INS", items:[
      { key:"initiatives", label:"Initiatives",     icon:"⚡" },
      { key:"selfassess",  label:"Self Assessment", icon:"★" },
    ]},
  ],
  manager: [
    { section:"TEAM", items:[
      { key:"dashboard",   label:"Dashboard",       icon:"⊞" },
      { key:"approvals",   label:"Goal Approvals",  icon:"✓" },
      { key:"checkins",    label:"Team Check-ins",  icon:"◉" },
      { key:"shared",      label:"Shared Goals",    icon:"⇉" },
      { key:"team",        label:"Team Progress",   icon:"◈" },
    ]},
  ],
  admin: [
    { section:"ADMIN", items:[
      { key:"overview",    label:"Overview",         icon:"⊞" },
      { key:"goals",       label:"All Goals",        icon:"◎" },
      { key:"cycles",      label:"Cycle Management", icon:"○" },
      { key:"audit",       label:"Audit Logs",       icon:"≡" },
    ]},
  ],
};

export default function Sidebar({ activeTab, setActiveTab }) {
  const { currentUser, logout, switchRole } = useAuth();
  if (!currentUser) return null;
  const nav = NAV[currentUser.role] || [];

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-lockup">
          <div className="sidebar-logo-mark">a</div>
          <div>
            <div className="sidebar-logo-text">atom<span>Align</span></div>
            <div className="sidebar-tagline">"Why not?"</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {nav.map(section => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map(item => (
              <div key={item.key}
                className={`sidebar-item ${activeTab === item.key ? "active" : ""}`}
                onClick={() => setActiveTab(item.key)}>
                <span className="icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        ))}

        {/* Switch role */}
        <div style={{ padding:"14px 18px 6px" }}>
          <div className="sidebar-section-label" style={{padding:0, marginBottom:"6px"}}>SWITCH ROLE</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
            {["employee","manager","admin"].filter(r => r !== currentUser.role).map(r => (
              <button key={r} className="switch-role-btn" onClick={() => switchRole(r)}>
                → {r}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{currentUser.avatar}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="user-name" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentUser.name}</div>
            <div className="user-role">{currentUser.role}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
