// ─── SoporteSection — Soporte Estudiantil ──────────────────────
// Requiere ejecutar supabase/support-tickets.sql en Supabase.
// Maneja gracefully si las tablas no existen.
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

const P="#155266", PD="#e8f3f6", G="#059669", GD="#ecfdf5",
      R="#dc2626", RD="#fef2f2", A="#d97706", AD="#fffbeb",
      V="#7c3aed", VD="#f5f3ff";

const CATS     = ["acceso","lms","pagos","clases","certificados","perfil","otro"];
const CAT_ICON = { acceso:"🔐", lms:"🖥", pagos:"💳", clases:"📹", certificados:"🏆", perfil:"👤", otro:"💬" };
const CAT_LABEL= { acceso:"Acceso", lms:"LMS", pagos:"Pagos", clases:"Clases", certificados:"Certificados", perfil:"Perfil", otro:"Otro" };
const PRI_COLOR= { baja:[PD,P], media:[AD,A], alta:["#fef9c3","#92400e"], urgente:[RD,R] };
const ST_COLOR = { abierto:[AD,A], en_revision:[PD,P], esperando_estudiante:["#fdf4ff","#6b21a8"], resuelto:[GD,G], cerrado:["var(--bg-surface-subtle)","var(--text-tertiary)"] };
const ST_LABEL = { abierto:"Abierto", en_revision:"En revisión", esperando_estudiante:"Esperando estudiante", resuelto:"Resuelto", cerrado:"Cerrado" };
const TABS     = [["todos","Todos"],["abierto","Abiertos"],["en_revision","En revisión"],["esperando_estudiante","Esperando"],["resuelto","Resueltos"],["cerrado","Cerrados"]];

const Badge = ({bg,color,children})=>(
  <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:bg,color,fontWeight:600}}>{children}</span>
);

// ── safeAudit: audit_log is non-blocking — never throws ─────────
async function safeAudit(sb, payload) {
  try { await sb.from("audit_log").insert(payload); }
  catch(e) { console.warn("[support] audit_log failed:", e?.message); }
}

export function SoporteSection({ showToast }) {
  const [tickets,    setTickets]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState(null);
  const [noTable,    setNoTable]   = useState(false);
  const [tab,        setTab]       = useState("todos");
  const [detail,     setDetail]    = useState(null);   // selected ticket
  const [messages,   setMessages]  = useState([]);
  const [msgLoading, setMsgLoading]= useState(false);
  const [reply,      setReply]     = useState("");
  const [internal,   setInternal]  = useState(false);
  const [sending,    setSending]   = useState(false);
  const [createOpen, setCreateOpen]= useState(false);
  const [form, setForm] = useState({ email:"", category:"otro", priority:"media", subject:"", description:"" });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null); setNoTable(false);
    try {
      const { data, error: qErr } = await supabase
        .from("support_tickets")
        .select(`id, subject, category, priority, status, created_at, updated_at, closed_at, source,
          profile:profiles!support_tickets_profile_id_fkey(full_name, email),
          student:students!support_tickets_student_id_fkey(student_code, level),
          assignee:profiles!support_tickets_assigned_to_fkey(full_name)`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (qErr) {
        if (qErr.message?.includes("does not exist") || qErr.code === "42P01") {
          setNoTable(true); return;
        }
        throw qErr;
      }
      setTickets(data || []);
    } catch(e) {
      setError(e.message || "Error al cargar tickets");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadMessages(ticketId) {
    setMsgLoading(true);
    try {
      const { data, error: mErr } = await supabase.from("support_ticket_messages")
        .select("id, message, internal, created_at, sender:profiles!support_ticket_messages_sender_profile_id_fkey(full_name, email)")
        .eq("ticket_id", ticketId).order("created_at");
      if (mErr) throw mErr;
      setMessages(data || []);
    } catch(e) {
      console.error("[support] loadMessages failed:", e?.message);
      setMessages([]);
    } finally {
      setMsgLoading(false); // always reset — never leaves msgLoading stuck
    }
  }

  async function openDetail(t) {
    setDetail(t); setReply(""); setInternal(false);
    await loadMessages(t.id);
  }

  async function sendReply() {
    if (!reply.trim() || !detail) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: mErr } = await supabase.from("support_ticket_messages").insert({
        ticket_id: detail.id, sender_profile_id: user.id,
        message: reply.trim(), internal,
      });
      if (mErr) throw mErr;
      await safeAudit(supabase, {
        actor_id: user.id, action: "support_ticket_replied",
        entity: "support_ticket", entity_id: detail.id,
        metadata: { internal },
      });
      setReply(""); setInternal(false);
      await loadMessages(detail.id);
      showToast?.("✓ Respuesta enviada");
    } catch(e) {
      showToast?.("Error: " + e.message, R);
    } finally { setSending(false); }
  }

  async function changeStatus(ticketId, newStatus) {
    const { data: { user } } = await supabase.auth.getUser();
    const update = { status: newStatus };
    if (newStatus === "cerrado") update.closed_at = new Date().toISOString();
    const { error: uErr } = await supabase.from("support_tickets").update(update).eq("id", ticketId);
    if (uErr) { showToast?.("Error: " + uErr.message, R); return; }
    await safeAudit(supabase, {
      actor_id: user.id, action: "support_ticket_status_changed",
      entity: "support_ticket", entity_id: ticketId,
      metadata: { new_status: newStatus },
    });
    showToast?.("✓ Estado actualizado");
    // Refresh detail and list
    setDetail(d => d?.id === ticketId ? { ...d, status: newStatus } : d);
    setTickets(ts => ts.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
  }

  async function assignToMe(ticketId) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error: aErr } = await supabase.from("support_tickets")
      .update({ assigned_to: user.id }).eq("id", ticketId);
    if (aErr) { showToast?.("Error: " + aErr.message, R); return; }
    await safeAudit(supabase, {
      actor_id: user.id, action: "support_ticket_assigned",
      entity: "support_ticket", entity_id: ticketId,
      metadata: { assigned_to: user.id },
    });
    showToast?.("✓ Ticket asignado a ti");
    await load();
    setDetail(d => d?.id === ticketId ? { ...d, assignee: { full_name: "Yo" } } : d);
  }

  async function createTicket() {
    if (creating) return; // anti double-submit guard
    if (!form.subject.trim() || !form.description.trim()) {
      showToast?.("Asunto y descripción son requeridos", A); return;
    }
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Find profile_id from email if provided
      let profileId = null, studentId = null;
      if (form.email.trim()) {
        try {
          const { data: prof } = await supabase.from("profiles")
            .select("id, students(id)").eq("email", form.email.toLowerCase()).maybeSingle();
          if (prof) {
            profileId = prof.id;
            studentId = prof.students?.[0]?.id || null;
          }
          // Email not found → create ticket without student link, no error thrown
        } catch(lookupErr) {
          console.warn("[support] profile lookup failed (non-fatal):", lookupErr?.message);
        }
      }
      const { error: cErr } = await supabase.from("support_tickets").insert({
        profile_id: profileId, student_id: studentId,
        created_by: user.id,
        category: form.category, priority: form.priority,
        subject: form.subject.trim(), description: form.description.trim(),
        source: "admin",
      });
      if (cErr) throw cErr;
      await safeAudit(supabase, {
        actor_id: user.id, action: "support_ticket_created",
        entity: "support_ticket", entity_id: null,
        metadata: { category: form.category, source: "admin" },
      });
      showToast?.("✓ Ticket creado");
      setCreateOpen(false);
      setForm({ email:"", category:"otro", priority:"media", subject:"", description:"" });
      await load();
    } catch(e) {
      showToast?.("Error: " + e.message, R);
    } finally { setCreating(false); }
  }

  const filtered = tab === "todos" ? tickets : tickets.filter(t => t.status === tab);
  const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const kpis = {
    open:    tickets.filter(t => t.status === "abierto").length,
    urgent:  tickets.filter(t => t.priority === "urgente" && t.status !== "cerrado").length,
    review:  tickets.filter(t => t.status === "en_revision").length,
    resolved:tickets.filter(t => t.status === "resuelto" && t.updated_at >= monthStart).length,
  };

  const shortId = id => id.slice(0, 8).toUpperCase();

  // ── No table state ────────────────────────────────────────────
  if (noTable) return (
    <div style={{padding:32,maxWidth:600,margin:"0 auto",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>🗄</div>
      <div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",marginBottom:8}}>Módulo no inicializado</div>
      <div style={{fontSize:14,color:"var(--text-secondary)",lineHeight:1.7,marginBottom:20}}>
        El módulo de soporte requiere ejecutar el script SQL antes de usarlo.
      </div>
      <div style={{background:PD,borderRadius:12,padding:"14px 18px",fontSize:13,color:P,fontFamily:"monospace",marginBottom:20,textAlign:"left"}}>
        Ejecutar en Supabase SQL Editor:<br/>
        <strong>supabase/support-tickets.sql</strong>
      </div>
      <button onClick={load} style={{padding:"10px 24px",background:P,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🔄 Reintentar</button>
    </div>
  );

  // ── Error state ───────────────────────────────────────────────
  if (error) return (
    <div style={{padding:32,textAlign:"center"}}>
      <div style={{fontSize:13,color:R,marginBottom:12}}>{error}</div>
      <button onClick={load} style={{padding:"9px 20px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Reintentar</button>
    </div>
  );

  // ── Detail view ───────────────────────────────────────────────
  if (detail) return (
    <div style={{padding:24,maxWidth:860,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button onClick={()=>setDetail(null)} style={{padding:"7px 14px",background:"var(--bg-surface)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>← Volver</button>
        <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",flex:1}}>{detail.subject}</div>
        <Badge {...(ST_COLOR[detail.status]||[AD,A]).reduce((o,v,i)=>({...o,[i?"color":"bg"]:v}),{})}>{ST_LABEL[detail.status]||detail.status}</Badge>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:16}}>
        {/* Messages */}
        <div>
          <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Descripción inicial</div>
            <div style={{fontSize:14,color:"var(--text-primary)",lineHeight:1.7}}>{detail.description || "Sin descripción."}</div>
          </div>

          <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:10}}>Historial de mensajes</div>
          {msgLoading
            ? <div style={{fontSize:12,color:"var(--text-secondary)"}}>Cargando...</div>
            : messages.length === 0
              ? <div style={{fontSize:12,color:"var(--text-tertiary)",padding:"12px 0"}}>Sin mensajes todavía.</div>
              : messages.map(m => (
                <div key={m.id} style={{background:m.internal?"#fdf4ff":"var(--bg-surface)",border:`1px solid ${m.internal?"#e9d5ff":"var(--border)"}`,borderRadius:10,padding:"12px 16px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:700,color:m.internal?"#6b21a8":P}}>{m.sender?.full_name||m.sender?.email||"—"} {m.internal&&<span style={{fontSize:10,background:VD,color:V,padding:"1px 6px",borderRadius:6}}>INTERNA</span>}</div>
                    <div style={{fontSize:11,color:"var(--text-tertiary)"}}>{new Date(m.created_at).toLocaleString("es-HN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                  </div>
                  <div style={{fontSize:13,color:"var(--text-primary)",lineHeight:1.6}}>{m.message}</div>
                </div>
              ))
          }

          {/* Reply box */}
          {detail.status !== "cerrado" && (
            <div style={{marginTop:16,background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
              <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3}
                placeholder="Escribí tu respuesta..."
                style={{width:"100%",padding:10,border:"1px solid var(--border)",borderRadius:8,fontSize:13,fontFamily:"inherit",background:"var(--bg-surface)",color:"var(--text-primary)",resize:"vertical",boxSizing:"border-box"}}/>
              <div style={{display:"flex",alignItems:"center",gap:12,marginTop:10}}>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--text-secondary)",cursor:"pointer"}}>
                  <input type="checkbox" checked={internal} onChange={e=>setInternal(e.target.checked)}/> Nota interna (solo staff)
                </label>
                <div style={{flex:1}}/>
                <button onClick={sendReply} disabled={sending||!reply.trim()}
                  style={{padding:"8px 18px",background:sending||!reply.trim()?"var(--bg-surface-subtle)":P,color:sending||!reply.trim()?"var(--text-tertiary)":"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:sending?"wait":"pointer",fontFamily:"inherit"}}>
                  {sending?"Enviando...":"Enviar respuesta"}
                </button>
                <button onClick={()=>changeStatus(detail.id,"resuelto")} disabled={detail.status==="resuelto"}
                  style={{padding:"8px 14px",background:detail.status==="resuelto"?GD:"#ecfdf5",color:G,border:`1px solid ${G}40`,borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  ✓ Resolver
                </button>
                <button onClick={()=>changeStatus(detail.id,"cerrado")}
                  style={{padding:"8px 14px",background:"var(--bg-surface-subtle)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side info */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text-tertiary)",marginBottom:10,textTransform:"uppercase"}}>Información</div>
            {[
              ["ID", shortId(detail.id)],
              ["Categoría", `${CAT_ICON[detail.category]||"💬"} ${CAT_LABEL[detail.category]||detail.category}`],
              ["Estudiante", detail.profile?.full_name || "—"],
              ["Email", detail.profile?.email || "—"],
              ["Asignado a", detail.assignee?.full_name || "Sin asignar"],
              ["Creado", new Date(detail.created_at).toLocaleDateString("es-HN",{day:"2-digit",month:"short",year:"numeric"})],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,color:"var(--text-secondary)"}}>{k}</span>
                <span style={{fontSize:12,color:"var(--text-primary)",fontWeight:600,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text-tertiary)",marginBottom:10,textTransform:"uppercase"}}>Acciones</div>
            {[
              ["en_revision","🔍 Marcar en revisión"],
              ["esperando_estudiante","⏳ Esperando estudiante"],
              ["resuelto","✓ Marcar resuelto"],
              ["cerrado","🔒 Cerrar ticket"],
            ].map(([s,lbl])=>(
              <button key={s} onClick={()=>changeStatus(detail.id,s)} disabled={detail.status===s}
                style={{width:"100%",padding:"8px 12px",background:detail.status===s?"var(--bg-surface-subtle)":"var(--bg-surface)",color:detail.status===s?"var(--text-tertiary)":"var(--text-primary)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:detail.status===s?"default":"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:6}}>
                {lbl}
              </button>
            ))}
            <button onClick={()=>assignToMe(detail.id)}
              style={{width:"100%",padding:"8px 12px",background:PD,color:P,border:`1px solid ${P}30`,borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:6}}>
              👤 Asignar a mí
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── List view ─────────────────────────────────────────────────
  return (
    <div style={{padding:24,maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"var(--text-primary)"}}>Soporte Estudiantil</div>
          <div style={{fontSize:13,color:"var(--text-secondary)",marginTop:2}}>Gestión de tickets de soporte para estudiantes de World Connect Academy.</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{padding:"8px 14px",background:"var(--bg-surface)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🔄 Refrescar</button>
          <button onClick={()=>setCreateOpen(true)} style={{padding:"8px 18px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Crear ticket</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Abiertos",value:kpis.open,c:A,bg:AD,icon:"📋"},
          {label:"Urgentes",value:kpis.urgent,c:R,bg:RD,icon:"🔴"},
          {label:"En revisión",value:kpis.review,c:P,bg:PD,icon:"🔍"},
          {label:"Resueltos (mes)",value:kpis.resolved,c:G,bg:GD,icon:"✅"},
        ].map(k=>(
          <div key={k.label} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{k.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:k.c}}>{k.value}</div>
            <div style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:"7px 14px",background:tab===id?P:"var(--bg-surface)",color:tab===id?"#fff":"var(--text-secondary)",border:tab===id?"none":"1px solid var(--border)",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            {label}{id==="abierto"&&kpis.open>0?` (${kpis.open})`:""}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        {loading
          ? <div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando tickets...</div>
          : filtered.length === 0
            ? <div style={{padding:40,textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:8}}>🎧</div>
                <div style={{fontSize:14,color:"var(--text-secondary)"}}>No hay tickets de soporte todavía.</div>
              </div>
            : <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"var(--bg-surface-subtle)"}}>
                      {["ID","Estudiante","Categoría","Prioridad","Estado","Asignado a","Fecha","Acciones"].map(h=>(
                        <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t=>(
                      <tr key={t.id}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--bg-surface-subtle)"}
                        onMouseLeave={e=>e.currentTarget.style.background=""}
                        style={{borderTop:"1px solid var(--border-tertiary)",cursor:"pointer",transition:"background .1s"}}
                        onClick={()=>openDetail(t)}>
                        <td style={{padding:"10px 12px",fontFamily:"monospace",fontSize:11,color:P,fontWeight:700}}>{shortId(t.id)}</td>
                        <td style={{padding:"10px 12px"}}>
                          <div style={{fontWeight:600,color:"var(--text-primary)"}}>{t.profile?.full_name||"—"}</div>
                          <div style={{fontSize:11,color:"var(--text-secondary)"}}>{t.profile?.email||""}</div>
                        </td>
                        <td style={{padding:"10px 12px"}}><span style={{fontSize:12}}>{CAT_ICON[t.category]||"💬"} {CAT_LABEL[t.category]||t.category}</span></td>
                        <td style={{padding:"10px 12px"}}><Badge bg={(PRI_COLOR[t.priority]||[AD,A])[0]} color={(PRI_COLOR[t.priority]||[AD,A])[1]}>{t.priority}</Badge></td>
                        <td style={{padding:"10px 12px"}}><Badge bg={(ST_COLOR[t.status]||[AD,A])[0]} color={(ST_COLOR[t.status]||[AD,A])[1]}>{ST_LABEL[t.status]||t.status}</Badge></td>
                        <td style={{padding:"10px 12px",fontSize:12,color:"var(--text-secondary)"}}>{t.assignee?.full_name||"—"}</td>
                        <td style={{padding:"10px 12px",fontSize:11,color:"var(--text-secondary)",whiteSpace:"nowrap"}}>{new Date(t.created_at).toLocaleDateString("es-HN",{day:"2-digit",month:"short"})}</td>
                        <td style={{padding:"10px 12px"}}>
                          <button onClick={e=>{e.stopPropagation();openDetail(t);}}
                            style={{fontSize:11,padding:"4px 10px",background:PD,color:P,border:`1px solid ${P}40`,borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Ver</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>

      {/* Create ticket modal */}
      {createOpen && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>!creating&&setCreateOpen(false)}>
          <div style={{background:"var(--bg-surface)",borderRadius:16,padding:28,maxWidth:500,width:"90%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,.2)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:16}}>Crear ticket de soporte</div>
            {[
              ["Email del estudiante (opcional)","email","text",form.email],
              ["Asunto *","subject","text",form.subject],
            ].map(([label,key,type,val])=>(
              <div key={key} style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>{label}</div>
                <input type={type} value={val} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                  style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,fontFamily:"inherit",background:"var(--bg-surface)",color:"var(--text-primary)",boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>Categoría</div>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                  style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,fontFamily:"inherit",background:"var(--bg-surface)",color:"var(--text-primary)"}}>
                  {CATS.map(c=><option key={c} value={c}>{CAT_ICON[c]} {CAT_LABEL[c]}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>Prioridad</div>
                <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}
                  style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,fontFamily:"inherit",background:"var(--bg-surface)",color:"var(--text-primary)"}}>
                  {["baja","media","alta","urgente"].map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>Descripción *</div>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={4}
                placeholder="Describí el problema en detalle..."
                style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,fontFamily:"inherit",background:"var(--bg-surface)",color:"var(--text-primary)",resize:"vertical",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={createTicket} disabled={creating||!form.subject.trim()||!form.description.trim()}
                style={{flex:1,padding:"10px 0",background:creating||!form.subject.trim()?"var(--bg-surface-subtle)":P,color:creating||!form.subject.trim()?"var(--text-tertiary)":"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:creating?"wait":"pointer",fontFamily:"inherit"}}>
                {creating?"Creando...":"Crear ticket"}
              </button>
              <button onClick={()=>setCreateOpen(false)} disabled={creating}
                style={{padding:"10px 18px",background:"var(--bg-surface-subtle)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:10,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
