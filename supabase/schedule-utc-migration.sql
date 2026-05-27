-- ══════════════════════════════════════════════════════════════════
-- WCA Hub — Migración de horarios a UTC
-- Convierte grupos existentes con schedule en texto → schedule_utc
-- Honduras es siempre UTC-6 (sin horario de verano)
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  g        RECORD;
  m        text[];
  em       text[];
  h        int;  mn  int;  is_pm bool;
  eh       int;  emn int;  epm   bool;
  lm       int;  um  int;
  start_utc time; end_utc time;
BEGIN
  FOR g IN
    SELECT id, schedule
    FROM groups
    WHERE schedule_utc IS NULL
      AND schedule IS NOT NULL
      AND schedule != ''
  LOOP

    -- ── Parse start time: first "H:MM AM/PM" in the string ─────────
    m := regexp_match(g.schedule, '(\d{1,2}):(\d{2})\s*(AM|PM)', 'i');
    CONTINUE WHEN m IS NULL;  -- skip unparseable schedules

    h  := m[1]::int;
    mn := m[2]::int;
    is_pm := upper(m[3]) = 'PM';

    IF is_pm  AND h != 12 THEN h := h + 12; END IF;
    IF NOT is_pm AND h = 12 THEN h := 0;   END IF;

    lm := h * 60 + mn;
    um := (lm + 360) % 1440;   -- Honduras UTC-6: + 6*60 = +360 min
    start_utc := make_time(um / 60, um % 60, 0);

    -- ── Parse end time: after dash separator ──────────────────────
    end_utc := NULL;

    -- Try "– H:MM AM/PM" (explicit AM/PM on end time)
    em := regexp_match(g.schedule, '[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)', 'i');
    IF em IS NOT NULL THEN
      eh := em[1]::int; emn := em[2]::int; epm := upper(em[3]) = 'PM';
      IF epm  AND eh != 12 THEN eh := eh + 12; END IF;
      IF NOT epm AND eh = 12 THEN eh := 0;    END IF;
      lm := eh * 60 + emn;
      um := (lm + 360) % 1440;
      end_utc := make_time(um / 60, um % 60, 0);
    ELSE
      -- Try "– H:MM" with shared AM/PM from start (e.g. "6:00–7:00 PM")
      em := regexp_match(g.schedule, '[-–—]\s*(\d{1,2}):(\d{2})', 'i');
      IF em IS NOT NULL THEN
        eh := em[1]::int; emn := em[2]::int;
        epm := is_pm;  -- inherit start's AM/PM
        IF epm  AND eh != 12 THEN eh := eh + 12; END IF;
        IF NOT epm AND eh = 12 THEN eh := 0;    END IF;
        lm := eh * 60 + emn;
        um := (lm + 360) % 1440;
        end_utc := make_time(um / 60, um % 60, 0);
      END IF;
    END IF;

    UPDATE groups
    SET schedule_utc      = start_utc,
        schedule_end_utc  = end_utc,
        schedule_timezone = 'America/Tegucigalpa'
    WHERE id = g.id;

    RAISE NOTICE 'Grupo % → "%" | UTC inicio: % | UTC fin: %',
      g.id, g.schedule, start_utc, end_utc;
  END LOOP;

  RAISE NOTICE '=== Migración completada ===';
END $$;

-- ── Verificación: ver resultado ─────────────────────────────────
SELECT
  id,
  level,
  schedule          AS "Horario texto (HN)",
  schedule_utc      AS "Inicio UTC",
  schedule_end_utc  AS "Fin UTC",
  schedule_timezone AS "Timezone"
FROM groups
WHERE active = true
ORDER BY level, schedule_utc;
