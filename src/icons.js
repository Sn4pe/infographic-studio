import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../assets/icons/tabler/', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('catalog.json', root), 'utf8'));
const license = readFileSync(new URL('LICENSE', root), 'utf8');
const cache = new Map();

// Deliberately narrow: pinned Tabler outline SVGs containing path geometry only.
// No generic SVG/XML import, links, entities, styles, scripts or transforms.
export function decodeOutlineSvg(svg) {
  const clean = svg.replace(/<!--[\s\S]*?-->/g, '').trim();
  const outer = clean.match(/^<svg\s+([^>]*)>([\s\S]*)<\/svg>$/);
  if (!outer) throw new Error('Unsupported outline SVG root.');
  const expected = { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  const found = new Set();
  const remainder = outer[1].replace(/([\w-]+)="([^"]*)"/g, (_match, key, value) => {
    if (!Object.hasOwn(expected, key) || expected[key] !== value || found.has(key)) throw new Error(`Unsupported outline SVG attribute: ${key}.`);
    found.add(key);
    return '';
  });
  if (remainder.trim() || found.size !== Object.keys(expected).length) throw new Error('Invalid outline SVG attributes.');
  const paths = [];
  const body = outer[2].replace(/<path\s+d="([MmLlHhVvCcSsQqTtAaZz0-9eE., +\-\s]+)"\s*\/>/g, (_match, d) => { paths.push(d); return ''; });
  if (body.trim() || !paths.length) throw new Error('Only outline path geometry is supported.');
  return paths;
}

export function getIcon(name) {
  if (!catalog.icons.some((id) => `tabler/${id}` === name)) throw new Error(`Unknown icon ${name}. Use the icons command to browse the bundled catalog.`);
  if (!cache.has(name)) {
    const id = name.slice(7);
    const svg = readFileSync(new URL(`${id}.svg`, root), 'utf8');
    const paths = decodeOutlineSvg(svg);
    const tags = svg.match(/tags: \[([^\]]*)\]/)?.[1].split(',').map((tag) => tag.trim()) ?? [];
    cache.set(name, { name, family: catalog.family, license: catalog.license, author: catalog.author, source: `${catalog.source}/blob/${catalog.revision}/icons/outline/${id}.svg`, revision: catalog.revision, tags, hash: createHash('sha256').update(svg).digest('hex'), paths });
  }
  return structuredClone(cache.get(name));
}

export function listIcons(query = '') {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return catalog.icons.map((id) => getIcon(`tabler/${id}`)).filter((icon) => terms.every((term) => [icon.name, ...icon.tags].join(' ').toLowerCase().includes(term))).map(({ paths, ...metadata }) => metadata);
}

export function sceneIcons(scene) {
  return [...new Set(scene.panels.flatMap((p) => p.elements.filter((e) => e.type === 'icon').map((e) => e.icon)))].map(getIcon);
}

export function renderIcon(element, color) {
  const icon = getIcon(element.icon);
  const size = Math.min(element.width, element.height);
  const x = element.x + (element.width - size) / 2;
  const y = element.y + (element.height - size) / 2;
  // Stroke is expressed in scene pixels, so differently sized icons keep the same visual weight.
  const weight = (element.strokeWidth ?? 3) * 24 / size;
  return `<g data-icon="${icon.name}" transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round">${icon.paths.map((d) => `<path d="${d}"/>`).join('')}</g>`;
}

export function iconCredits(scene) {
  const icons = sceneIcons(scene);
  if (!icons.length) return '';
  return `Tabler Icons — ${catalog.author}\nSource revision: ${catalog.revision}\n\n${icons.map((i) => `${i.name}: ${i.source}`).join('\n')}\n\n${license}`;
}
