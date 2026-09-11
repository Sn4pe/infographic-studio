import { createIllustration, illustrationProfile } from './illustrations.js';
import { markArtwork } from './artwork.js';

// Domain-neutral objects. Meaning comes from the scene's labels and relationships.
export const componentProfile = illustrationProfile;
const names = ['person', 'organization', 'document', 'device', 'container', 'network', 'plant', 'grid'];
export const listComponents = () => [...names];

export function createComponent(name, { id, x = 0, y = 0, width = 100, height = 100, variant = 'teal' } = {}) {
  if (!names.includes(name)) throw new Error(`Unknown component: ${name}.`);
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id ?? '')) throw new Error('A component needs a stable id.');
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) throw new Error('Invalid component bounds.');
  const variants = name === 'person' ? ['teal','warm','elder'] : name === 'device' ? ['teal','blank','sealed'] : ['teal'];
  if (!variants.includes(variant)) throw new Error(`Unsupported ${name} variant: ${variant}.`);
  if (name === 'person') {
    const scale = Math.min(width / 80, height / 112);
    return createIllustration('person', { id, x: x + (width - 80 * scale) / 2, y: y + (height - 112 * scale) / 2, scale, variant });
  }
  const c = componentProfile.palette, out = []; let seq = 0;
  const add = (type, props) => out.push({ id: `${id}-${++seq}`, type, ...props });
  const X = n => x + n * width / 100, Y = n => y + n * height / 100;
  const rect = (a, b, w, h, fill = c.paper, stroke = c.ink) => add('rect', { x: X(a), y: Y(b), width: w * width / 100, height: h * height / 100, rx: Math.min(width, height) * .035, fill, stroke, strokeWidth: 3 });
  const line = (a, b, d, e, stroke = c.ink, detail = false) => add('line', { x: X(a), y: Y(b), x2: X(d), y2: Y(e), stroke, strokeWidth: detail ? 1.5 : 3 });
  const ellipse = (a, b, r, fill) => add('ellipse', { x: X(a), y: Y(b), rx: r * Math.min(width, height) / 100, ry: r * Math.min(width, height) / 100, fill, stroke: c.ink, strokeWidth: 3 });
  const polygon = (points, fill) => add('polygon', { points: points.map(([a, b]) => [X(a), Y(b)]), fill, stroke: c.ink, strokeWidth: 3 });
  switch (name) {
    case 'organization':
      rect(17, 10, 66, 84, c.light); rect(39, 72, 22, 22, c.teal);
      for (const a of [29, 57]) for (const b of [24, 47]) rect(a, b, 14, 13, c.paper);
      line(8, 94, 92, 94); break;
    case 'document':
      polygon([[10, 3], [68, 3], [90, 23], [90, 96], [10, 96]], c.paper);
      polygon([[68, 3], [68, 23], [90, 23]], c.light);
      for (let i = 0; i < 4; i++) line(24, 39 + i * 13, i === 3 ? 61 : 76, 39 + i * 13, c.teal, true);
      break;
    case 'device':
      rect(5, 5, 90, 90, c.light);
      if (variant === 'sealed') {
        for (let i=0;i<4;i++) line(22,51+i*10,78,51+i*10,c.teal,true);
        break;
      }
      rect(18, 17, 64, 41, c.paper);
      if (variant !== 'blank') { line(29, 39, 44, 39, c.teal); line(54, 39, 71, 39, c.teal); }
      ellipse(28, 76, 4, c.teal); line(46, 72, 80, 72, c.ink, true); line(46, 80, 70, 80, c.ink, true); break;
    case 'container':
      rect(5, 17, 90, 77, c.light); rect(3, 8, 94, 20, c.teal); rect(37, 44, 26, 12, c.paper); break;
    case 'network': {
      const nodes = [[15, 25], [50, 10], [85, 25], [22, 82], [78, 82], [50, 50]];
      for (const [a, b] of [[0,1],[1,2],[0,3],[2,4],[3,4],[0,5],[1,5],[2,5],[3,5],[4,5]]) line(...nodes[a], ...nodes[b], c.teal, true);
      nodes.forEach(([a, b], i) => ellipse(a, b, i === 5 ? 10 : 6, i === 5 ? c.teal : c.warm)); break;
    }
    case 'plant':
      line(50, 94, 50, 19, c.teal);
      polygon([[50, 52], [18, 41], [12, 12], [41, 22]], c.light);
      polygon([[50, 68], [81, 50], [87, 24], [58, 36]], c.teal); break;
    case 'grid':
      rect(3, 3, 94, 94, c.teal);
      for (let i = 1; i < 4; i++) { line(3 + i * 23.5, 3, 3 + i * 23.5, 97, c.paper, true); line(3, 3 + i * 23.5, 97, 3 + i * 23.5, c.paper, true); }
      break;
  }
  return markArtwork(out, id, { x, y, width, height });
}

// A composition contains independently addressable components: no domain-specific preset required.
export function composeComponents(parts) {
  if (!Array.isArray(parts) || parts.length === 0) throw new Error('A composition needs parts.');
  const elements = parts.flatMap(({ component, ...options }) => createComponent(component, options));
  if (new Set(elements.map(e => e.id)).size !== elements.length) throw new Error('Composition part IDs must be unique.');
  return elements;
}

// Nested material/structure sections, usable for fibres, cables, pipes or other layered objects.
// Ratios are supplied by the author; this helper makes no physical assumptions.
export function createSection({ id, x, y, width, height, view = 'side', layers } = {}) {
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id ?? '') || ![x,y,width,height].every(Number.isFinite) || width <= 0 || height <= 0 || !['side','end'].includes(view)) throw new Error('Invalid section bounds or view.');
  if (!Array.isArray(layers) || !layers.length) throw new Error('A section needs explicit layers.');
  const ids = new Set();
  return layers.map(({ id: layerId, from = 0, to = 1, ratio = 1, fill = componentProfile.palette.light }) => {
    const key = layerId ?? `${id}-${ids.size + 1}`;
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key) || ids.has(key) || !/^#[0-9a-fA-F]{6}$/.test(fill)) throw new Error('Invalid section layer id or colour.');
    ids.add(key);
    if (![from,to,ratio].every(Number.isFinite) || from < 0 || to > 1 || from >= to || ratio <= 0 || ratio > 1) throw new Error('Invalid section layer proportions.');
    const paint = { id: key, fill, stroke: componentProfile.palette.ink, strokeWidth: 3 };
    return view === 'end'
      ? { ...paint, type: 'ellipse', x: x + width / 2, y: y + height / 2, rx: width * ratio / 2, ry: height * ratio / 2 }
      : { ...paint, type: 'rect', x, y: y + height * from, width, height: height * (to - from) };
  });
}
