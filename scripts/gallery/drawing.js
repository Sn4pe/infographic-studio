import { layoutText } from '../../src/text.js';

// Shared production vocabulary for the gallery. The subject decides the geometry.
export const colors = { bg: '#0d2637', panel: '#112e40', line: '#355364', ink: '#f2ebd6', muted: '#b0c5ca', teal: '#64bbd2', coral: '#ef7967', gold: '#dfc591' };

export function drawing(id, x, y, width, height, options = {}) {
  const panel = { id, x, y, width, height, framed: false, elements: [], ...options };
  let counter = 0;
  const put = (type, values, key) => { const e = { id: `${id}-${key ?? ++counter}`, type, ...values }; panel.elements.push(e); return e; };
  const api = {
    panel,
    rect: (x, y, width, height, fill = '$panel', stroke = '$line', rx = 0) => put('rect', { x, y, width, height, fill, stroke, strokeWidth: 1.5, rx }),
    circle: (x, y, r, fill = 'none', stroke = '$line', sw = 2) => put('ellipse', { x, y, rx: r, ry: r, fill, stroke, strokeWidth: sw }),
    ellipse: (x, y, rx, ry, fill = 'none', stroke = '$line', sw = 2) => put('ellipse', { x, y, rx, ry, fill, stroke, strokeWidth: sw }),
    polygon: (points, fill = 'none', stroke = '$line', sw = 2) => put('polygon', { points, fill, stroke, strokeWidth: sw }),
    path: (d, stroke = '$line', sw = 2, fill = 'none', extra = {}) => put('path', { d, fill, stroke, strokeWidth: sw, ...extra }),
    line: (x, y, x2, y2, stroke = '$line', sw = 2, extra = {}) => put('line', { x, y, x2, y2, stroke, strokeWidth: sw, ...extra }),
    arrow: (x, y, x2, y2, stroke = '$secondary', sw = 3) => put('arrow', { x, y, x2, y2, stroke, strokeWidth: sw }),
    ribbon(x, y, length, thickness, fill) {
      // Flow width encodes a quantity; its head must not grow like a stroked connector's head.
      const head = Math.min(length * .22, thickness * 1.3), half = thickness / 2;
      const e = api.polygon([[x, y - half], [x + length - head, y - half], [x + length - head, y - half * 1.5], [x + length, y], [x + length - head, y + half * 1.5], [x + length - head, y + half], [x, y + half]], fill, 'none');
      e.artworkId = `${e.id}-ribbon`;
      e.artworkBounds = { x, y: y - half * 1.5, width: length, height: thickness * 1.5 };
    },
    text(text, x, y, width, size = 22, fill = '$ink', weight = 'regular', extra = {}) {
      const e = put('text', { text, x, y, width, fontSize: size, fill, weight, ...extra });
      return { element: e, height: layoutText(text, width, size, weight).height };
    },
    label(text, x, y, width, fill = '$secondary') { return api.text(text, x, y, width, 17, fill, 'semibold'); },
    route(points, stroke = '$secondary', sw = 3, dash) {
      for (let i = 1; i < points.length - 1; i++) api.line(...points[i - 1], ...points[i], stroke, sw, dash ? { dash } : {});
      api.arrow(...points.at(-2), ...points.at(-1), stroke, sw);
    },
    heading(n, title, subtitle) {
      api.label(n, 0, 5, 40, '$warm');
      api.text(title, 58, 0, width - 58, 28, '$ink', 'semibold');
      if (subtitle) api.text(subtitle, 0, 45, width, 21, '$muted');
    },
    card(title, body, x, y, width, accent = '$secondary', minHeight = 0) {
      const titleHeight = layoutText(title, width - 32, 23, 'semibold').height;
      const bodyHeight = body ? layoutText(body, width - 32, 20).height : 0;
      const height = Math.max(minHeight, 32 + titleHeight + (body ? 12 + bodyHeight : 0));
      const box = api.rect(x, y, width, height, '$panel', '$line', 8);
      api.line(x + 16, y + 1, x + 60, y + 1, accent, 3);
      api.text(title, x + 16, y + 14, width - 32, 23, '$ink', 'semibold', { container: box.id });
      if (body) api.text(body, x + 16, y + 26 + titleHeight, width - 32, 20, '$muted', 'regular', { container: box.id });
      return { x, y, width, height, left: [x, y + height / 2], right: [x + width, y + height / 2], top: [x + width / 2, y], bottom: [x + width / 2, y + height] };
    },
  };
  return api;
}

export function figure(title, subtitle, eyebrow, height, sources, panels, footer, theme = 'blueprint') {
  return { version: 1, title, subtitle, description: subtitle, eyebrow, width: 1800, height, theme, sources, panels: panels.map(p => p.panel), footer };
}

export function hexagons(d, cx, cy, r, scaleY = 1, folded = false) {
  for (let q = -2; q <= 2; q++) for (let s = -2; s <= 2; s++) {
    if (Math.abs(q + s) > 2 || (q === 0 && s === 0)) continue;
    const wing = folded && Math.abs(q) === 2;
    const x = cx + (wing ? Math.sign(q) * r * 2.3 : r * 1.5 * q), y = cy + Math.sqrt(3) * r * (s + q / 2) * scaleY;
    const points = Array.from({ length: 6 }, (_, i) => [x + (r - 2) * Math.cos(i * Math.PI / 3) * (wing ? .23 : 1), y + (r - 2) * Math.sin(i * Math.PI / 3) * scaleY]);
    d.polygon(points, (q + s) % 2 ? '#d1ad64' : '#e6c98a', '#8b7449', 1.5);
  }
}

export function coil(d, x, y, width, height, color) {
  for (let i = 0; i <= 12; i++) d.line(x + width * i / 12, y, x + width * i / 12, y + height, '$line', 1.5);
  let path = `M${x + 14} ${y}`;
  for (let i = 0; i < 6; i++) {
    const yy = y + 12 + i * (height - 24) / 5;
    path += ` L${i % 2 ? x + 14 : x + width - 14} ${yy}`;
    if (i < 5) path += ` L${i % 2 ? x + 14 : x + width - 14} ${yy + (height - 24) / 5}`;
  }
  d.path(path, color, 7);
}

export function fan(d, cx, cy, r, color = '$muted') {
  d.circle(cx, cy, r, 'none', color, 2);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    const p = (rr, aa) => [cx + rr * Math.cos(aa), cy + rr * Math.sin(aa)];
    const [x1, y1] = p(r * .22, a), [x2, y2] = p(r * .82, a + .8), [x3, y3] = p(r * .7, a + 1.5);
    d.path(`M${cx} ${cy} Q${x1} ${y1} ${x2} ${y2} Q${x3} ${y3} ${cx} ${cy}`, color, 1.5, color);
  }
  d.circle(cx, cy, r * .15, '$panel', color, 2);
}
