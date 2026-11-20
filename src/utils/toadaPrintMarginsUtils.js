// Modèle, normalisation et génération CSS @page des marges et reliures d'impression Toada (< 100 lignes).

export const VALID_MARGIN_PRESETS = ['narrow', 'normal', 'wide', 'custom'];
export const VALID_BINDING_SIDES = ['left', 'alternating'];
export const GUTTER_PRESET_VALUES = [0, 8, 15];

export const MARGIN_PRESET_DIMENSIONS = {
  narrow: { top: 6, right: 6, bottom: 6, left: 6 },
  normal: { top: 12, right: 12, bottom: 12, left: 12 },
  wide: { top: 18, right: 18, bottom: 18, left: 18 }
};

export const DEFAULT_PRINT_MARGINS = {
  preset: 'normal',
  top: 12,
  right: 12,
  bottom: 12,
  left: 12,
  gutterMm: 0,
  bindingSide: 'left'
};

export function clampMarginMm(value, min = 0, max = 35, fallback = 12) {
  if (value === '' || value === null || value === undefined || typeof value === 'boolean') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const bounded = Math.min(max, Math.max(min, num));
  return Math.round(bounded * 10) / 10;
}

export function normalizePrintMargins(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PRINT_MARGINS };
  const preset = VALID_MARGIN_PRESETS.includes(raw.preset) ? raw.preset : 'normal';
  const presetDims = MARGIN_PRESET_DIMENSIONS[preset];
  const customSrc = raw.custom && typeof raw.custom === 'object' ? raw.custom : raw;
  const dims = presetDims
    ? { ...presetDims }
    : {
        top: clampMarginMm(customSrc.top ?? raw.top, 0, 35, DEFAULT_PRINT_MARGINS.top),
        right: clampMarginMm(customSrc.right ?? raw.right, 0, 35, DEFAULT_PRINT_MARGINS.right),
        bottom: clampMarginMm(customSrc.bottom ?? raw.bottom, 0, 35, DEFAULT_PRINT_MARGINS.bottom),
        left: clampMarginMm(customSrc.left ?? raw.left, 0, 35, DEFAULT_PRINT_MARGINS.left)
      };

  return {
    preset,
    ...dims,
    gutterMm: clampMarginMm(raw.gutterMm, 0, 25, 0),
    bindingSide: VALID_BINDING_SIDES.includes(raw.bindingSide) ? raw.bindingSide : 'left'
  };
}

export function arePrintMarginsEqual(a, b) {
  const na = normalizePrintMargins(a);
  const nb = normalizePrintMargins(b);
  return (
    na.preset === nb.preset &&
    na.top === nb.top &&
    na.right === nb.right &&
    na.bottom === nb.bottom &&
    na.left === nb.left &&
    na.gutterMm === nb.gutterMm &&
    na.bindingSide === nb.bindingSide
  );
}

export function buildToadaPrintPageCss({ format = 'A4', margins } = {}) {
  const safeFormat = ['A5', 'A4', 'A3'].includes(format) ? format : 'A4';
  const { top, right, bottom, left, gutterMm, bindingSide } = normalizePrintMargins(margins);
  const fmtMm = (val) => `${Math.round(val * 10) / 10}mm`;

  if (gutterMm > 0 && bindingSide === 'alternating') {
    return [
      `@page { size: ${safeFormat} portrait; margin: ${fmtMm(top)} ${fmtMm(right)} ${fmtMm(bottom)} ${fmtMm(left)}; }`,
      `@page :right { margin-left: ${fmtMm(left + gutterMm)}; margin-right: ${fmtMm(right)}; }`,
      `@page :left { margin-left: ${fmtMm(left)}; margin-right: ${fmtMm(right + gutterMm)}; }`
    ].join('\n');
  }

  return `@page { size: ${safeFormat} portrait; margin: ${fmtMm(top)} ${fmtMm(right)} ${fmtMm(bottom)} ${fmtMm(left + gutterMm)}; }`;
}
