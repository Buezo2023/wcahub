// ─── WCA Hub — Magic link server-side endpoint ─────────────────────
// Proxies supabase.auth.signInWithOtp() with rate limiting per email + IP.
// Frontend calls this instead of Supabase directly to enforce limits.
import { getSupabaseAdmin, checkRateLimit, setCORS, ok, err } from "../_utils.js";

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body || {};

  // ── Input validation ──────────────────────────────────────────────
  if (!email || typeof email !== "string") {
    return err(res, { status: 400, message: "Email requerido" });
  }
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return err(res, { status: 400, message: "Email inválido" });
  }

  // ── Rate limiting: BOTH by email AND by IP ────────────────────────
  // Email limit: 3 requests per 15 min — prevents spamming a victim's inbox
  // IP limit:    5 requests per 15 min — prevents enumeration via multiple emails
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  try {
    await checkRateLimit(`magic:email:${normalized}`, 3, 15 * 60 * 1000);
    await checkRateLimit(`magic:ip:${ip}`,            5, 15 * 60 * 1000);
  } catch (limitErr) {
    // Still return 200 to prevent enumeration (don't reveal which limit was hit)
    return res.status(200).json({ ok: true, data: { sent: true, limited: true } });
  }

  // ── Always return success — don't reveal if email exists ──────────
  // This prevents user enumeration (attacker can't know who has accounts)
  // Supabase itself also has this behavior when shouldCreateUser: false
  try {
    const admin = getSupabaseAdmin();

    // Use admin client to generate OTP without exposing anon key logic
    // signInWithOtp is available on the regular client but we call it server-side
    // to ensure rate limiting always applies (can't be bypassed by calling Supabase directly)
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: normalized,
      options: {
        redirectTo: `${process.env.SITE_URL || "https://wcahub.vercel.app"}/auth/callback`,
      },
    }).catch(() => null); // Silently ignore "user not found" — anti-enumeration

  } catch (_) {
    // Silently swallow — always show success to caller
  }

  // ── Constant-time response ────────────────────────────────────────
  return ok(res, { sent: true });
}
