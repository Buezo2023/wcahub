// QuizActivity — timed multiple choice with feedback
import { useState, useEffect, useRef } from "react";

export function QuizActivity({ content, onComplete, completed, maxAttempts = 3 }) {
  const { questions = [], pass_score = 70, time_limit_min = 15 } = content;
  const [phase, setPhase]     = useState(completed ? "done" : "intro");
  const [answers, setAnswers] = useState({});
  const [result,  setResult]  = useState(null);
  const [timeLeft,setTimeLeft]= useState(time_limit_min * 60);
  const [attempts,setAttempts]= useState(0);
  const timerRef              = useRef(null);

  const G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706",P="#155266";
  const answered = Object.keys(answers).length;

  useEffect(() => {
    if (phase !== "taking") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submitQuiz(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  function submitQuiz() {
    clearInterval(timerRef.current);
    const correct = questions.reduce((sum, q, i) => sum + (answers[i] === q.ans ? 1 : 0), 0);
    const score   = Math.round((correct / questions.length) * 100);
    const passed  = score >= pass_score;
    setResult({ score, correct, passed });
    setAttempts(a => a + 1);
    setPhase("result");
    if (passed) onComplete(score, 50 + (score === 100 ? 50 : 0));
  }

  const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  if (phase === "intro") return (
    <div style={{ textAlign:"center", padding:24 }}>
      <div style={{ marginBottom:16 }}><i className="ti ti-file-text" style={{fontSize:48,color:"var(--wca-primary)"}} aria-hidden="true"/></div>
      <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", marginBottom:8 }}>
        {questions.length} preguntas · {time_limit_min} minutos
      </div>
      <div style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:6 }}>
        Necesitás {pass_score}% para aprobar · {maxAttempts} intentos disponibles
      </div>
      <div style={{ fontSize:13, color:"var(--text-tertiary)", marginBottom:24 }}>
        Una vez que empieces, el tiempo no se detiene.
      </div>
      <button onClick={() => { setPhase("taking"); setTimeLeft(time_limit_min*60); setAnswers({}); }}
        style={{ padding:"14px 32px", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
        Comenzar examen →
      </button>
    </div>
  );

  if (phase === "taking") return (
    <div>
      {/* Progress bar + timer */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, padding:"10px 16px", background:"var(--bg-surface)", borderRadius:12 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--text-secondary)" }}>
          {answered}/{questions.length} respondidas
        </div>
        <div style={{ fontSize:15, fontWeight:800, color: timeLeft < 60 ? R : P, fontFamily:"monospace" }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>
      <div style={{ height:4, background:"var(--bg-surface-subtle)", borderRadius:2, marginBottom:20, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${(answered/questions.length)*100}%`, background:P, borderRadius:2, transition:"width .3s" }}/>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginBottom:12 }}>
          <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", marginBottom:12, lineHeight:1.5 }}>
            <span style={{ color:P, fontWeight:800, marginRight:6 }}>{qi+1}.</span>{q.q}
          </div>
          {q.opts.map((opt, oi) => (
            <div key={oi} onClick={() => setAnswers(a=>({...a,[qi]:oi}))}
              style={{
                padding:"10px 14px", marginBottom:7, borderRadius:8, cursor:"pointer",
                border: `2px solid ${answers[qi]===oi ? P : "var(--border)"}`,
                background: answers[qi]===oi ? "#e8f3f6" : "var(--bg-surface-subtle)",
                fontSize:13, color:"var(--text-primary)", transition:"all .15s",
                display:"flex", alignItems:"center", gap:8,
              }}>
              <div style={{
                width:22, height:22, borderRadius:"50%", flexShrink:0,
                border: `2px solid ${answers[qi]===oi ? P : "var(--border-secondary)"}`,
                background: answers[qi]===oi ? P : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {answers[qi]===oi && <div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
              </div>
              {opt}
            </div>
          ))}
        </div>
      ))}

      <button onClick={submitQuiz} disabled={answered < questions.length}
        style={{
          width:"100%", padding:"14px", borderRadius:12, border:"none", fontFamily:"inherit",
          cursor: answered >= questions.length ? "pointer" : "not-allowed",
          background: answered >= questions.length ? P : "var(--bg-surface-subtle)",
          color: answered >= questions.length ? "#fff" : "var(--text-tertiary)",
          fontSize:14, fontWeight:700,
        }}>
        {answered >= questions.length ? "Enviar examen →" : `Respondé ${questions.length - answered} preguntas más`}
      </button>
    </div>
  );

  if (phase === "result" && result) return (
    <div>
      {/* Score circle */}
      <div style={{ textAlign:"center", padding:"24px 0 20px" }}>
        <div style={{
          width:100, height:100, borderRadius:"50%", margin:"0 auto 16px",
          background: result.passed ? GD : RD,
          border: `4px solid ${result.passed ? G : R}`,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{ fontSize:28, fontWeight:800, color: result.passed ? G : R, lineHeight:1 }}>{result.score}%</div>
          <div style={{ fontSize:11, color: result.passed ? G : R }}>score</div>
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", marginBottom:4 }}>
          {result.passed ? "🎉 ¡Aprobaste!" : "Casi — seguí practicando"}
        </div>
        <div style={{ fontSize:14, color:"var(--text-secondary)" }}>
          {result.correct}/{questions.length} correctas · Nota mínima: {pass_score}%
        </div>
        {result.passed && (
          <div style={{ marginTop:10, fontSize:14, fontWeight:700, color:A }}>
            +{50 + (result.score===100 ? 50 : 0)} XP ganados {result.score===100 ? "🌟 PERFECTO" : ""}
          </div>
        )}
      </div>

      {/* Answer review */}
      <div style={{ marginBottom:16 }}>
        {questions.map((q, qi) => {
          const isCorrect = answers[qi] === q.ans;
          return (
            <div key={qi} style={{
              background:"var(--bg-surface)", borderRadius:12, padding:12, marginBottom:8,
              borderLeft: `4px solid ${isCorrect ? G : R}`,
            }}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:6, lineHeight:1.5 }}>
                <span style={{ marginRight:6 }}>{isCorrect ? "✓" : "✗"}</span>{q.q}
              </div>
              {!isCorrect && (
                <div style={{ fontSize:12, color:G, marginBottom:4 }}>
                  ✓ Respuesta correcta: {q.opts[q.ans]}
                </div>
              )}
              {q.explanation && (
                <div style={{ fontSize:11, color:"var(--text-secondary)", lineHeight:1.5, background:"var(--bg-surface-subtle)", borderRadius:7, padding:"6px 10px" }}>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result.passed && attempts < maxAttempts && (
        <button onClick={() => { setPhase("intro"); setAnswers({}); setResult(null); }}
          style={{ width:"100%", padding:"14px", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginBottom:8 }}>
          Reintentar ({maxAttempts - attempts} intento{maxAttempts-attempts!==1?"s":""} restante{maxAttempts-attempts!==1?"s":""})
        </button>
      )}
    </div>
  );

  if (phase === "done") return (
    <div style={{ textAlign:"center", padding:24, background:GD, borderRadius:14 }}>
      <div style={{ marginBottom:8 }}><i className="ti ti-trophy" style={{fontSize:36,color:"var(--amber)"}} aria-hidden="true"/></div>
      <div style={{ fontSize:16, fontWeight:700, color:G }}>Examen completado</div>
    </div>
  );

  return null;
}
