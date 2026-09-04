import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';

export default function ImportModelWizardModal({ groupId, file, suppliesList = [], toolsList = [], onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [manifest, setManifest] = useState(null);
  const [extractedImages, setExtractedImages] = useState(new Map());
  
  const [suppliesToCreate, setSuppliesToCreate] = useState(new Set());
  const [toolsToCreate, setToolsToCreate] = useState(new Set());
  
  const [uploadProgress, setUploadProgress] = useState('');

  // 1. Lecture du fichier à l'ouverture
  useEffect(() => {
    const readFile = async () => {
      try {
        if (file.name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          
          // Lecture du manifest
          const manifestFile = zip.file('manifest.json');
          if (!manifestFile) throw new Error("Fichier manifest.json introuvable dans l'archive ZIP.");
          
          const manifestContent = await manifestFile.async('text');
          const parsedManifest = JSON.parse(manifestContent);
          setManifest(parsedManifest);
          
          // Extraction des images du dossier medias
          const imagesMap = new Map();
          zip.folder('medias').forEach((relativePath, fileNode) => {
            if (!fileNode.dir) {
              imagesMap.set(`medias/${relativePath}`, fileNode);
            }
          });
          
          // Convertir les JSZip objects en Blobs
          const blobsMap = new Map();
          for (const [path, node] of imagesMap.entries()) {
            const blob = await node.async('blob');
            blobsMap.set(path, blob);
          }
          setExtractedImages(blobsMap);
          
        } else if (file.name.endsWith('.json')) {
          // Fallback pour les anciens JSON bruts
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const parsed = JSON.parse(e.target.result);
              
              if (parsed.version && parsed.model) {
                // Le fichier est déjà au bon format v1.1 avec manifest
                setManifest(parsed);
              } else {
                // Fallback pour les anciens JSON bruts
                setManifest({
                  version: "legacy",
                  model: parsed,
                  suppliesManifest: {},
                  toolsManifest: {}
                });
              }
              setLoading(false);
            } catch (err) {
              setError("Fichier JSON invalide.");
              setLoading(false);
            }
          };
          reader.readAsText(file);
          return; // Sortie anticipée car asynchrone par event
        } else {
          throw new Error("Format de fichier non supporté. Attendu : .zip ou .json");
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la lecture de l'archive :", err);
        setError(err.message || "Erreur de lecture du fichier.");
        setLoading(false);
      }
    };
    
    readFile();
  }, [file]);

  // Handlers pour les cases à cocher
  const toggleSupply = (supplyKey) => {
    const nextSet = new Set(suppliesToCreate);
    if (nextSet.has(supplyKey)) nextSet.delete(supplyKey);
    else nextSet.add(supplyKey);
    setSuppliesToCreate(nextSet);
  };

  const toggleTool = (toolKey) => {
    const nextSet = new Set(toolsToCreate);
    if (nextSet.has(toolKey)) nextSet.delete(toolKey);
    else nextSet.add(toolKey);
    setToolsToCreate(nextSet);
  };

  // 2. Finalisation de l'import (Upload + Firestore Batch)
  const handleFinalizeImport = async () => {
    if (!manifest || !manifest.model) return;
    
    setLoading(true);
    setUploadProgress("Initialisation...");
    
    try {
      const storage = getStorage();
      const model = manifest.model;
      const safeModelName = (model.nom || 'modele').replace(/\s+/g, '_').toLowerCase();
      
      // Upload des images et remplacement des URLs
      if (model.parts && Array.isArray(model.parts)) {
        for (const part of model.parts) {
          if (part.chapitres && Array.isArray(part.chapitres)) {
            for (const chap of part.chapitres) {
              if (chap.photoUrl && chap.photoUrl.startsWith('medias/')) {
                const blob = extractedImages.get(chap.photoUrl);
                if (blob) {
                  setUploadProgress(`Upload de l'image ${chap.photoUrl.split('/').pop()}...`);
                  // Ex: documents/{groupId}/models/alfaia/part_1_chap_1.jpg
                  const storagePath = `documents/${groupId}/models/${safeModelName}/${chap.photoUrl.split('/').pop()}`;
                  const storageRef = ref(storage, storagePath);
                  await uploadBytes(storageRef, blob);
                  const downloadUrl = await getDownloadURL(storageRef);
                  chap.photoUrl = downloadUrl; // Remplacement par l'URL publique
                }
              }
            }
          }
        }
      }

      setUploadProgress("Sauvegarde en base de données...");
      const batch = writeBatch(db);
      
      // A. Document Modèle d'instrument
      const modelRef = doc(collection(db, 'instrument_models'));
      const finalModel = {
        ...model,
        groupId,
        importedAt: new Date().toISOString()
      };
      batch.set(modelRef, finalModel);

      // B. Création des Fournitures
      for (const supplyKey of suppliesToCreate) {
        const supData = manifest.suppliesManifest[supplyKey];
        if (supData) {
          const supRef = doc(collection(db, 'inventory_supplies'));
          batch.set(supRef, {
            groupId,
            nom: supData.nom,
            domaine: supData.domaine || 'lutherie',
            unite: supData.unite || 'unité',
            quantiteStock: 0,
            seuilCritique: supData.seuilCritique || 5,
            conditionnementAchat: supData.conditionnementAchat || ''
          });
        }
      }

      // C. Création des Outils
      for (const toolKey of toolsToCreate) {
        const toolData = manifest.toolsManifest[toolKey];
        if (toolData) {
          const toolRef = doc(collection(db, 'workshop_tools'));
          batch.set(toolRef, {
            groupId,
            nom: toolData.nom,
            domaine: toolData.domaine || 'lutherie',
            isResident: typeof toolData.isResident !== 'undefined' ? toolData.isResident : true
          });
        }
      }

      await batch.commit();
      
      onSuccess(model.nom);
    } catch (err) {
      console.error("Erreur lors de l'import final :", err);
      setError("Erreur lors de l'enregistrement ou de l'upload des médias.");
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  // Vues de chaque étape
  const renderStep1 = () => (
    <div className="flex flex-col gap-3 text-left">
      <div className="p-3 bg-cordel-master-dark/5 border border-cordel-wood/20 rounded">
        <h4 className="text-sm font-black text-cordel-wood">📜 {manifest.model?.nom}</h4>
        <p className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">{manifest.model?.type}</p>
        
        <ul className="mt-3 space-y-1.5 text-[11px] text-encre-noire font-medium">
          <li>• <strong className="text-cordel-ocre">{manifest.model?.parts?.length || 0}</strong> pièces répertoriées</li>
          <li>• <strong className="text-cordel-vert">{extractedImages.size}</strong> images embarquées dans l'archive</li>
          <li>• Format détecté : <span className="uppercase text-stone-500">{manifest.version === 'legacy' ? 'JSON Simple' : 'Master Bundle ZIP'}</span></li>
        </ul>
      </div>
      
      <div className="flex justify-end mt-2">
        <CordelButton variant="vert" onClick={() => setStep(2)}>Suivant ➔</CordelButton>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const suppliesEntries = Object.entries(manifest.suppliesManifest || {});
    return (
      <div className="flex flex-col gap-3 text-left">
        <p className="text-[10px] text-stone-600 italic">
          Le modèle requiert ces matières premières. Si elles manquent dans votre association, vous pouvez les créer automatiquement avec un stock à zéro.
        </p>
        
        <div className="max-h-48 overflow-y-auto border border-dashed border-cordel-wood/30 rounded p-2 flex flex-col gap-2">
          {suppliesEntries.length === 0 ? (
            <span className="text-[10px] italic opacity-50">Aucune fourniture déclarée ou format legacy.</span>
          ) : (
            suppliesEntries.map(([key, data]) => {
              const alreadyExists = suppliesList.some(s => s.nom.trim().toLowerCase() === key);
              return (
                <div key={key} className="flex items-center justify-between bg-white p-2 rounded shadow-sm text-[11px]">
                  <div className="flex flex-col">
                    <strong className="text-encre-noire">{data.nom}</strong>
                    <span className="text-[9px] text-stone-500">{data.unite}</span>
                  </div>
                  {alreadyExists ? (
                    <span className="text-green-600 font-bold text-[9px] flex items-center gap-1">
                      ✅ En stock
                    </span>
                  ) : (
                    <label className="flex items-center gap-1.5 cursor-pointer text-cordel-wood font-bold text-[9px]">
                      <input 
                        type="checkbox" 
                        checked={suppliesToCreate.has(key)}
                        onChange={() => toggleSupply(key)}
                        className="text-cordel-ocre focus:ring-cordel-ocre"
                      />
                      Créer la fiche
                    </label>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-between mt-2">
          <CordelButton variant="default" onClick={() => setStep(1)}>⬅ Retour</CordelButton>
          <CordelButton variant="vert" onClick={() => setStep(3)}>Suivant ➔</CordelButton>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const toolsEntries = Object.entries(manifest.toolsManifest || {});
    return (
      <div className="flex flex-col gap-3 text-left">
        <p className="text-[10px] text-stone-600 italic">
          Même principe pour l'outillage requis (marteaux, scies...).
        </p>
        
        <div className="max-h-48 overflow-y-auto border border-dashed border-cordel-wood/30 rounded p-2 flex flex-col gap-2">
          {toolsEntries.length === 0 ? (
            <span className="text-[10px] italic opacity-50">Aucun outil déclaré ou format legacy.</span>
          ) : (
            toolsEntries.map(([key, data]) => {
              const alreadyExists = toolsList.some(t => t.nom.trim().toLowerCase() === key);
              return (
                <div key={key} className="flex items-center justify-between bg-white p-2 rounded shadow-sm text-[11px]">
                  <div className="flex flex-col">
                    <strong className="text-encre-noire">{data.nom}</strong>
                    <span className="text-[9px] text-stone-500">{data.isResident ? 'Résident local' : 'Mobile'}</span>
                  </div>
                  {alreadyExists ? (
                    <span className="text-green-600 font-bold text-[9px] flex items-center gap-1">
                      ✅ Disponible
                    </span>
                  ) : (
                    <label className="flex items-center gap-1.5 cursor-pointer text-cordel-wood font-bold text-[9px]">
                      <input 
                        type="checkbox" 
                        checked={toolsToCreate.has(key)}
                        onChange={() => toggleTool(key)}
                        className="text-cordel-ocre focus:ring-cordel-ocre"
                      />
                      Créer l'outil
                    </label>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
          <CordelButton variant="default" onClick={() => setStep(2)}>⬅ Retour</CordelButton>
          <CordelButton variant="vert" useExtremeBorder={true} onClick={handleFinalizeImport} disabled={loading}>
            🚀 Importer le modèle
          </CordelButton>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md">
        <CordelCard variant="default" className="p-5 flex flex-col gap-4 relative">
          
          <button 
            onClick={onClose} 
            disabled={loading && uploadProgress !== ''}
            className="absolute top-2 right-2 text-stone-400 hover:text-stone-700 disabled:opacity-30"
          >
            <XiloClose size={16} />
          </button>

          <h3 className="text-sm font-black text-cordel-wood uppercase border-b-2 border-dashed border-cordel-wood/20 pb-2">
            📦 Assistant d'Importation
          </h3>

          {/* Stepper */}
          {manifest && !error && (
            <div className="flex justify-center items-center gap-2 text-[10px] font-bold text-stone-400 mb-2">
              <span className={step >= 1 ? 'text-cordel-wood' : ''}>1. Inspection</span>
              <span>-</span>
              <span className={step >= 2 ? 'text-cordel-wood' : ''}>2. Fournitures</span>
              <span>-</span>
              <span className={step >= 3 ? 'text-cordel-wood' : ''}>3. Outillage</span>
            </div>
          )}

          {loading && !manifest && !error && (
            <div className="text-center py-6 text-xs text-stone-500 font-bold uppercase tracking-wider animate-pulse">
              Lecture de l'archive...
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded text-center font-bold">
              {error}
            </div>
          )}

          {manifest && !error && step === 1 && renderStep1()}
          {manifest && !error && step === 2 && renderStep2()}
          {manifest && !error && step === 3 && renderStep3()}

          {loading && uploadProgress && (
            <div className="mt-2 text-center text-[10px] text-cordel-vert font-bold animate-pulse">
              {uploadProgress}
            </div>
          )}
        </CordelCard>
      </div>
    </div>
  );
}
