// ─── Certificate Generator ──────────────────────────────────────
// Genera un certificado WCA en canvas y lo descarga como PNG.
// Úsalo en cualquier lugar: generateCertificate({ name, level, date, program })

export async function generateCertificate({ name, level, program, date, isInternational = false }) {
  const W = 1200, H = 800;
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // ── Background ──
  ctx.fillStyle = "#fafaf8";
  ctx.fillRect(0, 0, W, H);

  // ── Outer border (double line) ──
  ctx.strokeStyle = "#155266";
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, W-48, H-48);
  ctx.strokeStyle = "#ffbb23";
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, W-68, H-68);

  // ── Corner ornaments ──
  const corners = [[44,44],[W-44,44],[44,H-44],[W-44,H-44]];
  corners.forEach(([cx,cy]) => {
    ctx.fillStyle = "#ffbb23";
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#155266";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI*2);
    ctx.fill();
  });

  // ── WCA Logo mark ──
  ctx.fillStyle = "#155266";
  ctx.beginPath();
  ctx.roundRect(W/2-36, 60, 72, 72, 14);
  ctx.fill();
  ctx.fillStyle = "#ffbb23";
  ctx.font = "bold 48px Arial Black, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("W", W/2, 120);

  // ── Header ──
  ctx.fillStyle = "#155266";
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("WORLD CONNECT ACADEMY", W/2, 162);

  // ── Divider ──
  ctx.strokeStyle = "#ffbb23";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(200, 175); ctx.lineTo(W-200, 175); ctx.stroke();

  // ── "Certifica que" ──
  ctx.fillStyle = "#64748b";
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText("certifica con orgullo que", W/2, 230);

  // ── Student name ──
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 52px Georgia, serif";
  ctx.fillText(name, W/2, 300);

  // ── Underline name ──
  const nameW = ctx.measureText(name).width;
  ctx.strokeStyle = "#155266";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W/2-nameW/2, 312);
  ctx.lineTo(W/2+nameW/2, 312);
  ctx.stroke();

  // ── "Ha completado satisfactoriamente" ──
  ctx.fillStyle = "#475569";
  ctx.font = "20px Georgia, serif";
  ctx.fillText("ha completado satisfactoriamente el programa de", W/2, 360);

  // ── Program name ──
  ctx.fillStyle = "#155266";
  ctx.font = "bold 36px Arial, sans-serif";
  ctx.fillText(program || "Inglés Completo", W/2, 410);

  // ── Level badge — PH (Phonics) or CEFR level ──
  const levelLabel = level === 'PH' ? 'Phonics' : `Nivel ${level}`;
  const badgeW = level === 'PH' ? 140 : 120;
  const badgeX = W/2 - badgeW/2, badgeY = 438;
  ctx.fillStyle = level === 'PH' ? '#7c3aed' : '#155266';
  ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, 40, 20); ctx.fill();
  ctx.fillStyle = "#ffbb23";
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.fillText(levelLabel, W/2, badgeY + 27);

  // ── International seal for C1 ──
  if (isInternational) {
    ctx.fillStyle = "#c0a500";
    ctx.font = "italic 15px Arial, sans-serif";
    ctx.fillText("✦ Certificado Internacional Reconocido — World Connect Academy ✦", W/2, badgeY + 65);
  }

  // ── Date ──
  ctx.fillStyle = "#94a3b8";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText(`Fecha de emisión: ${date}`, W/2, isInternational ? 540 : 520);

  // ── Signature line ──
  const lineY = 620;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1;
  // Left signature
  ctx.beginPath(); ctx.moveTo(160, lineY); ctx.lineTo(440, lineY); ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 14px Arial, sans-serif";
  ctx.fillText("Directora Académica", 300, lineY+20);
  ctx.fillStyle = "#64748b";
  ctx.font = "12px Arial, sans-serif";
  ctx.fillText("World Connect Academy", 300, lineY+38);
  // Right signature
  ctx.strokeStyle = "#0f172a";
  ctx.beginPath(); ctx.moveTo(760, lineY); ctx.lineTo(1040, lineY); ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 14px Arial, sans-serif";
  ctx.fillText("Coordinación Académica", 900, lineY+20);
  ctx.fillStyle = "#64748b";
  ctx.font = "12px Arial, sans-serif";
  ctx.fillText("WCA Academy", 900, lineY+38);

  // ── Bottom seal ──
  ctx.fillStyle = "#155266";
  ctx.font = "bold 11px Arial, sans-serif";
  ctx.fillText("worldconnectacademy.com  ·  Este certificado valida el progreso académico en el Marco CEFR", W/2, H-52);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px Arial, sans-serif";
  ctx.fillText(`Certificado autenticado · ${new Date().toISOString()}`, W/2, H-35);

  // ── Download as PNG ──
  const link = document.createElement("a");
  link.download = `Certificado-WCA-${name.replace(/\s+/g,"-")}-${level}.png`;
  link.href = canvas.toDataURL("image/png", 0.95);
  link.click();
}
