import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useGlobalSearch, GlobalSearchModal } from './lib/globalSearch.jsx';
import { ToastContainer } from './lib/toast.jsx';
import { Suspense, lazy, useState } from 'react';
import { supabase } from './lib/supabase.js';
import { ErrorBoundary } from './lib/ErrorBoundary.jsx';
import { ConnectionGuard } from './lib/ConnectionGuard.jsx';
import { ThemeProvider, ThemeToggle, useTheme } from './ThemeContext.jsx';
import { SessionProvider, useSession } from './lib/SessionContext.jsx';
import { CookieBanner } from './lib/CookieBanner.jsx';

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
const PlacementTestPublic = lazy(() => import('./pages/PlacementTest.jsx'));
const PrivacyPolicy        = lazy(() => import('./pages/PrivacyPolicy.jsx'));
const TermsOfUse           = lazy(() => import('./pages/TermsOfUse.jsx'));
const Register             = lazy(() => import('./pages/Register.jsx'));

// ── Role → portal map ────────────────────────────────────────────
const ROLE_PORTALS = {
  estudiante:    '/portal',
  docente:       '/docente',
  admin:         '/admin',
  super_admin:   '/super',
  asesor_ventas: '/crm',
  cobros:        '/cobros',
  coordinadora:  '/coordinacion',
  directivo:     '/bi',
};

// ── PrivateRoute — uses SessionContext (single auth source of truth) ──
function PrivateRoute({ element, allowedRoles }) {
  const { profile, session, loading } = useSession();
  const [auth, setAuth] = React.useState({ ready: false, ok: false, redirect: null });

  React.useEffect(() => {
    if (loading) return;
    if (!session) { setAuth({ ready: true, ok: false, redirect: '/' }); return; }
    if (!profile) { setAuth({ ready: true, ok: false, redirect: '/' }); return; }
    if (allowedRoles && profile.role !== 'super_admin' && !allowedRoles.includes(profile.role)) {
      setAuth({ ready: true, ok: false, redirect: ROLE_PORTALS[profile.role] || '/' });
      return;
    }
    setAuth({ ready: true, ok: true, redirect: null });
  }, [loading, session, profile]);

  if (!auth.ready) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', gap:16, background:'var(--bg-page,#f8fafc)',
      fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ width:32, height:32, border:'3px solid #e2e8f0',
        borderTopColor:'#155266', borderRadius:'50%',
        animation:'spin .7s linear infinite' }}/>
      <div style={{ fontSize:14, color:'#475569', fontWeight:500 }}>Verificando acceso…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!auth.ok) return <Navigate to={auth.redirect || '/'} replace />;

  return element;
}

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
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
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
              <div style={{ fontSize:11, color: dark?'#475569':'#94a3b8', marginTop:3 }}>{l}</div>
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
                display:'flex', gap:16, alignItems:'flex-start',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=p.color; e.currentTarget.style.boxShadow=`0 4px 16px ${p.color}20`; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=dark?'#334155':'#e2e8f0'; e.currentTarget.style.boxShadow=dark?'none':'0 1px 4px rgba(0,0,0,.05)'; e.currentTarget.style.transform='none'; }}>
                <div style={{ fontSize:26, lineHeight:1, flexShrink:0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color: dark?'#f1f5f9':'#0f172a', marginBottom:4 }}>{p.label}</div>
                  <code style={{ fontSize:11, color: dark?'#475569':'#94a3b8', display:'block', marginBottom:5 }}>{p.path}</code>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:`${p.color}15`, color:p.color, fontWeight:600 }}>{p.role}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:32, fontSize:11, color: dark?'#334155':'#cbd5e1' }}>
          Plataforma de gestión académica · WCA Academy<br/>
          <code style={{ color: dark?'#475569':'#94a3b8' }}>worldconnectacademy.com</code>
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────
function AppInner() {
  const search = useGlobalSearch();


  // Catch uncaught errors that bypass ErrorBoundary
  React.useEffect(() => {
    const h = (e) => console.error("[WCA uncaught]", e.error || e.reason || e);
    window.addEventListener("error", h);
    window.addEventListener("unhandledrejection", h);
    return () => { window.removeEventListener("error", h); window.removeEventListener("unhandledrejection", h); };
  }, []);
  // SW update notification
  const [swUpdate, setSwUpdate] = React.useState(false);
  React.useEffect(() => {
    const handler = () => setSwUpdate(true);
    window.addEventListener('wca:sw-update', handler);
    return () => window.removeEventListener('wca:sw-update', handler);
  }, []);

  return (
    <>
      <ConnectionGuard />
      <ToastContainer />
      <GlobalSearchModal search={search} />
      {swUpdate && (
        <div style={{
          position:"fixed", bottom:16, left:"50%", transform:"translateX(-50%)",
          zIndex:60, background:"var(--wca-primary)", color:"#fff",
          padding:"10px 20px", borderRadius:12, fontSize:13, fontWeight:600,
          display:"flex", gap:12, alignItems:"center",
          boxShadow:"0 4px 20px rgba(0,0,0,.3)", whiteSpace:"nowrap",
        }}>
          🆕 Nueva versión disponible
          <button onClick={() => window.location.reload()}
            style={{ padding:"5px 14px", background:"var(--wca-secondary)",
              color:"var(--wca-primary)", border:"none", borderRadius:8,
              fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Actualizar
          </button>
          <button onClick={() => setSwUpdate(false)}
            style={{ background:"none", border:"none", color:"rgba(255,255,255,.6)",
              fontSize:16, cursor:"pointer", padding:"0 4px" }}>
            ✕
          </button>
        </div>
      )}
      <ErrorBoundary>
      <CookieBanner />
      <Suspense fallback={<PageLoader />}>
        <Routes>
            <Route path="/hub"          element={<NavHub />} />
            <Route path="/"             element={<Landing />} />
            <Route path="/test"         element={<PlacementTestPublic />} />
            <Route path="/preview"      element={<PlatformPreview />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding"   element={<PrivateRoute element={<Onboarding />} allowedRoles={['estudiante','super_admin']} />} />
            <Route path="/portal"       element={<PrivateRoute element={<PortalEstudiante />} allowedRoles={['estudiante','super_admin']} />} />
            <Route path="/docente"      element={<PrivateRoute element={<PortalDocente />} allowedRoles={['docente','super_admin']} />} />
            <Route path="/admin"        element={<PrivateRoute element={<DashboardAdmin />} allowedRoles={['admin','super_admin']} />} />
            <Route path="/super"        element={<PrivateRoute element={<SuperAdmin />} allowedRoles={['super_admin']} />} />
            <Route path="/crm"          element={<PrivateRoute element={<CRM />} allowedRoles={['asesor_ventas','admin','super_admin']} />} />
            <Route path="/cobros"       element={<PrivateRoute element={<GestorCobros />} allowedRoles={['cobros','admin','super_admin']} />} />
            <Route path="/coordinacion" element={<PrivateRoute element={<CoordAcademica />} allowedRoles={['coordinadora','admin','super_admin']} />} />
            <Route path="/bi"           element={<PrivateRoute element={<BIDashboard />} allowedRoles={['directivo','admin','super_admin']} />} />
            <Route path="/registro"     element={<Register />} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </SessionProvider>
    </ThemeProvider>
  );
}
