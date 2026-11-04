/**
 * Utilitaires d'attribution automatique et catalogue des tampons vectoriels Cordel
 * pour les événements de l'Agenda (style Sequenciador / Xylogravure).
 */

export const EVENT_STAMP_OPTIONS = [
  { id: 'auto', label: '✨ Auto (Recommandé)' },
  { id: 'apito', label: 'Apito' },
  { id: 'alfaia', label: 'Alfaia' },
  { id: 'caixa', label: 'Caixa' },
  { id: 'gongue', label: 'Gonguê' },
  { id: 'agbe', label: 'Agbê' },
  { id: 'danse', label: 'Danse' },
  { id: 'prestation', label: 'Prestation' },
  { id: 'stage', label: 'Stage' },
  { id: 'reunion', label: 'Réunion' },
  { id: 'lutherie', label: 'Atelier/Lutherie' }
];

/**
 * Normalise une chaîne (sans accents, en minuscules) pour la détection de mots-clés.
 */
function normalizeText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Détecte un instrument ou pupitre unique ciblé par les quotas, le sondage ou le titre de l'événement.
 */
export function detectTargetedInstrumentStamp(event) {
  if (!event) return null;

  // 1. Vérifier si la discipline est exclusivement Danse (sans Percussion)
  if (event.includesDance === true && event.includesPercussion === false) {
    return 'danse';
  }

  // 2. Collecter les pupitres actifs dans quotasPupitres ou pollTargetPupitres
  const candidateTargets = [];
  if (Array.isArray(event.pollTargetPupitres) && event.pollTargetPupitres.length === 1) {
    candidateTargets.push(event.pollTargetPupitres[0]);
  }
  if (event.pollTarget) {
    candidateTargets.push(event.pollTarget);
  }
  if (event.quotasPupitres && typeof event.quotasPupitres === 'object') {
    const activeQuotaKeys = Object.entries(event.quotasPupitres)
      .filter(([, val]) => {
        if (typeof val === 'number') return val > 0;
        if (val && typeof val === 'object') return val.enabled !== false && Number(val.max || val.quota || 1) > 0;
        return Boolean(val);
      })
      .map(([k]) => k);
    if (activeQuotaKeys.length === 1) {
      candidateTargets.push(activeQuotaKeys[0]);
    }
  }

  const combinedText = normalizeText([
    ...candidateTargets,
    event.titre,
    event.title,
    event.sousTitre
  ].filter(Boolean).join(' '));

  if (/\b(alfaia|alfaias|marcacao|virado)\b/.test(combinedText)) return 'alfaia';
  if (/\b(caixa|caixas|tarol|malacacheta)\b/.test(combinedText)) return 'caixa';
  if (/\b(gongue|gongues|agogo)\b/.test(combinedText)) return 'gongue';
  if (/\b(agbe|agbes|xequere|shekere|semente|sementes|mineiro|ganza)\b/.test(combinedText)) return 'agbe';
  if (/\b(danse|danca|chore|choregraphie|danseur|danseuse)\b/.test(combinedText) && event.includesPercussion === false) {
    return 'danse';
  }
  if (/\b(danse|danca|chore|choregraphie)\b/.test( normalizeText(candidateTargets.join(' ')) )) {
    return 'danse';
  }
  return null;
}

/**
 * Détermine la clé du tampon SVG à afficher pour un événement donné.
 * Respecte le choix manuel (`event.stampIcon`) ou applique la règle d'attribution automatique.
 */
export function resolveEventStampKey(event) {
  if (!event) return 'apito';

  const manualStamp = (event.stampIcon || '').trim().toLowerCase();
  if (manualStamp && manualStamp !== 'auto' && EVENT_STAMP_OPTIONS.some((o) => o.id === manualStamp)) {
    return manualStamp;
  }

  const type = normalizeText(event.type || 'repetition');
  const titleNorm = normalizeText(`${event.titre || ''} ${event.title || ''} ${event.description || ''}`);
  const targetedInstrument = detectTargetedInstrumentStamp(event);

  if (type === 'repetition') {
    if (event.includesDance === true && event.includesPercussion === false) return 'danse';
    if (targetedInstrument === 'danse') return 'danse';
    return 'apito';
  }

  if (type === 'atelier') {
    if (
      event.specialiteAtelier === 'fabrication' ||
      event.specialiteAtelier === 'couture' ||
      /\b(lutherie|fabrication|couture|costume|mailloche|peau|encordage|reparation|bricolage)\b/.test(titleNorm)
    ) {
      return 'lutherie';
    }
    if (targetedInstrument) return targetedInstrument;
    if (/\b(danse|danca)\b/.test(titleNorm)) return 'danse';
    return 'lutherie';
  }

  if (type === 'prestation' || type === 'concert' || type === 'spectacle' || type === 'festival') {
    return 'prestation';
  }

  if (type === 'stage') {
    if (targetedInstrument) return targetedInstrument;
    return 'stage';
  }

  if (type === 'reunion' || type === 'ag') {
    return 'reunion';
  }

  return targetedInstrument || 'apito';
}

