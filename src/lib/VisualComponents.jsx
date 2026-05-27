// ─── WCA Hub — Visual Components ─────────────────────────────────
// Animated counters, radar charts, XP rings, streak flames, confetti
import { useState, useEffect, useRef, useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis,
} from "recharts";

const P = "#155266", Y = "#ffbb23", G = "#059669";

// ── CSS injection (once) ──────────────────────────────────────────
const CSS = `
@keyframes wca-fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
@keyframes wca-fadeIn    { from{opacity:0} to{opacity:1} }
@keyframes wca-scaleIn   { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
@keyframes wca-slideRight{ from{width:0} to{width:var(--w)} }
@keyframes wca-pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.06)} }
@keyframes wca-glow      { 0%,100%{box-shadow:0 0 8px #f59e0b40} 50%{box-shadow:0 0 22px #f59e0b90,0 0 40px #f59e0b30} }
@keyframes wca-float     { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-48px) scale(.7)} }
@keyframes wca-confetti  { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(120px) rotate(720deg);opacity:0} }
@keyframes wca-shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes wca-spin      { to{transform:rotate(360deg)} }
@keyframes wca-bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes wca-ring-fill { from{stroke-dashoffset:var(--full)} to{stroke-dashoffset:var(--offset)} }

.wca-card-lift {
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease;
}
.wca-card-lift:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 12px 32px rgba(21,82,102,.15) !important;
}
.wca-btn-press:active { transform: scale(.96); }
.wca-stagger > * { animation: wca-fadeUp .4s ease both; }
.wca-stagger > *:nth-child(1){animation-delay:.05s}
.wca-stagger > *:nth-child(2){animation-delay:.12s}
.wca-stagger > *:nth-child(3){animation-delay:.19s}
.wca-stagger > *:nth-child(4){animation-delay:.26s}
.wca-stagger > *:nth-child(5){animation-delay:.33s}
.wca-stagger > *:nth-child(6){animation-delay:.40s}
`;
if (typeof document !== "undefined" && !document.getElementById("wca-visual-css")) {
  const s = document.createElement("style");
  s.id = "wca-visual-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ── AnimatedCounter — counts up from 0 ───────────────────────────
export function AnimatedCounter({ value, duration = 1000, prefix = "", suffix = "", decimals = 0, style = {} }) {
  const [displayed, setDisplayed] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (value === 0) { setDisplayed(0); return; }
    startRef.current = performance.now();
    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(eased * value);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  const formatted = decimals > 0
    ? displayed.toFixed(decimals)
    : Math.round(displayed).toLocaleString();

  return <span style={style}>{prefix}{formatted}{suffix}</span>;
}

// ── XPRing — animated SVG ring for progress ──────────────────────
export function XPRing({ pct, size = 80, stroke = 7, color = P, bg = "#e2e8f0", label, sublabel, delay = 0 }) {
  const [drawn, setDrawn] = useState(false);
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), delay + 100);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={drawn ? offset : circ}
          style={{ transition: `stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1) ${delay}ms` }}
        />
      </svg>
      {(label || sublabel) && (
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", textAlign:"center" }}>
          {label && <div style={{ fontSize: size > 60 ? 14 : 11, fontWeight: 800, color, lineHeight:1 }}>{label}</div>}
          {sublabel && <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2, lineHeight:1 }}>{sublabel}</div>}
        </div>
      )}
    </div>
  );
}

// ── StreakFlame — pulsing flame with intensity ────────────────────
export function StreakFlame({ streak, size = "large" }) {
  const isHot = streak >= 7;
  const isOnFire = streak >= 30;
  const s = size === "large" ? { wrap: 80, flame: 36, num: 22, sub: 11 }
           : size === "medium" ? { wrap: 56, flame: 24, num: 16, sub: 10 }
           : { wrap: 40, flame: 18, num: 12, sub: 9 };

  const color = isOnFire ? "#ef4444" : isHot ? "#f97316" : streak >= 3 ? "#f59e0b" : "#94a3b8";
  const bg    = isOnFire ? "#fef2f2" : isHot ? "#fff7ed" : streak >= 3 ? "#fffbeb" : "#f8fafc";

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{
        width: s.wrap, height: s.wrap, borderRadius: "50%",
        background: bg, display:"flex", alignItems:"center", justifyContent:"center",
        flexDirection:"column", position:"relative",
        ...(isHot ? { animation: "wca-glow 2s ease-in-out infinite" } : {}),
      }}>
        <div style={{ fontSize: s.flame, lineHeight:1, animation: isHot ? "wca-bounce 1.5s ease infinite" : "none" }}>
          🔥
        </div>
        <div style={{ fontSize: s.num, fontWeight: 900, color, lineHeight:1 }}>
          {streak}
        </div>
      </div>
      <div style={{ fontSize: s.sub, color: "#94a3b8", fontWeight: 600 }}>
        {streak === 0 ? "sin racha" : streak === 1 ? "1 día" : `${streak} días`}
      </div>
    </div>
  );
}

// ── SkillRadar — recharts radar chart for skill breakdown ─────────
const RADAR_COLORS = {
  en: "#155266",
  va: "#7c3aed",
  va_mkt: "#db2777",
  va_legal: "#0e7490",
  va_care: "#059669",
};

export function SkillRadar({ programId, progressData = {}, skills = [], style = {} }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 300); }, []);

  const color = RADAR_COLORS[programId] || P;

  // Derive skill scores from unit progress
  const data = useMemo(() => {
    const units = Object.values(progressData);
    const avgScore = units.length > 0
      ? units.reduce((s, u) => s + (u.score || 0), 0) / units.length
      : 0;

    // Map skills to scores with some variation based on available data
    return skills.slice(0, 8).map((name, i) => {
      const passedUnits = units.filter(u => u.passed).length;
      const base = passedUnits > 0
        ? Math.min(95, Math.round(avgScore * (0.75 + (i % 3) * 0.12)))
        : 0;
      return { name: name.length > 10 ? name.slice(0, 9) + "…" : name, value: base };
    });
  }, [progressData, skills]);

  if (data.length < 3) return null;

  return (
    <div style={{ width:"100%", height:220, opacity: ready ? 1 : 0,
      transition:"opacity .6s ease", ...style }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top:10, right:20, bottom:10, left:20 }}>
          <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="name"
            tick={{ fontSize:10, fill:"var(--text-secondary)", fontWeight:500 }} />
          <Radar name="Habilidades" dataKey="value"
            stroke={color} fill={color} fillOpacity={0.18}
            strokeWidth={2} dot={{ fill: color, r: 3 }} />
          <Tooltip
            contentStyle={{ background:"var(--bg-surface)", border:"1px solid var(--border)",
              borderRadius:8, fontSize:12, fontFamily:"inherit" }}
            formatter={(v) => [`${v}%`, "Score"]} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── MiniAreaChart — sparkline for progress over time ─────────────
export function MiniAreaChart({ data, color = P, height = 60 }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 200); }, []);

  if (!data?.length) return null;
  return (
    <div style={{ width:"100%", height, opacity: ready ? 1 : 0, transition:"opacity .8s" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top:4, right:0, left:0, bottom:0 }}>
          <defs>
            <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"   stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%"  stopColor={color} stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" hide />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{ background:"var(--bg-surface)", border:"1px solid var(--border)",
              borderRadius:8, fontSize:11, fontFamily:"inherit" }}
            formatter={(v) => [`${v}%`]} />
          <Area type="monotone" dataKey="score"
            stroke={color} strokeWidth={2}
            fill={`url(#grad-${color.replace("#","")})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Confetti — celebrate on unit/level completion ─────────────────
const CONFETTI_COLORS = ["#ffbb23","#155266","#059669","#7c3aed","#ef4444","#f97316"];

export function Confetti({ active, count = 30 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) return;
    const ps = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1 + Math.random() * 0.8,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));
    setParticles(ps);
    const t = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(t);
  }, [active]);

  if (!particles.length) return null;
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute", top:"-20px", left:`${p.left}%`,
          width: p.size, height: p.size * 0.6,
          background: p.color, borderRadius: 2,
          transform: `rotate(${p.rotation}deg)`,
          animation: `wca-confetti ${p.duration}s ${p.delay}s ease-in both`,
        }}/>
      ))}
    </div>
  );
}

// ── FloatingXP — "+25 XP" that floats up and fades ───────────────
export function FloatingXP({ amount, x = "50%", y = "50%", onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position:"fixed", left: x, top: y, transform:"translate(-50%,-50%)",
      zIndex:9998, pointerEvents:"none",
      fontSize:18, fontWeight:900, color:Y,
      textShadow:"0 2px 8px rgba(0,0,0,.25)",
      animation:"wca-float 1.1s ease-out both",
    }}>
      +{amount} XP ⚡
    </div>
  );
}

// ── StatCard — animated stat with icon and counter ────────────────
export function StatCard({ icon, label, value, suffix = "", color = P, bg, delay = 0, style = {} }) {
  return (
    <div className="wca-card-lift" style={{
      background: bg || "var(--bg-surface)",
      border: `1px solid var(--border)`,
      borderRadius: 14, padding: "14px 16px",
      animation: `wca-scaleIn .4s ${delay}ms ease both`,
      ...style,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${color}18`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
          {icon}
        </div>
        <div style={{ fontSize:11, color:"var(--text-secondary)", fontWeight:600, lineHeight:1.3 }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize:26, fontWeight:900, color, lineHeight:1 }}>
        <AnimatedCounter value={value} duration={900} suffix={suffix} />
      </div>
    </div>
  );
}

// ── ProgressBar — animated width bar ─────────────────────────────
export function ProgressBar({ pct, color = P, bg = "var(--border)", height = 6, radius = 3, delay = 0, style = {} }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay + 100);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div style={{ height, borderRadius: radius, background: bg, overflow:"hidden", ...style }}>
      <div style={{
        height:"100%", borderRadius: radius, background: color,
        width: `${w}%`, transition: "width 1s cubic-bezier(.4,0,.2,1)",
      }}/>
    </div>
  );
}

// ── UnitProgress — 12-bar visual with animations ─────────────────
export function UnitProgress({ currentUnit, progressData = {}, color = P, accent = Y }) {
  return (
    <div style={{ display:"flex", gap:3 }}>
      {Array.from({ length: 12 }, (_, i) => {
        const unit = i + 1;
        const done = progressData[unit]?.passed;
        const active = unit === currentUnit;
        return (
          <div key={i} title={`Unidad ${unit}${done ? ` — ${progressData[unit]?.score}%` : ""}`}
            style={{
              flex:1, height:8, borderRadius:4,
              background: done ? color : active ? accent : "var(--bg-surface-subtle)",
              transition: `background .3s ${i * 40}ms, transform .2s`,
              cursor:"default",
              ...(active ? { animation:"wca-pulse 2s ease infinite" } : {}),
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scaleY(1.4)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
          />
        );
      })}
    </div>
  );
}
