// ─── useNotifications hook ──────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!error && data) setNotifications(data);
    } catch(e) {
      console.warn("[useNotifications] load failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    let channel;
    try {
      channel = supabase
        .channel("notifications_realtime")
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "notifications",
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        })
        .subscribe();
    } catch(e) {
      console.warn("[useNotifications] realtime failed:", e.message);
    }
    return () => { if (channel) supabase.removeChannel(channel).catch(() => {}); };
  }, [load]);

  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    supabase.from("notifications").update({ read: true }).eq("id", id).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("notifications")
          .update({ read: true })
          .eq("user_id", session.user.id)
          .eq("read", false);
      }
    } catch(e) { console.warn("[useNotifications] markAllRead:", e.message); }
  }, []);

  const unread = notifications.filter(n => !n.read).length;
  return { notifications, unread, loading, markRead, markAllRead, reload: load };
}
