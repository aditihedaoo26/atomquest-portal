import React, { useState } from "react";
import Sidebar from "../shared/Sidebar";
import AdminDashboard from "./AdminDashboard";
import CycleManager from "./CycleManager";
import NotificationCenter from "../shared/NotificationCenter";
import { useAuth } from "../../context/AuthContext";

const TITLES = { overview:"Admin Overview", goals:"All Goals", cycles:"Cycle Management", audit:"Audit Logs" };

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [refresh] = useState(0);
  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">{TITLES[activeTab]}</div>
            <div className="topbar-subtitle">Organization-wide goal tracking &amp; governance</div>
          </div>
          <div className="topbar-right">
            <NotificationCenter />
            <button className="btn btn-outline btn-sm">↓ Export CSV</button>
          </div>
        </div>
        <div className="page-body animate-in">
          {activeTab!=="cycles" && <AdminDashboard refresh={refresh} activeTab={activeTab} />}
          {activeTab==="cycles" && <CycleManager />}
        </div>
      </div>
    </div>
  );
}
