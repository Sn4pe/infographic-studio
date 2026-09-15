import { readFileSync } from 'node:fs';
import { fontPaths, layoutText } from './text.js';
import { paletteFor } from './themes.js';
import { assertScene } from './validate.js';
import { expandScene } from './annotations.js';
import { renderIcon, sceneIcons, iconCredits } from './icons.js';
import { arrowGeometry } from './arrows.js';

export const escapeXml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const n = (value) => Number(value.toFixed(3));

export function wavePath(e) {
  const steps = Math.max(100, Math.ceil(e.cycles * (1 + (e.chirp ?? 0)) * 24));
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const envelope = e.envelope === 'grow' ? 0.12 + t * 0.88 : e.envelope === 'pulse' ? Math.sin(Math.PI * t) ** 2 : 1;
    const phase = 2 * Math.PI * e.cycles * (t + (e.chirp ?? 0) * t * t / 2) + (e.phase ?? 0);
    points.push(`${i ? 'L' : 'M'}${n(e.x + t * e.width)},${n(e.y - Math.sin(phase) * e.amplitude * envelope)}`);
  }
  return points.join(' ');
}

export function composeSvg(scene, assets = {}, { embedFonts = true } = {}) {
  assertScene(scene);
  scene = expandScene(scene);
  const palette = paletteFor(scene);
  const paint = (value, fallback = '$ink') => {
    value ??= fallback;
    return value.startsWith('$') ? palette[value.slice(1)] : value;
  };
  const fontCss = embedFonts ? Object.entries(fontPaths).map(([weight, path]) => `@font-face{font-family:'Source Sans 3';font-weight:${weight === 'semibold' ? 600 : 400};src:url(data:font/ttf;base64,${readFileSync(path).toString('base64')}) format('truetype');}`).join('') : '';
  const text = (e) => {
    const size = e.fontSize ?? 20;
    const layout = layoutText(e.text, e.width, size, e.weight);
    const anchor = e.align === 'center' ? 'middle' : e.align === 'right' ? 'end' : 'start';
    const x = e.x + (e.align === 'center' ? e.width / 2 : e.align === 'right' ? e.width : 0);
    return `<text id="${e.id}" data-label="true" font-family="Source Sans 3" font-size="${size}" font-weight="${e.weight === 'semibold' ? 600 : 400}" fill="${paint(e.fill)}" text-anchor="${anchor}">${layout.lines.map((line, i) => `<tspan x="${x}" y="${n(e.y + size + i * size * 1.3)}">${escapeXml(line)}</tspan>`).join('')}</text>`;
  };
  const primitive = (e) => {
    const style = `fill="${paint(e.fill, 'none')}" stroke="${paint(e.stroke, 'none')}" stroke-width="${e.strokeWidth ?? 2}" stroke-linejoin="round" stroke-linecap="round"${e.dash ? ` stroke-dasharray="${e.dash.join(' ')}"` : ''}`;
    let body;
    switch (e.type) {
      case 'text': body = text(e); break;
      case 'icon': body = renderIcon(e, paint(e.stroke)); break;
      case 'rect': body = `<rect x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" rx="${e.rx ?? 0}" ${style}/>`; break;
      case 'ellipse': body = `<ellipse cx="${e.x}" cy="${e.y}" rx="${e.rx}" ry="${e.ry}" ${style}/>`; break;
      case 'path': body = `<path d="${escapeXml(e.d)}" ${style}/>`; break;
      case 'polygon': body = `<polygon points="${e.points.map((p) => p.join(',')).join(' ')}" ${style}/>`; break;
      case 'line': body = `<line x1="${e.x}" y1="${e.y}" x2="${e.x2}" y2="${e.y2}" ${style}/>`; break;
      case 'wave': body = `<path d="${wavePath(e)}" ${style}/>`; break;
      case 'arrow': {
        const { base: [bx, by], head: [, left, right] } = arrowGeometry(e);
        body = `<line x1="${e.x}" y1="${e.y}" x2="${n(bx)}" y2="${n(by)}" ${style}/><path d="M${e.x2},${e.y2} L${n(left[0])},${n(left[1])} L${n(right[0])},${n(right[1])} Z" fill="${paint(e.stroke)}"/>`;
        break;
      }
      case 'image': {
        const asset = assets[e.asset];
        if (!asset) throw new Error(`Missing resolved asset ${e.asset}.`);
        body = `<image x="${e.x}" y="${e.y}" width="${e.width}" height="${e.height}" preserveAspectRatio="xMidYMid ${e.fit === 'cover' ? 'slice' : 'meet'}" href="${asset.uri}" xlink:href="${asset.uri}"><title>${escapeXml(asset.description)}</title></image>`;
        break;
      }
      default: throw new Error(`Unknown primitive: ${e.type}`);
    }
    return `<g id="art-${e.id}" opacity="${e.opacity ?? 1}"${e.rotation ? ` transform="rotate(${e.rotation} ${e.x ?? 0} ${e.y ?? 0})"` : ''}>${body}</g>`;
  };
  const titleLayout = layoutText(scene.title, scene.width - 104, 42, 'semibold');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-labelledby="scene-title scene-description">
<title id="scene-title">${escapeXml(scene.title)}</title><desc id="scene-description">${escapeXml(scene.description)}</desc>
${sceneIcons(scene).length ? `<metadata id="icon-credits">${escapeXml(iconCredits(scene))}</metadata>` : ''}
<metadata>${escapeXml(JSON.stringify({ version: scene.version, sources: scene.sources ?? [], assets: Object.fromEntries(Object.entries(scene.assets ?? {}).map(([id, a]) => [id, { description: a.description, provenance: a.provenance, license: a.license }])) }))}</metadata>
<defs><style>${fontCss}</style><pattern id="studio-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${palette.line}" stroke-width="0.6" opacity="0.5"/></pattern></defs>
<rect width="100%" height="100%" fill="${palette.background}"/>
${scene.eyebrow ? text({ id: 'figure-eyebrow', text: scene.eyebrow, x: 52, y: 23, width: scene.width - 104, fontSize: 16, fill: '$secondary', weight: 'semibold' }) : ''}
${text({ id: 'figure-title', text: scene.title, x: 52, y: 50, width: scene.width - 104, fontSize: 42, weight: 'semibold' })}
${scene.subtitle ? text({ id: 'figure-subtitle', text: scene.subtitle, x: 52, y: 50 + titleLayout.height + 8, width: scene.width - 104, fontSize: 20, fill: '$muted' }) : ''}
${scene.panels.map((p) => `<g id="panel-${p.id}" transform="translate(${p.x} ${p.y})">${p.framed === false ? '' : `<rect width="${p.width}" height="${p.height}" fill="${palette.panel}" stroke="${palette.line}"/>`}${p.grid ? `<rect width="${p.width}" height="${p.height}" fill="url(#studio-grid)"/>` : ''}
${p.kicker ? text({ id: `${p.id}-kicker`, text: p.kicker, x: 24, y: 14, width: p.width - 48, fontSize: 16, weight: 'semibold', fill: '$secondary' }) : ''}
${p.title ? text({ id: `${p.id}-title`, text: p.title, x: 24, y: 36, width: p.width - 48, fontSize: 25, weight: 'semibold' }) : ''}
${p.elements.map(primitive).join('\n')}</g>`).join('\n')}
${scene.footer ? text({ id: 'figure-footer', text: scene.footer, x: 52, y: scene.height - 44, width: scene.width - 104, fontSize: 16, fill: '$muted' }) : ''}
</svg>`;
}
