// ─── ConfirmModal — reemplaza window.confirm() ───────────────────
// Uso:
//   const [confirm, ConfirmUI] = useConfirm();
//   await confirm({ title:"¿Eliminar?", body:"Esto es irreversible.", danger:true });
//   // retorna true si confirmó, false si canceló

import { useState, useCallback } from "react";

export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const handle = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const ConfirmUI = state ? (
    <div role="dialog" aria-modal="true"
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex",
               alignItems:"center", justifyContent:"center", zIndex:"var(--z-modal)", padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) handle(false); }}>
      <div style={{ background:"var(--bg-surface)", borderRadius:16, padding:24, width:360, maxWidth:"100%",
                    border:"1px solid var(--border)", boxShadow:"0 20px 60px rgba(0,0,0,.2)",
                    animation:"popIn .22s cubic-bezier(.34,1.56,.64,1) both",
                    fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        {state.danger && (
          <div style={{ width:44, height:44, borderRadius:12, background:"#fef2f2",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        marginBottom:14 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize:22, color:"#dc2626" }} aria-hidden="true"/>
          </div>
        )}
        <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>
          {state.title || "¿Confirmar acción?"}
        </div>
        {state.body && (
          <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:20 }}>
            {state.body}
          </div>
        )}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => handle(false)}
            style={{ flex:1, padding:"10px", background:"var(--bg-surface-subtle)",
                     border:"1px solid var(--border)", borderRadius:8, fontSize:13,
                     cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>
            Cancelar
          </button>
          <button onClick={() => handle(true)}
            style={{ flex:2, padding:"10px",
                     background: state.danger ? "#dc2626" : "#155266",
                     color:"#fff", border:"none", borderRadius:8, fontSize:13,
                     fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            {state.confirmText || (state.danger ? "Sí, eliminar" : "Confirmar")}
          </button>
        </div>
        <style>{`@keyframes popIn{0%{opacity:0;transform:scale(.94)}60%{transform:scale(1.01)}100%{opacity:1;transform:none}}`}</style>
      </div>
    </div>
  ) : null;

  return [confirm, ConfirmUI];
}
