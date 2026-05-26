// ─── ComunicacionesSection — Email blast + recordatorios ────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706";

export function ComunicacionesSection({ showToast, subView }) {

  // ── EMAIL BLAST ────────────────────────────────────────────────
  function BlastView() {
    const [groups,    setGroups]    = useState([]);
    const [target,    setTarget]    = useState("all");   // all | group | program | overdue
    const [selGroup,  setSelGroup]  = useState("");
    const [selProg,   setSelProg]   = useState("en");
    const [subject,   setSubject]   = useState("");
    const [body,      setBody]      = useState("");
    const [sending,   setSending]   = useState(false);
    const [preview,   setPreview]   = useState(false);

    useEffect(()=>{
      supabase.from("groups").select("id,level,schedule,program_id").eq("active",true).then(({data})=>{if(data)setGroups(data);});
    },[]);

    const TARGETS=[["all","Todos los estudiantes activos"],["overdue","Estudiantes con pago vencido"],["program","Por programa"],["group","Por grupo"]];
    const TEMPLATES=[
      {l:"Cambio de horario",s:"Cambio de horario — WCA Academy",b:"Estimado/a estudiante,\n\nTe informamos que a partir de la próxima semana habrá un cambio en el horario de tu grupo.\n\nPor favor revisa tu portal para ver los detalles actualizados.\n\n¡Gracias por tu comprensión!\n\nEquipo WCA Academy"},
      {l:"Recordatorio de pago",s:"Recordatorio de pago — WCA Academy",b:"Hola,\n\nTe recordamos que tu próximo pago está por vencer. Para continuar disfrutando de tus clases, por favor realizá tu transferencia y envianos el comprobante.\n\n¡Gracias!\n\nEquipo WCA Academy"},
      {l:"Anuncio nuevo contenido",s:"¡Nuevo contenido disponible! — WCA Academy",b:"¡Hola!\n\nTenemos buenas noticias: hemos actualizado el material de tu programa con nuevos recursos y actividades.\n\nIngresá a tu portal para acceder al nuevo contenido.\n\n¡Que aprendas mucho!\n\nEquipo WCA Academy"},
    ];

    async function send(){
      if(!subject.trim()||!body.trim()){showToast("Asunto y mensaje requeridos",R);return;}
      setSending(true);
      try{
        const {data:{session}}=await supabase.auth.getSession();
        // Build recipient query
        let studentQuery = supabase.from("students")
          .select("id,profile:profiles(email,full_name,active)");
          // Note: filter active students in JS (Supabase client doesn't support
          // dot-notation filters on joined tables)

        if(target==="overdue"){
          const today=new Date().toISOString().slice(0,10);
          const {data:en}=await supabase.from("enrollments")
            .select("student_id").eq("status","active").lt("next_payment_date",today).not("next_payment_date","is",null);
          const ids=(en||[]).map(e=>e.student_id);
          if(!ids.length){showToast("Sin estudiantes vencidos",A);setSending(false);return;}
          studentQuery=studentQuery.in("id",ids);
        } else if(target==="group"&&selGroup){
          const {data:en}=await supabase.from("enrollments").select("student_id").eq("group_id",selGroup).eq("status","active");
          const ids=(en||[]).map(e=>e.student_id);
          studentQuery=studentQuery.in("id",ids);
        } else if(target==="program"){
          const {data:en}=await supabase.from("enrollments").select("student_id").eq("program_id",selProg).eq("status","active");
          const ids=(en||[]).map(e=>e.student_id);
          studentQuery=studentQuery.in("id",ids);
        }

        const {data:students}=await studentQuery;
        if(!students?.length){showToast("Sin destinatarios encontrados",A);setSending(false);return;}

        // Send via Resend (batch)
        let sent=0;
        for(const s of students){
          if(!s.profile?.email) continue;
          if(s.profile?.active === false) continue; // skip inactive profiles
          const personalBody = body.replace("{nombre}",s.profile?.full_name?.split(" ")[0]||"Estudiante");
          await fetch("/api/emails?action=blast",{method:"POST",
            headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
            body:JSON.stringify({to:s.profile.email,toName:s.profile.full_name,subject,html:`<p style="font-family:sans-serif;line-height:1.7">${personalBody.replace(/\n/g,"<br>")}</p>`})
          }).catch(()=>{});
          sent++;
          await new Promise(r=>setTimeout(r,120));
        }
        showToast(`✓ ${sent} emails enviados`);
        setSubject(""); setBody("");
      }catch(e){showToast("Error: "+e.message,R);}
      finally{setSending(false);}
    }

    return(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Left: compose */}
        <div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Destinatarios</div>
            <select value={target} onChange={e=>setTarget(e.target.value)}
              style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
              {TARGETS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
            {target==="group"&&<select value={selGroup} onChange={e=>setSelGroup(e.target.value)} style={{width:"100%",marginTop:6,padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:12,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
              <option value="">Seleccionar grupo...</option>
              {groups.map(g=><option key={g.id} value={g.id}>{g.level} · {g.schedule}</option>)}
            </select>}
            {target==="program"&&<select value={selProg} onChange={e=>setSelProg(e.target.value)} style={{width:"100%",marginTop:6,padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:12,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
              {[["en","Inglés Completo"],["va","Asistente Virtual"],["va_mkt","VA Marketing"],["va_legal","VA Legal"],["va_care","VA Cuidador"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Asunto</div>
            <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Asunto del email"
              style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)"}}>Mensaje</div>
              <div style={{fontSize:10,color:"var(--text-tertiary)"}}>Usá {"{nombre}"} para personalizar</div>
            </div>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={8} placeholder="Escribí el mensaje aquí..."
              style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit",resize:"vertical"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClickCapture={e=>{e.stopPropagation();send();}} disabled={sending}
              style={{flex:1,padding:"11px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:sending?.6:1}}>
              {sending?"Enviando...":"✉ Enviar ahora"}
            </button>
          </div>
        </div>

        {/* Right: templates */}
        <div>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:10}}>Plantillas rápidas</div>
          {TEMPLATES.map((t,i)=>(
            <div key={i} onClick={()=>{setSubject(t.s);setBody(t.b);}}
              style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=P}
              onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
              <div style={{fontSize:12,fontWeight:600,color:"var(--text-primary)"}}>{t.l}</div>
              <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>Clic para usar esta plantilla</div>
            </div>
          ))}
          <div style={{marginTop:16,background:"var(--bg-surface-subtle)",borderRadius:10,padding:"12px 14px",fontSize:11,color:"var(--text-secondary)"}}>
            <div style={{fontWeight:600,color:"var(--text-primary)",marginBottom:4}}>📌 Tips</div>
            <div>• Usá <span style={{fontFamily:"monospace",background:"var(--bg-surface)",padding:"1px 5px",borderRadius:4}}>{"{nombre}"}</span> para personalizar</div>
            <div style={{marginTop:3}}>• Los emails se envían uno a uno con delay de 120ms para respetar el límite de Resend</div>
          </div>
        </div>
      </div>
    );
  }

  // ── RECORDATORIOS ──────────────────────────────────────────────
  function RecordatoriosView(){
    const [running, setRunning] = useState(false);
    const [result,  setResult]  = useState(null);

    async function run(type){
      setRunning(true);
      try{
        const {data:{session}}=await supabase.auth.getSession();
        if(type==="manual"){
          const res=await fetch("/api/jobs/daily-billing",{headers:{"x-cron-secret":"manual-trigger","Authorization":`Bearer ${session?.access_token}`}});
          const json=await res.json().catch(()=>({}));
          setResult({msg:`Ciclo ejecutado: ${json.results?.preReminders?.sent||0} pre-avisos, ${json.results?.dueToday?.sent||0} vencen hoy, ${json.results?.overdueWarning?.sent||0} vencidos, ${json.results?.autoSuspended?.count||0} suspendidos`});
        } else {
          const res=await fetch("/api/emails?action=reminders",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},body:JSON.stringify({daysOverdue:0})});
          const json=await res.json().catch(()=>({}));
          setResult({msg:`Recordatorios enviados: ${json.data?.sent ?? json.sent ?? 0}`});
        }
      }catch(e){setResult({msg:"Error: "+e.message,error:true});}
      finally{setRunning(false);}
    }

    const actions=[
      {l:"Ejecutar ciclo completo de cobro",d:"Envía D-5, D0, D+5, suspende D+15 automáticamente",icon:"ti-refresh",type:"manual",color:P},
      {l:"Recordatorio masivo de pagos",d:"Email a todos con pago vencido este mes",icon:"ti-mail",type:"reminders",color:A},
    ];

    return(
      <div style={{maxWidth:600}}>
        {result&&(
          <div style={{background:result.error?RD:GD,border:`1px solid ${result.error?R:G}40`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:result.error?R:G,fontWeight:600}}>
            {result.error?"✗":"✓"} {result.msg}
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {actions.map((a,i)=>(
            <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:10,background:`${a.color}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <i className={`ti ${a.icon}`} style={{fontSize:20,color:a.color}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{a.l}</div>
                <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>{a.d}</div>
              </div>
              <button onClickCapture={e=>{e.stopPropagation();run(a.type);}} disabled={running}
                style={{padding:"8px 18px",background:a.color,color:"#fff",border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0,opacity:running?.6:1}}>
                {running?"...":"Ejecutar"}
              </button>
            </div>
          ))}
        </div>
        <div style={{marginTop:16,background:"var(--bg-surface-subtle)",borderRadius:10,padding:"12px 14px",fontSize:11,color:"var(--text-secondary)"}}>
          <div style={{fontWeight:600,color:"var(--text-primary)",marginBottom:4}}>🤖 Ciclo automático</div>
          El cron job se ejecuta automáticamente todos los días a las 9am UTC (4am Honduras) vía Vercel Cron.
        </div>
      </div>
    );
  }

  // ── ANUNCIOS ──────────────────────────────────────────────────
  function AnunciosView(){
    const [anuncios, setAnuncios] = useState([]);
    const [form, setForm]         = useState({titulo:"",contenido:"",tipo:"info"});
    const [saving, setSaving]     = useState(false);

    useEffect(()=>{load();},[]);

    async function load(){
      const {data}=await supabase.from("audit_log").select("metadata,created_at").eq("action","announcement").order("created_at",{ascending:false}).limit(10);
      if(data) setAnuncios(data.map(d=>({...d.metadata,fecha:d.created_at})));
    }

    async function save(){
      if(!form.titulo||!form.contenido){return;}
      setSaving(true);
      await supabase.from("audit_log").insert({action:"announcement",entity:"system",metadata:{titulo:form.titulo,contenido:form.contenido,tipo:form.tipo}});
      setSaving(false);
      setForm({titulo:"",contenido:"",tipo:"info"});
      await load();
    }

    const tipoColor={info:[PD,P],warn:[`#fffbeb`,A],urgent:[RD,R]};

    return(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Tipo</div>
          <select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}
            style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit",marginBottom:10}}>
            <option value="info">Informativo</option>
            <option value="warn">Aviso</option>
            <option value="urgent">Urgente</option>
          </select>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Título</div>
          <input value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))} placeholder="Título del anuncio"
            style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit",marginBottom:10}}/>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Contenido</div>
          <textarea value={form.contenido} onChange={e=>setForm(p=>({...p,contenido:e.target.value}))} rows={5}
            style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit",resize:"none",marginBottom:12}}/>
          <button onClickCapture={e=>{e.stopPropagation();save();}} disabled={saving}
            style={{width:"100%",padding:"10px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
            {saving?"Guardando...":"Publicar anuncio"}
          </button>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:10}}>Anuncios recientes</div>
          {anuncios.length===0?<div style={{fontSize:12,color:"var(--text-secondary)",textAlign:"center",padding:"20px 0"}}>Sin anuncios aún</div>
          :anuncios.map((a,i)=>{
            const [bg,color]=tipoColor[a.tipo]||tipoColor.info;
            return(
              <div key={i} style={{background:bg,border:`1px solid ${color}30`,borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color}}>{a.titulo}</div>
                <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:3,lineHeight:1.5}}>{a.contenido}</div>
                <div style={{fontSize:10,color:"var(--text-tertiary)",marginTop:5}}>{new Date(a.fecha).toLocaleDateString("es-HN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return subView==="blast"?<BlastView/>:subView==="recordatorios"?<RecordatoriosView/>:<AnunciosView/>;
}
