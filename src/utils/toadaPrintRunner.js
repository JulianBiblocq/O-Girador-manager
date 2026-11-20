// Lanceur d'impression navigateur isolé pour fiche Toada et Carnet de chants (< 75 lignes).
import { buildToadaPrintPageCss, normalizePrintMargins } from './toadaPrintMarginsUtils.js';

export function executeToadaWindowPrint({ format = 'A4', bwMode = false, margins = null, onDone }) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (onDone) onDone();
    return;
  }

  const safeFormat = ['A5', 'A4', 'A3'].includes(format) ? format : 'A4';
  const normMargins = normalizePrintMargins(margins);
  if (bwMode) document.body.classList.add('print-bw');
  document.body.classList.add(`print-format-${safeFormat}`);
  document.body.classList.add('printing-song');
  document.body.style.setProperty('--toada-print-v-margin', `${normMargins.top + normMargins.bottom}mm`);

  const styleId = 'dynamic-print-style';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.media = 'print';
  styleEl.textContent = buildToadaPrintPageCss({ format: safeFormat, margins: normMargins });

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.removeEventListener('afterprint', cleanup);
    document.body.classList.remove('print-bw', 'print-format-A5', 'print-format-A4', 'print-format-A3', 'printing-song');
    document.body.style.removeProperty('--toada-print-v-margin');
    if (styleEl) styleEl.textContent = '';
    if (onDone) onDone();
  };

  window.addEventListener('afterprint', cleanup, { once: true });

  setTimeout(() => {
    const portalImages = Array.from(document.querySelectorAll('.toada-print-portal img'));
    const pending = portalImages.filter((img) => !img.complete);
    const launch = () => {
      window.print();
      setTimeout(cleanup, 300);
    };
    if (pending.length === 0) {
      launch();
      return;
    }
    let settled = false;
    const doneOne = () => {
      if (settled) return;
      if (pending.every((img) => img.complete)) { settled = true; launch(); }
    };
    pending.forEach((img) => {
      img.addEventListener('load', doneOne, { once: true });
      img.addEventListener('error', doneOne, { once: true });
    });
    setTimeout(() => { if (!settled) { settled = true; launch(); } }, 350);
  }, 160);
}
