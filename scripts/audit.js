#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────
// WCA Hub — Audit Script
// Detecta patrones problemáticos conocidos antes de cada commit.
// Ejecutar: node scripts/audit.js
// ─────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";

const ROOT  = process.cwd();
const RESET = "\x1b[0m", RED = "\x1b[31m", YEL = "\x1b[33m", GRN = "\x1b[32m", DIM = "\x1b[2m", BOLD = "\x1b[1m";

let errors = 0, warnings = 0;
const issues = [];

function err(file, msg)  { issues.push({ level:"❌ ERROR",   file, msg }); errors++;   }
function warn(file, msg) { issues.push({ level:"⚠  WARN",    file, msg }); warnings++; }
function info(file, msg) { issues.push({ level:"ℹ  INFO",    file, msg }); }

// ── File walker ────────────────────────────────────────────────
function walk(dir, ext, skip = []) {
  const files = [];
  for (const f of readdirSync(dir)) {
    if (skip.some(s => f.includes(s))) continue;
    const full = join(dir, f);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full, ext, skip));
    } else if (f.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

// ── Helpers ────────────────────────────────────────────────────
function read(p)    { return readFileSync(p, "utf8"); }
function rel(p)     { return relative(ROOT, p); }
function count(s,p) { return (s.match(new RegExp(p, "g")) || []).length; }

// ═══════════════════════════════════════════════════════════════
// FRONTEND CHECKS
// ═══════════════════════════════════════════════════════════════
const jsxFiles  = walk(join(ROOT, "src"), ".jsx", ["node_modules"]);
const jsFiles   = walk(join(ROOT, "src"), ".js",  ["node_modules"]);
const allSrc    = [...jsxFiles, ...jsFiles];
const apiFiles  = walk(join(ROOT, "api"), ".js",  ["_utils"]);

for (const f of allSrc) {
  const c = read(f);
  const fp = rel(f);

  // ── C1: console.log in production code ─────────────────────
  const logs = count(c, "console\\.log\\(");
  const logsDev = count(c, "import\\.meta\\.env\\.DEV.*console\\.log");
  const unguardedLogs = logs - logsDev;
  if (unguardedLogs > 0)
    warn(fp, `${unguardedLogs} console.log() sin guardia import.meta.env.DEV`);

  // ── C2: raw fetch to /api without api helper ────────────────
  const rawFetch = count(c, `fetch\\(['"]/api`);
  if (rawFetch > 0 && !fp.includes("api.js"))
    warn(fp, `${rawFetch} llamada(s) a fetch('/api/...') directas — usar api.post/get/patch`);

  // ── C3: setXxx(json) missing .data for ok() wrapped responses
  const badStats = /set\w+Stats?\s*\(\s*json\s*\)/.test(c) && !/json\.data/.test(c);
  if (badStats)
    err(fp, "setXxxStats(json) sin .data — la API usa ok() wrapper → usar json.data || json");

  // ── C4: hardcoded modal widths (break on 360px mobile) ──────
  const fixedWidths = [...c.matchAll(/width:\s*([4-9]\d{2}|[1-9]\d{3})\b(?!px\s*%)/g)]
    .filter(m => !c.slice(Math.max(0, m.index-10), m.index).includes("min("))
    .length;
  if (fixedWidths > 2 && fp.includes("Section"))
    warn(fp, `${fixedWidths} anchos fijos que pueden cortarse en mobile — usar min(Xpx, 100vw - 32px)`);

  // ── C5: duplicate import of same module ──────────────────────
  const imports = [...c.matchAll(/^import .+ from ['"]([^'"]+)['"]/gm)].map(m => m[1]);
  const dupImports = imports.filter((v, i) => imports.indexOf(v) !== i)
    // Filter: "react" and "react" might be different (React vs hooks)
    // Only flag if the EXACT same specifier appears more than once
    .filter(v => imports.filter(x => x === v).length > 1 &&
      // Skip react (common to have multiple react imports)
      v !== "react");
  if (dupImports.length)
    err(fp, `Imports duplicados: ${[...new Set(dupImports)].join(", ")}`);

  // ── C6: SUB_TABS duplicate entries ──────────────────────────
  if (fp.includes("SuperAdmin")) {
    const subTabBlocks = count(c, '"progs","Programas"');
    if (subTabBlocks > 1)
      err(fp, `Sub-tabs de academia duplicados (${subTabBlocks}x) — eliminar el bloque inline redundante`);

    // Check that all sections are imported OR lazy-loaded before being used in JSX
    const usedSections = [...c.matchAll(/<(\w+Section)\s/g)].map(m => m[1]);
    const importedSections = [...c.matchAll(/import \{ (\w+Section) \}/g)].map(m => m[1]);
    // Also count React.lazy() declarations as valid
    const lazySections = [...c.matchAll(/const (\w+Section)\s*=\s*React\.lazy/g)].map(m => m[1]);
    const allDeclared = new Set([...importedSections, ...lazySections]);
    for (const s of usedSections) {
      if (!allDeclared.has(s))
        err(fp, `<${s}> usado en JSX pero no importado ni lazy-loaded → pantalla en blanco`);
    }
  }

  // ── C7: SessionProvider/Context used but not imported ───────
  if (/<SessionProvider/.test(c) && !/import.*SessionProvider/.test(c))
    err(fp, "SessionProvider usado sin importar → pantalla en blanco");
  if (/useSession\(\)/.test(c) && !/import.*useSession/.test(c) && !fp.includes("useSession.js"))
    err(fp, "useSession() llamado sin importar");

  // ── C8: XP awarded without alreadyDone guard ────────────────
  if (fp.includes("LMSPlayer") && /xp_ledger.*insert/.test(c) && !/alreadyDone/.test(c))
    warn(fp, "XP insert en xp_ledger sin verificar alreadyDone — posible duplicado de XP");

  // ── C9: .single() that should be .maybeSingle() ─────────────
  const singles = [...c.matchAll(/\.single\(\)/g)];
  for (const s of singles) {
    const ctx = c.slice(Math.max(0, s.index - 200), s.index);
    // Only flag if it's a SELECT query (lookup), not an update/insert
    if (/\.select\(/.test(ctx) && !/maybeSingle/.test(ctx)) {
      // db.js is a legacy helper — downgrade to info
      if (fp.includes("lib/db.js") || fp.includes("lib/supabase.js")) {
        info(fp, `.single() en SELECT (legacy) — considera migrar a .maybeSingle()`);
      } else {
        warn(fp, `.single() en SELECT — si no existe el registro → crash PGRST116. Usar .maybeSingle()`);
      }
    }
  }


  // ── C11: Runtime-crash undefined constants ──────────────────
  // These patterns actually execute at runtime (not just in comments)
  const runtimePatterns = [
    /Object\.keys\(([A-Z][A-Z0-9_]{2,})\)/g,
    /useState\(([A-Z][A-Z0-9_]{2,})\)/g,
    /\b([A-Z][A-Z0-9_]{2,})\.(?:map|filter|slice|find|some|reduce|length)\b/g,
  ];
  const knownGlobals = new Set([
    'Object','Array','JSON','Math','Date','Promise','Error',
    'INITIAL_SESSION','SIGNED_OUT','MRR_DATA','ROLES_DEF','XP_ACTIONS',
    'ALL_PROGRAMS','LEVELS','UNITS','SKILLS','NAV','PROGRAMS','STAGES',
    'TYPES','DEPTS','TABS','ROLES','SUB_TABS','VIEWS','ROLE_PORTALS',
    'PAIRS','STEPS','QUESTIONS_SEED',
  ]);
  for (const pattern of runtimePatterns) {
    for (const m of c.matchAll(pattern)) {
      const name = m[1];
      if (!name || knownGlobals.has(name)) continue;
      // Check if defined in file
      const isDefined = new RegExp(`(?:const|let|var)\\s+${name}\\b`).test(c) ||
                        new RegExp(`import\\s*\\{[^}]*\\b${name}\\b`).test(c) ||
                        c.includes(`export const ${name}`);
      if (!isDefined) {
        err(fp, `Runtime crash risk: ${name} usado como variable pero nunca definido. Reemplazar con estado real (useState/props).`);
      }
    }
  }



  // ── C13: Known runtime undefined references ──────────────────
  const KNOWN_UNDEFINED = [
    { pattern: /coordGroupCounts\[/, file: 'CoordAcademica', msg: 'coordGroupCounts no está definido — usar 0 o cargar de DB' },
    { pattern: /transfers(?!\s*=)/, file: 'GestorCobros', msg: 'transfers no definido — usar displayHistory o pending' },
  ];
  for (const { pattern, file, msg } of KNOWN_UNDEFINED) {
    if (fp.includes(file) && pattern.test(c)) {
      err(fp, msg);
    }
  }

  // ── C12: CSS vars in React inline style numeric props ────────
  // React inline styles require NUMBERS for zIndex, not CSS variable strings
  const cssVarInNumeric = [...c.matchAll(/(?:zIndex|(?<![a-zA-Z])order|(?<![a-zA-Z])flex(?!Direction|Wrap|Shrink|Grow|Basis|Flow)|(?<![a-zA-Z])opacity):\s*["']var\(/g)];
  if (cssVarInNumeric.length) {
    err(fp, `${cssVarInNumeric.length} CSS var(--) en propiedad numérica inline — React requiere número, no string CSS.`);
  }

  // ── C10: Supabase .eq() on joined tables (invalid syntax) ───
  const badEq = [...c.matchAll(/\.eq\(['"][\w]+\.[\w]+['"]/g)];
  if (badEq.length)
    err(fp, `${badEq.length} .eq('tabla.columna') — sintaxis inválida en Supabase JS. Filtrar en JS o usar RPC`);
}

// ═══════════════════════════════════════════════════════════════
// API CHECKS
// ═══════════════════════════════════════════════════════════════
for (const f of apiFiles) {
  const c = read(f);
  const fp = rel(f);

  // ── A1: API without method check ────────────────────────────
  if (!c.includes("req.method"))
    err(fp, "Endpoint sin verificar req.method — acepta GET/POST/DELETE indiscriminadamente");

  // ── A2: API without requireAuth ─────────────────────────────
  if (!c.includes("requireAuth") && !c.includes("getSupabaseAdmin") && !fp.includes("stripe"))
    warn(fp, "Endpoint sin requireAuth — puede ser accedido sin autenticación");

  // ── A3: Missing setCORS ──────────────────────────────────────
  if (!c.includes("setCORS") && !fp.includes("daily-billing") && !fp.includes("stripe") && !fp.includes("whatsapp"))
    warn(fp, "Endpoint sin setCORS — CORS puede fallar en producción");

  // ── A4: Exposed secrets or sensitive logs ────────────────────
  if (/console\.log\([^)]*(?:token|secret|password|key)/i.test(c))
    err(fp, "console.log() con dato sensible (token/secret/key) — remover inmediatamente");
}

// ═══════════════════════════════════════════════════════════════
// SQL / DATABASE CHECKS
// ═══════════════════════════════════════════════════════════════
const sqlFiles = walk(join(ROOT, "supabase"), ".sql", []);
for (const f of sqlFiles) {
  const c = read(f);
  const fp = rel(f);

  // ── D1: Single quotes in jsonb string literals ───────────────
  // Pattern: '{ ... content with ' ... }'::jsonb inside DO $$ block
  // The single quote must be inside a double-quoted JSON value and NOT already escaped as ''
  if (c.includes("DO $$") && c.includes("::jsonb")) {
    // Extract jsonb string literals: '{ ... }'::jsonb
    const jsonbLiterals = [...c.matchAll(/'(\{[\s\S]+?\})'::jsonb/g)];
    let unescapedCount = 0;
    for (const match of jsonbLiterals) {
      const content = match[1];
      // Find single quotes inside JSON double-quoted values that are NOT already escaped
      const singles = [...content.matchAll(/"[^"]*'[^"]*"/g)]
        .filter(m => !m[0].includes("''") && !m[0].match(/\\['"]/));
      unescapedCount += singles.length;
    }
    if (unescapedCount > 0)
      err(fp, `${unescapedCount} comilla(s) simple sin escapar en strings jsonb — usar '' en vez de '`);
  }

  // ── D2: FK on enum types ────────────────────────────────────
  if (/REFERENCES public\.programs\(id\).*text/i.test(c) ||
      /text.*REFERENCES public\.programs\(id\)/i.test(c))
    err(fp, "FK text → programs(id) — programs.id es enum program_id, incompatible con text. Quitar FK o cambiar tipo");

  // ── D3: Tables without RLS ──────────────────────────────────
  const tables = [...c.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?public\.(\w+)/gi)].map(m => m[1]);
  for (const tbl of tables) {
    if (!c.includes(`ENABLE ROW LEVEL SECURITY`) && !["app_config","cycle_config","holidays"].includes(tbl))
      warn(fp, `Tabla '${tbl}' sin ENABLE ROW LEVEL SECURITY`);
  }
}

// ═══════════════════════════════════════════════════════════════
// PROJECT-LEVEL CHECKS
// ═══════════════════════════════════════════════════════════════

// ── P1: Function limit (Vercel Hobby = 12) ───────────────────
const fnCount = apiFiles.length;
if (fnCount > 12)
  err("api/", `${fnCount} funciones serverless — Vercel Hobby tiene límite de 12. Consolidar endpoints`);
else if (fnCount >= 11)
  warn("api/", `${fnCount}/12 funciones serverless — cerca del límite de Vercel Hobby`);


// ── P4: SW version must not be hardcoded ─────────────────────
const swContent = read(join(ROOT, 'public/sw.js'));
if (/wca-hub-v[0-9]/.test(swContent) && !swContent.includes('__WCA_BUILD_ID__')) {
  warn('public/sw.js', 'Cache version hardcodeada — usar self.__WCA_BUILD_ID__ para auto-versionado en cada deploy');
}

// ── P5: Privacy/Terms pages exist ─────────────────────────────
const privacyExists = existsSync(join(ROOT, 'src/pages/PrivacyPolicy.jsx'));
const termsExists   = existsSync(join(ROOT, 'src/pages/TermsOfUse.jsx'));
if (!privacyExists) warn('src/pages/', 'Falta PrivacyPolicy.jsx — requerida por GDPR/LGPD');
if (!termsExists)   warn('src/pages/', 'Falta TermsOfUse.jsx — requerida para claridad legal');

// ── P2: Duplicate meta tags in index.html ────────────────────
const html = read(join(ROOT, "index.html"));
const descCount = count(html, 'meta name="description"');
if (descCount > 1)
  err("index.html", `${descCount} meta description — duplicado perjudica SEO`);

// ── P3: Security headers in vercel.json ──────────────────────
const vj = read(join(ROOT, "vercel.json"));
for (const header of ["X-Frame-Options", "Strict-Transport-Security", "X-Content-Type-Options"]) {
  if (!vj.includes(header))
    warn("vercel.json", `Header de seguridad faltante: ${header}`);
}

// ── P4: Build must pass ───────────────────────────────────────
// (handled by pre-commit hook running npm run build)

// ═══════════════════════════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════════════════════════
console.log(`\n${BOLD}WCA Hub Audit${RESET} — ${new Date().toLocaleString("es-HN")}\n`);

if (!issues.length) {
  console.log(`${GRN}${BOLD}✓ Sin problemas detectados${RESET}\n`);
  process.exit(0);
}

// Group by level
const errs  = issues.filter(i => i.level.startsWith("❌"));
const warns = issues.filter(i => i.level.startsWith("⚠"));
const infos = issues.filter(i => i.level.startsWith("ℹ"));

for (const { level, file, msg } of [...errs, ...warns, ...infos]) {
  const color = level.startsWith("❌") ? RED : level.startsWith("⚠") ? YEL : DIM;
  console.log(`${color}${level}${RESET} ${DIM}${file}${RESET}`);
  console.log(`       ${msg}\n`);
}

console.log(`${BOLD}Resumen:${RESET} ${RED}${errors} error(es)${RESET}  ${YEL}${warnings} advertencia(s)${RESET}\n`);

if (errors > 0) {
  console.log(`${RED}${BOLD}✗ Audit falló — corregí los errores antes de hacer commit${RESET}\n`);
  process.exit(1);
} else {
  console.log(`${YEL}${BOLD}⚠ Audit pasó con advertencias — revisá antes de hacer push${RESET}\n`);
  process.exit(0);
}
