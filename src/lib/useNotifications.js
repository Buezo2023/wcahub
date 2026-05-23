// ─── useNotifications hook ──────────────────────────────────────
// Carga notificaciones del usuario logueado desde Supabase.
// Se puede usar en cualquier portal con:
//   const { notifications, unread, markRead, markAllRead } = useNotifications();

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setNotifications(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Realtime subscription — new notifications arrive instantly
    const channel = supabase
      .channel("notifications_realtime")
      .on("postgres_changes", {
        event:  "INSERT",
        schema: "public",
        table:  "notifications",
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
    }
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  return { notifications, unread, loading, markRead, markAllRead, reload: load };
}
