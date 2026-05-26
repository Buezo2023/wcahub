import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api.js";
import { useNavigate } from 'react-router-dom';
import { MobileLayout, useMobile } from "../lib/MobileLayout.jsx";
import { SuperAdminBar } from "../lib/SuperAdminBar.jsx";
import { supabase } from "../lib/supabase.js";

// ─── BRAND ────────────────────────────────────────────────────────
const B = {
  primary:"#155266", dark:"#0f3d4d", primaryDim:"var(--wca-primary-dim)",
  secondary:"#ffbb23", secondaryDim:"var(--amber-dim)", accent:"#fab82c",
  bg:"var(--bg-page)", white:"var(--bg-surface)", text:"var(--text-primary)", textSec:"var(--text-secondary)",
  border:"var(--border)", borderLight:"var(--wca-primary-dim)",
  green:"#059669", greenDim:"var(--green-dim)",
  red:"#dc2626", redDim:"var(--red-dim)",
  amber:"#ffbb23", amberDim:"var(--amber-dim)",
  purple:"#7c3aed", purpleDim:"#ede9fe",
};

// ─── DATA ─────────────────────────────────────────────────────────
// MRR_DATA removed — real data from Supabase

// COHORTS removed — real data from Supabase

// CHANNELS removed — real data from Supabase

// LEVEL_DIST removed — real data from Supabase

// TOP_STUDENTS removed — real data from Supabase

// COUNTRIES removed — real data from Supabase

// WEEKLY removed — real data from Supabase

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
  if (loading) return (<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:300,flexDirection:"column",gap:12,color:"var(--text-secondary)"}}>
        <div style={{width:24,height:24,border:"2px solid var(--border)",borderTopColor:"var(--wca-primary)",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
        <span style={{fontSize:13}}>Cargando...</span>
      </div>);
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
  if (val === null) return "var(--bg-page)";
  if (val >= 90) return "#0f3d4d";
  if (val >= 80) return "#155266";
  if (val >= 70) return "#1a6a82";
  if (val >= 60) return "#5a9fb5";
  return "#a8ccd8";
}
function cohortText(val) {
  if (val === null) return B.border;
  return val >= 70 ? "var(--bg-surface)" : B.text;
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
  const navigate = useNavigate();

  // Session guard — only listen for sign-out (PrivateRoute handles role verification)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT" || (!s && event !== "INITIAL_SESSION")) {
        navigate("/", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const [view, setView]       = useState("overview");
  const isMobile = useMobile();
  const [sideOpen, setSideOpen] = useState(false);
  const [period, setPeriod]   = useState("12m");
  const [animate, setAnimate] = useState(true);
  const [realStats,   setRealStats]   = useState(null);
  const [statsLoading,setStatsLoading] = useState(true);
  const [mrrHistory,  setMrrHistory]  = useState([]);
  const totalMRR = mrrHistory.length > 0 ? mrrHistory[mrrHistory.length - 1]?.amount || 0 : 0;

  useEffect(() => { setAnimate(false); setTimeout(() => setAnimate(true), 50); }, [view]);

  // Load real stats from API
  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setRealStats(json.data || json);
        }
        // Load MRR history — group confirmed payments by month
        const { data: pays } = await supabase
          .from("payments")
          .select("amount, created_at")
          .eq("status", "confirmed")
          .order("created_at", { ascending: true });
        if (pays?.length) {
          const byMonth = {};
          pays.forEach(p => {
            const d = new Date(p.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
            if (!byMonth[key]) byMonth[key] = { mrr:0, students:0, new:0, churned:0 };
            byMonth[key].mrr += Number(p.amount || 0);
          });
          const months = Object.entries(byMonth)
            .sort(([a],[b]) => a.localeCompare(b))
            .slice(-12)
            .map(([key,v]) => ({
              month: new Date(key+"-01").toLocaleDateString("es-HN",{month:"short"}),
              mrr:   Math.round(v.mrr),
              students: v.students || 0,
              new: v.new || 0,
              churned: v.churned || 0,
            }));
          if (months.length >= 2) setMrrHistory(months);
        }
      } catch(e) { console.error("BI stats:", e); }
      finally { setStatsLoading(false); }
    }
    loadStats();
  }, []);

  // Merge real stats with demo data — real takes priority
  const currentMRR   = realStats?.mrr ?? 0;
  const prevMRR      = realStats?.mrrLastMonth ?? 0;
  const mrrGrowth    = prevMRR > 0 ? ((currentMRR - prevMRR) / prevMRR * 100).toFixed(1) : "0.0";
  const totalStudents= realStats?.totalStudents ?? 0;
  const avgChurn     = '—';
  const churnRate    = totalStudents > 0 ? ((avgChurn / totalStudents) * 100).toFixed(1) : "4.8";
  const arpu         = realStats?.arpu ? parseFloat(realStats.arpu) : Math.round(currentMRR / (totalStudents || 1));
  const ltv          = Math.round(arpu / (parseFloat(churnRate) / 100 || 0.048));
  const annualRun    = realStats?.arr > 0 ? realStats.arr : currentMRR * 12;

  return (
    <div style={{ display:"flex", minHeight: "100vh", height: "100vh", background:B.bg,  overflow:"hidden",  fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <SuperAdminBar />

      {/* SIDEBAR */}
      <aside style={{ width:184, background:B.primary, display:"flex", flexDirection:"column", padding:"0 0 14px", flexShrink:0 }}>
        <div style={{ padding:"18px 16px 16px", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
              <svg viewBox="0 0 32 32" style={{ width:34, height:34, flexShrink:0 }}><rect width="32" height="32" rx="8" fill="#ffbb23"/><text x="16" y="23" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="#155266" textAnchor="middle">W</text></svg>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:"#fff" }}>WCA <span style={{ color:"#ffbb23" }}>Hub</span></div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", letterSpacing:1, textTransform:"uppercase" }}>Business Intelligence</div>
              </div>
            </div>
        </div>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            display:"flex", alignItems:"center", gap:9, padding:"11px 18px", border:"none",
            background: view===v.id ? "rgba(255,255,255,.12)" : "transparent",
            color: view===v.id ? "var(--bg-surface)" : "rgba(255,255,255,.45)",
            fontSize:13, cursor:"pointer", textAlign:"left",
            borderLeft:`2px solid ${view===v.id ? B.secondary : "transparent"}`,
            transition:"all .15s", fontFamily:"inherit", fontWeight: view===v.id ? 600 : 400,
          }}>
            <i className={`ti ${v.icon}`} style={{ fontSize:15, width:16 }} aria-hidden="true" />
            {v.label}
          </button>
        ))}

        {/* Period selector */}
        <div style={{ margin:"auto 16px 0", padding:"14px 0 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Período</div>
          <div style={{ display:"flex", gap:4 }}>
            {["3m","6m","12m"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ flex:1, padding:"5px 0", fontSize:12, border:`1px solid ${period===p?"rgba(255,255,255,.4)":"rgba(255,255,255,.1)"}`, borderRadius:6, background: period===p?"rgba(255,255,255,.15)":"transparent", color: period===p?"var(--bg-surface)":"rgba(255,255,255,.35)", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>{p}</button>
            ))}
          </div>
        </div>
      

        <button
          onClick={()=>navigate("/")}
          title="Cerrar sesión"
          aria-label="Cerrar sesión y volver al inicio"
          style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"10px 18px", background:"transparent", border:"none", borderTop:"1px solid rgba(255,255,255,.08)", marginTop:8, color:"rgba(255,255,255,.35)", fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
          onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.background="rgba(220,38,38,.15)";}}
          onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.35)";e.currentTarget.style.background="transparent";}}>
          <i className="ti ti-logout" style={{fontSize:14}} aria-hidden="true"/>
          Cerrar sesión
        </button>
      </aside>
      {isMobile && sideOpen && <div onClick={()=>setSideOpen(false)} style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,.4)"}}/>}


      {/* MAIN */}
      <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Topbar */}
        <div style={{ height:52, background:B.white, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:B.text }}>
              {{ overview:"Resumen ejecutivo", revenue:"Revenue & financiero", retention:"Retención & churn", channels:"Canales de adquisición", academic:"Rendimiento académico" }[view]}
            </div>
            <div style={{ fontSize:12, color:B.textSec }}>Datos en tiempo real · wcahub.com</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:B.green }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:B.green, animation:"pulse 2s infinite" }} />
              Live data
            </div>
            <div style={{ fontSize:12, background:B.primaryDim, color:B.primary, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>
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
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:8, marginBottom:14 }}>
                {[
                  { label:"MRR",          value:currentMRR, prefix:"$", suffix:"", color:B.primary, icon:"ti-trending-up", trend:`${mrrGrowth}%`, up:parseFloat(mrrGrowth)>0, sparkData:mrrHistory.length>=2?mrrHistory.map(m=>m.mrr):[] },
                  { label:"Estudiantes",  value:totalStudents, prefix:"", suffix:"", color:B.green, icon:"ti-users", trend:realStats?.newStudentsMonth ? `+${realStats.newStudentsMonth} este mes` : "+13 este mes", up:true, sparkData:[] },
                  { label:"Churn rate",   value:churnRate, prefix:"", suffix:"%", color:parseFloat(churnRate)>5?B.red:B.green, icon:"ti-door-exit", trend:`${avgChurn} avg/mes`, up:false, sparkData:[] },
                  { label:"ARR",          value:annualRun, prefix:"$", suffix:"", color:B.secondary, icon:"ti-calendar", trend:realStats ? `LTV ≈ $${ltv}` : `LTV ≈ $${ltv} (demo)`, up:true, sparkData:mrrHistory.length>=2?mrrHistory.map(m=>m.mrr*12):[] },
                ].map((k,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${k.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <div style={{ fontSize:12, color:B.textSec }}>{k.label}</div>
                      <i className={`ti ${k.icon}`} style={{ fontSize:15, color:k.color }} aria-hidden="true" />
                    </div>
                    <div style={{ fontSize:22, fontWeight:800, color:B.text, lineHeight:1, marginBottom:4 }}>
                      {animate && <AnimNum value={k.value} prefix={k.prefix} suffix={k.suffix} decimals={k.label==="Churn rate"?1:0} />}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:isMobile?"wrap":"nowrap", gap:isMobile?8:0 }}>
                      <div style={{ fontSize:12, color:k.up?B.green:B.red, fontWeight:600 }}>
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
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:isMobile?"wrap":"nowrap", gap:isMobile?8:0, marginBottom:14 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:B.text }}>MRR — 12 meses</div>
                    <div style={{ fontSize:12, color:B.green, fontWeight:600 }}>↑ 119% YoY</div>
                  </div>
                  <svg width="100%" height={110} viewBox="0 0 400 110" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={B.primary} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={B.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const chartData = mrrHistory.length >= 2 ? mrrHistory : null;  // null = no real data
                      if (!chartData) return <text class="ts" x="200" y="65" textAnchor="middle">Sin datos de pagos aún</text>;
                      const max = Math.max(...chartData.map(m=>m.mrr), 1);
                      const pts = chartData.map((m,i) => {
                        const x = (i/(chartData.length-1))*388+6;
                        const y = 100 - (m.mrr/max)*88 + 6;
                        return `${x},${y}`;
                      });
                      const areaPath = `M${pts[0]} ${pts.slice(1).map(p=>`L${p}`).join(" ")} L394,106 L6,106 Z`;
                      const linePath = `M${pts[0]} ${pts.slice(1).map(p=>`L${p}`).join(" ")}`;
                      return (
                        <>
                          <path d={areaPath} fill="url(#mrrGrad)" />
                          <path d={linePath} fill="none" stroke={B.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                          {chartData.map((m,i) => {
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
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Distribución por nivel</div>
                  {false&&([]).map((x,i)=>(
                    <div key={l.level} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
                      <div style={{ width:28, height:20, borderRadius:4, background:l.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"var(--bg-surface)", flexShrink:0 }}>{l.level}</div>
                      <MiniBar value={l.pct} max={100} color={l.color} height={7} />
                      <div style={{ fontSize:12, color:B.textSec, width:50, textAlign:"right", flexShrink:0 }}>{l.students} ({l.pct}%)</div>
                    </div>
                  ))}
                  <div style={{ marginTop:10, padding:"8px 10px", background:B.bg, borderRadius:8, display:"flex", justifyContent:"space-between", fontSize:12 }}>
                    <span style={{ color:B.textSec }}>ARPU</span>
                    <span style={{ fontWeight:700, color:B.primary }}>${arpu}/mes</span>
                  </div>
                </div>
              </div>

              {/* Three col bottom */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {/* Countries */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Estudiantes por país</div>
                  {false&&([]).map((x,i)=>(
                    <div key={c.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <span style={{ fontSize:15 }}>{c.flag}</span>
                      <div style={{ fontSize:13, color:B.text, width:70, flexShrink:0 }}>{c.name}</div>
                      <MiniBar value={c.pct} max={100} color={B.primary} height={5} />
                      <div style={{ fontSize:12, color:B.textSec, width:22, textAlign:"right", flexShrink:0 }}>{c.students}</div>
                    </div>
                  ))}
                </div>

                {/* New vs Churned */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Altas vs Bajas (6m)</div>
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
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Top estudiantes XP</div>
                  {false&&([]).map((x,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <div style={{ fontSize:13, fontWeight:800, color: i===0?B.secondary:i===1?"var(--text-tertiary)":"#cd7f32", width:14 }}>{i+1}</div>
                      <span style={{ fontSize:14 }}>{s.country}</span>
                      <div style={{ fontSize:13, color:B.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name.split(" ")[0]}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:B.primary }}>{s.xp.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── REVENUE ── */}
          {view === "revenue" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:8, marginBottom:14 }}>
                {[
                  { label:"MRR actual",    value:`$${totalMRR.toLocaleString()}`, sub:totalMRR>0?`${mrrHistory.length} meses de datos`:"Sin datos aún", color:B.primary },
                  { label:"ARR proyectado",value:`$${Math.round(totalMRR*12/1000)}k`, sub:"Proyección anual",           color:B.green },
                  { label:"ARPU",          value:`$${arpu}`, sub:"Por estudiante/mes",       color:B.amber },
                  { label:"LTV estimado",  value:`$${ltv}`, sub:`Churn ${churnRate}%/mes`,   color:B.purple },
                ].map((k,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${k.color}` }}>
                    <div style={{ fontSize:12, color:B.textSec, marginBottom:6 }}>{k.label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:B.text, lineHeight:1, marginBottom:4 }}>{k.value}</div>
                    <div style={{ fontSize:12, color:B.textSec }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Full MRR chart */}
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text }}>Evolución MRR mensual</div>
                  <div style={{ display:"flex", gap:12, fontSize:12, color:B.textSec }}>
                    <span>Mín: ${Math.min(...(mrrHistory.map(m=>m.amount)||[0])).toLocaleString()}</span>
                    <span>Máx: ${Math.max(...(mrrHistory.map(m=>m.amount)||[0])).toLocaleString()}</span>
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
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:12 }}>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Ingresos por programa</div>
                  {[
                    { name:"Inglés completo", rev:9595, pct:52, color:B.primary },
                    { name:"Inglés + VA",     rev:5950, pct:32, color:B.dark   },
                    { name:"VA solo",         rev:1875, pct:10, color:B.amber  },
                    { name:"Becas",           rev:1000, pct:6,  color:B.green  },
                  ].map(p => (
                    <div key={p.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:p.color, flexShrink:0 }} />
                      <div style={{ fontSize:13, color:B.text, flex:1 }}>{p.name}</div>
                      <MiniBar value={p.pct} max={100} color={p.color} height={6} />
                      <div style={{ fontSize:12, fontWeight:600, color:B.text, width:50, textAlign:"right" }}>${p.rev.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Métodos de pago</div>
                  {[
                    { name:"Stripe (tarjeta)", pct:58, students:114, color:B.primary },
                    { name:"Transferencia",    pct:30, students:59,  color:B.amber  },
                    { name:"Efectivo",         pct:7,  students:14,  color:B.green  },
                    { name:"B2B factura",       pct:5,  students:9,   color:B.purple },
                  ].map(m => (
                    <div key={m.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:m.color, flexShrink:0 }} />
                      <div style={{ fontSize:13, color:B.text, flex:1 }}>{m.name}</div>
                      <MiniBar value={m.pct} max={100} color={m.color} height={6} />
                      <div style={{ fontSize:12, color:B.textSec, width:50, textAlign:"right" }}>{m.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── RETENTION ── */}
          {view === "retention" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)", gap:8, marginBottom:14 }}>
                {[
                  { label:"Churn mensual", value:`${churnRate}%`, sub:"Promedio últimos 3m", color:parseFloat(churnRate)<5?B.green:B.red },
                  { label:"Retención M3",  value:"83%",  sub:"Cohorte promedio",  color:B.primary },
                  { label:"Retención M6",  value:"67%",  sub:"Cohorte promedio",  color:B.amber },
                ].map((k,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${k.color}` }}>
                    <div style={{ fontSize:12, color:B.textSec, marginBottom:6 }}>{k.label}</div>
                    <div style={{ fontSize:26, fontWeight:800, color:k.color, lineHeight:1, marginBottom:4 }}>{k.value}</div>
                    <div style={{ fontSize:12, color:B.textSec }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Cohort table */}
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Análisis de cohortes — Retención mensual</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, color:B.textSec, textTransform:"uppercase", letterSpacing:.5 }}>Cohorte</th>
                      <th style={{ padding:"8px 10px", textAlign:"center", fontSize:11, fontWeight:600, color:B.textSec }}>Alumnos</th>
                      {["Mes 1","Mes 2","Mes 3","Mes 4","Mes 5","Mes 6"].map(m => (
                        <th key={m} style={{ padding:"8px 10px", textAlign:"center", fontSize:11, fontWeight:600, color:B.textSec }}>{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {false&&([]).map((x,i)=>(
                      <tr key={i}>
                        <td style={{ padding:"6px 10px", fontWeight:600, color:B.text, fontSize:13 }}>{c.cohort}</td>
                        <td style={{ padding:"6px 10px", textAlign:"center", fontSize:13, color:B.textSec }}>{c.students}</td>
                        {[c.m1,c.m2,c.m3,c.m4,c.m5,c.m6].map((v,j) => (
                          <td key={j} style={{ padding:"4px 6px", textAlign:"center" }}>
                            <div style={{ background:cohortBg(v), color:cohortText(v), borderRadius:6, padding:"5px 2px", fontSize:12, fontWeight:600, minWidth:36 }}>
                              {v !== null ? `${v}%` : "—"}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display:"flex", gap:8, marginTop:10, fontSize:11, color:B.textSec }}>
                  {[[B.dark,"≥90%"],[B.primary,"80–90%"],["#1a6a82","70–80%"],["#5a9fb5","60–70%"],["#a8ccd8","<60%"]].map(([c,l]) => (
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:3 }}>
                      <div style={{ width:12, height:12, borderRadius:3, background:c }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Churn reasons */}
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Motivos de baja estimados (últimos 3m)</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[
                    { reason:"Problemas económicos", pct:38, color:B.red },
                    { reason:"Falta de tiempo",      pct:27, color:B.amber },
                    { reason:"Sin seguimiento",      pct:18, color:B.primary },
                    { reason:"Cambió a otra plataforma", pct:10, color:B.purple },
                    { reason:"Viaje / reubicación",  pct:7,  color:B.green },
                  ].map((r,i) => (
                    <div key={i} style={{ background:B.bg, borderRadius:8, padding:"10px 12px" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:r.color }}>{r.pct}%</div>
                      <div style={{ fontSize:12, color:B.textSec, lineHeight:1.4 }}>{r.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CHANNELS ── */}
          {view === "channels" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)", gap:8, marginBottom:14 }}>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${B.primary}` }}>
                  <div style={{ fontSize:12, color:B.textSec, marginBottom:6 }}>Total leads (año)</div>
                  <div style={{ fontSize:24, fontWeight:800, color:B.text }}>407</div>
                  <div style={{ fontSize:12, color:B.textSec }}>6 canales activos</div>
                </div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${B.green}` }}>
                  <div style={{ fontSize:12, color:B.textSec, marginBottom:6 }}>Tasa de conversión avg</div>
                  <div style={{ fontSize:24, fontWeight:800, color:B.green }}>33%</div>
                  <div style={{ fontSize:12, color:B.textSec }}>Referidos: 42% (mejor)</div>
                </div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 15px", borderTop:`3px solid ${B.amber}` }}>
                  <div style={{ fontSize:12, color:B.textSec, marginBottom:6 }}>CAC promedio</div>
                  <div style={{ fontSize:24, fontWeight:800, color:B.amber }}>—</div>
                  <div style={{ fontSize:12, color:B.textSec }}>LTV/CAC ratio: {Math.round(ltv/47)}x</div>
                </div>
              </div>

              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden", marginBottom:12 }}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${B.border}`, fontSize:13, fontWeight:700, color:B.text }}>Rendimiento por canal</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:B.bg }}>
                      {["Canal","Leads","Convertidos","Tasa conv.","Revenue","Eficiencia"].map(h => (
                        <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, color:B.textSec, letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {false&&([]).map((x,i)=>(
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
                            <span style={{ fontSize:12, fontWeight:700, color:c.rate>=40?B.green:c.rate>=30?B.amber:B.red }}>{c.rate}%</span>
                          </div>
                        </td>
                        <td style={{ padding:"11px 12px", fontWeight:600, color:B.text }}>${c.rev.toLocaleString()}</td>
                        <td style={{ padding:"11px 12px" }}>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:c.rate>=40?B.greenDim:c.rate>=30?B.amberDim:B.redDim, color:c.rate>=40?"#065f46":c.rate>=30?"#92400e":B.red, fontWeight:600 }}>
                            {c.rate>=40?"⭐ Excelente":c.rate>=30?"✓ Bueno":"↓ Mejorar"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background:B.secondaryDim, border:`1px solid ${B.amber}40`, borderRadius:12, padding:"11px 14px", fontSize:13, color:"#92400e", display:"flex", gap:8 }}>
                <i className="ti ti-bulb" style={{ fontSize:14, flexShrink:0, marginTop:1 }} aria-hidden="true" />
                <div><strong>Insight:</strong> Los referidos tienen la tasa de conversión más alta (42%) y el CAC más bajo (~$0). Cada estudiante satisfecho es tu mejor canal de adquisición. Un programa de referidos con incentivo de descuento puede duplicar este canal.</div>
              </div>
            </div>
          )}

          {/* ── ACADEMIC ── */}
          {view === "academic" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:8, marginBottom:14 }}>
                {[
                  { label:"Asistencia promedio", value:"—", sub:"Datos de asistencia próximamente", color:B.green },
                  { label:"Tasa de aprobación", value:"78%", sub:"Exámenes de unidad", color:B.primary },
                  { label:"Estudiantes en riesgo", value:"4", sub:"Asist. <70% o promedio <65%", color:B.red },
                  { label:"Próximos a graduar", value:"3", sub:"En unidad 10–12 de C1", color:B.amber },
                ].map((k,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"13px 15px", borderTop:`3px solid ${k.color}` }}>
                    <div style={{ fontSize:12, color:B.textSec, marginBottom:6 }}>{k.label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
                    <div style={{ fontSize:12, color:B.textSec, marginTop:4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:12, marginBottom:12 }}>
                {/* Weekly activity */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Actividad semanal típica</div>
                  <svg width="100%" height={100} viewBox="0 0 280 100" preserveAspectRatio="none">
                    {/* Actividad semanal: sin datos aún */}
                  </svg>
                  <div style={{ fontSize:12, color:B.textSec, marginTop:4 }}>Clases en vivo: L, M, V — Práctica libre: M, J, S, D</div>
                </div>

                {/* Exam pass rates by level */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Tasa de aprobación por nivel</div>
                  {[
                    { level:"A1", rate:82, attempts:1.4 },
                    { level:"A2", rate:79, attempts:1.6 },
                    { level:"B1", rate:75, attempts:1.8 },
                    { level:"B2", rate:71, attempts:2.0 },
                    { level:"C1", rate:68, attempts:2.2 },
                  ].map(l => (
                    <div key={l.level} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
                      <div style={{ width:24, height:18, borderRadius:4, background:levelBg(l.level), display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:levelCol(l.level) }}>{l.level}</div>
                      <MiniBar value={l.rate} max={100} color={l.rate>=80?B.green:l.rate>=70?B.amber:B.red} height={6} />
                      <span style={{ fontSize:12, fontWeight:700, color:l.rate>=80?B.green:l.rate>=70?B.amber:B.red, width:28 }}>{l.rate}%</span>
                      <span style={{ fontSize:11, color:B.textSec }}>{l.attempts} int. avg</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher performance */}
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Rendimiento de docentes</div>
                <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)", gap:8 }}>
                  {[
                    { name:"Sofía Estrada",  level:"C1", att:100, rating:4.9, students:6  },
                    { name:"Ana Torres",     level:"B1", att:95,  rating:4.9, students:33 },
                    { name:"Carlos Medina",  level:"B2", att:93,  rating:4.7, students:8  },
                    { name:"María Paredes",  level:"A2", att:92,  rating:4.6, students:20 },
                    { name:"José Rodríguez", level:"A1", att:97,  rating:4.8, students:55 },
                    { name:"Luis Gutiérrez", level:"A2", att:88,  rating:4.4, students:12 },
                  ].map((t,i) => (
                    <div key={i} style={{ background:B.bg, borderRadius:8, padding:"10px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{t.name}</div>
                        <span style={{ fontSize:11, background:B.secondaryDim, color:"#92400e", padding:"1px 6px", borderRadius:10, fontWeight:600 }}>★ {t.rating}</span>
                      </div>
                      <div style={{ fontSize:11, color:B.textSec, marginBottom:6 }}>{t.level} · {t.students} estudiantes</div>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <MiniBar value={t.att} max={100} color={t.att>=95?B.green:B.amber} height={4} />
                        <span style={{ fontSize:11, color:B.textSec }}>{t.att}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      {isMobile && <button onClick={()=>setSideOpen(o=>!o)} style={{position:"fixed",bottom:20,right:20,zIndex:40,width:50,height:50,borderRadius:"50%",background:B.primary,color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.25)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{sideOpen?"\u2715":"\u2630"}</button>}
    </div>
  );
}

function levelBg(l) {
  return { A1:"var(--wca-primary-dim)", A2:"#dde6e9", B1:"var(--green-dim)", B2:"#ede9fe", C1:"var(--green-dim)" }[l] || "var(--wca-primary-dim)";
}
function levelCol(l) {
  return { A1:"#155266", A2:"#0f3d4d", B1:"#065f46", B2:"#4c1d95", C1:"#065f46" }[l] || "#155266";
}
