// ─── BecasSection — Becas para SuperAdmin ───────────────────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",A="#d97706",AD="#fffbeb",R="#dc2626";

export function BecasSection({ showToast }) {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const {data}=await supabase.from("students")
      .select("id,level,scholarship,created_at,profile:profiles(full_name,email,phone),enrollments(id,program_id,status,price_locked,current_unit,student_progress(exam_score,passed))");
    if(data) setStudents(data);
    setLoading(false);
  }

  async function toggleScholarship(s){
    const newVal = !s.scholarship;
    const {error}=await supabase.from("students").update({scholarship:newVal}).eq("id",s.id);
    if(error){showToast("Error: "+error.message,R);return;}
    // If granting scholarship, update price_locked to 0 on active enrollment
    if(newVal){
      const activeEnroll = s.enrollments?.find(e=>e.status==="active");
      if(activeEnroll){
        await supabase.from("enrollments").update({price_locked:0}).eq("id",activeEnroll.id);
      }
    }
    showToast(newVal?"✓ Beca otorgada — precio establecido en $0":"Beca retirada");
    await load();
  }

  const scholars = students.filter(s=>s.scholarship);
  const eligible = students.filter(s=>{
    if(s.scholarship) return false;
    const prog = s.enrollments?.find(e=>e.status==="active");
    const scores = prog?.student_progress?.map(p=>p.exam_score||0).filter(x=>x>0)||[];
    const avg = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
    return avg >= 85 && prog?.current_unit >= 3;
  });

  const filtered = (search
    ? students.filter(s=>(s.profile?.full_name||"").toLowerCase().includes(search.toLowerCase()))
    : students
  ).filter(s=>s.scholarship||eligible.some(e=>e.id===s.id));

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <div style={{background:PD,border:`1px solid ${P}20`,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
          <i className="ti ti-certificate" style={{fontSize:24,color:P}}/>
          <div><div style={{fontSize:22,fontWeight:800,color:P}}>{scholars.length}</div><div style={{fontSize:11,color:"var(--text-secondary)"}}>Con beca activa</div></div>
        </div>
        <div style={{background:AD,border:`1px solid ${A}30`,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
          <i className="ti ti-star" style={{fontSize:24,color:A}}/>
          <div><div style={{fontSize:22,fontWeight:800,color:A}}>{eligible.length}</div><div style={{fontSize:11,color:"var(--text-secondary)"}}>Elegibles (≥85% promedio, U3+)</div></div>
        </div>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar estudiante..."
        style={{width:"100%",padding:"9px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit",marginBottom:12}}/>

      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
      :filtered.length===0?<EmptyState icon="🏅" title="Sin becas" subtitle="Los estudiantes con promedio ≥85% y unidad 3+ aparecen como elegibles."/>
      :<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(s=>{
          const prog = s.enrollments?.find(e=>e.status==="active");
          const scores = prog?.student_progress?.map(p=>p.exam_score||0).filter(x=>x>0)||[];
          const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;
          const isEligible = eligible.some(e=>e.id===s.id);
          return(
            <div key={s.id} style={{background:"var(--bg-surface)",border:`1px solid ${s.scholarship?"#fbbf24":isEligible?`${A}40`:"var(--border)"}`,borderRadius:12,padding:12,display:"flex",gap:16,alignItems:"center"}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:s.scholarship?AD:PD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:s.scholarship?A:P,flexShrink:0}}>
                {(s.profile?.full_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{s.profile?.full_name||"—"}</div>
                <div style={{fontSize:11,color:"var(--text-secondary)"}}>{s.level} · U{prog?.current_unit||1}/12 · {avg!==null?`Promedio ${avg}%`:"Sin exámenes"}</div>
              </div>
              {s.scholarship&&<span style={{fontSize:11,padding:"3px 8px",borderRadius:12,background:AD,color:A,fontWeight:700}}>BECADO</span>}
              {isEligible&&!s.scholarship&&<span style={{fontSize:11,padding:"3px 8px",borderRadius:12,background:GD,color:G,fontWeight:700}}>ELEGIBLE</span>}
              <button onClickCapture={e=>{e.stopPropagation();toggleScholarship(s);}} style={{fontSize:11,padding:"6px 12px",background:s.scholarship?R:"#e8f3f6",color:s.scholarship?"#fff":P,border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontWeight:600,flexShrink:0}}>
                {s.scholarship?"Retirar beca":"Otorgar beca"}
              </button>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
