// Original, reproducible artwork. The generated scene.json files are also directly editable.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const make = (prefix) => {
  let seq = 0;
  const elements = [];
  const add = (type, props) => { const e = { id: `${prefix}-${++seq}`, type, ...props }; elements.push(e); return e; };
  return {
    elements,
    text: (text, x, y, width, props = {}) => add('text', { text, x, y, width, fontSize: 20, ...props }),
    rect: (x, y, width, height, props = {}) => add('rect', { x, y, width, height, ...props }),
    ellipse: (x, y, rx, ry, props = {}) => add('ellipse', { x, y, rx, ry, ...props }),
    line: (x, y, x2, y2, props = {}) => add('line', { x, y, x2, y2, stroke: '$line', ...props }),
    arrow: (x, y, x2, y2, props = {}) => add('arrow', { x, y, x2, y2, stroke: '$ink', strokeWidth: 3, ...props }),
    path: (d, props = {}) => add('path', { d, ...props }),
    polygon: (points, props = {}) => add('polygon', { points, ...props }),
    wave: (x, y, width, amplitude, cycles, props = {}) => add('wave', { x, y, width, amplitude, cycles, stroke: '$accent', strokeWidth: 3, ...props }),
  };
};
const panel = (id, x, y, width, height, title, kicker, art, grid = false) => ({ id, x, y, width, height, title, kicker, grid, elements: art.elements });

const boundary = make('boundary');
boundary.rect(320, 88, 296, 155, { fill: '$secondary', opacity: 0.09 });
boundary.line(320, 88, 320, 243, { stroke: '$secondary', strokeWidth: 2 });
boundary.text('AIR', 32, 88, 180, { fontSize: 16, fill: '$muted', weight: 'semibold' });
boundary.text('GLASS', 348, 88, 240, { fontSize: 16, fill: '$secondary', weight: 'semibold' });
boundary.wave(32, 164, 288, 20, 4);
boundary.wave(320, 164, 280, 20, 280 / 48);
boundary.arrow(36, 224, 264, 224, { stroke: '$warm', strokeWidth: 2 });
boundary.arrow(348, 224, 500, 224, { stroke: '$warm', strokeWidth: 2 });
boundary.text('Same frequency', 32, 264, 280, { fontSize: 26, weight: 'semibold' });
boundary.text('Shorter wavelength', 348, 264, 268, { fontSize: 26, weight: 'semibold' });
boundary.text('f₁ = f₂', 32, 310, 220, { fill: '$muted' });
boundary.text('v = c / n  ·  λ = v / f', 348, 310, 268, { fill: '$muted' });

const prism = make('prism');
prism.polygon([[278, 95], [180, 267], [382, 267]], { fill: '$warm', opacity: 0.14, stroke: '$warm', strokeWidth: 2 });
for (let i = 0; i < 9; i++) prism.line(210 + i * 16, 259, 276 + i * 1.5, 121 + i * 10, { stroke: '$warm', opacity: 0.12, strokeWidth: 1 });
const entryY = 190;
const entryX = 278 - (entryY - 95) * 98 / 172;
const incomingAngle = -15 * Math.PI / 180;
const inwardNormal = Math.atan2(98, 172);
const outwardNormal = -Math.atan2(104, 172);
prism.arrow(45, entryY - Math.tan(incomingAngle) * (entryX - 45), entryX, entryY, { stroke: '$ink', strokeWidth: 7 });
const colors = ['#ef7967', '#ec9e63', '#e9c86d', '#8cbf99', '#64bbd2', '#948dc6'];
colors.forEach((color, i) => {
  // Snell's law at both faces; indices are illustrative, not a glass material fit.
  const index = 1.5 + i * 0.008;
  const insideAngle = inwardNormal + Math.asin(Math.sin(incomingAngle - inwardNormal) / index);
  const slope = Math.tan(insideAngle);
  const faceSlope = 172 / 104;
  const exitX = (entryY - slope * entryX - 95 + faceSlope * 278) / (faceSlope - slope);
  const exitY = entryY + slope * (exitX - entryX);
  const exitAngle = outwardNormal + Math.asin(index * Math.sin(insideAngle - outwardNormal));
  prism.line(entryX, entryY, exitX, exitY, { stroke: color, strokeWidth: 2 });
  prism.arrow(exitX, exitY, 584, exitY + Math.tan(exitAngle) * (584 - exitX), { stroke: color, strokeWidth: 3 });
});
prism.text('WHITE LIGHT', 36, 128, 178, { fontSize: 16, fill: '$muted', weight: 'semibold' });
prism.text('PRISM', 233, 287, 160, { fontSize: 16, fill: '$muted', weight: 'semibold' });
prism.text('Longer λ', 443, 162, 160, { fill: '$accent', fontSize: 18 });
prism.text('Shorter λ', 462, 326, 160, { fill: '$secondary', fontSize: 18 });

const fiber = make('fiber');
fiber.text('Light can stay inside a higher-index core.', 32, 84, 1100, { fontSize: 24 });
fiber.rect(58, 190, 950, 153, { fill: '$secondary', opacity: 0.1, stroke: '$secondary', strokeWidth: 1 });
fiber.rect(58, 226, 950, 78, { fill: '$secondary', opacity: 0.14 });
fiber.line(58, 226, 1008, 226, { stroke: '$secondary', strokeWidth: 2 });
fiber.line(58, 304, 1008, 304, { stroke: '$secondary', strokeWidth: 2 });
const bounces = [[58, 290], [208, 226], [390, 304], [572, 226], [754, 304], [936, 226], [1008, 257]];
for (let i = 0; i < bounces.length - 1; i++) fiber.arrow(...bounces[i], ...bounces[i + 1], { stroke: '$warm', strokeWidth: 3 });
fiber.line(572, 147, 572, 312, { stroke: '$muted', dash: [5, 7], strokeWidth: 1 });
fiber.path('M572 279 A53 53 0 0 1 523 247', { stroke: '$accent', strokeWidth: 2 });
fiber.text('θ', 537, 270, 24, { fill: '$accent' });
fiber.text('NORMAL', 548, 123, 130, { fontSize: 16, fill: '$muted' });
fiber.text('CLADDING', 1040, 190, 240, { fontSize: 16, fill: '$muted', weight: 'semibold' });
fiber.text('n₂ < n₁', 1040, 220, 240, { fontSize: 24 });
fiber.text('CORE', 1040, 266, 240, { fontSize: 16, fill: '$secondary', weight: 'semibold' });
fiber.text('n₁', 1040, 291, 240, { fontSize: 24 });
fiber.text('θ > θc', 58, 379, 290, { fontSize: 32, weight: 'semibold', fill: '$warm' });
fiber.text('Total internal reflection', 58, 429, 360, { fontSize: 19, fill: '$muted' });
fiber.text('sin θc = n₂ / n₁', 508, 379, 350, { fontSize: 32, weight: 'semibold' });
fiber.text('Angle measured from the normal', 508, 429, 420, { fontSize: 19, fill: '$muted' });
fiber.text('SCHEMATIC', 1050, 391, 235, { fontSize: 16, weight: 'semibold', fill: '$secondary' });
fiber.text('Not to scale', 1050, 420, 235, { fontSize: 19, fill: '$muted' });

const optics = {
  version: 1, title: 'How light changes its course',
  eyebrow: 'FIELD NOTES     /     01 — OPTICS',
  description: 'Three illustrated panels explain wavelength change at a stationary air-glass boundary, dispersion in a prism, and total internal reflection inside an optical fiber.',
  subtitle: 'From a change of medium to a spectrum of colour — and a beam guided by reflection.',
  width: 1440, height: 1160, theme: 'blueprint',
  footer: 'Illustrative geometry · stationary media · optical fiber shown as a ray model · sources recorded in scene metadata',
  sources: [
    { title: 'OpenStax University Physics, Vol. 3: Refraction', url: 'https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction' },
    { title: 'OpenStax: Total Internal Reflection', url: 'https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection' },
    { title: 'OpenStax: Dispersion', url: 'https://openstax.org/books/university-physics-volume-3/pages/1-5-dispersion' },
  ],
  panels: [
    panel('boundary', 52, 182, 650, 365, 'A wave crosses a boundary', '01 / PROPAGATION', boundary, true),
    panel('prism', 724, 182, 664, 365, 'One beam, many wavelengths', '02 / DISPERSION', prism, true),
    panel('fiber', 52, 571, 1336, 507, 'A path held by reflection', '03 / TOTAL INTERNAL REFLECTION', fiber, true),
  ],
};

const landscape = make('landscape');
landscape.ellipse(685, 154, 38, 38, { fill: '$warm', opacity: 0.8 });
landscape.path('M20 319 L127 226 L213 286 L346 188 L453 276 L545 235 L800 331 L800 390 L20 390 Z', { fill: '$secondary', opacity: 0.1 });
landscape.path('M20 350 L189 299 L337 329 L490 260 L670 307 L800 290 L800 427 L20 427 Z', { fill: '$secondary', opacity: 0.18 });
landscape.path('M20 393 C144 353 220 384 352 354 C475 327 646 349 800 333 L800 603 L20 603 Z', { fill: '$warm', opacity: 0.14 });
landscape.path('M20 450 C158 438 267 493 420 460 S667 447 800 422 L800 603 L20 603 Z', { fill: '$warm', opacity: 0.13 });
landscape.path('M20 525 C240 485 266 563 422 526 S649 528 800 502 L800 603 L20 603 Z', { fill: '$secondary', opacity: 0.18 });
// Terrain stratification is explanatory, not a measured geological section.
for (let i = 0; i < 55; i++) {
  const x = 38 + (i * 73) % 748, y = 438 + (i * 43) % 159;
  landscape.ellipse(x, y, 2.5 + i % 3, 1.5, { fill: '$warm', opacity: 0.28 });
}
// Mast, solar panel and cabinet: concrete objects rather than abstract boxes.
landscape.line(337, 243, 337, 377, { stroke: '$ink', strokeWidth: 6 });
landscape.polygon([[242, 194], [354, 211], [322, 259], [210, 242]], { fill: '$background', stroke: '$secondary', strokeWidth: 2 });
for (let i = 1; i < 5; i++) landscape.line(242 + i * 22.4, 194 + i * 3.4, 210 + i * 22.4, 242 + i * 3.4, { stroke: '$secondary', strokeWidth: 1 });
landscape.line(226, 218, 338, 235, { stroke: '$secondary', strokeWidth: 1 });
landscape.rect(308, 292, 57, 73, { fill: '$panel', stroke: '$ink', strokeWidth: 2, rx: 3 });
landscape.rect(319, 305, 35, 16, { fill: '$secondary', opacity: 0.3 });
landscape.ellipse(327, 339, 3, 3, { fill: '$accent' });
landscape.line(353, 292, 353, 263, { stroke: '$ink', strokeWidth: 2 });
for (const r of [18, 31, 44]) landscape.path(`M${353 - r * 0.7} ${259 - r * 0.7} A${r} ${r} 0 0 1 ${353 + r * 0.7} ${259 - r * 0.7}`, { stroke: '$secondary', strokeWidth: 2, opacity: 0.75 });
// Probe and cable into the soil profile.
landscape.path('M308 344 H271 V421 H203 V538', { stroke: '$warm', strokeWidth: 3 });
landscape.rect(188, 508, 30, 63, { fill: '$background', stroke: '$secondary', strokeWidth: 2, rx: 7 });
for (let i = 0; i < 4; i++) landscape.line(192, 539 + i * 6, 214, 539 + i * 6, { stroke: '$secondary', strokeWidth: 2 });
// Small contextual vegetation.
for (const [x, y, s] of [[98, 370, 1], [655, 342, 0.8], [731, 332, 0.6]]) {
  landscape.line(x, y, x, y - 76 * s, { stroke: '$muted', strokeWidth: 3 });
  landscape.polygon([[x - 26 * s, y - 20 * s], [x, y - 85 * s], [x + 26 * s, y - 20 * s]], { fill: '$secondary', opacity: 0.55 });
}
landscape.text('SOLAR POWER', 38, 121, 218, { fontSize: 16, weight: 'semibold', fill: '$secondary' });
landscape.line(190, 151, 250, 188, { stroke: '$muted', strokeWidth: 1 });
landscape.text('LOCAL ACQUISITION', 414, 221, 350, { fontSize: 16, weight: 'semibold', fill: '$secondary' });
landscape.line(412, 250, 365, 302, { stroke: '$muted', strokeWidth: 1 });
landscape.text('SOIL PROFILE', 420, 452, 300, { fontSize: 16, fill: '$muted', weight: 'semibold' });
landscape.text('MOISTURE PROBE', 38, 610, 310, { fontSize: 16, fill: '$secondary', weight: 'semibold' });
landscape.line(165, 603, 198, 580, { stroke: '$muted', strokeWidth: 1 });
landscape.text('A physical measurement becomes a traceable observation.', 38, 662, 725, { fontSize: 24 });

const signal = make('signal');
signal.line(48, 226, 454, 226, { stroke: '$muted', strokeWidth: 1 });
signal.line(48, 100, 48, 226, { stroke: '$muted', strokeWidth: 1 });
for (const y of [125, 175]) signal.line(48, y, 454, y, { strokeWidth: 1, dash: [3, 5] });
signal.path('M48 198 L72 183 L96 187 L120 163 L144 170 L168 157 L192 149 L216 159 L240 128 L264 144 L288 137 L312 112 L336 127 L360 122 L384 112 L408 118 L432 106 L454 114', { stroke: '$secondary', strokeWidth: 2 });
signal.path('M48 195 C118 174 159 165 216 153 S354 120 454 110', { stroke: '$accent', strokeWidth: 4 });
signal.text('Time →', 352, 237, 116, { fontSize: 16, fill: '$muted', align: 'right' });
signal.text('ILLUSTRATIVE SIGNAL · NOT MEASURED DATA', 48, 277, 430, { fontSize: 16, fill: '$muted' });
signal.line(48, 324, 88, 324, { stroke: '$secondary', strokeWidth: 2 });
signal.text('Raw', 100, 309, 120, { fontSize: 18 });
signal.line(242, 324, 282, 324, { stroke: '$accent', strokeWidth: 4 });
signal.text('Smoothed', 296, 309, 180, { fontSize: 18 });

const record = make('record');
record.text('01', 26, 105, 60, { fontSize: 32, fill: '$secondary', weight: 'semibold' });
record.text('Capture', 106, 103, 353, { fontSize: 24, weight: 'semibold' });
record.text('Keep the raw reading and timestamp.', 106, 144, 353, { fontSize: 19, fill: '$muted' });
record.line(26, 201, 467, 201);
record.text('02', 26, 222, 60, { fontSize: 32, fill: '$secondary', weight: 'semibold' });
record.text('Calibrate', 106, 220, 353, { fontSize: 24, weight: 'semibold' });
record.text('Record units and calibration version.', 106, 261, 353, { fontSize: 19, fill: '$muted' });
record.line(26, 317, 467, 317);
record.text('03', 26, 338, 60, { fontSize: 32, fill: '$secondary', weight: 'semibold' });
record.text('Interpret', 106, 336, 353, { fontSize: 24, weight: 'semibold' });
record.text('Carry quality flags into the report.', 106, 377, 353, { fontSize: 19, fill: '$muted' });

const sensing = {
  version: 1, title: 'From field conditions to usable evidence',
  eyebrow: 'FIELD NOTES     /     02 — ENVIRONMENTAL SENSING',
  description: 'An illustrated environmental station shows solar power, acquisition electronics and a buried probe. Two companion panels explain signal smoothing and the record needed to interpret a measurement.',
  subtitle: 'A conceptual monitoring station, its signal and the context that makes a reading useful.',
  width: 1440, height: 1090, theme: 'paper',
  footer: 'Concept design · synthetic signal · no performance claims · illustration is not an installation drawing',
  sources: [{ title: 'W3C Semantic Sensor Network Ontology', url: 'https://www.w3.org/TR/vocab-ssn/' }],
  panels: [
    panel('field', 52, 182, 822, 826, 'Inside a monitoring station', '01 / PHYSICAL SYSTEM', landscape),
    panel('signal', 896, 182, 492, 358, 'Reading a noisy signal', '02 / SIGNAL', signal),
    panel('record', 896, 562, 492, 446, 'Preserve the context', '03 / EVIDENCE', record),
  ],
};

for (const [name, scene] of Object.entries({ optics, sensing })) {
  const dir = fileURLToPath(new URL(`../examples/${name}/`, import.meta.url));
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/scene.json`, JSON.stringify(scene, null, 2) + '\n');
  console.log(`Wrote examples/${name}/scene.json`);
}
