import { drawing, figure } from './drawing.js';

function wave(d, x, y, width, amplitude, phase, colour, dash) {
  const points = Array.from({ length: 181 }, (_, i) => {
    const t = i / 180;
    return `${i ? 'L' : 'M'}${(x + width * t).toFixed(2)} ${(y + amplitude * Math.sin(t * Math.PI * 8 + phase)).toFixed(2)}`;
  });
  d.path(points.join(' '), colour, 3, 'none', dash ? { dash } : {});
}

function ring(d, cx, cy, rx, ry) {
  d.circle(cx, cy, 66, 'none', '$line', 1.5);
  d.ellipse(cx, cy, rx, ry, 'none', '$secondary', 2.5);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    d.circle(cx + rx * Math.cos(a), cy + ry * Math.sin(a), 5, '$secondary', 'none');
  }
}

export function ligo() {
  const optics = drawing('optical-core', 52, 182, 1030, 869);
  optics.heading('01', 'Follow the light', 'A Michelson layout with two perpendicular Fabry–Pérot arm cavities.');
  // Pale vacuum envelopes provide physical context, not flowchart containers.
  optics.rect(321, 158, 86, 486, '#e5ebe6', 'none', 27);
  optics.rect(320, 574, 690, 76, '#e5ebe6', 'none', 27);
  optics.rect(322, 641, 84, 163, '#e5ebe6', 'none', 20);
  optics.rect(13, 574, 171, 58, '#e2e8e5', '$muted', 9);
  optics.text('LASER', 37, 589, 122, 23, '$ink', 'semibold');
  optics.arrow(190, 602, 326, 602, '$accent', 4);
  // Outward and return rays are deliberately offset for reading; real beams overlap.
  optics.line(351, 602, 351, 185, '$accent', 4);
  optics.line(372, 185, 372, 602, '$accent', 4);
  optics.arrow(351, 389, 351, 319, '$accent', 4);
  optics.arrow(372, 305, 372, 375, '$accent', 4);
  optics.line(374, 602, 975, 602, '$accent', 4);
  optics.line(975, 623, 372, 623, '$accent', 4);
  optics.arrow(605, 602, 675, 602, '$accent', 4);
  optics.arrow(838, 623, 768, 623, '$accent', 4);
  optics.line(372, 623, 372, 775, '$accent', 4);
  optics.arrow(372, 688, 372, 744, '$accent', 4);
  // Optical surfaces drawn over the rays make entry, storage and return legible.
  optics.rect(309, 173, 111, 12, '#a9c4c9', '$secondary', 2);
  optics.rect(317, 447, 90, 10, '#a9c4c9', '$secondary', 2);
  optics.rect(476, 570, 10, 84, '#a9c4c9', '$secondary', 2);
  optics.rect(975, 557, 12, 110, '#a9c4c9', '$secondary', 2);
  optics.line(329, 572, 397, 640, '$secondary', 9, { geometryRole: 'illustration' });
  optics.rect(300, 779, 145, 62, '#e2e8e5', '$secondary', 8);
  optics.circle(372, 810, 16, '#aac9cf', '$secondary', 2);

  optics.label('END MIRROR', 278, 125, 240);
  optics.line(263, 187, 263, 446, '$muted', 1.5);
  optics.line(253, 187, 273, 187, '$muted', 1.5);
  optics.line(253, 446, 273, 446, '$muted', 1.5);
  optics.text('4 km', 151, 303, 100, 30, '$ink', 'semibold');
  optics.line(487, 539, 972, 539, '$muted', 1.5);
  optics.line(487, 529, 487, 549, '$muted', 1.5);
  optics.line(972, 529, 972, 549, '$muted', 1.5);
  optics.text('4 km', 687, 488, 180, 30, '$ink', 'semibold');
  optics.label('INPUT MIRRORS', 454, 435, 330);
  optics.path('M427 452 H443 M481 462 V558', '$muted', 1.5);
  optics.text('Light makes repeated trips', 498, 189, 495, 28, '$ink', 'semibold');
  optics.text('Each input mirror and end mirror form a cavity, increasing the light’s interaction with a changing arm length.', 498, 244, 495, 24, '$muted');
  optics.label('END MIRROR', 821, 691, 208);
  optics.line(980, 674, 980, 684, '$muted', 1.5);
  optics.text('Beam splitter', 15, 700, 258, 25, '$ink', 'semibold');
  optics.path('M261 712 H296 V650 L337 628', '$muted', 1.5);
  optics.text('Split, then recombine', 15, 743, 250, 21, '$muted');
  optics.text('Photodetector', 481, 777, 474, 26, '$ink', 'semibold');
  optics.text('Read the interference signal', 481, 821, 513, 22, '$muted');
  optics.line(451, 810, 469, 810, '$muted', 1.5);

  const strain = drawing('differential-strain', 1150, 182, 598, 869);
  strain.heading('02', 'Space changes the paths', 'A conceptual ring of freely falling test particles, viewed along the wave.');
  ring(strain, 110, 231, 66, 66);
  strain.label('REFERENCE', 246, 174, 346);
  strain.text('No deformation', 246, 210, 346, 27, '$ink', 'semibold');
  strain.text('The two axes have the same reference length.', 246, 255, 346, 22, '$muted');
  ring(strain, 110, 418, 91, 48);
  strain.label('ONE PHASE', 246, 364, 346);
  strain.text('Stretch x, compress y', 246, 400, 346, 26, '$ink', 'semibold');
  strain.text('Perpendicular optical paths change differently.', 246, 447, 346, 22, '$muted');
  ring(strain, 110, 606, 48, 91);
  strain.label('HALF A CYCLE LATER', 246, 556, 346);
  strain.text('Compress x, stretch y', 246, 592, 346, 26, '$ink', 'semibold');
  strain.text('The sign of the differential change reverses.', 246, 639, 346, 22, '$muted');
  strain.line(0, 745, 598, 745, '$line', 2);
  strain.text('Plus polarization shown. Deformation is greatly exaggerated; the faint reference is the original circle.', 0, 773, 598, 23, '$muted');

  const phase = drawing('phase-readout', 52, 1130, 1696, 459);
  phase.heading('03', 'Compare optical phase, not a ruler reading', 'Returning electric fields combine. A relative phase change alters the light reaching the output.');
  phase.label('IDEAL DESTRUCTIVE INTERFERENCE', 0, 118, 680);
  wave(phase, 15, 225, 570, 38, 0, '$secondary');
  wave(phase, 15, 225, 570, 38, Math.PI, '$accent', [7, 5]);
  phase.line(15, 338, 585, 338, '$warm', 4);
  phase.text('Opposite fields cancel at the dark output.', 0, 389, 680, 23, '$muted');
  phase.label('WITH A SMALL PHASE DIFFERENCE', 802, 118, 830);
  wave(phase, 817, 225, 570, 38, 0, '$secondary');
  wave(phase, 817, 225, 570, 38, Math.PI + .65, '$accent', [7, 5]);
  // This lower curve is the sum of the two fields above, not an observed GW waveform.
  const sum = Array.from({ length: 181 }, (_, i) => {
    const a = i / 180 * Math.PI * 8;
    return `${i ? 'L' : 'M'}${817 + i / 180 * 570} ${338 + 38 * (Math.sin(a) + Math.sin(a + Math.PI + .65))}`;
  });
  phase.path(sum.join(' '), '$warm', 4);
  phase.text('Incomplete cancellation changes output power.', 802, 389, 894, 23, '$muted');
  phase.label('FIELDS', 1461, 211, 230, '$muted');
  phase.label('SUM', 1461, 325, 230, '$warm');

  return figure('LIGO: turning a change in space into light', 'Two long optical cavities amplify a tiny differential effect; interference makes the change observable.', 'FIELD ATLAS    /    06 — PRECISION MEASUREMENT', 1680, [
    { title: 'LIGO Lab — What is an Interferometer?', url: 'https://www.ligo.caltech.edu/MIT/page/what-is-interferometer' },
    { title: 'LIGO Lab — LIGO’s Interferometer', url: 'https://www.ligo.caltech.edu/WA/page/ligos-ifo' },
    { title: 'LIGO Lab — What is LIGO?', url: 'https://www.ligo.caltech.edu/page/what-is-ligo' }
  ], [optics, strain, phase], 'Source: Caltech / MIT / LIGO Lab • Optical core only; recycling optics and readout controls omitted • Rays offset for clarity; waves are conceptual', 'paper');
}
