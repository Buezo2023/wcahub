// VideoActivity — YouTube embed (switch to Vimeo changing embedUrl)
import { useState, useEffect, useRef } from "react";

export function VideoActivity({ content, onComplete, completed }) {
  const [watched, setWatched] = useState(completed || false);
  const timerRef = useRef(null);

  const { youtube_id, duration_min = 10, description, key_points = [] } = content;
  // youtube-nocookie.com = privacy-enhanced mode (no tracking, fewer ads)
  const embedUrl = youtube_id?.startsWith("PLACEHOLDER")
    ? null
    : `https://www.youtube-nocookie.com/embed/${youtube_id}?rel=0&modestbranding=1`;

  // Auto-unlock after 80% of estimated duration (in seconds)
  useEffect(() => {
    if (completed || watched) return;
    const unlockAfter = Math.floor(duration_min * 0.8 * 60 * 1000);
    timerRef.current = setTimeout(() => setWatched(true), Math.min(unlockAfter, 30000));
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div>
      {/* Video Player */}
      <div style={{ position:"relative", paddingTop:"56.25%", background:"#0f172a", borderRadius:14, overflow:"hidden", marginBottom:16 }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Video lesson"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }}
          />
        ) : (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,.7)", gap:12 }}>
            <i className="ti ti-video-off" style={{ fontSize:48, opacity:.4 }}/>
            <div style={{ fontSize:14, textAlign:"center", padding:"0 24px" }}>
              Video próximamente — tu instructor subirá el video en breve
            </div>
            <button onClick={()=>setWatched(true)} style={{ marginTop:8, padding:"8px 20px", background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.3)", borderRadius:9, color:"#fff", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              Marcar como visto →
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginBottom:14 }}>
          <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.7 }}>{description}</div>
        </div>
      )}

      {/* Key points */}
      {key_points.length > 0 && (
        <div style={{ background:"#e8f3f6", border:"1px solid #b3d4de", borderRadius:12, padding:16, marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#155266", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>
            📌 Puntos clave de este video
          </div>
          {key_points.map((pt, i) => (
            <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:13, color:"#155266" }}>
              <span style={{ flexShrink:0, fontWeight:700 }}>•</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      )}

      {/* Complete button */}
      {!completed && (
        <button
          onClick={() => { if (watched) onComplete(100, 20); }}
          disabled={!watched}
          style={{
            width:"100%", padding:"14px", borderRadius:12, border:"none", cursor:watched?"pointer":"not-allowed",
            background: watched ? "#155266" : "var(--bg-surface-subtle)",
            color: watched ? "#fff" : "var(--text-tertiary)",
            fontSize:14, fontWeight:700, fontFamily:"inherit", transition:"all .2s",
          }}
        >
          {watched ? "✓ Completar y ganar XP →" : `Viendo el video... (${duration_min} min)`}
        </button>
      )}
      {completed && (
        <div style={{ textAlign:"center", padding:"14px", background:"#ecfdf5", borderRadius:12, color:"#065f46", fontWeight:700, fontSize:14 }}>
          ✓ Video completado — ¡+20 XP ganados!
        </div>
      )}
    </div>
  );
}
