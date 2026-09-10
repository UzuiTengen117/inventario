import { marked } from 'marked';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const app = 'C:/Users/juanca/Documents/app/inventory-app';
const tmp = 'C:/Users/juanca/AppData/Local/Temp/opencode/pdfbuild';
const outDir = join(app, 'test', 'pdf');

const docs = [
  {
    num: '00',
    slug: 'index',
    title: 'Índice & Resumen',
    sub: 'Entregables, hallazgos, evidencia y estado tras la auditoría completa.',
    scope: 'Reporte maestro · 4 tests',
    file: join(app, 'test', 'REPORT.md'),
    mdrel: 'test/REPORT.md',
    chips: ['25 skills verificados', '22 fixes aplicados', '6 commits'],
  },
  {
    num: '01',
    slug: 'test1-seguridad',
    title: 'Seguridad & Hardening',
    sub: 'Threat model, dependencias, manejo de inputs, CSP y almacenamiento local.',
    scope: 'test1 · `security-and-hardening`',
    file: join(app, 'test', 'test1', 'REPORT.md'),
    mdrel: 'test/test1/REPORT.md',
    chips: ['npm audit 0 vulns', '7 fixeos', 'OWASP en CSV'],
  },
  {
    num: '02',
    slug: 'test2-performance',
    title: 'Performance Web',
    sub: 'Carga inicial, change detection, renderizado de listas e imágenes.',
    scope: 'test2 · `performance-optimization`',
    file: join(app, 'test', 'test2', 'REPORT.md'),
    mdrel: 'test/test2/REPORT.md',
    chips: ['77.8 kB inicial', 'OnPush ×3', 'lazy + async'],
  },
  {
    num: '03',
    slug: 'test3-calidad',
    title: 'Calidad & Code Review',
    sub: 'Revisión por 5 ejes, simplificación, deuda técnica y formato.',
    scope: 'test3 · `code-review-and-quality` + `code-simplification`',
    file: join(app, 'test', 'test3', 'REPORT.md'),
    mdrel: 'test/test3/REPORT.md',
    chips: ['leak corregido', 'dedup ×4', 'prettier ok'],
  },
  {
    num: '04',
    slug: 'test4-accesibilidad',
    title: 'Accesibilidad WCAG 2.1 AA',
    sub: 'Teclado, lectores de pantalla, focuseado, contraste y semántica.',
    scope: 'test4 · `frontend-ui-engineering`',
    file: join(app, 'test', 'test4', 'REPORT.md'),
    mdrel: 'test/test4/REPORT.md',
    chips: ['focus trap', 'skip-link', 'contraste AA'],
  },
];

const report = (label, ok) =>
  `<span class="verif"><b>${ok ? 'EN ORDEN' : 'PENDIENTE'}</b> ${label}</span>`;

function banner(start, end) {
  const b = {
    'Seguridad & Hardening': 'SEGURIDAD',
    'Performance Web': 'PERFORMANCE',
    'Calidad & Code Review': 'CALIDAD',
    'Accesibilidad WCAG 2.1 AA': 'ACCESIBILIDAD',
    'Índice & Resumen': 'AUDITORÍA',
  };
  return b[start] ?? 'AUDITORÍA';
}

function cover(doc, date) {
  return `
  <section class="cover">
    <div class="cover-top">
      <div class="brand">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6848f2" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17 9 5 9-5"/>
        </svg>
        <span class="brand-txt">STOCKCONTROL</span>
      </div>
      <div class="meta">${doc.num === '00' ? 'DOCUMENTO MAESTRO' : 'REPORTE DE PRUEBA'}</div>
    </div>
    <div class="cover-mid">
      <div class="number">${doc.num}</div>
      <div class="divider"></div>
      <div class="kicker">${banner(doc.title)}</div>
      <h1 class="cover-title">${doc.title}</h1>
      <p class="cover-sub">${doc.sub}</p>
      <p class="scope">${doc.scope.replace(/`/g, '')}</p>
      <div class="chips">${doc.chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>
    </div>
    <div class="cover-foot">
      <div class="cols">
        <div>
          <span class="lbl">PROYECTO</span>
          <span class="val">inventory-app · Angular 22</span>
        </div>
        <div>
          <span class="lbl">FECHA</span>
          <span class="val">Septiembre 2026</span>
        </div>
        <div>
          <span class="lbl">METODOLOGÍA</span>
          <span class="val">agent-skills · OWASP · WCAG 2.1</span>
        </div>
      </div>
      <div class="verifs">
        ${report('lint')}
        ${report('build')}
        ${report('prettier')}
        ${report(doc.num === '01' ? 'npm audit' : 'evidencia')}
      </div>
    </div>
  </section>`;
}

const css = `
:root {
  --violet:#6848f2; --violet-2:#5437d6; --ink:#23263b; --ink-2:#4a4f6b;
  --muted:#5f6472; --line:#e0e2ee; --surface:#f4f5fa; --canvas:#eef0f6;
  --red:#c0392f; --amber:#8a5a0a; --green:#197a4e;
}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{
  font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif;
  color:var(--ink); margin:0; font-size:10.5pt; line-height:1.55;
}
.page-footer{
  position:fixed; bottom:0; left:0; right:0; height:9mm;
  display:flex; align-items:center; justify-content:space-between;
  padding:0 15mm; font-size:7.5pt; color:var(--muted);
  border-top:0.5pt solid var(--line);
}
.page-footer .f-brand{font-weight:700; letter-spacing:.08em; color:var(--violet)}
.page-footer .f-end{font-weight:700; color:var(--ink-2)}
.docs{padding:0 14mm 12mm}
h1,h2,h3,h4{line-height:1.25; color:var(--ink); break-after:avoid}
h2{
  font-size:16pt; margin:22pt 0 8pt; padding-bottom:5pt;
  border-bottom:2.5pt solid var(--violet);
}
h2:first-child{margin-top:0}
h3{font-size:12pt; margin:16pt 0 5pt; color:var(--violet-2)}
h4{font-size:10.5pt; margin:12pt 0 4pt}
p{margin:5pt 0}
ul,ol{margin:5pt 0; padding-left:18pt}
li{margin:2.5pt 0}
code{font-family:Consolas,'Cascadia Mono',monospace; font-size:9pt;
  background:var(--surface); border:0.5pt solid var(--line);
  padding:0.5pt 4pt; border-radius:4pt; color:#3d2d99}
pre{background:#1f2430; color:#e8ecf7; padding:9pt 11pt; border-radius:8pt;
  font-size:8.8pt; line-height:1.5; overflow:hidden; break-inside:avoid;
  margin:7pt 0; white-space:pre-wrap}
pre code{background:none;border:none;color:inherit;padding:0}
table{border-collapse:collapse; width:100%; margin:9pt 0; font-size:9pt;
  break-inside:auto; border:0.6pt solid var(--line); border-radius:6pt; overflow:hidden}
th{background:var(--violet); color:#fff; text-align:left; font-weight:600;
  padding:5.5pt 7pt; font-size:8.8pt; letter-spacing:.02em}
td{border-top:0.5pt solid var(--line); padding:5pt 7pt; vertical-align:top}
tbody tr:nth-child(even){background:var(--surface)}
tr{break-inside:avoid}
blockquote{border-left:3pt solid var(--violet); background:var(--surface);
  margin:7pt 0; padding:6pt 10pt; border-radius:0 8pt 8pt 0; color:var(--ink-2)}
hr{border:none; border-top:0.6pt solid var(--line); margin:12pt 0}
strong{color:var(--violet-2)}
.sev{display:inline-block; padding:1pt 6pt; border-radius:20pt; font-size:7.6pt;
  font-weight:700; letter-spacing:.06em}
.sev-ALTA{background:#fde7e7; color:#a52a1f}
.sev-MEDIA{background:#fdf0d8; color:#8a5a0a}
.sev-BAJA{background:#e3f1fc; color:#1c5f96}
.sev-INFO{background:#ece7ff; color:#5437d6}
em{color:var(--muted)}

/* Cover */
.cover{height:281mm; display:flex; flex-direction:column;
  padding:16mm 14mm 14mm; page-break-after:always;
  background:
    radial-gradient(48mm 48mm at 100% 0%, rgba(104,72,242,.10), transparent 60%),
    radial-gradient(36mm 36mm at 0% 100%, rgba(232,154,46,.08), transparent 60%),
    var(--canvas);
}
.cover-top{display:flex; justify-content:space-between; align-items:center;
  border-bottom:0.8pt solid var(--line); padding-bottom:4mm}
.brand{display:flex; align-items:center; gap:8pt}
.brand-txt{font-weight:800; letter-spacing:.18em; color:var(--ink)}
.meta{font-size:8pt; font-weight:700; letter-spacing:.14em; color:var(--violet)}
.cover-mid{margin-top:34mm; flex:1}
.number{font-size:88pt; font-weight:800; line-height:1; color:var(--violet);
  -webkit-text-stroke:0.4pt rgba(104,72,242,.25)}
.divider{width:26mm; height:1.2mm; background:var(--violet); border-radius:2mm; margin:6mm 0 5mm}
.kicker{font-size:9pt; font-weight:700; letter-spacing:.22em; color:var(--amber)}
.cover-title{font-size:27pt; font-weight:800; margin:3mm 0 4mm; letter-spacing:-.01em}
.cover-sub{font-size:11.5pt; color:var(--ink-2); max-width:120mm}
.scope{margin-top:5mm; font-size:10pt; color:var(--muted); font-style:italic}
.chips{margin-top:9mm; display:flex; gap:4pt; flex-wrap:wrap}
.chip{background:var(--surface); border:0.6pt solid var(--line);
  border-radius:20pt; padding:2.5pt 9pt; font-size:8.2pt; font-weight:600; color:var(--violet-2)}
.cover-foot .cols{display:flex; gap:12mm; margin-bottom:6mm}
.cover-foot .cols>div{flex:1}
.lbl{display:block; font-size:7pt; letter-spacing:.14em; color:var(--muted); font-weight:700}
.val{display:block; margin-top:1.5pt; font-size:9.5pt; font-weight:600; color:var(--ink)}
.verifs{display:flex; gap:4pt; flex-wrap:wrap}
.verif{background:#fff; border:0.6pt solid var(--line); border-radius:6pt;
  padding:3pt 8pt; font-size:8pt; color:var(--muted)}
.verif b{display:inline-block; background:var(--green); color:#fff; border-radius:4pt;
  padding:0.5pt 5pt; margin-right:4pt; font-size:7pt; letter-spacing:.05em}

/* Índice */
.toc{page-break-before:always}
.toc h2{font-size:20pt}
.toc-item{display:flex; align-items:center; gap:10pt; padding:9pt 0;
  border-bottom:0.6pt solid var(--line); break-inside:avoid}
.toc-num{font-size:22pt; font-weight:800; color:var(--violet); width:26pt}
.toc-txt{flex:1}
.toc-title{font-weight:700; color:var(--ink)}
.toc-sub{font-size:9pt; color:var(--muted)}
.toc-file{font-size:8pt; color:var(--violet-2); font-weight:600}
a{color:var(--violet-2); text-decoration:none}
@media print { .page-footer{-webkit-print-color-adjust:exact} }
`;

function htmlDoc(doc, bodyHtml, isMaster) {
  const toc = isMaster
    ? `
  <section class="toc">
    <h2>Entregables</h2>
    ${docs
      .filter((d) => d.num !== '00')
      .map(
        (d) => `
      <div class="toc-item">
        <div class="toc-num">${d.num}</div>
        <div class="toc-txt">
          <div class="toc-title">${d.title}</div>
          <div class="toc-sub">${d.sub}</div>
          <div class="toc-file">${d.mdrel}</div>
        </div>
      </div>`,
      )
      .join('')}
  </section>`
    : '';
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>${doc.num} · ${doc.title}</title>
<style>${css}</style></head><body>
<div class="page-footer">
  <span class="f-brand">STOCKCONTROL</span>
  <span>Auditoría profesional · agent-skills</span>
  <span class="f-end">DOC ${doc.num}</span>
</div>
<div class="docs">
  ${cover(doc, '2026-09-10')}
  <div class="content">${bodyHtml}${toc}</div>
</div>
</body></html>`;
}

function postProcess(body) {
  body = body.replace(/<strong>(ALTA|MEDIA|BAJA|INFO)<\/strong>/g, '<span class="sev sev-$1">$1</span>');
  return body;
}

mkdirSync(outDir, { recursive: true });

marked.setOptions({ gfm: true, breaks: false });

for (const doc of docs) {
  const md = readFileSync(doc.file, 'utf8');
  const body = postProcess(marked.parse(md));
  const html = htmlDoc(doc, body, doc.num === '00');
  const htmlPath = join(tmp, `${doc.slug}.html`);
  writeFileSync(htmlPath, html, 'utf8');
  console.log('HTML', doc.num, htmlPath);
}

console.log('DONE');