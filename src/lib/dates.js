// ─── WCA Dates — Honduras timezone (UTC-6) ───────────────────────
const TZ = "America/Tegucigalpa";

export function formatDate(date, style = "short") {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const opts = style === "full"
    ? { day:"2-digit", month:"long", year:"numeric", timeZone:TZ }
    : style === "time"
    ? { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit", timeZone:TZ }
    : { day:"2-digit", month:"short", year:"numeric", timeZone:TZ };
  return d.toLocaleDateString("es-HN", opts);
}

export function formatTime(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-HN", { hour:"2-digit", minute:"2-digit", timeZone:TZ });
}

export function relativeTime(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return formatDate(date);
}
