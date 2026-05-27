// ─── BISection — Reportes & BI para SuperAdmin ──────────────────
import { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { useNavigate } from "react-router-dom";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",A="#d97706",R="#dc2626";

function Sparkline({ data, color, height=36 }) {
  if (!data?.length) return null;
  const max = Math.max(...data, 1);
  const w = 120, pts = data.map((v,i)=>`${(i/(data.length-1))*w},${height-(v/max)*height}`).join(" ");
  return(
    <svg viewBox={`0 0 ${w} ${height}`} style={{width:"100%",height,display:"block"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <polygon points={`${pts} ${w},${height} 0,${height}`} fill={`${color}20`}/>
    </svg>
  );
}

export function BISection({ showToast }) {
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [history,  setHistory]  = useState([]);
  const navigate = useNavigate();

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    try{
      const data=await api.get("/api/admin/stats");
      setStats(data.data||data);
      // Load payment history for sparkline
      const {data:pays}=await supabase.from("payments")
        .select("amount,created_at").eq("status","confirmed")
        .gte("created_at",new Date(Date.now()-90*24*60*60*1000).toISOString())
        .order("created_at");
      if(pays){
        // Group by month
        const byMonth={};
        pays.forEach(p=>{const m=p.created_at.slice(0,7);byMonth[m]=(byMonth[m]||0)+p.amount;});
        setHistory(Object.entries(byMonth).sort().map(([m,v])=>({month:m,amount:v})));
      }
    }catch(e){}
    finally{setLoading(false);}
  }

  const kpis=[
    {l:"Estudiantes activos",v:stats?.totalStudents??0,c:P,i:"ti-users",sub:"Matrículas activas"},
    {l:"MRR",v:`$${(stats?.mrr??0).toLocaleString()}`,c:G,i:"ti-coin",sub:"Ingresos mensuales"},
    {l:"Nuevos este mes",v:stats?.newThisMonth??0,c:A,i:"ti-user-plus",sub:"Matriculados"},
    {l:"Programas activos",v:stats?.activePrograms??0,c:"#7c3aed",i:"ti-books",sub:"Con estudiantes"},
  ];

  return(
    <div>
      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando métricas...</div>:<>

      {/* KPI grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginBottom:20}}>
        {kpis.map((k,i)=>(
          <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:8,background:`${k.c}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <i className={`ti ${k.i}`} style={{fontSize:15,color:k.c}}/>
              </div>
              <div style={{fontSize:11,color:"var(--text-secondary)"}}>{k.l}</div>
            </div>
            <div style={{fontSize:22,fontWeight:800,color:"var(--text-primary)",lineHeight:1}}>{k.v}</div>
            <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:3}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {history.length>0&&(
        <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:20,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>Revenue últimos 3 meses</div>
            <div style={{fontSize:12,color:G,fontWeight:600}}>${history.reduce((a,b)=>a+b.amount,0).toLocaleString()} total</div>
          </div>
          <Sparkline data={history.map(h=>h.amount)} color={P} height={60}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            {history.map(h=>(
              <div key={h.month} style={{fontSize:11,color:"var(--text-tertiary)",textAlign:"center"}}>
                <div style={{fontWeight:700,color:"var(--text-secondary)",fontSize:11}}>${Math.round(h.amount/1000)}k</div>
                <div>{new Date(h.month+"-01").toLocaleDateString("es-HN",{month:"short"})}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Program breakdown */}
      {stats?.byProgram&&Object.keys(stats.byProgram).length>0&&(
        <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:20,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:12}}>Estudiantes por programa</div>
          {Object.entries(stats.byProgram).map(([prog,count])=>{
            const max=Math.max(...Object.values(stats.byProgram));
            const colors={en:P,va:"#7c3aed",va_mkt:"#db2777",va_legal:"#0e7490",va_care:G};
            const c=colors[prog]||P;
            return(
              <div key={prog} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:60,fontSize:11,fontWeight:600,color:"var(--text-secondary)",textTransform:"uppercase"}}>{prog}</div>
                <div style={{flex:1,height:8,borderRadius:4,background:"var(--bg-surface-subtle)",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(count/max)*100}%`,background:c,borderRadius:4}}/>
                </div>
                <div style={{width:30,fontSize:12,fontWeight:700,color:"var(--text-primary)",textAlign:"right"}}>{count}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full BI link */}
      <div style={{background:PD,border:`1px solid ${P}20`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:P}}>Dashboard completo</div>
          <div style={{fontSize:11,color:"var(--text-secondary)"}}>Revenue detallado, retención, canales de adquisición, LTV</div>
        </div>
        <button onClick={()=>navigate("/bi")} style={{padding:"8px 18px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
          Abrir BI Dashboard →
        </button>
      </div>
      </>}
    </div>
  );
}
