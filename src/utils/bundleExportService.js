import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Service d'export d'un modèle d'instrument en Master Bundle (.zip)
 * @param {Object} model - Le document modèle de l'instrument
 * @param {Array} suppliesList - Liste des matières premières (inventory_supplies) du groupe
 * @param {Array} toolsList - Liste de l'outillage (workshop_tools) du groupe
 */
export async function exportInstrumentMasterBundle(model, suppliesList = [], toolsList = []) {
  const zip = new JSZip();
  const mediasFolder = zip.folder("medias");
  
  // Clonage profond pour ne pas muter l'objet original
  const exportModel = JSON.parse(JSON.stringify(model));
  delete exportModel.id;
  delete exportModel.groupId;

  const suppliesManifest = {};
  const toolsManifest = {};

  // Traitement des pièces et chapitres
  if (exportModel.parts && Array.isArray(exportModel.parts)) {
    for (const part of exportModel.parts) {
      
      // 1. Réconciliation des fournitures (materiels)
      if (part.materiels && Array.isArray(part.materiels)) {
        part.materiels.forEach(matName => {
          const matNameClean = matName.trim().toLowerCase();
          const match = suppliesList.find(s => s.nom.trim().toLowerCase() === matNameClean);
          if (match) {
            suppliesManifest[matNameClean] = {
              nom: match.nom,
              unite: match.unite || 'unité',
              domaine: match.domaine || 'lutherie',
              seuilCritique: match.seuilCritique || 5,
              conditionnementAchat: match.conditionnementAchat || ''
            };
          }
        });
      }

      // 2. Réconciliation des outils (outils)
      if (part.outils && Array.isArray(part.outils)) {
        part.outils.forEach(outilName => {
          const outilNameClean = outilName.trim().toLowerCase();
          const match = toolsList.find(t => t.nom.trim().toLowerCase() === outilNameClean);
          if (match) {
            toolsManifest[outilNameClean] = {
              nom: match.nom,
              isResident: typeof match.isResident !== 'undefined' ? match.isResident : true,
              domaine: match.domaine || 'lutherie'
            };
          }
        });
      }

      // 3. Traitement des médias des chapitres
      if (part.chapitres && Array.isArray(part.chapitres)) {
        for (const chap of part.chapitres) {
          if (chap.photoUrl && chap.photoUrl.startsWith('http')) {
            try {
              // Tentative de téléchargement de l'image (blob)
              const response = await fetch(chap.photoUrl);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              
              const blob = await response.blob();
              
              // Déduction de l'extension
              let extension = 'jpg';
              if (blob.type === 'image/png') extension = 'png';
              else if (blob.type === 'image/webp') extension = 'webp';
              
              // Nommage univoque
              const fileName = `${part.id}_${chap.id}.${extension}`;
              
              // Ajout au zip
              mediasFolder.file(fileName, blob);
              
              // Remplacement de l'URL par le chemin relatif local
              chap.photoUrl = `medias/${fileName}`;
              
            } catch (error) {
              console.warn(`Impossible de télécharger l'image du chapitre ${chap.id} (CORS ou introuvable). Fallback sur l'URL distante.`, error);
              // Fallback : on garde chap.photoUrl tel quel
            }
          }
        }
      }
    }
  }

  // 4. Création du manifest complet
  const manifest = {
    version: "1.0",
    model: exportModel,
    suppliesManifest,
    toolsManifest
  };

  // Ajout du manifest.json à la racine
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 5. Génération et téléchargement
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipFileName = `pack_${(model.nom || 'modele').replace(/\s+/g, '_').toLowerCase()}_bundle.zip`;
  
  saveAs(zipBlob, zipFileName);
}
