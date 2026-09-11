import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderFile } from '../src/index.js';

const studyDir = fileURLToPath(new URL('../examples/fiber-study/', import.meta.url));
const brief = JSON.parse(await readFile(`${studyDir}/brief.json`, 'utf8'));
const [coreText, cladText, coatText, indexText, angleText, formulaText, normalText, reflectionText, protectionText] = brief.sameAcrossVariants.requiredText;

function art(prefix) {
  const elements = []; let count = 0;
  const add = (type, props, id) => { const e = { id: id ?? `${prefix}-${++count}`, type, ...props }; elements.push(e); return e; };
  return {
    elements, add,
    text: (text, x, y, width, fontSize = 24, props = {}) => add('text', { text, x, y, width, fontSize, ...props }),
    path: (d, props = {}) => add('path', { d, ...props }),
    line: (x, y, x2, y2, props = {}) => add('line', { x, y, x2, y2, stroke: '$line', ...props }),
    rect: (x, y, width, height, props = {}, id) => add('rect', { x, y, width, height, ...props }, id),
    ellipse: (x, y, rx, ry, props = {}, id) => add('ellipse', { x, y, rx, ry, ...props }, id),
    callout: (id, text, x, y, width, target, props = {}) => add('callout', { text, x, y, width, target, fontSize: 25, weight: 'semibold', ...props }, id),
  };
}

function crossSection(a, x, y, radius, id, engraved = false) {
  a.ellipse(x, y, radius, radius, { fill: '$secondary', opacity: 0.18, stroke: '$secondary', strokeWidth: 2 }, `${id}-coating`);
  a.ellipse(x, y, radius * 0.78, radius * 0.78, { fill: '$background', stroke: '$secondary', strokeWidth: 1.5 }, `${id}-cladding`);
  a.ellipse(x, y, radius * 0.78, radius * 0.78, { fill: '$secondary', opacity: 0.06 });
  a.ellipse(x, y, radius * 0.31, radius * 0.31, { fill: '$warm', opacity: 0.5, stroke: '$warm', strokeWidth: 2 }, `${id}-core`);
  if (engraved) {
    for (let i = 0; i < 116; i++) {
      const theta = i * Math.PI * 2 / 116;
      const inner = radius * 0.82;
      a.line(x + Math.cos(theta) * inner, y + Math.sin(theta) * inner, x + Math.cos(theta) * (radius - 5), y + Math.sin(theta) * (radius - 5), { stroke: '$secondary', strokeWidth: 0.9, opacity: 0.6 });
    }
    for (let i = 0; i < 9; i++) a.ellipse(x, y, radius * (0.35 + i * 0.045), radius * (0.35 + i * 0.045), { stroke: '$secondary', strokeWidth: 0.6, opacity: 0.2 });
    for (let i = 0; i < 36; i++) {
      const angle = i * 2.39996;
      const r = Math.sqrt((i + 1) / 36) * radius * 0.28;
      a.ellipse(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 1.5, 1.5, { fill: '$ink', opacity: 0.3 });
    }
  }
}

function longitudinal(a, { x, y, width, height, id, coating = false, markedAngle = true }) {
  // The core occupies the central half of the section. Its boundaries carry the ray.
  if (coating) a.rect(x, y - 16, width, height + 32, { fill: '$secondary', opacity: 0.16, stroke: '$secondary' }, `${id}-coating`);
  a.rect(x, y, width, height, { fill: '$secondary', opacity: 0.1, stroke: '$secondary', strokeWidth: 1.5 }, `${id}-cladding`);
  a.rect(x, y + height / 4, width, height / 2, { fill: '$warm', opacity: 0.13 }, `${id}-core`);
  const upper = y + height / 4, lower = y + height * 3 / 4;
  a.line(x, upper, x + width, upper, { stroke: '$secondary', strokeWidth: 2 });
  a.line(x, lower, x + width, lower, { stroke: '$secondary', strokeWidth: 2 });
  const slope = (lower - upper) / (width * 0.26);
  const bounces = [[x + 10, upper + (width * 0.14 - 10) * slope], [x + width * 0.14, upper], [x + width * 0.4, lower], [x + width * 0.66, upper], [x + width * 0.92, lower], [x + width - 8, lower - (width * 0.08 - 8) * slope]];
  for (let i = 0; i < bounces.length - 1; i++) a.add('arrow', { x: bounces[i][0], y: bounces[i][1], x2: bounces[i + 1][0], y2: bounces[i + 1][1], stroke: '$accent', strokeWidth: 3.5 });
  if (markedAngle) {
    const nx = x + width * 0.66;
    a.line(nx, y - 26, nx, lower + 14, { stroke: '$muted', dash: [5, 6], strokeWidth: 1.2 });
    const r = Math.min(42, height * 0.25);
    const dx = -width * 0.26, dy = lower - upper;
    const length = Math.hypot(dx, dy);
    a.path(`M${nx},${upper + r} A${r},${r} 0 0 1 ${nx + dx / length * r},${upper + dy / length * r}`, { stroke: '$ink', strokeWidth: 1.5 });
    a.text('θ', nx - r * 0.75, Math.min(upper + r + 6, lower - 32), 35, 25);
    a.text('NORMAL', nx - 40, y - 56, 180, 18, { fill: '$muted' });
  }
}

function equationPair(a, y, { left = 28, right = 736 } = {}) {
  a.line(28, y - 22, 1308, y - 22, { strokeWidth: 1 });
  a.text('01 / INDEX CONTRAST', left, y, 600, 18, { fill: '$secondary', weight: 'semibold' });
  a.text(indexText, left, y + 34, 500, 42, { weight: 'semibold' });
  a.text(reflectionText, left, y + 104, 565, 25);
  a.text('02 / INCIDENCE AT THE BOUNDARY', right, y, 570, 18, { fill: '$secondary', weight: 'semibold' });
  a.text(angleText, right, y + 34, 500, 42, { weight: 'semibold' });
  a.text(formulaText, right, y + 98, 560, 32);
  a.text(normalText, right, y + 151, 560, 24, { fill: '$muted' });
  a.text(protectionText, left, y + 228, 1240, 24, { fill: '$muted' });
}

const technical = art('technical');
technical.text('A / END VIEW', 28, 24, 350, 18, { fill: '$secondary', weight: 'semibold' });
technical.text('B / LONGITUDINAL SECTION', 442, 24, 790, 18, { fill: '$secondary', weight: 'semibold' });
crossSection(technical, 189, 225, 117, 'tech-end');
technical.line(36, 225, 342, 225, { stroke: '$muted', strokeWidth: 1, dash: [4, 8] });
technical.line(189, 79, 189, 371, { stroke: '$muted', strokeWidth: 1, dash: [4, 8] });
longitudinal(technical, { x: 442, y: 154, width: 825, height: 170, id: 'tech-side', coating: true });
technical.callout('core-label', coreText, 28, 398, 286, { element: 'tech-end-core', at: [0.5, 0.5] }, { side: 'top' });
technical.callout('cladding-label', cladText, 402, 392, 340, { element: 'tech-side-cladding', at: [0.25, 0.95] }, { side: 'top' });
technical.callout('coating-label', coatText, 951, 392, 345, { element: 'tech-side-coating', at: [0.88, 0.97] }, { side: 'top' });
equationPair(technical, 486);

const editorial = art('editorial');
editorial.text('A STRUCTURE WITH THREE ROLES', 28, 24, 950, 18, { fill: '$secondary', weight: 'semibold' });
crossSection(editorial, 330, 310, 209, 'editorial-end', true);
editorial.ellipse(330, 310, 81, 81, { stroke: '$accent', strokeWidth: 1.5, dash: [3, 6] });
editorial.path('M410 292 L672 163 H1264', { stroke: '$line', strokeWidth: 1.2, dash: [4, 6] });
editorial.path('M410 326 L672 335 H1264', { stroke: '$line', strokeWidth: 1.2, dash: [4, 6] });
editorial.text('INSIDE THE CORE', 725, 89, 590, 19, { weight: 'semibold', fill: '$secondary' });
longitudinal(editorial, { x: 725, y: 224, width: 538, height: 105, id: 'editorial-side' });
editorial.callout('core-label', coreText, 24, 66, 267, { element: 'editorial-end-core', at: [0.35, 0.25] }, { side: 'bottom' });
editorial.callout('coating-label', coatText, 456, 65, 250, { element: 'editorial-end-coating', at: [0.82, 0.2] }, { side: 'bottom' });
editorial.callout('cladding-label', cladText, 27, 563, 345, { element: 'editorial-end-cladding', at: [0.22, 0.73] }, { side: 'top' });
editorial.text(indexText, 756, 395, 550, 48, { weight: 'semibold' });
editorial.text(reflectionText, 756, 466, 535, 26);
editorial.line(28, 653, 1308, 653);
editorial.text(angleText, 28, 682, 280, 40, { weight: 'semibold' });
editorial.text(formulaText, 392, 688, 440, 32);
editorial.text(normalText, 875, 690, 420, 24, { fill: '$muted' });
editorial.text(protectionText, 28, 770, 1260, 24, { fill: '$muted' });

const hybrid = art('hybrid');
hybrid.add('image', { x: 0, y: -130, width: 1336, height: 1336 * 2 / 3, asset: 'fibre-cutaway', fit: 'contain' }, 'fibre-hero');
hybrid.callout('core-label', coreText, 28, 72, 280, { element: 'fibre-hero', at: [0.315, 0.485] }, { side: 'bottom', stroke: '$ink' });
hybrid.callout('cladding-label', cladText, 500, 42, 320, { element: 'fibre-hero', at: [0.49, 0.395] }, { side: 'bottom', stroke: '$ink' });
hybrid.callout('coating-label', coatText, 1010, 72, 298, { element: 'fibre-hero', at: [0.835, 0.45] }, { side: 'bottom', stroke: '$ink' });
hybrid.text('THE MATERIAL', 28, 453, 590, 18, { fill: '$secondary', weight: 'semibold' });
hybrid.text('THE OPTICAL CONDITION', 758, 453, 550, 18, { fill: '$secondary', weight: 'semibold' });
longitudinal(hybrid, { x: 28, y: 550, width: 574, height: 125, id: 'hybrid-ray' });
hybrid.text(indexText, 28, 704, 560, 38, { weight: 'semibold' });
hybrid.text(reflectionText, 28, 765, 628, 24);
hybrid.text(angleText, 758, 500, 530, 42, { weight: 'semibold' });
hybrid.text(formulaText, 758, 564, 530, 32);
hybrid.text(normalText, 758, 619, 530, 24, { fill: '$muted' });
hybrid.text(protectionText, 758, 721, 542, 24, { fill: '$muted' });

const promptRecord = await readFile(`${studyDir}/hybrid/assets/generation-prompt.md`, 'utf8');
const variants = { editorial, technical, hybrid };
for (const [name, drawing] of Object.entries(variants)) {
  const scene = {
    version: 1,
    title: brief.subject,
    description: `${brief.takeaway} ${brief.directions[name]}`,
    eyebrow: `FIBRE STUDY / ${name.toUpperCase()}`,
    subtitle: 'One explanation, three visual directions. A conceptual step-index fibre in the ray model.',
    width: 1440, height: 1120,
    theme: name === 'technical' ? 'blueprint' : 'paper',
    footer: 'Conceptual geometry, not to scale · θ is the internal incidence angle · source: OpenStax, University Physics Vol. 3, §1.4',
    sources: brief.sources,
    panels: [{ id: `${name}-composition`, x: 52, y: 182, width: 1336, height: 858, framed: false, grid: name === 'technical', elements: drawing.elements }],
    ...(name === 'hybrid' ? { assets: { 'fibre-cutaway': {
      path: 'assets/fibre-cutaway-v1.png',
      description: 'Magnified conceptual cutaway of a straight optical fibre with an amber core, glass cladding and teal protective coating. Colours and proportions are illustrative.',
      prompt: promptRecord.split('## Prompt\n\n')[1].trim(),
      provenance: 'Built-in image-generation tool, 2026-09-10. No source image supplied. Model identifier and cost were not exposed. Original RGBA output, not edited in code.',
    } } } : {}),
  };
  const dir = `${studyDir}/${name}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/scene.json`, JSON.stringify(scene, null, 2) + '\n');
  await renderFile(`${dir}/scene.json`, { outDir: `${dir}/rendered`, strict: true, scale: 1.5 });
  console.log(`${name}: scene and SVG/PNG/PDF exports ready`);
}
