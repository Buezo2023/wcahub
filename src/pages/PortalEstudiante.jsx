import { useState } from "react";

const UNITS = [
  { n: 1, title: "Vocabulario cotidiano", status: "done", score: 88 },
  { n: 2, title: "Tiempos verbales I", status: "done", score: 92 },
  { n: 3, title: "Conversación básica", status: "done", score: 76 },
  { n: 4, title: "Reading comprensión I", status: "done", score: 85 },
  { n: 5, title: "Escritura práctica", status: "done", score: 90 },
  { n: 6, title: "Gramática en uso", status: "done", score: 82 },
  { n: 7, title: "Pronunciación I", status: "done", score: 78 },
  { n: 8, title: "Comprensión auditiva I", status: "done", score: 88 },
  { n: 9, title: "Expresión escrita", status: "current", score: null },
  { n: 10, title: "Pronunciación avanzada", status: "locked", score: null },
  { n: 11, title: "Comprensión auditiva II", status: "locked", score: null },
  { n: 12, title: "Evaluación final B1", status: "locked", score: null },
];

const SCHEDULE = [
  { day: "Lun", date: "16 Jun", time: "6:00–7:00 PM", unit: "U9: Expresión escrita", teacher: "José", status: "next" },
  { day: "Mié", date: "18 Jun", time: "6:00–7:00 PM", unit: "U9: Repaso y práctica", teacher: "José", status: "upcoming" },
  { day: "Vie", date: "20 Jun", time: "6:00–7:00 PM", unit: "U9: Cierre y examen", teacher: "José", status: "upcoming" },
  { day: "Lun", date: "23 Jun", time: "6:00–7:00 PM", unit: "U10: Pronunciación avanzada", teacher: "José", status: "upcoming" },
];

const PAYMENTS = [
  { date: "1 Jun 2025", desc: "Inglés B1 — Junio", amount: "$95.00", status: "paid" },
  { date: "1 May 2025", desc: "Inglés B1 — Mayo", amount: "$95.00", status: "paid" },
  { date: "1 Abr 2025", desc: "Inglés B1 — Abril", amount: "$95.00", status: "paid" },
  { date: "1 Mar 2025", desc: "Inscripción + Marzo", amount: "$120.00", status: "paid" },
];

const LEVEL_PATH = [
  { code: "A1", name: "Principiante", status: "done" },
  { code: "A2", name: "Básico", status: "done" },
  { code: "B1", name: "Intermedio", status: "current" },
  { code: "B2", name: "Interm. alto", status: "locked" },
  { code: "C1", name: "Avanzado", status: "locked" },
];

const ATTEMPTS = [
  { label: "Intento 1", score: 58, status: "fail" },
  { label: "Intento 2", score: 64, status: "fail" },
  { label: "Intento 3", score: null, status: "available" },
];

const navItems = [
  { id: "home", icon: "⌂", label: "Inicio" },
  { id: "program", icon: "◈", label: "Mi programa" },
  { id: "classes", icon: "▷", label: "Clases en vivo" },
  { id: "practice", icon: "✦", label: "Práctica" },
  { id: "exam", icon: "✎", label: "Examen" },
  { id: "progress", icon: "↑", label: "Mi progreso" },
  { id: "payments", icon: "$", label: "Pagos" },
];

const avgScore = Math.round(UNITS.filter(u => u.score).reduce((a, u) => a + u.score, 0) / UNITS.filter(u => u.score).length);
const doneCount = UNITS.filter(u => u.status === "done").length;

export default function WCAPortal() {
  const [view, setView] = useState("home");
  const [examStarted, setExamStarted] = useState(false);
  const [examQ, setExamQ] = useState(0);
  const [examAnswers, setExamAnswers] = useState([]);
  const [examDone, setExamDone] = useState(false);
  const [selected, setSelected] = useState(null);

  const examQuestions = [
    { q: "Choose the correct sentence:", opts: ["She write well.", "She writes well.", "She writing well.", "She have written well."], ans: 1 },
    { q: "What does 'elaborate' mean?", opts: ["simple", "develop in detail", "reduce", "ignore"], ans: 1 },
    { q: "Complete: 'By the time he arrived, we ___ dinner.'", opts: ["finish", "finished", "had finished", "have finished"], ans: 2 },
    { q: "Which sentence is most formal?", opts: ["Hey, can you send that over?", "Could you please forward that document?", "Send it already.", "I need that thing."], ans: 1 },
  ];

  function submitAnswer(i) {
    if (selected !== null) return;
    setSelected(i);
    setTimeout(() => {
      const newAnswers = [...examAnswers, { q: examQ, chosen: i, correct: i === examQuestions[examQ].ans }];
      setExamAnswers(newAnswers);
      if (examQ < examQuestions.length - 1) {
        setExamQ(examQ + 1);
        setSelected(null);
      } else {
        setExamDone(true);
      }
    }, 900);
  }

  const examScore = examAnswers.length > 0
    ? Math.round((examAnswers.filter(a => a.correct).length / examQuestions.length) * 100)
    : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-page)",  overflow: "hidden",  fontFamily: "'DM Sans','Outfit','Segoe UI',sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 200, background: "#155266", display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: "0.5px solid rgba(255,255,255,0.08)", marginBottom: 11 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--bg-surface)", letterSpacing: -0.5 }}>WCA</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: 1, textTransform: "uppercase" }}>Portal del estudiante</div>
        </div>

        {navItems.map(item => (
          <button key={item.id} onClick={() => setView(item.id)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "9px 20px", border: "none", background: view === item.id ? "rgba(255,255,255,0.1)" : "transparent",
            color: view === item.id ? "var(--bg-surface)" : "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 13, textAlign: "left",
            borderLeft: view === item.id ? "2px solid #ffbb23" : "2px solid transparent", transition: "all 0.15s"
          }}>
            <span style={{ fontSize: 16, width: 18, textAlign: "center", opacity: view === item.id ? 1 : 0.7 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--wca-primary-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#ffbb23" }}>MR</div>
            <div>
              <div style={{ fontSize: 13, color: "var(--bg-surface)", fontWeight: 500 }}>María Rodríguez</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Inglés B1</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <div style={{ background: "var(--bg-surface)", borderBottom: "0.5px solid var(--border)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
            { {home:"Inicio",program:"Mi programa",classes:"Clases en vivo",practice:"Práctica 24/7",exam:"Examen de unidad",progress:"Mi progreso",payments:"Estado de cuenta"}[view] }
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, background: "var(--amber-dim)", color: "#92400e", padding: "7px 14px", borderRadius: 20, fontWeight: 500 }}>Unidad 9 activa</div>
            <div style={{ fontSize: 12, background: "var(--green-dim)", color: "#065f46", padding: "7px 14px", borderRadius: 20, fontWeight: 500 }}>Próxima clase: Lunes</div>
          </div>
        </div>

        <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>

          {/* ── HOME ── */}
          {view === "home" && (
            <div>
              {/* Welcome */}
              <div style={{ background: "#155266", borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 4, letterSpacing: 0.5 }}>BIENVENIDA DE VUELTA</div>
                  <div style={{ fontSize: 19, fontWeight: 600, color: "var(--bg-surface)", marginBottom: 9 }}>¡Hola, María! 👋</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.85 }}>Tu próxima clase en vivo es el <span style={{ color: "#ffbb23" }}>lunes a las 6:00 PM</span> con José.<br />Tienes la Unidad 9 activa y lista para practicar.</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: "#ffbb23", lineHeight: 1 }}>{Math.round(doneCount / 12 * 100)}%</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>ciclo B1 completado</div>
                  <div style={{ marginTop: 10, height: 4, width: 80, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round(doneCount / 12 * 100)}%`, background: "#ffbb23", borderRadius: 2 }} />
                  </div>
                </div>
              </div>

              {/* Metric cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Unidades completadas", val: `${doneCount}/12`, sub: "este ciclo", color: "#065f46", bg: "var(--green-dim)" },
                  { label: "Promedio de exámenes", val: `${avgScore}%`, sub: "últimas 8 unidades", color: "#0f3d4d", bg: "var(--wca-primary-dim)" },
                  { label: "Racha actual", val: "8 sem", sub: "sin faltar", color: "#92400e", bg: "var(--amber-dim)" },
                  { label: "Próximo nivel", val: "B2", sub: "al aprobar U12", color: "#0f3d4d", bg: "var(--wca-primary-dim)" },
                ].map((m, i) => (
                  <div key={i} style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 9 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>{m.val}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* Today + unit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: "var(--text-primary)" }}>Unidad activa — U9</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 11 }}>Expresión escrita</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.85, marginBottom: 14 }}>Aprende a estructurar textos formales e informales, correos y párrafos argumentativos en inglés.</div>
                  <div style={{ display: "flex", gap: 11 }}>
                    <button onClick={() => setView("practice")} style={{ flex: 1, padding: "8px", background: "#155266", color: "var(--bg-surface)", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Ir a practicar</button>
                    <button onClick={() => setView("exam")} style={{ flex: 1, padding: "8px", background: "transparent", color: "#155266", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Ir al examen</button>
                  </div>
                </div>
                <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: "var(--text-primary)" }}>Próximas clases en vivo</div>
                  {SCHEDULE.slice(0, 3).map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? "0.5px solid #e8f3f6" : "none" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: s.status === "next" ? "#155266" : "var(--wca-primary-dim)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 8, color: s.status === "next" ? "rgba(255,255,255,0.6)" : "#999", textTransform: "uppercase" }}>{s.day}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: s.status === "next" ? "var(--bg-surface)" : "var(--text-secondary)" }}>{s.date.split(" ")[0]}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{s.time}</div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>{s.unit}</div>
                      </div>
                      {s.status === "next" && <div style={{ fontSize: 12, background: "var(--green-dim)", color: "#065f46", padding: "6px 12px", borderRadius: 20, flexShrink: 0 }}>Próxima</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PROGRAM ── */}
          {view === "program" && (
            <div>
              <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Inglés B1 — Ciclo actual</div>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>12 unidades · Lunes inicia nueva unidad</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#155266" }}>{doneCount}/12</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>completadas</div>
                  </div>
                </div>
                <div style={{ height: 6, background: "var(--wca-primary-dim)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round(doneCount / 12 * 100)}%`, background: "#155266", borderRadius: 3 }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {UNITS.map((u, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                    background: u.status === "current" ? "#155266" : "var(--bg-surface)",
                    border: u.status === "current" ? "none" : "0.5px solid #d1dde3",
                    borderRadius: 10, opacity: u.status === "locked" ? 0.5 : 1,
                    cursor: u.status !== "locked" ? "pointer" : "default"
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: u.status === "done" ? "var(--green-dim)" : u.status === "current" ? "rgba(255,255,255,0.15)" : "var(--wca-primary-dim)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: u.status === "done" ? 14 : 11,
                      color: u.status === "done" ? "#065f46" : u.status === "current" ? "var(--bg-surface)" : "var(--text-tertiary)",
                      fontWeight: 600
                    }}>
                      {u.status === "done" ? "✓" : u.status === "locked" ? "🔒" : u.n}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: u.status === "current" ? "var(--bg-surface)" : "var(--text-primary)" }}>
                        U{u.n} — {u.title}
                      </div>
                      {u.status === "done" && <div style={{ fontSize: 12, color: "#059669", marginTop: 1 }}>Aprobada con {u.score}%</div>}
                      {u.status === "current" && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>En curso esta semana</div>}
                      {u.status === "locked" && <div style={{ fontSize: 12, color: "var(--border-strong)", marginTop: 1 }}>Bloqueada — aprueba el examen anterior</div>}
                    </div>
                    {u.status === "done" && (
                      <div style={{ height: 4, width: 50, background: "var(--green-dim)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${u.score}%`, background: "#059669", borderRadius: 2 }} />
                      </div>
                    )}
                    {u.status === "current" && (
                      <div style={{ fontSize: 12, background: "#ffbb23", color: "var(--bg-surface)", padding: "7px 14px", borderRadius: 20, flexShrink: 0 }}>Activa</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CLASSES ── */}
          {view === "classes" && (
            <div>
              <div style={{ background: "#155266", borderRadius: 14, padding: "18px 20px", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 4, letterSpacing: 0.5 }}>PRÓXIMA CLASE EN VIVO</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: "var(--bg-surface)", marginBottom: 9 }}>Lunes 16 Jun — 6:00 PM</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>U9: Expresión escrita · con José</div>
                <button style={{ padding: "9px 20px", background: "#ffbb23", color: "var(--bg-surface)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  ▷ Unirse a la clase
                </button>
              </div>
              <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: "var(--text-primary)" }}>Calendario de clases</div>
                {SCHEDULE.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? "0.5px solid #e8f3f6" : "none" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: s.status === "next" ? "#155266" : "var(--bg-page)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "0.5px solid var(--border)" }}>
                      <div style={{ fontSize: 8, color: s.status === "next" ? "rgba(255,255,255,0.5)" : "var(--text-tertiary)", textTransform: "uppercase" }}>{s.day}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: s.status === "next" ? "var(--bg-surface)" : "var(--text-primary)" }}>{s.date.split(" ")[0]}</div>
                      <div style={{ fontSize: 8, color: s.status === "next" ? "rgba(255,255,255,0.4)" : "var(--border-strong)" }}>{s.date.split(" ")[1]}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{s.time}</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{s.unit}</div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>Docente: {s.teacher}</div>
                    </div>
                    {s.status === "next"
                      ? <button style={{ fontSize: 12, background: "#ffbb23", color: "var(--bg-surface)", border: "none", padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit" }}>Unirse</button>
                      : <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Próximamente</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PRACTICE ── */}
          {view === "practice" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { title: "Videos de la lección", desc: "3 videos · ~45 min", icon: "▶", color: "var(--wca-primary-dim)", tc: "#0f3d4d" },
                  { title: "Ejercicios escritos", desc: "12 ejercicios · Auto-corrección", icon: "✎", color: "var(--green-dim)", tc: "#065f46" },
                  { title: "Flashcards vocabulario", desc: "24 tarjetas · Spaced repetition", icon: "⧉", color: "var(--amber-dim)", tc: "#92400e" },
                  { title: "Diálogos de práctica", desc: "5 situaciones reales", icon: "◎", color: "var(--wca-primary-dim)", tc: "#0f3d4d" },
                  { title: "Lectura complementaria", desc: "2 textos con preguntas", icon: "☰", color: "#fce4ec", tc: "#155266" },
                  { title: "Material de clase (PDF)", desc: "Notas del docente · U9", icon: "↓", color: "var(--wca-primary-dim)", tc: "var(--text-secondary)" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 42, borderRadius: 10, background: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: item.tc, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 3 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--bg-page)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", display: "inline-block" }}></span>
                  Plataforma disponible 24/7 — accede cuando quieras, desde cualquier dispositivo.
                </div>
              </div>
            </div>
          )}

          {/* ── EXAM ── */}
          {view === "exam" && (
            <div>
              {!examStarted && (
                <div>
                  <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 11 }}>✎</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Examen final — Unidad 9</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.8 }}>Expresión escrita · 20 preguntas · ~20 minutos<br />Necesitas <strong>70% o más</strong> para desbloquear la Unidad 10.</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 11, marginBottom: 20 }}>
                      {ATTEMPTS.map((a, i) => (
                        <div key={i} style={{ textAlign: "center" }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, margin: "0 auto 4px",
                            background: a.status === "fail" ? "var(--red-dim)" : a.status === "available" ? "var(--green-dim)" : "var(--wca-primary-dim)",
                            color: a.status === "fail" ? "#dc2626" : a.status === "available" ? "#059669" : "var(--text-tertiary)",
                            border: `1.5px solid ${a.status === "fail" ? "#fca5a5" : a.status === "available" ? "#a5d6a7" : "#e0e0e0"}`
                          }}>
                            {a.status === "fail" ? "✗" : a.status === "available" ? "→" : "○"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{a.label}</div>
                          {a.score && <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>{a.score}%</div>}
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "var(--amber-dim)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#92400e", marginBottom: 16, display: "inline-block" }}>
                      Intento 3 de 3 disponible — ¡prepárate bien!
                    </div>
                    <button onClick={() => setExamStarted(true)} style={{ display: "block", width: "100%", padding: 20, background: "#155266", color: "var(--bg-surface)", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Comenzar examen →
                    </button>
                  </div>
                </div>
              )}

              {examStarted && !examDone && (
                <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Pregunta {examQ + 1} de {examQuestions.length}</div>
                    <div style={{ fontSize: 12, background: "var(--wca-primary-dim)", padding: "7px 14px", borderRadius: 20, color: "var(--text-secondary)" }}>U9 · Expresión escrita</div>
                  </div>
                  <div style={{ height: 4, background: "var(--wca-primary-dim)", borderRadius: 2, marginBottom: 18, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${((examQ) / examQuestions.length) * 100}%`, background: "#155266", borderRadius: 2, transition: "width 0.4s" }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 16, lineHeight: 1.85 }}>{examQuestions[examQ].q}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    {examQuestions[examQ].opts.map((opt, i) => {
                      const isSelected = selected === i;
                      const isCorrect = i === examQuestions[examQ].ans;
                      const showResult = selected !== null;
                      let bg = "var(--bg-surface)", border = "0.5px solid #d1dde3", color = "var(--text-primary)";
                      if (showResult && isCorrect) { bg = "var(--green-dim)"; border = "1.5px solid #34d399"; color = "#065f46"; }
                      else if (showResult && isSelected && !isCorrect) { bg = "var(--red-dim)"; border = "1.5px solid #fca5a5"; color = "#dc2626"; }
                      else if (isSelected) { bg = "var(--wca-primary-dim)"; border = "1.5px solid #ffbb23"; color = "#0f3d4d"; }
                      return (
                        <button key={i} onClick={() => submitAnswer(i)} style={{ padding: "11px 14px", border, borderRadius: 8, background: bg, color, fontSize: 13, textAlign: "left", cursor: selected === null ? "pointer" : "default", fontFamily: "inherit", transition: "all 0.15s" }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {examDone && (
                <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 42, fontWeight: 700, color: examScore >= 70 ? "#059669" : "#dc2626", marginBottom: 4 }}>{examScore}%</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 9 }}>
                    {examScore >= 70 ? "¡Aprobado! 🎉" : "No aprobado — consulta a tu docente"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.8 }}>
                    {examScore >= 70
                      ? "Excelente trabajo. La Unidad 10 se ha desbloqueado automáticamente."
                      : "Agotaste tus 3 intentos. Tu docente José puede habilitarte un intento adicional."}
                  </div>
                  {examScore >= 70 && (
                    <div style={{ background: "var(--green-dim)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "left" }}>
                      <div style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>🔓 Unidad 10 desbloqueada — Pronunciación avanzada</div>
                      <div style={{ fontSize: 12, color: "#059669", marginTop: 3 }}>Disponible el próximo lunes con la clase en vivo de U10.</div>
                    </div>
                  )}
                  <button onClick={() => { setExamStarted(false); setExamDone(false); setExamQ(0); setExamAnswers([]); setSelected(null); }} style={{ padding: "9px 24px", background: "#155266", color: "var(--bg-surface)", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    Volver al examen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PROGRESS ── */}
          {view === "progress" && (
            <div>
              <div style={{ display: "flex", gap: 0, marginBottom: 16, overflow: "hidden", borderRadius: 10, border: "0.5px solid var(--border)" }}>
                {LEVEL_PATH.map((lv, i) => (
                  <div key={i} style={{
                    flex: 1, padding: "12px 8px", textAlign: "center",
                    background: lv.status === "done" ? "var(--green-dim)" : lv.status === "current" ? "#155266" : "var(--bg-page)",
                    borderRight: i < LEVEL_PATH.length - 1 ? "0.5px solid #d1dde3" : "none"
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: lv.status === "done" ? "#065f46" : lv.status === "current" ? "var(--bg-surface)" : "var(--border)" }}>{lv.code}</div>
                    <div style={{ fontSize: 11, color: lv.status === "done" ? "#059669" : lv.status === "current" ? "rgba(255,255,255,0.5)" : "var(--border-strong)", marginTop: 3 }}>{lv.name}</div>
                    <div style={{ fontSize: 12, marginTop: 6, color: lv.status === "done" ? "#059669" : lv.status === "current" ? "#ffbb23" : "var(--border)" }}>
                      {lv.status === "done" ? "✓" : lv.status === "current" ? "●" : "○"}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "var(--green-dim)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, color: "#059669", marginBottom: 9, fontWeight: 600 }}>✓ Nivel A1 completado</div>
                  <div style={{ fontSize: 12, color: "#059669", lineHeight: 1.85 }}>Certificado disponible en tu perfil.<br />Aprobado en febrero 2025.</div>
                  <div style={{ marginTop: 10, padding: "6px 12px", background: "var(--bg-surface)", borderRadius: 6, fontSize: 13, color: "#065f46", fontWeight: 500, display: "inline-block", cursor: "pointer" }}>↓ Descargar certificado A1</div>
                </div>
                <div style={{ background: "var(--green-dim)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, color: "#059669", marginBottom: 9, fontWeight: 600 }}>✓ Nivel A2 completado</div>
                  <div style={{ fontSize: 12, color: "#059669", lineHeight: 1.85 }}>Certificado disponible en tu perfil.<br />Aprobado en abril 2025.</div>
                  <div style={{ marginTop: 10, padding: "6px 12px", background: "var(--bg-surface)", borderRadius: 6, fontSize: 13, color: "#065f46", fontWeight: 500, display: "inline-block", cursor: "pointer" }}>↓ Descargar certificado A2</div>
                </div>
              </div>
              <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: "var(--text-primary)" }}>Rendimiento por unidad — B1</div>
                {UNITS.filter(u => u.score).map((u, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", width: 24 }}>U{u.n}</div>
                    <div style={{ flex: 1, height: 5, background: "var(--wca-primary-dim)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${u.score}%`, background: u.score >= 80 ? "#059669" : u.score >= 70 ? "#ffc107" : "#ef5350", borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: u.score >= 80 ? "#059669" : u.score >= 70 ? "#92400e" : "#dc2626", width: 32, textAlign: "right" }}>{u.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {view === "payments" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                {[
                  { label: "Estado actual", val: "Al día", color: "#065f46", bg: "var(--green-dim)" },
                  { label: "Próximo pago", val: "1 Jul", color: "#0f3d4d", bg: "var(--wca-primary-dim)" },
                  { label: "Total pagado", val: "$405", color: "var(--text-primary)", bg: "var(--bg-page)" },
                ].map((m, i) => (
                  <div key={i} style={{ background: m.bg, borderRadius: 10, padding: "12px 14px", border: "0.5px solid var(--border)" }}>
                    <div style={{ fontSize: 12, color: m.color, opacity: 0.7, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--bg-surface)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: "var(--text-primary)" }}>Historial de pagos</div>
                {PAYMENTS.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? "0.5px solid #e8f3f6" : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>✓</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{p.desc}</div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>{p.date}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{p.amount}</div>
                    <div style={{ fontSize: 12, background: "var(--green-dim)", color: "#065f46", padding: "6px 12px", borderRadius: 20 }}>Pagado</div>
                    <button style={{ fontSize: 12, background: "transparent", border: "0.5px solid #ddd", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "inherit" }}>↓ Recibo</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
