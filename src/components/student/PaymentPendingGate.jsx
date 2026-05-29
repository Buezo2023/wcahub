// ─── PaymentPendingGate ─────────────────────────────────────────
// Shown when student has no active enrollment but has pending/rejected payment.
// Rules: does NOT create payments, does NOT activate enrollment, does NOT use amount=0.
import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase.js";
import { api } from "../../lib/api.js";

const P = "#155266", PD = "#e8f3f6", G = "#059669", GD = "#ecfdf5";
const R = "#dc2626", RD = "#fef2f2", A = "#d97706", AD = "#fffbeb";

const PROG_NAMES = {
  en: "Inglés Completo", va: "Asistente Virtual",
  va_mkt: "VA · Marketing Digital", va_legal: "VA · Legal Assistant",
  va_care: "VA · Cuidador Remoto",
};

export function PaymentPendingGate({ accessStatus, pendingEnrollments = [], relevantPayments = [], onRefresh }) {
  const [uploadState, setUploadState] = useState({ loading: false, done: false, error: null });
  const fileRef = useRef();

  const rejectedPayment = relevantPayments.find(p => p.status === "failed");
  const pendingPayment  = relevantPayments.find(p => p.status === "pending");
  const targetPayment   = rejectedPayment || pendingPayment;

  const progId   = pendingEnrollments[0]?.program_id || targetPayment?.enrollment?.program_id || null;
  const progName = PROG_NAMES[progId] || progId || "tu programa";
  const amount   = targetPayment?.amount ? `$${Number(targetPayment.amount).toFixed(2)} USD` : null;
  const refCode  = targetPayment?.reference_code || null;
  const isRejected = accessStatus === "payment_rejected" || !!rejectedPayment;

  async function handleUpload(file) {
    if (!targetPayment?.id) {
      setUploadState({ loading: false, done: false, error: "No hay un pago pendiente al cual asociar el comprobante." });
      return;
    }
    if (!file || (!file.type.startsWith("image/") && file.type !== "application/pdf")) {
      setUploadState({ loading: false, done: false, error: "Subí una imagen (JPG, PNG) o PDF." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadState({ loading: false, done: false, error: "El archivo no puede superar 8 MB." });
      return;
    }
    setUploadState({ loading: true, done: false, error: null });
    try {
      const ext  = file.name.split(".").pop();
      const path = `proofs/${targetPayment.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("proofs").upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { data: { publicUrl } } = supabase.storage.from("proofs").getPublicUrl(path);
      // Updates EXISTING payment only — never creates a new one
      await api.patch("/api/payments", { paymentId: targetPayment.id, action: "upload-proof", proofUrl: publicUrl });
      setUploadState({ loading: false, done: true, error: null });
      setTimeout(() => { onRefresh?.(); }, 2000);
    } catch (e) {
      setUploadState({ loading: false, done: false, error: e.message || "Error al subir el comprobante." });
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 480, width: "100%" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{isRejected ? "⚠️" : "⏳"}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            {isRejected ? "Comprobante rechazado" : "Pago pendiente de confirmación"}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Tu acceso académico se desbloqueará cuando el equipo de World Connect Academy confirme tu pago.
          </div>
        </div>

        <div style={{ background: "var(--bg-surface)", border: `1px solid ${isRejected ? "#fca5a5" : "var(--border)"}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
          {progName && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Programa</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: P }}>{progName}</span>
            </div>
          )}
          {amount && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Monto</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{amount}</span>
            </div>
          )}
          {refCode && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Referencia</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: P, fontFamily: "monospace", background: PD, padding: "2px 8px", borderRadius: 6 }}>{refCode}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Estado</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: isRejected ? RD : AD, color: isRejected ? R : A }}>
              {isRejected ? "⚠ Rechazado" : "⏳ Pendiente"}
            </span>
          </div>
          {isRejected && (
            <div style={{ marginTop: 12, background: RD, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: R }}>
              Tu comprobante anterior no pudo ser aprobado. Subí uno nuevo con el monto y referencia correctos.
            </div>
          )}
        </div>

        {targetPayment?.id && (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              {isRejected ? "Subir nuevo comprobante" : "Subir comprobante de pago"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
              Subí la captura o PDF de tu transferencia bancaria.
            </div>
            {uploadState.done ? (
              <div style={{ background: GD, borderRadius: 10, padding: "14px 16px", fontSize: 13, color: G, fontWeight: 600, textAlign: "center" }}>
                ✓ Comprobante enviado — el equipo lo revisará en breve.
              </div>
            ) : (
              <>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
                <div onClick={() => !uploadState.loading && fileRef.current?.click()}
                  style={{ border: `2px dashed ${uploadState.error ? R : "var(--border)"}`, borderRadius: 12, padding: 20, textAlign: "center", cursor: uploadState.loading ? "wait" : "pointer", background: "var(--bg-surface-subtle)" }}
                  onMouseEnter={e => !uploadState.loading && (e.currentTarget.style.borderColor = P)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = uploadState.error ? R : "var(--border)")}
                >
                  {uploadState.loading
                    ? <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>⏳ Subiendo...</div>
                    : <><div style={{ fontSize: 28, marginBottom: 6 }}>📎</div><div style={{ fontSize: 13, color: P, fontWeight: 600 }}>Seleccionar archivo</div><div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>JPG, PNG o PDF · máx. 8 MB</div></>
                  }
                </div>
                {uploadState.error && <div style={{ fontSize: 12, color: R, marginTop: 8 }}>⚠ {uploadState.error}</div>}
              </>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)" }}>
          ¿Tenés dudas? Escribinos a{" "}
          <a href="mailto:info@worldconnectacademy.com" style={{ color: P, fontWeight: 600 }}>info@worldconnectacademy.com</a>.
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => onRefresh?.()} style={{ padding: "8px 20px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            🔄 Verificar estado
          </button>
        </div>
      </div>
    </div>
  );
}
