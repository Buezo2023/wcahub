// ─── Toast global — WCA Hub ──────────────────────────────────────
// Uso: import { toast } from "../lib/toast.jsx"
//      toast.success("Guardado") | toast.error("Error") | toast.info("...") | toast.warn("...")

import { useState, useEffect, useCallback } from "react";

const DURATION = 4000;
let _listeners = [];

export const toast = {
  _emit(msg, level) {
    _listeners.forEach(fn => fn({ msg, level, id: Date.now() + Math.random() }));
  },
  success(msg) { this._emit(msg, "success"); },
  error(msg)   { this._emit(msg, "error");   },
  info(msg)    { this._emit(msg, "info");     },
  warn(msg)    { this._emit(msg, "warn");     },
};

const ICONS  = { success:"ti-circle-check", error:"ti-circle-x", info:"ti-info-circle", warn:"ti-alert-triangle" };
const COLORS = {
  success: { bg:"#ecfdf5", text:"#065f46", border:"#6ee7b7" },
  error:   { bg:"#fef2f2", text:"#991b1b", border:"#fca5a5" },
  info:    { bg:"#e8f3f6", text:"#155266", border:"#93c5fd" },
  warn:    { bg:"#fffbeb", text:"#92400e", border:"#fcd34d" },
};

export function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handler = (item) => {
      setItems(prev => [...prev.slice(-4), item]);
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== item.id)), DURATION);
    };
    _listeners.push(handler);
    return () => { _listeners = _listeners.filter(fn => fn !== handler); };
  }, []);

  if (!items.length) return null;

  return (
    <div style={{
      position:"fixed", top:20, right:20, zIndex:"var(--z-toast)",
      display:"flex", flexDirection:"column", gap:8,
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
      pointerEvents:"none",
    }}>
      {items.map(t => {
        const c = COLORS[t.level] || COLORS.success;
        return (
          <div key={t.id} style={{
            background: c.bg, color: c.text,
            border: `1px solid ${c.border}`,
            borderRadius: 12, padding: "11px 16px",
            fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 9,
            boxShadow: "0 4px 16px rgba(0,0,0,.1)",
            maxWidth: 380, minWidth: 220,
            animation: "toastIn .22s cubic-bezier(.34,1.56,.64,1) both",
            pointerEvents: "auto",
          }}>
            <i className={`ti ${ICONS[t.level] || "ti-circle-check"}`} style={{ fontSize:16, flexShrink:0 }} aria-hidden="true" />
            {t.msg}
            <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}`}</style>
          </div>
        );
      })}
    </div>
  );
}
