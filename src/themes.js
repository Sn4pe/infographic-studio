export const themes = {
  blueprint: { background: '#0d2637', panel: '#112e40', ink: '#f2ebd6', muted: '#b0c5ca', line: '#355364', accent: '#ef7967', secondary: '#64bbd2', warm: '#dfc591' },
  paper: { background: '#f6f2e9', panel: '#fffcf5', ink: '#223c45', muted: '#516970', line: '#d3d7cf', accent: '#aa3f32', secondary: '#147389', warm: '#9b7137' },
  midnight: { background: '#181c27', panel: '#202635', ink: '#f4f0e7', muted: '#b3bbcf', line: '#40485c', accent: '#e9937d', secondary: '#93b8f0', warm: '#dfc78e' },
};

export function paletteFor(scene) {
  return { ...themes[scene.theme ?? 'blueprint'], ...scene.palette };
}

export function contrast(a, b) {
  const luminance = (color) => {
    const c = color.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255)
      .map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  };
  const [l, h] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (h + 0.05) / (l + 0.05);
}
