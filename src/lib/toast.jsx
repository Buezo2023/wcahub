// ─── Toast global — WCA Hub ──────────────────────────────────────
// Uso: import { toast } from "../lib/toast.js"
//      toast.success("Guardado") | toast.error("Error") | toast.info("...") | toast.warn("...")
// Requiere: <ToastContainer /> montado una vez en App.jsx

const DURATION = 3500;

class ToastEmitter extends EventTarget {
  show(msg, type = "success") {
    this.dispatchEvent(Object.assign(new Event("toast"), { msg, type, id: Date.now() }));
  }
  success(msg) { this.show(msg, "success"); }
  error(msg)   { this.show(msg, "error");   }
  info(msg)    { this.show(msg, "info");    }
  warn(msg)    { this.show(msg, "warn");    }
}

export const toast = new ToastEmitter();

// ─── ToastContainer — montar una vez en App.jsx ──────────────────
import { useState, useEffect } from "react";

const ICONS  = { success:"ti-circle-check", error:"ti-circle-x", info:"ti-info-circle", warn:"ti-alert-triangle" };
const COLORS = {
  success: { bg:"var(--green-dim,#ecfdf5)",  text:"#065f46", border:"#6ee7b7" },
  error:   { bg:"var(--red-dim,#fef2f2)",    text:"#991b1b", border:"#fca5a5" },
  info:    { bg:"var(--wca-primary-dim,#e8f3f6)", text:"#155266", border:"#93c5fd" },
  warn:    { bg:"var(--amber-dim,#fffbeb)",  text:"#92400e", border:"#fcd34d" },
};

export function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const item = { id: e.id, msg: e.msg, type: e.type };
      setItems(prev => [...prev.slice(-4), item]);
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== item.id)), DURATION);
    };
    toast.addEventListener("toast", handler);
    return () => toast.removeEventListener("toast", handler);
  }, []);

  if (!items.length) return null;

  return (
    <div style={{
      position:"fixed", top:20, right:20, zIndex:99999,
      display:"flex", flexDirection:"column", gap:8,
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
      pointerEvents:"none",
    }}>
      {items.map(t => {
        const c = COLORS[t.type] || COLORS.success;
        return (
          <div key={t.id} style={{
            background: c.bg, color: c.text,
            border: `1px solid ${c.border}`,
            borderRadius: 12, padding: "11px 16px",
            fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 9,
            boxShadow: "0 4px 16px rgba(0,0,0,.1)",
            maxWidth: 360, minWidth: 220,
            animation: "toastIn .22s cubic-bezier(.34,1.56,.64,1) both",
            pointerEvents: "auto",
          }}>
            <i className={`ti ${ICONS[t.type]}`} style={{ fontSize:16, flexShrink:0 }} aria-hidden="true" />
            {t.msg}
            <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}`}</style>
          </div>
        );
      })}
    </div>
  );
}
