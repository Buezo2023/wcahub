// ─── Empty state — shows when no data ────────────────────────────
export function EmptyState({ icon = "📋", title, subtitle, actionLabel, onAction }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--text-secondary,#64748b)" }}>
      <div style={{ fontSize:36, marginBottom:12, opacity:0.6 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary,#0f172a)", marginBottom:6 }}>
        {title || "Sin datos aún"}
      </div>
      {subtitle && <div style={{ fontSize:12, marginBottom:16, lineHeight:1.6 }}>{subtitle}</div>}
      {actionLabel && onAction && (
        <button onClick={onAction} style={{
          padding:"8px 20px", background:"#155266", color:"#fff", border:"none",
          borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit"
        }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
