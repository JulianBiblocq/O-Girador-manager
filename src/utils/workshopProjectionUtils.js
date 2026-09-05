/**
 * Utilitaires de projection dynamique des modèles d'atelier et de lutherie vers le Varal Cordel.
 *
 * Règle d'or : Projection 100% en mémoire côté client, aucune duplication ni écriture
 * dans la collection Firestore 'documents'.
 */

/**
 * Détermine si un document est un livret virtuel projeté depuis l'atelier Lutherie.
 *
 * @param {Object} docItem - Le document à tester
 * @returns {boolean} Vrai si le document est une projection virtuelle d'atelier
 */
export function isWorkshopVirtualDoc(docItem) {
  if (!docItem) return false;
  return Boolean(
    docItem.isVirtualAtelier ||
    docItem.isWorkshopVirtual ||
    (typeof docItem.id === 'string' && (docItem.id.startsWith('model_') || docItem.id.startsWith('part_')))
  );
}

/**
 * Normalise les étapes d'usinage / fabrication d'une pièce.
 * Supporte part.chapitres, part.steps et part.etapesFabrication.
 *
 * @param {Object} part - La pièce du modèle d'instrument
 * @returns {Array} Liste des étapes normalisées { id, titre, texte, photoUrl, materiaux, outils }
 */
export function normalizePartSteps(part) {
  if (!part) return [];
  const rawSteps = part.chapitres || part.steps || part.etapesFabrication || [];
  if (!Array.isArray(rawSteps)) return [];

  return rawSteps.map((step, idx) => ({
    id: step.id || `step_${idx}`,
    titre: step.titre || step.title || step.nom || '',
    texte: step.texte || step.text || step.description || '',
    photoUrl: step.photoUrl || step.imageUrl || step.videoUrl || '',
    materiaux: Array.isArray(step.materiaux) ? step.materiaux : (Array.isArray(step.materials) ? step.materials : []),
    outils: Array.isArray(step.outils) ? step.outils : (Array.isArray(step.tools) ? step.tools : [])
  }));
}

/**
 * Projette dynamiquement en mémoire les modèles d'instruments
 * sous forme de livrets virtuels Cordel pour la corde 'TutosFabrication'.
 *
 * Règle : Une seule fiche par instrument (modèle d'atelier).
 *
 * @param {Array} models - Collection des modèles d'instruments issus de 'instrument_models'
 * @returns {Array} Liste des livrets virtuels normalisés (un livret par instrument)
 */
export function projectWorkshopBooklets(models = []) {
  if (!Array.isArray(models)) return [];

  const projectedBooklets = [];

  models.forEach((model) => {
    if (!model || !model.nom) return;

    const parts = Array.isArray(model.parts) ? model.parts : [];
    const modelDate = model.createdAt || model.dateCreation || model.dateAjout || new Date().toISOString();
    const modelAnnee = model.annee || (model.createdAt ? new Date(model.createdAt).getFullYear() : undefined);
    const instrumentLabel = model.type || model.nom;

    // Une seule fiche par instrument
    const modelBooklet = {
      id: `model_${model.id}`,
      modelId: model.id,
      titre: model.nom,
      sousTitre: `${parts.length} ${parts.length > 1 ? 'pièces' : 'pièce'}${model.type ? ' • ' + model.type : ''}`,
      instrument: instrumentLabel,
      familleInstrument: model.type || '',
      type: 'instrument_model',
      typeDoc: 'instrument_model',
      isVirtualAtelier: true,
      isWorkshopVirtual: true,
      isModelHeader: true,
      modelData: model,
      partsCount: parts.length,
      categoryId: 'TutosFabrication',
      categorie: 'Tutos Fabrication',
      poleId: 'lutherie',
      order: typeof model.order === 'number' ? model.order : 0,
      dateAjout: modelDate,
      annee: modelAnnee,
      description: model.description || ''
    };
    projectedBooklets.push(modelBooklet);
  });

  return projectedBooklets;
}

/**
 * Calcule la signalétique visuelle d'une étape d'usinage d'une pièce.
 * Respecte strictement la charte de couleurs :
 * - stepIndex < currentStepIndex : VERT (validé)
 * - stepIndex === currentStepIndex :
 *   - statutEtape === 'terminee' : VERT
 *   - statutEtape === 'en_attente_controle' : AMBRE PULSE (⏳)
 *   - sinon (en_cours) : OCRE / JAUNE (🛠️)
 * - stepIndex > currentStepIndex : GRIS NEUTRE (à venir)
 *
 * @param {number} stepIndex - Index de l'étape testée (0-indexé)
 * @param {number} currentStepIndex - Index de l'étape courante (0-indexé)
 * @param {string} statutEtape - 'en_cours' | 'en_attente_controle' | 'terminee'
 * @returns {{
 *   status: 'validated' | 'waiting' | 'in_progress' | 'upcoming',
 *   colorClass: string,
 *   badgeClass: string,
 *   icon: string,
 *   label: string
 * }}
 */
export function getStepSignal(stepIndex, currentStepIndex = 0, statutEtape = 'en_cours') {
  const cStep = typeof currentStepIndex === 'number' ? currentStepIndex : (parseInt(currentStepIndex, 10) || 0);

  // 1. Étape antérieure : validée
  if (stepIndex < cStep) {
    return {
      status: 'validated',
      colorClass: 'bg-emerald-700 text-white border-emerald-800',
      badgeClass: 'bg-emerald-700/15 text-emerald-800 border-emerald-700/40 font-black',
      icon: '✓',
      label: 'Validée'
    };
  }

  // 2. Étape courante
  if (stepIndex === cStep) {
    if (statutEtape === 'terminee') {
      return {
        status: 'validated',
        colorClass: 'bg-emerald-700 text-white border-emerald-800',
        badgeClass: 'bg-emerald-700/15 text-emerald-800 border-emerald-700/40 font-black',
        icon: '✓',
        label: 'Validée'
      };
    }
    if (statutEtape === 'en_attente_controle') {
      return {
        status: 'waiting',
        colorClass: 'bg-amber-500 text-white border-amber-600 animate-pulse',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-400 font-black animate-pulse',
        icon: '⏳',
        label: 'À contrôler'
      };
    }
    // En cours actif
    return {
      status: 'in_progress',
      colorClass: 'bg-amber-600 text-white border-amber-700',
      badgeClass: 'bg-amber-600/15 text-amber-800 border-amber-600/40 font-black',
      icon: '🛠️',
      label: 'En cours'
    };
  }

  // 3. Étape ultérieure : à venir
  return {
    status: 'upcoming',
    colorClass: 'bg-stone-200 text-stone-500 border-stone-300',
    badgeClass: 'bg-stone-100 text-stone-600 border-stone-300',
    icon: String(stepIndex + 1),
    label: 'À venir'
  };
}

/**
 * Calcule le nombre exact d'étapes terminées pour une pièce.
 * Règle : `${currentStepIndex}` tant que la pièce est en cours,
 * et `${totalSteps}` uniquement quand statutEtape === 'terminee'.
 *
 * @param {number} totalSteps - Nombre total d'étapes
 * @param {number} currentStepIndex - Index de l'étape active (0-indexé)
 * @param {string} statutEtape - 'en_cours' | 'en_attente_controle' | 'terminee'
 * @returns {number} Nombre d'étapes terminées
 */
export function getCompletedStepsCount(totalSteps, currentStepIndex = 0, statutEtape = 'en_cours') {
  if (!totalSteps || totalSteps <= 0) return 0;
  if (statutEtape === 'terminee') {
    return totalSteps;
  }
  const cStep = typeof currentStepIndex === 'number' ? currentStepIndex : (parseInt(currentStepIndex, 10) || 0);
  return Math.min(Math.max(0, cStep), totalSteps);
}

/**
 * Formate le ratio textuel d'avancement des étapes.
 * Affiche `${currentStepIndex} / ${totalEtapes} terminées` tant que la pièce est en cours,
 * et `${totalEtapes} / ${totalEtapes} terminées` uniquement quand elle est marquée terminée.
 *
 * @param {number} totalSteps - Nombre total d'étapes
 * @param {number} currentStepIndex - Index de l'étape active (0-indexé)
 * @param {string} statutEtape - 'en_cours' | 'en_attente_controle' | 'terminee'
 * @returns {string} Ratio textuel formaté
 */
export function getStepProgressRatio(totalSteps, currentStepIndex = 0, statutEtape = 'en_cours') {
  const completed = getCompletedStepsCount(totalSteps, currentStepIndex, statutEtape);
  return `${completed} / ${totalSteps} terminées`;
}

