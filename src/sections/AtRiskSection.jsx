// ─── AtRiskSection — Estudiantes en riesgo para SuperAdmin ──────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";

const R="#dc2626",RD="#fef2f2",A="#d97706",AD="#fffbeb",G="#059669",GD="#ecfdf5",P="#155266";

export function AtRiskSection({ showToast }) {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    // Load enrollments with student_progress to compute risk
    const {data}=await supabase.from("enrollments")
      .select("id,program_id,current_unit,student:students(id,level,scholarship,profile:profiles(full_name,email,phone)),groups(level,schedule),student_progress(exam_score,passed)")
      .eq("status","active");
    if(data){
      const mapped = data.map(e=>{
        const scores = e.student_progress?.map(p=>p.exam_score||0).filter(s=>s>0);
        const avg    = scores?.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;
        const failed = e.student_progress?.filter(p=>!p.passed).length||0;
        return {
          id: e.id, name: e.student?.profile?.full_name||"—",
          email: e.student?.profile?.email||"—",
          phone: e.student?.profile?.phone||"—",
          level: e.student?.level||e.groups?.level||"A1",
          unit: e.current_unit||1, program: e.program_id,
          avg, failed, scholarship: e.student?.scholarship,
          groupSchedule: e.groups?.schedule||"—",
        };
      }).filter(s=>
        (s.avg !== null && s.avg < 65) ||
        s.failed >= 2 ||
        (s.unit === 1 && s.avg === null) // enrolled but no progress at all
      );
      setStudents(mapped);
    }
    setLoading(false);
  }

  const riskLevel = s => {
    if (s.avg !== null && s.avg < 50) return ["Crítico",R,RD];
    if (s.failed >= 2)                return ["Alto riesgo",A,AD];
    return                                   ["Seguimiento",A,AD];
  };

  return(
    <div>
      <div style={{background:RD,border:`1px solid ${R}40`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:R,display:"flex",gap:8}}>
        <i className="ti ti-alert-circle" style={{fontSize:14,flexShrink:0,marginTop:1}}/>
        Estudiantes con promedio menor al 65% o dos o más exámenes reprobados. Coordiná un plan de apoyo con su docente.
      </div>
      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
      :students.length===0?(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:48,marginBottom:12}}>✅</div>
          <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>Sin estudiantes en riesgo</div>
          <div style={{fontSize:13,color:"var(--text-secondary)",marginTop:4}}>Todos los estudiantes están al día</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {students.map(s=>{
            const [label,color,bg]=riskLevel(s);
            return(
              <div key={s.id} style={{background:"var(--bg-surface)",border:`1px solid ${color}30`,borderRadius:12,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color,flexShrink:0}}>
                      {s.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{s.name}</div>
                      <div style={{fontSize:11,color:"var(--text-secondary)"}}>{s.level} · U{s.unit}/12 · {s.groupSchedule}</div>
                    </div>
                  </div>
                  <span style={{fontSize:10,padding:"3px 9px",borderRadius:12,background:bg,color,fontWeight:700}}>{label}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                  {[
                    {l:"Promedio",v:s.avg!==null?`${s.avg}%`:"Sin datos",c:s.avg!==null&&s.avg<65?R:s.avg!==null?G:"var(--text-tertiary)"},
                    {l:"Reprobados",v:`${s.failed} exámenes`,c:s.failed>=2?R:A},
                    {l:"Programa",v:s.program?.toUpperCase()||"—",c:P},
                  ].map((m,i)=>(
                    <div key={i} style={{background:"var(--bg-surface-subtle)",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:14,fontWeight:800,color:m.c}}>{m.v}</div>
                      <div style={{fontSize:10,color:"var(--text-secondary)",marginTop:2}}>{m.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:6}}>
                  <a href={`mailto:${s.email}`} style={{flex:1,fontSize:12,padding:"6px",background:P,color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600,textAlign:"center",textDecoration:"none"}}>✉ Email</a>
                  {s.phone&&<a href={`https://wa.me/${s.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${s.name}, queríamos contactarte para hablar de tu progreso en WCA Academy.`)}`} target="_blank" rel="noopener noreferrer" style={{flex:1,fontSize:12,padding:"6px",background:"#ecfdf5",color:G,border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600,textAlign:"center",textDecoration:"none"}}>💬 WhatsApp</a>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
