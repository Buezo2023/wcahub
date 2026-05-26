// ─── WCA Hub — Shared UI Components ──────────────────────────────
// Import: import { Modal, Button, Badge, Field, Input } from "../components"

import { useState, useEffect } from "react";

// ── Colors ───────────────────────────────────────────────────────
const P = "#155266";

// ── Modal ────────────────────────────────────────────────────────
export function Modal({ title, subtitle, onClose, children, width = 460 }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" style={{ position:"fixed", inset:0,
      background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center",
      justifyContent:"center", zIndex:"var(--z-modal)", padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"var(--bg-surface,#fff)", borderRadius:16, padding:26,
        animation:"popIn .22s cubic-bezier(.34,1.56,.64,1) both",
        width, maxWidth:"100%", border:"1px solid var(--border,#e2e8f0)",
        boxShadow:"0 20px 60px rgba(0,0,0,.15)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary,#0f172a)" }}>{title}</div>
            {subtitle && <div style={{ fontSize:11, color:"var(--text-secondary,#64748b)", marginTop:2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{
            background:"none", border:"none", fontSize:20, cursor:"pointer",
            color:"var(--text-tertiary,#94a3b8)", padding:6 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────
export function Button({ onClick, children, variant = "primary", style = {}, disabled = false, ...props }) {
  const styles = {
    primary: { background: P, color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: "var(--text-secondary,#64748b)", border: "1px solid var(--border,#e2e8f0)" },
    danger:  { background: "#fef2f2", color: "#dc2626", border: "none" },
  };
  const base = styles[variant] || styles.primary;
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
      opacity: disabled ? 0.6 : 1, ...base, ...style
    }} {...props}>
      {children}
    </button>
  );
}

// ── Badge ────────────────────────────────────────────────────────
export function Badge({ text, bg = "#e8f3f6", color = P }) {
  return (
    <span style={{ fontSize:11, padding: "3px 9px", borderRadius: 20,
      background: bg, color, fontWeight: 600, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

// ── Field (label + input wrapper) ────────────────────────────────
export function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary,#64748b)",
        marginBottom: 5, display: "flex", gap: 3 }}>
        {label}
        {required && <span style={{ color: "#dc2626" }}>*</span>}
      </div>
      {children}
    </div>
  );
}

// ── Input ────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = "text", required, ...props }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      style={{ width: "100%", padding: "10px 13px", border: "1px solid var(--border,#e2e8f0)",
        borderRadius: 9, fontSize: 13, background: "var(--bg-surface-subtle,#f8fafc)",
        color: "var(--text-primary,#0f172a)", fontFamily: "inherit" }}
      {...props} />
  );
}

// ── Select ───────────────────────────────────────────────────────
export function Select({ value, onChange, options, ...props }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "10px 13px", border: "1px solid var(--border,#e2e8f0)",
      borderRadius: 9, fontSize: 13, background: "var(--bg-surface-subtle,#f8fafc)",
      color: "var(--text-primary,#0f172a)", fontFamily: "inherit"
    }} {...props}>
      {options.map(o => typeof o === "string"
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  );
}

// ── Stat card ────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = P, trend }) {
  return (
    <div style={{ background: "var(--bg-surface,#fff)", borderRadius: 14,
      padding: "16px 18px", border: "1px solid var(--border,#e2e8f0)",
      display: "flex", alignItems: "center", gap: 14 }}>
      {icon && <div style={{ width: 40, height: 40, borderRadius: 10,
        background: `${color}12`, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "var(--text-secondary,#64748b)", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary,#0f172a)", lineHeight: 1.2 }}>{value}</div>
      </div>
      {trend && <div style={{ fontSize: 11, fontWeight: 600, color: trend > 0 ? "#059669" : "#dc2626" }}>
        {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
      </div>}
    </div>
  );
}
