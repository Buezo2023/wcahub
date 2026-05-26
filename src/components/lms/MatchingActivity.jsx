// MatchingActivity — drag or tap to match pairs
import { useState } from "react";

export function MatchingActivity({ content, onComplete, completed }) {
  const { pairs = [], instructions = "Relacioná cada concepto con su definición." } = content;
  const [selected, setSelected] = useState(null);      // { side:'left'|'right', index }
  const [matches, setMatches]   = useState({});         // { leftIdx: rightIdx }
  const [wrong,   setWrong]     = useState(null);
  const [checked, setChecked]   = useState(false);

  // Shuffle right side once
  const [shuffled] = useState(() => {
    const idx = pairs.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });

  const G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",P="#155266",PD="#e8f3f6";
  const allMatched = Object.keys(matches).length === pairs.length;

  function select(side, index) {
    if (checked) return;
    if (!selected) { setSelected({ side, index }); return; }
    if (selected.side === side) { setSelected({ side, index }); return; }

    // Attempt a match
    const leftIdx  = side === "left"  ? index : selected.index;
    const rightIdx = side === "right" ? index : selected.index;
    const rightOriginal = shuffled[rightIdx];

    if (leftIdx === rightOriginal) {
      // Correct match
      setMatches(m => ({ ...m, [leftIdx]: rightIdx }));
      setSelected(null);
    } else {
      // Wrong match — flash
      setWrong({ left: leftIdx, right: rightIdx });
      setTimeout(() => { setWrong(null); setSelected(null); }, 800);
    }
  }

  function isMatched(side, idx) {
    if (side === "left")  return matches[idx] !== undefined;
    return Object.values(matches).includes(idx);
  }

  function getScore() {
    return Math.round((Object.keys(matches).length / pairs.length) * 100);
  }

  return (
    <div>
      <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:16, lineHeight:1.6 }}>{instructions}</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
        {/* Left column */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Concepto</div>
          {pairs.map((p, i) => {
            const matched = matches[i] !== undefined;
            const isWrong = wrong?.left === i;
            const isSel   = selected?.side === "left" && selected?.index === i;
            return (
              <div key={i} onClick={() => !matched && select("left", i)}
                style={{
                  padding:"10px 13px", marginBottom:6, borderRadius:10, cursor: matched ? "default" : "pointer",
                  border:`2px solid ${isWrong ? R : matched ? G : isSel ? P : "var(--border)"}`,
                  background: isWrong ? RD : matched ? GD : isSel ? PD : "var(--bg-surface)",
                  fontSize:13, fontWeight: matched ? 600 : 400, color:"var(--text-primary)",
                  transition:"all .15s", userSelect:"none",
                }}>
                {matched && <span style={{ color:G, marginRight:6 }}>✓</span>}
                {p.left}
              </div>
            );
          })}
        </div>

        {/* Right column (shuffled) */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Definición</div>
          {shuffled.map((origIdx, si) => {
            const matched = Object.values(matches).includes(si);
            const isWrong = wrong?.right === si;
            const isSel   = selected?.side === "right" && selected?.index === si;
            return (
              <div key={si} onClick={() => !matched && select("right", si)}
                style={{
                  padding:"10px 13px", marginBottom:6, borderRadius:10, cursor: matched ? "default" : "pointer",
                  border:`2px solid ${isWrong ? R : matched ? G : isSel ? P : "var(--border)"}`,
                  background: isWrong ? RD : matched ? GD : isSel ? PD : "var(--bg-surface)",
                  fontSize:13, fontWeight: matched ? 600 : 400, color:"var(--text-primary)",
                  transition:"all .15s", userSelect:"none",
                }}>
                {matched && <span style={{ color:G, marginRight:6 }}>✓</span>}
                {pairs[origIdx].right}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text-secondary)", marginBottom:5 }}>
          <span>Progreso</span>
          <span style={{ fontWeight:700, color:P }}>{Object.keys(matches).length}/{pairs.length}</span>
        </div>
        <div style={{ height:6, background:"var(--bg-surface-subtle)", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${(Object.keys(matches).length/pairs.length)*100}%`, background:G, borderRadius:3, transition:"width .3s" }}/>
        </div>
      </div>

      {!completed && (
        <button onClick={() => allMatched && onComplete(getScore(), 25)} disabled={!allMatched}
          style={{
            width:"100%", padding:"14px", borderRadius:12, border:"none", fontFamily:"inherit",
            cursor: allMatched ? "pointer" : "not-allowed",
            background: allMatched ? P : "var(--bg-surface-subtle)",
            color: allMatched ? "#fff" : "var(--text-tertiary)",
            fontSize:14, fontWeight:700,
          }}>
          {allMatched ? "✓ Completar →" : `Relacioná todos los pares (${pairs.length - Object.keys(matches).length} restantes)`}
        </button>
      )}
      {completed && (
        <div style={{ textAlign:"center", padding:"14px", background:GD, borderRadius:12, color:"#065f46", fontWeight:700 }}>
          ✓ ¡Completado! +25 XP
        </div>
      )}
    </div>
  );
}
