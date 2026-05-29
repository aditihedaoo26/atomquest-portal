import React from "react";
import { useAuth } from "../../context/AuthContext";

const roleColors = {
  employee: "#0ea5e9",
  manager: "#8b5cf6",
  admin: "#f59e0b",
};

const roleLabels = {
  employee: "Employee",
  manager: "Manager L1",
  admin: "Admin / HR",
};

export default function Navbar({ activeTab, setActiveTab, tabs }) {
  const { currentUser, logout, switchRole } = useAuth();
  if (!currentUser) return null;

  const color = roleColors[currentUser.role];

  return (
    <nav style={{
      background: "#1e293b",
      borderBottom: "1px solid #334155",
      padding: "0 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "60px",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1.5rem",
      }}>
        <div style={{
          background: `linear-gradient(135deg, #0ea5e9, #8b5cf6)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          fontSize: "1.25rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 700,
        }}>
          ⚛ AtomAlign
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? `${color}22` : "transparent",
                border: activeTab === tab.key ? `1px solid ${color}55` : "1px solid transparent",
                color: activeTab === tab.key ? color : "#64748b",
                padding: "0.35rem 0.85rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif",
                transition: "all 0.2s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Role badge */}
        <div style={{
          background: `${color}22`, border: `1px solid ${color}55`,
          borderRadius: "999px", padding: "0.2rem 0.75rem",
          fontSize: "0.7rem", color: color, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          {roleLabels[currentUser.role]}
        </div>

        {/* Avatar */}
        <div style={{
          width: "36px", height: "36px",
          background: `linear-gradient(135deg, ${color}, ${color}88)`,
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem", fontWeight: 700, color: "white",
        }}>
          {currentUser.avatar}
        </div>

        {/* Switch role */}
        <div style={{ display: "flex", gap: "0.35rem" }}>
          {["employee", "manager", "admin"].filter(r => r !== currentUser.role).map(r => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              title={`Switch to ${r}`}
              style={{
                background: "#0f172a", border: "1px solid #334155",
                color: "#64748b", padding: "0.25rem 0.6rem",
                borderRadius: "6px", cursor: "pointer",
                fontSize: "0.7rem", fontFamily: "'DM Sans',sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f1f5f9"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; }}
            >
              → {r}
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          style={{
            background: "transparent", border: "1px solid #334155",
            color: "#64748b", padding: "0.3rem 0.75rem",
            borderRadius: "8px", cursor: "pointer",
            fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
