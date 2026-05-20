# WCA Development Process

## Antes de cualquier cambio de UI
1. Leer WCA-DESIGN-SYSTEM.md
2. Identificar archivos afectados
3. Verificar que el build local pase ANTES de hacer push

## Anti-patterns críticos a evitar
- Slashes en JSX text: >/mes< >/12< → usar {"/"} o texto alternativo
- Inyección de código por string.replace() en archivos largos → reescribir completo
- Patch sobre patch → después de 3 patches al mismo archivo, reescribir desde cero
- `export default function DashboardAdmin` ≠ `DashboardAdmin.jsx` (verificar nombre real)

## Logout en portales
Todos los portales tienen sidebar con footer de usuario.
El logout va en ese footer, debajo del nombre/rol del usuario:
- Ícono: ti-logout
- Texto: "Cerrar sesión"
- Acción: navigate("/")
- Color: rojo al hover
- Ver patrón en WCA-DESIGN-SYSTEM.md

## Flujo visual feedback
Usuario manda screenshot → identificar el gap exacto → corregir ese gap específico
No asumir — preguntar si la referencia visual no está clara.

## Build check obligatorio
npm run build → esperar "✓ built in X.XXs" → push
Si falla: diagnosticar línea exacta del error antes de parchear.
