/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * O-Girador - Utilitaire de formatage et d'export de tablature textuelle
 * Convertit la structure de données d'un Preset ou d'un Motif en tablature monospace
 * parfaitement alignée (BPM, signatures rythmiques, barres de reprise, pistes d'instruments).
 */

/**
 * Catalogue standard des instruments du Maracatu et de l'écosystème O Girador.
 * Utilisé pour identifier la typologie des pistes et exclure l'Apito et les Voix des tablatures instrumentales.
 */
export const INSTRUMENTS_CATALOG = [
  { id: 'marcante', name: 'Marcante', type: 'hands' },
  { id: 'meiao', name: 'Meião', type: 'hands' },
  { id: 'repique', name: 'Repique', type: 'hands' },
  { id: 'caixa', name: 'Caixa', type: 'hands' },
  { id: 'tarol', name: 'Tarol', type: 'hands' },
  { id: 'gongue', name: 'Gonguê', type: 'gongue' },
  { id: 'agbe', name: 'Agbê', type: 'shake' },
  { id: 'mineiro', name: 'Mineiro', type: 'shake' },
  { id: 'timbal', name: 'Timbal', type: 'hands' },
  { id: 'apito', name: 'Apito', type: 'hands' },
  { id: 'puxador', name: 'Puxador', type: 'voice' },
  { id: 'coro', name: 'Coro', type: 'voice' },
  { id: 'toada', name: 'Toada', type: 'voice' }
];

/**
 * Détermine le libellé d'un instrument pour l'affichage de la tablature.
 * 
 * @param {Object} track - Groupe de piste
 * @param {boolean} isFirstBlock - Vrai s'il s'agit du tout premier bloc de la partition
 * @returns {string} Nom complet ou abrégé
 */
const getInstrumentLabel = (track, isFirstBlock) => {
  const conf = (track?.instrumentIdx !== undefined && INSTRUMENTS_CATALOG[track.instrumentIdx])
    ? INSTRUMENTS_CATALOG[track.instrumentIdx]
    : INSTRUMENTS_CATALOG.find((c) => c.id === track?.instrumentId);

  const customLabel = track?.customName || conf?.name || (track?.id ? `Piste ${track.id}` : 'Instrument');

  if (isFirstBlock) {
    return customLabel;
  }
  // Pour les blocs suivants, abréviation si le nom dépasse 4 caractères
  if (customLabel.length <= 4) return customLabel;
  return customLabel.substring(0, 3);
};

/**
 * Génère le corps principal de la tablature textuelle (grille de mesures et de frappes).
 * 
 * @param {Array} tracks - Tableau des pistes (TrackGroup)
 * @param {number} totalMeasures - Nombre total de mesures
 * @param {Array} [songSections] - Sections musicales du morceau
 * @param {Object|Array} [measureTimeSigs] - Signatures rythmiques par mesure
 * @param {Object|Array} [measureBpms] - Tempos (BPM) par mesure
 * @returns {string} Chaîne de caractères monospace formatée
 */
export const generateTablatureCore = (
  tracks = [],
  totalMeasures = 0,
  songSections = [],
  measureTimeSigs = {},
  measureBpms = {}
) => {
  if (!Array.isArray(tracks) || tracks.length === 0 || totalMeasures <= 0) {
    return '';
  }

  let output = '';
  let hasAnyTrackData = false;

  // Filtrer les pistes d'Apito et de voix (chant/toada/puxador/coro)
  const filteredTracks = tracks.filter((t) => {
    const conf = (t.instrumentIdx !== undefined && INSTRUMENTS_CATALOG[t.instrumentIdx])
      ? INSTRUMENTS_CATALOG[t.instrumentIdx]
      : INSTRUMENTS_CATALOG.find((c) => c.id === t.instrumentId);

    const isVoice = conf?.type === 'voice' || ['puxador', 'coro', 'toada'].includes(conf?.id) || ['puxador', 'coro', 'toada'].includes(t.instrumentId);
    const isApito = conf?.id === 'apito' || t.instrumentId === 'apito';
    return !isVoice && !isApito;
  });

  if (filteredTracks.length === 0) {
    return '';
  }

  let currentChunk = [];

  const flushChunk = () => {
    if (currentChunk.length === 0) return;

    const startM = currentChunk[0];
    const endM = currentChunk[currentChunk.length - 1];
    const sectionStart = (songSections || []).find((s) => s.startMeasure === startM);

    const leftBar = '| ';
    const rightBar = ' |';

    let header = '';
    if (sectionStart && sectionStart.name) {
      header = `[ ${sectionStart.name} ]`;
    } else if (currentChunk.length === 1) {
      header = `--- Mesure ${startM + 1} ---`;
    } else {
      header = `--- Mesures ${startM + 1} à ${endM + 1} ---`;
    }

    let chunkOutput = header + '\n';

    const isFirstBlock = startM === 0;
    const initialSig = measureTimeSigs?.[startM] || '4/4';
    const prefixLen = 15 + 1 + 4 + 1; // inst(15) + espace(1) + sig(4) + espace(1) = 21

    // Génération de la ligne d'indication des BPM
    let bpmLine = ''.padStart(prefixLen + leftBar.length, ' ');
    currentChunk.forEach((m, idx) => {
      const prevBpm = m === 0 ? null : (measureBpms?.[m - 1] || 120);
      const currBpm = measureBpms?.[m] || 120;

      let bpmStr = '';
      if (m === 0 || currBpm !== prevBpm) {
        if (prevBpm !== null && currBpm > prevBpm) {
          bpmStr = `${currBpm}BPM ↑`;
        } else if (prevBpm !== null && currBpm < prevBpm) {
          bpmStr = `${currBpm}BPM ↓`;
        } else {
          bpmStr = `${currBpm}BPM`;
        }
      }

      bpmLine += bpmStr.padEnd(31, ' ');

      if (idx < currentChunk.length - 1) {
        const nextMeasure = currentChunk[idx + 1];
        const currSig = measureTimeSigs?.[m] || '4/4';
        const nextSig = measureTimeSigs?.[nextMeasure] || '4/4';
        if (currSig !== nextSig) {
          bpmLine += ' '.repeat(` | ${nextSig} | `.length);
        } else {
          bpmLine += '   '; // Espacement correspondant à " | "
        }
      }
    });

    const hasBpm = bpmLine.trim().length > 0;
    if (hasBpm) {
      chunkOutput += bpmLine + '\n';
    }

    let chunkHasTrackData = false;

    // Parcours de chaque instrument actif
    filteredTracks.forEach((track) => {
      let trackStr = '';
      let hasDataInChunk = false;

      currentChunk.forEach((m, idx) => {
        // Recherche du motif assigné à cette mesure
        const activePattern = (track.patterns || []).find((p) => {
          if (!p || !p.measureAssignments) return false;
          return Boolean(p.measureAssignments[m]);
        });

        if (activePattern && activePattern.activeSteps) {
          hasDataInChunk = true;
          chunkHasTrackData = true;
          hasAnyTrackData = true;
          const stepCount = activePattern.steps || activePattern.activeSteps.length || 16;
          let measureChars = '';

          for (let s = 0; s < stepCount; s++) {
            const val = activePattern.activeSteps[s];
            const rawChar = Array.isArray(val) ? val[0] : val;
            const char = (rawChar === 0 || rawChar === '0' || rawChar === '' || rawChar === undefined || rawChar === null)
              ? '-'
              : String(rawChar);

            measureChars += char;
            if (s < stepCount - 1) {
              measureChars += ' ';
            }
          }

          const visualLen = measureChars.length;
          const padLen = Math.max(0, 31 - visualLen);
          trackStr += measureChars + ' '.repeat(padLen);
        } else {
          // Mesure vide pour cette piste
          trackStr += ''.padEnd(31, ' ');
        }

        // Séparateur entre mesures dans le bloc
        if (idx < currentChunk.length - 1) {
          const nextMeasure = currentChunk[idx + 1];
          const currSig = measureTimeSigs?.[m] || '4/4';
          const nextSig = measureTimeSigs?.[nextMeasure] || '4/4';
          if (currSig !== nextSig) {
            trackStr += ` | ${nextSig} | `;
          } else {
            trackStr += ' | ';
          }
        }
      });

      if (hasDataInChunk) {
        const instLabel = getInstrumentLabel(track, isFirstBlock);
        const safeInstLabel = instLabel.substring(0, 15).padEnd(15, ' ');
        const safeSig = String(initialSig).padStart(4, ' ');
        const prefix = `${safeInstLabel} ${safeSig} `;
        chunkOutput += `${prefix}${leftBar}${trackStr}${rightBar}\n`;
      }
    });

    if (chunkHasTrackData) {
      chunkOutput += '\n';
      output += chunkOutput;
    }
    currentChunk = [];
  };

  // Découpage en blocs de 2 mesures ou aux frontières des sections
  for (let m = 0; m < totalMeasures; m++) {
    const sectionStart = (songSections || []).find((s) => s.startMeasure === m);
    if (currentChunk.length > 0 && (currentChunk.length === 2 || sectionStart)) {
      flushChunk();
    }
    currentChunk.push(m);
    const sectionEnd = (songSections || []).find((s) => s.endMeasure === m);
    if (sectionEnd) {
      flushChunk();
    }
  }
  flushChunk();

  return hasAnyTrackData ? output : '';
};

/**
 * Génère l'annexe textuelle des variations pour les motifs disposant de variations.
 * 
 * @param {Array} tracks - Tableau des pistes
 * @returns {string} Annexe formatée ou chaîne vide
 */
export const generateAnnexTablature = (tracks = []) => {
  if (!Array.isArray(tracks) || tracks.length === 0) return '';

  let annexOutput = '';
  let hasAnyVariation = false;

  tracks.forEach((track) => {
    const patternsWithVars = (track.patterns || []).filter(
      (p) => Array.isArray(p.variations) && p.variations.length > 0
    );

    if (patternsWithVars.length === 0) return;

    if (!hasAnyVariation) {
      annexOutput += '\n========================================\n';
      annexOutput += 'ANNEXE : LEXIQUE DES VARIATIONS\n';
      annexOutput += '========================================\n\n';
      hasAnyVariation = true;
    }

    const instLabel = getInstrumentLabel(track, true);
    annexOutput += `[ ${instLabel} ]\n`;

    patternsWithVars.forEach((p) => {
      const patName = p.name || `Pattern ${p.id || ''}`;
      annexOutput += `  ${patName}\n`;

      const formatSteps = (steps = [], maxSteps = 16) => {
        let res = '';
        for (let s = 0; s < maxSteps; s++) {
          const val = steps[s];
          const rawChar = Array.isArray(val) ? val[0] : val;
          const char = (rawChar === 0 || rawChar === '0' || rawChar === '' || rawChar === undefined || rawChar === null)
            ? '-'
            : String(rawChar);
          res += char;
          if (s < maxSteps - 1) res += ' ';
        }
        return res;
      };

      const stepCount = p.steps || (p.activeSteps ? p.activeSteps.length : 16);
      const baseLabel = '[Base]'.padEnd(35, ' ');
      annexOutput += `    ${baseLabel} | ${formatSteps(p.activeSteps, stepCount)}\n`;

      p.variations.forEach((v) => {
        const desc = v.playFirstTimeOnly
          ? `${v.name || 'Variation'} - (Levée / 1ère fois uniquement)`
          : `${v.name || 'Variation'} - ${v.probability ?? 100}%`;
        const varLabel = `[${desc}]`.padEnd(35, ' ');
        annexOutput += `    ${varLabel} | ${formatSteps(v.steps, stepCount)}\n`;
      });

      annexOutput += '\n';
    });
  });

  return annexOutput;
};

/**
 * Fonction maîtresse : formate l'objet décompressé d'un morceau en tablature textuelle complète.
 * Blindée avec repli sécurisé sur chaîne vide en cas de structure anormale ou manquante.
 * 
 * @param {Object} parsedData - Données décompressées du Preset ou de la ressource Séquenceur
 * @returns {string} Tablature monospace alignée prête pour affichage ou impression
 */
export function formatPieceTablature(parsedData) {
  if (!parsedData || typeof parsedData !== 'object') {
    return '';
  }

  try {
    // 1. Cas d'un Preset complet (présence d'un tableau tracks)
    if (Array.isArray(parsedData.tracks) && parsedData.tracks.length > 0) {
      const tracks = parsedData.tracks;

      // Calcul dynamique du nombre total de mesures
      let totalMeasures = Number(parsedData.totalMeasures) || 0;
      if (!totalMeasures) {
        tracks.forEach((t) => {
          (t.patterns || []).forEach((p) => {
            if (p.measureAssignments) {
              const assignedIndices = Object.keys(p.measureAssignments)
                .filter((k) => p.measureAssignments[k])
                .map(Number)
                .filter((n) => !isNaN(n));
              if (assignedIndices.length > 0) {
                totalMeasures = Math.max(totalMeasures, Math.max(...assignedIndices) + 1);
              }
            }
          });
        });
      }

      if (!totalMeasures && Array.isArray(parsedData.songSections) && parsedData.songSections.length > 0) {
        parsedData.songSections.forEach((s) => {
          if (typeof s.endMeasure === 'number') {
            totalMeasures = Math.max(totalMeasures, s.endMeasure + 1);
          }
        });
      }

      // Valeur par défaut minimale si aucune assignation trouvée
      if (!totalMeasures) totalMeasures = 2;

      const songSections = Array.isArray(parsedData.songSections) ? parsedData.songSections : [];
      const measureTimeSigs = parsedData.measureTimeSigs || {};
      const measureBpms = parsedData.measureBpms || {};

      // Construction de l'en-tête de la partition
      const title = parsedData.metadata?.toada?.trim() || parsedData.titre || parsedData.name || 'Morceau';
      let result = `TITRE : ${title.toUpperCase()}\n`;

      if (parsedData.metadata?.compositor?.trim()) {
        result += `COMPOSITEUR : ${parsedData.metadata.compositor.trim()}\n`;
      }
      if (parsedData.metadata?.ritmo?.trim()) {
        result += `RYTHME : ${parsedData.metadata.ritmo.trim()}\n`;
      }

      const defaultBpm = parsedData.bpm || 120;
      const defaultSig = parsedData.timeSig || '4/4';
      result += `TEMPO DE BASE : ${defaultBpm} BPM | SIGNATURE : ${defaultSig}\n\n`;

      // Cœur de la tablature
      const coreTab = generateTablatureCore(tracks, totalMeasures, songSections, measureTimeSigs, measureBpms);
      if (!coreTab || !coreTab.trim()) {
        return '';
      }

      result += coreTab;

      // Annexe des variations si existantes
      const annex = generateAnnexTablature(tracks);
      if (annex) {
        result += annex;
      }

      // Paroles / Letras si présentes
      if (parsedData.letras && typeof parsedData.letras === 'string' && parsedData.letras.trim()) {
        result += `\n--- PAROLES / LETRAS ---\n${parsedData.letras.trim()}\n`;
      }

      result += `\n(Généré avec O Girador)\n`;
      return result;
    }

    // 2. Repli résilient pour un Motif individuel (Pattern)
    if (Array.isArray(parsedData.activeSteps) && parsedData.activeSteps.length > 0) {
      const patTitle = parsedData.name || parsedData.titre || 'Motif individuel';
      const stepCount = parsedData.steps || parsedData.activeSteps.length;
      let patternChars = '';

      for (let s = 0; s < stepCount; s++) {
        const val = parsedData.activeSteps[s];
        const rawChar = Array.isArray(val) ? val[0] : val;
        const char = (rawChar === 0 || rawChar === '0' || rawChar === '' || rawChar === undefined || rawChar === null)
          ? '-'
          : String(rawChar);
        patternChars += char;
        if (s < stepCount - 1) patternChars += ' ';
      }

      return `TITRE : ${patTitle.toUpperCase()}\n\n[ Motif ]\n| ${patternChars} |\n\n(Généré avec O Girador)\n`;
    }

    return '';
  } catch (err) {
    console.warn("formatPieceTablature - Erreur lors de la génération de la tablature :", err);
    return '';
  }
}
