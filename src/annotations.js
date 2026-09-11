import { layoutText } from './text.js';

function elementBox(element) {
  if (element.rotation) throw new Error(`Callout target ${element.id} is rotated. Use an explicit target point.`);
  if (['rect', 'image', 'icon'].includes(element.type)) return [element.x, element.y, element.width, element.height];
  if (element.type === 'ellipse') return [element.x - element.rx, element.y - element.ry, 2 * element.rx, 2 * element.ry];
  if (element.type === 'wave') return [element.x, element.y - element.amplitude, element.width, 2 * element.amplitude];
  if (element.type === 'text') return [element.x, element.y, element.width, layoutText(element.text, element.width, element.fontSize, element.weight).height];
  throw new Error(`Callout target ${element.id} has no supported bounding box. Use an explicit target point for ${element.type}.`);
}

export function resolveTarget(callout, elements) {
  if (Array.isArray(callout.target)) return callout.target;
  const candidates = elements.filter((e) => e.id === callout.target.element);
  if (candidates.length !== 1) throw new Error(`Callout ${callout.id}: expected one target ${callout.target.element}, found ${candidates.length}.`);
  const [x, y, w, h] = elementBox(candidates[0]);
  const [u, v] = callout.target.at ?? [0.5, 0.5];
  return [x + u * w, y + v * h];
}

// Callouts compile to ordinary scene primitives. Text, leaders and anchors remain editable.
export function expandCallout(callout, elements) {
  if (callout.rotation) throw new Error(`Callout ${callout.id}: rotated callouts are unsupported. Use separate text and line elements.`);
  const [tx, ty] = resolveTarget(callout, elements);
  const { x, y, width } = callout;
  const height = layoutText(callout.text, width, callout.fontSize, callout.weight).height;
  let side = callout.side ?? 'auto';
  if (side === 'auto') side = tx < x ? 'left' : tx > x + width ? 'right' : ty < y ? 'top' : 'bottom';
  const cx = x + width / 2, cy = y + height / 2;
  const start = side === 'left' ? [x - 10, cy] : side === 'right' ? [x + width + 10, cy] : side === 'top' ? [cx, y - 10] : [cx, y + height + 10];
  const elbow = side === 'left' ? [start[0] - 24, start[1]] : side === 'right' ? [start[0] + 24, start[1]] : side === 'top' ? [start[0], start[1] - 24] : [start[0], start[1] + 24];
  const { target, side: _side, type, ...text } = callout;
  return [
    { id: `${callout.id}-leader`, type: 'path', d: `M${start.join(',')} L${elbow.join(',')} L${tx},${ty}`, stroke: callout.stroke ?? '$muted', strokeWidth: callout.strokeWidth ?? 1.5 },
    { id: `${callout.id}-anchor`, type: 'ellipse', x: tx, y: ty, rx: 3, ry: 3, fill: callout.stroke ?? '$muted' },
    { ...text, type: 'text' },
  ];
}

export function expandScene(scene) {
  return { ...scene, panels: scene.panels.map((p) => ({ ...p, elements: p.elements.flatMap((e) => e.type === 'callout' ? expandCallout(e, p.elements) : [e]) })) };
}
