import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createComponent, createSection, componentProfile, listLabels, renderFile } from '../src/index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = resolve(root, 'examples/component-study');
const c = componentProfile.palette;
const cases = ['optics', 'sensing', 'fiber-study/editorial', 'fiber-study/technical', 'fiber-study/hybrid'];
const records = [];
const labels = scene => scene.panels.flatMap(p => p.elements.filter(e => ['text','callout'].includes(e.type)).map(({ id, text, x, y, width, fontSize, target }) => ({ id, text, x, y, width, fontSize, target })));
const scientificGeometry = scene => scene.panels.filter(p => p.id !== 'field').flatMap(p => p.elements.filter(e => ['arrow','wave','path'].includes(e.type)).map(({ fill, stroke, strokeWidth, opacity, ...geometry }) => geometry));

for (const name of cases) {
  const sourceDir = resolve(root, 'examples', name);
  const baseline = JSON.parse(await readFile(resolve(sourceDir, 'scene.json'), 'utf8'));
  const scene = structuredClone(baseline), uses = [];
  scene.theme = 'paper';
  scene.palette = { background: c.paper, panel: c.paper, ink: c.ink, muted: '#516478', line: '#CEDCD8', accent: '#A84335', secondary: c.teal, warm: '#896130' };
  for (const panel of scene.panels) {
    panel.grid = false;
    for (const e of panel.elements) {
      // Signal line weights distinguish raw and smoothed traces; keep that encoding.
      if (panel.id !== 'signal' && e.strokeWidth !== undefined) e.strokeWidth = e.strokeWidth <= 1.5 ? 1.5 : 3;
    }
    if (panel.id === 'field') {
      // The mast supports the cabinet; it is physical artwork, not a relationship edge.
      panel.elements.find(e => e.id === 'landscape-62').geometryRole = 'illustration';
      const replacements = new Map();
      const replace = (first, last, component, bounds) => {
        const id = `generic-${component}-${first}`;
        replacements.set(`landscape-${first}`, createComponent(component, { id, ...bounds }));
        for (let i = first + 1; i <= last; i++) replacements.set(`landscape-${i}`, []);
        uses.push({ component, id });
      };
      replace(63,68,'grid',{x:210,y:194,width:144,height:65});
      replace(69,71,'device',{x:305,y:288,width:63,height:81});
      replace(77,81,'device',{x:186,y:505,width:34,height:69,variant:'sealed'});
      for (const [first,x,y,w,h] of [[82,72,285,52,85],[84,634,274,42,68],[86,715,281,32,51]]) replace(first,first+1,'plant',{x,y,width:w,height:h});
      panel.elements = panel.elements.flatMap(e => replacements.get(e.id) ?? [e]);
    }
    // Exact original layer boundaries and IDs keep callout anchors and ray intersections intact.
    const replaceLayer = e => {
      if (!['rect','ellipse'].includes(e.type) || !( /-(core|cladding|coating)$/.test(e.id) || ['fiber-2','fiber-3'].includes(e.id))) return e;
      const end = e.type === 'ellipse';
      const section = createSection({ id: `section-${e.id}`, x: end ? e.x - e.rx : e.x, y: end ? e.y - e.ry : e.y, width: end ? e.rx * 2 : e.width, height: end ? e.ry * 2 : e.height, view: end ? 'end' : 'side', layers: [{ id: e.id, fill: /core$/.test(e.id) || e.id === 'fiber-3' ? c.warm : /coating$/.test(e.id) ? c.teal : c.light }] });
      uses.push({ component: 'section', id: e.id, view: end ? 'end' : 'side' });
      return section[0];
    };
    panel.elements = panel.elements.map(replaceLayer);
  }
  assert.deepEqual(listLabels(scene), listLabels(baseline));
  assert.deepEqual(labels(scene), labels(baseline));
  assert.deepEqual(scientificGeometry(scene), scientificGeometry(baseline));
  const slug = name.replaceAll('/','-'), dir = resolve(destination, slug);
  await mkdir(dir,{recursive:true});
  for (const asset of Object.values(scene.assets ?? {})) {
    const original = resolve(sourceDir, asset.path);
    asset.path = `assets/${basename(asset.path)}`;
    await mkdir(resolve(dir,'assets'),{recursive:true});
    await copyFile(original,resolve(dir,asset.path));
  }
  await writeFile(resolve(dir,'scene.json'),JSON.stringify(scene,null,2)+'\n');
  await renderFile(resolve(dir,'scene.json'),{outDir:resolve(dir,'rendered'),strict:true,scale:1});
  const record = { name, slug, contentIdentical:true, labelPlacementIdentical:true, scientificPathGeometryIdentical:true, components:uses, rasterArtworkUnchanged:!!scene.assets, notes: name.endsWith('hybrid') ? 'Raster illustration retained byte-for-byte; its perspective and palette are outside the vector component profile.' : 'Scientific geometry retained. This is a visual comparison, not scientific validation.' };
  await writeFile(resolve(dir,'comparison-report.json'),JSON.stringify(record,null,2)+'\n');
  records.push(record);
  console.log(`${name}: ${uses.length} component instances; text and scientific path geometry preserved`);
}
await writeFile(resolve(destination,'report.json'),JSON.stringify(records,null,2)+'\n');
const rows = records.map(r => `<section><h2>${r.name}</h2><p>${r.components.length} component instances. Text and scientific path geometry preserved.${r.rasterArtworkUnchanged?' Original raster artwork retained.':''}</p><div class="pair"><figure class="before"><figcaption>Previous version</figcaption><img loading="lazy" src="../${r.name}/rendered/figure.png" alt="Previous ${r.name}"></figure><figure class="after"><figcaption>Shared components and style · <a href="${r.slug}/rendered/figure.svg">SVG</a> · <a href="${r.slug}/rendered/figure.pdf">PDF</a></figcaption><img loading="lazy" src="${r.slug}/rendered/figure.png" alt="Shared component version of ${r.name}"></figure></div></section>`).join('\n');
await writeFile(resolve(destination,'compare.html'),comparisonPage(rows));

export function comparisonPage(rows) { return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reusable components — comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#edf1ee;color:#243752;font:16px/1.5 system-ui,sans-serif}main{max-width:1800px;margin:auto;padding:28px}h1{margin:0;font-size:30px}p{max-width:960px}nav{position:sticky;top:0;background:#edf1ee;padding:12px 0;z-index:1}button{font:inherit;padding:8px 16px;border:1px solid #197c78;border-radius:5px;background:#fffefa;color:#243752;cursor:pointer}button[aria-pressed=true]{background:#197c78;color:white}section{margin:42px 0 60px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:22px}figure{margin:0;min-width:0}figcaption{padding:10px 0}img{width:100%;display:block;background:white}a{color:#197c78}body[data-view=before] .after,body[data-view=after] .before{display:none}body[data-view=before] .pair,body[data-view=after] .pair{grid-template-columns:minmax(0,1100px);justify-content:center}@media(max-width:850px){.pair{grid-template-columns:1fr}main{padding:16px}}</style><body data-view="both"><main><h1>Reusable components / comparison</h1><p>Previous figures compared with a shared vector vocabulary. Labels, scientific paths and source assets stay fixed. Spectrum colours and scientific annotations retain their meaning. The hybrid raster is an explicit exception to the vector style.</p><nav aria-label="Comparison view"><button data-view="both" aria-pressed="true">Side by side</button> <button data-view="before" aria-pressed="false">Previous</button> <button data-view="after" aria-pressed="false">Shared components</button></nav>${rows}</main><script>document.querySelectorAll('button[data-view]').forEach(button=>button.addEventListener('click',()=>{document.body.dataset.view=button.dataset.view;document.querySelectorAll('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));</script></body></html>`; }
