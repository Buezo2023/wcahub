import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const P = "#155266", Y = "#ffbb23", G = "#059669", GD = "#ecfdf5";

const QUESTIONS = [
  { id:1, level:"A1", q:"What is your name?", opts:["My name is María","I am have María","Name I María","Have name María"], ans:0 },
  { id:2, level:"A1", q:"___ is she? She is my sister.", opts:["Who","What","Where","How"], ans:0 },
  { id:3, level:"A1", q:"They ___ students.", opts:["are","is","am","be"], ans:0 },
  { id:4, level:"A2", q:"I ___ to the store yesterday.", opts:["went","go","goes","going"], ans:0 },
  { id:5, level:"A2", q:"She has lived here ___ five years.", opts:["for","since","during","from"], ans:0 },
  { id:6, level:"A2", q:"___ you ever been to Mexico?", opts:["Have","Has","Had","Did"], ans:0 },
  { id:7, level:"B1", q:"If I ___ you, I would apologize.", opts:["were","was","am","be"], ans:0 },
  { id:8, level:"B1", q:"The report ___ by the team last week.", opts:["was written","is written","wrote","writes"], ans:0 },
  { id:9, level:"B1", q:"By the time she arrived, we ___ waiting for two hours.", opts:["had been","have been","were","was"], ans:0 },
  { id:10, level:"B2", q:"___ he study harder, he might pass.", opts:["Should","Would","Could","Shall"], ans:0 },
  { id:11, level:"B2", q:"The phenomenon, ___ was first observed in 1985, remains poorly understood.", opts:["which","that","what","who"], ans:0 },
  { id:12, level:"B2", q:"She insisted that he ___ the documents immediately.", opts:["sign","signed","signs","signing"], ans:0 },
];

const levelMap = score => {
  if (score <= 2)  return { level:"A1", label:"Principiante", desc:"Comenzás desde cero con bases sólidas." };
  if (score <= 5)  return { level:"A2", label:"Básico",       desc:"Ya tenés nociones. Avanzás rápido." };
  if (score <= 8)  return { level:"B1", label:"Intermedio",   desc:"Podés comunicarte. Perfeccionás." };
  if (score <= 10) return { level:"B2", label:"Intermedio alto", desc:"Inglés sólido. Refinás detalles." };
  return               { level:"C1", label:"Avanzado",        desc:"Dominio profesional del idioma." };
};

export default function PlacementTest() {
  const navigate  = useNavigate();
  const [phase,   setPhase]   = useState("intro");
  const [form,    setForm]    = useState({ name:"", email:"", phone:"" });
  const [answers, setAnswers] = useState({});
  const [result,  setResult]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const answered = Object.keys(answers).length;
  const allDone  = answered === QUESTIONS.length;

  async function handleSubmit() {
    const correct = QUESTIONS.filter((q,i) => answers[i] === q.ans).length;
    const res     = levelMap(correct);
    setResult({ ...res, correct, score: Math.round((correct/QUESTIONS.length)*100) });
    setPhase("result");
    if (form.email) {
      setSaving(true);
      try {
        await supabase.from("leads").insert({
          full_name:     form.name || form.email.split("@")[0],
          email:         form.email,
          phone:         form.phone || null,
          source:        "Placement Test Web",
          stage:         "nuevo",
          test_score:    Math.round((correct/QUESTIONS.length)*100),
          level_interest: res.level,
          notes:         `Placement test público. Nivel detectado: ${res.level} (${res.label}). ${correct}/${QUESTIONS.length} correctas.`,
        });
        setSaved(true);
      } catch(e) { console.error(e); }
      finally { setSaving(false); }
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"20px 16px" }}>
      <div style={{ maxWidth:580, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <div style={{ width:42, height:42, borderRadius:10, background:P, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:22, fontWeight:900, color:Y }}>W</span>
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:P }}>WCA <span style={{ color:Y }}>Hub</span></div>
            <div style={{ fontSize:11, color:"#64748b" }}>World Connect Academy</div>
          </div>
          <button onClick={()=>navigate("/")} style={{ marginLeft:"auto", fontSize:12, padding:"6px 14px", background:"transparent", border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", color:"#475569", fontFamily:"inherit" }}>
            ← Volver
          </button>
        </div>

        {/* INTRO */}
        {phase === "intro" && (
          <div>
            <h1 style={{ fontSize:26, fontWeight:800, color:"#0f172a", marginBottom:6 }}>¿Cuál es tu nivel de inglés?</h1>
            <p style={{ fontSize:14, color:"#64748b", marginBottom:24, lineHeight:1.7 }}>
              12 preguntas de gramática. En 5 minutos sabés tu nivel exacto (A1 a C1) y el programa ideal para vos. Es gratis.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:24 }}>
              {[["📝","12 preguntas","Gramática A1-B2"],["⏱","~5 minutos","Sin límite de tiempo"],["🎯","Nivel exacto","A1, A2, B1, B2 o C1"]].map(([ic,t,s],i)=>(
                <div key={i} style={{ background:"#fff", borderRadius:10, padding:12, textAlign:"center", border:"1px solid #e2e8f0" }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{ic}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{t}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"#fff", borderRadius:12, padding:20, border:"1px solid #e2e8f0", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", marginBottom:12 }}>Dejá tu info para recibir el resultado (opcional)</div>
              {[["Nombre","name","text","María Rodríguez"],["Email","email","email","tu@email.com"],["WhatsApp","phone","tel","+504 9900-0000"]].map(([l,k,t,ph])=>(
                <div key={k} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:3 }}>{l}</label>
                  <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
                    style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, fontFamily:"inherit", color:"#0f172a" }}/>
                </div>
              ))}
            </div>
            <button onClick={()=>setPhase("test")}
              style={{ width:"100%", padding:"14px", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Comenzar test gratuito →
            </button>
            <div style={{ fontSize:11, color:"#94a3b8", textAlign:"center", marginTop:10 }}>Sin tarjeta de crédito · Resultado inmediato</div>
          </div>
        )}

        {/* TEST */}
        {phase === "test" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:6 }}>
              <span>{answered}/{QUESTIONS.length} respondidas</span>
              <span>{Math.round(answered/QUESTIONS.length*100)}%</span>
            </div>
            <div style={{ height:6, background:"#e2e8f0", borderRadius:4, marginBottom:20, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(answered/QUESTIONS.length)*100}%`, background:P, borderRadius:4, transition:"width .3s" }}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {QUESTIONS.map((q,qi)=>(
                <div key={q.id} style={{ background:"#fff", border:`1.5px solid ${answers[qi]!==undefined?P+"60":"#e2e8f0"}`, borderRadius:12, padding:18 }}>
                  <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, marginBottom:4 }}>Pregunta {qi+1} · {q.level}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#0f172a", marginBottom:12 }}>{q.q}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                    {q.opts.map((opt,oi)=>{
                      const sel = answers[qi]===oi;
                      return <button key={oi} onClick={()=>setAnswers(a=>({...a,[qi]:oi}))}
                        style={{ padding:"9px 12px", background:sel?"#e8f3f6":"#f8fafc", border:`1.5px solid ${sel?P:"#e2e8f0"}`, borderRadius:8, fontSize:13, cursor:"pointer", textAlign:"left", color:sel?P:"#475569", fontWeight:sel?600:400, fontFamily:"inherit" }}>
                        {opt}
                      </button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button disabled={!allDone} onClick={handleSubmit}
              style={{ width:"100%", marginTop:20, padding:"14px", background:allDone?P:"#e2e8f0", color:allDone?"#fff":"#94a3b8", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:allDone?"pointer":"not-allowed", fontFamily:"inherit" }}>
              {allDone ? "Ver mi nivel →" : `Respondé las ${QUESTIONS.length-answered} restantes`}
            </button>
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && result && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:8 }}>🎯</div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>Tu nivel de inglés es</div>
            <div style={{ fontSize:48, fontWeight:800, color:P, marginBottom:4 }}>{result.level}</div>
            <div style={{ fontSize:20, fontWeight:600, color:"#0f172a", marginBottom:8 }}>{result.label}</div>
            <div style={{ fontSize:14, color:"#64748b", marginBottom:20, lineHeight:1.7 }}>{result.desc}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxWidth:280, margin:"0 auto 24px" }}>
              <div style={{ background:"#f8fafc", borderRadius:10, padding:12 }}>
                <div style={{ fontSize:22, fontWeight:800, color:P }}>{result.correct}/{QUESTIONS.length}</div>
                <div style={{ fontSize:11, color:"#64748b" }}>correctas</div>
              </div>
              <div style={{ background:"#f8fafc", borderRadius:10, padding:12 }}>
                <div style={{ fontSize:22, fontWeight:800, color:P }}>{result.score}%</div>
                <div style={{ fontSize:11, color:"#64748b" }}>puntaje</div>
              </div>
            </div>
            {saved && <div style={{ background:GD, border:"1px solid #d1fae5", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#065f46", marginBottom:16 }}>✓ Resultado guardado. Te contactamos pronto.</div>}
            {saving && <div style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>Guardando resultado…</div>}
            <button onClick={()=>navigate("/")}
              style={{ width:"100%", padding:"14px", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginBottom:10 }}>
              Ver programas WCA →
            </button>
            <button onClick={()=>{ setPhase("intro"); setAnswers({}); setResult(null); setSaved(false); }}
              style={{ width:"100%", padding:"12px", background:"transparent", color:"#64748b", border:"1px solid #e2e8f0", borderRadius:12, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              Repetir el test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
