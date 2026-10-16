/**
 * vocalAmbitusUtils.js
 * Utilitaires mathématiques et sémantiques pour les Ambitus et la Synthèse Vocale Mestre (< 130 lignes).
 */

const NOTE_NAME_MAP = {
  do: 0, c: 0, 'do#': 1, 'c#': 1, ré: 2, re: 2, d: 2, 'ré#': 3, 're#': 3, 'd#': 3,
  mi: 4, e: 4, fa: 5, f: 5, 'fa#': 6, 'f#': 6, sol: 7, g: 7, 'sol#': 8, 'g#': 8,
  la: 9, a: 9, 'la#': 10, 'a#': 10, si: 11, b: 11
};
const LATIN_NAMES = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

export const KEYBOARD_MIN_MIDI = 40; // Mi2
export const KEYBOARD_MAX_MIDI = 72; // Do5
export const KEYBOARD_TICKS = [40, 45, 48, 55, 60, 64, 72]; // Mi2, La2, Do3, Sol3, Do4, Mi4, Do5

export function noteNameToMidi(noteStr) {
  if (!noteStr || noteStr === '───') return -1;
  const match = String(noteStr).trim().match(/^(do|ré|re|mi|fa|sol|la|si|[a-g])(#|b|♯|♭)?(-?\d+)$/i);
  if (!match) return -1;
  const baseKey = match[1].toLowerCase();
  const baseSemitone = NOTE_NAME_MAP[baseKey] ?? 0;
  const alt = match[2];
  const altOffset = (alt === '#' || alt === '♯') ? 1 : (alt === 'b' || alt === '♭') ? -1 : 0;
  const octave = parseInt(match[3], 10);
  return (octave + 1) * 12 + baseSemitone + altOffset;
}

export function midiToLatinNote(midi) {
  const rounded = Math.round(midi);
  if (rounded < 0 || rounded > 127) return '—';
  const octave = Math.floor(rounded / 12) - 1;
  const name = LATIN_NAMES[((rounded % 12) + 12) % 12];
  return `${name}${octave}`;
}

export function determineTessiture(centerMidi) {
  if (centerMidi <= 46) return 'basse';
  if (centerMidi <= 52) return 'baryton';
  if (centerMidi <= 57) return 'tenor';
  if (centerMidi <= 62) return 'alto';
  if (centerMidi <= 67) return 'mezzo-soprano';
  return 'soprano';
}

export function resolveMemberVocalWish(member) {
  if (!member) return null;
  const vp = member.vocalProfile?.vocalProfile || member.vocalProfile;
  const direct = vp?.targetRole || vp?.wish || member.souhaitVocal || member.voeuChant;
  if (direct && typeof direct === 'string') {
    const d = direct.toLowerCase();
    if (d.includes('puxador') || d.includes('soliste')) return 'Puxador';
    if (d.includes('coro') || d.includes('choeur') || d.includes('chœur')) return 'Coro';
  }
  const pool = [
    member.voeuPrincipal, member.voeuSecondaire, member.voeuTertiaire,
    ...(Array.isArray(member.voeuxInstruments) ? member.voeuxInstruments : []),
    member.instrument, member.instrumentPrincipal, member.instrumentSecondaire,
    ...(Array.isArray(member.tags) ? member.tags : [])
  ].filter(Boolean).map(s => String(s).toLowerCase());

  if (pool.some(s => s.includes('puxador') || s.includes('soliste'))) return 'Puxador';
  if (pool.some(s => s.includes('coro') || s.includes('choeur') || s.includes('chœur'))) return 'Coro';
  if (pool.some(s => s.includes('chant') || s.includes('toada'))) return 'Chant';
  return null;
}

export function getMemberVocalProfile(member) {
  if (!member) return null;
  const vp = member.vocalProfile?.vocalProfile || member.vocalProfile;
  if (!vp || !vp.lowestSolidNote || !vp.highestSolidNote) return null;
  const lowestMidi = noteNameToMidi(vp.lowestSolidNote);
  const highestMidi = noteNameToMidi(vp.highestSolidNote);
  if (lowestMidi <= 0 || highestMidi <= 0 || lowestMidi > highestMidi) return null;
  const centerMidi = vp.comfortCenterNote ? noteNameToMidi(vp.comfortCenterNote) : Math.round((lowestMidi + highestMidi) / 2);
  return {
    lowestSolidNote: midiToLatinNote(lowestMidi),
    highestSolidNote: midiToLatinNote(highestMidi),
    comfortCenterNote: midiToLatinNote(centerMidi),
    lowestMidi, highestMidi, centerMidi,
    rangeSemitones: vp.rangeSemitones || (highestMidi - lowestMidi),
    tessiture: vp.tessiture || determineTessiture(centerMidi),
    stairsAccuracyPct: vp.stairsAccuracyPct ?? vp.accuracyPct ?? null,
    targetRole: resolveMemberVocalWish(member)
  };
}

export function computeChoirOverlap(membersWithVocal) {
  if (!membersWithVocal || membersWithVocal.length === 0) return null;
  const profiles = membersWithVocal.map(m => m.vocalData).filter(Boolean);
  if (profiles.length === 0) return null;

  const minMidi = Math.min(...profiles.map(p => p.lowestMidi));
  const maxMidi = Math.max(...profiles.map(p => p.highestMidi));
  const countPerMidi = {};
  for (let m = minMidi; m <= maxMidi; m++) countPerMidi[m] = 0;
  profiles.forEach(p => {
    for (let m = p.lowestMidi; m <= p.highestMidi; m++) countPerMidi[m] += 1;
  });

  const N = profiles.length;
  const maxOverlapCount = Math.max(...Object.values(countPerMidi));
  const threshold = Math.max(Math.ceil(N * 0.8), Math.min(N, maxOverlapCount));
  const overlapMidis = Object.keys(countPerMidi).map(Number).filter(m => countPerMidi[m] >= threshold).sort((a, b) => a - b);

  const startMidi = overlapMidis.length > 0 ? overlapMidis[0] : Math.round((minMidi + maxMidi) / 2);
  const endMidi = overlapMidis.length > 0 ? overlapMidis[overlapMidis.length - 1] : startMidi;
  const centerMidi = Math.round((startMidi + endMidi) / 2);

  return {
    startNote: midiToLatinNote(startMidi), endNote: midiToLatinNote(endMidi),
    startMidi, endMidi, rangeSemitones: Math.max(0, endMidi - startMidi),
    centerNote: midiToLatinNote(centerMidi), centerMidi,
    coveragePct: Math.round((countPerMidi[startMidi] / N) * 100),
    evaluatedCount: N
  };
}

export function computeTessitureBreakdown(membersWithVocal) {
  let graves = 0, mediums = 0, aigues = 0;
  (membersWithVocal || []).forEach(m => {
    const vd = m.vocalData;
    if (!vd) return;
    const t = (vd.tessiture || '').toLowerCase();
    const c = vd.centerMidi || 60;
    if (t === 'basse' || t === 'baryton' || c <= 52) graves++;
    else if (t === 'tenor' || t === 'alto' || c <= 62) mediums++;
    else aigues++;
  });
  return { graves, mediums, aigues, total: membersWithVocal ? membersWithVocal.length : 0 };
}
