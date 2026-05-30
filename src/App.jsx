import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
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
const ForgotAccess      = lazy(() => import('./pages/ForgotAccess.jsx'));

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

// ── SuperAdmin floating "back" button when viewing other portals ──
function SuperAdminFloatingBack() {
  const { profile } = useSession();
  const loc = useLocation();
  const navigate = useNavigate();
  if (profile?.role !== 'super_admin' || loc.pathname === '/super') return null;
  const portalNames = {
    '/portal':'Estudiante', '/docente':'Docente', '/admin':'Admin',
    '/coordinacion':'Coordinación', '/crm':'CRM', '/cobros':'Cobros',
    '/bi':'BI', '/registro':'Registro', '/':'Landing',
  };
  const name = portalNames[loc.pathname];
  if (!name) return null;
  return (
    <div style={{
      position:'fixed', bottom:20, left:20, zIndex:9999,
      display:'flex', alignItems:'center', gap:8,
      background:'#155266', color:'#fff', padding:'10px 16px',
      borderRadius:12, fontSize:12, fontWeight:600,
      boxShadow:'0 4px 20px rgba(0,0,0,.3)', cursor:'pointer',
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
    }} onClick={() => navigate('/super')}>
      <span style={{fontSize:16}}>←</span>
      <span>Volver a SuperAdmin</span>
      <span style={{background:'rgba(255,255,255,.2)',padding:'2px 8px',borderRadius:6,fontSize:10}}>
        Viendo: {name}
      </span>
    </div>
  );
}

// ── PrivateRoute — uses SessionContext (single auth source of truth) ──
// ── AccessRecovery: shown when session exists but profile failed ──
function AccessRecovery({ message, onRetry, onSignOut }) {
  const [retrying, setRetrying] = React.useState(false);
  async function handleRetry() {
    setRetrying(true);
    try { await onRetry(); } catch(e) {}
    setRetrying(false);
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', gap:20, background:'var(--bg-page,#f8fafc)',
      fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:24, textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:4 }}>⚠️</div>
      <div style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>No pudimos verificar tu perfil</div>
      <div style={{ fontSize:14, color:'#475569', maxWidth:380, lineHeight:1.7 }}>
        Tu sesión sigue activa, pero no pudimos cargar tu perfil institucional.<br/>
        {message && <span style={{ fontSize:12, color:'#94a3b8', display:'block', marginTop:4 }}>{message}</span>}
      </div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
        <button onClick={handleRetry} disabled={retrying}
          style={{ padding:'10px 24px', background:'#155266', color:'#fff', border:'none',
            borderRadius:10, fontSize:14, fontWeight:700, cursor:retrying?'wait':'pointer',
            fontFamily:'inherit', opacity:retrying?.7:1 }}>
          {retrying ? 'Verificando…' : '🔄 Reintentar'}
        </button>
        <button onClick={onSignOut}
          style={{ padding:'10px 24px', background:'#fff', color:'#475569',
            border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function PrivateRoute({ element, allowedRoles }) {
  const { profile, session, loading, profileLoading, profileError, refreshProfile, signOut } = useSession();

  // 1. Still doing initial auth check → show spinner
  // But if profile already exists and profileLoading is a background silent refresh → don't block
  if (loading || (profileLoading && !profile)) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', gap:16, background:'var(--bg-page,#f8fafc)',
      fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ width:32, height:32, border:'3px solid #e2e8f0',
        borderTopColor:'#155266', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <div style={{ fontSize:14, color:'#475569', fontWeight:500 }}>Verificando acceso…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // 2. No session at all → redirect to home
  if (!session) return <Navigate to="/" replace />;

  // 3. Session exists but profile failed or is null → recoverable, NOT redirect
  if (!profile) {
    const handleSignOut = async () => { await signOut(); window.location.href = '/'; };
    return (
      <AccessRecovery
        message={profileError || "No encontramos tu perfil institucional."}
        onRetry={refreshProfile}
        onSignOut={handleSignOut}
      />
    );
  }

  // 4. Profile loaded but wrong role → redirect to correct portal
  if (allowedRoles && profile.role !== 'super_admin' && !allowedRoles.includes(profile.role)) {
    return <Navigate to={ROLE_PORTALS[profile.role] || '/'} replace />;
  }

  return element;
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
          Plataforma de gestión académica · World Connect Academy<br/>
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


  return (
    <>
      <ConnectionGuard />
      <ToastContainer />
      <GlobalSearchModal search={search} />

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
            <Route path="/cobros"       element={<PrivateRoute element={<GestorCobros />} allowedRoles={['cobros','admin','super_admin','coordinadora']} />} />
            <Route path="/coordinacion" element={<PrivateRoute element={<CoordAcademica />} allowedRoles={['coordinadora','admin','super_admin']} />} />
            <Route path="/bi"           element={<PrivateRoute element={<BIDashboard />} allowedRoles={['directivo','admin','super_admin']} />} />
            <Route path="/registro"     element={<Register />} />
            <Route path="/recuperar"    element={<ForgotAccess />} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Routes>
          {/* Floating "Back to SuperAdmin" button when super_admin is viewing other portals */}
          <SuperAdminFloatingBack />
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
