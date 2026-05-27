// ─── WCA Hub — Timezone utilities ────────────────────────────────
// All class times are stored in UTC in groups.schedule_utc.
// This module converts them to the student's local timezone for display.
//
// Usage:
//   import { formatSchedule, detectTimezone, TIMEZONES } from '../lib/timezone.js';
//
//   // Display class time in student's timezone
//   formatSchedule(group.schedule_utc, group.schedule_end_utc, 'America/Bogota')
//   // → "6:00–7:00 PM (tu hora)" or "11:00 PM – 12:00 AM (tu hora)"
//
//   // Detect from browser
//   const tz = detectTimezone(); // → 'America/Bogota'

// ── Detect browser timezone ────────────────────────────────────────
export function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Tegucigalpa';
  } catch {
    return 'America/Tegucigalpa';
  }
}

// ── Convert a UTC time string (HH:MM:SS) to local time display ────
// baseDate defaults to today — we only care about the time part.
export function utcTimeToLocal(utcTimeStr, targetTimezone) {
  if (!utcTimeStr) return null;
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dt = new Date(`${today}T${utcTimeStr}Z`);
    return dt.toLocaleTimeString('es', {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: targetTimezone,
    });
  } catch {
    return null;
  }
}

// ── Format class schedule in student's timezone ────────────────────
// Returns a human-readable string like "6:00–7:00 PM (tu hora)"
// Falls back to the raw schedule text if UTC times aren't set.
export function formatSchedule(group, studentTimezone) {
  const tz = studentTimezone || detectTimezone();
  const groupTz = group?.schedule_timezone || 'America/Tegucigalpa';

  // If UTC times are available, convert to student's timezone
  if (group?.schedule_utc) {
    const start = utcTimeToLocal(group.schedule_utc, tz);
    const end   = group?.schedule_end_utc ? utcTimeToLocal(group.schedule_end_utc, tz) : null;
    if (start) {
      const timeStr = end ? `${start}–${end}` : start;
      // Show timezone note only if different from the group's base timezone
      const sameZone = tz === groupTz;
      return sameZone ? timeStr : `${timeStr} (tu hora)`;
    }
  }

  // Fallback: raw schedule text (Honduras time assumed)
  if (group?.schedule) {
    const sameZone = tz === groupTz || tz === 'America/Tegucigalpa';
    return sameZone
      ? group.schedule
      : `${group.schedule} Honduras${getOffsetNote(tz, groupTz)}`;
  }

  return 'Horario por confirmar';
}

// ── Get offset note between two timezones ─────────────────────────
// Returns a short string like " (+1h)" or " (−1h)"
function getOffsetNote(studentTz, groupTz) {
  try {
    const now = Date.now();
    const getOffset = (tz) => {
      const parts = new Intl.DateTimeFormat('en', {
        timeZone: tz, hour: 'numeric', hour12: false, timeZoneName: 'short'
      }).formatToParts(now);
      const h = parts.find(p => p.type === 'hour')?.value;
      const utcH = new Date(now).getUTCHours();
      return (parseInt(h) - utcH + 24) % 24;
    };
    const diff = getOffset(studentTz) - getOffset(groupTz);
    if (diff === 0) return '';
    return diff > 0 ? ` (+${diff}h)` : ` (${diff}h)`;
  } catch {
    return '';
  }
}

// ── List of supported LATAM + global timezones for profile settings ─
export const TIMEZONES = [
  // LATAM
  { value: 'America/Tegucigalpa', label: 'Honduras (UTC−6)',         region: 'Centroamérica' },
  { value: 'America/Guatemala',   label: 'Guatemala (UTC−6)',        region: 'Centroamérica' },
  { value: 'America/El_Salvador', label: 'El Salvador (UTC−6)',      region: 'Centroamérica' },
  { value: 'America/Managua',     label: 'Nicaragua (UTC−6)',        region: 'Centroamérica' },
  { value: 'America/Costa_Rica',  label: 'Costa Rica (UTC−6)',       region: 'Centroamérica' },
  { value: 'America/Panama',      label: 'Panamá (UTC−5)',           region: 'Centroamérica' },
  { value: 'America/Mexico_City', label: 'México (UTC−6 / −5)',      region: 'Norteamérica'  },
  { value: 'America/Bogota',      label: 'Colombia (UTC−5)',         region: 'Suramérica'    },
  { value: 'America/Lima',        label: 'Perú (UTC−5)',             region: 'Suramérica'    },
  { value: 'America/Caracas',     label: 'Venezuela (UTC−4)',        region: 'Suramérica'    },
  { value: 'America/La_Paz',      label: 'Bolivia (UTC−4)',          region: 'Suramérica'    },
  { value: 'America/Santiago',    label: 'Chile (UTC−4 / −3)',       region: 'Suramérica'    },
  { value: 'America/Sao_Paulo',   label: 'Brasil (UTC−3)',           region: 'Suramérica'    },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (UTC−3)', region: 'Suramérica' },
  { value: 'America/Montevideo',  label: 'Uruguay (UTC−3)',          region: 'Suramérica'    },
  { value: 'America/Asuncion',    label: 'Paraguay (UTC−4 / −3)',    region: 'Suramérica'    },
  { value: 'America/Guayaquil',   label: 'Ecuador (UTC−5)',          region: 'Suramérica'    },
  { value: 'America/Santo_Domingo', label: 'Rep. Dominicana (UTC−4)', region: 'Caribe'       },
  { value: 'America/Havana',      label: 'Cuba (UTC−5 / −4)',        region: 'Caribe'        },
  { value: 'America/Puerto_Rico', label: 'Puerto Rico (UTC−4)',      region: 'Caribe'        },
  // USA
  { value: 'America/New_York',    label: 'EE.UU. Este (UTC−5 / −4)', region: 'Norteamérica'  },
  { value: 'America/Chicago',     label: 'EE.UU. Centro (UTC−6 / −5)', region: 'Norteamérica' },
  { value: 'America/Denver',      label: 'EE.UU. Montaña (UTC−7 / −6)', region: 'Norteamérica' },
  { value: 'America/Los_Angeles', label: 'EE.UU. Pacífico (UTC−8 / −7)', region: 'Norteamérica' },
  // Europa
  { value: 'Europe/Madrid',       label: 'España (UTC+1 / +2)',      region: 'Europa'        },
  { value: 'Europe/London',       label: 'Reino Unido (UTC+0 / +1)', region: 'Europa'        },
  { value: 'Europe/Paris',        label: 'Francia / Italia (UTC+1 / +2)', region: 'Europa'  },
  // Otros
  { value: 'America/Toronto',     label: 'Canadá Este (UTC−5 / −4)', region: 'Norteamérica'  },
  { value: 'America/Vancouver',   label: 'Canadá Pacífico (UTC−8 / −7)', region: 'Norteamérica' },
];

// ── Group timezones by region for <select> rendering ──────────────
export function getTimezonesByRegion() {
  return TIMEZONES.reduce((acc, tz) => {
    if (!acc[tz.region]) acc[tz.region] = [];
    acc[tz.region].push(tz);
    return acc;
  }, {});
}
