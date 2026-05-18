import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';

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

const B = {
  primary:'#155266', dark:'#0f3d4d', secondary:'#ffbb23',
  bg:'#f5f7fa', white:'#ffffff', text:'#1f2933', textSec:'#6b7280',
  border:'#d1dde3', green:'#059669',
};

const PORTALS = [
  { path:'/portal',       icon:'👨‍🎓', label:'Portal Estudiante',      role:'Estudiante',   color:B.primary  },
  { path:'/docente',      icon:'👩‍🏫', label:'Portal Docente',          role:'Docente',      color:'#92400e'  },
  { path:'/admin',        icon:'⚙️',  label:'Dashboard Admin',         role:'Admin',        color:B.dark     },
  { path:'/super',        icon:'⭐',  label:'Super Admin',             role:'Super Admin',  color:'#2d1b69'  },
  { path:'/crm',          icon:'💼',  label:'CRM Ventas',              role:'Ventas',       color:B.green    },
  { path:'/cobros',       icon:'💳',  label:'Gestor de Cobros',        role:'Cobros',       color:'#92400e'  },
  { path:'/coordinacion', icon:'🎓',  label:'Coordinación Académica',  role:'Coordinadora', color:B.primary  },
  { path:'/bi',           icon:'📊',  label:'Dashboard BI',            role:'Directivos',   color:'#3c3489'  },
  { path:'/onboarding',   icon:'🎯',  label:'Onboarding Wizard',       role:'Primer acceso',color:'#7c3aed'  },
  { path:'/preview',      icon:'🗺️',  label:'Platform Preview',        role:'Todos',        color:B.textSec  },
];

// ─── Loading ──────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:B.bg, gap:14 }}>
      <div style={{ width:44, height:44, border:`3px solid ${B.border}`, borderTopColor:B.primary, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <div style={{ fontSize:13, color:B.textSec }}>Cargando WCA Hub…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Demo floating menu (visible en TODOS los portales) ───────────
function DemoMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div style={{ position:'fixed', bottom:20, right:20, zIndex:9999, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* Panel desplegable */}
      {open && (
        <div style={{
          position:'absolute', bottom:58, right:0,
          background:B.dark, border:'1px solid rgba(255,255,255,.12)',
          borderRadius:16, padding:10, width:240,
          boxShadow:'0 20px 60px rgba(0,0,0,.4)',
          animation:'slideUp .2s ease',
        }}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

          <div style={{ fontSize:9, color:'rgba(255,255,255,.35)', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', padding:'4px 8px 8px' }}>
            WCA Hub · Acceso Demo
          </div>

          {/* Landing separada */}
          <Link to="/" onClick={() => setOpen(false)} style={{ textDecoration:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 9px', borderRadius:8, marginBottom:4, background:location.pathname==='/'?'rgba(255,255,255,.1)':'transparent', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.08)'}
              onMouseLeave={e=>e.currentTarget.style.background=location.pathname==='/'?'rgba(255,255,255,.1)':'transparent'}>
              <span style={{ fontSize:15 }}>🌐</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#fff' }}>Landing Page</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,.35)' }}>Público</div>
              </div>
              {location.pathname==='/' && <div style={{ width:6, height:6, borderRadius:'50%', background:B.secondary }} />}
            </div>
          </Link>

          <div style={{ height:1, background:'rgba(255,255,255,.08)', margin:'4px 0 6px' }} />

          {/* Todos los portales */}
          {PORTALS.map((p,i) => (
            <Link key={i} to={p.path} onClick={() => setOpen(false)} style={{ textDecoration:'none' }}>
              <div style={{
                display:'flex', alignItems:'center', gap:9, padding:'7px 9px', borderRadius:8, marginBottom:2,
                background:location.pathname===p.path?`${p.color}25`:'transparent', cursor:'pointer',
              }}
              onMouseEnter={e=>e.currentTarget.style.background=`${p.color}18`}
              onMouseLeave={e=>e.currentTarget.style.background=location.pathname===p.path?`${p.color}25`:'transparent'}>
                <span style={{ fontSize:15 }}>{p.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'#fff' }}>{p.label}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.35)' }}>{p.role}</div>
                </div>
                {location.pathname===p.path && <div style={{ width:6, height:6, borderRadius:'50%', background:p.color }} />}
              </div>
            </Link>
          ))}

          <div style={{ height:1, background:'rgba(255,255,255,.08)', margin:'6px 0 4px' }} />
          <div style={{ fontSize:9, color:'rgba(255,255,255,.25)', textAlign:'center', padding:'4px 0 2px' }}>
            Demo visual · Sin backend real
          </div>
        </div>
      )}

      {/* Botón principal */}
      <button onClick={() => setOpen(!open)} style={{
        background: open ? B.dark : B.primary,
        color:'#fff', border:`2px solid ${open?'rgba(255,255,255,.2)':B.primary}`,
        borderRadius:30, padding:'10px 18px', fontSize:12, fontWeight:700,
        cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8,
        boxShadow:'0 4px 20px rgba(21,82,102,.4)', transition:'all .2s',
      }}>
        <span style={{ fontSize:16 }}>{open ? '✕' : '⬡'}</span>
        {open ? 'Cerrar' : 'Demo · 10 portales'}
        {!open && <span style={{ background:B.secondary, color:B.dark, fontSize:9, padding:'1px 6px', borderRadius:20, fontWeight:800 }}>▾</span>}
      </button>
    </div>
  );
}

// ─── Hub principal (/hub) ─────────────────────────────────────────
function NavHub() {
  return (
    <div style={{ minHeight:'100vh', background:B.dark, fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:24 }}>
      <div style={{ maxWidth:860, margin:'0 auto' }}>

        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:11, color:B.secondary, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>WORLD CONNECT ACADEMY</div>
          <div style={{ fontSize:38, fontWeight:800, color:'#fff', letterSpacing:-1, marginBottom:10 }}>
            WCA <span style={{ color:B.secondary }}>Hub</span>
          </div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.4)', marginBottom:28 }}>
            Plataforma de gestión académica · Demo interactivo
          </div>
          <Link to="/" style={{ textDecoration:'none' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 24px', background:B.secondary, borderRadius:30, color:B.dark, fontSize:12, fontWeight:700 }}>
              🌐 Ver Landing Page pública →
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,.08)', borderBottom:'1px solid rgba(255,255,255,.08)', padding:'18px 0', marginBottom:32 }}>
          {[['10','Portales'],['36','Secciones spec'],['26','Entidades BD'],['11','Roles']].map(([v,l],i) => (
            <div key={i} style={{ flex:1, textAlign:'center', borderRight:i<3?'1px solid rgba(255,255,255,.08)':undefined }}>
              <div style={{ fontSize:22, fontWeight:800, color:B.secondary }}>{v}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Portal grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
          {[{ path:'/', icon:'🌐', label:'Landing Page', role:'Público', color:B.green }, ...PORTALS].map((p,i) => (
            <Link key={i} to={p.path} style={{ textDecoration:'none' }}>
              <div style={{
                background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
                borderRadius:14, padding:'16px 18px', cursor:'pointer', transition:'all .2s',
                display:'flex', gap:12, alignItems:'flex-start',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.background=`${p.color}18`; e.currentTarget.style.borderColor=`${p.color}50`; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,.08)'; }}>
                <div style={{ fontSize:24, lineHeight:1, flexShrink:0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:4 }}>{p.label}</div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <code style={{ fontSize:9, color:'rgba(255,255,255,.3)' }}>{p.path}</code>
                    <span style={{ fontSize:8, padding:'1px 6px', borderRadius:20, background:`${p.color}25`, color:p.color, fontWeight:600 }}>{p.role}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign:'center', fontSize:10, color:'rgba(255,255,255,.2)', lineHeight:2 }}>
          Demo visual interactivo · Datos ficticios · Sin backend real<br/>
          <code style={{ color:'rgba(255,255,255,.3)' }}>github.com/Buezo2023/wcahub</code>
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────
export default function App() {
  return (
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
          <Route path="*"             element={<Navigate to="/hub" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
