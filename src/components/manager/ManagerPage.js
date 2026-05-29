import React, { useState } from "react";
import Sidebar from "../shared/Sidebar";
import ApprovalQueue from "./ApprovalQueue";
import TeamDashboard from "./TeamDashboard";
import ManagerCheckIn from "./ManagerCheckIn";
import SharedGoals from "./SharedGoals";
import NotificationCenter from "../shared/NotificationCenter";
import { useAuth } from "../../context/AuthContext";

const TITLES = {
  dashboard:"Team Dashboard",
  approvals:"Goal Approvals",
  checkins:"Team Check-ins",
  shared:"Shared Goals",
  team:"Team Progress",
};

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState("approvals");
  const [refresh] = useState(0);
  const { currentUser } = useAuth();
  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">{TITLES[activeTab]}</div>
            <div className="topbar-subtitle">Welcome back, {currentUser.name.split(" ")[0]}</div>
          </div>
          <div className="topbar-right">
            <NotificationCenter />
            <div className="quarter-pill">
              <span className="q-label">Active Window</span>
              <span>Q2 · Oct–Dec 2024</span>
            </div>
          </div>
        </div>
        <div className="page-body animate-in">
          {activeTab==="dashboard" && <TeamDashboard refresh={refresh} />}
          {activeTab==="approvals" && <ApprovalQueue />}
          {activeTab==="checkins"  && <ManagerCheckIn />}
          {activeTab==="shared"    && <SharedGoals />}
          {activeTab==="team"      && <TeamDashboard refresh={refresh} />}
        </div>
      </div>
    </div>
  );
}
