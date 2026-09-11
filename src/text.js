import { openSync } from 'fontkit';
import { fileURLToPath } from 'node:url';

export const fontPaths = {
  regular: fileURLToPath(new URL('../assets/fonts/SourceSans3-Regular.ttf', import.meta.url)),
  semibold: fileURLToPath(new URL('../assets/fonts/SourceSans3-Semibold.ttf', import.meta.url)),
};
const fonts = {};
export const getFont = (weight = 'regular') => fonts[weight] ??= openSync(fontPaths[weight]);
export const measure = (text, size, weight = 'regular') => {
  const font = getFont(weight);
  return font.layout(text).positions.reduce((sum, p) => sum + p.xAdvance, 0) / font.unitsPerEm * size;
};

// One source of truth for layout, SVG and QA. Explicit newlines are preserved.
export function layoutText(text, width, size = 20, weight = 'regular') {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && measure(`${line} ${word}`, size, weight) > width) {
        lines.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    lines.push(line);
  }
  return { lines, widths: lines.map((line) => measure(line, size, weight)), height: lines.length * size * 1.3 };
}

export function missingGlyphs(text, weight = 'regular') {
  const font = getFont(weight);
  return [...new Set([...text].filter((char) => !/\s/.test(char) && !font.hasGlyphForCodePoint(char.codePointAt(0))))];
}
