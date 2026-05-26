// FillBlankActivity — fill in the blank from word bank
import { useState } from "react";

export function FillBlankActivity({ content, onComplete, completed }) {
  const { sentences = [], word_bank = [], instructions = "Completá las oraciones con la palabra correcta.", context } = content;
  const [answers, setAnswers]   = useState({});
  const [checked, setChecked]   = useState(false);
  const [results, setResults]   = useState({});

  const G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",P="#155266",A="#d97706";
  const allAnswered = Object.keys(answers).length === sentences.length;

  function check() {
    if (!allAnswered) return;
    const res = {};
    let correct = 0;
    sentences.forEach((s, i) => {
      const isCorrect = answers[i]?.toLowerCase().trim() === s.answer?.toLowerCase().trim();
      res[i] = isCorrect;
      if (isCorrect) correct++;
    });
    setResults(res);
    setChecked(true);
    const score = Math.round((correct / sentences.length) * 100);
    if (score >= 60) onComplete(score, 25);
  }

  function reset() {
    setAnswers({});
    setChecked(false);
    setResults({});
  }

  return (
    <div>
      <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:8, lineHeight:1.6 }}>{instructions}</div>

      {/* Context box */}
      {context && (
        <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#92400e", lineHeight:1.5 }}>
          <strong>Contexto:</strong> {context}
        </div>
      )}

      {/* Word bank */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>
          Banco de palabras
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {word_bank.map((w, i) => {
            const used = Object.values(answers).includes(w);
            return (
              <span key={i} style={{
                padding:"5px 12px", borderRadius:20, fontSize:13, fontWeight:600,
                background: used ? "var(--bg-surface-subtle)" : PD.replace ? "#e8f3f6" : PD,
                color: used ? "var(--text-tertiary)" : P,
                border:`1px solid ${used ? "var(--border)" : "#b3d4de"}`,
                cursor: used ? "default" : "pointer",
                textDecoration: used ? "line-through" : "none",
                userSelect:"none",
              }}>
                {w}
              </span>
            );
          })}
        </div>
      </div>

      {/* Sentences */}
      {sentences.map((s, i) => {
        const parts = s.template.split("___");
        const isCorrect  = checked && results[i] === true;
        const isWrong    = checked && results[i] === false;
        return (
          <div key={i} style={{
            background:"var(--bg-surface)", border:`2px solid ${isCorrect ? G : isWrong ? R : "var(--border)"}`,
            borderRadius:12, padding:12, marginBottom:10,
          }}>
            <div style={{ fontSize:14, color:"var(--text-primary)", lineHeight:2, marginBottom:8, whiteSpace:"pre-line" }}>
              {parts.map((part, pi) => (
                <span key={pi}>
                  {part}
                  {pi < parts.length - 1 && (
                    <select
                      disabled={checked}
                      value={answers[i] || ""}
                      onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                      style={{
                        display:"inline-block", margin:"0 4px",
                        padding:"3px 10px", borderRadius:7,
                        border:`2px solid ${isCorrect ? G : isWrong ? R : answers[i] ? P : "var(--border)"}`,
                        background: isCorrect ? GD : isWrong ? RD : "var(--bg-surface-subtle)",
                        color:"var(--text-primary)", fontSize:13, fontWeight:600,
                        fontFamily:"inherit", cursor: checked ? "default" : "pointer",
                      }}>
                      <option value="">Elegí...</option>
                      {word_bank.map((w, wi) => <option key={wi} value={w}>{w}</option>)}
                    </select>
                  )}
                </span>
              ))}
            </div>

            {/* Feedback */}
            {checked && (
              <div style={{ fontSize:11, marginTop:4 }}>
                {isCorrect
                  ? <span style={{ color:G, fontWeight:600 }}>✓ Correcto</span>
                  : <span style={{ color:R }}>✗ La respuesta correcta es: <strong>{s.answer}</strong></span>
                }
                {s.hint && <span style={{ color:"var(--text-tertiary)", marginLeft:8 }}>— {s.hint}</span>}
              </div>
            )}
          </div>
        );
      })}

      {!checked ? (
        <button onClick={check} disabled={!allAnswered}
          style={{
            width:"100%", padding:"14px", borderRadius:12, border:"none", fontFamily:"inherit",
            cursor: allAnswered ? "pointer" : "not-allowed",
            background: allAnswered ? P : "var(--bg-surface-subtle)",
            color: allAnswered ? "#fff" : "var(--text-tertiary)",
            fontSize:14, fontWeight:700,
          }}>
          {allAnswered ? "Verificar respuestas →" : `Completá los ${sentences.length - Object.keys(answers).length} espacios restantes`}
        </button>
      ) : (
        <div>
          <div style={{
            textAlign:"center", padding:"14px", marginBottom:10,
            background: Object.values(results).every(r=>r) ? GD : "#fffbeb",
            borderRadius:12,
            color: Object.values(results).every(r=>r) ? "#065f46" : A,
            fontWeight:700,
          }}>
            {Object.values(results).filter(r=>r).length}/{sentences.length} correctas
            {!Object.values(results).every(r=>r) && !completed && " — podés reintentar"}
          </div>
          {!completed && !Object.values(results).every(r=>r) && (
            <button onClick={reset}
              style={{ width:"100%", padding:"12px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:12, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)", fontWeight:600 }}>
              Reintentar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
