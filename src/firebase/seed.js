import { db } from "./config";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";

const DEMO_GOALS = [
  {
    employeeId: "emp_001", employeeName: "Riya Sharma",
    managerId: "mgr_001", department: "Engineering",
    title: "Increase Online Sales Revenue",
    description: "Drive revenue growth through targeted campaigns and upselling strategies.",
    thrustArea: "Sales & Revenue", uom: "min",
    target: "5000000", achievement: "3420000", weightage: "30",
    submissionStatus: "approved", locked: true,
    checkInStatus: "on_track", confidence: "high",
    selfRating: 4, selfComment: "On track, Q3 push expected to close gap.",
    managerCheckInComment: "Good progress. Push for 40L by end of Q3. Focus on upsell campaigns.",
    quarter: "Q2", initiatives: [
      { id: 1, text: "Launch email campaign to existing customers", done: true },
      { id: 2, text: "Set up upsell triggers on checkout page", done: true },
      { id: 3, text: "Weekly sales review with team", done: false },
    ],
  },
  {
    employeeId: "emp_001", employeeName: "Riya Sharma",
    managerId: "mgr_001", department: "Engineering",
    title: "Reduce Customer Complaints",
    description: "Improve customer satisfaction by reducing complaint volume.",
    thrustArea: "Customer Success", uom: "max",
    target: "500", achievement: "320", weightage: "20",
    submissionStatus: "approved", locked: true,
    checkInStatus: "on_track", confidence: "high",
    selfRating: 4, selfComment: "Great progress on support SLAs.",
    managerCheckInComment: "Impressive reduction. Continue with knowledge base improvements.",
    quarter: "Q2", initiatives: [
      { id: 1, text: "Create FAQ knowledge base", done: true },
      { id: 2, text: "Implement ticket auto-routing", done: false },
    ],
  },
  {
    employeeId: "emp_001", employeeName: "Riya Sharma",
    managerId: "mgr_001", department: "Engineering",
    title: "Launch 2 New Product Features",
    description: "Ship two major product updates to improve user retention.",
    thrustArea: "Product & Engineering", uom: "zero",
    target: "0", achievement: "0", weightage: "20",
    submissionStatus: "approved", locked: true,
    checkInStatus: "completed", confidence: "high",
    selfRating: 5, selfComment: "Both features shipped ahead of schedule.",
    quarter: "Q2", initiatives: [
      { id: 1, text: "Ship dark mode feature", done: true },
      { id: 2, text: "Ship bulk export feature", done: true },
    ],
  },
  {
    employeeId: "emp_001", employeeName: "Riya Sharma",
    managerId: "mgr_001", department: "Engineering",
    title: "Improve NPS Score",
    description: "Increase Net Promoter Score through product improvements.",
    thrustArea: "Customer Success", uom: "min",
    target: "40", achievement: "28", weightage: "15",
    submissionStatus: "approved", locked: true,
    checkInStatus: "on_track", confidence: "medium",
    selfRating: 3, selfComment: "Slightly behind but improving each sprint.",
    quarter: "Q2", initiatives: [
      { id: 1, text: "Send NPS surveys post-onboarding", done: true },
      { id: 2, text: "Act on top 3 detractor feedback themes", done: false },
    ],
  },
  {
    employeeId: "emp_001", employeeName: "Riya Sharma",
    managerId: "mgr_001", department: "Engineering",
    title: "Reduce Turnaround Time",
    description: "Cut average ticket resolution time from 7 days to 5.",
    thrustArea: "Operations", uom: "max",
    target: "5", achievement: "6.5", weightage: "15",
    submissionStatus: "approved", locked: true,
    checkInStatus: "on_track", confidence: "low",
    selfRating: 2, selfComment: "Struggling due to team bandwidth.",
    quarter: "Q2", initiatives: [
      { id: 1, text: "Automate first-response with templates", done: false },
    ],
  },
];

const DEMO_AUDIT = [
  { user:"Riya Sharma", role:"employee", action:"Submitted goals for approval", detail:"5 goals submitted" },
  { user:"Arjun Mehta", role:"manager", action:"Approved goals", detail:"Goal: 'Increase Online Sales Revenue' — Riya Sharma", oldValue:"pending", newValue:"approved" },
  { user:"Arjun Mehta", role:"manager", action:"Approved goals", detail:"Goal: 'Reduce Customer Complaints' — Riya Sharma", oldValue:"pending", newValue:"approved" },
  { user:"Riya Sharma", role:"employee", action:"Updated quarterly achievement", detail:"Goal: 'Improve NPS Score' | Achievement: 28" },
  { user:"Priya Nair", role:"admin", action:"Changed cycle status: q2 → active", detail:"Cycle management update" },
];

export async function seedDemoData() {
  try {
    // Check if already seeded
    const existing = await getDocs(collection(db, "goals"));
    if (existing.docs.length > 0) {
      console.log("Already seeded, skipping.");
      return false;
    }

    // Add goals
    for (const goal of DEMO_GOALS) {
      await addDoc(collection(db, "goals"), { ...goal, createdAt: serverTimestamp() });
    }

    // Add audit logs
    for (const log of DEMO_AUDIT) {
      await addDoc(collection(db, "auditlogs"), { ...log, timestamp: serverTimestamp() });
    }

    console.log("✅ Demo data seeded!");
    return true;
  } catch(e) {
    console.error("Seed failed:", e);
    return false;
  }
}
