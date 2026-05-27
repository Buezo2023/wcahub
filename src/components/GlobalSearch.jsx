// ─── WCA Hub — Búsqueda global (Cmd+K) ────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

const P = "#155266", PD = "#e8f3f6";

// ── Result types ────────────────────────────────────────────────────
const TYPE_META = {
  student:  { icon: "👤", label: "Estudiante",  color: "#155266" },
  payment:  { icon: "💳", label: "Pago",        color: "#059669" },
  group:    { icon: "👥", label: "Grupo",        color: "#7c3aed" },
  lead:     { icon: "📋", label: "Lead",         color: "#d97706" },
  staff:    { icon: "🧑‍💼", label: "Staff",       color: "#0e7490" },
};

function useDebounce(value, delay) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

async function runSearch(q) {
  if (!q || q.trim().length < 2) return [];
  const term = q.trim().toLowerCase();
  const results = [];

  // ── Students / Staff ─────────────────────────────────────────────
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active")
    .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(6);

  (profiles || []).forEach(p => {
    const isStaff = p.role && p.role !== "estudiante";
    results.push({
      id: `profile-${p.id}`,
      type: isStaff ? "staff" : "student",
      title: p.full_name || p.email,
      subtitle: p.email + (isStaff ? ` · ${p.role}` : "") + (!p.active ? " · Inactivo" : ""),
      raw: p,
      nav: isStaff
        ? { section: "rrhh", sub: "staff" }
        : { section: "academia", sub: "students" },
    });
  });

  // ── Payments ─────────────────────────────────────────────────────
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, status, reference_code, method, created_at, student:students(profile:profiles(full_name, email))")
    .or(`reference_code.ilike.%${term}%`)
    .limit(4);

  // Also search payments by student name if term looks like a name
  if (!/^\d/.test(term)) {
    const { data: payByName } = await supabase
      .from("payments")
      .select("id, amount, status, reference_code, method, created_at, student:students(profile:profiles(full_name, email))")
      .limit(4);
    // Filter client-side by student name
    (payByName || [])
      .filter(p => p.student?.profile?.full_name?.toLowerCase().includes(term))
      .forEach(p => {
        if (!(payments || []).find(x => x.id === p.id)) (payments || []).push(p);
      });
  }

  (payments || []).slice(0, 5).forEach(p => {
    const name = p.student?.profile?.full_name || "—";
    results.push({
      id: `pay-${p.id}`,
      type: "payment",
      title: `$${p.amount} · ${name}`,
      subtitle: `Ref: ${p.reference_code || "—"} · ${p.status} · ${new Date(p.created_at).toLocaleDateString("es-HN")}`,
      raw: p,
      nav: { section: "contab", sub: "pagos" },
    });
  });

  // ── Groups ───────────────────────────────────────────────────────
  const { data: groups } = await supabase
    .from("groups")
    .select("id, level, schedule, days, program_id, active_unit, enrollments(id)")
    .or(`level.ilike.%${term}%,schedule.ilike.%${term}%,days.ilike.%${term}%`)
    .limit(4);

  (groups || []).forEach(g => {
    results.push({
      id: `group-${g.id}`,
      type: "group",
      title: `${g.program_id?.toUpperCase() || "Grupo"} · ${g.level || "—"} · ${g.schedule || "—"}`,
      subtitle: `${g.days || "L·M·V"} · ${g.enrollments?.length || 0} inscriptos`,
      raw: g,
      nav: { section: "academia", sub: "grupos" },
    });
  });

  // ── Leads ────────────────────────────────────────────────────────
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, email, phone, status, program_id")
    .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
    .limit(3);

  (leads || []).forEach(l => {
    results.push({
      id: `lead-${l.id}`,
      type: "lead",
      title: l.name || l.email || "Lead",
      subtitle: `${l.email || "—"} · ${l.status || "nuevo"} · ${l.program_id || "—"}`,
      raw: l,
      nav: { section: "ventas", sub: "leads" },
    });
  });

  return results;
}

// ── Component ────────────────────────────────────────────────────────
export default function GlobalSearch({ onNavigate }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor]   = useState(0);
  const inputRef  = useRef(null);
  const listRef   = useRef(null);
  const debouncedQ = useDebounce(query, 220);

  // ── Keyboard shortcut ─────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Focus input when opened ───────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setQuery("");
      setResults([]);
      setCursor(0);
    }
  }, [open]);

  // ── Search on debounced query ─────────────────────────────────────
  useEffect(() => {
    if (!debouncedQ || debouncedQ.length < 2) { setResults([]); return; }
    setLoading(true);
    runSearch(debouncedQ)
      .then(r => { setResults(r); setCursor(0); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQ]);

  // ── Arrow nav & enter ─────────────────────────────────────────────
  function onKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) pick(results[cursor]);
  }

  function pick(result) {
    setOpen(false);
    if (onNavigate) onNavigate(result.nav.section, result.nav.sub);
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Búsqueda global (Cmd+K)"
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "7px 12px", background: "var(--bg-surface-subtle)",
        border: "1px solid var(--border)", borderRadius: 9,
        cursor: "pointer", fontFamily: "inherit", color: "var(--text-secondary)",
        fontSize: 12, transition: "all .15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = P; e.currentTarget.style.color = P; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
    >
      <i className="ti ti-search" style={{ fontSize: 14 }} aria-hidden="true"/>
      <span>Buscar…</span>
      <kbd style={{ fontSize: 10, padding: "1px 5px", background: "var(--border)", borderRadius: 4,
        color: "var(--text-tertiary)", fontFamily: "inherit", marginLeft: 4 }}>
        ⌘K
      </kbd>
    </button>
  );

  // ── Modal ─────────────────────────────────────────────────────────
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});
  const flat = Object.values(grouped).flat();
  const flatIdx = (r) => flat.findIndex(x => x.id === r.id);

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Búsqueda global"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 9999, padding: "80px 16px 16px",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          background: "var(--bg-surface)", borderRadius: 16,
          boxShadow: "0 24px 80px rgba(0,0,0,.25)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Input row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
          borderBottom: results.length ? "1px solid var(--border)" : "none" }}>
          <i className="ti ti-search" style={{ fontSize: 17, color: loading ? P : "var(--text-tertiary)", flexShrink: 0 }} aria-hidden="true"/>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar estudiante, pago, grupo, lead…"
            aria-label="Búsqueda"
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 15,
              background: "transparent", color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
          {loading && (
            <div style={{ width: 16, height: 16, border: "2px solid var(--border)",
              borderTopColor: P, borderRadius: "50%", animation: "gspin .7s linear infinite", flexShrink: 0 }}/>
          )}
          <kbd onClick={() => setOpen(false)} style={{ fontSize: 11, padding: "2px 6px",
            background: "var(--bg-surface-subtle)", border: "1px solid var(--border)",
            borderRadius: 5, cursor: "pointer", color: "var(--text-tertiary)", fontFamily: "inherit" }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div ref={listRef} style={{ maxHeight: 400, overflowY: "auto", padding: "8px 0" }}
            role="listbox" aria-label="Resultados de búsqueda">
            {Object.entries(grouped).map(([type, items]) => {
              const meta = TYPE_META[type] || { icon: "🔍", label: type, color: P };
              return (
                <div key={type}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)",
                    textTransform: "uppercase", letterSpacing: ".7px",
                    padding: "8px 16px 4px" }}>
                    {meta.icon} {meta.label}{items.length > 1 ? `s (${items.length})` : ""}
                  </div>
                  {items.map(result => {
                    const idx = flatIdx(result);
                    const active = idx === cursor;
                    return (
                      <div
                        key={result.id}
                        role="option"
                        aria-selected={active}
                        onClick={() => pick(result)}
                        onMouseEnter={() => setCursor(idx)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "9px 16px", cursor: "pointer",
                          background: active ? PD : "transparent",
                          borderLeft: active ? `3px solid ${P}` : "3px solid transparent",
                          transition: "background .1s",
                        }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: meta.color + "18",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 15 }}>
                          {meta.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {result.title}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 1,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {result.subtitle}
                          </div>
                        </div>
                        <i className="ti ti-arrow-right" style={{ fontSize: 13,
                          color: active ? P : "var(--text-tertiary)", flexShrink: 0 }} aria-hidden="true"/>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && query.length >= 2 && results.length === 0 && (
          <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
            Sin resultados para "<strong>{query}</strong>"
          </div>
        )}

        {/* Hint when empty query */}
        {query.length < 2 && (
          <div style={{ padding: "14px 16px 16px", display: "flex", gap: 20 }}>
            {[["👤","Estudiantes"],["💳","Pagos"],["👥","Grupos"],["📋","Leads"]].map(([ico, lbl]) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, color: "var(--text-tertiary)" }}>
                <span>{ico}</span><span>{lbl}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {results.length > 0 && (
          <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)",
            display: "flex", gap: 16, fontSize: 10, color: "var(--text-tertiary)" }}>
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>Esc cerrar</span>
          </div>
        )}
      </div>
      <style>{`@keyframes gspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
