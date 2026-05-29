// POST /api/register — Autoinscripción pública, sin auth requerida
// Crea cuenta + student + enrollment(pending) → inicia pago
// Body: { name, email, phone, country, timezone, programId, level, groupId,
//         paymentMethod, transferType, termsAcceptedAt }

import {
  getSupabaseAdmin, sendEmail, ok, err, setCORS,
  checkRateLimit, addOneMonth
} from '../_utils.js';

const PROGRAM_NAMES = {
  en: 'Inglés Completo', va: 'Asistente Virtual',
  va_mkt: 'VA · Marketing Digital', va_legal: 'VA · Legal Assistant',
  va_care: 'VA · Cuidador Remoto',
};

// ── Shared helper: resolve current_unit ──────────────────────────
async function resolveCurrentUnit(admin, { programId, studentLevel, groupId, existingUnit }) {
  if (existingUnit != null) return { unit: existingUnit, source: 'existing_enrollment' };

  if (groupId) {
    const { data: group, error: gErr } = await admin
      .from('groups').select('id, active, active_unit, capacity, program_id, level')
      .eq('id', groupId).maybeSingle();
    if (gErr) throw { status: 500, message: `Error al consultar el grupo: ${gErr.message}` };
    if (!group)        throw { status: 404, message: 'El grupo especificado no existe' };
    if (!group.active) throw { status: 422, message: 'El grupo está inactivo y no acepta nuevas matrículas' };
    if (group.program_id !== programId)
      throw { status: 422, message: `El grupo pertenece al programa "${group.program_id}" pero se solicitó "${programId}"` };
    const { count: enrolled } = await admin.from('enrollments')
      .select('id', { count: 'exact' }).eq('group_id', groupId).eq('status', 'active');
    if ((enrolled || 0) >= (group.capacity || 25))
      throw { status: 422, message: `El grupo está lleno (${enrolled}/${group.capacity || 25} cupos)` };
    if (programId === 'en' && studentLevel && group.level && group.level !== studentLevel)
      throw { status: 422, message: `El nivel del grupo es ${group.level} pero el estudiante está en ${studentLevel}` };
    const unit = group.active_unit;
    if (!unit || unit < 1 || unit > 12)
      throw { status: 422, message: `La unidad activa del grupo (${unit}) es inválida. Debe estar entre 1 y 12.` };
    return { unit, source: 'group_active_unit', group };
  }

  const isIngles = programId === 'en';
  let query = admin.from('cycle_config').select('current_unit, program_id, level').eq('program_id', programId);
  if (isIngles && studentLevel) {
    query = query.eq('level', studentLevel);
  } else if (!isIngles && studentLevel) {
    const { data: withLevel } = await query.eq('level', studentLevel).maybeSingle();
    if (withLevel?.current_unit) {
      const unit = withLevel.current_unit;
      if (unit < 1 || unit > 12) throw { status: 422, message: `La unidad en cycle_config (${unit}) es inválida.` };
      return { unit, source: 'cycle_config' };
    }
    const { data: noLevel } = await admin.from('cycle_config').select('current_unit')
      .eq('program_id', programId).is('level', null).maybeSingle();
    if (noLevel?.current_unit) {
      const unit = noLevel.current_unit;
      if (unit < 1 || unit > 12) throw { status: 422, message: `La unidad en cycle_config (${unit}) es inválida.` };
      return { unit, source: 'cycle_config' };
    }
    throw { status: 422, message: `No se encontró configuración de ciclo para el programa "${programId}". Configurá cycle_config en el panel académico antes de matricular.` };
  }
  const { data: cycle } = await query.maybeSingle();
  if (!cycle) {
    const levelHint = isIngles && studentLevel ? ` (nivel ${studentLevel})` : '';
    throw { status: 422, message: `No se encontró configuración de ciclo para "${programId}"${levelHint}. Configurá cycle_config en el panel académico.` };
  }
  const unit = cycle.current_unit;
  if (!unit || unit < 1 || unit > 12)
    throw { status: 422, message: `La unidad en cycle_config (${unit}) es inválida. Debe estar entre 1 y 12.` };
  return { unit, source: 'cycle_config' };
}

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    await checkRateLimit(`register:${ip}`, 5, 60000);
    const emailForRateLimit = req.body?.email?.trim().toLowerCase() || 'unknown';
    await checkRateLimit(`register:email:${emailForRateLimit}`, 2, 24 * 60 * 60 * 1000);
  } catch(e) { return err(res, e); }

  try {
    const {
      name, email, phone, country, timezone,
      programId, level, groupId,
      paymentMethod, transferType,
      termsAcceptedAt,
    } = req.body;

    // ── Input validation ──────────────────────────────────────────
    if (!name?.trim() || !email?.trim() || !programId)
      return err(res, { status: 400, message: 'name, email y programId son requeridos' });
    if (!termsAcceptedAt)
      return err(res, { status: 400, message: 'Debés aceptar los términos para continuar' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return err(res, { status: 400, message: 'Email inválido' });
    if (!['stripe', 'transfer'].includes(paymentMethod))
      return err(res, { status: 400, message: 'paymentMethod debe ser stripe o transfer' });
    if (paymentMethod === 'transfer' && !['honduras', 'usa'].includes(transferType))
      return err(res, { status: 400, message: 'transferType debe ser "honduras" o "usa"' });

    const admin = getSupabaseAdmin();

    // ── Validate program from DB — never trust frontend price ─────
    const { data: program, error: progErr } = await admin.from('programs')
      .select('id, name, description, price_monthly, price_quarterly, active, prereq_program_id')
      .eq('id', programId).eq('active', true).maybeSingle();
    if (progErr)  return err(res, { status: 500, message: `Error al verificar programa: ${progErr.message}` });
    if (!program) return err(res, { status: 400, message: `Programa "${programId}" no encontrado o inactivo` });

    // ── Real price from DB ─────────────────────────────────────────
    const isSpecialization = !!program.prereq_program_id;
    const priceRaw   = isSpecialization ? (program.price_quarterly || program.price_monthly) : program.price_monthly;
    const priceDollars = Number(priceRaw);
    if (!priceDollars || priceDollars <= 0)
      return err(res, { status: 422, message: `El programa "${programId}" no tiene precio configurado. Contactá al administrador.` });
    const priceCents = Math.round(priceDollars * 100);
    const progName   = program.name || PROGRAM_NAMES[programId] || programId;

    // ── Duplicate check ───────────────────────────────────────────
    const { data: existing } = await admin.from('profiles')
      .select('id, students(id, enrollments(id, status, program_id))')
      .eq('email', email.toLowerCase()).maybeSingle();

    if (existing) {
      const enrollments = existing.students?.flatMap(s =>
        Array.isArray(s.enrollments) ? s.enrollments : (s.enrollments ? [s.enrollments] : [])
      ) || [];
      if (enrollments.some(e => e.status === 'active' && e.program_id === programId))
        return err(res, { status: 409, message: 'Este email ya tiene una matrícula activa en ese programa. Iniciá sesión en wcahub.vercel.app' });
      if (enrollments.some(e => e.status === 'pending' && e.program_id === programId))
        return err(res, { status: 409, message: 'Ya iniciaste el proceso de inscripción para este programa. Revisá tu email o iniciá sesión.' });
    }

    // ── Create / find auth user ────────────────────────────────────
    let userId;
    if (existing) {
      userId = existing.id;
    } else {
      const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(
        email.toLowerCase(), {
          redirectTo: `${process.env.SITE_URL || 'https://wcahub.vercel.app'}/auth/callback`,
          data: { full_name: name },
        }
      );
      if (invErr) {
        if (invErr.status === 422 || invErr.message?.includes('already')) {
          const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
          const found = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (found) userId = found.id;
          else throw invErr;
        } else throw invErr;
      } else {
        userId = invited.user.id;
      }
    }

    // ── Upsert profile ─────────────────────────────────────────────
    await admin.from('profiles').upsert({
      id: userId, email: email.toLowerCase(), full_name: name,
      phone: phone || null, country: country || null,
      timezone: timezone || 'America/Tegucigalpa',
      role: 'estudiante', active: true,
      terms_accepted_at: termsAcceptedAt,
    }, { onConflict: 'id' });

    // ── Create student row if not exists ───────────────────────────
    let student;
    const { data: existingSt } = await admin.from('students')
      .select('id, student_code').eq('profile_id', userId).maybeSingle();
    if (existingSt) {
      student = existingSt;
    } else {
      const { data: newSt, error: stErr } = await admin.from('students')
        .insert({ profile_id: userId, level: level || 'A1' }).select('id, student_code').maybeSingle();
      if (stErr) throw stErr;
      student = newSt;
    }

    // ── Resolve current_unit ───────────────────────────────────────
    const { data: _existingEnroll } = await admin.from('enrollments')
      .select('id, current_unit').eq('student_id', student.id).eq('program_id', programId).maybeSingle();
    let _regResolved;
    try {
      const _studentLevel = programId === 'en' ? (level || 'A1') : (level || null);
      _regResolved = await resolveCurrentUnit(admin, {
        programId, studentLevel: _studentLevel,
        groupId: groupId || null, existingUnit: _existingEnroll?.current_unit ?? null,
      });
    } catch (unitErr) {
      return err(res, { status: unitErr.status || 422, message: unitErr.message });
    }

    // ── Enrollment — always pending, never active here ─────────────
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: enrollment, error: enrollErr } = await admin.from('enrollments')
      .upsert({
        student_id:        student.id,
        program_id:        programId,
        group_id:          groupId || null,
        status:            'pending',
        current_unit:      _regResolved.unit,
        price_locked:      priceDollars,   // real price from DB
        next_payment_date: addOneMonth(todayStr),
      }, { onConflict: 'student_id,program_id' })
      .select('id').maybeSingle();
    if (enrollErr) throw enrollErr;
    if (!enrollment) throw new Error('No se pudo crear la matrícula');

    // ── Lead upsert ────────────────────────────────────────────────
    await admin.from('leads').upsert({
      full_name: name, email: email.toLowerCase(),
      phone: phone || null, country: country || null,
      stage: 'propuesta', source: 'Autoinscripción web',
      program_interest: programId, level_interest: level || null,
    }, { onConflict: 'email' }).catch(() => {});

    // ── Audit ──────────────────────────────────────────────────────
    await admin.from('audit_log').insert({
      actor_id: userId, action: 'self_registered',
      entity: 'enrollment', entity_id: enrollment.id,
      metadata: { programId, level, groupId, paymentMethod, transferType: transferType || null, country, price: priceDollars },
    }).catch(() => {});

    // ══════════════════════════════════════════════════════════════
    // STRIPE — create pending payment, then redirect to checkout
    // Enrollment activation ONLY via webhook after real payment
    // ══════════════════════════════════════════════════════════════
    if (paymentMethod === 'stripe') {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) return err(res, { status: 503, message: 'Pagos con tarjeta no disponibles en este momento' });

      const refCode = `WCA-STR-${Date.now().toString(36).toUpperCase()}`;
      const { data: pendingPayment, error: ppErr } = await admin.from('payments').insert({
        student_id:     student.id,
        enrollment_id:  enrollment.id,
        amount:         priceDollars,
        currency:       'USD',
        method:         'stripe',
        status:         'pending',
        reference_code: refCode,
      }).select('id').maybeSingle();
      if (ppErr) throw ppErr;

      const stripe = (await import('stripe')).default(key);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: email.toLowerCase(),
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: priceCents,
            recurring: { interval: 'month' },
            product_data: { name: `World Connect Academy — ${progName}` },
          },
          quantity: 1,
        }],
        success_url: `${process.env.SITE_URL || 'https://wcahub.vercel.app'}/registro/gracias?email=${encodeURIComponent(email)}`,
        cancel_url:  `${process.env.SITE_URL || 'https://wcahub.vercel.app'}/registro?canceled=1`,
        metadata: {
          profile_id:    userId,
          student_id:    student.id,
          enrollment_id: enrollment.id,
          payment_id:    pendingPayment.id,
          program_id:    programId,
          amount:        String(priceDollars),
        },
      });

      return ok(res, { type: 'stripe', checkoutUrl: session.url });
    }

    // ══════════════════════════════════════════════════════════════
    // BANK TRANSFER — create pending payment, return bank accounts
    // Enrollment activation ONLY when cobros manually confirms
    // ══════════════════════════════════════════════════════════════
    if (paymentMethod === 'transfer') {
      const { data: allBanks } = await admin.from('bank_accounts')
        .select('nombre, banco, cuenta, titular, tipo')
        .eq('active', true).order('created_at');

      // Filter by transferType via 'tipo' column; fall back to all if none match
      const filtered = (allBanks || []).filter(b => b.tipo?.toLowerCase() === transferType);
      const bankAccounts = filtered.length > 0 ? filtered : (allBanks || []);

      const refCode   = student.student_code || `WCA-${Date.now().toString(36).toUpperCase()}`;
      const firstName = name.split(' ')[0];

      const { data: payment, error: payErr } = await admin.from('payments').insert({
        student_id:     student.id,
        enrollment_id:  enrollment.id,
        amount:         priceDollars,
        currency:       'USD',
        method:         'transfer',
        status:         'pending',
        reference_code: refCode,
        bank:           transferType === 'usa' ? 'USA' : 'Honduras',
      }).select('id').maybeSingle();
      if (payErr) console.error('[register] payment insert failed:', payErr.message);

      try {
        const banksHtml = bankAccounts.map(b => `
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:10px">
            <div style="font-size:13px;font-weight:700;color:#0f172a">${b.nombre}</div>
            <div style="font-size:12px;color:#475569;margin-top:4px">${b.banco || ''} · Cuenta: <strong>${b.cuenta}</strong></div>
            ${b.titular ? `<div style="font-size:11px;color:#94a3b8">Titular: ${b.titular}</div>` : ''}
          </div>`).join('');

        await sendEmail({
          to: email, toName: name,
          subject: `Preinscripción World Connect Academy — Instrucciones de pago ($${priceDollars} USD)`,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
            <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px">
            <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
              <div style="background:#155266;padding:28px;text-align:center">
                <div style="display:inline-block;background:#ffbb23;width:44px;height:44px;border-radius:10px;line-height:44px;font-size:22px;font-weight:900;color:#155266">W</div>
                <div style="color:#fff;font-size:18px;font-weight:700;margin-top:10px">World Connect Academy</div>
              </div>
              <div style="padding:28px">
                <h2 style="color:#0f172a;font-size:20px;margin:0 0 12px">¡Ya casi, ${firstName}! 🎉</h2>
                <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px">
                  Tu preinscripción al programa <strong>${progName}</strong> está confirmada.
                  Realizá tu transferencia de <strong>$${priceDollars} USD</strong>:
                </p>
                <div style="background:#e8f3f6;border:2px solid #155266;border-radius:10px;padding:16px 20px;margin-bottom:20px">
                  <div style="font-size:11px;color:#155266;font-weight:700;letter-spacing:.5px;text-transform:uppercase">Tu código de referencia</div>
                  <div style="font-size:24px;font-weight:800;color:#155266;font-family:monospace;letter-spacing:2px;margin-top:4px">${refCode}</div>
                  <div style="font-size:11px;color:#64748b;margin-top:6px">Incluí este código en la descripción de tu transferencia</div>
                </div>
                ${banksHtml}
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:16px">
                  <div style="font-size:13px;color:#92400e;line-height:1.6">
                    📎 Después de transferir, subí tu comprobante en
                    <a href="https://wcahub.vercel.app" style="color:#155266">wcahub.vercel.app</a>.
                    Tu acceso académico se activa en máximo 24 horas hábiles.
                  </div>
                </div>
              </div>
              <div style="background:#f8fafc;padding:16px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0">
                World Connect Academy · wcahub.vercel.app
              </div>
            </div></body></html>`,
        });
      } catch(emailErr) {
        console.error(`[register] email failed for ${email}:`, emailErr.message);
        await admin.from('audit_log').insert({
          actor_id: null, action: 'email_failed', entity: 'register', entity_id: null,
          metadata: { email, error: emailErr.message, type: 'register_transfer' },
        }).catch(() => {});
      }

      return ok(res, {
        type: 'transfer', referenceCode: refCode,
        amount: priceDollars, currency: 'USD',
        enrollmentId: enrollment.id, paymentId: payment?.id || null,
        bankAccounts, transferType, programName: progName, email,
        message: 'Tu preinscripción está confirmada. Tu acceso académico se desbloqueará cuando el equipo confirme tu pago.',
      });
    }

  } catch(e) { return err(res, e); }
}
