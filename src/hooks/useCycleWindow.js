import { useState, useEffect } from "react";
import { getCycleConfig } from "../firebase/db";

const DEFAULT_CYCLES = [
  { id:"goal_setting", label:"Goal Setting",  period:"01 May – 31 May", status:"completed" },
  { id:"q1",           label:"Q1 Check-in",   period:"01 Jul – 31 Jul", status:"completed" },
  { id:"q2",           label:"Q2 Check-in",   period:"01 Oct – 31 Dec", status:"active"    },
  { id:"q3",           label:"Q3 Check-in",   period:"01 Jan – 31 Jan", status:"upcoming"  },
  { id:"q4",           label:"Q4 / Annual",   period:"01 Mar – 30 Apr", status:"upcoming"  },
];

export function useCycleWindow() {
  const [cycles, setCycles] = useState(DEFAULT_CYCLES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCycleConfig().then(cfg => {
      if (cfg?.cycles) setCycles(cfg.cycles);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeCycle       = cycles.find(c => c.status === "active");
  // eslint-disable-next-line no-unused-vars
  const goalSettingOpen   = activeCycle?.id === "goal_setting";
  const checkInOpen       = activeCycle && activeCycle.id !== "goal_setting";
  const canSubmitGoals    = true; // always allow draft creation
  const canLogCheckIn     = !!checkInOpen;
  const activeLabel       = activeCycle?.label || "No Active Window";
  const activePeriod      = activeCycle?.period || "";

  return { cycles, activeCycle, canSubmitGoals, canLogCheckIn, activeLabel, activePeriod, loading };
}
