import { textEntries } from './labels.js';

export function printSize(scene, printWidthMm) {
  if (!Number.isFinite(printWidthMm) || printWidthMm < 20 || printWidthMm > 2000) throw new Error('Print width must be between 20 and 2000 mm.');
  return { widthMm: printWidthMm, heightMm: printWidthMm * scene.height / scene.width, pointsPerPixel: printWidthMm * 72 / 25.4 / scene.width };
}

export function inspectPrint(scene, printWidthMm, minFontPt = 8) {
  const size = printSize(scene, printWidthMm);
  if (!Number.isFinite(minFontPt) || minFontPt < 1 || minFontPt > 72) throw new Error('Minimum print font size must be between 1 and 72 pt.');
  const labels = textEntries(scene).map(({ id, fontSize }) => ({ id, fontSizePt: fontSize * size.pointsPerPixel }));
  const issues = labels.filter((label) => label.fontSizePt < minFontPt).map(({ id, fontSizePt }) => ({
    severity: 'warning', code: 'print-small-text', element: id,
    message: `Text is ${fontSizePt.toFixed(2)} pt at ${printWidthMm} mm width; minimum requested is ${minFontPt} pt.`,
  }));
  return { ...size, minFontPt, labels, issues };
}
