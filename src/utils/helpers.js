// ── SCORE CALCULATION ──────────────────────────────────
export const computeScore = (uom, target, achievement) => {
  if (!target || achievement === "" || achievement === null || achievement === undefined) return 0;
  const t = parseFloat(target);
  const a = parseFloat(achievement);
  if (isNaN(t) || isNaN(a) || t === 0) return 0;
  switch (uom) {
    case "min":      return Math.min((a / t) * 100, 150);          // higher is better
    case "max":      return t === 0 ? 0 : Math.min((t / a) * 100, 150); // lower is better
    case "zero":     return a === 0 ? 100 : Math.max(0, 100 - (a * 20)); // zero = success
    case "timeline": return a <= t ? 100 : Math.max(0, 100 - ((a - t) * 10)); // days late penalty
    default:         return Math.min((a / t) * 100, 100);
  }
};

// Annual weighted score
export const computeAnnualScore = (goals) => {
  const approved = goals.filter(g => g.submissionStatus === "approved" && g.achievement);
  if (!approved.length) return 0;
  const totalWeight = approved.reduce((s, g) => s + (parseFloat(g.weightage) || 0), 0);
  if (!totalWeight) return 0;
  const weighted = approved.reduce((s, g) => {
    const score = computeScore(g.uom, g.target, g.achievement);
    return s + (score * (parseFloat(g.weightage) / totalWeight));
  }, 0);
  return Math.min(Math.round(weighted), 100);
};

export const getScoreColor = (score) => {
  if (score >= 90) return "#16A34A";
  if (score >= 70) return "#D97706";
  if (score >= 50) return "#EA580C";
  return "#DC2626";
};

export const getScoreLabel = (score) => {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "On Track";
  if (score >= 50) return "At Risk";
  return "Critical";
};

// ── GOAL VALIDATION ──────────────────────────────────
export const validateGoals = (goals) => {
  const errors = [];
  if (!goals.length) { errors.push("Add at least one goal."); return errors; }
  if (goals.length > 8) errors.push("Maximum 8 goals allowed.");
  goals.forEach((g, i) => {
    const n = i + 1;
    if (!g.title?.trim())    errors.push(`Goal ${n}: Title is required.`);
    if (!g.thrustArea)       errors.push(`Goal ${n}: Thrust area is required.`);
    if (!g.target)           errors.push(`Goal ${n}: Target is required.`);
    const w = parseFloat(g.weightage);
    if (!w || w < 10)        errors.push(`Goal ${n}: Weightage must be at least 10%.`);
  });
  const total = goals.reduce((s, g) => s + (parseFloat(g.weightage) || 0), 0);
  if (Math.round(total) !== 100) errors.push(`Total weightage is ${total.toFixed(0)}% — must equal exactly 100%.`);
  return errors;
};

// ── GOAL LIFECYCLE STATES ──────────────────────────────
export const GOAL_STATUS = {
  DRAFT:           "draft",
  PENDING:         "pending",
  CHANGES_NEEDED:  "changes_needed",
  APPROVED:        "approved",
  REJECTED:        "rejected",
};

export const STATUS_META = {
  draft:          { label:"Draft",           color:"#71717A", bg:"rgba(39,39,42,0.8)",    border:"#3F3F46" },
  pending:        { label:"Pending Review",  color:"#F59E0B", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.2)" },
  changes_needed: { label:"Changes Needed",  color:"#EF4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.2)" },
  approved:       { label:"Approved",        color:"#22C55E", bg:"rgba(34,197,94,0.1)",   border:"rgba(34,197,94,0.2)" },
  rejected:       { label:"Rejected",        color:"#EF4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.2)" },
};

// ── QUARTERS ──────────────────────────────────────────
export const QUARTERS = [
  { id:"q1", label:"Q1 Check-in", period:"01 Jul – 31 Jul",  months:[7] },
  { id:"q2", label:"Q2 Check-in", period:"01 Oct – 31 Dec",  months:[10,11,12] },
  { id:"q3", label:"Q3 Check-in", period:"01 Jan – 31 Jan",  months:[1] },
  { id:"q4", label:"Q4 / Annual", period:"01 Mar – 30 Apr",  months:[3,4] },
];

export const getCurrentQuarter = () => {
  const m = new Date().getMonth() + 1;
  if ([7].includes(m))       return "q1";
  if ([10,11,12].includes(m)) return "q2";
  if ([1].includes(m))       return "q3";
  return "q4";
};

// ── CONSTANTS ──────────────────────────────────────────
export const THRUST_AREAS = [
  "Sales & Revenue","Customer Success","Operations",
  "Product & Engineering","Finance & Cost",
  "People & Culture","Quality & Compliance","Innovation",
];

export const UOM_OPTIONS = [
  { value:"min",      label:"Numeric — Higher is better", example:"Revenue, Sales, NPS" },
  { value:"max",      label:"Numeric — Lower is better",  example:"Cost, TAT, Defects" },
  { value:"timeline", label:"Timeline — Days to complete", example:"Project delivery" },
  { value:"zero",     label:"Zero-based — 0 = Success",   example:"Accidents, Escalations" },
];

// ── EXPORT ────────────────────────────────────────────
export const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(r => headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g,'""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const formatDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
};

export const formatTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};
