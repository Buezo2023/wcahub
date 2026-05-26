// RoleplayActivity — scenario-based decision making
import { useState } from "react";

export function RoleplayActivity({ content, onComplete, completed }) {
  const { scenario, context, steps = [] } = content;
  const [step,     setStep]     = useState(0);
  const [chosen,   setChosen]   = useState({});
  const [revealed, setRevealed] = useState({});
  const [done,     setDone]     = useState(completed || false);

  const G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",P="#155266",PD="#e8f3f6",A="#d97706",AD="#fffbeb";

  const current = steps[step];
  const allDone = step >= steps.length;

  function choose(optIdx) {
    if (revealed[step] !== undefined) return;
    setChosen(c => ({ ...c, [step]: optIdx }));
    setRevealed(r => ({ ...r, [step]: true }));
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      setDone(true);
      const totalXp = steps.reduce((sum, s) => sum + (s.options[chosen[steps.indexOf(s)]]?.xp || 0), 0);
      const maxXp   = steps.reduce((sum, s) => sum + Math.max(...s.options.map(o => o.xp)), 0);
      const score   = maxXp > 0 ? Math.round((totalXp / maxXp) * 100) : 100;
      onComplete(score, totalXp);
    }
  }

  if (done) return (
    <div style={{ textAlign:"center", padding:24, background:GD, borderRadius:14 }}>
      <div style={{ marginBottom:8 }}><i className="ti ti-masks-theater" style={{fontSize:36,color:"var(--purple)"}} aria-hidden="true"/></div>
      <div style={{ fontSize:16, fontWeight:700, color:"#065f46" }}>
        ¡Roleplay completado! +{Object.values(chosen).reduce((sum, ci, si) => sum + (steps[si]?.options[ci]?.xp || 0), 0)} XP
      </div>
    </div>
  );

  return (
    <div>
      {/* Scenario card */}
      <div style={{ background:"linear-gradient(135deg,#0f3460,#155266)", borderRadius:12, padding:20, marginBottom:16, color:"#fff" }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, opacity:.6, marginBottom:6 }}>🎭 Escenario</div>
        <div style={{ fontSize:14, lineHeight:1.7, marginBottom:12 }}>{scenario}</div>
        {context && (
          <div style={{ background:"rgba(255,255,255,.1)", borderRadius:8, padding:"10px 13px", fontSize:12, lineHeight:1.6, opacity:.85 }}>
            <strong>Contexto:</strong> {context}
          </div>
        )}
      </div>

      {/* Step progress */}
      <div style={{ display:"flex", gap:4, marginBottom:16 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex:1, height:4, borderRadius:2,
            background: i < step ? G : i === step ? P : "var(--bg-surface-subtle)",
          }}/>
        ))}
      </div>

      {/* Current step */}
      {current && (
        <div>
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>
              Situación {step + 1} de {steps.length}
            </div>
            <div style={{ fontSize:14, color:"var(--text-primary)", fontWeight:600, lineHeight:1.6 }}>
              {current.situation}
            </div>
          </div>

          {/* Options */}
          {current.options.map((opt, oi) => {
            const isChosen  = chosen[step] === oi;
            const isReveal  = revealed[step] !== undefined;
            const isCorrect = opt.correct;
            let bg = "var(--bg-surface)";
            let border = "var(--border)";
            if (isReveal && isChosen) {
              bg     = isCorrect ? GD : RD;
              border = isCorrect ? G  : R;
            } else if (isReveal && isCorrect) {
              bg     = GD;
              border = G;
            }
            return (
              <div key={oi} onClick={() => choose(oi)}
                style={{
                  padding:12, marginBottom:8, borderRadius:12,
                  border:`2px solid ${border}`, background:bg,
                  cursor: isReveal ? "default" : "pointer",
                  transition:"all .2s", userSelect:"none",
                }}>
                <div style={{ fontSize:13, color:"var(--text-primary)", lineHeight:1.5, marginBottom: isReveal&&isChosen ? 8 : 0 }}>
                  {!isReveal && <span style={{ color:"var(--text-tertiary)", marginRight:6 }}>{String.fromCharCode(65+oi)}.</span>}
                  {isReveal && isChosen && <span style={{ marginRight:6 }}>{isCorrect ? "✅" : "❌"}</span>}
                  {isReveal && !isChosen && isCorrect && <i className="ti ti-circle-check" style={{color:"var(--green)",marginRight:6,fontSize:14}} aria-hidden="true"/>}
                  {opt.text}
                </div>
                {/* Feedback */}
                {isReveal && isChosen && opt.feedback && (
                  <div style={{ fontSize:12, color:"var(--text-secondary)", background:"rgba(0,0,0,.04)", borderRadius:7, padding:"7px 10px", lineHeight:1.5 }}>
                    {opt.feedback}
                  </div>
                )}
                {opt.xp > 0 && isReveal && isChosen && (
                  <div style={{ fontSize:11, color:A, fontWeight:700, marginTop:6 }}>+{opt.xp} XP</div>
                )}
              </div>
            );
          })}

          {/* Next button */}
          {revealed[step] !== undefined && (
            <button onClick={next}
              style={{ width:"100%", padding:"13px", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:6 }}>
              {step < steps.length - 1 ? `Siguiente situación →` : "Completar roleplay →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
