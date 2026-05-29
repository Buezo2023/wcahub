// ─── StudentSupportPanel ───────────────────────────────────────
// Portal estudiantil: crear, ver y responder tickets de soporte.
// RLS enforced: student only sees their own tickets (profile_id = auth.uid()).
// Internal messages are filtered server-side and client-side.
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase.js";

const P = "#155266", PD = "#e8f3f6", G = "#059669", GD = "#ecfdf5",
      R = "#dc2626", RD = "#fef2f2", A = "#d97706", AD = "#fffbeb";

const CATS = [
  { id:"acceso",        label:"Acceso",           icon:"🔐" },
  { id:"lms",           label:"LMS / Práctica",   icon:"🖥" },
  { id:"pagos",         label:"Pagos",            icon:"💳" },
  { id:"clases",        label:"Clases",           icon:"📹" },
  { id:"certificados",  label:"Certificados",     icon:"🏆" },
  { id:"perfil",        label:"Perfil",           icon:"👤" },
  { id:"otro",          label:"Otro",             icon:"💬" },
];

const ST_LABEL  = { abierto:"Abierto", en_revision:"En revisión",
  esperando_estudiante:"Esperando tu respuesta", resuelto:"Resuelto", cerrado:"Cerrado" };
const ST_COLOR  = { abierto:[AD,A], en_revision:[PD,P],
  esperando_estudiante:["#fdf4ff","#6b21a8"], resuelto:[GD,G], cerrado:["var(--bg-surface-subtle)","var(--text-tertiary)"] };

const CAT_MAP  = Object.fromEntries(CATS.map(c => [c.id, c]));

const Badge = ({ bg, color, children }) => (
  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:12, background:bg, color, fontWeight:600 }}>{children}</span>
);

async function safeAudit(payload) {
  try { await supabase.from("audit_log").insert(payload); }
  catch(e) { console.warn("[student-support] audit failed:", e?.message); }
}

export function StudentSupportPanel({ profileId, studentId, enrollments = [], payments = [], showToast }) {
  const mountedRef     = useRef(true);
  const [tickets,      setTickets]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [noTable,      setNoTable]      = useState(false);
  const [error,        setError]        = useState(null);
  const [detail,       setDetail]       = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [msgLoading,   setMsgLoading]   = useState(false);
  const [reply,        setReply]        = useState("");
  const [sending,      setSending]      = useState(false);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [creating,     setCreating]     = useState(false);
  const [form, setForm] = useState({
    category:"otro", priority:"media", subject:"", description:"",
    related_enrollment_id:"", related_payment_id:"",
  });

  const load = useCallback(async () => {
    if (!profileId) { setLoading(false); return; }
    setLoading(true); setError(null); setNoTable(false);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (mountedRef.current) { setError("La carga tardó demasiado. Intentá de nuevo."); setLoading(false); }
    }, 8000);
    try {
      const { data, error: qErr } = await supabase
        .from("support_tickets")
        .select("id, category, priority, status, subject, description, created_at, updated_at, closed_at")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (timedOut || !mountedRef.current) return;
      clearTimeout(timer);
      if (qErr) {
        if (qErr.message?.includes("does not exist") || qErr.code === "42P01") { setNoTable(true); return; }
        throw qErr;
      }
      setTickets(data || []);
    } catch(e) {
      clearTimeout(timer);
      if (!mountedRef.current) return;
      setError(e.message || "Error al cargar tickets");
    } finally {
      clearTimeout(timer);
      if (mountedRef.current && !timedOut) setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  async function loadMessages(ticketId) {
    setMsgLoading(true);
    try {
      const { data, error: mErr } = await supabase
        .from("support_ticket_messages")
        .select("id, message, internal, created_at, sender:profiles!support_ticket_messages_sender_profile_id_fkey(full_name)")
        .eq("ticket_id", ticketId)
        .eq("internal", false)    // student never sees internal notes
        .order("created_at");
      if (mErr) throw mErr;
      setMessages(data || []);
    } catch(e) {
      console.error("[student-support] loadMessages:", e?.message);
      setMessages([]);
    } finally { setMsgLoading(false); }
  }

  async function sendReply() {
    if (!reply.trim() || !detail || sending) return;
    setSending(true);
    try {
      const { error: mErr } = await supabase.from("support_ticket_messages").insert({
        ticket_id:         detail.id,
        sender_profile_id: profileId,
        message:           reply.trim(),
        internal:          false,   // student can NEVER set internal=true
      });
      if (mErr) throw mErr;
      // If ticket was waiting for student, move to en_revision
      if (detail.status === "esperando_estudiante") {
        await supabase.from("support_tickets")
          .update({ status: "en_revision" }).eq("id", detail.id);
        setDetail(d => ({ ...d, status: "en_revision" }));
        setTickets(ts => ts.map(t => t.id === detail.id ? { ...t, status: "en_revision" } : t));
      }
      setReply("");
      await loadMessages(detail.id);
      showToast?.("✓ Respuesta enviada");
    } catch(e) {
      showToast?.("Error: " + (e.message || "No se pudo enviar"), R);
    } finally { setSending(false); }
  }

  async function createTicket() {
    if (creating) return;
    if (!form.subject.trim() || !form.description.trim()) {
      showToast?.("Asunto y descripción son requeridos.", A); return;
    }
    setCreating(true);
    try {
      const insert = {
        profile_id:   profileId,
        student_id:   studentId || null,
        created_by:   profileId,
        category:     form.category,
        priority:     form.priority,
        subject:      form.subject.trim(),
        description:  form.description.trim(),
        source:       "portal",
        related_enrollment_id: form.related_enrollment_id || null,
        related_payment_id:    form.related_payment_id    || null,
      };
      const { data: newTicket, error: cErr } = await supabase
        .from("support_tickets").insert(insert).select("id").maybeSingle();
      if (cErr) throw cErr;
      await safeAudit({
        actor_id: profileId, action: "support_ticket_created",
        entity: "support_ticket", entity_id: newTicket?.id || null,
        metadata: { category: form.category, source: "portal" },
      });
      showToast?.("✓ Ticket enviado — el equipo lo revisará pronto");
      setCreateOpen(false);
      setForm({ category:"otro", priority:"media", subject:"", description:"", related_enrollment_id:"", related_payment_id:"" });
      load().catch(e => console.warn("[student-support] post-create reload:", e?.message));
    } catch(e) {
      showToast?.("Error: " + (e.message || "No se pudo crear el ticket"), R);
    } finally { setCreating(false); }
  }

  const kpis = {
    abierto: tickets.filter(t => t.status === "abierto").length,
    en_revision: tickets.filter(t => t.status === "en_revision").length,
    esperando: tickets.filter(t => t.status === "esperando_estudiante").length,
    resuelto: tickets.filter(t => t.status === "resuelto").length,
  };
  const shortId = id => id.slice(0, 8).toUpperCase();

  // ── No table ─────────────────────────────────────────────────
  if (noTable) return (
    <div style={{ padding:24, textAlign:"center", maxWidth:480, margin:"0 auto" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>🛠</div>
      <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>
        Módulo en preparación
      </div>
      <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.7 }}>
        El módulo de soporte aún no está disponible. Contactá a tu coordinadora académica.
      </div>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────
  if (error && !loading) return (
    <div style={{ padding:24, textAlign:"center" }}>
      <div style={{ fontSize:13, color:R, marginBottom:12 }}>{error}</div>
      <button onClick={load} style={{ padding:"8px 20px", background:P, color:"#fff", border:"none",
        borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Reintentar</button>
    </div>
  );

  // ── Detail view ───────────────────────────────────────────────
  if (detail) {
    const [stBg, stColor] = ST_COLOR[detail.status] || [AD, A];
    const closed = detail.status === "cerrado";
    return (
      <div style={{ padding:24, maxWidth:700, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button onClick={() => { setDetail(null); setMessages([]); }}
            style={{ padding:"7px 14px", background:"var(--bg-surface)", color:"var(--text-secondary)",
              border:"1px solid var(--border)", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            ← Volver
          </button>
          <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", flex:1 }}>{detail.subject}</div>
          <Badge bg={stBg} color={stColor}>{ST_LABEL[detail.status] || detail.status}</Badge>
        </div>

        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginBottom:16 }}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
            <Badge bg={PD} color={P}>{CAT_MAP[detail.category]?.icon} {CAT_MAP[detail.category]?.label || detail.category}</Badge>
            <Badge bg={AD} color={A}>{detail.priority}</Badge>
            <span style={{ fontSize:11, color:"var(--text-tertiary)" }}>#{shortId(detail.id)}</span>
            <span style={{ fontSize:11, color:"var(--text-tertiary)" }}>{new Date(detail.created_at).toLocaleDateString("es-HN", { day:"2-digit", month:"short", year:"numeric" })}</span>
          </div>
          {detail.description && (
            <div style={{ fontSize:13, color:"var(--text-primary)", lineHeight:1.7 }}>{detail.description}</div>
          )}
        </div>

        <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:10 }}>Conversación</div>
        {msgLoading
          ? <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:16 }}>Cargando mensajes...</div>
          : messages.length === 0
            ? <div style={{ fontSize:12, color:"var(--text-tertiary)", marginBottom:16, padding:"16px 0" }}>Sin mensajes todavía.</div>
            : messages.map(m => {
                const isMe = m.sender_profile_id === profileId || m.sender?.full_name === "Yo";
                return (
                  <div key={m.id} style={{ display:"flex", justifyContent:isMe?"flex-end":"flex-start", marginBottom:10 }}>
                    <div style={{ maxWidth:"80%", background:isMe?P:"var(--bg-surface)",
                      color:isMe?"#fff":"var(--text-primary)", border:isMe?"none":"1px solid var(--border)",
                      borderRadius:12, padding:"10px 14px" }}>
                      {!isMe && <div style={{ fontSize:11, fontWeight:700, marginBottom:4, color:P }}>{m.sender?.full_name || "Equipo WCA"}</div>}
                      <div style={{ fontSize:13, lineHeight:1.6 }}>{m.message}</div>
                      <div style={{ fontSize:10, marginTop:4, opacity:.6, textAlign:"right" }}>
                        {new Date(m.created_at).toLocaleTimeString("es-HN", { hour:"2-digit", minute:"2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })
        }

        {!closed && (
          <div style={{ marginTop:16, background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:14 }}>
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3}
              placeholder="Escribe tu respuesta..."
              style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8,
                fontSize:13, fontFamily:"inherit", background:"var(--bg-surface)", color:"var(--text-primary)",
                resize:"vertical", boxSizing:"border-box" }} />
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
              <button onClick={sendReply} disabled={sending || !reply.trim()}
                style={{ padding:"9px 22px", background:sending||!reply.trim()?"var(--bg-surface-subtle)":P,
                  color:sending||!reply.trim()?"var(--text-tertiary)":"#fff", border:"none",
                  borderRadius:8, fontSize:13, fontWeight:600, cursor:sending?"wait":"pointer", fontFamily:"inherit" }}>
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        )}
        {closed && (
          <div style={{ padding:"12px 16px", background:"var(--bg-surface-subtle)", borderRadius:10, fontSize:12, color:"var(--text-secondary)", textAlign:"center", marginTop:8 }}>
            Este ticket está cerrado. Para un nuevo problema, creá un nuevo ticket.
          </div>
        )}
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────
  return (
    <div style={{ padding:24, maxWidth:800, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)" }}>Soporte Estudiantil</div>
          <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:4, lineHeight:1.6 }}>
            Reportá problemas de acceso, pagos, LMS, clases o certificados.<br/>Nuestro equipo revisará tu caso.
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          style={{ padding:"10px 20px", background:P, color:"#fff", border:"none",
            borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
          + Crear ticket
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label:"Abiertos",     value:kpis.abierto,    c:A,  bg:AD },
          { label:"En revisión",  value:kpis.en_revision,c:P,  bg:PD },
          { label:"Te esperan",   value:kpis.esperando,  c:"#6b21a8", bg:"#fdf4ff" },
          { label:"Resueltos",    value:kpis.resuelto,   c:G,  bg:GD },
        ].map(k => (
          <div key={k.label} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)",
            borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:k.c }}>{k.value}</div>
            <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Ticket list */}
      {loading
        ? <div style={{ padding:24, textAlign:"center", color:"var(--text-secondary)", fontSize:13 }}>Cargando tickets...</div>
        : tickets.length === 0
          ? <div style={{ padding:40, textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🎧</div>
              <div style={{ fontSize:14, color:"var(--text-secondary)" }}>No tienes tickets de soporte todavía.</div>
              <div style={{ fontSize:12, color:"var(--text-tertiary)", marginTop:4 }}>Usá el botón "Crear ticket" si necesitás ayuda.</div>
            </div>
          : <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
              {tickets.map((t, i) => {
                const [bg, color] = ST_COLOR[t.status] || [AD, A];
                const cat = CAT_MAP[t.category];
                return (
                  <div key={t.id}
                    onClick={async () => { setDetail(t); await loadMessages(t.id); }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-subtle)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                    style={{ padding:"14px 18px", cursor:"pointer", transition:"background .1s",
                      borderTop: i > 0 ? "1px solid var(--border-tertiary)" : "none",
                      display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:36, height:36, background:PD, borderRadius:9, display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                      {cat?.icon || "💬"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.subject}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>
                        {cat?.label || t.category} · {new Date(t.created_at).toLocaleDateString("es-HN", { day:"2-digit", month:"short" })}
                      </div>
                    </div>
                    <Badge bg={bg} color={color}>{ST_LABEL[t.status] || t.status}</Badge>
                    <div style={{ color:"var(--text-tertiary)", fontSize:16 }}>›</div>
                  </div>
                );
              })}
            </div>
      }

      {/* Create modal */}
      {createOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:60,
          display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => !creating && setCreateOpen(false)}>
          <div style={{ background:"var(--bg-surface)", borderRadius:16, padding:28,
            maxWidth:480, width:"92%", maxHeight:"90vh", overflowY:"auto",
            boxShadow:"0 8px 32px rgba(0,0,0,.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)", marginBottom:16 }}>Crear ticket de soporte</div>

            {/* Category */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginBottom:6 }}>Categoría</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {CATS.map(c => (
                  <button key={c.id} onClick={() => setForm(f => ({ ...f, category:c.id }))}
                    style={{ padding:"6px 12px", borderRadius:8, fontSize:12, cursor:"pointer",
                      fontFamily:"inherit", fontWeight:form.category === c.id ? 700 : 400,
                      background: form.category === c.id ? P : "var(--bg-surface-subtle)",
                      color: form.category === c.id ? "#fff" : "var(--text-secondary)",
                      border: form.category === c.id ? "none" : "1px solid var(--border)" }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginBottom:4 }}>Asunto *</div>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject:e.target.value }))}
                placeholder="Describí brevemente el problema..."
                style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8,
                  fontSize:13, fontFamily:"inherit", background:"var(--bg-surface)", color:"var(--text-primary)",
                  boxSizing:"border-box" }} />
            </div>

            {/* Description */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginBottom:4 }}>Descripción *</div>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))}
                placeholder="Contanos con más detalle qué pasó, cuándo ocurrió y qué intentaste hacer..."
                rows={4} style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8,
                  fontSize:13, fontFamily:"inherit", background:"var(--bg-surface)", color:"var(--text-primary)",
                  resize:"vertical", boxSizing:"border-box" }} />
            </div>

            {/* Relacionar con enrollment o pago */}
            {enrollments.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginBottom:4 }}>Relacionar con matrícula (opcional)</div>
                <select value={form.related_enrollment_id} onChange={e => setForm(f => ({ ...f, related_enrollment_id:e.target.value }))}
                  style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8,
                    fontSize:13, fontFamily:"inherit", background:"var(--bg-surface)", color:"var(--text-primary)" }}>
                  <option value="">— No relacionar —</option>
                  {enrollments.map(e => <option key={e.id} value={e.id}>{e.program_id?.toUpperCase()} ({e.status})</option>)}
                </select>
              </div>
            )}

            <div style={{ display:"flex", gap:10, marginTop:18 }}>
              <button onClick={createTicket} disabled={creating || !form.subject.trim() || !form.description.trim()}
                style={{ flex:1, padding:"11px 0", border:"none", borderRadius:10, fontSize:14, fontWeight:700,
                  cursor: creating || !form.subject.trim() ? "not-allowed" : "pointer", fontFamily:"inherit",
                  background: creating || !form.subject.trim() ? "var(--bg-surface-subtle)" : P,
                  color: creating || !form.subject.trim() ? "var(--text-tertiary)" : "#fff" }}>
                {creating ? "Enviando..." : "Enviar ticket"}
              </button>
              <button onClick={() => { if (!creating) { setCreateOpen(false); setForm({ category:"otro", priority:"media", subject:"", description:"", related_enrollment_id:"", related_payment_id:"" }); } }}
                style={{ padding:"11px 18px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)",
                  border:"1px solid var(--border)", borderRadius:10, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
