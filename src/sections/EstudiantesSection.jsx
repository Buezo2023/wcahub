// ─── EstudiantesSection — para SuperAdmin ───────────────────────
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";
import { exportCSV } from "../lib/exportCSV.js";

const P="#155266",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706",AD="#fffbeb";
const LEVELS=["A1","A2","B1","B2","C1"];

function Badge({text,bg,color}){
  return <span style={{fontSize:10,padding:"2px 8px",borderRadius:12,background:bg,color,fontWeight:600,whiteSpace:"nowrap"}}>{text}</span>;
}

export function EstudiantesSection({ showToast }) {
  const [students, setStudents] = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sel,      setSel]      = useState(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({name:"",email:"",phone:"",programId:"en",level:"A1",groupId:"",price:95});
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data: sts } = await supabase.from("students")
        .select("id,student_code,level,scholarship,created_at,profile:profiles(id,full_name,email,phone,active),enrollments(id,program_id,status,current_unit,group_id,groups(schedule,level))")
        .order("created_at", { ascending: false });
      if (sts) setStudents(sts);
      const { data: grps } = await supabase.from("groups")
        .select("id,level,schedule,days,capacity,active_unit,program_id").eq("active",true);
      if (grps) setGroups(grps);
    } finally { setLoading(false); }
  }

  const filtered = useMemo(() => students.filter(s => {
    const name = s.profile?.full_name || "";
    const email = s.profile?.email || "";
    const ms = !search || name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
    const ml = filterLevel==="all" || s.level===filterLevel;
    const mst = filterStatus==="all" || (filterStatus==="active"&&s.profile?.active!==false) || (filterStatus==="inactive"&&s.profile?.active===false);
    return ms && ml && mst;
  }), [students, search, filterLevel, filterStatus]);

  async function enroll() {
    if (!enrollForm.name || !enrollForm.email) { showToast("Nombre y email requeridos", R); return; }
    setEnrolling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/auth/invite", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
        body:JSON.stringify({action:"student",...enrollForm,fullName:enrollForm.name,scholarship:enrollForm.scholarship||false}),
      });
      const json = await res.json().catch(()=>({}));
      if (!res.ok||!json.ok) { showToast("Error: "+(json.error||json.message), R); return; }
      showToast("✓ Estudiante matriculado — invitación enviada");
      setEnrollModal(false);
      setEnrollForm({name:"",email:"",phone:"",programId:"en",level:"A1",groupId:"",price:95});
      await load();
    } catch(e) { showToast("Error de red", R); }
    finally { setEnrolling(false); }
  }

  async function toggleActive(s) {
    const newActive = !(s.profile?.active !== false);
    const { data: { session } } = await supabase.auth.getSession();
    if (!newActive) {
      const en = s.enrollments?.[0]?.id;
      if (en) await fetch("/api/enrollments/suspend",{method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},body:JSON.stringify({enrollmentId:en,action:"suspend",reason:"Suspendido por admin"})});
    } else {
      await supabase.from("profiles").update({active:true}).eq("id",s.profile?.id);
    }
    showToast(newActive ? "Estudiante reactivado" : "Estudiante suspendido");
    setSel(null);
    await load();
  }

  const csvData = filtered.map(s=>({
    Nombre: s.profile?.full_name||"—",
    Email: s.profile?.email||"—",
    Nivel: s.level||"—",
    Programa: s.enrollments?.[0]?.program_id||"—",
    Estado: s.profile?.active!==false?"Activo":"Inactivo",
    Inscrito: new Date(s.created_at).toLocaleDateString("es-HN"),
  }));

  return (
    <div>
      {/* Toolbar */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar estudiante..."
          style={{flex:1,minWidth:160,padding:"9px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
        <select value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}
          style={{padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:12,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit"}}>
          <option value="all">Todos los niveles</option>
          {LEVELS.map(l=><option key={l}>{l}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:12,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit"}}>
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <button onClick={()=>exportCSV(csvData,`estudiantes-${new Date().toISOString().slice(0,10)}.csv`)}
          style={{padding:"9px 14px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:9,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-download" style={{fontSize:13}}/> CSV
        </button>
        <button onClickCapture={e=>{e.stopPropagation();setEnrollModal(true);}}
          style={{padding:"9px 18px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          <i className="ti ti-user-plus" style={{fontSize:14}}/> Matricular
        </button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
        {[
          {label:"Total",value:students.length,color:P,icon:"ti-users"},
          {label:"Activos",value:students.filter(s=>s.profile?.active!==false).length,color:G,icon:"ti-user-check"},
          {label:"Inactivos",value:students.filter(s=>s.profile?.active===false).length,color:R,icon:"ti-user-off"},
          {label:"Con beca",value:students.filter(s=>s.scholarship).length,color:A,icon:"ti-certificate"},
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:9,background:`${s.color}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className={`ti ${s.icon}`} style={{fontSize:16,color:s.color}}/>
            </div>
            <div><div style={{fontSize:20,fontWeight:800,color:"var(--text-primary)",lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:11,color:"var(--text-secondary)"}}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* List + Detail */}
      <div style={{display:"flex",gap:14}}>
        {/* Table */}
        <div style={{flex:1,background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden",minWidth:0}}>
          {loading ? (
            <div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
          ) : filtered.length===0 ? (
            <EmptyState icon="👨‍🎓" title="Sin estudiantes" subtitle="Matriculá al primer estudiante con el botón arriba." actionLabel="+ Matricular" onAction={()=>setEnrollModal(true)}/>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:"var(--bg-surface-subtle)"}}>
                  {["Nombre","Nivel","Programa","Estado",""].map(h=>(
                    <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map(s=>{
                    const active = s.profile?.active!==false;
                    const prog = s.enrollments?.[0]?.program_id||"—";
                    const isSel = sel?.id===s.id;
                    return (
                      <tr key={s.id} onClick={()=>setSel(isSel?null:s)}
                        style={{borderTop:"1px solid var(--border-tertiary)",cursor:"pointer",background:isSel?"var(--bg-surface-subtle)":"transparent"}}>
                        <td style={{padding:"10px 12px"}}>
                          <div style={{fontWeight:600,color:"var(--text-primary)"}}>{s.profile?.full_name||"—"}</div>
                          <div style={{fontSize:11,color:"var(--text-secondary)"}}>{s.profile?.email||"—"}</div>
                        </td>
                        <td style={{padding:"10px 12px"}}><Badge text={s.level||"—"} bg={`${P}14`} color={P}/></td>
                        <td style={{padding:"10px 12px",fontSize:12,color:"var(--text-secondary)"}}>{prog.toUpperCase()}</td>
                        <td style={{padding:"10px 12px"}}><Badge text={active?"Activo":"Inactivo"} bg={active?GD:RD} color={active?G:R}/></td>
                        <td style={{padding:"10px 12px"}}><i className="ti ti-chevron-right" style={{color:"var(--text-tertiary)",fontSize:14}}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {sel && (
          <div style={{width:260,flexShrink:0,background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:14,padding:16,height:"fit-content"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>Detalle</div>
              <button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"var(--text-tertiary)"}}>✕</button>
            </div>
            <div style={{width:52,height:52,borderRadius:"50%",background:`${P}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:P,margin:"0 auto 12px"}}>
              {(sel.profile?.full_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",textAlign:"center",marginBottom:4}}>{sel.profile?.full_name||"—"}</div>
            <div style={{fontSize:11,color:"var(--text-secondary)",textAlign:"center",marginBottom:14}}>{sel.profile?.email||"—"}</div>
            {[
              ["Nivel", sel.level||"—"],
              ["Programa", sel.enrollments?.[0]?.program_id?.toUpperCase()||"—"],
              ["Unidad", `U${sel.enrollments?.[0]?.current_unit||1}/12`],
              ["Grupo", sel.enrollments?.[0]?.groups?.schedule||"Sin grupo"],
              ["Teléfono", sel.profile?.phone||"—"],
              ["Inscrito", new Date(sel.created_at).toLocaleDateString("es-HN",{month:"short",year:"numeric"})],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"6px 0",borderBottom:"1px solid var(--border-tertiary)"}}>
                <span style={{color:"var(--text-secondary)"}}>{k}</span>
                <span style={{fontWeight:500,color:"var(--text-primary)"}}>{v}</span>
              </div>
            ))}
            <button onClickCapture={e=>{e.stopPropagation();toggleActive(sel);}}
              style={{width:"100%",marginTop:14,padding:"9px",background:sel.profile?.active!==false?RD:GD,color:sel.profile?.active!==false?R:G,border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              {sel.profile?.active!==false?"Suspender estudiante":"Reactivar estudiante"}
            </button>
          </div>
        )}
      </div>

      {/* Enroll modal */}
      {enrollModal && (
        <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setEnrollModal(false);}}>
          <div style={{background:"var(--bg-surface)",borderRadius:18,padding:26,width:440,maxWidth:"100%",border:"1px solid var(--border)",boxShadow:"0 20px 60px rgba(0,0,0,.15)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:20}}>Matricular estudiante</div>
            {[
              {label:"Nombre completo *",key:"name",type:"text",ph:"Ej: María García"},
              {label:"Email *",key:"email",type:"email",ph:"correo@ejemplo.com"},
              {label:"Teléfono",key:"phone",type:"tel",ph:"+504 9999-9999"},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>{f.label}</div>
                <input type={f.type} value={enrollForm[f.key]} placeholder={f.ph}
                  onChange={e=>setEnrollForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Programa</div>
                <select value={enrollForm.programId} onChange={e=>setEnrollForm(p=>({...p,programId:e.target.value}))}
                  style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
                  {[["en","Inglés"],["va","VA General"],["va_mkt","VA Mkt"],["va_legal","VA Legal"],["va_care","VA Care"]].map(([id,n])=>(
                    <option key={id} value={id}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Nivel</div>
                <select value={enrollForm.level} onChange={e=>setEnrollForm(p=>({...p,level:e.target.value,groupId:""}))}
                  style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
                  {LEVELS.map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Grupo</div>
              <select value={enrollForm.groupId} onChange={e=>setEnrollForm(p=>({...p,groupId:e.target.value}))}
                style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
                <option value="">Sin grupo asignado</option>
                {groups.filter(g=>g.level===enrollForm.level&&g.program_id===enrollForm.programId).map(g=>(
                  <option key={g.id} value={g.id}>{g.level} · {g.schedule}</option>
                ))}
              </select>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Precio mensual (USD)</div>
              <input type="number" value={enrollForm.price} onChange={e=>setEnrollForm(p=>({...p,price:+e.target.value}))}
                style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
            </div>
            <div style={{marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
              <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:"var(--text-secondary)"}}>
                <input type="checkbox" checked={enrollForm.scholarship||false} onChange={e=>{
                  const hasBeca = e.target.checked;
                  setEnrollForm(p=>({...p,scholarship:hasBeca,price:hasBeca?0:95}));
                }}/> Beca (precio $0)
              </label>
              {enrollForm.scholarship && <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:"#e8f3f6",color:"#155266",fontWeight:600}}>100% beca aplicada</span>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEnrollModal(false)}
                style={{flex:1,padding:"10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>Cancelar</button>
              <button onClickCapture={e=>{e.stopPropagation();enroll();}} disabled={enrolling}
                style={{flex:2,padding:"10px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:enrolling?.6:1}}>
                {enrolling?"Matriculando...":"Matricular y enviar invitación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
