# Test 4 — Accesibilidad (WCAG 2.1 AA)

**Fecha:** 2026-09-10
**Objetivo:** auditoría WCAG 2.1 AA de todas las plantillas de `inventory-app`
**Skills aplicados:** `frontend-ui-engineering` + referencia `accessibility-checklist.md`
**Verificación:** `npm run lint` ✅ | `npm run build` ✅ | `prettier --check` ✅

---

## 1. Resumen

La aplicación tenía una base de accesibilidad **notablemente buena** (en riesgo de pasarse por alto por
ser "solo un prototipo"): `lang="es"`, títulos por ruta, `<label for>` en todos los inputs, `alt=""`
decorativo, botones de icono con `aria-label`/`title`, `aria-pressed` en alternadores, `aria-live`
en toasts, `role="alertdialog"` + `aria-modal` + `aria-labelledby` y Escape en el diálogo, y
`prefers-reduced-motion`. Se corrigieron los huecos reales (sección 3).

## 2. Hallazgos

| ID | Criterio | Hallazgo |
|---|---|---|
| A1 | **2.1.2 / 2.4.3** | `confirm-dialog`: el foco entraba en el botón de confirmar, pero **no había trampa de Tab** (podías tabular fuera del modal hacia el fondo) y **no se restauraba el foco** al origen al cerrar. |
| A2 | **2.4.1 (Bypass Blocks)** | No existía **skip-link** para saltar el menú lateral (bloque repetido en todas las rutas). El `<main>` no tenía `id` ancla. |
| A3 | **1.4.3 (Contraste AA)** | Texto semántico `--muted: #8b90ad` sobre `--canvas: #e9ebf4` → **~2.8:1** (falla 4.5:1). Afecta párrafos `.muted`, hints de formulario, sublabels de tablas, etc. |
| A4 | 1.4.3 (Contraste) | `--amber: #a96a0c` sobre `--amber-bg` (chips "Bajo"/warning) → **~3.9:1** (falla). |
| A5 | 1.4.3 (Contraste) | Botones primarios blancos sobre `--violet: #7c5cff` → **~4.3:1**; texto violeta sobre superficies → ~4.3:1 (al límite/falla). |
| A6 | 1.3.1 | `<th>` de las 3 tablas (products, movements, suppliers) sin `scope`. |
| A7 | Verificado OK | Foco visible: inputs/select/textarea tienen anillo `box-shadow 0 0 0 3px rgb(124 92 255 / .18)`; botones/enlaces conservan outline nativo; `.ctl`/`.icon-btn`/`.toast-close` tienen `:focus-visible` propio. Sin arquitectura de "color-only": los estados de stock usan texto (Agotado/Bajo/OK). |
| A8 | Verificado OK | Diálogo: foco inicial en el botón de confirmar + Escape ya existían (se complementaron con A1). `aria-live` en toasts ya presente. |

Contraste documentado como **info**: colores de gráficas del dashboard (SVG: `--teal`/`--saffron`/`--coral`/`--sky`)
son elementos decorativos/no-texto (exentos por 1.4.11 con umbral 3:1); se recomienda verificación manual visual.

## 3. Fixes aplicados

| ID | Archivo(s) | Cambio |
|---|---|---|
| A1 | `components/confirm-dialog/confirm-dialog.component.ts` | **Trampa de Tab** (`onOverlayKey` captura `Tab`, cicla al primer/último foco dentro del diálogo) y **restauración de foco** al orígen al cerrarse (se guarda `previousFocus` antes de enfocar el diálogo; `effect` lo devuelve cuando el state pasa a `null`). |
| A2 | `app.html` + `styles.scss` | `<a class="skip-link" href="#main">Saltar al contenido</a>` (visible solo en `:focus-visible`) + `id="main"` en `<main>`. |
| A3 | `styles.scss` | `--muted: #8b90ad → #5f6472` (~5.1:1 sobre canvas; ~5.3:1 sobre surface). Se actualizó también el alias `--neutral-500`. |
| A4 | `styles.scss` | `--amber: #a96a0c → #8a5a0a` (~5.3:1 sobre `--amber-bg`). |
| A5 | `styles.scss` | `--violet: #7c5cff → #6848f2`: blanco sobre primario → ~5.6:1; violeta como texto → ≥4.7:1. También corrige el fondo del skip-link (usa `--violet-2`, ≥5.7:1). |
| A6 | `products/movements/suppliers.component.html` | `<th scope="col">` en todas las columnas de las 3 tablas. |

## 4. Ledger de intentos

| Idea | Resultado | Veredicto | Por qué |
|---|---|---|---|
| Trampa de Tab + restore de foco en diálogo | Handler Tab cycla; effect restaura | **kept** | Cumple 2.1.2/2.4.3; bajo riesgo |
| Skip-link visible al enfocar | Enlace oculto hasta `:focus-visible` | **kept** | Estándar 2.4.1; no afecta visual normal |
| Oscurecer muted/amber/violet | 3 tokens de color | **kept** | Pura CSS variables; sin cambios de diseño radicales |
| `scope="col"` en tablas | 3 ficheros html | **kept** | Específica los encabezados (1.3.1) |
| Virtualización / fuentes grandes | — | **descartado** | Fuera de alcance de una auditoría WCAG base; sin evidencia de fallo |
| Cambiar a modo solo-color badges | no necesario | **descartado** | Badges ya usan texto (no color-only) |
| Auditoría automatizada (axe) | no disponible CLI | **no intentado** | Sin runner de e2e en el repo; verificación estática + checklist |

## 5. Verificación

- `npm run lint` → All files pass linting (`evidence/lint.txt`)
- `npm run build` → bundle generation complete (`evidence/build.txt`)
- `npx prettier --check` → All matched files use Prettier code style (`evidence/prettier.txt`)
- Auditoría manual sobre checklist WCAG (teclado, SR, contraste) documentada arriba.
- Pendiente recomendado: `npm` runner de e2e + axe-core para automatizar (mismo scope que test runner, dejado solo documentado).

## 6. Cierre

Todos los fallos AA encontrados (foco modal, skip-link, contraste de texto, `th scope`) quedan
corregidos. La base era sólida; el principal hueco real era la gestión de foco del diálogo y el
contraste del texto secundario en modo claro.