import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';
import { ThemeProvider, ThemeToggle, useTheme } from './ThemeContext.jsx';

const Landing         = lazy(() => import('./pages/Landing.jsx'));
const PortalEstudiante= lazy(() => import('./pages/PortalEstudiante.jsx'));
const Onboarding      = lazy(() => import('./pages/Onboarding.jsx'));
const PortalDocente   = lazy(() => import('./pages/PortalDocente.jsx'));
const DashboardAdmin  = lazy(() => import('./pages/DashboardAdmin.jsx'));
const SuperAdmin      = lazy(() => import('./pages/SuperAdmin.jsx'));
const CRM             = lazy(() => import('./pages/CRM.jsx'));
const GestorCobros    = lazy(() => import('./pages/GestorCobros.jsx'));
const CoordAcademica  = lazy(() => import('./pages/CoordAcademica.jsx'));
const BIDashboard     = lazy(() => import('./pages/BIDashboard.jsx'));
const AuthCallback    = lazy(() => import('./pages/AuthCallback.jsx'));
const PlatformPreview = lazy(() => import('./pages/PlatformPreview.jsx'));

const PORTALS = [
  { path:'/portal',       icon:'👨‍🎓', label:'Portal Estudiante',      role:'Estudiante',   color:'#155266' },
  { path:'/docente',      icon:'👩‍🏫', label:'Portal Docente',          role:'Docente',      color:'#92400e' },
  { path:'/admin',        icon:'⚙️',  label:'Dashboard Admin',         role:'Admin',        color:'#0f3d4d' },
  { path:'/super',        icon:'⭐',  label:'Super Admin',             role:'Super Admin',  color:'#2d1b69' },
  { path:'/crm',          icon:'💼',  label:'CRM Ventas',              role:'Ventas',       color:'#059669' },
  { path:'/cobros',       icon:'💳',  label:'Gestor de Cobros',        role:'Cobros',       color:'#92400e' },
  { path:'/coordinacion', icon:'🎓',  label:'Coordinación Académica',  role:'Coordinadora', color:'#155266' },
  { path:'/bi',           icon:'📊',  label:'Dashboard BI',            role:'Directivos',   color:'#3c3489' },
  { path:'/onboarding',   icon:'🎯',  label:'Onboarding Wizard',       role:'Primer acceso',color:'#7c3aed' },
  { path:'/preview',      icon:'🗺️',  label:'Platform Preview',        role:'Todos',        color:'#475569' },
];

// ── Inject global WCA styles ──────────────────────────────────────
const WCA_GLOBAL_CSS = `
/* ── WCA Global Micro-interactions ──────────────────────────────── */
@keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
@keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
@keyframes popIn   { 0%{opacity:0;transform:scale(.94)} 60%{transform:scale(1.01)} 100%{opacity:1;transform:none} }
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes menuUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }

/* Focus ring — replaces browser default */
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #155266;
  border-radius: 6px;
}

/* Smooth interactive elements */
button, a, [role="button"] { cursor: pointer; }

/* Skeleton shimmer */
.skeleton {
  background: linear-gradient(90deg, var(--bg-surface-subtle) 25%, var(--border) 50%, var(--bg-surface-subtle) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: 6px;
}

/* Modal enter animation */
.modal-enter { animation: popIn .22s cubic-bezier(.34,1.56,.64,1) both; }

/* Toast enter */
.toast-enter { animation: slideIn .3s ease both; }

/* Card hover lift */
.card-hover {
  transition: transform .15s ease, box-shadow .15s ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
}
`;
if (typeof document !== 'undefined') {
  const existing = document.getElementById('wca-global');
  if (!existing) {
    const s = document.createElement('style');
    s.id = 'wca-global';
    s.textContent = WCA_GLOBAL_CSS;
    document.head.appendChild(s);
  }
}

function PageLoader() {
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--bg-page)', gap:16 }}>
      <div style={{ width:44, height:44, border:'3px solid var(--border)', borderTopColor:'#155266', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <div style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>Cargando WCA Hub…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Demo floating menu ──────────────────────────────────────────
function DemoMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { dark, toggle } = useTheme();

  return (
    <div style={{ position:'fixed', bottom:20, right:20, zIndex:9999, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      {open && (
        <div style={{
          position:'absolute', bottom:60, right:0,
          background: dark ? '#1e293b' : '#ffffff',
          border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
          borderRadius:18, padding:12, width:252,
          boxShadow:'0 20px 60px rgba(0,0,0,.18), 0 4px 16px rgba(0,0,0,.08)',
          animation:'menuUp .2s ease',
        }}>
          <style>{`@keyframes menuUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 8px 10px', borderBottom:`1px solid ${dark?'#334155':'#f1f5f9'}`, marginBottom:8 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color: dark?'#f1f5f9':'#0f172a' }}>WCA <span style={{ color:'#ffbb23' }}>Hub</span></div>
              <div style={{ fontSize:10, color: dark?'#475569':'#94a3b8' }}>Demo · 10 portales</div>
            </div>
            {/* Theme toggle inside menu */}
            <button onClick={toggle} style={{
              display:'flex', alignItems:'center', gap:5, padding:'5px 10px',
              border:`1px solid ${dark?'#334155':'#e2e8f0'}`,
              borderRadius:20, background:'transparent', cursor:'pointer',
              fontSize:11, color: dark?'#94a3b8':'#475569', fontFamily:'inherit',
              transition:'all .15s',
            }}
            title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
              <span style={{ fontSize:13 }}>{dark ? '☀️' : '🌙'}</span>
              <span>{dark ? 'Claro' : 'Oscuro'}</span>
            </button>
          </div>

          {/* Landing */}
          <Link to="/" onClick={() => setOpen(false)} style={{ textDecoration:'none' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
              borderRadius:10, marginBottom:2, cursor:'pointer',
              background: location.pathname==='/' ? 'rgba(21,82,102,.1)' : 'transparent',
              transition:'background .12s',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(21,82,102,.07)'}
            onMouseLeave={e=>e.currentTarget.style.background=location.pathname==='/'?'rgba(21,82,102,.1)':'transparent'}>
              <span style={{ fontSize:16 }}>🌐</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color: dark?'#f1f5f9':'#0f172a' }}>Landing Page</div>
                <div style={{ fontSize:10, color: dark?'#475569':'#94a3b8' }}>Público</div>
              </div>
              {location.pathname==='/' && <div style={{ width:6, height:6, borderRadius:'50%', background:'#059669', flexShrink:0 }} />}
            </div>
          </Link>

          <div style={{ height:'1px', background: dark?'#1e293b':'#f1f5f9', margin:'4px 0 6px' }} />

          {/* Portals */}
          <div style={{ maxHeight:360, overflowY:'auto' }}>
            {PORTALS.map((p,i) => (
              <Link key={i} to={p.path} onClick={() => setOpen(false)} style={{ textDecoration:'none' }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                  borderRadius:10, marginBottom:2, cursor:'pointer',
                  background: location.pathname===p.path ? `${p.color}15` : 'transparent',
                  transition:'background .12s',
                }}
                onMouseEnter={e=>e.currentTarget.style.background=`${p.color}10`}
                onMouseLeave={e=>e.currentTarget.style.background=location.pathname===p.path?`${p.color}15`:'transparent'}>
                  <span style={{ fontSize:16 }}>{p.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color: dark?'#f1f5f9':'#0f172a' }}>{p.label}</div>
                    <div style={{ fontSize:10, color: dark?'#475569':'#94a3b8' }}>{p.role}</div>
                  </div>
                  {location.pathname===p.path && <div style={{ width:6, height:6, borderRadius:'50%', background:p.color, flexShrink:0 }} />}
                </div>
              </Link>
            ))}
          </div>

          <div style={{ borderTop:`1px solid ${dark?'#334155':'#f1f5f9'}`, marginTop:8, paddingTop:8, textAlign:'center' }}>
            <span style={{ fontSize:10, color: dark?'#334155':'#cbd5e1' }}>Demo visual · Sin backend real</span>
          </div>
        </div>
      )}

      {/* Main button */}
      <button onClick={() => setOpen(!open)} style={{
        background: open ? (dark?'#1e293b':'#0f172a') : '#155266',
        color:'#fff',
        border: open ? `1px solid ${dark?'#334155':'#334155'}` : '1px solid #155266',
        borderRadius:30, padding:'11px 20px', fontSize:12, fontWeight:700,
        cursor:'pointer', fontFamily:'inherit',
        display:'flex', alignItems:'center', gap:8,
        boxShadow: open ? 'none' : '0 4px 20px rgba(21,82,102,.35)',
        transition:'all .2s',
      }}>
        <span style={{ fontSize:16 }}>{open ? '✕' : '⬡'}</span>
        {open ? 'Cerrar' : 'Demo · 10 portales'}
        {!open && <span style={{ background:'#ffbb23', color:'#0f3d4d', fontSize:10, padding:'2px 7px', borderRadius:20, fontWeight:800 }}>▾</span>}
      </button>
    </div>
  );
}

// ─── Hub principal ────────────────────────────────────────────────
function NavHub() {
  const { dark, toggle } = useTheme();

  return (
    <div style={{ minHeight:'100vh', background: dark?'#0f172a':'#f8fafc', fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:28 }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>

        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:11, color:'#ffbb23', fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>WORLD CONNECT ACADEMY</div>
          <div style={{ fontSize:38, fontWeight:800, color: dark?'#f1f5f9':'#0f172a', letterSpacing:-1, marginBottom:10 }}>
            WCA <span style={{ color:'#ffbb23' }}>Hub</span>
          </div>
          <div style={{ fontSize:14, color: dark?'#475569':'#64748b', marginBottom:28 }}>
            Plataforma de gestión académica · Demo interactivo
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/" style={{ textDecoration:'none' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 24px', background:'#155266', borderRadius:30, color:'#fff', fontSize:13, fontWeight:700 }}>
                🌐 Ver Landing Page →
              </div>
            </Link>
            <button onClick={toggle} style={{
              display:'inline-flex', alignItems:'center', gap:7, padding:'10px 18px',
              background:'transparent', border:`1px solid ${dark?'#334155':'#e2e8f0'}`,
              borderRadius:30, color: dark?'#94a3b8':'#475569', fontSize:12, fontWeight:600,
              cursor:'pointer', fontFamily:'inherit',
            }}>
              {dark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', borderTop:`1px solid ${dark?'#1e293b':'#e2e8f0'}`, borderBottom:`1px solid ${dark?'#1e293b':'#e2e8f0'}`, padding:'18px 0', marginBottom:32 }}>
          {[['10','Portales'],['36','Secciones spec'],['26','Entidades BD'],['11','Roles']].map(([v,l],i) => (
            <div key={i} style={{ flex:1, textAlign:'center', borderRight:i<3?`1px solid ${dark?'#1e293b':'#e2e8f0'}`:undefined }}>
              <div style={{ fontSize:24, fontWeight:800, color:'#ffbb23' }}>{v}</div>
              <div style={{ fontSize:10, color: dark?'#475569':'#94a3b8', marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Portal grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[{ path:'/', icon:'🌐', label:'Landing Page', role:'Público', color:'#059669' }, ...PORTALS].map((p,i) => (
            <Link key={i} to={p.path} style={{ textDecoration:'none' }}>
              <div style={{
                background: dark?'#1e293b':'#ffffff',
                border: `1px solid ${dark?'#334155':'#e2e8f0'}`,
                borderRadius:16, padding:'18px 20px', cursor:'pointer',
                boxShadow: dark?'none':'0 1px 4px rgba(0,0,0,.05)',
                transition:'all .2s',
                display:'flex', gap:14, alignItems:'flex-start',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=p.color; e.currentTarget.style.boxShadow=`0 4px 16px ${p.color}20`; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=dark?'#334155':'#e2e8f0'; e.currentTarget.style.boxShadow=dark?'none':'0 1px 4px rgba(0,0,0,.05)'; e.currentTarget.style.transform='none'; }}>
                <div style={{ fontSize:26, lineHeight:1, flexShrink:0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color: dark?'#f1f5f9':'#0f172a', marginBottom:4 }}>{p.label}</div>
                  <code style={{ fontSize:10, color: dark?'#475569':'#94a3b8', display:'block', marginBottom:5 }}>{p.path}</code>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:`${p.color}15`, color:p.color, fontWeight:600 }}>{p.role}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:32, fontSize:11, color: dark?'#334155':'#cbd5e1' }}>
          Demo visual interactivo · Datos ficticios · Sin backend real<br/>
          <code style={{ color: dark?'#475569':'#94a3b8' }}>github.com/Buezo2023/wcahub</code>
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <DemoMenu />
          <Routes>
            <Route path="/hub"          element={<NavHub />} />
            <Route path="/"             element={<Landing />} />
            <Route path="/portal"       element={<PortalEstudiante />} />
            <Route path="/onboarding"   element={<Onboarding />} />
            <Route path="/docente"      element={<PortalDocente />} />
            <Route path="/admin"        element={<DashboardAdmin />} />
            <Route path="/super"        element={<SuperAdmin />} />
            <Route path="/crm"          element={<CRM />} />
            <Route path="/cobros"       element={<GestorCobros />} />
            <Route path="/coordinacion" element={<CoordAcademica />} />
            <Route path="/bi"           element={<BIDashboard />} />
            <Route path="/preview"      element={<PlatformPreview />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*"             element={<Navigate to="/hub" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
