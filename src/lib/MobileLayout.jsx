// ─── MobileLayout — responsive sidebar for all portals ───────────
import { useState, useEffect, useCallback } from "react";

export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

export function MobileLayout({ nav, navColor = "#155266", children }) {
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [children]);

  if (!isMobile) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <aside style={{ width: 210, background: navColor, display: "flex", flexDirection: "column",
          padding: "0 0 16px", flexShrink: 0, minHeight: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
          {nav}
        </aside>
        <main style={{ flex: 1, background: "var(--bg-page,#f8fafc)", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: "var(--bg-page,#f8fafc)" }}>

      {/* Backdrop */}
      {open && <div onClick={close} style={{ position: "fixed", inset: 0, zIndex:40,
        background: "rgba(0,0,0,.4)", backdropFilter: "blur(2px)" }} />}

      {/* Drawer sidebar */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex:20,
        width: 260, maxWidth: "80vw", background: navColor,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform .25s cubic-bezier(.4,0,.2,1)",
        overflowY: "auto", display: "flex", flexDirection: "column",
        padding: "0 0 16px",
      }}>
        {/* Close button inside drawer */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 12px 0" }}>
          <button onClick={close} style={{ background: "rgba(255,255,255,.15)",
            border: "none", color: "#fff", width: 32, height: 32, borderRadius: 8,
            fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center" }}>✕</button>
        </div>
        <div onClick={close}>
          {nav}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ padding: "16px 14px 80px", overflowX: "hidden" }}>
        {children}
      </main>

      {/* Floating menu button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 20, right: 20, zIndex:40,
        width: 50, height: 50, borderRadius: "50%",
        background: navColor, color: "#fff", border: "none",
        boxShadow: "0 4px 20px rgba(0,0,0,.25)",
        fontSize: 20, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {open ? "✕" : "☰"}
      </button>
    </div>
  );
}
