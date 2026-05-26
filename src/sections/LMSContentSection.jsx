// ─── LMSContentSection — Gestión de contenido LMS en SuperAdmin ─
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706",AD="#fffbeb";
const LEVELS = ["A1","A2","B1","B2","C1"];
const PROGRAMS = [["en","Inglés Wide Angle"],["va","Asistente Virtual"]];
const TYPES = [
  {id:"video",    icon:"🎬", label:"Video"},
  {id:"lesson",   icon:"📖", label:"Lectura"},
  {id:"quiz",     icon:"📝", label:"Quiz"},
  {id:"matching", icon:"🔗", label:"Matching"},
  {id:"fill_blank",icon:"✏️",label:"Completar"},
  {id:"roleplay", icon:"🎭", label:"Roleplay"},
];

// ── helpers ──────────────────────────────────────────────────────
const XP_DEFAULT = {video:20,lesson:15,quiz:50,matching:25,fill_blank:25,roleplay:35};

function Tag({children,bg,color}){
  return <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:bg,color,fontWeight:700}}>{children}</span>;
}

function SaveBtn({onClick,saving}){
  return(
    <button onClickCapture={e=>{e.stopPropagation();onClick();}} disabled={saving}
      style={{padding:"8px 20px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
      {saving?"Guardando...":"Guardar cambios"}
    </button>
  );
}

// ── Video editor ─────────────────────────────────────────────────
function VideoEditor({content,onChange}){
  const c = content || {};
  const kp = (c.key_points||[]).join("\n");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>
          ID de YouTube <span style={{color:"var(--text-tertiary)",fontWeight:400}}>— solo el ID, ej: dQw4w9WgXcQ</span>
        </div>
        <input value={c.youtube_id||""} onChange={e=>onChange({...c,youtube_id:e.target.value.trim()})}
          placeholder="ej: dQw4w9WgXcQ"
          style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"monospace"}}/>
        {c.youtube_id&&!c.youtube_id.startsWith("PLACEHOLDER")&&(
          <a href={`https://youtu.be/${c.youtube_id}`} target="_blank" rel="noopener noreferrer"
            style={{fontSize:11,color:P,display:"block",marginTop:4}}>▷ Ver video en YouTube →</a>
        )}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Duración (min)</div>
          <input type="number" value={c.duration_min||10} onChange={e=>onChange({...c,duration_min:+e.target.value})}
            style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Estado</div>
          <div style={{padding:"9px 12px",background:c.youtube_id&&!c.youtube_id.startsWith("PLACEHOLDER")?GD:AD,borderRadius:9,fontSize:12,fontWeight:600,color:c.youtube_id&&!c.youtube_id.startsWith("PLACEHOLDER")?G:A}}>
            {c.youtube_id&&!c.youtube_id.startsWith("PLACEHOLDER")?"✓ Video configurado":"⚠ Sin video aún"}
          </div>
        </div>
      </div>
      <div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Descripción</div>
        <textarea value={c.description||""} onChange={e=>onChange({...c,description:e.target.value})} rows={2}
          style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit",resize:"vertical"}}/>
      </div>
      <div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Puntos clave <span style={{fontWeight:400,color:"var(--text-tertiary)"}}>(uno por línea)</span></div>
        <textarea value={kp} onChange={e=>onChange({...c,key_points:e.target.value.split("\n").filter(l=>l.trim())})} rows={4}
          placeholder={"Los estudiantes aprenderán...\nHabilidad 2\nHabilidad 3"}
          style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit",resize:"vertical"}}/>
      </div>
    </div>
  );
}

// ── Quiz editor ──────────────────────────────────────────────────
function QuizEditor({content,onChange}){
  const c = content || {};
  const qs = c.questions||[];
  function updateQ(i,key,val){ const nqs=[...qs]; nqs[i]={...nqs[i],[key]:val}; onChange({...c,questions:nqs}); }
  function updateOpt(qi,oi,val){ const nqs=[...qs]; const opts=[...nqs[qi].opts]; opts[oi]=val; nqs[qi]={...nqs[qi],opts}; onChange({...c,questions:nqs}); }
  function addQ(){
    onChange({...c,questions:[...qs,{q:"",opts:["","","",""],ans:0,explanation:""}]});
  }
  function removeQ(i){ onChange({...c,questions:qs.filter((_,qi)=>qi!==i)}); }

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Nota mínima (%)</div>
          <input type="number" value={c.pass_score||70} onChange={e=>onChange({...c,pass_score:+e.target.value})}
            style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Tiempo límite (min)</div>
          <input type="number" value={c.time_limit_min||15} onChange={e=>onChange({...c,time_limit_min:+e.target.value})}
            style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
        </div>
      </div>

      {qs.map((q,qi)=>(
        <div key={qi} style={{background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:12,padding:14,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:700,color:"var(--text-secondary)"}}>Pregunta {qi+1}</span>
            <button onClick={()=>removeQ(qi)} style={{background:"none",border:"none",cursor:"pointer",color:R,fontSize:16,padding:0}}>✕</button>
          </div>
          <textarea value={q.q} onChange={e=>updateQ(qi,"q",e.target.value)} rows={2} placeholder="Escribí la pregunta..."
            style={{width:"100%",padding:"8px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit",resize:"vertical",marginBottom:8}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
            {(q.opts||["","","",""]).map((opt,oi)=>(
              <div key={oi} style={{display:"flex",gap:6,alignItems:"center"}}>
                <input type="radio" name={`ans-${qi}`} checked={q.ans===oi} onChange={()=>updateQ(qi,"ans",oi)} style={{flexShrink:0}}/>
                <input value={opt} onChange={e=>updateOpt(qi,oi,e.target.value)} placeholder={`Opción ${oi+1}${q.ans===oi?" ← correcta":""}`}
                  style={{flex:1,padding:"6px 10px",border:`1px solid ${q.ans===oi?G:"var(--border)"}`,borderRadius:7,fontSize:12,background:q.ans===oi?GD:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
            ))}
          </div>
          <input value={q.explanation||""} onChange={e=>updateQ(qi,"explanation",e.target.value)} placeholder="Explicación de la respuesta correcta..."
            style={{width:"100%",padding:"7px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:12,background:"var(--bg-surface)",color:"var(--text-secondary)",fontFamily:"inherit"}}/>
        </div>
      ))}

      <button onClick={addQ}
        style={{width:"100%",padding:"10px",background:"var(--bg-surface-subtle)",border:"2px dashed var(--border)",borderRadius:10,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)",fontWeight:600}}>
        + Agregar pregunta
      </button>
    </div>
  );
}

// ── Matching editor ──────────────────────────────────────────────
function MatchingEditor({content,onChange}){
  const c = content||{};
  const pairs = c.pairs||[];
  function updatePair(i,side,val){ const np=[...pairs]; np[i]={...np[i],[side]:val}; onChange({...c,pairs:np}); }
  function addPair(){ onChange({...c,pairs:[...pairs,{left:"",right:""}]}); }
  function removePair(i){ onChange({...c,pairs:pairs.filter((_,pi)=>pi!==i)}); }
  return(
    <div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Instrucciones</div>
        <input value={c.instructions||""} onChange={e=>onChange({...c,instructions:e.target.value})}
          style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
      </div>
      {pairs.map((p,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginBottom:8,alignItems:"center"}}>
          <input value={p.left} onChange={e=>updatePair(i,"left",e.target.value)} placeholder="Concepto"
            style={{padding:"8px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
          <input value={p.right} onChange={e=>updatePair(i,"right",e.target.value)} placeholder="Definición"
            style={{padding:"8px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
          <button onClick={()=>removePair(i)} style={{background:"none",border:"none",cursor:"pointer",color:R,fontSize:16,padding:4}}>✕</button>
        </div>
      ))}
      <button onClick={addPair}
        style={{width:"100%",padding:"9px",background:"var(--bg-surface-subtle)",border:"2px dashed var(--border)",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)",fontWeight:600}}>
        + Agregar par
      </button>
    </div>
  );
}

// ── FillBlank editor ─────────────────────────────────────────────
function FillBlankEditor({content,onChange}){
  const c = content||{};
  const sents = c.sentences||[];
  const wb = (c.word_bank||[]).join(", ");
  function updateSent(i,key,val){ const ns=[...sents]; ns[i]={...ns[i],[key]:val}; onChange({...c,sentences:ns}); }
  function addSent(){ onChange({...c,sentences:[...sents,{template:"...___..",answer:"",hint:""}]}); }
  function removeSent(i){ onChange({...c,sentences:sents.filter((_,si)=>si!==i)}); }
  return(
    <div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Instrucciones</div>
        <input value={c.instructions||""} onChange={e=>onChange({...c,instructions:e.target.value})}
          style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Banco de palabras <span style={{fontWeight:400,color:"var(--text-tertiary)"}}>(separadas por coma)</span></div>
        <input value={wb} onChange={e=>onChange({...c,word_bank:e.target.value.split(",").map(w=>w.trim()).filter(Boolean)})}
          placeholder="palabra1, palabra2, palabra3"
          style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
      </div>
      {sents.map((s,i)=>(
        <div key={i} style={{background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:10,padding:12,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)"}}>Oración {i+1}</span>
            <button onClick={()=>removeSent(i)} style={{background:"none",border:"none",cursor:"pointer",color:R,fontSize:14,padding:0}}>✕</button>
          </div>
          <input value={s.template} onChange={e=>updateSent(i,"template",e.target.value)} placeholder="Texto con ___ donde va la respuesta"
            style={{width:"100%",padding:"7px 10px",border:"1px solid var(--border)",borderRadius:7,fontSize:12,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit",marginBottom:6}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <input value={s.answer} onChange={e=>updateSent(i,"answer",e.target.value)} placeholder="Respuesta correcta"
              style={{padding:"6px 10px",border:`1px solid ${G}`,borderRadius:7,fontSize:12,background:GD,color:"var(--text-primary)",fontFamily:"inherit"}}/>
            <input value={s.hint||""} onChange={e=>updateSent(i,"hint",e.target.value)} placeholder="Pista (opcional)"
              style={{padding:"6px 10px",border:"1px solid var(--border)",borderRadius:7,fontSize:12,background:"var(--bg-surface)",color:"var(--text-secondary)",fontFamily:"inherit"}}/>
          </div>
        </div>
      ))}
      <button onClick={addSent}
        style={{width:"100%",padding:"9px",background:"var(--bg-surface-subtle)",border:"2px dashed var(--border)",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)",fontWeight:600}}>
        + Agregar oración
      </button>
    </div>
  );
}

// ── Lesson editor (simplified) ───────────────────────────────────
function LessonEditor({content,onChange}){
  const c = content||{};
  const secs = c.sections||[];
  function updateSec(i,key,val){ const ns=[...secs]; ns[i]={...ns[i],[key]:val}; onChange({...c,sections:ns}); }
  function addSec(){ onChange({...c,sections:[...secs,{title:"",content:"",highlight:""}]}); }
  function removeSec(i){ onChange({...c,sections:secs.filter((_,si)=>si!==i)}); }
  return(
    <div>
      {secs.map((s,i)=>(
        <div key={i} style={{border:"1px solid var(--border)",borderRadius:12,padding:14,marginBottom:10,background:"var(--bg-surface-subtle)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)"}}>Sección {i+1}</span>
            <button onClick={()=>removeSec(i)} style={{background:"none",border:"none",cursor:"pointer",color:R,fontSize:14,padding:0}}>✕</button>
          </div>
          <input value={s.title} onChange={e=>updateSec(i,"title",e.target.value)} placeholder="Título de la sección"
            style={{width:"100%",padding:"8px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,fontWeight:600,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit",marginBottom:7}}/>
          <textarea value={s.content} onChange={e=>updateSec(i,"content",e.target.value)} rows={4} placeholder="Contenido de la sección..."
            style={{width:"100%",padding:"8px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit",resize:"vertical",marginBottom:7}}/>
          <input value={s.highlight||""} onChange={e=>updateSec(i,"highlight",e.target.value)} placeholder="💡 Dato clave o resaltado (opcional)"
            style={{width:"100%",padding:"7px 10px",border:"1px solid #fde68a",borderRadius:8,fontSize:12,background:"#fffbeb",color:"#92400e",fontFamily:"inherit"}}/>
        </div>
      ))}
      <button onClick={addSec}
        style={{width:"100%",padding:"9px",background:"var(--bg-surface-subtle)",border:"2px dashed var(--border)",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)",fontWeight:600}}>
        + Agregar sección
      </button>
    </div>
  );
}

// ── Main Section Component ────────────────────────────────────────
export function LMSContentSection({ showToast }) {
  const [prog,      setProg]      = useState("va");
  const [level,     setLevel]     = useState("A1");
  const [units,     setUnits]     = useState([]);
  const [selUnit,   setSelUnit]   = useState(null);
  const [activities,setActivities]= useState([]);
  const [selAct,    setSelAct]    = useState(null);
  const [editContent,setEditContent]=useState(null);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [addModal,  setAddModal]  = useState(false);
  const [newAct,    setNewAct]    = useState({type:"video",title:"",xp_reward:20});

  // Load units when prog/level changes
  useEffect(()=>{
    setSelUnit(null); setSelAct(null); setActivities([]);
    setLoading(true);
    const query = supabase.from("units")
      .select("id,unit_number,title,topic,published")
      .eq("program_id",prog).eq("published",true).order("unit_number");
    if(prog==="en") query.eq("level",level);
    query.then(({data})=>{ if(data) setUnits(data); setLoading(false); });
  },[prog,level]);

  // Load activities when unit changes
  useEffect(()=>{
    if(!selUnit){ setActivities([]); setSelAct(null); return; }
    supabase.from("unit_activities")
      .select("id,type,order_num,title,xp_reward,content,published")
      .eq("unit_id",selUnit).order("order_num")
      .then(({data})=>{ if(data) setActivities(data); setSelAct(null); });
  },[selUnit]);

  // Open edit
  function openEdit(act){
    setSelAct(act);
    setEditContent(JSON.parse(JSON.stringify(act.content||{})));
  }

  // Save activity
  async function saveActivity(){
    if(!selAct) return;
    setSaving(true);
    try{
      const {error}=await supabase.from("unit_activities")
        .update({content:editContent,title:selAct.title,xp_reward:selAct.xp_reward})
        .eq("id",selAct.id);
      if(error) throw error;
      setActivities(as=>as.map(a=>a.id===selAct.id?{...a,content:editContent,title:selAct.title,xp_reward:selAct.xp_reward}:a));
      showToast("✓ Actividad guardada");
    }catch(e){ showToast("Error: "+e.message,R); }
    finally{ setSaving(false); }
  }

  // Toggle publish
  async function togglePublish(act){
    const {error}=await supabase.from("unit_activities")
      .update({published:!act.published}).eq("id",act.id);
    if(error){ showToast("Error: "+error.message,R); return; }
    setActivities(as=>as.map(a=>a.id===act.id?{...a,published:!act.published}:a));
    showToast(!act.published?"Actividad publicada":"Actividad ocultada");
  }

  // Add activity
  async function addActivity(){
    if(!newAct.title||!selUnit){ showToast("Título requerido",R); return; }
    const maxOrder = Math.max(0,...activities.map(a=>a.order_num));
    const defaultContent = {
      video:    {youtube_id:"PLACEHOLDER",duration_min:10,description:"",key_points:[]},
      lesson:   {sections:[{title:"Nueva sección",content:"",highlight:""}],resources:[]},
      quiz:     {pass_score:70,time_limit_min:15,questions:[]},
      matching: {instructions:"",pairs:[{left:"",right:""}]},
      fill_blank:{instructions:"",word_bank:[],sentences:[{template:"___",answer:"",hint:""}]},
      roleplay: {scenario:"",context:"",steps:[{situation:"",options:[{text:"",correct:false,xp:0,feedback:""}]}]},
    };
    const {data,error}=await supabase.from("unit_activities")
      .insert({unit_id:selUnit,type:newAct.type,order_num:maxOrder+1,
               title:newAct.title,xp_reward:newAct.xp_reward||XP_DEFAULT[newAct.type],
               content:defaultContent[newAct.type]||{},published:false})
      .select().single();
    if(error){ showToast("Error: "+error.message,R); return; }
    setActivities(as=>[...as,data]);
    setAddModal(false);
    setNewAct({type:"video",title:"",xp_reward:20});
    showToast("✓ Actividad creada — editala antes de publicar");
  }

  // Delete activity
  async function deleteActivity(actId){
    if(!window.confirm("¿Eliminar esta actividad? Esta acción no se puede deshacer.")) return;
    await supabase.from("unit_activities").delete().eq("id",actId);
    setActivities(as=>as.filter(a=>a.id!==actId));
    if(selAct?.id===actId) setSelAct(null);
    showToast("Actividad eliminada");
  }

  // Video status helper
  const videoStatus = (act) => {
    if(act.type!=="video") return null;
    const id = act.content?.youtube_id;
    if(!id||id.startsWith("PLACEHOLDER")) return <Tag bg={AD} color={A}>Sin video</Tag>;
    return <Tag bg={GD} color={G}>✓ Video</Tag>;
  };

  return(
    <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:14,minHeight:500}}>

      {/* ── Left column: program → units ── */}
      <div>
        {/* Program selector */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>Programa</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {PROGRAMS.map(([id,label])=>(
              <button key={id} onClick={()=>{setProg(id);setLevel("A1");}}
                style={{padding:"8px 12px",borderRadius:9,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"left",background:prog===id?P:"var(--bg-surface-subtle)",color:prog===id?"#fff":"var(--text-secondary)"}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Level selector (only for EN) */}
        {prog==="en"&&(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>Nivel</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {LEVELS.map(l=>(
                <button key={l} onClick={()=>setLevel(l)}
                  style={{padding:"5px 12px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:level===l?P:"var(--bg-surface-subtle)",color:level===l?"#fff":"var(--text-secondary)"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Units list */}
        <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>Unidades</div>
        <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          {loading?<div style={{padding:16,textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>Cargando...</div>
          :units.length===0?<div style={{padding:16,fontSize:12,color:"var(--text-secondary)"}}>Sin unidades</div>
          :units.map(u=>(
            <div key={u.id} onClick={()=>setSelUnit(u.id)}
              style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--border-tertiary)",background:selUnit===u.id?PD:"transparent",borderLeft:`3px solid ${selUnit===u.id?P:"transparent"}`}}>
              <div style={{fontSize:12,fontWeight:600,color:selUnit===u.id?P:"var(--text-primary)"}}>U{u.unit_number}. {u.title}</div>
              {u.topic&&<div style={{fontSize:10,color:"var(--text-tertiary)",marginTop:1}}>{u.topic}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right column: activities + editor ── */}
      <div>
        {!selUnit?(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--text-tertiary)",fontSize:13}}>
            ← Seleccioná una unidad
          </div>
        ):!selAct?(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>
                {units.find(u=>u.id===selUnit)?.title}
                <span style={{fontSize:12,fontWeight:400,color:"var(--text-secondary)",marginLeft:8}}>{activities.length} actividades</span>
              </div>
              <button onClickCapture={e=>{e.stopPropagation();setAddModal(true);}}
                style={{padding:"7px 16px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                + Nueva actividad
              </button>
            </div>

            {activities.length===0?(
              <div style={{textAlign:"center",padding:"32px 20px",background:"var(--bg-surface)",border:"2px dashed var(--border)",borderRadius:14}}>
                <div style={{fontSize:32,marginBottom:8}}>📭</div>
                <div style={{fontSize:14,color:"var(--text-secondary)"}}>Sin actividades en esta unidad</div>
                <button onClickCapture={e=>{e.stopPropagation();setAddModal(true);}} style={{marginTop:10,padding:"8px 18px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  + Crear primera actividad
                </button>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {activities.map((act,idx)=>(
                  <div key={act.id} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:22,flexShrink:0}}>{TYPES.find(t=>t.id===act.type)?.icon||"📄"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:3}}>{act.title}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <Tag bg={PD} color={P}>{TYPES.find(t=>t.id===act.type)?.label}</Tag>
                        <Tag bg="var(--bg-surface-subtle)" color="var(--text-secondary)">+{act.xp_reward} XP</Tag>
                        {!act.published&&<Tag bg={RD} color={R}>Oculto</Tag>}
                        {videoStatus(act)}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      <button onClick={()=>openEdit(act)} style={{padding:"6px 12px",background:PD,color:P,border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✎ Editar</button>
                      <button onClick={()=>togglePublish(act)} style={{padding:"6px 10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>
                        {act.published?"Ocultar":"Publicar"}
                      </button>
                      <button onClick={()=>deleteActivity(act.id)} style={{padding:"6px 10px",background:RD,color:R,border:"none",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ):(
          /* Editor panel */
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <button onClick={()=>setSelAct(null)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:"var(--text-secondary)",fontSize:13,fontFamily:"inherit",padding:0}}>
                <i className="ti ti-arrow-left" style={{fontSize:15}}/> Volver
              </button>
              <SaveBtn onClick={saveActivity} saving={saving}/>
            </div>

            {/* Activity meta */}
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Título de la actividad</div>
                <input value={selAct.title} onChange={e=>setSelAct(a=>({...a,title:e.target.value}))}
                  style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:14,fontWeight:600,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>XP</div>
                <input type="number" value={selAct.xp_reward} onChange={e=>setSelAct(a=>({...a,xp_reward:+e.target.value}))}
                  style={{width:80,padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
            </div>

            {/* Type badge */}
            <div style={{marginBottom:14}}>
              <Tag bg={PD} color={P}>
                {TYPES.find(t=>t.id===selAct.type)?.icon} {TYPES.find(t=>t.id===selAct.type)?.label}
              </Tag>
            </div>

            {/* Type-specific editor */}
            {selAct.type==="video"     &&<VideoEditor     content={editContent} onChange={setEditContent}/>}
            {selAct.type==="lesson"    &&<LessonEditor    content={editContent} onChange={setEditContent}/>}
            {selAct.type==="quiz"      &&<QuizEditor      content={editContent} onChange={setEditContent}/>}
            {selAct.type==="matching"  &&<MatchingEditor  content={editContent} onChange={setEditContent}/>}
            {selAct.type==="fill_blank"&&<FillBlankEditor content={editContent} onChange={setEditContent}/>}
            {selAct.type==="roleplay"  &&<div style={{background:PD,borderRadius:10,padding:"12px 14px",fontSize:13,color:P}}><strong>Roleplay:</strong> para editar el escenario y pasos del roleplay contactá al equipo técnico o editá el JSON directamente en Supabase → unit_activities.</div>}

            <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
              <SaveBtn onClick={saveActivity} saving={saving}/>
            </div>
          </div>
        )}
      </div>

      {/* Add activity modal */}
      {addModal&&(
        <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setAddModal(false);}}>
          <div style={{background:"var(--bg-surface)",borderRadius:18,padding:24,width:420,maxWidth:"100%",border:"1px solid var(--border)",boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:18}}>Nueva actividad</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Tipo</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                {TYPES.map(t=>(
                  <button key={t.id} onClick={()=>setNewAct(a=>({...a,type:t.id,xp_reward:XP_DEFAULT[t.id]}))}
                    style={{padding:"8px 6px",borderRadius:9,border:`2px solid ${newAct.type===t.id?P:"var(--border)"}`,background:newAct.type===t.id?PD:"var(--bg-surface-subtle)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:newAct.type===t.id?P:"var(--text-secondary)"}}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Título *</div>
              <input value={newAct.title} onChange={e=>setNewAct(a=>({...a,title:e.target.value}))} placeholder="Ej: Introducción al marketing digital"
                style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>XP</div>
              <input type="number" value={newAct.xp_reward} onChange={e=>setNewAct(a=>({...a,xp_reward:+e.target.value}))}
                style={{width:100,padding:"9px 12px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setAddModal(false)} style={{flex:1,padding:"10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>Cancelar</button>
              <button onClickCapture={e=>{e.stopPropagation();addActivity();}} style={{flex:2,padding:"10px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                Crear actividad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
