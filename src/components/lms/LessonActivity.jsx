// LessonActivity — reading + key points
import { useState } from "react";

export function LessonActivity({ content, onComplete, completed }) {
  const [reading, setReading] = useState(false);
  const [sectionsRead, setSectionsRead] = useState(new Set());
  const { sections = [], resources = [] } = content;

  const allRead = sectionsRead.size >= sections.length;

  function markRead(i) {
    setSectionsRead(prev => new Set([...prev, i]));
  }

  return (
    <div>
      {sections.map((sec, i) => {
        const isRead = sectionsRead.has(i);
        return (
          <div key={i} style={{
            background:"var(--bg-surface)", border:"1px solid var(--border)",
            borderRadius:12, marginBottom:12, overflow:"hidden",
            borderLeft: isRead ? "4px solid #059669" : "4px solid var(--border)",
          }}>
            {/* Header — clickable */}
            <div
              onClick={() => { setReading(i === reading ? null : i); markRead(i); }}
              style={{ padding:"14px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", userSelect:"none" }}
            >
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{
                  width:28, height:28, borderRadius:8, flexShrink:0,
                  background: isRead ? "#ecfdf5" : "#e8f3f6",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:14, fontWeight:800, color: isRead ? "#059669" : "#155266",
                }}>
                  {isRead ? "✓" : i + 1}
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>{sec.title}</div>
              </div>
              <i className={`ti ti-chevron-${reading === i ? "up" : "down"}`} style={{ fontSize:16, color:"var(--text-tertiary)" }}/>
            </div>

            {/* Content */}
            {reading === i && (
              <div style={{ padding:"0 16px 16px", borderTop:"1px solid var(--border-tertiary)" }}>
                <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.9, marginTop:12, whiteSpace:"pre-line" }}>
                  {sec.content}
                </div>
                {sec.highlight && (
                  <div style={{
                    marginTop:12, padding:"10px 14px", background:"#fffbeb",
                    border:"1px solid #fde68a", borderRadius:8,
                    fontSize:13, color:"#92400e", lineHeight:1.6,
                  }}>
                    {sec.highlight}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Resources */}
      {resources.length > 0 && (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:12, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>
            Recursos descargables
          </div>
          {resources.map((r, i) => (
            <a key={i} href={r.url || "#"} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8, background:"var(--bg-surface-subtle)", marginBottom:6, textDecoration:"none", color:"#155266", fontSize:13, fontWeight:500 }}>
              {r.label}
            </a>
          ))}
        </div>
      )}

      {!allRead && (
        <div style={{ textAlign:"center", fontSize:12, color:"var(--text-tertiary)", marginBottom:12 }}>
          Leé todas las secciones para continuar ({sectionsRead.size}/{sections.length})
        </div>
      )}

      {!completed && (
        <button onClick={() => allRead && onComplete(100, 15)} disabled={!allRead}
          style={{
            width:"100%", padding:"14px", borderRadius:12, border:"none",
            cursor: allRead ? "pointer" : "not-allowed",
            background: allRead ? "#155266" : "var(--bg-surface-subtle)",
            color: allRead ? "#fff" : "var(--text-tertiary)",
            fontSize:14, fontWeight:700, fontFamily:"inherit",
          }}>
          {allRead ? "✓ Completar lectura →" : "Leé todas las secciones"}
        </button>
      )}
      {completed && (
        <div style={{ textAlign:"center", padding:"14px", background:"#ecfdf5", borderRadius:12, color:"#065f46", fontWeight:700 }}>
          ✓ Lectura completada — ¡+15 XP!
        </div>
      )}
    </div>
  );
}
