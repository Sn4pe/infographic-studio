import { drawing, figure, hexagons } from './drawing.js';

function shield(d, cx, cy, w, h, separated = 12) {
  for (let i = 4; i >= 0; i--) {
    const yy = cy + i * separated, ww = w * (1 + i * .025);
    d.polygon([[cx - ww / 2, yy], [cx - ww * .1, yy - h / 2], [cx + ww / 2, yy - h * .06], [cx + ww * .16, yy + h / 2]], ['#97b7c0', '#7a9caa', '#627f92', '#696c86', '#805f79'][i], '#c0d0d1', 1.5);
    d.line(cx - ww / 2, yy, cx + ww / 2, yy - h * .06, '#c0d0d1', .8, { geometryRole: 'illustration' });
    d.line(cx - ww * .1, yy - h / 2, cx + ww * .16, yy + h / 2, '#c0d0d1', .8, { geometryRole: 'illustration' });
  }
}

export function webb() {
  const observatory = drawing('observatory', 52, 180, 1030, 813);
  observatory.heading('01', 'A large mirror on the cold side', 'Unfolding creates an observatory that could never fit inside its rocket.');
  // Original geometric drawing. Mirror layout: radius-two hexagonal array minus its centre = 18 segments.
  shield(observatory, 471, 574, 730, 178, 14);
  observatory.polygon([[415, 650], [510, 651], [538, 704], [442, 715], [397, 688]], '#355364', '$muted', 2);
  observatory.polygon([[413, 685], [338, 735], [505, 764], [552, 715]], '#173e56', '$secondary', 1.5);
  for (let i = 1; i < 5; i++) observatory.line(413 + i * 27, 686 + i * 6, 338 + i * 32, 735 + i * 6, '$secondary', 1, { geometryRole: 'illustration' });
  observatory.path('M455 565 L403 301 L492 297 L512 565', '$line', 15);
  hexagons(observatory, 428, 320, 53, .94);
  observatory.polygon([[412, 284], [447, 284], [459, 308], [443, 333], [411, 333], [397, 308]], '$background', '$muted', 2);
  observatory.path('M248 349 L420 523 L603 350 M428 117 L420 523', '$ink', 3);
  observatory.ellipse(420, 523, 29, 14, '$warm', '$ink', 2);
  observatory.text('18', 755, 147, 220, 76, '$warm', 'semibold');
  observatory.text('segments act as\none 6.5 m mirror', 760, 249, 270, 27);
  observatory.line(652, 257, 737, 257, '$warm', 2);
  observatory.circle(652, 257, 4, '$warm', 'none');
  observatory.text('Secondary mirror', 740, 417, 280, 24, '$ink', 'semibold');
  observatory.text('Support struts unfold\nin front of the primary.', 740, 454, 280, 22, '$muted');
  observatory.path('M450 522 H694 V451 H725', '$muted', 1.5);
  observatory.circle(450, 522, 4, '$muted', 'none');
  observatory.text('Five separated\nsunshield layers', 754, 690, 266, 25, '$ink', 'semibold');
  observatory.line(688, 633, 738, 713, '$muted', 1.5);
  observatory.circle(688, 633, 4, '$muted', 'none');
  observatory.label('COLD / SPACE-FACING', 16, 110, 340);
  observatory.label('WARM / SUN-FACING', 10, 740, 305, '$accent');
  observatory.text('Deployed geometry • simplified perspective', 320, 782, 680, 18, '$muted');

  const physics = drawing('thermal-and-optical', 1150, 180, 598, 813);
  physics.heading('02', 'Keep its own heat out', 'An infrared telescope must stay cold enough to detect faint signals.');
  physics.label('TELESCOPE SIDE', 21, 134, 315);
  physics.text('Below 50 K', 20, 167, 545, 48, '$secondary', 'semibold');
  physics.text('Passive cooling after deployment', 22, 232, 550, 21, '$muted');
  // Section through separated membranes, not a temperature profile or a measured ray trace.
  for (let i = 0; i < 5; i++) {
    const yy = 292 + i * 33;
    physics.polygon([[42 - i * 4, yy], [417 + i * 12, yy + 8], [417 + i * 12, yy + 14], [42 - i * 4, yy + 6]], ['#9fcad1', '#8db2c2', '#8494aa', '#a48c9e', '#c98685'][i], 'none');
    physics.text(String(5 - i), 0, yy - 7, 24, 17, '$muted');
  }
  physics.route([[455, 374], [509, 374], [560, 327]], '$accent', 3);
  physics.route([[470, 423], [529, 423], [574, 381]], '$accent', 3);
  physics.text('Heat escapes\nto space', 431, 266, 166, 20, '$accent');
  for (const x of [130, 230, 330]) physics.arrow(x, 518, x, 453, '$warm', 4);
  physics.label('SUN / EARTH / MOON', 78, 534, 460, '$warm');
  physics.text('Vacuum gaps limit conduction; separated membranes radiate heat outward.', 0, 585, 598, 24, '$muted');
  physics.line(0, 676, 598, 676);
  physics.text('MIRI needs an extra cooler', 0, 701, 598, 25, '$ink', 'semibold');
  physics.text('Its mid-infrared detectors operate near 7 K, colder than passive cooling alone can provide.', 0, 744, 598, 22, '$muted');

  const stages = drawing('deployment', 52, 1067, 1696, 448);
  stages.heading('03', 'Deploy first. Then turn eighteen images into one.', 'Physical deployment ends before optical commissioning is complete.');
  const cols = [0, 450, 900, 1350];
  for (let i = 0; i < 3; i++) stages.arrow(cols[i] + 335, 210, cols[i + 1] - 22, 210, '$muted', 2.5);
  // Four different representations show transformations, not four repetitions of an icon.
  stages.rect(87, 121, 102, 185, '$panel', '$muted', 20);
  hexagons(stages, 138, 207, 18, .95, true);
  stages.polygon([[87, 310], [109, 310], [100, 339]], '$warm', 'none');
  stages.polygon([[166, 310], [188, 310], [176, 339]], '$warm', 'none');
  stages.label('LAUNCH • 25 DEC 2021', 0, 355, 338, '$warm');
  stages.text('Fold the mirror and shield\ninside the launch envelope.', 0, 387, 335, 23);

  shield(stages, 595, 234, 286, 80, 9);
  stages.line(595, 230, 595, 140, '$muted', 7, { geometryRole: 'illustration' });
  stages.label('FIRST TWO WEEKS', 450, 355, 338, '$warm');
  stages.text('Extend and tension the shield;\nopen the secondary and wings.', 450, 387, 375, 23);

  for (let q = -2; q <= 2; q++) for (let s = -2; s <= 2; s++) if (Math.abs(q + s) <= 2 && (q || s)) {
    const x = 1044 + q * 29, y = 216 + (s + q / 2) * 29;
    stages.circle(x, y, 5, '$warm', 'none');
    stages.circle(x, y, 10, 'none', '#6c6a57', 1);
  }
  stages.label('COMMISSIONING', 900, 355, 338, '$warm');
  stages.text('Align the segment images\nand phase the primary mirror.', 900, 387, 375, 23);

  for (const r of [72, 48, 26]) stages.circle(1502, 216, r, 'none', r === 26 ? '$warm' : '$line', 2);
  stages.circle(1502, 216, 11, '$warm', 'none');
  stages.line(1502, 123, 1502, 180, '$warm', 2);
  stages.line(1502, 252, 1502, 309, '$warm', 2);
  stages.line(1409, 216, 1466, 216, '$warm', 2);
  stages.line(1538, 216, 1595, 216, '$warm', 2);
  stages.label('SCIENCE • JULY 2022', 1350, 355, 346, '$warm');
  stages.text('One aligned aperture\nfeeds the science instruments.', 1350, 387, 346, 23);

  return figure('Webb: unfold, cool, focus', 'The engineering behind a cold infrared observatory: a deployable mirror, a thermal barrier and months of optical alignment.', 'FIELD ATLAS    /    02 — SPACE SYSTEMS', 1600, [
    { title: 'NASA — Webb’s Sunshield', url: 'https://science.nasa.gov/mission/webb/webbs-sunshield/' },
    { title: 'NASA — Webb’s Mirrors', url: 'https://science.nasa.gov/mission/webb/webbs-mirrors/' },
    { title: 'NASA — Deployment', url: 'https://science.nasa.gov/mission/webb/deployment/' }
  ], [observatory, physics, stages], 'Sources: NASA / Webb • Original vector schematics, not to scale • Thermal section and star images are conceptual, not measured data');
}
