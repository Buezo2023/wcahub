import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// ─── Lazy load de cada portal para mejor rendimiento ─────────────
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
const PlatformPreview = lazy(() => import('./pages/PlatformPreview.jsx'));

// ─── Paleta de colores WCA ───────────────────────────────────────
const B = {
  primary: '#155266', dark: '#0f3d4d', secondary: '#ffbb23',
  bg: '#f5f7fa', white: '#ffffff', text: '#1f2933', textSec: '#6b7280',
  border: '#d1dde3', green: '#059669', greenDim: '#d1fae5',
};

// ─── Loading spinner ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: B.bg, gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, border: `3px solid ${B.border}`,
        borderTopColor: B.primary, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: 13, color: B.textSec, fontWeight: 500 }}>Cargando WCA Hub…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Hub de navegación (solo visible en /hub) ────────────────────
const PORTALS = [
  { path: '/',             icon: '🌐', label: 'Landing Page',          role: 'Público',      color: B.green   },
  { path: '/portal',       icon: '👨‍🎓', label: 'Portal Estudiante',      role: 'Estudiante',   color: B.primary },
  { path: '/onboarding',   icon: '🎯', label: 'Onboarding Wizard',      role: 'Estudiante',   color: '#7c3aed' },
  { path: '/docente',      icon: '👩‍🏫', label: 'Portal Docente',         role: 'Docente',      color: '#92400e' },
  { path: '/admin',        icon: '⚙️',  label: 'Dashboard Admin',        role: 'Admin',        color: B.dark    },
  { path: '/super',        icon: '⭐',  label: 'Super Admin',            role: 'Super Admin',  color: '#2d1b69' },
  { path: '/crm',          icon: '💼',  label: 'CRM Ventas',             role: 'Ventas',       color: B.green   },
  { path: '/cobros',       icon: '💳',  label: 'Gestor de Cobros',       role: 'Cobros',       color: '#92400e' },
  { path: '/coordinacion', icon: '🎓',  label: 'Coordinación Académica', role: 'Coordinadora', color: B.primary },
  { path: '/bi',           icon: '📊',  label: 'Dashboard BI',           role: 'Directivos',   color: '#3c3489' },
  { path: '/preview',      icon: '🗺️',  label: 'Platform Preview',       role: 'Referencia',   color: B.textSec },
];

function NavHub() {
  return (
    <div style={{ minHeight: '100vh', background: B.dark, fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 24 }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: B.secondary, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            WORLD CONNECT ACADEMY
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 8 }}>
            WCA <span style={{ color: B.secondary }}>Hub</span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', maxWidth: 500, margin: '0 auto' }}>
            Demo interactivo de todos los portales de la plataforma
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 0, justifyContent: 'center', marginBottom: 40, borderTop: '1px solid rgba(255,255,255,.08)', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '20px 0' }}>
          {[['10','Portales'],['36','Secciones spec'],['26','Entidades BD'],['11','Roles']].map(([v,l],i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,.08)' : undefined }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: B.secondary }}>{v}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Portal grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {PORTALS.map((p, i) => (
            <Link key={i} to={p.path} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,.04)', border: `1px solid rgba(255,255,255,.08)`,
                borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                transition: 'all .2s', display: 'flex', gap: 12, alignItems: 'flex-start',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${p.color}18`; e.currentTarget.style.borderColor = `${p.color}50`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}>
                <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{p.label}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <code style={{ fontSize: 9, color: 'rgba(255,255,255,.3)' }}>wcahub.com{p.path}</code>
                    <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 20, background: `${p.color}25`, color: p.color, fontWeight: 600 }}>{p.role}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'rgba(255,255,255,.25)', lineHeight: 1.8 }}>
          Este es un demo de diseño interactivo · Los datos son ficticios · Sin backend real<br />
          Para la versión de producción consultar <code style={{ color: 'rgba(255,255,255,.4)' }}>WCA_README_HANDOFF.md</code>
        </div>
      </div>
    </div>
  );
}

// ─── Back button (visible en todos los portales) ─────────────────
function BackToHub() {
  const location = useLocation();
  if (location.pathname === '/hub') return null;
  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
    }}>
      <Link to="/hub" style={{ textDecoration: 'none' }}>
        <div style={{
          background: B.primary, color: '#fff', padding: '8px 14px',
          borderRadius: 30, fontSize: 11, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 4px 16px rgba(21,82,102,.35)',
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}>
          ⬡ Ver todos los portales
        </div>
      </Link>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <BackToHub />
        <Routes>
          {/* Hub de navegación */}
          <Route path="/hub"          element={<NavHub />} />

          {/* Portales */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/hub" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
