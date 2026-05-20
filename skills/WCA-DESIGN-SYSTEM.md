# WCA Design System — Tokens & Rules

## Brand Identity
WCA Academy: academia VA bilingüe #1 en LATAM. Tono: profesional, cálido, confiable, internacional.
Estética target: "Luxury EdTech" — como Duolingo meets Notion meets Linear.

## Color Tokens (usar SIEMPRE estos, nunca hardcodear variantes)
```
Primary:    #155266   → sidebars, botones primarios, headers, links
Primary-Dk: #0f3d4d   → hover de primary, deep background
Primary-Lt: #e8f3f6   → fondos suaves, chips, badges de primary
Gold:       #ffbb23   → CTA principal, badges activos, accents
Gold-Dk:    #e6a800   → hover de gold
Gold-Lt:    #fff8e6   → fondos de gold
Green:      #059669   → éxito, activo, completado
Green-Lt:   #ecfdf5
Red:        #dc2626   → error, suspendido, eliminar
Red-Lt:     #fef2f2
Amber:      #d97706   → advertencia, pendiente
Amber-Lt:   #fffbeb
Purple:     #7c3aed   → VA program accent
Surface:    var(--bg-surface)       → white en claro, #1e293b en oscuro
Surface-2:  var(--bg-surface-subtle) → #f8fafc en claro, #0f172a en oscuro
Border:     var(--border)           → #e2e8f0 en claro, #1e293b en oscuro
Text-1:     var(--text-primary)     → #0f172a en claro, #f1f5f9 en oscuro
Text-2:     var(--text-secondary)   → #475569 en claro, #94a3b8 en oscuro
Text-3:     var(--text-tertiary)    → #94a3b8 en claro, #475569 en oscuro
```

## Typography Scale
```
Display:  DM Serif Display, 36–54px, weight 400, italic para énfasis (solo Landing)
H1:       DM Sans 700, 24px, color text-primary
H2:       DM Sans 700, 18px
H3:       DM Sans 600, 15px
Body:     DM Sans 400, 13–14px, lineHeight 1.6
Small:    DM Sans 400, 11–12px
Micro:    DM Sans 600, 9–10px, letterSpacing 0.8px, UPPERCASE (labels, badges)
```

## Spacing Scale (múltiplos de 4px)
4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80

## Border Radius
- Cards grandes: 16px
- Cards medianas: 12–14px
- Botones: 10px
- Chips/badges: 20–30px (pill)
- Inputs: 9px
- Avatares: 50%

## Shadow System
```
shadow-sm:  0 1px 4px rgba(0,0,0,.04)
shadow-md:  0 4px 16px rgba(0,0,0,.08)
shadow-lg:  0 8px 32px rgba(0,0,0,.12)
shadow-xl:  0 20px 60px rgba(0,0,0,.18)
shadow-colored: 0 6px 20px {color}30  (usar color del contexto)
```

## Component Patterns

### Sidebar WCA
- Background: #0f3d4d (PH)
- Width: 196–218px
- Logo área: 22px padding, amarillo WCA
- Nav items: 12px font, gap 10px, hover rgba(255,255,255,.12)
- Active: borderLeft 2px solid #ffbb23, background rgba(255,255,255,.12)
- Footer: separador sutil, avatar + nombre + rol

### Cards de datos
- Background: var(--bg-surface)
- Border: 1px solid var(--border)
- Radius: 14px
- Padding: 18–20px
- Shadow: shadow-sm
- Hover: shadow-md + translateY(-2px)
- KPI cards: borderTop 3px solid {color}

### Botones
- Primary: bg #155266, color #fff, hover #1a6a82, radius 10px, padding 10–13px 20–24px
- Gold: bg #ffbb23, color #0f3d4d, hover #e6a800
- Ghost: bg transparent, border 1px var(--border), color text-secondary
- Destructive: bg #fef2f2, color #dc2626
- Icon-only: bg surface-subtle, 32–36px cuadrado o redondeado

### Badges/Chips
- Siempre usar el par (bg-Lt, color) del token correspondiente
- Font: 10–11px, fontWeight 600, letterSpacing 0.5px
- Nunca usar fondos oscuros o texto blanco en badges inline

### Tablas
- thead: bg surface-subtle, th: 10px uppercase 700 text-tertiary letterSpacing .5
- td: 12–14px, padding 12–14px
- row hover: bg surface-subtle, cursor pointer

### Modales
- Overlay: rgba(0,0,0,.45) + backdrop-filter blur(4–8px)
- Panel: bg surface, radius 18px, padding 26px, maxWidth 460px
- Shadow: shadow-xl
- Header: título 15px 700 + subtítulo + botón ✕ top-right
- Footer: flex gap:8, siempre BtnGhost + BtnPrimary

## Animation Library (copiar estos exactos)
```css
@keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
@keyframes slideIn   { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
@keyframes menuUp    { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:none} }
@keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes popIn     { 0%{opacity:0;transform:scale(.92)} 60%{transform:scale(1.02)} 100%{opacity:1;transform:none} }
@keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
```

## Micro-interactions Rules
1. TODOS los botones: transition: all .15s ease
2. Cards clicables: transition: transform .15s, box-shadow .15s
3. Cards hover: translateY(-2px) + shadow-md
4. Inputs focus: borderColor → #155266 (no outline nativo)
5. Toasts: slideIn .3s ease, auto-dismiss 3s
6. Modales: popIn .25s ease al aparecer
7. Tablas rows: background transition .1s
8. Sidebar nav items: background/color transition .15s
9. Loading spinner: spin .8s linear infinite
10. Skeleton: shimmer 1.5s infinite linear

## Skeleton Screen Pattern
```jsx
function Skeleton({ w="100%", h=14, radius=6, mb=8 }) {
  return <div style={{
    width:w, height:h, borderRadius:radius, marginBottom:mb,
    background:"linear-gradient(90deg,var(--bg-surface-subtle) 25%,var(--border) 50%,var(--bg-surface-subtle) 75%)",
    backgroundSize:"200% 100%",
    animation:"shimmer 1.5s infinite linear"
  }}/>;
}
```

## Toast System (global, usar en TODOS los portales)
```jsx
function Toast({ msg, color="#059669", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return ()=>clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", top:20, right:90, zIndex:9999,
      background:color, color:"#fff", padding:"11px 18px",
      borderRadius:11, fontSize:13, fontWeight:600,
      boxShadow:`0 6px 20px ${color}40`,
      display:"flex", gap:8, alignItems:"center",
      animation:"slideIn .3s ease", fontFamily:"'DM Sans',sans-serif"
    }}>
      ✓ {msg}
    </div>
  );
}
```

## Accessibility Rules
1. Todos los <button> con cursor:pointer explícito (ya se hace)
2. Todos los íconos decorativos: aria-hidden="true" (ya se hace)
3. Inputs siempre con <label> asociado o aria-label
4. Modales: focus trap — primer elemento enfocable al abrir
5. Color: texto secundario mínimo #475569 sobre blanco (#fafafa) = 7.2:1 ✓
6. Evitar transmitir info SOLO por color — siempre acompañar con texto/ícono
7. Botones sin texto visible: siempre title="" o aria-label=""
8. Focus visible: outline:none pero reemplazar con boxShadow: 0 0 0 2px #155266
9. role="dialog" + aria-modal="true" en modales
10. Tablas: <th scope="col"> en headers

## Logout Pattern (aplicar en TODOS los portales)
```jsx
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();

// En el footer del sidebar:
<button onClick={()=>navigate("/")} 
  title="Cerrar sesión — volver al inicio"
  style={{ width:"100%", display:"flex", alignItems:"center", gap:8,
    padding:"9px 18px", background:"transparent", border:"none",
    color:"rgba(255,255,255,.35)", fontSize:12, cursor:"pointer",
    fontFamily:"inherit", transition:"all .15s", borderTop:"1px solid rgba(255,255,255,.08)",
    marginTop:8 }}
  onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.background="rgba(220,38,38,.15)";}}
  onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.35)";e.currentTarget.style.background="transparent";}}>
  <i className="ti ti-logout" style={{fontSize:14}} aria-hidden="true"/>
  Cerrar sesión
</button>
```

## Do / Don't
✅ DO: CSS variables para colores semánticos en portales internos
✅ DO: Paleta directa (#155266 etc) en Landing/Onboarding (no usan CSS vars)
✅ DO: gap en flex/grid (no margins para spacing entre siblings)
✅ DO: fontFamily:"inherit" en todos los elementos interactivos
✅ DO: Slashes en JSX siempre dentro de strings: {"/"} o texto alternativo
❌ DON'T: /mes /trimestre /año como texto JSX directo — esbuild lo lee como regex
❌ DON'T: Colores hardcoded en portales que usan CSS vars (rompería dark mode)
❌ DON'T: onClick vacío () => {} en botones que se van a implementar pronto
❌ DON'T: Más de 2 niveles de grilla anidada
❌ DON'T: fontSize < 11px en texto informativo
