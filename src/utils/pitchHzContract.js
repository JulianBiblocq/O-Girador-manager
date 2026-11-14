/**
 * Contrat acoustique transversal O Girador — Diapason de référence (La4 en Hz).
 * Strictement distinct de `referencePitch: string` ('C4', 'A3') utilisé par Cantador.
 */

export const DEFAULT_REFERENCE_PITCH_HZ = 440;
export const MIN_REFERENCE_PITCH_HZ = 415;
export const MAX_REFERENCE_PITCH_HZ = 466;

/**
 * Normalise une fréquence de diapason La4 sur l'intervalle [415, 466] Hz (repli strict : 440 Hz).
 * @param {unknown} val
 * @returns {number}
 */
export function sanitizePitchHz(val) {
  if (val === undefined || val === null || val === '') return DEFAULT_REFERENCE_PITCH_HZ;
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num) || num < MIN_REFERENCE_PITCH_HZ || num > MAX_REFERENCE_PITCH_HZ) {
    return DEFAULT_REFERENCE_PITCH_HZ;
  }
  return Math.round(num * 100) / 100;
}
