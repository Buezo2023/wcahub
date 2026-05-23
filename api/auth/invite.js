// POST /api/auth/invite
// Body: { email, fullName, programId, level, groupId, price }
// Auth: admin, super_admin, coordinadora

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
  // CORS preflight
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`invite:${ip}`, 10, 60000);
  } catch (e) { return err(res, e); }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Auth check
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'admin', 'super_admin', 'coordinadora');

    const { email, fullName, programId = 'en', level = 'A1', price = 95 } = req.body;
    if (!email || !fullName) return err(res, { status: 400, message: 'email y fullName son requeridos' });

    const admin = getSupabaseAdmin();

    // 2. Check if user already exists via profiles table (fast O(1) query)
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let userId;
    let isNewUser = false;

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // 3. Create auth user — send magic link invite (more secure than temp password)
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      isNewUser = true;

      // Send magic link invite so they set their own password
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: "https://wcahub.vercel.app/auth/callback",
        data: { full_name: fullName },
      }).catch(e => console.warn("Magic link invite:", e.message));
    }

    // 4. Ensure profile exists and has student role
    await admin.from('profiles').upsert({
      id:        userId,
      email,
      full_name: fullName,
      role:      'estudiante',
      active:    true,
    }, { onConflict: 'id' });

    // 5. Create student record
    const { data: student, error: studentError } = await admin
      .from('students')
      .upsert({ profile_id: userId, level }, { onConflict: 'profile_id' })
      .select()
      .single();
    if (studentError) throw studentError;

    // 6. Create enrollment
    const { data: enrollment, error: enrollError } = await admin
      .from('enrollments')
      .upsert({
        student_id:   student.id,
        program_id:   programId,
        status:       'active',
        current_unit: 1,
        price_locked: price,
      }, { onConflict: 'student_id,program_id' })
      .select()
      .single();
    if (enrollError) throw enrollError;

    // 7. Audit log
    await admin.from('audit_log').insert({
      actor_id:  actor.id,
      action:    'invited_student',
      entity:    'student',
      entity_id: student.id,
      metadata:  { email, programId, level },
    });

    // 8. Send welcome email (invite link already sent by Supabase above for new users)
    const programNames = {
      en: "Inglés Completo", va: "Asistente Virtual",
      va_mkt: "VA · Marketing Digital", va_legal: "VA · Legal",
      va_care: "VA · Cuidador Remoto",
    };

    if (!existingProfile) {
      // New user — send custom welcome email with instructions
      try {
        const { subject, html } = EmailTemplates.invite({
          name:        fullName.split(" ")[0],
          email,
          programName: programNames[programId] || programId,
        });
        await sendEmail({ to: email, toName: fullName, subject, html });
      } catch(emailErr) { console.error("Welcome email:", emailErr.message); }
    }

    return ok(res, {
      message:    `Estudiante ${existingProfile ? "matriculado" : "invitado"} exitosamente`,
      studentId:  student.id,
      enrolled:   !!enrollment,
      emailSent:  isNewUser,
    }, 201);

  } catch (e) {
    return err(res, e);
  }
}
