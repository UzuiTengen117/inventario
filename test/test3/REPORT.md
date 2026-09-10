# Test 3 — Calidad y Code Review

**Fecha:** 2026-09-10
**Objetivo:** revisión integral del código fuente de `inventory-app` (~40 archivos, Angular 22)
**Skills aplicados:** `code-review-and-quality` (review 5 ejes) + `code-simplification` (5 principios)
**Verificación:** `npm run lint` ✅ | `npm run build` ✅ | `prettier --check` ✅

---

## 1. Revisión por ejes (resumen)

| Eje | Veredicto | Hallazgos |
|---|---|---|
| Correctness | ✅ con 1 fix | Suscripción sin limpieza (leak); resto: validaciones y paths de error correctos |
| Readability & Simplicity | ✅ | Naming claro, componentes pequeños; se eliminó dead code y se consolidaron duplicados |
| Architecture | ✅ | SPA señales/computed, DI correcto, sin librerías extra, rutas lazy |
| Security | ✅ (heredado de test1) | Sin regresión; fixes de test1 intactos |
| Performance | ✅ (heredado de test2) | Sin regresión; Intl memorizado además |

Nota: **`ng test` no tiene runner configurado** (README menciona Vitest pero no existe dependencia ni config).
Documentado aquí y en el reporte maestro; **no se configura** por decisión explícita del usuario.

## 2. Hallazgos

| ID | Tipo | Hallazgo |
|---|---|---|
| C1 | Correctness | `movements.component.ts`: `form.controls.type.valueChanges.subscribe(...)` sin unsubscribe. Al destruirse la ruta quedaba el Observable vivo reteniendo el componente. |
| R1 | Rendimiento/readability | `format.ts`: `formatMoney`/`formatNumber`/`formatDate` **creaban un `Intl.NumberFormat`/`DateTimeFormat` nuevo en cada llamada** (cada celda de tabla, cada fila en CD). |
| D1 | Dead code | `utils/image.util.ts`: `imageError()` exportado y **nunca usado**. |
| D2 | Dead code | `dashboard.component.ts`: `gaugeC = 2 * Math.PI * 60` sin referencia (el template usa `pathLength="100"`). |
| A1 | Duplicación | El patrón `new Map(ids → entidad/nombre)` estaba duplicado ~4 veces: `dashboard.recent`, `movements.rows`, `reports.supplierNames`, `products.supplierByProduct`. |
| R5 | Consistencia | **46 archivos no pasaban `prettier --check`** a pesar de existir `.prettierrc` (estado preexistente del repo). |

## 3. Fixes aplicados

| ID | Archivo(s) | Cambio |
|---|---|---|
| C1 | `pages/movements/movements.component.ts` | `takeUntilDestroyed(this.destroyRef)` + `inject(DestroyRef)` sobre la suscripción de `valueChanges`. |
| R1 | `utils/format.ts` | Formatters `Intl` **memorizados a nivel de módulo** (una sola instancia; la API `format*` no cambia). |
| D1 | `utils/image.util.ts` | `imageError()` eliminado. |
| D2 | `pages/dashboard/dashboard.component.ts` | `gaugeC` eliminado (+ import `Product` no usado eliminado). |
| A1 | `services/product.service.ts`, `services/supplier.service.ts` + 4 consumers | Nuevos `computed` **`byIdIndex`** (productos) y **`byIdMap`** (proveedores); reutilizados en dashboard, movements, reports y products. Se eliminaron los mapas locales. |
| R5 | `src/**/*.{ts,html,scss}` | `prettier --write` sobre toda la app (normalización; commit separado del resto). |

## 4. Ledger de intentos (code-simplification)

| Idea | Resultado | Veredicto | Por qué |
|---|---|---|---|
| Consolidar mapas id→Producto/Proveedor en el servicio | 2 computed centrales reutilizados en 4 sitios | **kept** | Regla de 2+ usos; elimina duplicación local; comportamiento idéntico |
| Memorizar Intl formatters | 1 instancia por tipo | **kept** | Elimina asignación por celda/por render; sin cambio de comportamiento |
| `takeUntilDestroyed` en Movimientos | Suscripción se cierra al destruir | **kept** | Corrige leak real |
| Eliminar `imageError()`/`gaugeC` | -4 líneas muertas | **kept** | Dead code |
| Virtualizar listas | — | **descartado** | Sin evidencia de problema; over-engineering (ver test2) |
| Dividir component.ts gigantes | productos ~280 líneas | **descartado** | Cohesivo (filtrado + import); todo señal/computed |

## 5. Ledger de intentos (code-review — cosas revisadas y no tocadas)

- `toast.service.ts`/`confirm.service.ts`: lógica de auto-cierre con guard `t.closing` correcta; sin cambio.
- `products.filtered`: pipeline map→filter→sort legible; sin cambio.
- Seed data en servicios: demo intencional; documentado.
- `categoryLabel`/`initials`: utilidades puras y usadas; sin cambio.
- `eslint.config.js`/`.prettierrc`: configuración básica correcta.

## 6. Verificación

- `npm run lint` → All files pass linting (`evidence/lint.txt`)
- `npm run build` → bundle generation complete (`evidence/build.txt`)
- `npx prettier --check` → All matched files use Prettier code style (`evidence/prettier-result.txt`)

## 7. Cierre

El código base es de buena calidad (señales/computed, OnPush, DI). Se corrigieron el leak, la
alocación de formatters, el dead code y la duplicación, y se normalizó el formato. Pendiente externo:
runner de tests (solo documentado).