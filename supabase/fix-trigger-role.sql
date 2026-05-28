-- ══════════════════════════════════════════════════════════════════
-- FIX: Trigger never overwrites role on existing profiles
-- Ejecutar en Supabase SQL Editor si el trigger fue modificado
-- ══════════════════════════════════════════════════════════════════

-- Trigger robusto: 
--   - Nuevos usuarios → role='estudiante' siempre
--   - Usuarios existentes (staff invitado) → solo actualiza email/nombre/avatar
--   - NUNCA sobreescribe el role existente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, active, onboarding_done)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email,'@',1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    'estudiante',
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
    -- NOTA: role NO se actualiza aquí — el rol solo lo cambia el admin vía /api/auth
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
