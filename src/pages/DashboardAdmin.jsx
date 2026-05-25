import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, getGroups, getPayments, updateGroupTeamsLink, getPrograms, getAuditLog } from "../lib/db.js";
import { exportCSV } from "../lib/exportCSV.js";
import { EmptyState } from "../lib/EmptyState.jsx";
import { MobileLayout, useMobile } from "../lib/MobileLayout.jsx";
import { SuperAdminBar } from "../lib/SuperAdminBar.jsx";
import { supabase } from "../lib/supabase.js";
import { toast } from "../lib/toast.jsx";
import { api } from "../lib/api.js";

// ─── BRAND ───────────────────────────────────────────────────────────────────
const B = {
  primary:   "#155266", primaryHov: "#0f3d4d", primaryDim: "var(--wca-primary-dim)",
  secondary: "#ffbb23", secondaryDim: "var(--amber-dim)",
  accent:    "#fab82c",
  dark:      "#0f3d4d",
  bg:        "var(--bg-page)", white: "var(--bg-surface)",
  text:      "var(--text-primary)", textSec: "var(--text-secondary)",
  border:    "var(--border)", borderLight: "var(--wca-primary-dim)",
  green: "#059669", greenDim: "var(--green-dim)",
  red:   "#dc2626", redDim: "var(--red-dim)",
  amber: "#ffbb23", amberDim: "var(--amber-dim)",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
// Students loaded from Supabase only

// Groups loaded from Supabase only

// Payments loaded from Supabase

// Alerts are now dynamically generated from real data
const ALERTS = [];  // populated from real Supabase data

// Cycle status loaded from Supabase cycle_config
const CYCLE_STATUS = [];  // replaced by realCycleStatus state

const NAV = [
  { id:"home",        icon:"ti-layout-dashboard", label:"Inicio"         },
  { id:"students",    icon:"ti-users",             label:"Estudiantes"    },
  { id:"groups",      icon:"ti-grid-dots",         label:"Grupos"         },
  { id:"payments",    icon:"ti-credit-card",       label:"Pagos"          },
  { id:"b2b",         icon:"ti-building",          label:"Empresas B2B"   },
];

const stateColor = s => s==="active"?[B.greenDim,"#065f46"]:s==="suspended"?[B.redDim,B.red]:[B.secondaryDim,"#92400e"];
const typeColor  = t => t==="scholarship"?[B.primaryDim,B.primary]:t==="b2b"?[B.secondaryDim,"#92400e"]:[B.bg,B.textSec];
const scoreCol   = s => s>=80?B.green:s>=70?B.amber:B.red;

function Badge({ text, bg, color }) {
  return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:bg, color, fontWeight:600, whiteSpace:"nowrap" }}>{text}</span>;
}
function Stat({ label, value, sub, color, icon }) {
  return (
    <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 16px", borderTop:`3px solid ${color||B.primary}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ fontSize:12, color:B.textSec }}>{label}</div>
        {icon && <i className={`ti ${icon}`} style={{ fontSize:16, color:color||B.primary }} aria-hidden="true" />}
      </div>
      <div style={{ fontSize:24, fontWeight:700, color:B.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:B.textSec, marginTop:4 }}>{sub}</div>}
    </div>
  );
}
// ─── AdminPrices component ────────────────────────────────────────
// Programs loaded from Supabase only

function AdminPrices() {
  const [progs, setProgs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [tmp, setTmp] = useState("");
  const [saved, setSaved] = useState(null);

  function savePrice(id) {
    setProgs(p => p.map(x => x.id===id ? {...x, price:+tmp} : x));
    setEditing(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2500);
  }

  return (
    <div style={{ maxWidth:620 }}>
      {saved && (
        <div style={{ position:"fixed", top:20, right:90, background:"#059669", color:"#fff", padding:"11px 18px", borderRadius:11, fontSize:13, fontWeight:600, zIndex:9999, boxShadow:"0 6px 20px rgba(5,150,105,.3)", display:"flex", gap:8 }}>
          ✓ Precio guardado correctamente
        </div>
      )}
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
        {progs.map((p,i) => (
          <div key={p.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"18px 20px", borderBottom:i<progs.length-1?"1px solid var(--border)":"none" }}>
            <span style={{ fontSize:22 }}>{p.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{p.name}</div>
              <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>Cobro {p.interval} · {p.students} estudiantes activos</div>
            </div>
            {editing===p.id ? (
              <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                <span style={{ fontSize:14, color:"var(--text-secondary)" }}>$</span>
                <input autoFocus value={tmp} onChange={e=>setTmp(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") savePrice(p.id); if(e.key==="Escape") setEditing(null); }} style={{ width:72, padding:"7px 9px", border:"2px solid #155266", borderRadius:8, fontSize:15, fontWeight:700, color:"#155266", textAlign:"center", fontFamily:"inherit" }}/>
                <button onClick={()=>savePrice(p.id)} style={{ padding:"8px 14px", background:"#155266", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✓</button>
                <button onClick={()=>setEditing(null)} style={{ padding:"8px 10px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", border:"1px solid var(--border)", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:24, fontWeight:800, color:p.color }}>${p.price}</div>
                <div style={{ fontSize:12, color:"var(--text-tertiary)" }}><span style={{fontSize:12,color:"var(--text-tertiary)"}}>{"/" + p.interval}</span></div>
                <button onClick={()=>{ setEditing(p.id); setTmp(String(p.price)); }} style={{ padding:"7px 14px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", border:"1px solid var(--border)", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#155266";e.currentTarget.style.color="#155266";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text-secondary)";}}>✎ Editar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── ENROLL FORM — complete enrollment with group ────────────────

// ─── Shared loading/error UI ──────────────────────────────────
function LoadingBar({ label = "Cargando datos…" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0", color:"var(--text-secondary)", fontSize:13 }}>
      <div style={{ width:16, height:16, border:"2px solid var(--border)", borderTopColor:"#155266",
                    borderRadius:"50%", animation:"spin .7s linear infinite", flexShrink:0 }}/>
      {label}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function ErrorBanner({ msg }) {
  return (
    <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10,
                  padding:"10px 14px", fontSize:13, color:"#dc2626", marginBottom:12,
                  display:"flex", gap:8, alignItems:"center" }}>
      <i className="ti ti-alert-circle" style={{ fontSize:15, flexShrink:0 }} aria-hidden="true"/>
      {msg}
    </div>
  );
}

function EnrollForm({ groups, onSubmit, onCancel }) {
  const [form, setForm] = React.useState({ name:"", email:"", phone:"", programId:"en", level:"A1", groupId:"", price:95 });
  const [saving, setSaving] = React.useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const valid = form.name && form.email;
  const PROG_MAP = { en:"Inglés Completo", va:"Asistente Virtual", va_mkt:"VA·Marketing", va_legal:"VA·Legal", va_care:"VA·Cuidador" };
  const filteredGroups = groups.filter(g=>g.level===form.level);

  return (
    <div>
      {[["Nombre completo","name","text","María Rodríguez"],["Email","email","email","m.rodriguez@correo.com"],["Teléfono","phone","tel","+504 XXXX-XXXX"]].map(([l,k,t,ph])=>{
        const required = k==="name"||k==="email";
        const invalid  = required && saving && !form[k];
        return (
        <div key={k} style={{ marginBottom:10 }}>
          <label style={{ fontSize:12, color:invalid?"#dc2626":"var(--text-secondary)", display:"block", marginBottom:3 }}>{l}{required&&<span style={{color:"#dc2626"}}> *</span>}</label>
          <input type={t} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}
            style={{ width:"100%", padding:"8px 12px", border:`1px solid ${invalid?"#dc2626":"var(--border)"}`, borderRadius:8, fontSize:13, color:"var(--text-primary)", background:invalid?"#fef2f2":"var(--bg-surface-subtle)", fontFamily:"inherit", outline:"none" }}/>
          {invalid && <div style={{ fontSize:11, color:"#dc2626", marginTop:3 }}>Campo requerido</div>}
        </div>
        );
      })}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <label style={{ fontSize:12, color:"var(--text-secondary)", display:"block", marginBottom:3 }}>Programa</label>
          <select value={form.programId} onChange={e=>set("programId",e.target.value)}
            style={{ width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, background:"var(--bg-surface-subtle)", fontFamily:"inherit" }}>
            {Object.entries(PROG_MAP).map(([id,n])=><option key={id} value={id}>{n}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:"var(--text-secondary)", display:"block", marginBottom:3 }}>Nivel inicial</label>
          <select value={form.level} onChange={e=>{ set("level",e.target.value); set("groupId",""); }}
            style={{ width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, background:"var(--bg-surface-subtle)", fontFamily:"inherit" }}>
            {["A1","A2","B1","B2","C1"].map(l=><option key={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:12, color:"var(--text-secondary)", display:"block", marginBottom:3 }}>Grupo / Horario</label>
        <select value={form.groupId} onChange={e=>set("groupId",e.target.value)}
          style={{ width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, background:"var(--bg-surface-subtle)", fontFamily:"inherit" }}>
          <option value="">Sin grupo asignado</option>
          {filteredGroups.map(g=><option key={g.id} value={g.dbId||g.id}>{g.level} · {g.time} · {g.days} ({g.teacher})</option>)}
        </select>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12, color:"var(--text-secondary)", display:"block", marginBottom:3 }}>Precio mensual (USD)</label>
        <input type="number" value={form.price} onChange={e=>set("price",+e.target.value)}
          style={{ width:"100%", padding:"8px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, color:"var(--text-primary)", background:"var(--bg-surface-subtle)", fontFamily:"inherit" }}/>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onCancel} style={{ flex:1, padding:"10px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
        <button disabled={!valid||saving} onClick={async()=>{ setSaving(true); await onSubmit(form); setSaving(false); }}
          style={{ flex:2, padding:"10px", background:valid?"#155266":"var(--bg-surface-subtle)", color:valid?"#fff":"var(--text-tertiary)", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:valid?"pointer":"not-allowed", fontFamily:"inherit" }}>
          {saving?"Matriculando…":"Crear matrícula"}
        </button>
      </div>
    </div>
  );
}


// ─── B2B Section — full CRUD ─────────────────────────────────────
function B2BSection({ supabase, B, Badge, Stat }) {
  const [companies,  setCompanies]  = React.useState([]);
  const [loading,    setLoading]    = React.useState(true);
  const [selCompany, setSelCompany] = React.useState(null); // selected for employees view
  const [employees,  setEmployees]  = React.useState([]);
  const [newCoForm,  setNewCoForm]  = React.useState(null); // {name, contact_name, contact_email, contact_phone, seats_paid, discount_pct}

  React.useEffect(() => {
    supabase.from("b2b_companies")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setCompanies(data); })
      .finally(() => setLoading(false));
  }, []);

  async function loadEmployees(company) {
    setSelCompany(company);
    const { data } = await supabase
      .from("students")
      .select("id, level, profiles(full_name, email)")
      .eq("b2b_company", company.id)
      .limit(50);
    setEmployees(data || []);
  }

  async function exportInvoice(co) {
    const month = new Date().toLocaleDateString("es-HN", { month: "long", year: "numeric" });
    const rows  = [
      ["Empresa", "Contacto", "Email", "Cupos pagados", "Descuento %", "Monto mes"],
      [co.name, co.contact_name, co.contact_email, co.seats_paid, co.discount_pct || 0,
       `$${Math.round(co.seats_paid * 95 * (1 - (co.discount_pct || 0) / 100))}`],
    ];
    const csv   = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a     = document.createElement("a");
    a.href      = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download  = `Factura-B2B-${co.name.replace(/\s+/g, "-")}-${month}.csv`;
    a.click();
  }

  async function saveCompany(form) {
    const { data, error } = await supabase.from("b2b_companies").insert({
      name:          form.name,
      contact_name:  form.contact_name,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      seats_paid:    Number(form.seats_paid) || 0,
      discount_pct:  Number(form.discount_pct) || 0,
      active:        true,
    }).select().single();
    if (error) { toast.error("Error: " + error.message); return; }
    setCompanies(cs => [data, ...cs]);
    setNewCoForm(null);
  }

  const totalRevenue = companies.reduce((a, co) =>
    a + Math.round(co.seats_paid * 95 * (1 - (co.discount_pct || 0) / 100)), 0);

  if (loading) return <div style={{ padding:20, color:B.textSec }}>Cargando empresas…</div>;

  // Employee detail view
  if (selCompany) return (
    <div>
      <button onClick={() => { setSelCompany(null); setEmployees([]); }}
        style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, padding:"7px 14px",
                 background:"transparent", border:`1px solid ${B.border}`, borderRadius:8,
                 cursor:"pointer", color:B.textSec, fontFamily:"inherit", marginBottom:14 }}>
        ← Volver a empresas
      </button>
      <div style={{ fontSize:18, fontWeight:700, color:B.text, marginBottom:4 }}>{selCompany.name}</div>
      <div style={{ fontSize:13, color:B.textSec, marginBottom:16 }}>
        Contacto: {selCompany.contact_name} · {selCompany.contact_email} · {selCompany.seats_paid} cupos
      </div>
      <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${B.border}`, fontSize:13, fontWeight:600, color:B.text }}>
          Empleados matriculados ({employees.length})
        </div>
        {employees.length === 0 && (
          <div style={{ padding:"24px 16px", textAlign:"center", fontSize:13, color:B.textSec }}>
            Sin empleados registrados en esta empresa aún.
          </div>
        )}
        {employees.map((e, i) => (
          <div key={e.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
               borderTop:i>0?`1px solid ${B.border}`:"none" }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:B.primaryDim,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:12, fontWeight:700, color:B.primary }}>
              {(e.profiles?.full_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{e.profiles?.full_name}</div>
              <div style={{ fontSize:12, color:B.textSec }}>{e.profiles?.email}</div>
            </div>
            <Badge text={`Nivel ${e.level || "A1"}`} bg={B.primaryDim} color={B.primary} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)", gap:10, marginBottom:14 }}>
        <Stat label="Empresas activas" value={companies.length} sub={`${companies.reduce((a,c)=>a+c.seats_paid,0)} cupos totales`} color={B.primary} icon="ti-building" />
        <Stat label="Ingresos B2B (mes)" value={`$${totalRevenue.toLocaleString()}`} sub="Con descuentos aplicados" color={B.secondary} icon="ti-coin" />
        <Stat label="Próxima factura" value="1 del mes" sub={`${companies.length} empresa${companies.length!==1?"s":""}`} color={B.green} icon="ti-receipt" />
      </div>

      {companies.map((co) => (
        <div key={co.id} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:B.text }}>{co.name}</div>
              <div style={{ fontSize:13, color:B.textSec }}>
                {co.contact_name} · {co.contact_email}
                {co.contact_phone ? ` · ${co.contact_phone}` : ""}
              </div>
              {co.discount_pct > 0 && (
                <div style={{ fontSize:11, color:"#d97706", marginTop:3 }}>✓ Descuento B2B: {co.discount_pct}%</div>
              )}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:16, fontWeight:700, color:B.primary }}>
                ${Math.round(co.seats_paid * 95 * (1 - (co.discount_pct||0)/100))}/mes
              </div>
              <div style={{ fontSize:11, color:B.textSec }}>{co.seats_paid} cupos × $95</div>
              <Badge text="Activa" bg={B.greenDim} color="#065f46" />
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => loadEmployees(co)}
              style={{ fontSize:12, padding:"5px 12px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
              Ver empleados
            </button>
            <button onClick={() => exportInvoice(co)}
              style={{ fontSize:12, padding:"5px 12px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>
              ↓ Factura CSV
            </button>
            <button onClick={async()=>{
              {
                await supabase.from("b2b_companies").update({active:false}).eq("id",co.id);
                setCompanies(cs=>cs.filter(c=>c.id!==co.id));
                toast.success(`${co.name} desactivada`);
              }
            }} style={{ fontSize:12, padding:"5px 12px", background:"#fef2f2", color:"#dc2626", border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>
              Desactivar
            </button>
          </div>
        </div>
      ))}

      {newCoForm ? (
        <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:18, marginTop:8 }}>
          <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:14 }}>Nueva empresa B2B</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {[["Nombre empresa","name","text","TechCorp HN"],["Contacto principal","contact_name","text","Juan Pérez"],
              ["Email contacto","contact_email","email","juan@empresa.com"],["Teléfono","contact_phone","tel","+504 9900-0000"],
              ["Cupos pagados","seats_paid","number","5"],["Descuento %","discount_pct","number","10"]
            ].map(([label,key,type,ph])=>(
              <div key={key} style={{gridColumn:key==="name"||key==="contact_email"?"1/-1":undefined}}>
                <label style={{fontSize:12,color:B.textSec,display:"block",marginBottom:3}}>{label}</label>
                <input type={type} value={newCoForm[key]||""} placeholder={ph}
                  onChange={e=>setNewCoForm(f=>({...f,[key]:e.target.value}))}
                  style={{width:"100%",padding:"8px 12px",border:`1px solid ${B.border}`,borderRadius:8,fontSize:13,background:B.bg,fontFamily:"inherit",color:B.text}}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setNewCoForm(null)}
              style={{flex:1,padding:"9px",background:B.bg,border:`1px solid ${B.border}`,borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:B.textSec}}>
              Cancelar
            </button>
            <button onClick={()=>newCoForm.name&&newCoForm.contact_email&&saveCompany(newCoForm)}
              style={{flex:2,padding:"9px",background:B.primary,color:"var(--bg-surface)",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Crear empresa
            </button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setNewCoForm({name:"",contact_name:"",contact_email:"",contact_phone:"",seats_paid:"",discount_pct:""})}
          style={{width:"100%",padding:"11px",background:B.primary,color:"var(--bg-surface)",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
          + Crear cuenta empresa
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
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
  const isMobile = useMobile();
  const [sideOpen, setSideOpen] = useState(false);
  const [view, setView] = useState("home");
  const [realStudents, setRealStudents] = useState([]);
  const [realGroups,   setRealGroups]   = useState([]);
  const [realCycleStatus, setRealCycleStatus] = useState([]);
  const [auditItems, setAuditItems] = useState([]);
  const [realPayments, setRealPayments] = useState([]);
  const PAYMENTS_PENDING = useMemo(() => realPayments.filter(p => p.status === "pending"), [realPayments]);
  const confirmed = useMemo(() => realPayments.filter(p => p.status === "confirmed"), [realPayments]);
  const [loadingData,  setLoadingData]  = useState(true);

  // Load real students + groups from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        // Students
        const { data: enrolls } = await supabase
          .from("enrollments")
          .select(`
            id, program_id, status, current_unit,
            group_id,
            students!inner(
              id, level, scholarship,
              profiles!inner(full_name, email, avatar_url, active)
            ),
            groups(level, schedule, days)
          `)
          .eq("status", "active")
          .limit(200);
        if (enrolls?.length) {
          const mapped = enrolls.map(e => ({
            id:        e.students.id,
            name:      e.students.profiles.full_name || e.students.profiles.email,
            email:     e.students.profiles.email,
            country:   "🌎",
            level:     e.students.level || e.groups?.level || "A1",
            group:     e.groups ? `${e.groups.level}·${e.groups.schedule?.split("–")[0] || ""}` : "Sin grupo",
            program:   { en:"Inglés", va:"VA", va_mkt:"VA·Mkt", va_legal:"VA·Legal", va_care:"VA·Cuidador" }[e.program_id] || e.program_id,
            type:      e.students.scholarship ? "scholarship" : "regular",
            state:     "active",
            payment:   "Al día",
            attendance: 80,
            score:     75,
            enrolled:  new Date(e.students.created_at||Date.now()).toLocaleDateString("es-HN",{month:"short",year:"numeric"}),
            enrollId:  e.id,
            profileId: e.students.profiles.id,
          }));
          setRealStudents(mapped);
        }
        // Groups
        const { data: grps } = await supabase
          .from("groups")
          .select("id, level, schedule, days, capacity, active_unit, teams_link, teacher_groups(staff(profiles(full_name)))")
          .eq("active", true);
        if (grps?.length) {
          // Count enrolled students per group
          const { data: enrollCounts } = await supabase.from("enrollments")
            .select("group_id")
            .eq("status", "active")
            .not("group_id", "is", null);
          const groupCounts = {};
          (enrollCounts || []).forEach(e => {
            groupCounts[e.group_id] = (groupCounts[e.group_id] || 0) + 1;
          });

          const mappedG = grps.map(g => ({
            id:       g.id,
            level:    g.level,
            time:     g.schedule,
            days:     g.days,
            teacher:  g.teacher_groups?.[0]?.staff?.profiles?.full_name || "Sin asignar",
            students: groupCounts[g.id] || 0,
            capacity: g.capacity,
            unit:     g.active_unit,
            teamsSet: !!g.teams_link,
            teamsLink: g.teams_link,
            dbId:     g.id,
          }));
        // Load pending payments
        const { data: pays } = await supabase.from("payments")
          .select("id, amount, method, status, created_at, enrollment_id, students(profiles(full_name, email))")
          .order("created_at", { ascending: false }).limit(100);
        if (pays) setRealPayments(pays.map(p => ({
          id: p.id, amount: p.amount, method: p.method, status: p.status,
          student: p.students?.profiles?.full_name || "—",
          email: p.students?.profiles?.email || "—",
          date: new Date(p.created_at).toLocaleDateString("es-HN", {day:"2-digit",month:"short"}),
        })));
        // Load audit log for activity feed
        const { data: audit } = await supabase.from("audit_log")
          .select("id, action, metadata, created_at")
          .order("created_at", { ascending: false }).limit(10);
        if (audit) setAuditItems(audit);
          setRealGroups(mappedG);
        }
        // Load cycle status from Supabase
        const { data: cycleRows } = await supabase
          .from("cycle_config")
          .select("level, current_unit, program_id")
          .eq("program_id", "en");
        if (cycleRows?.length) {
          setRealCycleStatus(cycleRows.map(r => ({
            level: r.level, unit: r.current_unit,
            title: `Unidad ${r.current_unit}`, groups: 0, students: 0,
          })));
        }
      } catch(e) { console.error("Admin data load:", e); }
      finally { setLoadingData(false); }
    }
    loadData();
  }, []);
  const [actionModal, setActionModal] = useState(null); // {type, student, group}
  const [actionNote, setActionNote] = useState("");
  const [actionDone, setActionDone] = useState(null);
  const [students, setStudents] = useState([
    {id:1, name:"María López",    level:"B1", group:"B1·6PM", status:"active",   type:"regular"},
    {id:2, name:"Carlos Torres",  level:"A1", group:"A1·6PM", status:"active",   type:"regular"},
    {id:3, name:"Ana Mejía",      level:"A1", group:"A1·8PM", status:"active",   type:"regular"},

    {id:5, name:"Pedro Jiménez",  level:"A2", group:"A2·7PM", status:"active",   type:"scholarship"},

  ]);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [selStudent, setSelStudent] = useState(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [teamsModal, setTeamsModal] = useState(null);
  const [teamsLink, setTeamsLink] = useState("");

  const displayStudents = realStudents;
  const filtered = useMemo(() => displayStudents.filter(s => {
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.email||"").toLowerCase().includes(search.toLowerCase());
    const mst = filterState === "all" || s.state === filterState;
    const ml = filterLevel === "all" || s.level === filterLevel;
    return ms && mst && ml;
  }), [search, filterState, filterLevel, displayStudents]);

  const suspended = displayStudents.filter(s => s.state === "suspended");
  const active    = displayStudents.filter(s => s.state === "active");
  const displayGroups = realGroups;

  return (
    <div style={{ display:"flex", minHeight: "100vh", height: "100vh", background:B.bg,  overflow:"hidden",  fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <SuperAdminBar />

      {/* ── SIDEBAR ── */}
      <aside style={{ width:isMobile?260:200, background:B.primary, display:"flex", flexDirection:"column", padding:"0 0 16px", flexShrink:0, position:isMobile?"fixed":"relative", top:0, left:0, bottom:0, zIndex:isMobile?9990:1, transform:isMobile?(sideOpen?"translateX(0)":"translateX(-100%)"):"none", transition:"transform .25s ease", overflowY:"auto", maxWidth:isMobile?"80vw":"none", minHeight:isMobile?"100vh":"auto" }}>
        <div style={{ padding:"20px 18px 18px", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:10 }}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
              <svg viewBox="0 0 32 32" style={{width:34,height:34,flexShrink:0}}><rect width="32" height="32" rx="8" fill="#ffbb23"/><text x="16" y="23" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="#155266" textAnchor="middle">W</text></svg>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>WCA <span style={{color:"#ffbb23"}}>Hub</span></div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>Administración</div>
              </div>
            </div>
        </div>

        {NAV.map(item => (
          <button key={item.id} onClick={() => { setView(item.id); setSelStudent(null); }} style={{
            display:"flex", alignItems:"center", gap:10, padding:"11px 20px",
            border:"none", background: view===item.id ? "rgba(255,255,255,.12)" : "transparent",
            color: view===item.id ? "var(--bg-surface)" : "rgba(255,255,255,.5)",
            fontSize:13, cursor:"pointer", textAlign:"left",
            borderLeft:`2px solid ${view===item.id ? B.secondary : "transparent"}`,
            transition:"all .15s", fontFamily:"inherit", fontWeight: view===item.id ? 600 : 400,
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize:16, width:18, textAlign:"center" }} aria-hidden="true" />
            {item.label}
            {item.id==="payments" && PAYMENTS_PENDING.length > 0 && (
              <span style={{ marginLeft:"auto", fontSize:11, background:B.secondary, color:B.primary, borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{PAYMENTS_PENDING.length}</span>
            )}
          </button>
        ))}

        <div style={{ marginTop:"auto", padding:"14px 18px 0", borderTop:"1px solid rgba(255,255,255,.1)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:B.secondary }}>AD</div>
            <div>
              <div style={{ fontSize:13, color:"var(--bg-surface)", fontWeight:600 }}>Admin WCA</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>Administrador</div>
            </div>
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
      {isMobile && sideOpen && <div onClick={()=>setSideOpen(false)} style={{position:"fixed",inset:0,zIndex:9989,background:"rgba(0,0,0,.4)"}}/>}


      {/* ── MAIN ── */}
      <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Topbar */}
        <div style={{ height:54, background:B.white, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:B.text }}>
            {({ home:"Resumen general", students:"Estudiantes", groups:"Grupos y horarios", enrollments:"Nueva matrícula", payments:"Pagos operativos", cycle:"Estado del ciclo", reports:"Reportes", b2b:"Empresas B2B", precios:"Precios" })[view]}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {suspended.length > 0 && <div style={{ fontSize:12, background:B.redDim, color:B.red, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>⚠ {suspended.length} suspendidos</div>}
            <div style={{ fontSize:12, background:B.primaryDim, color:B.primary, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>{active.length} activos hoy</div>
            {view === "students" && <>
              <button onClick={() => exportCSV(filtered.map(s=>({Nombre:s.name,Email:s.email,Nivel:s.level,Grupo:s.group,Programa:s.program,Estado:s.state,Inscrito:s.enrolled})), `estudiantes-${new Date().toISOString().slice(0,10)}.csv`)} style={{ padding:"6px 14px", background:B.white, color:B.primary, border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
                <i className="ti ti-download" style={{ fontSize:14 }} aria-hidden="true" /> CSV
              </button>
              <button onClick={() => setEnrollModal(true)} style={{ padding:"6px 14px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
                <i className="ti ti-user-plus" style={{ fontSize:14 }} aria-hidden="true" /> Nuevo estudiante
              </button>
            </>}
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:20 }}>

          {/* ── HOME ── */}
          {loadingData && <LoadingBar label="Cargando estudiantes y grupos…" />}
          {view === "home" && (
            <div>
              {/* Alerts */}
              {[...(suspended.length>0?[{type:"red",icon:"ti-alert-circle",text:`${suspended.length} estudiante${suspended.length>1?"s":""} con cuenta suspendida`,action:"Ver estudiantes"}]:[]),...(displayGroups.filter(g=>!g.teamsSet).length>0?[{type:"amber",icon:"ti-user-exclamation",text:`${displayGroups.filter(g=>!g.teamsSet).length} grupo(s) sin link de Teams`,action:"Configurar"}]:[])].map((a, i) => (
                <div key={i} style={{ background: a.type==="red"?B.redDim:a.type==="amber"?B.amberDim:B.primaryDim, border:`1px solid ${a.type==="red"?B.red:a.type==="amber"?B.amber:B.border}`, borderRadius:10, padding:"9px 14px", marginBottom:7, display:"flex", alignItems:"center", gap:10 }}>
                  <i className={`ti ${a.icon}`} style={{ fontSize:16, color:a.type==="red"?B.red:a.type==="amber"?"#92400e":B.primary, flexShrink:0 }} aria-hidden="true" />
                  <div style={{ flex:1, fontSize:13, color:B.text }}>{a.text}</div>
                  {a.action && <button onClick={() => setView(a.action==="Ver estudiantes"?"students":a.action==="Ver pagos"?"payments":"groups")} style={{ fontSize:12, padding:"4px 10px", background:B.white, border:`1px solid ${B.border}`, borderRadius:6, cursor:"pointer", color:B.primary, fontWeight:600, fontFamily:"inherit", whiteSpace:"nowrap" }}>{a.action} →</button>}
                </div>
              ))}

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:10, margin:"16px 0" }}>
                <Stat label="Estudiantes activos" value={active.length} sub="Este mes" color={B.primary} icon="ti-users" />
                <Stat label="Ingresos confirmados" value={`$${(confirmed || []).reduce((s,p) => s + (p.amount||0), 0).toLocaleString()}`} sub="Pagos confirmados" color={B.secondary} icon="ti-coin" />
                <Stat label="Pagos pendientes" value={PAYMENTS_PENDING.length} sub="Por confirmar" color={B.amber} icon="ti-clock" />
                <Stat label="Grupos activos" value={displayGroups.length} sub="5 niveles" color={B.green} icon="ti-grid-dots" />
              </div>

              {/* Two columns */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

                {/* Cycle status */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:isMobile?"wrap":"nowrap", gap:isMobile?8:0 }}>
                    Estado del ciclo — esta semana
                    <button onClick={() => setView("cycle")} style={{ fontSize:11, padding:"3px 8px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>Ver todo</button>
                  </div>
                  {(realCycleStatus.length > 0 ? realCycleStatus : []).map(c => (
                    <div key={c.level} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderTop:`1px solid ${B.borderLight}` }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:B.primary, flexShrink:0 }}>{c.level}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>U{c.unit} — {c.title}</div>
                        <div style={{ fontSize:12, color:B.textSec, marginTop:1 }}>{c.students} estudiantes · {c.groups} grupos</div>
                      </div>
                      <div style={{ height:4, width:50, background:B.bg, borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(c.unit/12)*100}%`, background:B.primary, borderRadius:2 }} />
                      </div>
                      <div style={{ fontSize:12, color:B.textSec, width:22, textAlign:"right" }}>{c.unit} de 12</div>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Actividad reciente</div>
                  {(auditItems.length > 0 ? auditItems.slice(0,5) : [{action:"sin_actividad",metadata:{},id:"empty"}]).map((a, i) => {
                    const ic = {invited_staff:"ti-user-plus",enrolled_student:"ti-user-plus",payment_confirmed:"ti-credit-card",payment_recorded:"ti-credit-card",suspended_student:"ti-user-off",reactivated_student:"ti-refresh",onboarding_completed:"ti-check"}[a.action]||"ti-activity";
                    const cl = {invited_staff:B.green,enrolled_student:B.green,payment_confirmed:B.primary,payment_recorded:B.primary,suspended_student:B.red,reactivated_student:B.amber}[a.action]||B.textSec;
                    const tx = a.action==="sin_actividad" ? "Sin actividad reciente" : `${a.action.replace(/_/g," ")}${a.metadata?.email ? " — "+a.metadata.email : a.metadata?.fullName ? " — "+a.metadata.fullName : ""}`;
                    const ago = a.created_at ? (()=>{const m=Math.floor((Date.now()-new Date(a.created_at).getTime())/60000);return m<60?`Hace ${m}min`:m<1440?`Hace ${Math.floor(m/60)}h`:`Hace ${Math.floor(m/1440)}d`;})() : "";
                    return (
                    <div key={a.id||i} style={{ display:"flex", gap:10, padding:"7px 0", borderTop: i>0?`1px solid ${B.borderLight}`:"none" }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <i className={`ti ${ic}`} style={{ fontSize:15, color:cl }} aria-hidden="true" />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:B.text }}>{tx}</div>
                        <div style={{ fontSize:12, color:B.textSec, marginTop:1 }}>{ago}</div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* Pending transfers */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                    Transferencias pendientes
                    <Badge text={`${PAYMENTS_PENDING.length} pendientes`} bg={B.amberDim} color="#92400e" />
                  </div>
                  {PAYMENTS_PENDING.map(p => (
                    <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", background:B.amberDim, borderRadius:8, marginBottom:7, border:`1px solid ${B.amber}40` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{p.student}</div>
                        <div style={{ fontSize:12, color:B.textSec, marginTop:1 }}>{p.amount} · Código: {p.code} · {p.date}</div>
                      </div>
                      <button onClick={() => setView("payments")} style={{ fontSize:12, padding:"4px 10px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Confirmar</button>
                    </div>
                  ))}
                </div>

                {/* Suspended students */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                    Estudiantes suspendidos
                    <Badge text={`${suspended.length} suspendidos`} bg={B.redDim} color={B.red} />
                  </div>
                  {suspended.map(s => (
                    <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", background:B.redDim, borderRadius:8, marginBottom:7, border:`1px solid ${B.red}40` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{s.name}</div>
                        <div style={{ fontSize:12, color:B.textSec, marginTop:1 }}>{s.level} · {s.attendance}% asistencia</div>
                      </div>
                      <button onClick={() => { setView("students"); setSelStudent(s); }} style={{ fontSize:12, padding:"4px 10px", background:B.white, color:B.red, border:`1px solid ${B.red}`, borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Ver</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STUDENTS ── */}
          {view === "students" && (
            <div style={{ display:"flex", gap:14, height:"100%" }}>
              <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                {/* Filters */}
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:B.white, border:`1px solid ${B.border}`, borderRadius:9, padding:"7px 12px" }}>
                    <i className="ti ti-search" style={{ color:B.textSec, fontSize:15 }} aria-hidden="true" />
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o email..." style={{ border:"none", outline:"none", fontSize:13, background:"transparent", color:B.text, flex:1, fontFamily:"inherit" }} />
                  </div>
                  <select value={filterState} onChange={e=>setFilterState(e.target.value)} style={{ padding:"7px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.white, color:B.text, fontFamily:"inherit" }}>
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="suspended">Suspendidos</option>
                  </select>
                  <select value={filterLevel} onChange={e=>setFilterLevel(e.target.value)} style={{ padding:"7px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.white, color:B.text, fontFamily:"inherit" }}>
                    <option value="all">Todos los niveles</option>
                    {["A1","A2","B1","B2","C1"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* Table */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden", flex:1, overflowY:"auto" }}>
                  <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}><table style={{ width:"100%", borderCollapse:"collapse", fontSize:isMobile?12:13 }}>
                    <thead style={{ position:"sticky", top:0, zIndex:1 }}>
                      <tr style={{ background:B.bg, borderBottom:`1px solid ${B.border}` }}>
                        {["Estudiante","País","Nivel · Grupo","Programa","Tipo","Pago","Estado","Asist.",""].map(h => (
                          <th key={h} style={{ padding:"9px 10px", textAlign:"left", fontSize:11, fontWeight:600, color:B.textSec, letterSpacing:.5, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s, i) => {
                        const [stateBg, stateCol] = stateColor(s.state);
                        const [typeBg, typeCol] = typeColor(s.type);
                        return (
                          <tr key={s.id} onClick={() => setSelStudent(selStudent?.id===s.id?null:s)} style={{ borderTop:`1px solid ${B.borderLight}`, cursor:"pointer", background: selStudent?.id===s.id ? B.primaryDim : "transparent", transition:"background .1s" }}>
                            <td style={{ padding:"10px 10px" }}>
                              <div style={{ fontWeight:600, color:B.text }}>{s.name}</div>
                              <div style={{ fontSize:11, color:B.textSec, marginTop:1 }}>{s.email}</div>
                            </td>
                            <td style={{ padding:"10px 10px", fontSize:14 }}>{s.country}</td>
                            <td style={{ padding:"10px 10px" }}>
                              <div style={{ fontWeight:500, color:B.text }}>{s.level}</div>
                              <div style={{ fontSize:11, color:B.textSec }}>{s.group}</div>
                            </td>
                            <td style={{ padding:"10px 10px", color:B.textSec }}>{s.program}</td>
                            <td style={{ padding:"10px 10px" }}><Badge text={s.type==="scholarship"?"Beca":s.type==="b2b"?"B2B":"Regular"} bg={typeBg} color={typeCol} /></td>
                            <td style={{ padding:"10px 10px" }}><span style={{ fontSize:12, fontWeight:600, color: s.payment==="Al día"?B.green:s.payment==="Vencido"?B.red:B.textSec }}>{s.payment}</span></td>
                            <td style={{ padding:"10px 10px" }}><Badge text={s.state==="active"?"Activo":"Suspendido"} bg={stateBg} color={stateCol} /></td>
                            <td style={{ padding:"10px 10px" }}><span style={{ color: s.attendance>=80?B.green:s.attendance>=60?B.amber:B.red, fontWeight:600 }}>{s.attendance}%</span></td>
                            <td style={{ padding:"10px 10px" }}>
                              <button onClick={e=>{e.stopPropagation();setSelStudent(s);}} style={{ fontSize:11, padding:"3px 8px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Ver →</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table></div>
                </div>
              </div>

              {/* Student detail panel */}
              {selStudent && (
                <div style={{ width:isMobile?"100%":280, background:B.white, position:isMobile?"fixed":"relative", top:isMobile?0:"auto", left:isMobile?0:"auto", right:isMobile?0:"auto", bottom:isMobile?0:"auto", zIndex:isMobile?9990:1, overflowY:isMobile?"auto":"visible", border:`1px solid ${B.border}`, borderRadius:12, padding:16, flexShrink:0, overflow:"auto" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:B.text }}>{selStudent.name}</div>
                    <button onClick={() => setSelStudent(null)} style={{ background:"none", border:"none", cursor:"pointer", color:B.textSec, fontSize:16 }}>✕</button>
                  </div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
                    <Badge text={selStudent.level} bg={B.primaryDim} color={B.primary} />
                    <Badge text={selStudent.state==="active"?"Activo":"Suspendido"} bg={stateColor(selStudent.state)[0]} color={stateColor(selStudent.state)[1]} />
                    <Badge text={selStudent.type} bg={typeColor(selStudent.type)[0]} color={typeColor(selStudent.type)[1]} />
                  </div>
                  {[
                    ["Email", selStudent.email],
                    ["País", selStudent.country],
                    ["Grupo", selStudent.group],
                    ["Programa", selStudent.program],
                    ["Pago", selStudent.payment],
                    ["Inscrito", selStudent.enrolled],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"6px 0", borderBottom:`1px solid ${B.borderLight}` }}>
                      <span style={{ color:B.textSec }}>{k}</span>
                      <span style={{ color:B.text, fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:12, color:B.textSec, marginBottom:4 }}>Rendimiento</div>
                    <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                      <div style={{ flex:1, textAlign:"center", background:B.bg, borderRadius:8, padding:"8px 6px" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:scoreCol(selStudent.score) }}>{selStudent.score}%</div>
                        <div style={{ fontSize:11, color:B.textSec }}>Promedio</div>
                      </div>
                      <div style={{ flex:1, textAlign:"center", background:B.bg, borderRadius:8, padding:"8px 6px" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:selStudent.attendance>=80?B.green:B.amber }}>{selStudent.attendance}%</div>
                        <div style={{ fontSize:11, color:B.textSec }}>Asistencia</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:12 }}>
                    {selStudent.state === "suspended" && (
                      <button onClick={()=>setActionModal({type:"reactivate",student:selStudent})} style={{ padding:"8px", background:B.green, color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✓ Reactivar cuenta</button>
                    )}
                    <button onClick={()=>setActionModal({type:"changeGroup",student:selStudent})} style={{ padding:"8px", background:B.primaryDim, color:B.primary, border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cambiar grupo · horario</button>
                    {selStudent.type === "scholarship" && (
                      <button onClick={()=>setActionModal({type:"upgrade",student:selStudent})} style={{ padding:"8px", background:B.secondaryDim, color:"#92400e", border:`1px solid ${B.amber}40`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Upgrade a plan completo</button>
                    )}
                    <button onClick={()=>setActionModal({type:"suspend",student:selStudent})} style={{ padding:"8px", background:B.redDim, color:B.red, border:`1px solid ${B.red}40`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Suspender cuenta</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GROUPS ── */}
          {view === "groups" && (
            <div>
              {displayGroups.filter(g=>!g.teamsSet).length > 0 && (
                <div style={{ background:B.redDim, border:`1px solid ${B.red}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
                  <i className="ti ti-alert-circle" style={{ color:B.red, fontSize:16, flexShrink:0 }} aria-hidden="true" />
                  <div style={{ flex:1, fontSize:13, color:B.text }}>
                    <strong>{displayGroups.filter(g=>!g.teamsSet).length} grupo(s)</strong> sin link de Teams configurado. Los estudiantes no pueden unirse a clase.
                  </div>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)", gap:10 }}>
                {displayGroups.map(g => (
                  <div key={g.id} style={{ background:B.white, border:`1px solid ${g.teamsSet?B.border:B.red}`, borderRadius:12, padding:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:800, color:B.primary }}>{g.level}</div>
                        <div style={{ fontSize:13, fontWeight:500, color:B.text }}>{g.time}</div>
                        <div style={{ fontSize:12, color:B.textSec }}>{g.days} · {g.teacher}</div>
                      </div>
                      <Badge text={g.teamsSet?"Teams ✓":"Sin link"} bg={g.teamsSet?B.greenDim:B.redDim} color={g.teamsSet?"#065f46":B.red} />
                    </div>
                    <div style={{ height:4, background:B.bg, borderRadius:2, overflow:"hidden", marginBottom:6 }}>
                      <div style={{ height:"100%", width:`${(g.students/g.capacity)*100}%`, background:g.students/g.capacity>0.9?B.red:g.students/g.capacity>0.7?B.amber:B.green, borderRadius:2 }} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:B.textSec, marginBottom:10 }}>
                      <span>{g.students} {"/"} {g.capacity} cupos</span>
                      <span>U{g.unit} activa</span>
                    </div>
                    {!g.teamsSet && (
                      <button onClick={() => setTeamsModal(g)} style={{ width:"100%", padding:"7px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Configurar link Teams</button>
                    )}
                    {g.teamsSet && (
                      <button style={{ width:"100%", padding:"7px", background:B.primaryDim, color:B.primary, border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Ver estudiantes del grupo</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {view === "payments" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)", gap:10, marginBottom:16 }}>
                <Stat label="Cobrado total" value={`$${confirmed.reduce((s,p)=>s+(p.amount||0),0).toLocaleString()}`} sub={`${confirmed.length} pagos`} color={B.green} icon="ti-trending-up" />
                <Stat label="Transferencias pendientes" value={PAYMENTS_PENDING.length} sub="Requieren confirmación" color={B.amber} icon="ti-clock" />
                <Stat label="Vencidos +30 días" value="2" sub="Acción urgente" color={B.red} icon="ti-alert-circle" />
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Transferencias por confirmar</div>
                {PAYMENTS_PENDING.map(p => (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 12px", background:B.amberDim, borderRadius:10, marginBottom:8, border:`1px solid ${B.amber}40` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{p.student}</div>
                      <div style={{ fontSize:12, color:B.textSec, marginTop:2 }}>Código: <strong>{p.code}</strong> · {p.amount} · {p.date}</div>
                    </div>
                    <button style={{ fontSize:12, padding:"5px 12px", background:B.white, color:B.primary, border:`1px solid ${B.border}`, borderRadius:6, cursor:"pointer", fontWeight:500, fontFamily:"inherit" }}>Ver comprobante</button>
                    <button style={{ fontSize:12, padding:"5px 12px", background:B.green, color:"var(--bg-surface)", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>✓ Confirmar</button>
                  </div>
                ))}
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Historial reciente</div>
                {STUDENTS.slice(0,6).map((s,i) => (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderTop:i>0?`1px solid ${B.borderLight}`:"none" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:B.text }}>{s.name}</div>
                      <div style={{ fontSize:12, color:B.textSec }}>{s.program} · Mensual</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:B.text }}>$95</div>
                    <Badge text={s.payment==="Al día"?"Pagado":s.payment} bg={s.payment==="Al día"?B.greenDim:B.redDim} color={s.payment==="Al día"?"#065f46":B.red} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CYCLE ── */}


          {/* ── REPORTS ── */}


          {/* ── B2B ── */}
          {view === "b2b" && (
            <B2BSection supabase={supabase} B={B} Badge={Badge} Stat={Stat} />
          )}

          {/* ── ENROLLMENTS ── */}



          {/* ── PRECIOS DE ESPECIALIZACIONES ── */}
          {view==="precios" && (
            <div>
              <div style={{ background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:"var(--text-secondary)", display:"flex", gap:8 }}>
                <i className="ti ti-info-circle" style={{ fontSize:14, flexShrink:0 }} aria-hidden="true"/>
                Podés editar los precios de los programas. Los cambios aplican a nuevas inscripciones. Estudiantes activos conservan su precio actual.
              </div>
              <AdminPrices />
            </div>
          )}

        </div>
      </main>

      {/* Action toast */}
      {actionDone && (
        <div style={{ position:"fixed", top:20, right:90, background:"#059669", color:"#fff", padding:"11px 18px", borderRadius:11, fontSize:13, fontWeight:600, zIndex:9999, boxShadow:"0 6px 20px rgba(5,150,105,.3)", display:"flex", gap:8, animation:"slideIn .3s ease" }}>
          <i className="ti ti-check" style={{ fontSize:15 }} aria-hidden="true"/>
          {actionDone}
        </div>
      )}

      {/* Action modal */}
      {actionModal && (
        <div role="dialog" aria-modal="true" style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) setActionModal(null); }}>
          <div style={{ background:"var(--bg-surface)", borderRadius:18, padding:26, animation:"popIn .22s cubic-bezier(.34,1.56,.64,1) both", width:420, border:"1px solid var(--border)", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>
              {({"reactivate":"Reactivar cuenta","suspend":"Suspender cuenta","upgrade":"Upgrade a Plan Completo","changeGroup":"Cambiar de grupo"})[actionModal.type]}
            </div>
            <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:14 }}>{actionModal.student?.name} · {actionModal.student?.level}</div>

            {actionModal.type==="suspend" && (
              <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#dc2626" }}>
                El estudiante perderá acceso inmediatamente. Su progreso se conserva.
              </div>
            )}
            {actionModal.type==="reactivate" && (
              <div style={{ background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#059669" }}>
                El estudiante recuperará acceso a su portal de inmediato.
              </div>
            )}
            {actionModal.type==="upgrade" && (
              <div style={{ background:"#fff8e6", border:"1px solid #ffbb23", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#d97706" }}>
                Se habilitarán todos los niveles hasta C1. Nueva suscripción: $95 por mes.
              </div>
            )}
            {actionModal.type==="changeGroup" && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>Nuevo grupo</label>
                <select style={{ width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", fontFamily:"inherit", color:"var(--text-primary)" }}>
                  {["A1 · 6:00 PM","A1 · 7:00 PM","A1 · 8:00 PM","A2 · 7:00 PM","B1 · 6:00 PM"].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>Nota interna (opcional)</label>
              <input value={actionNote} onChange={e=>setActionNote(e.target.value)} placeholder="Motivo o comentario..." style={{ width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit", marginBottom:16 }}/>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ setActionModal(null); setActionNote(""); }} style={{ flex:1, padding:"10px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>Cancelar</button>
              <button onClick={async()=>{
                const msgs = {reactivate:"Cuenta reactivada correctamente",suspend:"Cuenta suspendida",upgrade:"Solicitud registrada",changeGroup:"Cambio registrado"};
                try {
                  if (actionModal.student?.email) {
                    const { data: prof } = await supabase.from("profiles").select("id")
                      .eq("email", actionModal.student.email).maybeSingle();
                    if (prof) {
                      if (actionModal.type === "suspend") {
                        // Use the API endpoint which has correct logic (checks other enrollments)
                        const {data:{session:ss}} = await supabase.auth.getSession();
                        const studentRow = await supabase.from("students").select("id,enrollments(id)").eq("profile_id",prof.id).maybeSingle();
                        const enrollId = studentRow.data?.enrollments?.[0]?.id;
                        if (enrollId) {
                          await fetch("/api/enrollments/suspend", {
                            method:"PATCH",
                            headers:{"Content-Type":"application/json","Authorization":`Bearer ${ss?.access_token}`},
                            body: JSON.stringify({enrollmentId:enrollId, action:"suspend", reason:actionNote||"Suspendido por admin"})
                          });
                        }
                      } else if (actionModal.type === "reactivate") {
                        const {data:{session:sr}} = await supabase.auth.getSession();
                        const studentRow2 = await supabase.from("students").select("id,enrollments(id)").eq("profile_id",prof.id).maybeSingle();
                        const enrollId2 = studentRow2.data?.enrollments?.[0]?.id;
                        if (enrollId2) {
                          await fetch("/api/enrollments/suspend", {
                            method:"PATCH",
                            headers:{"Content-Type":"application/json","Authorization":`Bearer ${sr?.access_token}`},
                            body: JSON.stringify({enrollmentId:enrollId2, action:"reactivate"})
                          });
                        }
                      }
                      if (actionNote) {
                        const { data: st } = await supabase.from("students").select("id").eq("profile_id",prof.id).maybeSingle();
                        if (st) await supabase.from("student_notes").insert({student_id:st.id,note:actionNote,type:"general"});
                      }
                    }
                  }
                } catch(e) { console.error("Action error:", e); }
                setActionDone(msgs[actionModal.type]);
                setActionModal(null); setActionNote("");
                setTimeout(()=>setActionDone(null), 3000);
              }} style={{ flex:2, padding:"10px", background:actionModal.type==="suspend"?"#dc2626":"#155266", color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Enroll modal ── */}
      {enrollModal && (
        <div role="dialog" aria-modal="true"
          onClick={e=>{ if(e.target===e.currentTarget) setEnrollModal(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:16 }}>
          <div style={{ background:"var(--bg-surface)", borderRadius:18, padding:26, width:440, border:"1px solid var(--border)", boxShadow:"0 20px 60px rgba(0,0,0,.2)", animation:"popIn .22s cubic-bezier(.34,1.56,.64,1) both" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:isMobile?"wrap":"nowrap", gap:isMobile?8:0, marginBottom:18 }}>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>Nuevo estudiante</div>
              <button onClick={()=>setEnrollModal(false)} aria-label="Cerrar" style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-secondary)", fontSize:18 }}>✕</button>
            </div>
            <div id="enroll-modal-form">{[
              {label:"Nombre completo", ph:"María Rodríguez", type:"text"},
              {label:"Email", ph:"m.rodriguez@correo.com", type:"email"},
              {label:"Teléfono / WhatsApp", ph:"+504 XXXX-XXXX", type:"tel"},
            ].map(f => (
              <div key={f.label} style={{ marginBottom:11 }}>
                <label style={{ fontSize:12, color:"var(--text-secondary)", display:"block", marginBottom:3 }}>{f.label}</label>
                <input type={f.type} aria-label={f.label} placeholder={f.ph} style={{ width:"100%", padding:"8px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, color:"var(--text-primary)", background:"var(--bg-surface-subtle)", fontFamily:"inherit" }} />
              </div>
            ))}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:12, color:"var(--text-secondary)", display:"block", marginBottom:3 }}>Programa</label>
                <select aria-label="Programa" style={{ width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, background:"var(--bg-surface-subtle)", fontFamily:"inherit" }}>
                  <option>Inglés</option><option>VA</option><option>Inglés + VA</option><option>Beca</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:"var(--text-secondary)", display:"block", marginBottom:3 }}>Nivel</label>
                <select aria-label="Nivel" style={{ width:"100%", padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, background:"var(--bg-surface-subtle)", fontFamily:"inherit" }}>
                  {["A1","A2","B1","B2","C1"].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div></div>
            <div style={{ display:"flex", gap:8 }}>

            </div>
          </div>
        </div>
      )}

      {/* ── Teams link modal ── */}
      {teamsModal && (
        <div role="dialog" aria-modal="true"
          onClick={e=>{ if(e.target===e.currentTarget) setTeamsModal(null); }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:16 }}>
          <div style={{ background:"var(--bg-surface)", borderRadius:18, padding:24, width:400, border:"1px solid var(--border)", boxShadow:"0 20px 60px rgba(0,0,0,.2)", animation:"popIn .22s cubic-bezier(.34,1.56,.64,1) both" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:isMobile?"wrap":"nowrap", gap:isMobile?8:0, marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>Configurar link de Teams</div>
                {teamsModal && <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>{teamsModal.level} · {teamsModal.time} · {teamsModal.teacher}</div>}
              </div>
              <button onClick={()=>setTeamsModal(null)} aria-label="Cerrar" style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-secondary)", fontSize:18 }}>✕</button>
            </div>
            <label style={{ fontSize:12, color:"var(--text-secondary)", display:"block", marginBottom:4 }}>Link de Microsoft Teams</label>
            <input aria-label="Link de Teams" value={teamsLink} onChange={e=>setTeamsLink(e.target.value)}
              placeholder="https://teams.microsoft.com/l/meetup-join/..."
              style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit", marginBottom:14 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ setTeamsModal(null); setTeamsLink(""); }} style={{ flex:1, padding:"10px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
              <button onClick={async()=>{
  if(teamsModal?.dbId && teamsLink) {
    await supabase.from("groups").update({teams_link:teamsLink}).eq("id",teamsModal.dbId);
    setRealGroups(gs => gs.map(g => g.id===teamsModal.dbId ? {...g,teamsSet:true,teamsLink} : g));
  }
  setTeamsModal(null); setTeamsLink(""); setActionDone("✓ Link de Teams guardado"); setTimeout(()=>setActionDone(null),3000);
}} style={{ flex:2, padding:"10px", background:B.primary, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Guardar link</button>
            </div>
          </div>
        </div>
      )}

      {isMobile && <button onClick={()=>setSideOpen(o=>!o)} style={{position:"fixed",bottom:20,right:20,zIndex:9988,width:50,height:50,borderRadius:"50%",background:B.primary,color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.25)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{sideOpen?"\u2715":"\u2630"}</button>}
    </div>
  );
}