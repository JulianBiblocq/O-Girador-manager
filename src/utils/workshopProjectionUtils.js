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
 * Projette dynamiquement en mémoire les modèles d'instruments et leurs pièces
 * sous forme de livrets virtuels Cordel pour la corde 'TutosFabrication'.
 *
 * @param {Array} models - Collection des modèles d'instruments issus de 'instrument_models'
 * @returns {Array} Liste des livrets virtuels normalisés (chapeaux de modèles et pièces d'usinage)
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

    // 1. Livret virtuel chapeau du modèle d'instrument (Nomenclature & gabarit)
    const headerBooklet = {
      id: `model_${model.id}`,
      modelId: model.id,
      titre: `[Modèle] ${model.nom} — Nomenclature & gabarit`,
      sousTitre: `${instrumentLabel} • Vue d'ensemble (${parts.length} pièces)`,
      instrument: instrumentLabel,
      familleInstrument: model.type || '',
      type: 'instrument_model',
      typeDoc: 'instrument_model',
      isVirtualAtelier: true,
      isWorkshopVirtual: true,
      isModelHeader: true,
      modelData: model,
      categoryId: 'TutosFabrication',
      categorie: 'Tutos Fabrication',
      poleId: 'lutherie',
      order: 0,
      dateAjout: modelDate,
      annee: modelAnnee,
      description: model.description || ''
    };
    projectedBooklets.push(headerBooklet);

    // 2. Livrets virtuels autonomes par pièce disposant d'étapes d'usinage
    parts.forEach((part, partIndex) => {
      if (!part || !part.nom) return;

      const normalizedSteps = normalizePartSteps(part);
      const stepsCount = normalizedSteps.length;

      // N'injecter que si la pièce dispose d'au moins une étape rédigée
      if (stepsCount > 0) {
        const partId = part.id || `part_${partIndex}`;
        const partBooklet = {
          id: `part_${model.id}_${partId}`,
          modelId: model.id,
          partId: partId,
          titre: `${model.nom} — ${part.nom}`,
          sousTitre: `${model.nom} • ${stepsCount} ${stepsCount > 1 ? 'étapes' : 'étape'}`,
          instrument: instrumentLabel,
          familleInstrument: model.type || '',
          type: 'instrument_part',
          typeDoc: 'instrument_part',
          isVirtualAtelier: true,
          isWorkshopVirtual: true,
          isPartStep: true,
          modelData: model,
          partData: {
            ...part,
            chapitres: normalizedSteps
          },
          etapesCount: stepsCount,
          categoryId: 'TutosFabrication',
          categorie: 'Tutos Fabrication',
          poleId: 'lutherie',
          order: 0,
          dateAjout: modelDate,
          annee: modelAnnee
        };
        projectedBooklets.push(partBooklet);
      }
    });
  });

  return projectedBooklets;
}
