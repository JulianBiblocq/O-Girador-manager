import { useState } from 'react';
import { db, storage } from '../firebase';
import { useTranslation } from '../components/LanguageContext';
import { executeSmartBatchImport, parseTagsList } from '../utils/toadaBatchUpsertService';
import { syncSixToadasPresetsToDocs } from '../utils/toadaSixPresetsSync';
import { getNonFabricationTemplate } from '../utils/documentCulturePayloadHelper';
import { submitSingleDocument } from '../utils/documentSingleSubmitService';

/**
 * Hook personnalisé gérant le pipeline de soumission, d'upload Firebase Storage,
 * de fusion intelligente (Upsert JSON) et de pré-intégration des 6 Toadas (< 140 lignes).
 */
export function useDocumentUploadPipeline({ groupId, varalCategories = [], documentToEdit = null, onClose }) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const downloadTemplate = (category) => {
    let templateObj;
    const isFabrication = category === 'TutosFabrication' || category === 'fabrication';
    const filename = isFabrication ? 'modele_import_fabrication.json' : `modele_import_${category}.json`;

    if (category === 'Culture') {
      templateObj = getNonFabricationTemplate('Culture');
    } else if (isFabrication) {
      templateObj = [
        {
          titre: "Fabrication d'un carnet Cordel / Instrument",
          thematiqueFabrication: "lutherie",
          instrumentConcerne: "Alfaia 16 pouces",
          materielRequis: ["Contreplaqué 4mm", "Colle à bois", "Corde 8mm"],
          outilsNecessaires: ["Scie sauteuse", "Serre-joints", "Réglet"],
          visuelAnimeUrl: "https://...",
          contenuFabrication: "<p>Présentation générale, consignes de sécurité et mise en garde...</p>",
          anecdote: "Astuce d'atelier pour le séchage...",
          etapesFabrication: [
            {
              id: 1,
              sousTitre: "Découpe des cartons et pré-pliage immédiat",
              description: "Mesurer et découper les cartons selon le gabarit fourni...",
              imageUrl: "https://...",
              materiaux: ["Contreplaqué 4mm"],
              outils: ["Scie sauteuse", "Réglet"]
            },
            {
              id: 2,
              sousTitre: "Gravure des tampons en linoléum",
              description: "Dessiner les visuels et lettrages en miroir sur le linoléum...",
              imageUrl: "https://...",
              materiaux: ["Colle à bois"],
              outils: ["Serre-joints"]
            }
          ],
          questionsQcm: []
        }
      ];
    } else {
      templateObj = getNonFabricationTemplate(category);
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(templateObj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', filename);
    dlAnchorElem.click();
  };

  const executeBatchImport = async (batchFile, category, computedType) => {
    if (!batchFile) { alert("Veuillez sélectionner un fichier JSON d'import."); return; }
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawData = JSON.parse(event.target.result);
        if (!Array.isArray(rawData)) {
          alert("Le fichier JSON doit contenir un tableau d'objets (array).");
          setIsSubmitting(false);
          return;
        }
        const normalizedItems = rawData.map((item) => ({
          ...item,
          thematiqueFabrication: item.thematiqueFabrication || 'lutherie',
          etapesFabrication: Array.isArray(item.etapesFabrication)
            ? item.etapesFabrication.map((step, idx) => ({
                ...step,
                id: step.id || Date.now() + idx + Math.random(),
                materiaux: parseTagsList(step.materiaux),
                outils: parseTagsList(step.outils)
              }))
            : []
        }));
        const categoryObj = varalCategories.find((c) => c.id === category);
        const categoryName = categoryObj ? categoryObj.nom : category;
        const { totalCount, createdCount, updatedCount } = await executeSmartBatchImport({
          db, data: normalizedItems, groupId, category, categoryName, computedType
        });
        alert(`${totalCount} éléments traités avec succès (${createdCount} créés, ${updatedCount} fusionnés sans doublon) !`);
        if (onClose) onClose();
      } catch (err) {
        console.error('Erreur import JSON :', err);
        alert("Erreur lors de la lecture ou de l'import du fichier JSON. Vérifiez le format.");
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(batchFile);
  };

  const syncSixToadasPresets = async (forceOverwrite = false) => {
    if (!groupId) return { updatedCount: 0 };
    setIsSubmitting(true);
    try {
      return await syncSixToadasPresetsToDocs({ db, groupId, forceOverwrite });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDocument = async (formData) => {
    if (!groupId) return;
    setIsSubmitting(true);
    try {
      await submitSingleDocument({ db, storage, groupId, varalCategories, documentToEdit, formData, t, onClose });
    } catch (error) {
      console.error("DocumentUploadForm - Erreur d'enregistrement :", error);
      alert(t('common.saveError') || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitDocument, executeBatchImport, downloadTemplate, syncSixToadasPresets };
}
