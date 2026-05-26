// ─── LMSPlayer — motor completo del LMS ────────────────────────
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { supabase } from "../../lib/supabase.js";

const VideoActivity    = lazy(() => import("./VideoActivity.jsx").then(m => ({ default: m.VideoActivity })));
const LessonActivity   = lazy(() => import("./LessonActivity.jsx").then(m => ({ default: m.LessonActivity })));
const QuizActivity     = lazy(() => import("./QuizActivity.jsx").then(m => ({ default: m.QuizActivity })));
const MatchingActivity = lazy(() => import("./MatchingActivity.jsx").then(m => ({ default: m.MatchingActivity })));
const FillBlankActivity= lazy(() => import("./FillBlankActivity.jsx").then(m => ({ default: m.FillBlankActivity })));
const RoleplayActivity = lazy(() => import("./RoleplayActivity.jsx").then(m => ({ default: m.RoleplayActivity })));

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",A="#d97706",R="#dc2626";

const ACTIVITY_ICONS = { video:"🎬", lesson:"📖", quiz:"📝", matching:"🔗", fill_blank:"✏️", roleplay:"🎭", typing:"⌨️" };
const ACTIVITY_LABELS= { video:"Video", lesson:"Lectura", quiz:"Quiz", matching:"Matching", fill_blank:"Completar", roleplay:"Roleplay", typing:"Typing" };
const ACTIVITY_XP    = { video:20, lesson:15, quiz:50, matching:25, fill_blank:25, roleplay:35, typing:20 };

export function LMSPlayer({ programId, profileId, enrollment, isMobile }) {
  const [units,      setUnits]      = useState([]);
  const [activities, setActivities] = useState([]);
  const [progress,   setProgress]   = useState({});    // { activity_id: {completed,score,xp} }
  const [totalXP,    setTotalXP]    = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);
  const [sideOpen, setSideOpen] = useState(!isMobile);
  const [loading, setLoading]   = useState(true);
  const [xpAnim,  setXpAnim]   = useState(null);       // { amount, x, y }

  useEffect(() => { load(); }, [programId, profileId]);

  async function load() {
    setLoading(true);
    try {
      // Load units for this program
      const { data: unitData } = await supabase
        .from("units")
        .select("id,unit_number,title,topic,level,program_id")
        .eq("program_id", programId)
        .eq("published", true)
        .order("unit_number");
      if (!unitData?.length) { setLoading(false); return; }
      setUnits(unitData);

      // Load all activities for this program
      const unitIds = unitData.map(u => u.id);
      const { data: actData } = await supabase
        .from("unit_activities")
        .select("id,unit_id,type,order_num,title,xp_reward,content")
        .in("unit_id", unitIds)
        .eq("published", true)
        .order("order_num");
      setActivities(actData || []);

      // Load student progress
      const { data: progData } = await supabase
        .from("user_activity_progress")
        .select("activity_id,completed,score,xp_earned")
        .eq("profile_id", profileId);
      const progMap = {};
      let xp = 0;
      (progData || []).forEach(p => { progMap[p.activity_id] = p; xp += (p.xp_earned || 0); });
      setProgress(progMap);
      setTotalXP(xp);

      // Auto-select first unit
      if (unitData[0]) setSelectedUnit(unitData[0].id);
    } finally { setLoading(false); }

    // Sync any offline progress saved in localStorage
    const pending = JSON.parse(localStorage.getItem("wca_pending_progress") || "[]");
    if (pending.length) {
      const synced = [];
      for (const p of pending) {
        const { error } = await supabase.from("user_activity_progress")
          .upsert(p, { onConflict: "profile_id,activity_id" });
        if (!error) synced.push(p);
      }
      if (synced.length) {
        const remaining = pending.filter(p => !synced.some(s => s.activity_id === p.activity_id));
        localStorage.setItem("wca_pending_progress", JSON.stringify(remaining));
      }
    }
  }

  // Activities for selected unit, ordered
  const unitActivities = activities
    .filter(a => a.unit_id === selectedUnit)
    .sort((a, b) => a.order_num - b.order_num);

  // Unit completion pct
  function unitPct(unitId) {
    const acts = activities.filter(a => a.unit_id === unitId);
    if (!acts.length) return 0;
    const done = acts.filter(a => progress[a.id]?.completed).length;
    return Math.round((done / acts.length) * 100);
  }

  // Is activity unlocked? First activity always yes; others need previous completed
  function isUnlocked(actIdx) {
    if (actIdx === 0) return true;
    const prev = unitActivities[actIdx - 1];
    return progress[prev?.id]?.completed === true;
  }

  // Handle activity completion
  const handleComplete = useCallback(async (activityId, score, xpEarned) => {
    // Guard: if already completed, update score but don't award XP again
    const alreadyDone = progress[activityId]?.completed === true;
    if (alreadyDone) xpEarned = 0;

    // Upsert progress — optimistic update + retry up to 3 times
    const progressData = {
      profile_id: profileId, activity_id: activityId,
      completed: true, score, xp_earned: xpEarned,
      attempts: (progress[activityId]?.attempts || 0) + 1,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    let saved = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.from("user_activity_progress")
        .upsert(progressData, { onConflict: "profile_id,activity_id" });
      if (!error) { saved = true; break; }
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
    if (!saved) {
      // Store in localStorage as fallback so progress isn't lost
      const pending = JSON.parse(localStorage.getItem("wca_pending_progress") || "[]");
      pending.push(progressData);
      localStorage.setItem("wca_pending_progress", JSON.stringify(pending));
    }

    // Log XP
    if (xpEarned > 0) {
      await supabase.from("xp_ledger").insert({
        profile_id: profileId,
        source: "activity",
        source_id: activityId,
        amount: xpEarned,
        description: `Completó actividad`,
      }).catch(() => {});

      // Update profile total_xp
      await supabase.rpc("increment_xp", { p_profile_id: profileId, p_amount: xpEarned }).catch(() => {});

      // XP animation
      setXpAnim({ amount: xpEarned });
      setTimeout(() => setXpAnim(null), 2500);
    }

    // Update local state
    setProgress(prev => ({ ...prev, [activityId]: { completed: true, score, xp_earned: xpEarned } }));
    setTotalXP(t => t + xpEarned);

    // Check unit completion bonus
    const unitId = activities.find(a => a.id === activityId)?.unit_id;
    if (unitId) {
      const acts = activities.filter(a => a.unit_id === unitId);
      const allComplete = acts.every(a => a.id === activityId || progress[a.id]?.completed);
      if (allComplete) {
        await supabase.from("xp_ledger").insert({
          profile_id: profileId, source: "unit_complete", source_id: unitId,
          amount: 100, description: "¡Unidad completada!",
        }).catch(() => {});
        setTotalXP(t => t + 100);
        setXpAnim({ amount: 100, bonus: true });
        setTimeout(() => setXpAnim(null), 3000);
      }
    }
  }, [profileId, activities, progress]);

  // XP level from total
  function xpLevel(xp) {
    if (xp < 200)  return 1;
    if (xp < 500)  return 2;
    if (xp < 1000) return 3;
    if (xp < 2000) return 4;
    return 5;
  }

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, gap:12 }}>
      <div style={{ width:24, height:24, borderRadius:"50%", border:`3px solid ${P}`, borderTopColor:"transparent", animation:"spin 1s linear infinite" }}/>
      <div style={{ fontSize:14, color:"var(--text-secondary)" }}>Cargando tu programa...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!units.length) return (
    <div style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ fontSize:48, marginBottom:12 }}>📚</div>
      <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>Contenido próximamente</div>
      <div style={{ fontSize:13, color:"var(--text-secondary)" }}>Tu instructor está preparando el material. ¡Volvé pronto!</div>
    </div>
  );

  // XP bar progress to next level
  const level = xpLevel(totalXP);
  const levelThresholds = [0, 200, 500, 1000, 2000, Infinity];
  const levelStart = levelThresholds[level - 1];
  const levelEnd   = levelThresholds[level];
  const levelPct   = Math.min(100, Math.round(((totalXP - levelStart) / (levelEnd - levelStart)) * 100));

  return (
    <div style={{ display:"flex", height:"100%", minHeight:"60vh", position:"relative" }}>

      {/* XP Animation overlay */}
      {xpAnim && (
        <div style={{
          position:"fixed", top:"20%", left:"50%", transform:"translateX(-50%)",
          zIndex:99999, pointerEvents:"none",
          animation:"xpPop .4s cubic-bezier(.17,.67,.35,1.3), xpFade 2s 0.4s forwards",
          background: xpAnim.bonus ? A : G,
          color:"#fff", borderRadius:20, padding:"10px 24px",
          fontSize:20, fontWeight:800, boxShadow:"0 8px 32px rgba(0,0,0,.25)",
        }}>
          {xpAnim.bonus ? "🌟 UNIDAD COMPLETADA!" : "⚡"} +{xpAnim.amount} XP
          <style>{`
            @keyframes xpPop { from{transform:translateX(-50%) scale(.5)} to{transform:translateX(-50%) scale(1)} }
            @keyframes xpFade{ from{opacity:1;transform:translateX(-50%) translateY(0)} to{opacity:0;transform:translateX(-50%) translateY(-40px)} }
          `}</style>
        </div>
      )}

      {/* Sidebar — unit list */}
      {(sideOpen || !isMobile) && (
        <div style={{
          width: isMobile ? "100%" : 260, flexShrink:0,
          background:"var(--bg-surface)", borderRight:"1px solid var(--border)",
          overflowY:"auto", display:"flex", flexDirection:"column",
          position: isMobile ? "fixed" : "relative",
          ...(isMobile ? { inset:0, zIndex:9000 } : {}),
        }}>
          {/* XP header */}
          <div style={{ padding:"16px 14px", background: P, color:"#fff", flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>⚡ {totalXP} XP</div>
              <div style={{ fontSize:11, background:"rgba(255,255,255,.2)", padding:"2px 8px", borderRadius:9 }}>Nivel {level}</div>
            </div>
            <div style={{ height:4, background:"rgba(255,255,255,.2)", borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${levelPct}%`, background:"#ffbb23", borderRadius:2, transition:"width .5s" }}/>
            </div>
            {isMobile && (
              <button onClick={() => setSideOpen(false)} style={{ float:"right", marginTop:8, background:"rgba(255,255,255,.2)", border:"none", borderRadius:7, padding:"4px 10px", color:"#fff", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>✕ Cerrar</button>
            )}
          </div>

          {/* Units list */}
          <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
            {units.map(unit => {
              const pct  = unitPct(unit.id);
              const isSel = unit.id === selectedUnit;
              return (
                <div key={unit.id}
                  onClick={() => { setSelectedUnit(unit.id); setActiveActivity(null); if(isMobile) setSideOpen(false); }}
                  style={{
                    padding:"12px 14px", cursor:"pointer", borderLeft:`3px solid ${isSel ? P : "transparent"}`,
                    background: isSel ? PD : "transparent", transition:"all .15s",
                  }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                    <div style={{ fontSize:12, fontWeight:700, color: isSel ? P : "var(--text-primary)" }}>
                      U{unit.unit_number}. {unit.title}
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color: pct===100 ? G : "var(--text-tertiary)", flexShrink:0, marginLeft:6 }}>
                      {pct===100 ? "✓" : `${pct}%`}
                    </div>
                  </div>
                  <div style={{ height:3, background:"var(--bg-surface-subtle)", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background: pct===100 ? G : P, borderRadius:2 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

        {/* Activity list for selected unit */}
        {!activeActivity ? (
          <div style={{ padding:isMobile?12:20 }}>
            {/* Unit header */}
            {selectedUnit && (() => {
              const unit = units.find(u => u.id === selectedUnit);
              return unit && (
                <div style={{ marginBottom:20 }}>
                  {isMobile && (
                    <button onClick={() => setSideOpen(true)} style={{ marginBottom:10, padding:"6px 14px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>
                      ☰ Ver todas las unidades
                    </button>
                  )}
                  <div style={{ fontSize:11, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>
                    Unidad {unit.unit_number}
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", marginBottom:4 }}>{unit.title}</div>
                  {unit.topic && <div style={{ fontSize:13, color:"var(--text-secondary)" }}>{unit.topic}</div>}
                </div>
              );
            })()}

            {/* Activities */}
            {unitActivities.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📖</div>
                <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>
                  Contenido en preparación
                </div>
                <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.7 }}>
                  Tu instructor está cargando el material de esta unidad.<br/>
                  Las actividades aparecerán aquí cuando estén publicadas.
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {unitActivities.map((act, idx) => {
                  const prog    = progress[act.id];
                  const done    = prog?.completed;
                  const locked  = !isUnlocked(idx);
                  return (
                    <div key={act.id}
                      onClick={() => !locked && setActiveActivity(act)}
                      style={{
                        background:"var(--bg-surface)", border:"1px solid var(--border)",
                        borderRadius:14, padding:"14px 16px", cursor: locked ? "not-allowed" : "pointer",
                        opacity: locked ? 0.5 : 1, transition:"all .15s",
                        borderLeft:`4px solid ${done ? G : locked ? "var(--border)" : P}`,
                        display:"flex", alignItems:"center", gap:14,
                      }}>
                      {/* Icon */}
                      <div style={{
                        width:44, height:44, borderRadius:12, flexShrink:0,
                        background: done ? GD : locked ? "var(--bg-surface-subtle)" : PD,
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:20,
                      }}>
                        {done ? "✓" : locked ? "🔒" : ACTIVITY_ICONS[act.type]}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", marginBottom:2 }}>{act.title}</div>
                        <div style={{ fontSize:11, color:"var(--text-secondary)" }}>
                          {ACTIVITY_LABELS[act.type]} · +{act.xp_reward || ACTIVITY_XP[act.type]} XP
                          {done && prog?.score > 0 && ` · ${prog.score}%`}
                        </div>
                      </div>
                      {done
                        ? <div style={{ fontSize:12, fontWeight:700, color:G, flexShrink:0 }}>+{prog.xp_earned} XP ✓</div>
                        : !locked && <i className="ti ti-chevron-right" style={{ fontSize:18, color:"var(--text-tertiary)", flexShrink:0 }}/>
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Activity detail view */
          <div style={{ padding:isMobile?12:20, maxWidth:680, width:"100%", margin:"0 auto" }}>
            {/* Back button */}
            <button onClick={() => setActiveActivity(null)} style={{
              display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
              cursor:"pointer", color:"var(--text-secondary)", fontSize:13, fontFamily:"inherit",
              marginBottom:16, padding:0,
            }}>
              <i className="ti ti-arrow-left" style={{ fontSize:16 }}/> Volver a la unidad
            </button>

            {/* Activity header */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:"var(--text-tertiary)", marginBottom:4 }}>
                {ACTIVITY_ICONS[activeActivity.type]} {ACTIVITY_LABELS[activeActivity.type]} · +{activeActivity.xp_reward} XP
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)" }}>{activeActivity.title}</div>
            </div>

            {/* Activity renderer */}
            <Suspense fallback={<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando actividad...</div>}>
              {activeActivity.type === "video"      && <VideoActivity    content={activeActivity.content} completed={progress[activeActivity.id]?.completed} onComplete={(s,x) => handleComplete(activeActivity.id, s, x)} />}
              {activeActivity.type === "lesson"     && <LessonActivity   content={activeActivity.content} completed={progress[activeActivity.id]?.completed} onComplete={(s,x) => handleComplete(activeActivity.id, s, x)} />}
              {activeActivity.type === "quiz"       && <QuizActivity     content={activeActivity.content} completed={progress[activeActivity.id]?.completed} onComplete={(s,x) => handleComplete(activeActivity.id, s, x)} />}
              {activeActivity.type === "matching"   && <MatchingActivity  content={activeActivity.content} completed={progress[activeActivity.id]?.completed} onComplete={(s,x) => handleComplete(activeActivity.id, s, x)} />}
              {activeActivity.type === "fill_blank" && <FillBlankActivity content={activeActivity.content} completed={progress[activeActivity.id]?.completed} onComplete={(s,x) => handleComplete(activeActivity.id, s, x)} />}
              {activeActivity.type === "roleplay"   && <RoleplayActivity  content={activeActivity.content} completed={progress[activeActivity.id]?.completed} onComplete={(s,x) => handleComplete(activeActivity.id, s, x)} />}
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
