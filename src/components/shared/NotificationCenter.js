import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";

export function useNotifications() {
  // eslint-disable-next-line no-unused-vars
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "notifications"), where("userId", "==", currentUser.id));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(data);
    });
    return () => unsub();
  }, [currentUser]);

  const unread = notifications.filter(n => !n.read).length;
  return { notifications, unread };
}

export async function sendNotification({ userId, title, message, type = "info", link = null }) {
  await addDoc(collection(db, "notifications"), {
    userId, title, message, type, link,
    read: false, createdAt: serverTimestamp(),
  });
}

const typeConfig = {
  success: { icon: "✅", color: "#15803D", bg: "#DCFCE7" },
  warning: { icon: "⚠️", color: "#854D0E", bg: "#FEF9C3" },
  error: { icon: "❌", color: "#991B1B", bg: "#FEE2E2" },
  info: { icon: "ℹ️", color: "#1D4ED8", bg: "#DBEAFE" },
  approval: { icon: "✓", color: "#15803D", bg: "#DCFCE7" },
  rejection: { icon: "✕", color: "#991B1B", bg: "#FEE2E2" },
};

function timeAgo(ts) {
  if (!ts) return "";
  const seconds = Math.floor((Date.now() - ts.seconds * 1000) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds/3600)}h ago`;
  return `${Math.floor(seconds/86400)}d ago`;
}

export default function NotificationCenter() {
  // eslint-disable-next-line no-unused-vars
  const { currentUser } = useAuth();
  const { notifications, unread } = useNotifications();
  const [open, setOpen] = useState(false);

  const markRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const markAllRead = async () => {
    for (const n of notifications.filter(n => !n.read)) {
      await updateDoc(doc(db, "notifications", n.id), { read: true });
    }
  };

  // Demo notifications if empty
  const displayed = notifications.length > 0 ? notifications : [
    { id: "d1", title: "Goal Approved", message: "Your goal 'Increase Sales Revenue' was approved by Arjun Mehta", type: "approval", read: false, createdAt: { seconds: Date.now()/1000 - 7200 } },
    { id: "d2", title: "Q2 Check-in Open", message: "Q2 check-in window is now active. Log your achievements before 31 Dec.", type: "info", read: false, createdAt: { seconds: Date.now()/1000 - 86400 } },
    { id: "d3", title: "Manager Comment", message: "Arjun Mehta commented on your goal 'Improve NPS Score'", type: "info", read: true, createdAt: { seconds: Date.now()/1000 - 172800 } },
  ];

  return (
    <div style={{ position: "relative" }}>
      {/* Bell button */}
      <button onClick={() => setOpen(!open)}
        style={{ background: "none", border: "1.5px solid #EBEBEB", borderRadius: "8px", width: "38px", height: "38px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", position: "relative", background: "#fff" }}>
        🔔
        {unread > 0 && (
          <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", background: "#EF4444", borderRadius: "50%", fontSize: "0.6rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: "360px", background: "#fff", border: "1.5px solid #EBEBEB", borderRadius: "12px", boxShadow: "0 16px 40px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Notifications {unread > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: "999px", padding: "0.1rem 0.4rem", fontSize: "0.65rem", marginLeft: "0.35rem" }}>{unread}</span>}</div>
              {unread > 0 && <button onClick={markAllRead} style={{ fontSize: "0.72rem", color: "#F5C500", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Mark all read</button>}
            </div>

            {/* List */}
            <div style={{ maxHeight: "380px", overflowY: "auto" }}>
              {displayed.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#999", fontSize: "0.82rem" }}>
                  🎉 All caught up!
                </div>
              ) : (
                displayed.map(n => {
                  const t = typeConfig[n.type] || typeConfig.info;
                  return (
                    <div key={n.id} onClick={() => markRead(n.id)}
                      style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid #F7F7F7", cursor: "pointer", background: n.read ? "#151515" : "rgba(245,196,0,0.04)", display: "flex", gap: "0.75rem", alignItems: "flex-start", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#1A1A1A"}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? "#151515" : "rgba(245,196,0,0.04)"}>
                      <div style={{ width: "32px", height: "32px", background: t.bg, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 }}>
                        {t.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: n.read ? 500 : 700, fontSize: "0.82rem", color: "#111", marginBottom: "0.15rem" }}>{n.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "#777", lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: "0.65rem", color: "#BBB", marginTop: "0.3rem" }}>{timeAgo(n.createdAt)}</div>
                      </div>
                      {!n.read && <div style={{ width: "7px", height: "7px", background: "#F5C500", borderRadius: "50%", flexShrink: 0, marginTop: "0.35rem" }} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
