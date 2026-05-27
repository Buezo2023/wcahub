// ─── WCA Hub — Generador de reportes PDF ──────────────────────────
// Genera HTML institucional y abre ventana de impresión nativa.
// El usuario guarda como PDF desde el diálogo del sistema.
// Sin dependencias externas — funciona en cualquier navegador moderno.

const P    = "#155266";
const Y    = "#ffbb23";
const G    = "#059669";
const R    = "#dc2626";
const A    = "#d97706";
const GRAY = "#64748b";

// ── Shared CSS for all reports ────────────────────────────────────
const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #fff;
    padding: 0;
  }
  .page { max-width: 900px; margin: 0 auto; padding: 32px 40px; }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 3px solid ${P};
    margin-bottom: 28px;
  }
  .logo-badge {
    width: 42px; height: 42px; border-radius: 10px;
    background: ${P}; display: inline-flex;
    align-items: center; justify-content: center;
    font-size: 20px; font-weight: 900; color: ${Y};
    margin-right: 12px;
  }
  .org-name { font-size: 17px; font-weight: 800; color: ${P}; }
  .org-sub  { font-size: 10px; color: ${GRAY}; margin-top: 2px; letter-spacing: .5px; text-transform: uppercase; }
  .report-meta { text-align: right; }
  .report-title { font-size: 16px; font-weight: 800; color: #0f172a; }
  .report-date  { font-size: 11px; color: ${GRAY}; margin-top: 3px; }

  /* KPI grid */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .kpi {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 10px; padding: 14px 16px;
    border-left: 4px solid ${P};
  }
  .kpi-value { font-size: 22px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
  .kpi-label { font-size: 11px; font-weight: 600; color: ${GRAY}; text-transform: uppercase; letter-spacing: .5px; }
  .kpi-sub   { font-size: 10px; color: #94a3b8; margin-top: 3px; }

  /* Section titles */
  .section-title {
    font-size: 11px; font-weight: 700; color: ${GRAY};
    text-transform: uppercase; letter-spacing: .7px;
    margin: 20px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
  }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: ${P}; }
  thead th {
    padding: 9px 12px; text-align: left;
    font-size: 10px; font-weight: 700; color: #fff;
    text-transform: uppercase; letter-spacing: .5px;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #eff6ff; }
  tbody td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }

  /* Badges */
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 6px;
    font-size: 10px; font-weight: 700;
  }
  .badge-green  { background: #dcfce7; color: #166534; }
  .badge-red    { background: #fee2e2; color: #991b1b; }
  .badge-amber  { background: #fef3c7; color: #92400e; }
  .badge-blue   { background: #dbeafe; color: #1e40af; }
  .badge-purple { background: #ede9fe; color: #5b21b6; }

  /* Footer */
  .footer {
    margin-top: 40px; padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    display: flex; justify-content: space-between; align-items: center;
  }
  .footer-left  { font-size: 10px; color: #94a3b8; }
  .footer-right { font-size: 10px; color: #94a3b8; text-align: right; }

  /* Summary boxes */
  .summary-box {
    background: ${P}08; border: 1px solid ${P}25;
    border-radius: 10px; padding: 14px 18px; margin-bottom: 16px;
  }

  @media print {
    body { padding: 0; }
    .page { padding: 20px 28px; }
    @page { size: A4; margin: 1.5cm; }
    .no-print { display: none !important; }
  }
`;

// ── Layout helpers ─────────────────────────────────────────────────
function header(title, subtitle) {
  const now = new Date().toLocaleDateString("es-HN", {
    year: "numeric", month: "long", day: "numeric",
  });
  return `
    <div class="header">
      <div style="display:flex; align-items:center;">
        <span class="logo-badge">W</span>
        <div>
          <div class="org-name">World Connect Academy</div>
          <div class="org-sub">Plataforma de formación remota · LATAM</div>
        </div>
      </div>
      <div class="report-meta">
        <div class="report-title">${title}</div>
        <div class="report-date">${subtitle || ""} · Generado el ${now}</div>
      </div>
    </div>
  `;
}

function footer() {
  return `
    <div class="footer">
      <div class="footer-left">World Connect Academy — Reporte confidencial</div>
      <div class="footer-right">wcahub.vercel.app · info@worldconnectacademy.com</div>
    </div>
  `;
}

function kpis(items) {
  return `
    <div class="kpi-grid">
      ${items.map(({ label, value, sub, color }) => `
        <div class="kpi" style="border-left-color: ${color || P}">
          <div class="kpi-value" style="color: ${color || P}">${value}</div>
          <div class="kpi-label">${label}</div>
          ${sub ? `<div class="kpi-sub">${sub}</div>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function table(headers, rows, emptyMsg = "Sin datos disponibles") {
  if (!rows?.length) {
    return `<div style="padding:24px;text-align:center;color:${GRAY};font-size:12px;background:#f8fafc;border-radius:8px;margin-bottom:16px;">${emptyMsg}</div>`;
  }
  return `
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map(row => `<tr>${row.map(cell => `<td>${cell ?? "—"}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function sectionTitle(t) {
  return `<div class="section-title">${t}</div>`;
}

function openPDF(html, filename) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Permitir ventanas emergentes para descargar el PDF");
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${filename}</title>
      <style>${BASE_CSS}</style>
    </head>
    <body>
      <div class="page">${html}</div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

// ══════════════════════════════════════════════════════════════════
// REPORT BUILDERS
// ══════════════════════════════════════════════════════════════════

// ── 1. Informe Financiero Mensual ─────────────────────────────────
export function generateFinancialReport({ mrr, arr, collected, pending, overdue, payments, byProg, period }) {
  const month = period || new Date().toLocaleDateString("es-HN", { month: "long", year: "numeric" });

  const html = `
    ${header("Informe Financiero", month)}

    ${kpis([
      { label: "MRR",              value: `$${(mrr || 0).toLocaleString()}`,          color: P },
      { label: "ARR (proyección)", value: `$${((mrr || 0) * 12).toLocaleString()}`,   color: P },
      { label: "Cobrado este mes", value: `$${(collected || 0).toLocaleString()}`,    color: G },
      { label: "Pagos pendientes", value: pending?.length || 0,                       color: A },
      { label: "Cuentas vencidas", value: overdue?.length || 0,                       color: overdue?.length > 0 ? R : G },
    ])}

    ${sectionTitle("Ingresos por programa")}
    ${table(
      ["Programa", "Estudiantes activos", "Ingresos estimados"],
      Object.entries(byProg || {}).map(([prog, count]) => [
        prog.toUpperCase(),
        count,
        `$${(count * 95).toLocaleString()}`,
      ])
    )}

    ${sectionTitle("Pagos confirmados — ${month}")}
    ${table(
      ["Estudiante", "Email", "Programa", "Monto", "Método", "Fecha"],
      (payments || []).slice(0, 50).map(p => [
        p.student?.profile?.full_name || "—",
        p.student?.profile?.email || "—",
        (p.program_id || "—").toUpperCase(),
        `$${p.amount}`,
        p.method || "—",
        p.confirmed_at ? new Date(p.confirmed_at).toLocaleDateString("es-HN") : "—",
      ])
    )}

    ${overdue?.length > 0 ? `
      ${sectionTitle("Cuentas vencidas")}
      ${table(
        ["Estudiante", "Email", "Días vencido"],
        overdue.map(s => [s.name || s.full_name || "—", s.email || "—", s.days_overdue || "—"])
      )}
    ` : ""}

    ${footer()}
  `;

  openPDF(html, `WCA-Informe-Financiero-${month.replace(/ /g, "-")}`);
}

// ── 2. Informe Académico ──────────────────────────────────────────
export function generateAcademicReport({ students, groups, period }) {
  const month = period || new Date().toLocaleDateString("es-HN", { month: "long", year: "numeric" });
  const activeStudents  = (students || []).filter(s => s.state === "active");
  const byLevel         = activeStudents.reduce((acc, s) => { acc[s.level] = (acc[s.level] || 0) + 1; return acc; }, {});
  const avgAttendance   = activeStudents.length
    ? Math.round(activeStudents.reduce((a, s) => a + (s.attendance || 0), 0) / activeStudents.length)
    : 0;

  const html = `
    ${header("Informe Académico", month)}

    ${kpis([
      { label: "Estudiantes activos",  value: activeStudents.length,          color: P },
      { label: "Grupos activos",       value: (groups || []).length,          color: G },
      { label: "Asistencia promedio",  value: `${avgAttendance}%`,            color: avgAttendance >= 80 ? G : A },
      { label: "Nivel más poblado",    value: Object.entries(byLevel).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—", color: P },
    ])}

    ${sectionTitle("Distribución por nivel CEFR")}
    ${table(
      ["Nivel", "Estudiantes", "% del total"],
      Object.entries(byLevel)
        .sort((a, b) => ["A1","A2","B1","B2","C1"].indexOf(a[0]) - ["A1","A2","B1","B2","C1"].indexOf(b[0]))
        .map(([level, count]) => [
          `<span class="badge badge-blue">${level}</span>`,
          count,
          `${Math.round((count / activeStudents.length) * 100)}%`,
        ])
    )}

    ${sectionTitle("Estado de grupos")}
    ${table(
      ["Nivel", "Horario", "Días", "Docente", "Inscritos", "Cupos", "Ocupación"],
      (groups || []).map(g => {
        const occ = Math.round(((g.students || 0) / (g.capacity || 25)) * 100);
        return [
          `<span class="badge badge-blue">${g.level || "—"}</span>`,
          g.time || "—",
          g.days || "—",
          g.teacher || "Sin asignar",
          g.students || 0,
          g.capacity || 25,
          `<span class="badge ${occ >= 90 ? "badge-red" : occ >= 70 ? "badge-amber" : "badge-green"}">${occ}%</span>`,
        ];
      })
    )}

    ${sectionTitle("Listado completo de estudiantes activos")}
    ${table(
      ["#", "Nombre completo", "Email", "Nivel", "Tipo", "Asistencia", "Estado"],
      activeStudents.map((s, i) => [
        i + 1,
        s.name || "—",
        s.email || "—",
        `<span class="badge badge-blue">${s.level || "—"}</span>`,
        s.scholarship ? `<span class="badge badge-amber">Beca</span>` : `<span class="badge badge-blue">Regular</span>`,
        `${s.attendance || 0}%`,
        `<span class="badge ${s.state === "active" ? "badge-green" : "badge-red"}">${s.state === "active" ? "Activo" : "Suspendido"}</span>`,
      ])
    )}

    ${footer()}
  `;

  openPDF(html, `WCA-Informe-Academico-${month.replace(/ /g, "-")}`);
}

// ── 3. Informe de Matrículas (para UNAH-Cortés u organismos) ──────
export function generateEnrollmentReport({ students, period, institution }) {
  const month  = period || new Date().toLocaleDateString("es-HN", { month: "long", year: "numeric" });
  const active = (students || []).filter(s => s.state === "active");

  const html = `
    ${header("Informe de Matrícula", `${institution ? institution + " · " : ""}${month}`)}

    <div class="summary-box">
      <strong>Resumen ejecutivo:</strong> Al ${new Date().toLocaleDateString("es-HN")}, World Connect Academy
      cuenta con <strong>${active.length} estudiantes activos</strong> distribuidos en sus programas de
      Inglés CEFR y Asistente Virtual. El presente informe certifica la matrícula vigente
      para el período ${month}.
    </div>

    ${kpis([
      { label: "Total matriculados",   value: active.length,                                  color: P },
      { label: "Programa Inglés",      value: active.filter(s => s.programId === "en").length,  color: P },
      { label: "Programa VA",          value: active.filter(s => s.programId?.startsWith("va")).length, color: "#7c3aed" },
      { label: "Con beca",             value: active.filter(s => s.scholarship).length,        color: G },
    ])}

    ${sectionTitle("Nómina oficial de estudiantes matriculados")}
    ${table(
      ["#", "Apellidos y Nombre", "Correo electrónico", "Programa", "Nivel", "Condición"],
      active.map((s, i) => [
        i + 1,
        s.name || "—",
        s.email || "—",
        (s.programId || "—").toUpperCase(),
        s.level || "—",
        s.scholarship
          ? `<span class="badge badge-amber">Becado/a</span>`
          : `<span class="badge badge-green">Regular</span>`,
      ])
    )}

    <div style="margin-top:32px; padding-top:20px; border-top: 1px solid #e2e8f0;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:16px;">
        <div style="text-align:center; padding-top:32px; border-top: 1px solid #475569;">
          <div style="font-size:11px; color:${GRAY};">Director/a Académico/a</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">World Connect Academy</div>
        </div>
        <div style="text-align:center; padding-top:32px; border-top: 1px solid #475569;">
          <div style="font-size:11px; color:${GRAY};">Fecha y sello</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">${new Date().toLocaleDateString("es-HN")}</div>
        </div>
      </div>
    </div>

    ${footer()}
  `;

  openPDF(html, `WCA-Nomina-Matriculados-${month.replace(/ /g, "-")}`);
}

// ── 4. Informe de Leads / Pipeline de Ventas ──────────────────────
export function generateLeadsReport({ leads, period }) {
  const month    = period || new Date().toLocaleDateString("es-HN", { month: "long", year: "numeric" });
  const byStatus = (leads || []).reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});
  const converted = (leads || []).filter(l => l.status === "enrolled").length;
  const total     = leads?.length || 0;
  const convRate  = total ? Math.round((converted / total) * 100) : 0;

  const html = `
    ${header("Informe de Pipeline de Ventas", month)}

    ${kpis([
      { label: "Total leads",        value: total,                              color: P },
      { label: "Convertidos",        value: converted,                          color: G },
      { label: "Tasa de conversión", value: `${convRate}%`,                    color: convRate >= 30 ? G : A },
      { label: "En seguimiento",     value: byStatus["contacted"] || 0,        color: A },
    ])}

    ${sectionTitle("Pipeline por estado")}
    ${table(
      ["Estado", "Cantidad", "% del total"],
      Object.entries(byStatus).map(([status, count]) => {
        const badges = {
          new: "badge-blue", contacted: "badge-amber",
          enrolled: "badge-green", lost: "badge-red",
        };
        return [
          `<span class="badge ${badges[status] || "badge-blue"}">${status}</span>`,
          count,
          `${Math.round((count / total) * 100)}%`,
        ];
      })
    )}

    ${sectionTitle("Listado de leads")}
    ${table(
      ["Nombre", "Email", "Teléfono", "Programa", "Fuente", "Estado", "Fecha"],
      (leads || []).map(l => {
        const badges = {
          new: "badge-blue", contacted: "badge-amber",
          enrolled: "badge-green", lost: "badge-red",
        };
        return [
          l.name || "—",
          l.email || "—",
          l.phone || "—",
          (l.program_id || "—").toUpperCase(),
          l.source || "—",
          `<span class="badge ${badges[l.status] || "badge-blue"}">${l.status || "—"}</span>`,
          l.created_at ? new Date(l.created_at).toLocaleDateString("es-HN") : "—",
        ];
      })
    )}

    ${footer()}
  `;

  openPDF(html, `WCA-Pipeline-Ventas-${month.replace(/ /g, "-")}`);
}
