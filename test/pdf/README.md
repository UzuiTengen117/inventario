# PDFs de la auditoría

Versión en PDF, maquetada, de los reportes de los 4 tests (`test/test1..test4/REPORT.md`).

| Fichero | Contenido |
|---|---|
| `00-resumen.pdf` | Reporte maestro + índice de entregables |
| `01-seguridad-hardening.pdf` | test1 · Seguridad y hardening |
| `02-performance-web.pdf` | test2 · Performance web |
| `03-calidad-code-review.pdf` | test3 · Calidad y code review |
| `04-accesibilidad-wcag.pdf` | test4 · Accesibilidad WCAG 2.1 AA |

Generados con Markdown → HTML (estilo impresión A4) → renderizado headless con Microsoft Edge.
Para regenerarlos:

```bash
npm i marked   # en un directorio temporal
node generate-pdf.mjs            # genera los .html en el dir temporal
msedge --headless=new --disable-gpu --no-pdf-header-footer \
       --print-to-pdf="test/pdf/00-resumen.pdf" "file:///<tmp>/index.html"   # repetir por documento
```