// ─── StudentReport — Ficha completa del estudiante ───────────────
// Vista de reporte + descarga como PDF via window.print()
import { useRef } from "react";

const P = "#155266", PH = "#0f3d4d", Y = "#ffbb23";
const G = "#059669", R = "#dc2626", A = "#d97706";

// ── Radar chart via SVG ──────────────────────────────────────────
function RadarChart({ data, size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = data.length;
  if (!n) return null;

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, radius) => [
    cx + radius * Math.cos(angle(i)),
    cy + radius * Math.sin(angle(i)),
  ];

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  // Value polygon
  const valuePts = data.map((d, i) => pt(i, r * Math.min((d.value || 0) / 100, 1)));
  const polyline = valuePts.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {/* Grid rings */}
      {rings.map((ring) => (
        <polygon key={ring}
          points={data.map((_, i) => pt(i, r * ring).join(",")).join(" ")}
          fill="none" stroke="#e2e8f0" strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {data.map((_, i) => (
        <line key={i}
          x1={cx} y1={cy}
          x2={pt(i, r)[0]} y2={pt(i, r)[1]}
          stroke="#e2e8f0" strokeWidth="1"
        />
      ))}
      {/* Value area */}
      <polygon points={polyline}
        fill={`${P}22`} stroke={P} strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Value dots */}
      {valuePts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={P} />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const [lx, ly] = pt(i, r * 1.22);
        const anchor = lx < cx - 4 ? "end" : lx > cx + 4 ? "start" : "middle";
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor}
            fontSize="10" fill="#475569" fontFamily="'DM Sans',sans-serif"
            fontWeight="600">
            {d.label}
          </text>
        );
      })}
      {/* Center label */}
      <text x={cx} y={cy + 4} textAnchor="middle"
        fontSize="11" fill={P} fontFamily="'DM Sans',sans-serif" fontWeight="700">
        Skills
      </text>
    </svg>
  );
}

// ── Bar meter ────────────────────────────────────────────────────
function Meter({ value, color = P, label, sublabel }) {
  const pct = Math.min(Math.max(value || 0, 0), 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 70 ? G : pct >= 40 ? A : R }}>
          {sublabel || `${pct}%`}
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 4,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: "width 0.8s ease",
        }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export function StudentReport({ student, enrollments, certificates, progressHistory, skills, onClose }) {
  const ref = useRef();

  const name       = student?.name || student?.full_name || "Estudiante";
  const email      = student?.email || "—";
  const level      = enrollments?.[0]?.level || "A1";
  const program    = enrollments?.[0]?.program || "Inglés Completo";
  const unit       = enrollments?.[0]?.unit || 1;
  const joinDate   = student?.joined || student?.created_at
    ? new Date(student?.joined || student?.created_at).toLocaleDateString("es-HN", { month:"long", year:"numeric" })
    : "—";

  // Radar data from skills
  const radarData = (skills || []).map(s => ({
    label: s.name.split(" ")[0],
    value: s.score || 0,
  }));

  // Progress from history
  const unitsDone  = progressHistory?.filter(p => p.passed).length || Math.max(unit - 1, 0);
  const avgScore   = progressHistory?.length
    ? Math.round(progressHistory.filter(p=>p.exam_score>0).reduce((a,b) => a + (b.exam_score||0), 0) / Math.max(progressHistory.filter(p=>p.exam_score>0).length, 1))
    : 0;
  const totalUnits = 12;
  const progressPct = Math.round((unitsDone / totalUnits) * 100);

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .wca-report-print { display: block !important; position: static !important; }
          .no-print { display: none !important; }
          @page { margin: 12mm; size: A4 portrait; }
        }
        @keyframes reportIn { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
        .wca-report-print { animation: reportIn .4s ease both; }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex:50,
        background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
      }} />

      {/* Report panel */}
      <div ref={ref} className="wca-report-print" style={{
        position: "fixed", inset: 0, zIndex:50,
        overflowY: "auto", padding: "20px 16px 40px",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Action bar */}
          <div className="no-print" style={{
            display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16
          }}>
            <button onClick={handlePrint} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 22px", background: Y, color: PH,
              border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(255,187,35,.35)",
            }}>
              <i className="ti ti-download" style={{ fontSize: 15 }} /> Descargar PDF
            </button>
            <button onClick={onClose} style={{
              padding: "10px 18px", background: "rgba(255,255,255,.15)",
              border: "1px solid rgba(255,255,255,.25)", borderRadius: 10,
              fontSize: 13, color: "#fff", cursor: "pointer", fontFamily: "inherit",
            }}>✕ Cerrar</button>
          </div>

          {/* ── REPORT CARD ── */}
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>

            {/* Header — WCA brand */}
            <div style={{
              background: `linear-gradient(135deg, ${PH} 0%, ${P} 60%, #1a6b82 100%)`,
              padding: "32px 36px 28px", position: "relative", overflow: "hidden",
            }}>
              {/* Decorative circles */}
              <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,187,35,.08)" }} />
              <div style={{ position:"absolute", bottom:-20, left:200, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,.04)" }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, position: "relative" }}>
                {/* Logo + brand */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <svg viewBox="0 0 40 40" style={{ width: 40, height: 40, flexShrink: 0 }}>
                      <rect width="40" height="40" rx="10" fill={Y}/>
                      <text x="20" y="28" fontFamily="sans-serif" fontSize="22" fontWeight="900" fill={PH} textAnchor="middle">W</text>
                    </svg>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>
                        WCA <span style={{ color: Y }}>Academy</span>
                      </div>
                      <div style={{ fontSize:11, color: "rgba(255,255,255,.5)", letterSpacing: 1.5, textTransform: "uppercase" }}>
                        World Connect Academy
                      </div>
                    </div>
                  </div>

                  {/* Student avatar + name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${Y}, #f59e0b)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, fontWeight: 800, color: PH,
                      border: "3px solid rgba(255,255,255,.2)",
                      flexShrink: 0,
                    }}>
                      {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: -0.5 }}>
                        {name}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginTop: 3 }}>{email}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${Y}25`, color: Y, fontWeight: 700, border: `1px solid ${Y}40` }}>
                          {level}
                        </span>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", fontWeight: 600 }}>
                          {program}
                        </span>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", fontWeight: 600 }}>
                          Unidad {unit}/12
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats strip */}
                <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexShrink: 0 }}>
                  {[
                    { label: "Unidades", value: unitsDone, total: 12, icon: "🎯" },
                    { label: "Promedio", value: `${avgScore}%`, icon: "📊" },
                    { label: "Certificados", value: certificates?.length || 0, icon: "🏆" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,.08)",
                      border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 12, padding: "12px 16px", textAlign: "center", minWidth: 70,
                    }}>
                      <div style={{ fontSize: 18 }}>{s.icon}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
                        {s.value}{s.total ? <span style={{ fontSize: 11, opacity: 0.6 }}>/{s.total}</span> : ""}
                      </div>
                      <div style={{ fontSize:11, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.6)", marginBottom: 6 }}>
                  <span>Progreso del programa</span>
                  <span style={{ fontWeight: 700, color: progressPct >= 80 ? "#86efac" : Y }}>{progressPct}% completado</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${progressPct}%`, borderRadius: 4,
                    background: `linear-gradient(90deg, ${Y}, #f59e0b)`,
                  }} />
                </div>
                <div style={{ display: "flex", marginTop: 6, gap: 4 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i < unitsDone ? Y : i === unitsDone ? `${Y}60` : "rgba(255,255,255,.12)",
                    }} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── BODY ── */}
            <div style={{ padding: "28px 36px" }}>

              {/* Row 1: Skills radar + Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>

                {/* Radar */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 4, height: 16, background: P, borderRadius: 2 }} />
                    Habilidades
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <RadarChart data={radarData.length ? radarData : [
                      { label:"Listening", value: 0 }, { label:"Reading", value: 0 },
                      { label:"Speaking", value: 0 }, { label:"Writing", value: 0 },
                      { label:"Grammar", value: 0 }, { label:"Vocab", value: 0 },
                    ]} size={220} />
                  </div>
                  {radarData.every(d => d.value === 0) && (
                    <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
                      Las habilidades se actualizan al rendir exámenes
                    </p>
                  )}
                </div>

                {/* Metrics */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 4, height: 16, background: Y, borderRadius: 2 }} />
                    Métricas de rendimiento
                  </div>
                  <Meter label="Progreso general" value={progressPct} color={P} sublabel={`${unitsDone}/12 unidades`} />
                  <Meter label="Puntaje promedio" value={avgScore} color={avgScore >= 70 ? G : A} />
                  <Meter label="Participación" value={Math.min(unit * 8, 100)} color="#7c3aed" sublabel={`U${unit} activa`} />
                  {enrollments?.length > 1 && (
                    <Meter label="Programas activos" value={Math.min(enrollments.length * 50, 100)} color={Y} sublabel={`${enrollments.length} programas`} />
                  )}

                  {/* Unit history table */}
                  {progressHistory?.filter(p => p.exam_score > 0).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Historial de exámenes
                      </div>
                      <div style={{ maxHeight: 120, overflowY: "auto" }}>
                        {progressHistory.filter(p => p.exam_score > 0).slice(0, 8).map((p, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>
                            <span style={{ color: "#475569" }}>Unidad {p.unit}</span>
                            <span style={{ fontWeight: 700, color: p.passed ? G : R }}>{p.exam_score}% {p.passed ? "✓" : "✗"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Certificates */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 4, height: 16, background: G, borderRadius: 2 }} />
                  Certificados obtenidos
                </div>
                {certificates?.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
                    {certificates.map((cert, i) => (
                      <div key={i} style={{
                        background: `linear-gradient(135deg, ${PH}, ${P})`,
                        borderRadius: 14, padding: 18, color: "#fff",
                        position: "relative", overflow: "hidden",
                        border: `1px solid ${P}40`,
                      }}>
                        <div style={{ position: "absolute", top: -15, right: -15, fontSize: 64, opacity: 0.06 }}>🏆</div>
                        <i className="ti ti-trophy" style={{fontSize:28,color:"var(--amber)"}} aria-hidden="true"/>
                        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8, lineHeight: 1.3 }}>
                          {cert.data?.programName || cert.program_id || "Certificado WCA"}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 4 }}>
                          {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString("es-HN", { day:"2-digit", month:"long", year:"numeric" }) : "—"}
                        </div>
                        <div style={{ marginTop: 10, padding: "4px 10px", background: `${Y}25`, borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize:11, color: Y, fontWeight: 700, letterSpacing: 0.5 }}>Completado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 24, textAlign: "center", border: "1px dashed #e2e8f0" }}>
                    <i className="ti ti-target" style={{fontSize:32,color:"var(--wca-primary)",marginBottom:8,display:"block"}} aria-hidden="true"/>
                    <div style={{ fontSize: 13, color: "#64748b" }}>Completá las 12 unidades para obtener tu certificado</div>
                    <div style={{ marginTop: 8, background: "#e2e8f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${progressPct}%`, height: "100%", background: P, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{progressPct}% hacia tu certificado</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                borderTop: "1px solid #f1f5f9", paddingTop: 20,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg viewBox="0 0 32 32" style={{ width: 28, height: 28 }}>
                    <rect width="32" height="32" rx="7" fill={P}/>
                    <text x="16" y="22" fontFamily="sans-serif" fontSize="16" fontWeight="900" fill={Y} textAnchor="middle">W</text>
                  </svg>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: P }}>WCA Academy Hub</div>
                    <div style={{ fontSize:11, color: "#94a3b8" }}>wcahub.vercel.app</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color: "#94a3b8", textAlign: "right" }}>
                  Reporte generado el {new Date().toLocaleDateString("es-HN", { day:"2-digit", month:"long", year:"numeric" })}
                  <br/>Estudiante desde {joinDate}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
