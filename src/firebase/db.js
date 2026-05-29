import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where,
  serverTimestamp, onSnapshot, setDoc
} from "firebase/firestore";
import { db } from "./config";

// ── GOALS ──────────────────────────────────────────────
export const addGoal = (goal) =>
  addDoc(collection(db, "goals"), { ...goal, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

export const updateGoal = (id, data) =>
  updateDoc(doc(db, "goals", id), { ...data, updatedAt: serverTimestamp() });

export const deleteGoal = (id) => deleteDoc(doc(db, "goals", id));

export const getGoalsByEmployee = async (employeeId) => {
  const q = query(collection(db, "goals"), where("employeeId", "==", employeeId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getGoalsByManager = async (managerId) => {
  const q = query(collection(db, "goals"), where("managerId", "==", managerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllGoals = async () => {
  const snap = await getDocs(collection(db, "goals"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── CHECKINS ──────────────────────────────────────────
export const upsertCheckIn = async (goalId, quarter, data) => {
  const q = query(collection(db, "checkins"),
    where("goalId", "==", goalId),
    where("quarter", "==", quarter));
  const snap = await getDocs(q);
  if (snap.docs.length > 0) {
    await updateDoc(doc(db, "checkins", snap.docs[0].id), { ...data, updatedAt: serverTimestamp() });
    return snap.docs[0].id;
  } else {
    const ref = await addDoc(collection(db, "checkins"), { goalId, quarter, ...data, createdAt: serverTimestamp() });
    return ref.id;
  }
};

export const getCheckInsByGoal = async (goalId) => {
  const q = query(collection(db, "checkins"), where("goalId", "==", goalId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getCheckInsByEmployee = async (employeeId) => {
  const q = query(collection(db, "checkins"), where("employeeId", "==", employeeId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAllCheckIns = async () => {
  const snap = await getDocs(collection(db, "checkins"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── AUDIT LOGS ─────────────────────────────────────────
export const addAuditLog = (data) =>
  addDoc(collection(db, "auditlogs"), { ...data, timestamp: serverTimestamp() });

export const getAllAuditLogs = async () => {
  const snap = await getDocs(collection(db, "auditlogs"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
};

// ── CYCLE CONFIG ───────────────────────────────────────
export const getCycleConfig = async () => {
  try {
    const snap = await getDoc(doc(db, "config", "cycles"));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
};

export const setCycleConfig = (data) =>
  setDoc(doc(db, "config", "cycles"), data);

// ── NOTIFICATIONS ──────────────────────────────────────
export const addNotification = (data) =>
  addDoc(collection(db, "notifications"), { ...data, read: false, createdAt: serverTimestamp() });

export const listenNotifications = (userId, callback) =>
  onSnapshot(
    query(collection(db, "notifications"), where("userId", "==", userId)),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
  );

export const markNotificationRead = (id) =>
  updateDoc(doc(db, "notifications", id), { read: true });

// ── REAL-TIME LISTENERS ────────────────────────────────
export const listenGoalsByEmployee = (employeeId, callback) =>
  onSnapshot(
    query(collection(db, "goals"), where("employeeId", "==", employeeId)),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );

export const listenGoalsByManager = (managerId, callback) =>
  onSnapshot(
    query(collection(db, "goals"), where("managerId", "==", managerId)),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
