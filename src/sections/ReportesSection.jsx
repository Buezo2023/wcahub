// ─── ReportesSection — Reportes exportables + BI ────────────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { exportCSV } from "../lib/exportCSV.js";
import { BISection } from "./BISection.jsx";

const P="#155266",G="#059669",A="#d97706",R="#dc2626";

function ReportCard({icon,title,desc,color,onExport,loading}){
  return(
    <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16,display:"flex",gap:12,alignItems:"flex-start"}}>
      <div style={{width:40,height:40,borderRadius:9,background:`${color}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <i className={`ti ${icon}`} style={{fontSize:18,color}}/>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:3}}>{title}</div>
        <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:10}}>{desc}</div>
        <button onClickCapture={e=>{e.stopPropagation();onExport();}} disabled={loading}
          style={{fontSize:11,padding:"5px 12px",background:`${color}14`,color,border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
          {loading?"Generando...":"↓ Exportar CSV"}
        </button>
      </div>
    </div>
  );
}

export function ReportesSection({ showToast, subView }) {
  const [loadingReport, setLoadingReport] = useState(null);

  async function exportStudents(){
    setLoadingReport("students");
    try{
      const {data}=await supabase.from("students")
        .select("level,scholarship,created_at,profile:profiles(full_name,email,phone,active),enrollments(program_id,status,current_unit,price_locked,next_payment_date,groups(level,schedule))")
        .order("created_at",{ascending:false});
      if(!data){showToast("Sin datos",A);return;}
      const rows=data.map(s=>({
        Nombre:s.profile?.full_name||"—",
        Email:s.profile?.email||"—",
        Teléfono:s.profile?.phone||"—",
        Nivel:s.level||"—",
        Programa:s.enrollments?.[0]?.program_id||"—",
        Unidad:`U${s.enrollments?.[0]?.current_unit||1}`,
        Estado:s.enrollments?.[0]?.status||"—",
        Grupo:s.enrollments?.[0]?.groups?.schedule||"—",
        Precio:`$${s.enrollments?.[0]?.price_locked||0}`,
        "Próximo pago":s.enrollments?.[0]?.next_payment_date||"—",
        Beca:s.scholarship?"Sí":"No",
        "Perfil activo":s.profile?.active!==false?"Sí":"No",
        "Inscrito desde":new Date(s.created_at).toLocaleDateString("es-HN"),
      }));
      exportCSV(rows,`estudiantes-${new Date().toISOString().slice(0,10)}.csv`);
      showToast(`✓ ${rows.length} estudiantes exportados`);
    }catch(e){showToast("Error: "+e.message,R);}
    finally{setLoadingReport(null);}
  }

  async function exportPayments(){
    setLoadingReport("payments");
    try{
      const {data}=await supabase.from("payments")
        .select("amount,status,method,reference_code,bank,period_start,period_end,confirmed_at,created_at,student:students(profile:profiles(full_name,email)),enrollment:enrollments(program_id)")
        .order("created_at",{ascending:false}).limit(500);
      if(!data){showToast("Sin datos",A);return;}
      const rows=data.map(p=>({
        Estudiante:p.student?.profile?.full_name||"—",
        Email:p.student?.profile?.email||"—",
        Programa:p.enrollment?.program_id||"—",
        Monto:`$${p.amount}`,
        Estado:p.status,
        Método:p.method,
        Referencia:p.reference_code||"—",
        Banco:p.bank||"—",
        "Período inicio":p.period_start||"—",
        "Período fin":p.period_end||"—",
        Confirmado:p.confirmed_at?new Date(p.confirmed_at).toLocaleDateString("es-HN"):"—",
        Registrado:new Date(p.created_at).toLocaleDateString("es-HN"),
      }));
      exportCSV(rows,`pagos-${new Date().toISOString().slice(0,10)}.csv`);
      showToast(`✓ ${rows.length} pagos exportados`);
    }catch(e){showToast("Error: "+e.message,R);}
    finally{setLoadingReport(null);}
  }

  async function exportAcademic(){
    setLoadingReport("academic");
    try{
      const {data}=await supabase.from("enrollments")
        .select("program_id,current_unit,status,enrolled_at,next_payment_date,student:students(level,profile:profiles(full_name,email)),groups(level,schedule,days),student_progress(unit,exam_score,passed)")
        .eq("status","active");
      if(!data){showToast("Sin datos",A);return;}
      const rows=data.map(e=>{
        const scores=e.student_progress?.filter(p=>p.exam_score>0).map(p=>p.exam_score)||[];
        const avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
        const passed=e.student_progress?.filter(p=>p.passed).length||0;
        return{
          Estudiante:e.student?.profile?.full_name||"—",
          Email:e.student?.profile?.email||"—",
          Programa:e.program_id,
          Nivel:e.student?.level||"—",
          Grupo:e.groups?.schedule||"—",
          "Unidad actual":e.current_unit||1,
          "Exámenes aprobados":passed,
          "Promedio general":`${avg}%`,
          "Próximo pago":e.next_payment_date||"—",
          "Matriculado desde":new Date(e.enrolled_at||Date.now()).toLocaleDateString("es-HN"),
        };
      });
      exportCSV(rows,`reporte-academico-${new Date().toISOString().slice(0,10)}.csv`);
      showToast(`✓ Reporte académico exportado (${rows.length} registros)`);
    }catch(e){showToast("Error: "+e.message,R);}
    finally{setLoadingReport(null);}
  }

  async function exportGroups(){
    setLoadingReport("groups");
    try{
      const {data}=await supabase.from("groups")
        .select("level,schedule,days,capacity,active_unit,program_id,teacher_groups(teacher:staff(profile:profiles(full_name))),enrollments(id,status)");
      if(!data) return;
      const rows=data.map(g=>({
        Nivel:g.level, Horario:g.schedule, Días:g.days,
        Programa:g.program_id, Docente:g.teacher_groups?.[0]?.teacher?.profile?.full_name||"Sin asignar",
        "Cupos ocupados":g.enrollments?.filter(e=>e.status==="active").length||0,
        Capacidad:g.capacity, "Unidad activa":g.active_unit,
      }));
      exportCSV(rows,`grupos-${new Date().toISOString().slice(0,10)}.csv`);
      showToast(`✓ ${rows.length} grupos exportados`);
    }catch(e){showToast("Error: "+e.message,R);}
    finally{setLoadingReport(null);}
  }

  if(subView==="metricas") return <BISection showToast={showToast}/>;

  const reports=[
    {id:"students",icon:"ti-users",title:"Todos los estudiantes",desc:"Nombre, email, nivel, programa, unidad actual, estado, próximo pago, beca",color:P,fn:exportStudents},
    {id:"payments",icon:"ti-coin",title:"Historial de pagos",desc:"Todos los pagos registrados con estado, método, referencia y fecha",color:G,fn:exportPayments},
    {id:"academic",icon:"ti-school",title:"Reporte académico",desc:"Progreso por estudiante: unidad, exámenes aprobados, promedio",color:A,fn:exportAcademic},
    {id:"groups",icon:"ti-grid-dots",title:"Grupos y capacidad",desc:"Grupos activos con docente, cupos, horario y programa",color:"#7c3aed",fn:exportGroups},
  ];

  return(
    <div>
      <div style={{fontSize:13,color:"var(--text-secondary)",marginBottom:16}}>Todos los reportes se exportan como CSV listo para abrir en Excel.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:10}}>
        {reports.map(r=>(
          <ReportCard key={r.id} icon={r.icon} title={r.title} desc={r.desc} color={r.color}
            onExport={r.fn} loading={loadingReport===r.id}/>
        ))}
      </div>
    </div>
  );
}
