import React, { useState } from "react";
import Sidebar from "../shared/Sidebar";
import GoalForm from "./GoalForm";
import GoalLifecycle from "./GoalLifecycle";
import EmployeeDashboard from "./EmployeeDashboard";
import SelfAssessment from "./SelfAssessment";
import Initiatives from "./Initiatives";
import WeightManager from "./WeightManager";
import NotificationCenter from "../shared/NotificationCenter";
import { useAuth } from "../../context/AuthContext";

const TITLES = {
  dashboard:"Dashboard", mygoals:"My Goals", create:"Create Goals",
  weights:"Weight Manager", initiatives:"Initiatives", selfassess:"Self Assessment"
};

export default function EmployeePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refresh, setRefresh] = useState(0);
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
          {activeTab==="dashboard"   && <EmployeeDashboard refresh={refresh} setActiveTab={setActiveTab} />}
          {activeTab==="mygoals"     && <GoalLifecycle setActiveTab={setActiveTab} />}
          {activeTab==="create"      && <GoalForm onSaved={()=>{setRefresh(r=>r+1);setActiveTab("mygoals");}} />}
          {activeTab==="weights"     && <WeightManager refresh={refresh} />}
          {activeTab==="initiatives" && <Initiatives refresh={refresh} />}
          {activeTab==="selfassess"  && <SelfAssessment refresh={refresh} />}
        </div>
      </div>
    </div>
  );
}
