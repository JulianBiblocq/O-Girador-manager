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
