// ─── ReportesSection — Reportes completos por departamento ───────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { exportCSV } from "../lib/exportCSV.js";
import { generateFinancialReport, generateAcademicReport, generateEnrollmentReport, generateLeadsReport } from "../lib/reportPDF.js";
import { BISection } from "./BISection.jsx";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",A="#d97706";

const DEPTS = [
  { id:"metricas",    label:"📊 BI & KPIs",           desc:"Dashboard de métricas generales" },
  { id:"finanzas",    label:"💰 Finanzas",             desc:"Ingresos, pagos, MRR, vencidos" },
  { id:"academia",    label:"🎓 Academia",             desc:"Progreso, exámenes, asistencia" },
  { id:"ventas",      label:"💼 Ventas & CRM",         desc:"Leads, conversión, fuentes" },
  { id:"rrhh",        label:"👥 RRHH & Personal",      desc:"Staff, docentes, roles" },
  { id:"lms",         label:"🧠 LMS & Contenido",      desc:"Progreso por actividad y XP" },
];

// ── Shared components ────────────────────────────────────────────
function Kpi({label,value,sub,color="#155266"}){
  return(
    <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:"14px 16px"}}>
      <div style={{fontSize:22,fontWeight:800,color,lineHeight:1,marginBottom:3}}>{value}</div>
      <div style={{fontSize:12,fontWeight:600,color:"var(--text-primary)"}}>{label}</div>
      {sub&&<div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>{sub}</div>}
    </div>
  );
}
function SectionTitle({children}){
  return <div style={{fontSize:12,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:.6,marginBottom:10,marginTop:18}}>{children}</div>;
}
function TableWrap({headers,rows,empty="Sin datos"}){
  if(!rows?.length) return <div style={{padding:"20px",textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>{empty}</div>;
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{background:"var(--bg-surface-subtle)"}}>
          {headers.map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-surface-subtle)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}
              style={{borderTop:"1px solid var(--border-tertiary)",transition:"background .1s"}}>
              {row.map((cell,j)=><td key={j} style={{padding:"8px 12px",color:"var(--text-primary)"}}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ReportCard({label,value,color,bg}){
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:10,background:bg,color,fontSize:12,fontWeight:600,margin:"0 5px 5px 0"}}>{label}: <strong>{value}</strong></span>;
}


// ── Mini SVG Bar Chart ────────────────────────────────────────────
function MiniBarChart({ data, color = "var(--wca-primary)", height = 80 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.v), 1);
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width:"100%", height, display:"block" }}>
        {data.map((d, i) => {
          const barH = (d.v / max) * (height - 20);
          const x = i * w + 1;
          return (
            <g key={i}>
              <rect x={x} y={height - barH - 16} width={w - 2} height={barH}
                fill={color} rx="2" opacity=".85"/>
              <text x={x + (w-2)/2} y={height - 2} textAnchor="middle"
                fontSize="7" fill="var(--text-tertiary)">{d.l}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Mini Donut Chart ─────────────────────────────────────────────
function MiniDonut({ segments, size = 80 }) {
  const R = 28, cx = 40, cy = 40, stroke = 10;
  const circumference = 2 * Math.PI * R;
  const total = segments.reduce((a, s) => a + s.v, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
      {segments.map((s, i) => {
        const dash = (s.v / total) * circumference;
        const gap  = circumference - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"/>
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// ── Shared ReportHeader (error + refresh + timestamp) ────────────
function ReportHeader({ onRefresh, refreshedAt, exportBtn }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      {refreshedAt && (
        <span style={{fontSize:11,color:"var(--text-tertiary)",marginRight:"auto"}}>
          Actualizado: {refreshedAt.toLocaleTimeString("es-HN",{hour:"2-digit",minute:"2-digit"})}
        </span>
      )}
      {!refreshedAt && <span style={{flex:1}}/>}
      <button onClick={onRefresh}
        style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",
          background:"var(--bg-surface)",border:"1px solid var(--border)",
          borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",
          color:"var(--text-secondary)"}}>
        <i className="ti ti-refresh" style={{fontSize:13}} aria-hidden="true"/> Actualizar
      </button>
      {exportBtn}
    </div>
  );
}
function ErrorCard({ msg, onRetry }) {
  return (
    <div style={{padding:"24px",textAlign:"center",background:"#fef2f2",
      border:"1px solid #fecaca",borderRadius:12,marginBottom:12}}>
      <i className="ti ti-alert-circle" style={{fontSize:24,color:"#dc2626",display:"block",marginBottom:8}} aria-hidden="true"/>
      <div style={{fontSize:13,fontWeight:600,color:"#dc2626",marginBottom:4}}>Error al cargar datos</div>
      <div style={{fontSize:12,color:"#991b1b",marginBottom:12}}>{msg}</div>
      <button onClick={onRetry}
        style={{padding:"7px 16px",background:"#dc2626",color:"#fff",border:"none",
          borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
        Reintentar
      </button>
    </div>
  );
}

// ── Finanzas Report ──────────────────────────────────────────────
function FinanzasReport(){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [refreshedAt,setRefreshedAt]=useState(null);
  useEffect(()=>{load();},[]);
  async function load(){
    setLoading(true);
    const now=new Date();
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
    const lastMonthStart=new Date(now.getFullYear(),now.getMonth()-1,1).toISOString();
    const lastMonthEnd=new Date(now.getFullYear(),now.getMonth(),0).toISOString();

    try{
    const [paysRes,enrollRes,pendingRes,overRes]=await Promise.all([
      supabase.from("payments").select("amount,program_id,method,status,confirmed_at,created_at,student:students(profile:profiles(full_name,email))")
        .eq("status","confirmed").gte("confirmed_at",monthStart).order("confirmed_at",{ascending:false}),
      supabase.from("enrollments").select("id,status,price_locked,program_id,next_payment_date").eq("status","active"),
      supabase.from("payments").select("id,amount,student:students(profile:profiles(full_name))").eq("status","pending"),
      supabase.from("enrollments").select("id,next_payment_date,price_locked,student:students(profile:profiles(full_name,email))").eq("status","active")
        .lt("next_payment_date",new Date().toISOString().slice(0,10)),
    ]);
    const pays=paysRes.data||[];
    const enrolls=enrollRes.data||[];
    const pending=pendingRes.data||[];
    const overdue=overRes.data||[];

    const mrr=enrolls.reduce((a,e)=>a+(e.price_locked||0),0);
    const collected=pays.reduce((a,p)=>a+Number(p.amount||0),0);
    const byMethod=pays.reduce((a,p)=>{a[p.method||"otro"]=(a[p.method||"otro"]||0)+Number(p.amount);return a;},{});
    const byProg=enrolls.reduce((a,e)=>{a[e.program_id]=(a[e.program_id]||0)+1;return a;},{});

    setData({mrr,collected,byMethod,byProg,pending,overdue,pays,enrolls});
    setRefreshedAt(new Date());
    }catch(e){setError(e.message||"Error al cargar datos");}
    setLoading(false);
  }

  if(loading) return <div style={{padding:32,textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>Cargando...</div>;
  if(error) return <ErrorCard msg={error} onRetry={load}/>;
  if(!data) return null;

  const exp=()=>exportCSV(data.pays.map(p=>({
    Estudiante:p.student?.profile?.full_name||"—",
    Email:p.student?.profile?.email||"—",
    Monto:`$${p.amount}`,
    Método:p.method||"—",
    Programa:p.program_id||"—",
    Fecha:new Date(p.confirmed_at).toLocaleDateString("es-HN"),
  })),`finanzas-${new Date().toISOString().slice(0,10)}.csv`);

  return(
    <div>
      <ReportHeader onRefresh={load} refreshedAt={refreshedAt}
        exportBtn={<div style={{display:"flex",gap:6}}>
          <button onClick={exp} style={{padding:"6px 12px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>↓ CSV</button>
          <button onClick={()=>generateFinancialReport({mrr:data.mrr,arr:data.mrr*12,collected:data.collected,pending:data.pending,overdue:data.overdue,payments:data.pays,byProg:data.byProg})} style={{padding:"6px 12px",background:P,border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"#fff",fontWeight:600}}>↓ PDF</button>
        </div>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:6}}>
        <Kpi label="MRR" value={`$${data.mrr.toLocaleString()}`} color={P} sub="Ingresos recurrentes/mes"/>
        <Kpi label="ARR" value={`$${(data.mrr*12).toLocaleString()}`} color={P} sub="Ingresos anuales proj."/>
        <Kpi label="Cobrado este mes" value={`$${data.collected.toLocaleString()}`} color={G}/>
        <Kpi label="Pendientes" value={data.pending.length} color={A} sub="Pagos sin confirmar"/>
        <Kpi label="Vencidos" value={data.overdue.length} color={data.overdue.length>0?R:G} sub="Sin pago activo"/>
      </div>
      {/* ── MRR Visual ── */}
      {data.enrolls.length > 0 && (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginBottom:8 }}>Distribución de ingresos por programa</div>
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <MiniDonut segments={Object.entries(data.byProg).map(([k,v],i)=>({
              v, color:["var(--wca-primary)","var(--green)","var(--purple)","var(--amber)"][i%4]
            }))} size={80}/>
            <div style={{ flex:1 }}>
              {Object.entries(data.byProg).map(([prog,count],i)=>(
                <div key={prog} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text-secondary)" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:["var(--wca-primary)","var(--green)","var(--purple)","var(--amber)"][i%4], flexShrink:0, display:"inline-block" }}/>
                    {prog.toUpperCase()}
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>{count} activos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SectionTitle>Cobros por método — este mes</SectionTitle>
      <div style={{marginBottom:12}}>
        {Object.entries(data.byMethod).map(([m,v])=>
          <ReportCard key={m} label={m} value={`$${v.toLocaleString()}`} color={P} bg={PD}/>)}
      </div>
      <SectionTitle>Matrículas activas por programa</SectionTitle>
      <div style={{marginBottom:12}}>
        {Object.entries(data.byProg).map(([p,v])=>
          <ReportCard key={p} label={p.toUpperCase()} value={v} color={G} bg={GD}/>)}
      </div>
      <SectionTitle>Vencidos ({data.overdue.length}) <span style={{fontSize:10,fontWeight:400,color:"var(--text-tertiary)",textTransform:"none",letterSpacing:0}}>— acumulado histórico</span></SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:12}}>
        <TableWrap
          headers={["Estudiante","Email","Vence","Precio"]}
          rows={data.overdue.map(e=>[
            e.student?.profile?.full_name||"—",
            e.student?.profile?.email||"—",
            e.next_payment_date,
            `$${e.price_locked||0}/mes`,
          ])}
          empty="✅ Sin vencidos"/>
      </div>
      <SectionTitle>Pagos pendientes ({data.pending.length}) <span style={{fontSize:10,fontWeight:400,color:"var(--text-tertiary)",textTransform:"none",letterSpacing:0}}>— sin confirmación aún</span></SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <TableWrap
          headers={["Estudiante","Monto"]}
          rows={data.pending.map(p=>[p.student?.profile?.full_name||"—",`$${p.amount}`])}
          empty="✅ Sin pendientes"/>
      </div>
    </div>
  );
}

// ── Academia Report ──────────────────────────────────────────────
function AcademiaReport(){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [refreshedAt,setRefreshedAt]=useState(null);
  useEffect(()=>{load();},[]);
  async function load(){
    setLoading(true);
    try{
    const [enrollsRes,groupsRes,attendRes]=await Promise.all([
      supabase.from("enrollments").select("id,program_id,status,current_unit,price_locked,student:students(profile:profiles(full_name,email)),group:groups(level,schedule)").order("created_at",{ascending:false}).limit(200),
      supabase.from("groups").select("id,program_id,level,schedule,days,capacity,active_unit,teacher_groups(teacher:staff(profile:profiles(full_name))),enrollments(id,status)").eq("active",true),
      supabase.from("attendance").select("status,present,enrollment_id").limit(2000),
    ]);
    const enrolls=enrollsRes.data||[];
    const groups=groupsRes.data||[];
    const att=attendRes.data||[];
    const attRate=att.length>0?Math.round((att.filter(a=>a.status==="present"||a.present===true).length/att.length)*100):0;
    const activeE=enrolls.filter(e=>e.status==="active");
    const byProg=activeE.reduce((a,e)=>{a[e.program_id]=(a[e.program_id]||0)+1;return a;},{});
    setData({enrolls,groups,attRate,byProg,activeCount:activeE.length});
    setRefreshedAt(new Date());
    }catch(e){setError(e.message||"Error al cargar datos");}
    setLoading(false);
  }

  if(loading) return <div style={{padding:32,textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>Cargando...</div>;
  if(error) return <ErrorCard msg={error} onRetry={load}/>;
  if(!data) return null;

  const exp=()=>exportCSV(data.enrolls.map(e=>({
    Estudiante:e.student?.profile?.full_name||"—",
    Email:e.student?.profile?.email||"—",
    Programa:e.program_id,Nivel:e.group?.level||"—",
    Unidad:e.current_unit||1,Estado:e.status,
    Horario:e.group?.schedule||"—",
  })),`academia-${new Date().toISOString().slice(0,10)}.csv`);

  return(
    <div>
      <ReportHeader onRefresh={load} refreshedAt={refreshedAt}
        exportBtn={<div style={{display:"flex",gap:6}}>
          <button onClick={{exp}} style={{padding:"6px 12px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>↓ CSV</button>
          <button onClick={()=>generateAcademicReport({students:data.enrolls.map(e=>({id:e.id,name:e.student?.profile?.full_name||"—",email:e.student?.profile?.email||"—",level:e.group?.level||e.group_level||"A1",programId:e.program_id,state:e.status,attendance:80,scholarship:false})),groups:data.groups.map(g=>({level:g.level,time:g.schedule,days:g.days,teacher:"—",students:g.enrollments?.length||0,capacity:g.capacity}))})} style={{padding:"6px 12px",background:P,border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"#fff",fontWeight:600}}>↓ PDF Académico</button>
          <button onClick={()=>generateEnrollmentReport({students:data.enrolls.map(e=>({id:e.id,name:e.student?.profile?.full_name||"—",email:e.student?.profile?.email||"—",level:e.group?.level||"A1",programId:e.program_id,state:e.status,scholarship:false})),institution:"UNAH-Cortés"})} style={{padding:"6px 12px",background:"#7c3aed",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"#fff",fontWeight:600}}>↓ Nómina UNAH</button>
        </div>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:6}}>
        <Kpi label="Matrículas activas" value={data.activeCount} color={P}/>
        <Kpi label="Grupos activos" value={data.groups.length} color={G}/>
        <Kpi label="Asistencia promedio" value={`${data.attRate}%`} color={data.attRate>=75?G:A}/>
      </div>
      <SectionTitle>Por programa</SectionTitle>
      <div style={{marginBottom:12}}>
        {Object.entries(data.byProg).map(([p,v])=>
          <ReportCard key={p} label={p.toUpperCase()} value={v} color={P} bg={PD}/>)}
      </div>
      <SectionTitle>Grupos ({data.groups.length})</SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:12}}>
        <TableWrap
          headers={["Programa","Nivel","Horario","Cupos","Docente","Unidad"]}
          rows={data.groups.map(g=>[
            g.program_id?.toUpperCase()||"—", g.level||"—", g.schedule||"—",
            `${g.enrollments?.filter(e=>e.status==="active").length||0}/${g.capacity||"∞"}`,
            g.teacher_groups?.[0]?.teacher?.profile?.full_name||"Sin docente",
            `U${g.active_unit||1}`,
          ])}/>
      </div>
      <SectionTitle>Estudiantes por unidad</SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <TableWrap
          headers={["Estudiante","Programa","Nivel","Unidad actual","Estado"]}
          rows={data.enrolls.filter(e=>e.status==="active").slice(0,50).map(e=>[
            e.student?.profile?.full_name||"—",
            e.program_id?.toUpperCase(),
            e.group?.level||"—",
            `U${e.current_unit||1}`,
            e.status,
          ])}/>
      </div>
    </div>
  );
}

// ── Ventas Report ────────────────────────────────────────────────
function VentasReport(){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [refreshedAt,setRefreshedAt]=useState(null);
  useEffect(()=>{load();},[]);
  async function load(){
    setLoading(true);
    try{
    const [leadsRes,tasksRes,b2bRes]=await Promise.all([
      supabase.from("leads").select("*").order("created_at",{ascending:false}).limit(300),
      supabase.from("crm_tasks").select("id,done,due_date,lead_id").limit(200),
      supabase.from("b2b_companies").select("*").eq("active",true),
    ]);
    const leads=leadsRes.data||[];
    const tasks=tasksRes.data||[];
    const b2b=b2bRes.data||[];
    const PROGRAMS=[{id:"en",price:95},{id:"va",price:95},{id:"va_mkt",price:110},{id:"va_legal",price:110},{id:"va_care",price:110}];
    const b2bMrr=b2b.reduce((a,c)=>{const prog=PROGRAMS.find(p=>p.id===c.program_id)||{price:95};return a+Math.round((c.seats_paid||1)*prog.price*(1-((c.discount_pct||0)/100)));},0);
    const byStage=leads.reduce((a,l)=>{a[l.stage]=(a[l.stage]||0)+1;return a;},{});
    const bySource=leads.reduce((a,l)=>{const s=l.source||"Directo";a[s]=(a[s]||0)+1;return a;},{});
    const convRate=leads.length>0?Math.round(((byStage.convertido||0)/leads.length)*100):0;
    const pendTasks=tasks.filter(t=>!t.done);
    const ovTasks=pendTasks.filter(t=>t.due_date&&new Date(t.due_date)<new Date());
    setData({leads,tasks,b2b,byStage,bySource,convRate,b2bMrr,pendTasks,ovTasks});
    setRefreshedAt(new Date());
    }catch(e){setError(e.message||"Error al cargar datos");}
    setLoading(false);
  }

  if(loading) return <div style={{padding:32,textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>Cargando...</div>;
  if(error) return <ErrorCard msg={error} onRetry={load}/>;
  if(!data) return null;
  const STAGES=["nuevo","contactado","test","propuesta","convertido","perdido"];

  const exp=()=>exportCSV(data.leads.map(l=>({
    Nombre:l.full_name,Email:l.email,Teléfono:l.phone||"—",
    Stage:l.stage,Fuente:l.source||"—",Test:l.test_score||0,
    Interés:l.level_interest||l.program_interest||"—",
    Fecha:new Date(l.created_at).toLocaleDateString("es-HN"),
  })),`ventas-${new Date().toISOString().slice(0,10)}.csv`);

  return(
    <div>
      <ReportHeader onRefresh={load} refreshedAt={refreshedAt}
        exportBtn={<div style={{display:"flex",gap:6}}>
          <button onClick={{exp}} style={{padding:"6px 12px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>↓ CSV</button>
          <button onClick={()=>generateLeadsReport({leads:data.leads})} style={{padding:"6px 12px",background:"#d97706",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"#fff",fontWeight:600}}>↓ PDF Ventas</button>
        </div>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:6}}>
        <Kpi label="Total leads" value={data.leads.length} color={P}/>
        <Kpi label="Convertidos" value={data.byStage.convertido||0} color={G}/>
        <Kpi label="Tasa conversión" value={`${data.convRate}%`} color={data.convRate>=20?G:A}/>
        <Kpi label="Empresas B2B" value={data.b2b.length} color={P}/>
        <Kpi label="MRR B2B" value={`$${data.b2bMrr}`} color={G}/>
        <Kpi label="Tareas vencidas" value={data.ovTasks.length} color={data.ovTasks.length>0?R:G}/>
      </div>
      <SectionTitle>Funnel de conversión</SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:12,marginBottom:12}}>
        {STAGES.map(sid=>{
          const count=data.byStage[sid]||0;
          const pct=data.leads.length>0?Math.round((count/data.leads.length)*100):0;
          return(
            <div key={sid} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
              <div style={{width:80,fontSize:11,fontWeight:600,color:"var(--text-secondary)",textTransform:"capitalize"}}>{sid}</div>
              <div style={{flex:1,height:7,background:"var(--bg-surface-subtle)",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:P,borderRadius:4}}/>
              </div>
              <div style={{width:30,textAlign:"right",fontSize:12,fontWeight:700,color:"var(--text-primary)"}}>{count}</div>
            </div>
          );
        })}
      </div>
      <SectionTitle>Fuentes de leads</SectionTitle>
      <div style={{marginBottom:12}}>
        {Object.entries(data.bySource).sort((a,b)=>b[1]-a[1]).map(([src,n])=>
          <ReportCard key={src} label={src} value={n} color={P} bg={PD}/>)}
      </div>
      <SectionTitle>Empresas B2B ({data.b2b.length})</SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <TableWrap
          headers={["Empresa","Programa","Cupos","Descuento","Factura/mes"]}
          rows={data.b2b.map(b=>{
            const PROGRAMS=[{id:"en",price:95},{id:"va",price:95},{id:"va_mkt",price:110}];
            const prog=PROGRAMS.find(p=>p.id===b.program_id)||{price:95};
            const mo=Math.round((b.seats_paid||1)*prog.price*(1-((b.discount_pct||0)/100)));
            return[b.name,b.program_name||b.program_id,b.seats_paid,`${b.discount_pct||0}%`,`$${mo}`];
          })}/>
      </div>
    </div>
  );
}

// ── RRHH Report ──────────────────────────────────────────────────
function RRHHReport(){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [refreshedAt,setRefreshedAt]=useState(null);
  useEffect(()=>{load();},[]);
  async function load(){
    setLoading(true);
    try{
    const [staffRes,profilesRes]=await Promise.all([
      supabase.from("staff").select("id,position,department,profile:profiles(full_name,email,role,active,created_at)").limit(100),
      supabase.from("profiles").select("id,full_name,email,role,active,created_at").order("created_at",{ascending:false}).limit(1000),
    ]);
    const staff=staffRes.data||[];
    const profiles=profilesRes.data||[];
    const byRole=profiles.reduce((a,p)=>{a[p.role]=(a[p.role]||0)+1;return a;},{});
    const active=profiles.filter(p=>p.active!==false).length;
    setData({staff,profiles,byRole,active,total:profiles.length});
    setRefreshedAt(new Date());
    }catch(e){setError(e.message||"Error al cargar datos");}
    setLoading(false);
  }
  if(loading) return <div style={{padding:32,textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>Cargando...</div>;
  if(error) return <ErrorCard msg={error} onRetry={load}/>;
  if(!data) return null;
  const exp=()=>exportCSV(data.profiles.map(p=>({
    Nombre:p.full_name,Email:p.email,Rol:p.role,
    Activo:p.active!==false?"Sí":"No",
    Registro:new Date(p.created_at).toLocaleDateString("es-HN"),
  })),`rrhh-${new Date().toISOString().slice(0,10)}.csv`);
  return(
    <div>
      <ReportHeader onRefresh={load} refreshedAt={refreshedAt}
        exportBtn={<div style={{display:"flex",gap:6}}>
          <button onClick={{exp}} style={{padding:"6px 12px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>↓ CSV</button>
          
        </div>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:6}}>
        <Kpi label="Total usuarios" value={data.total} color={P}/>
        <Kpi label="Activos" value={data.active} color={G}/>
        <Kpi label="Personal (staff)" value={data.staff.length} color={A}/>
      </div>
      <SectionTitle>Usuarios por rol</SectionTitle>
      <div style={{marginBottom:12}}>
        {Object.entries(data.byRole).sort((a,b)=>b[1]-a[1]).map(([rol,n])=>
          <ReportCard key={rol} label={rol} value={n} color={P} bg={PD}/>)}
      </div>
      <SectionTitle>Personal registrado ({data.staff.length})</SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:12}}>
        <TableWrap
          headers={["Nombre","Email","Cargo","Departamento","Activo"]}
          rows={data.staff.map(s=>[
            s.profile?.full_name||"—",s.profile?.email||"—",
            s.position||"—",s.department||"—",
            s.profile?.active!==false?"✓":"✗",
          ])}/>
      </div>
      <SectionTitle>Todos los usuarios ({data.profiles.length})</SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <TableWrap
          headers={["Nombre","Email","Rol","Activo","Registro"]}
          rows={data.profiles.slice(0,100).map(p=>[
            p.full_name||"—",p.email||"—",p.role,
            p.active!==false?"✓":"✗",
            new Date(p.created_at).toLocaleDateString("es-HN"),
          ])}/>
      </div>
    </div>
  );
}

// ── LMS Report ───────────────────────────────────────────────────
function LMSReport(){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [refreshedAt,setRefreshedAt]=useState(null);
  useEffect(()=>{load();},[]);
  async function load(){
    setLoading(true);
    try{
    const [progRes,xpRes,unitsRes]=await Promise.all([
      supabase.from("user_activity_progress").select("profile_id,completed,score,xp_earned,activity_id").limit(2000),
      supabase.from("xp_ledger").select("profile_id,amount,source,created_at,profile:profiles(full_name)").order("created_at",{ascending:false}).limit(300),
      supabase.from("units").select("id,program_id,unit_number,title,published").eq("published",true),
    ]);
    const prog=progRes.data||[];
    const xp=xpRes.data||[];
    const units=unitsRes.data||[];
    const totalXP=xp.reduce((a,x)=>a+x.amount,0);
    const byStudentMap=xp.reduce((a,x)=>{
      if(!a[x.profile_id]) a[x.profile_id]={xp:0,name:x.profile?.full_name||null};
      a[x.profile_id].xp+=x.amount;
      return a;
    },{});
    const byStudent=Object.fromEntries(Object.entries(byStudentMap).map(([k,v])=>[k,v.xp]));
    const byStudentFull=byStudentMap;
    const topStudents=Object.entries(byStudentFull).sort((a,b)=>b[1].xp-a[1].xp).slice(0,10);
    const completedActs=prog.filter(p=>p.completed).length;
    const avgScore=prog.length>0?Math.round(prog.filter(p=>p.score>0).reduce((a,p)=>a+p.score,0)/(prog.filter(p=>p.score>0).length||1)):0;
    setData({prog,xp,units,totalXP,topStudents,completedActs,avgScore,uniqueLearners:Object.keys(byStudent).length});
    setRefreshedAt(new Date());
    }catch(e){setError(e.message||"Error al cargar datos");}
    setLoading(false);
  }
  if(loading) return <div style={{padding:32,textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>Cargando...</div>;
  if(error) return <ErrorCard msg={error} onRetry={load}/>;
  if(!data) return null;

  const expLMS=()=>exportCSV([
    ...data.topStudents.map(([pid,obj],i)=>({
      "#":i+1,
      Estudiante:obj.name||pid.slice(0,8),
      "XP Total":obj.xp,
    })),
  ],`lms-xp-${new Date().toISOString().slice(0,10)}.csv`);

  return(
    <div>
      <ReportHeader onRefresh={load} refreshedAt={refreshedAt}
        exportBtn={<button onClick={expLMS} style={{padding:"6px 12px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>↓ CSV</button>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:6}}>
        <Kpi label="XP total otorgado" value={data.totalXP.toLocaleString()} color={A}/>
        <Kpi label="Actividades completadas" value={data.completedActs} color={G}/>
        <Kpi label="Estudiantes activos LMS" value={data.uniqueLearners} color={P}/>
        <Kpi label="Score promedio" value={`${data.avgScore}%`} color={data.avgScore>=70?G:A}/>
        <Kpi label="Unidades publicadas" value={data.units.length} color={P}/>
      </div>
      <SectionTitle>Top 10 estudiantes por XP</SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:12}}>
        <TableWrap
          headers={["#","Estudiante","XP total"]}
          rows={data.topStudents.map(([pid,obj],i)=>[`${i+1}`,obj.name||pid.slice(0,8)+"...",`⚡${obj.xp.toLocaleString()} XP`])}
          empty="Sin datos de XP aún"/>
      </div>
      <SectionTitle>Unidades LMS ({data.units.length})</SectionTitle>
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        <TableWrap
          headers={["Programa","Unidad","Título"]}
          rows={data.units.slice(0,30).map(u=>[u.program_id?.toUpperCase(),`U${u.unit_number}`,u.title])}/>
      </div>
    </div>
  );
}

// ── Main ReportesSection ─────────────────────────────────────────
export function ReportesSection({ showToast, subView }) {

  // Allow subView from SuperAdmin to override
  const current = subView || "metricas";

  return(
    <div>
      {/* Renders */}
      {current==="metricas"   && <BISection showToast={showToast}/>}
      {current==="finanzas"   && <FinanzasReport/>}
      {current==="academia"   && <AcademiaReport/>}
      {current==="ventas"     && <VentasReport/>}
      {current==="rrhh"       && <RRHHReport/>}
      {current==="lms"        && <LMSReport/>}
    </div>
  );
}
