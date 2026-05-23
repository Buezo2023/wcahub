// ─── notify.js — helper para insertar notificaciones desde el frontend ──
// Úsalo en cualquier portal: await notify(userId, type, title, body)
// Para eventos de backend (pagos vencidos) usar Supabase Edge Function.

import { supabase } from "./supabase.js";

/**
 * Inserta una notificación para un usuario.
 * @param {string} userId   — auth.users.id del destinatario
 * @param {string} type     — 'success'|'info'|'warning'|'payment'|'exam'|'class'
 * @param {string} title    — Título corto (<60 chars)
 * @param {string} [body]   — Texto adicional opcional
 * @param {string} [link]   — URL interna opcional (/portal, /pagos…)
 */
export async function notify(userId, type, title, body = null, link = null) {
  if (!userId) return;
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    link,
  });
  if (error) console.error("notify error:", error.message);
}

/**
 * Notifica al usuario logueado actualmente.
 */
export async function notifySelf(type, title, body = null, link = null) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return;
  return notify(session.user.id, type, title, body, link);
}

// ─── Plantillas predefinidas ──────────────────────────────────────
export const Notifs = {
  examPassed:   (level, unit, score) => ({
    type: "success",
    title: `¡Aprobaste U${unit}! ${score}%`,
    body:  `Excelente trabajo. Tu coordinadora coordinará el avance al nivel ${level}.`,
    link:  "/portal",
  }),
  examFailed:   (unit, score, attemptsLeft) => ({
    type: "warning",
    title: `Examen U${unit}: ${score}% — Necesitás 70%`,
    body:  attemptsLeft > 0
      ? `Te quedan ${attemptsLeft} intento(s). ¡Podés hacerlo!`
      : "Agotaste los intentos. Tu docente puede habilitarte uno extra.",
    link: "/portal",
  }),
  paymentDue:   (amount, daysLeft) => ({
    type: "payment",
    title: `Pago de $${amount} vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`,
    body:  "Subí tu comprobante en la sección de Pagos para evitar la suspensión.",
    link:  "/portal",
  }),
  paymentConfirmed: (amount) => ({
    type: "success",
    title: `Pago de $${amount} confirmado`,
    body:  "Tu matrícula está al día. ¡Seguí aprendiendo!",
    link:  "/portal",
  }),
  newUnit: (unit, title) => ({
    type: "info",
    title: `Nueva unidad disponible: U${unit} — ${title}`,
    body:  "¡Tu próxima unidad ya está desbloqueada! Entrá a practicar.",
    link:  "/portal",
  }),
  welcomeBack: () => ({
    type: "info",
    title: "¡Bienvenido/a de vuelta a WCA Hub!",
    body:  "Tu progreso te espera. Seguí desde donde lo dejaste.",
    link:  "/portal",
  }),
};
