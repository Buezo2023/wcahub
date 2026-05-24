// ─── Skeleton loader — shows while data loads ────────────────────
export function SkeletonRows({ rows = 5, cols = 4 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"8px 0" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display:"flex", gap:12, alignItems:"center" }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton" style={{
              height: 14, flex: j === 0 ? 2 : 1, borderRadius: 6,
              animationDelay: `${(i * cols + j) * 0.05}s`
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}
