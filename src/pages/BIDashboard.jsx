import { useState, useEffect, useRef } from "react";

// ─── BRAND ────────────────────────────────────────────────────────
const B = {
  primary:"#155266", dark:"#0f3d4d", primaryDim:"#e8f3f6",
  secondary:"#ffbb23", secondaryDim:"#fff4d2", accent:"#fab82c",
  bg:"#f5f7fa", white:"#ffffff", text:"#1f2933", textSec:"#6b7280",
  border:"#d1dde3", borderLight:"#e8f3f6",
  green:"#059669", greenDim:"#d1fae5",
  red:"#dc2626", redDim:"#fee2e2",
  amber:"#ffbb23", amberDim:"#fff4d2",
  purple:"#7c3aed", purpleDim:"#ede9fe",
};

// ─── DATA ─────────────────────────────────────────────────────────
const MRR_DATA = [
  { month:"Ene", mrr:8400,  students:89,  new:12, churned:3  },
  { month:"Feb", mrr:9800,  students:104, new:18, churned:3  },
  { month:"Mar", mrr:11200, students:119, new:19, churned:4  },
  { month:"Abr", mrr:12900, students:137, new:22, churned:4  },
  { month:"May", mrr:14600, students:155, new:24, churned:6  },
  { month:"Jun", mrr:15800, students:168, new:20, churned:7  },
  { month:"Jul", mrr:17200, students:183, new:21, churned:6  },
  { month:"Ago", mrr:17900, students:190, new:14, churned:7  },
  { month:"Sep", mrr:16800, students:178, new:8,  churned:20 },
  { month:"Oct", mrr:17600, students:187, new:16, churned:7  },
  { month:"Nov", mrr:18800, students:199, new:18, churned:6  },
  { month:"Dic", mrr:18420, students:196, new:12, churned:15 },
];

const COHORTS = [
  { cohort:"Ene 25", students:12, m1:100, m2:92, m3:83, m4:75, m5:75, m6:67 },
  { cohort:"Feb 25", students:18, m1:100, m2:89, m3:78, m4:72, m5:72, m6:67 },
  { cohort:"Mar 25", students:19, m1:100, m2:95, m3:89, m4:84, m5:79, m6:null },
  { cohort:"Abr 25", students:22, m1:100, m2:91, m3:86, m4:82, m5:null, m6:null },
  { cohort:"May 25", students:24, m1:100, m2:88, m3:83, m4:null, m5:null, m6:null },
  { cohort:"Jun 25", students:20, m1:100, m2:90, m3:null, m4:null, m5:null, m6:null },
];

const CHANNELS = [
  { name:"Instagram",     leads:148, conv:42, rate:28, rev:3990,  color:B.primary   },
  { name:"Referidos",     leads:89,  conv:37, rate:42, rev:3515,  color:B.green     },
  { name:"Google Ads",    leads:67,  conv:18, rate:27, rev:1710,  color:B.amber     },
  { name:"WhatsApp org.", leads:44,  conv:20, rate:45, rev:1900,  color:B.purple    },
  { name:"LinkedIn",      leads:31,  conv:11, rate:35, rev:1045,  color:B.dark      },
  { name:"Orgánico/SEO",  leads:28,  conv:8,  rate:29, rev:760,   color:B.textSec   },
];

const LEVEL_DIST = [
  { level:"A1", students:55, pct:41, color:B.primary    },
  { level:"A2", students:32, pct:24, color:B.dark       },
  { level:"B1", students:33, pct:25, color:B.green      },
  { level:"B2", students:8,  pct:6,  color:B.amber      },
  { level:"C1", students:6,  pct:4,  color:B.purple     },
];

const TOP_STUDENTS = [
  { name:"Isabel Navarro", level:"C1", xp:5840, attendance:98, country:"🇪🇸" },
  { name:"Ana Mejía",      level:"A1", xp:4210, attendance:96, country:"🇨🇴" },
  { name:"Sofía Ramos",    level:"B1", xp:3980, attendance:88, country:"🇦🇷" },
  { name:"Valentina Cruz", level:"A1", xp:3760, attendance:91, country:"🇨🇴" },
  { name:"María López",    level:"B1", xp:3540, attendance:92, country:"🇭🇳" },
];

const COUNTRIES = [
  { name:"Honduras", students:52, flag:"🇭🇳", pct:38 },
  { name:"Colombia", students:28, flag:"🇨🇴", pct:20 },
  { name:"México",   students:22, flag:"🇲🇽", pct:16 },
  { name:"Argentina",students:18, flag:"🇦🇷", pct:13 },
  { name:"España",   students:9,  flag:"🇪🇸", pct:7  },
  { name:"Otros",    students:8,  flag:"🌍",   pct:6  },
];

const WEEKLY = [
  { day:"L", sessions:9, attendance:86 },
  { day:"M", sessions:9, attendance:82 },
  { day:"X", sessions:9, attendance:89 },
  { day:"J", sessions:0, attendance:0  },
  { day:"V", sessions:9, attendance:84 },
  { day:"S", sessions:0, attendance:0  },
  { day:"D", sessions:0, attendance:0  },
];

// ─── HELPERS ─────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1000) return `$${(n/1000).toFixed(1)}k`;
  return `$${n}`;
}
function pct(a, b) { return b ? Math.round((a/b)*100) : 0; }
function trend(data, key) {
  const last = data[data.length-1][key];
  const prev = data[data.length-2][key];
  const diff = ((last - prev)/prev*100).toFixed(1);
  return { diff, up: diff >= 0 };
}

// ─── ANIMATED NUMBER ─────────────────────────────────────────────
function AnimNum({ value, prefix="", suffix="", decimals=0, duration=1200 }) {
  const [displayed, setDisplayed] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    start.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  const formatted = decimals > 0 ? displayed.toFixed(decimals) : Math.round(displayed).toLocaleString();
  return <span>{prefix}{formatted}{suffix}</span>;
}

// ─── MINI SPARKLINE ──────────────────────────────────────────────
function Sparkline({ data, color, height=32, width=80 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 4) + 2;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:"visible" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points.split(" ").pop().split(",")[0]} cy={points.split(" ").pop().split(",")[1]} r={3} fill={color} />
    </svg>
  );
}

// ─── BAR ─────────────────────────────────────────────────────────
function MiniBar({ value, max, color, height=6 }) {
  const w = Math.round((value / max) * 100);
  return (
    <div style={{ height, background:B.borderLight, borderRadius:3, overflow:"hidden", flex:1 }}>
      <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:3, transition:"width 1s ease" }} />
    </div>
  );
}

// ─── COHORT COLOR ────────────────────────────────────────────────
function cohortBg(val) {
  if (val === null) return "#f5f7fa";
  if (val >= 90) return "#0f3d4d";
  if (val >= 80) return "#155266";
  if (val >= 70) return "#1a6a82";
  if (val >= 60) return "#5a9fb5";
  return "#a8ccd8";
}
function cohortText(val) {
  if (val === null) return B.border;
  return val >= 70 ? "#fff" : B.text;
}

// ─── MAIN ─────────────────────────────────────────────────────────
const VIEWS = [
  { id:"overview",  icon:"ti-layout-dashboard", label:"Overview"    },
  { id:"revenue",   icon:"ti-coin",             label:"Revenue"     },
  { id:"retention", icon:"ti-refresh",          label:"Retención"   },
  { id:"channels",  icon:"ti-antenna",          label:"Canales"     },
  { id:"academic",  icon:"ti-school",           label:"Académico"   },
];

export default function BIDashboard() {
  const [view, setView]       = useState("overview");
  const [period, setPeriod]   = useState("12m");
  const [animate, setAnimate] = useState(true);

  useEffect(() => { setAnimate(false); setTimeout(() => setAnimate(true), 50); }, [view]);

  const currentMRR   = MRR_DATA[MRR_DATA.length - 1].mrr;
  const prevMRR      = MRR_DATA[MRR_DATA.length - 2].mrr;
  const mrrGrowth    = ((currentMRR - prevMRR) / prevMRR * 100).toFixed(1);
  const totalStudents= MRR_DATA[MRR_DATA.length - 1].students;
  const avgChurn     = (MRR_DATA.slice(-3).reduce((a,m) => a + m.churned, 0) / 3).toFixed(1);
  const churnRate    = ((avgChurn / totalStudents) * 100).toFixed(1);
  const arpu         = Math.round(currentMRR / totalStudents);
  const ltv          = Math.round(arpu / (parseFloat(churnRate) / 100));
  const annualRun    = currentMRR * 12;

  return (
    <div style={{ display:"flex", height:720, background:B.bg, borderRadius:16, overflow:"hidden", border:`1px solid ${B.border}`, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width:184, background:B.primary, display:"flex", flexDirection:"column", padding:"0 0 14px", flexShrink:0 }}>
        <div style={{ padding:"18px 16px 16px", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:8 }}>
          <div style={{ fontSize:9, color:B.secondary, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>WCA Academy</div>
          <div style={{ fontSize:15, fontWeight:800, color:"#fff" }}>Business<br />Intelligence</div>
        </div>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            display:"flex", alignItems:"center", gap:9, padding:"9px 16px", border:"none",
            background: view===v.id ? "rgba(255,255,255,.12)" : "transparent",
            color: view===v.id ? "#fff" : "rgba(255,255,255,.45)",
            fontSize:11, cursor:"pointer", textAlign:"left",
            borderLeft:`2px solid ${view===v.id ? B.secondary : "transparent"}`,
            transition:"all .15s", fontFamily:"inherit", fontWeight: view===v.id ? 600 : 400,
          }}>
            <i className={`ti ${v.icon}`} style={{ fontSize:14, width:16 }} aria-hidden="true" />
            {v.label}
          </button>
        ))}

        {/* Period selector */}
        <div style={{ margin:"auto 16px 0", padding:"14px 0 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Período</div>
          <div style={{ display:"flex", gap:4 }}>
            {["3m","6m","12m"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ flex:1, padding:"5px 0", fontSize:10, border:`1px solid ${period===p?"rgba(255,255,255,.4)":"rgba(255,255,255,.1)"}`, borderRadius:6, background: period===p?"rgba(255,255,255,.15)":"transparent", color: period===p?"#fff":"rgba(255,255,255,.35)", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>{p}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Topbar */}
        <div style={{ height:52, background:B.white, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:B.text }}>
              {{ overview:"Resumen ejecutivo", revenue:"Revenue & financiero", retention:"Retención & churn", channels:"Canales de adquisición", academic:"Rendimiento académico" }[view]}
            </div>
            <div style={{ fontSize:10, color:B.textSec }}>Datos en tiempo real · wcahub.com</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:B.green }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:B.green, animation:"pulse 2s infinite" }} />
              Live data
            </div>
            <div style={{ fontSize:10, background:B.primaryDim, color:B.primary, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>
              Dic 2025
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
          .fade-up { animation: fadeUp .35s ease forwards; }
        `}</style>

        <div style={{ flex:1, overflow:"auto", padding:18 }} className="fade-up">

          {/* ── OVERVIEW ── */}
          {view === "overview" && (
            <div>
              {/* KPI row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                {[
                  { label:"MRR",          value:currentMRR, prefix:"$", suffix:"", color:B.primary, icon:"ti-trending-up", trend:`${mrrGrowth}%`, up:parseFloat(mrrGrowth)>0, sparkData:MRR_DATA.map(m=>m.mrr) },
                  { label:"Estudiantes",  value:totalStudents, prefix:"", suffix:"", color:B.green, icon:"ti-users", trend:"+13 este mes", up:true, sparkData:MRR_DATA.map(m=>m.students) },
                  { label:"Churn rate",   value:churnRate, prefix:"", suffix:"%", color:parseFloat(churnRate)>5?B.red:B.green, icon:"ti-door-exit", trend:`${avgChurn} avg/mes`, up:false, sparkData:MRR_DATA.map(m=>m.churned) },
                  { label:"ARR",          value:annualRun, prefix:"$", suffix:"", color:B.secondary, icon:"ti-calendar", trend:`LTV ≈ $${ltv}`, up:true, sparkData:MRR_DATA.map(m=>m.mrr*12) },
                ].map((k,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${k.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <div style={{ fontSize:10, color:B.textSec }}>{k.label}</div>
                      <i className={`ti ${k.icon}`} style={{ fontSize:14, color:k.color }} aria-hidden="true" />
                    </div>
                    <div style={{ fontSize:22, fontWeight:800, color:B.text, lineHeight:1, marginBottom:4 }}>
                      {animate && <AnimNum value={k.value} prefix={k.prefix} suffix={k.suffix} decimals={k.label==="Churn rate"?1:0} />}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:10, color:k.up?B.green:B.red, fontWeight:600 }}>
                        {k.up?"↑":"↓"} {k.trend}
                      </div>
                      <Sparkline data={k.sparkData} color={k.color} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Two col */}
              <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:12, marginBottom:12 }}>
                {/* MRR Chart */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:B.text }}>MRR — 12 meses</div>
                    <div style={{ fontSize:10, color:B.green, fontWeight:600 }}>↑ 119% YoY</div>
                  </div>
                  <svg width="100%" height={110} viewBox="0 0 400 110" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={B.primary} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={B.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const max = Math.max(...MRR_DATA.map(m=>m.mrr));
                      const pts = MRR_DATA.map((m,i) => {
                        const x = (i/(MRR_DATA.length-1))*388+6;
                        const y = 100 - (m.mrr/max)*88 + 6;
                        return `${x},${y}`;
                      });
                      const areaPath = `M${pts[0]} ${pts.slice(1).map(p=>`L${p}`).join(" ")} L394,106 L6,106 Z`;
                      const linePath = `M${pts[0]} ${pts.slice(1).map(p=>`L${p}`).join(" ")}`;
                      return (
                        <>
                          <path d={areaPath} fill="url(#mrrGrad)" />
                          <path d={linePath} fill="none" stroke={B.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                          {MRR_DATA.map((m,i) => {
                            const [x,y] = pts[i].split(",").map(Number);
                            return (
                              <g key={i}>
                                <circle cx={x} cy={y} r={3} fill={B.primary} />
                                <text x={x} y={115} textAnchor="middle" fontSize={7} fill={B.textSec}>{m.month}</text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Level distribution */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:14 }}>Distribución por nivel</div>
                  {LEVEL_DIST.map(l => (
                    <div key={l.level} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
                      <div style={{ width:28, height:20, borderRadius:4, background:l.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff", flexShrink:0 }}>{l.level}</div>
                      <MiniBar value={l.pct} max={100} color={l.color} height={7} />
                      <div style={{ fontSize:10, color:B.textSec, width:50, textAlign:"right", flexShrink:0 }}>{l.students} ({l.pct}%)</div>
                    </div>
                  ))}
                  <div style={{ marginTop:10, padding:"8px 10px", background:B.bg, borderRadius:8, display:"flex", justifyContent:"space-between", fontSize:10 }}>
                    <span style={{ color:B.textSec }}>ARPU</span>
                    <span style={{ fontWeight:700, color:B.primary }}>${arpu}/mes</span>
                  </div>
                </div>
              </div>

              {/* Three col bottom */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {/* Countries */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:12 }}>Estudiantes por país</div>
                  {COUNTRIES.map(c => (
                    <div key={c.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <span style={{ fontSize:14 }}>{c.flag}</span>
                      <div style={{ fontSize:11, color:B.text, width:70, flexShrink:0 }}>{c.name}</div>
                      <MiniBar value={c.pct} max={100} color={B.primary} height={5} />
                      <div style={{ fontSize:10, color:B.textSec, width:22, textAlign:"right", flexShrink:0 }}>{c.students}</div>
                    </div>
                  ))}
                </div>

                {/* New vs Churned */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:12 }}>Altas vs Bajas (6m)</div>
                  <svg width="100%" height={110} viewBox="0 0 200 110" preserveAspectRatio="none">
                    {MRR_DATA.slice(-6).map((m,i) => {
                      const bw = 24, gap = 8, x0 = i*(bw*2+gap)+4;
                      const maxV = Math.max(...MRR_DATA.map(m=>m.new));
                      const nh = (m.new/maxV)*80;
                      const ch = (m.churned/maxV)*80;
                      return (
                        <g key={i}>
                          <rect x={x0} y={90-nh} width={bw} height={nh} rx={3} fill={B.green} opacity={0.85} />
                          <rect x={x0+bw+2} y={90-ch} width={bw} height={ch} rx={3} fill={B.red} opacity={0.85} />
                          <text x={x0+bw} y={104} textAnchor="middle" fontSize={7} fill={B.textSec}>{m.month}</text>
                        </g>
                      );
                    })}
                    <text x={2} y={8} fontSize={7} fill={B.green}>■ Nuevos</text>
                    <text x={60} y={8} fontSize={7} fill={B.red}>■ Bajas</text>
                  </svg>
                </div>

                {/* Top students */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:12 }}>Top estudiantes XP</div>
                  {TOP_STUDENTS.map((s,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <div style={{ fontSize:11, fontWeight:800, color: i===0?B.secondary:i===1?"#94a3b8":"#cd7f32", width:14 }}>{i+1}</div>
                      <span style={{ fontSize:13 }}>{s.country}</span>
                      <div style={{ fontSize:11, color:B.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name.split(" ")[0]}</div>
                      <div style={{ fontSize:10, fontWeight:600, color:B.primary }}>{s.xp.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── REVENUE ── */}
          {view === "revenue" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                {[
                  { label:"MRR actual",    value:"$18,420", sub:`↑ ${mrrGrowth}% vs nov`, color:B.primary },
                  { label:"ARR proyectado",value:"$221k",   sub:"A ritmo actual",           color:B.green },
                  { label:"ARPU",          value:`$${arpu}`, sub:"Por estudiante/mes",       color:B.amber },
                  { label:"LTV estimado",  value:`$${ltv}`, sub:`Churn ${churnRate}%/mes`,   color:B.purple },
                ].map((k,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${k.color}` }}>
                    <div style={{ fontSize:10, color:B.textSec, marginBottom:6 }}>{k.label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:B.text, lineHeight:1, marginBottom:4 }}>{k.value}</div>
                    <div style={{ fontSize:10, color:B.textSec }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Full MRR chart */}
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text }}>Evolución MRR mensual</div>
                  <div style={{ display:"flex", gap:12, fontSize:10, color:B.textSec }}>
                    <span>Mín: $8,400 (Ene)</span>
                    <span>Máx: $18,800 (Nov)</span>
                    <span style={{ color:B.green, fontWeight:600 }}>+119% YoY</span>
                  </div>
                </div>
                <svg width="100%" height={160} viewBox="0 0 600 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={B.primary} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={B.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const max = 20000, min = 6000;
                    const pts = MRR_DATA.map((m,i) => {
                      const x = (i/(MRR_DATA.length-1))*580+10;
                      const y = 140 - ((m.mrr-min)/(max-min))*125 + 5;
                      return { x, y, m };
                    });
                    const pStr = pts.map(p=>`${p.x},${p.y}`).join(" ");
                    const area = `M${pts[0].x},${pts[0].y} ${pts.slice(1).map(p=>`L${p.x},${p.y}`).join(" ")} L${pts[pts.length-1].x},148 L${pts[0].x},148 Z`;
                    return (
                      <>
                        {[8000,12000,16000,20000].map(v=>{
                          const y=140-((v-min)/(max-min))*125+5;
                          return <line key={v} x1={10} y1={y} x2={590} y2={y} stroke={B.borderLight} strokeWidth={0.8} />;
                        })}
                        <path d={area} fill="url(#revenueGrad)" />
                        <polyline points={pStr} fill="none" stroke={B.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        {pts.map((p,i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r={4} fill={B.white} stroke={B.primary} strokeWidth={2} />
                            <text x={p.x} y={158} textAnchor="middle" fontSize={8} fill={B.textSec}>{p.m.month}</text>
                            <text x={p.x} y={p.y-8} textAnchor="middle" fontSize={7} fill={B.primary} fontWeight="600">${(p.m.mrr/1000).toFixed(1)}k</text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Revenue breakdown */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:12 }}>Ingresos por programa</div>
                  {[
                    { name:"Inglés completo", rev:9595, pct:52, color:B.primary },
                    { name:"Inglés + VA",     rev:5950, pct:32, color:B.dark   },
                    { name:"VA solo",         rev:1875, pct:10, color:B.amber  },
                    { name:"Becas",           rev:1000, pct:6,  color:B.green  },
                  ].map(p => (
                    <div key={p.name} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:p.color, flexShrink:0 }} />
                      <div style={{ fontSize:11, color:B.text, flex:1 }}>{p.name}</div>
                      <MiniBar value={p.pct} max={100} color={p.color} height={6} />
                      <div style={{ fontSize:10, fontWeight:600, color:B.text, width:50, textAlign:"right" }}>${p.rev.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:12 }}>Métodos de pago</div>
                  {[
                    { name:"Stripe (tarjeta)", pct:58, students:114, color:B.primary },
                    { name:"Transferencia",    pct:30, students:59,  color:B.amber  },
                    { name:"Efectivo",         pct:7,  students:14,  color:B.green  },
                    { name:"B2B factura",       pct:5,  students:9,   color:B.purple },
                  ].map(m => (
                    <div key={m.name} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:m.color, flexShrink:0 }} />
                      <div style={{ fontSize:11, color:B.text, flex:1 }}>{m.name}</div>
                      <MiniBar value={m.pct} max={100} color={m.color} height={6} />
                      <div style={{ fontSize:10, color:B.textSec, width:50, textAlign:"right" }}>{m.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── RETENTION ── */}
          {view === "retention" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
                {[
                  { label:"Churn mensual", value:`${churnRate}%`, sub:"Promedio últimos 3m", color:parseFloat(churnRate)<5?B.green:B.red },
                  { label:"Retención M3",  value:"83%",  sub:"Cohorte promedio",  color:B.primary },
                  { label:"Retención M6",  value:"67%",  sub:"Cohorte promedio",  color:B.amber },
                ].map((k,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${k.color}` }}>
                    <div style={{ fontSize:10, color:B.textSec, marginBottom:6 }}>{k.label}</div>
                    <div style={{ fontSize:26, fontWeight:800, color:k.color, lineHeight:1, marginBottom:4 }}>{k.value}</div>
                    <div style={{ fontSize:10, color:B.textSec }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Cohort table */}
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:14 }}>Análisis de cohortes — Retención mensual</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                  <thead>
                    <tr>
                      <th style={{ padding:"8px 10px", textAlign:"left", fontSize:9, fontWeight:600, color:B.textSec, textTransform:"uppercase", letterSpacing:.5 }}>Cohorte</th>
                      <th style={{ padding:"8px 10px", textAlign:"center", fontSize:9, fontWeight:600, color:B.textSec }}>Alumnos</th>
                      {["Mes 1","Mes 2","Mes 3","Mes 4","Mes 5","Mes 6"].map(m => (
                        <th key={m} style={{ padding:"8px 10px", textAlign:"center", fontSize:9, fontWeight:600, color:B.textSec }}>{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COHORTS.map((c,i) => (
                      <tr key={i}>
                        <td style={{ padding:"6px 10px", fontWeight:600, color:B.text, fontSize:11 }}>{c.cohort}</td>
                        <td style={{ padding:"6px 10px", textAlign:"center", fontSize:11, color:B.textSec }}>{c.students}</td>
                        {[c.m1,c.m2,c.m3,c.m4,c.m5,c.m6].map((v,j) => (
                          <td key={j} style={{ padding:"4px 6px", textAlign:"center" }}>
                            <div style={{ background:cohortBg(v), color:cohortText(v), borderRadius:6, padding:"5px 2px", fontSize:10, fontWeight:600, minWidth:36 }}>
                              {v !== null ? `${v}%` : "—"}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display:"flex", gap:8, marginTop:10, fontSize:9, color:B.textSec }}>
                  {[[B.dark,"≥90%"],[B.primary,"80–90%"],["#1a6a82","70–80%"],["#5a9fb5","60–70%"],["#a8ccd8","<60%"]].map(([c,l]) => (
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:3 }}>
                      <div style={{ width:12, height:12, borderRadius:3, background:c }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Churn reasons */}
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:12 }}>Motivos de baja estimados (últimos 3m)</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[
                    { reason:"Problemas económicos", pct:38, color:B.red },
                    { reason:"Falta de tiempo",      pct:27, color:B.amber },
                    { reason:"Sin seguimiento",      pct:18, color:B.primary },
                    { reason:"Cambió a otra plataforma", pct:10, color:B.purple },
                    { reason:"Viaje / reubicación",  pct:7,  color:B.green },
                  ].map((r,i) => (
                    <div key={i} style={{ background:B.bg, borderRadius:9, padding:"10px 12px" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:r.color }}>{r.pct}%</div>
                      <div style={{ fontSize:10, color:B.textSec, lineHeight:1.4 }}>{r.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CHANNELS ── */}
          {view === "channels" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${B.primary}` }}>
                  <div style={{ fontSize:10, color:B.textSec, marginBottom:6 }}>Total leads (año)</div>
                  <div style={{ fontSize:24, fontWeight:800, color:B.text }}>407</div>
                  <div style={{ fontSize:10, color:B.textSec }}>6 canales activos</div>
                </div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${B.green}` }}>
                  <div style={{ fontSize:10, color:B.textSec, marginBottom:6 }}>Tasa de conversión avg</div>
                  <div style={{ fontSize:24, fontWeight:800, color:B.green }}>33%</div>
                  <div style={{ fontSize:10, color:B.textSec }}>Referidos: 42% (mejor)</div>
                </div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${B.amber}` }}>
                  <div style={{ fontSize:10, color:B.textSec, marginBottom:6 }}>CAC promedio</div>
                  <div style={{ fontSize:24, fontWeight:800, color:B.amber }}>$47</div>
                  <div style={{ fontSize:10, color:B.textSec }}>LTV/CAC ratio: {Math.round(ltv/47)}x</div>
                </div>
              </div>

              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden", marginBottom:12 }}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${B.border}`, fontSize:12, fontWeight:700, color:B.text }}>Rendimiento por canal</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                  <thead>
                    <tr style={{ background:B.bg }}>
                      {["Canal","Leads","Convertidos","Tasa conv.","Revenue","Eficiencia"].map(h => (
                        <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:9, fontWeight:600, color:B.textSec, letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CHANNELS.map((c,i) => (
                      <tr key={i} style={{ borderTop:`1px solid ${B.borderLight}` }}>
                        <td style={{ padding:"11px 12px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:c.color }} />
                            <span style={{ fontWeight:600, color:B.text }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ padding:"11px 12px", color:B.textSec }}>{c.leads}</td>
                        <td style={{ padding:"11px 12px", color:B.textSec }}>{c.conv}</td>
                        <td style={{ padding:"11px 12px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <MiniBar value={c.rate} max={50} color={c.rate>=40?B.green:c.rate>=30?B.amber:B.red} height={5} />
                            <span style={{ fontSize:10, fontWeight:700, color:c.rate>=40?B.green:c.rate>=30?B.amber:B.red }}>{c.rate}%</span>
                          </div>
                        </td>
                        <td style={{ padding:"11px 12px", fontWeight:600, color:B.text }}>${c.rev.toLocaleString()}</td>
                        <td style={{ padding:"11px 12px" }}>
                          <span style={{ fontSize:9, padding:"2px 8px", borderRadius:20, background:c.rate>=40?B.greenDim:c.rate>=30?B.amberDim:B.redDim, color:c.rate>=40?"#065f46":c.rate>=30?"#92400e":B.red, fontWeight:600 }}>
                            {c.rate>=40?"⭐ Excelente":c.rate>=30?"✓ Bueno":"↓ Mejorar"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background:B.secondaryDim, border:`1px solid ${B.amber}40`, borderRadius:12, padding:"11px 14px", fontSize:11, color:"#92400e", display:"flex", gap:8 }}>
                <i className="ti ti-bulb" style={{ fontSize:13, flexShrink:0, marginTop:1 }} aria-hidden="true" />
                <div><strong>Insight:</strong> Los referidos tienen la tasa de conversión más alta (42%) y el CAC más bajo (~$0). Cada estudiante satisfecho es tu mejor canal de adquisición. Un programa de referidos con incentivo de descuento puede duplicar este canal.</div>
              </div>
            </div>
          )}

          {/* ── ACADEMIC ── */}
          {view === "academic" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                {[
                  { label:"Asistencia promedio", value:"85%", sub:"Todos los grupos", color:B.green },
                  { label:"Tasa de aprobación", value:"78%", sub:"Exámenes de unidad", color:B.primary },
                  { label:"Estudiantes en riesgo", value:"4", sub:"Asist. <70% o promedio <65%", color:B.red },
                  { label:"Próximos a graduar", value:"3", sub:"En unidad 10–12 de C1", color:B.amber },
                ].map((k,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"13px 15px", borderTop:`3px solid ${k.color}` }}>
                    <div style={{ fontSize:10, color:B.textSec, marginBottom:6 }}>{k.label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
                    <div style={{ fontSize:10, color:B.textSec, marginTop:4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:12, marginBottom:12 }}>
                {/* Weekly activity */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:14 }}>Actividad semanal típica</div>
                  <svg width="100%" height={100} viewBox="0 0 280 100" preserveAspectRatio="none">
                    {WEEKLY.map((d,i) => {
                      const x = i * 40 + 10;
                      const h = d.attendance ? (d.attendance/100)*70 : 4;
                      const y = 80 - h;
                      const isClass = d.sessions > 0;
                      return (
                        <g key={i}>
                          <rect x={x} y={y} width={24} height={h} rx={4} fill={isClass?B.primary:B.borderLight} />
                          {isClass && <text x={x+12} y={y-4} textAnchor="middle" fontSize={7} fill={B.primary} fontWeight="600">{d.attendance}%</text>}
                          <text x={x+12} y={94} textAnchor="middle" fontSize={8} fill={B.textSec}>{d.day}</text>
                        </g>
                      );
                    })}
                  </svg>
                  <div style={{ fontSize:10, color:B.textSec, marginTop:4 }}>Clases en vivo: L, M, V — Práctica libre: M, J, S, D</div>
                </div>

                {/* Exam pass rates by level */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:12 }}>Tasa de aprobación por nivel</div>
                  {[
                    { level:"A1", rate:82, attempts:1.4 },
                    { level:"A2", rate:79, attempts:1.6 },
                    { level:"B1", rate:75, attempts:1.8 },
                    { level:"B2", rate:71, attempts:2.0 },
                    { level:"C1", rate:68, attempts:2.2 },
                  ].map(l => (
                    <div key={l.level} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
                      <div style={{ width:24, height:18, borderRadius:4, background:levelBg(l.level), display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:levelCol(l.level) }}>{l.level}</div>
                      <MiniBar value={l.rate} max={100} color={l.rate>=80?B.green:l.rate>=70?B.amber:B.red} height={6} />
                      <span style={{ fontSize:10, fontWeight:700, color:l.rate>=80?B.green:l.rate>=70?B.amber:B.red, width:28 }}>{l.rate}%</span>
                      <span style={{ fontSize:9, color:B.textSec }}>{l.attempts} int. avg</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher performance */}
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:B.text, marginBottom:12 }}>Rendimiento de docentes</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {[
                    { name:"Sofía Estrada",  level:"C1", att:100, rating:4.9, students:6  },
                    { name:"Ana Torres",     level:"B1", att:95,  rating:4.9, students:33 },
                    { name:"Carlos Medina",  level:"B2", att:93,  rating:4.7, students:8  },
                    { name:"María Paredes",  level:"A2", att:92,  rating:4.6, students:20 },
                    { name:"José Rodríguez", level:"A1", att:97,  rating:4.8, students:55 },
                    { name:"Luis Gutiérrez", level:"A2", att:88,  rating:4.4, students:12 },
                  ].map((t,i) => (
                    <div key={i} style={{ background:B.bg, borderRadius:9, padding:"10px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:B.text }}>{t.name}</div>
                        <span style={{ fontSize:9, background:B.secondaryDim, color:"#92400e", padding:"1px 6px", borderRadius:10, fontWeight:600 }}>★ {t.rating}</span>
                      </div>
                      <div style={{ fontSize:9, color:B.textSec, marginBottom:6 }}>{t.level} · {t.students} estudiantes</div>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <MiniBar value={t.att} max={100} color={t.att>=95?B.green:B.amber} height={4} />
                        <span style={{ fontSize:9, color:B.textSec }}>{t.att}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function levelBg(l) {
  return { A1:"#e8f3f6", A2:"#dde6e9", B1:"#d1fae5", B2:"#ede9fe", C1:"#d1fae5" }[l] || "#e8f3f6";
}
function levelCol(l) {
  return { A1:"#155266", A2:"#0f3d4d", B1:"#065f46", B2:"#4c1d95", C1:"#065f46" }[l] || "#155266";
}
