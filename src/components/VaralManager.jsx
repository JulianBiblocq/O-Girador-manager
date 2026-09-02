import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, addDoc, getDocs, getDoc, increment } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import DocumentUploadForm from './DocumentUploadForm';
import SongCard from './SongCard';
import CultureCard from './CultureCard';
import PrintConfigModal from './PrintConfigModal';
import { useTranslation } from './LanguageContext';
import { XiloChisel } from './XiloIcons';
import useConfirm from '../hooks/useConfirm';
import SeloAxeStamp from './SeloAxeStamp';
import useHardwareBack from '../hooks/useHardwareBack';
import InstrumentModelsManager from './varal/InstrumentModelsManager';

const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Toadas', nom: 'Toadas', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutorielsVideo', nom: 'Tutoriels Vidéo', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutosFabrication', nom: 'Tutos Fabrication', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'PhotosPrestations', nom: 'Photos Prestations', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'ComptesRendus', nom: 'Comptes-rendus', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true },
  { id: 'Administratif', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false }
];

export default function VaralManager({ groupId, onBack, role, isSystemAdmin, isEmbedded }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [documents, setDocuments] = useState([]);
  const [varalCategories, setVaralCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedToada, setSelectedToada] = useState(null);
  const [selectedCultureCard, setSelectedCultureCard] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState('documents'); // 'documents' | 'models'
  
  // Sorting state per category
  const [sortMethods, setSortMethods] = useState({});

  // Fiches Culture Packs Export/Import State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedFichesIds, setSelectedFichesIds] = useState([]);

  // Print state
  const [selectedSongsIds, setSelectedSongsIds] = useState([]);
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useHardwareBack(isAdding, () => setIsAdding(false));
  useHardwareBack(!!documentToEdit, () => setDocumentToEdit(null));
  useHardwareBack(!!selectedReport, () => setSelectedReport(null));
  useHardwareBack(!!selectedToada, () => setSelectedToada(null));
  useHardwareBack(!!selectedCultureCard, () => setSelectedCultureCard(null));
  useHardwareBack(showBulkPrintModal, () => setShowBulkPrintModal(false));

  const toggleSongSelection = (id) => {
    setSelectedSongsIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleFicheSelection = (id) => {
    setSelectedFichesIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleExportPack = () => {
    const fichesToExport = documents.filter(d => selectedFichesIds.includes(d.id));
    if (fichesToExport.length === 0) return;
    
    const cleanFiches = fichesToExport.map(fiche => {
      const { id, groupId, ...rest } = fiche;
      return rest;
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanFiches, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `pack_fiches_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    setSelectionMode(false);
    setSelectedFichesIds([]);
  };

  const handleImportPack = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (Array.isArray(json)) {
          let importedCount = 0;
          for (const fiche of json) {
            if (fiche.type === 'culture_fiche') {
              const newFiche = { ...fiche, groupId };
              newFiche.dateAjout = new Date().toISOString();
              if (newFiche.createdAt) newFiche.createdAt = new Date().toISOString();
              
              await addDoc(collection(db, 'documents'), newFiche);
              importedCount++;
            }
          }
          alert(`Succès: ${importedCount} fiches importées.`);
        } else {
          alert("Le fichier JSON ne contient pas un tableau valide.");
        }
      } catch (err) {
        console.error("Erreur lors de l'import :", err);
        alert("Fichier invalide ou corrompu.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };
  
  const handleBulkPrint = ({ format, isBW, printSections }) => {
    setShowBulkPrintModal(false);
    setPrintSections(printSections);
    setIsPrinting(true);
    
    // Définir classes for print
    if (isBW) document.body.classList.add('print-bw');
    document.body.classList.add(`print-format-${format}`);
    document.body.classList.add('printing-song');

    // Inject @page size dynamically
    const styleId = 'dynamic-print-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const margins = { 'A5': '10mm', 'A4': '15mm', 'A3': '20mm' };
    styleEl.innerHTML = `@media print { @page { size: ${format}; margin: ${margins[format] || '15mm'}; } }`;
    
    setTimeout(() => {
      window.print();
      
      // Cleanup
      if (isBW) document.body.classList.remove('print-bw');
      document.body.classList.remove(`print-format-${format}`);
      document.body.classList.remove('printing-song');
      if (styleEl) styleEl.innerHTML = '';
      setIsPrinting(false);
    }, 100);
  };

  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatUpload, setNewCatUpload] = useState(false);
  const [newCatUploadUrl, setNewCatUploadUrl] = useState('');
  const [newCatArchive, setNewCatArchive] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useHardwareBack(showCategorySettings, () => setShowCategorySettings(false));

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || role === 'admin' || role === 'bureau' || role === 'ca';

  const handleSaveEditCategory = async (e) => {
    if (e) e.preventDefault();
    if (!editingCategory || !editingCategory.nom.trim()) return;
    setSavingSettings(true);
    try {
      const updatedCategories = varalCategories.map(c => {
        if (c.id === editingCategory.id) {
          return {
            ...c,
            nom: editingCategory.nom.trim(),
            activerUploadPublic: editingCategory.activerUploadPublic === true,
            lienUploadPublic: editingCategory.activerUploadPublic ? (editingCategory.lienUploadPublic || '').trim() : '',
            activerOpaciteArchive: editingCategory.activerOpaciteArchive === true
          };
        }
        return c;
      });
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, { varalCategories: updatedCategories });
      setEditingCategory(null);
    } catch (err) {
      console.error("Error editing category:", err);
      alert("Erreur lors de la modification de la catégorie.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingSettings(true);
    try {
      const newCat = {
        id: `cat_${Date.now()}`,
        nom: newCatName.trim(),
        activerUploadPublic: newCatUpload,
        lienUploadPublic: newCatUpload ? newCatUploadUrl.trim() : '',
        activerOpaciteArchive: newCatArchive
      };
      
      const updatedCategories = [...varalCategories, newCat];
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, { varalCategories: updatedCategories });
      
      setNewCatName('');
      setNewCatUpload(false);
      setNewCatUploadUrl('');
      setNewCatArchive(false);
    } catch (err) {
      console.error("Error adding category:", err);
      alert("Erreur lors de l'ajout de la catégorie.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRemoveCategory = async (id) => {
    const msg = t('documents.varalSettingsRemoveConfirm') || "Êtes-vous sûr de vouloir supprimer cette corde ? Les documents liés ne seront pas supprimés mais n'auront plus de catégorie associée.";
    const isOk = await confirm({
      title: "Supprimer la catégorie",
      message: msg,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (isOk) {
      setSavingSettings(true);
      try {
        const updatedCategories = varalCategories.filter(c => c.id !== id);
        const assocRef = doc(db, 'associations', groupId);
        await updateDoc(assocRef, { varalCategories: updatedCategories });
      } catch (err) {
        console.error("Error removing category:", err);
        alert("Erreur lors de la suppression de la catégorie.");
      } finally {
        setSavingSettings(false);
      }
    }
  };

  const handleMoveCategory = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= varalCategories.length) return;
    setSavingSettings(true);
    try {
      const updatedCategories = [...varalCategories];
      const temp = updatedCategories[index];
      updatedCategories[index] = updatedCategories[newIndex];
      updatedCategories[newIndex] = temp;
      
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, { varalCategories: updatedCategories });
    } catch (err) {
      console.error("Error moving category:", err);
      alert("Erreur lors de la réorganisation des catégories.");
    } finally {
      setSavingSettings(false);
    }
  };

  // 1. Charger les catégories de Varal de l'association
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawCats = docSnap.data().varalCategories || [];
        const mergedCats = DEFAULT_VARAL_CATEGORIES.map(defaultCat => {
          const customCat = rawCats.find(c => c.id === defaultCat.id) || rawCats.find(c => c.nom === defaultCat.nom);
          if (customCat) {
            return { ...defaultCat, ...customCat, id: defaultCat.id }; // Force the native ID
          }
          return defaultCat;
        });
        setVaralCategories(mergedCats);
      } else {
        setVaralCategories(DEFAULT_VARAL_CATEGORIES);
      }
    }, (err) => {
      console.error("VaralManager - Error fetching association:", err);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 2. Charger tous les documents du groupe
  useEffect(() => {
    if (!groupId || !isAuthorized) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'documents'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      // Trier initially by order or date
      fetched.sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0);
      });
      setDocuments(fetched);
      setLoading(false);
    }, (err) => {
      console.error("VaralManager - Error fetching documents:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  // Identification globale du tout dernier document ajouté sur l'ensemble du Varal
  const newestDocumentId = React.useMemo(() => {
    if (!documents || documents.length === 0) return null;

    let newestId = null;
    let newestTimestamp = -Infinity;

    documents.forEach((docItem) => {
      let ts = 0;
      if (docItem.dateAjout) {
        ts = new Date(docItem.dateAjout).getTime();
      } else if (docItem.createdAt) {
        ts = typeof docItem.createdAt.toMillis === 'function' 
          ? docItem.createdAt.toMillis() 
          : new Date(docItem.createdAt).getTime();
      }
      
      if (!isNaN(ts) && ts > newestTimestamp) {
        newestTimestamp = ts;
        newestId = docItem.id;
      }
    });

    return newestId || (documents[0] ? documents[0].id : null);
  }, [documents]);

  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">🚨 ACCÈS REFUSÉ</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            Vous devez être administrateur pour accéder au gestionnaire de Varal.
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              ⬅️ {t('common.back')}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  const handleDelete = async (docItem) => {
    const confirmMsg = t('documents.deleteConfirm') || "Voulez-vous vraiment supprimer ce document ?";
    const isOk = await confirm({
      title: "Supprimer le document",
      message: confirmMsg,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!isOk) return;

    try {
      if (docItem.fileUrl && docItem.fileUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const fileRef = ref(storage, docItem.fileUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error("VaralManager - Error deleting storage file:", storageError);
        }
      }

      await deleteDoc(doc(db, 'documents', docItem.id));
    } catch (error) {
      console.error("VaralManager - Error deleting document:", error);
      alert(t('documents.deleteError') || "Erreur lors de la suppression du document.");
    }
  };

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'audio': return '🎵 Audio';
      case 'video': return '🎥 Vidéo';
      case 'image': return '🖼️ Image';
      case 'web': return '🌐 Web / URL';
      case 'culture_fiche': return '📖 Fiche Culture';
      default: return '📄 PDF / Fichier';
    }
  };

  const getCategoryLabel = (cat) => {
    const translation = t(`documents.${cat}`);
    if (translation === `documents.${cat}`) {
      return cat;
    }
    return translation;
  };

  // Reorder database logic
  const updateDocumentsOrder = async (newOrderedList) => {
    try {
      const promises = newOrderedList.map((docItem, idx) => {
        const docRef = doc(db, 'documents', docItem.id);
        return updateDoc(docRef, { order: idx });
      });
      await Promise.all(promises);
    } catch (err) {
      console.error("VaralManager - Erreur lors de la mise à jour de l'ordre :", err);
    }
  };

  const handleMoveUp = async (docItem, docList) => {
    const idx = docList.findIndex(d => d.id === docItem.id);
    if (idx <= 0) return;
    const newList = [...docList];
    const temp = newList[idx];
    newList[idx] = newList[idx - 1];
    newList[idx - 1] = temp;
    await updateDocumentsOrder(newList);
  };

  const handleMoveDown = async (docItem, docList) => {
    const idx = docList.findIndex(d => d.id === docItem.id);
    if (idx === -1 || idx >= docList.length - 1) return;
    const newList = [...docList];
    const temp = newList[idx];
    newList[idx] = newList[idx + 1];
    newList[idx + 1] = temp;
    await updateDocumentsOrder(newList);
  };

  const handleToggleState = async (docItem, field) => {
    try {
      const docRef = doc(db, 'documents', docItem.id);
      await updateDoc(docRef, {
        [field]: !docItem[field]
      });
    } catch (err) {
      console.error("Error toggling state:", err);
      alert("Erreur lors de la modification de l'état.");
    }
  };

  const handleTogglePublic = async (docItem) => {
    try {
      const docRef = doc(db, 'documents', docItem.id);
      const isCurrentlyPublic = docItem.isPublic === true;
      const assocRef = doc(db, 'associations', groupId);

      let updates = {
        isPublic: !isCurrentlyPublic
      };

      if (!isCurrentlyPublic) {
        // Devenir public
        updates.authorGroupId = groupId;
        
        const assocSnap = await getDoc(assocRef);
        if (assocSnap.exists()) {
          const assocData = assocSnap.data();
          updates.authorName = assocData.name || assocData.nom || 'Association';
        }

        if (!docItem.rewardClaimed) {
          updates.rewardClaimed = true;
          await updateDoc(assocRef, {
            contributionPoints: increment(25)
          });
          alert("🎉 Félicitations ! Votre partage a rapporté 25 Points d'Axé à votre association.");
        }
      }

      await updateDoc(docRef, updates);
    } catch (err) {
      console.error("Error toggling public state:", err);
      alert("Erreur lors de la modification de l'état public.");
    }
  };

  return (
    <>
    <div className="flex flex-col gap-6 text-left select-none max-w-5xl mx-auto w-full">
      {/* Header */}
      {!isEmbedded && (
        <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
          <button 
            type="button" 
            onClick={onBack} 
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center select-none"
          >
            ⬅️ {t('common.back')}
          </button>
          
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            <XiloChisel size={16} /> Gestionnaire de documents (Varal)
          </h2>
        </div>
      )}

      {/* Main Tab Switcher */}
      <div className="flex gap-2 border-b-2 border-dashed border-cordel-master-dark/30 select-none">
        <button
          type="button"
          onClick={() => setActiveMainTab('documents')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${
            activeMainTab === 'documents'
              ? 'border-cordel-wood text-cordel-wood'
              : 'border-transparent text-cordel-master-dark/60 hover:text-cordel-master-dark'
          }`}
        >
          📄 Documents & Partitions
        </button>
        <button
          type="button"
          onClick={() => setActiveMainTab('models')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${
            activeMainTab === 'models'
              ? 'border-cordel-wood text-cordel-wood'
              : 'border-transparent text-cordel-master-dark/60 hover:text-cordel-master-dark'
          }`}
        >
          🛠️ Modèles d'Instruments & Tutos
        </button>
      </div>

      {/* Main Workspace */}
      {activeMainTab === 'models' ? (
        <InstrumentModelsManager groupId={groupId} isAuthorized={isAuthorized} varalCategories={varalCategories} />
      ) : isAdding || documentToEdit ? (
        <div className="max-w-xl mx-auto w-full">
          <DocumentUploadForm 
            groupId={groupId}
            varalCategories={varalCategories}
            documentToEdit={documentToEdit}
            onClose={() => {
              setIsAdding(false);
              setDocumentToEdit(null);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end items-center gap-4 select-none">
            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
              {isAuthorized && (
                <CordelButton
                  variant="default"
                  useExtremeBorder={true}
                  onClick={() => setShowCategorySettings(!showCategorySettings)}
                  className="text-xs px-4 py-2 font-bold whitespace-nowrap"
                >
                  ⚙️ {showCategorySettings ? "Fermer les cordes" : "Gérer les cordes"}
                </CordelButton>
              )}
              
              <CordelButton
                variant="default"
                useExtremeBorder={true}
                onClick={() => {
                  const songIds = documents.filter(d => d.type === 'song').map(d => d.id);
                  if (songIds.length > 0) {
                    setSelectedSongsIds(songIds);
                    setShowBulkPrintModal(true);
                  } else {
                    alert("Aucun chant n'a été trouvé dans le carnet.");
                  }
                }}
                className="text-xs px-4 py-2 font-bold whitespace-nowrap"
              >
                🖨️ Imprimer tout le carnet
              </CordelButton>

              {selectedSongsIds.length > 0 && (
                <CordelButton 
                  variant="default" 
                  useExtremeBorder={true}
                  onClick={() => setShowBulkPrintModal(true)}
                  className="text-xs px-4 py-2 font-bold whitespace-nowrap bg-cordel-vert text-white hover:brightness-110"
                >
                  🖨️ Imprimer sélection ({selectedSongsIds.length})
                </CordelButton>
              )}

              {/* Fiches Culture Export/Import buttons */}
              {isAuthorized && (
                <>
                  <CordelButton
                    variant="default"
                    onClick={() => {
                      if (selectionMode && selectedFichesIds.length > 0) {
                        handleExportPack();
                      } else {
                        setSelectionMode(!selectionMode);
                        setSelectedFichesIds([]);
                      }
                    }}
                    className={`text-xs px-4 py-2 font-bold whitespace-nowrap ${selectionMode ? 'bg-[#c05621] text-white border-[#c05621] hover:brightness-110' : ''}`}
                  >
                    {selectionMode 
                      ? (selectedFichesIds.length > 0 ? `📦 Exporter Pack (${selectedFichesIds.length})` : 'Annuler Sélection')
                      : '📦 Créer un Pack'
                    }
                  </CordelButton>
                  <label className="theme-btn theme-btn-default text-xs px-4 py-2 font-bold whitespace-nowrap cursor-pointer flex items-center justify-center m-0 h-[34px]">
                    <span className="leading-none mt-[2px]">📥 Importer un Pack</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportPack} 
                      className="hidden" 
                    />
                  </label>
                </>
              )}

              <CordelButton 
                variant="ocre" 
                useExtremeBorder={true}
                onClick={() => setIsAdding(true)}
                className="text-xs px-4 py-2 font-bold whitespace-nowrap"
              >
                + Ajouter un document
              </CordelButton>
            </div>
          </div>

          {/* Formulaire pliable de gestion des cordes (rubriques) (Effet miroir) */}
          {isAuthorized && showCategorySettings && (
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 flex flex-col gap-4 mt-2">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
                📋 Gérer les Cordes (Rubriques) du Varal
              </h3>
              
              <div className="flex flex-col gap-2 mt-2 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
                  Cordes configurées
                </span>
                {varalCategories.length === 0 ? (
                  <span className="text-[10px] italic opacity-60">Aucune catégorie configurée.</span>
                ) : (
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {varalCategories.map((cat, idx) => (
                      <div 
                        key={cat.id}
                        className="border border-encre-noire/15 p-2 rounded bg-white/40 dark:bg-black/10 flex justify-between items-center text-xs"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-encre-noire">{cat.nom}</span>
                          <div className="flex flex-wrap gap-1.5 mt-0.5 text-[8px] font-black uppercase text-cordel-wood">
                            {cat.activerUploadPublic && (
                              <span className="px-1 bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-sm">
                                📤 Public
                              </span>
                            )}
                            {cat.activerOpaciteArchive && (
                              <span className="px-1 bg-purple-100 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 rounded-sm">
                                ⏳ Opacité Archive
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingCategory({ ...cat })}
                            disabled={savingSettings}
                            className="text-xs px-1.5 py-0.5 border border-cordel-master-dark/20 rounded bg-white hover:bg-neutral-100 font-extrabold cursor-pointer select-none"
                            title="Modifier le nom de la corde ou activer des options"
                          >
                            ⚙️ Configurer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CordelCard>
          )}

          {/* Modal de modification du nom de la corde / catégorie */}
          {editingCategory && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-md bg-cordel-bg p-5 relative select-none">
                <h3 className="font-extrabold text-sm text-encre-noire uppercase tracking-wider mb-3 border-b border-dashed border-cordel-master-dark/20 pb-2">
                  ✏️ Modifier le nom de la Corde
                </h3>

                <form onSubmit={handleSaveEditCategory} className="flex flex-col gap-3 text-left">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Nom de la corde / rubrique *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCategory.nom}
                      onChange={(e) => setEditingCategory({ ...editingCategory, nom: e.target.value })}
                      placeholder="Ex: Administratif, Comptes-rendus, Statuts..."
                      disabled={savingSettings}
                      className="theme-input w-full text-xs font-bold"
                      autoFocus
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
                    <input
                      type="checkbox"
                      checked={editingCategory.activerUploadPublic === true}
                      onChange={(e) => setEditingCategory({ ...editingCategory, activerUploadPublic: e.target.checked })}
                      disabled={savingSettings}
                      className="w-3.5 h-3.5 border border-encre-noire rounded accent-cordel-wood cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-encre-noire">
                      Activer un lien d'upload public pour cette catégorie
                    </span>
                  </label>

                  {editingCategory.activerUploadPublic && (
                    <div className="flex flex-col gap-1 ml-5">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                        Lien d'upload (ex: Drive, Dropbox...)
                      </label>
                      <input
                        type="url"
                        value={editingCategory.lienUploadPublic || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, lienUploadPublic: e.target.value })}
                        placeholder="https://..."
                        disabled={savingSettings}
                        className="theme-input text-xs font-bold py-1 bg-cordel-bg-light w-full"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingCategory.activerOpaciteArchive === true}
                      onChange={(e) => setEditingCategory({ ...editingCategory, activerOpaciteArchive: e.target.checked })}
                      disabled={savingSettings}
                      className="w-3.5 h-3.5 border border-encre-noire rounded accent-cordel-wood cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-encre-noire">
                      Activer l'opacité sur les documents archivés
                    </span>
                  </label>

                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-dashed border-cordel-master-dark/15">
                    <CordelButton
                      type="button"
                      variant="default"
                      onClick={() => setEditingCategory(null)}
                      disabled={savingSettings}
                      className="px-3 py-1.5 text-xs font-bold"
                    >
                      Annuler
                    </CordelButton>
                    <CordelButton
                      type="submit"
                      variant="ocre"
                      disabled={savingSettings || !editingCategory.nom.trim()}
                      className="px-4 py-1.5 text-xs font-black uppercase"
                    >
                      {savingSettings ? "Enregistrement..." : "Enregistrer"}
                    </CordelButton>
                  </div>
                </form>
              </CordelCard>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 select-none">
              <span className="text-xs font-bold uppercase tracking-widest text-cordel-master-dark opacity-65 animate-pulse">
                Chargement des documents...
              </span>
            </div>
          ) : documents.length === 0 ? (
            <CordelCard className="p-8 text-center bg-white/50">
              <p className="text-xs italic opacity-60">Aucun document chargé dans le Varal pour le moment.</p>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-8">
              {varalCategories.map((category) => {
                const sortMethod = sortMethods[category.id] || 'order';
                
                // Filtrer docs by category (matching priority: categoryId first, then name, then id fallback)
                let catDocs = documents.filter(d => {
                  const matchObj = (d.categoryId && varalCategories.find(c => c.id === d.categoryId))
                    || (d.categorie && varalCategories.find(c => c.nom === d.categorie))
                    || (d.categorie && varalCategories.find(c => c.id === d.categorie));
                  if (!matchObj || matchObj.id !== category.id) return false;
                  return true;
                });
                
                // Trier docs dynamically
                if (sortMethod === 'date') {
                  catDocs = [...catDocs].sort((a, b) => new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0));
                } else if (sortMethod === 'alpha') {
                  catDocs = [...catDocs].sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
                } else {
                  // custom order
                  catDocs = [...catDocs].sort((a, b) => {
                    const orderA = typeof a.order === 'number' ? a.order : 0;
                    const orderB = typeof b.order === 'number' ? b.order : 0;
                    if (orderA !== orderB) return orderA - orderB;
                    return new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0);
                  });
                }

                return (
                  <div key={category.id} className="flex flex-col">
                    {/* Header bar with sorting selector */}
                    <div className="flex justify-between items-center bg-cordel-master-dark text-cordel-bg-light p-3 rounded-t border-t border-x border-encre-noire select-none">
                      <span className="font-extrabold uppercase tracking-wider text-xs flex items-center gap-1.5">
                        🎗️ {getCategoryLabel(category.nom)} ({catDocs.length})
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-bg-light/80">{t('common.sort')} :</label>
                        <select
                          value={sortMethod}
                          onChange={(e) => setSortMethods(prev => ({ ...prev, [category.id]: e.target.value }))}
                          className="theme-input text-[9px] font-bold py-0.5 px-2 bg-cordel-bg-light text-encre-noire border border-encre-noire/30 rounded cursor-pointer"
                        >
                          <option value="order">{t('varalManager.sortCustomOrder')}</option>
                          <option value="date">{t('varalManager.sortDateAdded')}</option>
                          <option value="alpha">{t('varalManager.sortAlphabetical')}</option>
                        </select>
                      </div>
                    </div>

                    <CordelCard className="p-0 overflow-hidden rounded-b rounded-t-none border-x border-b border-encre-noire">
                      <div className="w-full max-w-full overflow-x-auto">
                        {catDocs.length === 0 ? (
                          <div className="p-8 text-center bg-white/30 dark:bg-black/10 select-none">
                            <p className="text-xs italic opacity-50">{t('documents.noDocumentsCategory')}</p>
                          </div>
                        ) : (
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-cordel-bg-light border-b border-encre-noire text-cordel-master-dark uppercase tracking-wider text-[9px] font-black">
                                <th className="py-1.5 px-2 md:py-2 md:px-2 w-8 text-center"></th>
                                <th className="py-1.5 px-2 md:py-2 md:px-3">{t('documents.docTitleLabel')}</th>
                                <th className="py-1.5 px-2 md:py-2 md:px-3 text-center">États</th>
                                <th className="py-1.5 px-2 md:py-2 md:px-3">{t('common.type')}</th>
                                <th className="py-1.5 px-2 md:py-2 md:px-3 text-center">{t('common.moveUp')}/{t('common.moveDown')}</th>
                                <th className="py-1.5 px-2 md:py-2 md:px-3 text-right">{t('common.actions')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {catDocs.map((docItem, index) => (
                                <tr 
                                  key={docItem.id} 
                                  className="border-b border-dashed border-encre-noire/15 hover:bg-cordel-hover/50 transition-colors"
                                >
                                  <td className="py-2 px-2 md:py-2.5 md:px-2 text-center w-8">
                                    {docItem.type === 'song' && !selectionMode && (
                                      <input 
                                        type="checkbox" 
                                        className="w-4 h-4 cursor-pointer accent-cordel-vert"
                                        checked={selectedSongsIds.includes(docItem.id)}
                                        onChange={() => toggleSongSelection(docItem.id)}
                                      />
                                    )}
                                    {docItem.type === 'culture_fiche' && selectionMode && (
                                      <input 
                                        type="checkbox" 
                                        className="w-4 h-4 cursor-pointer accent-cordel-ocre"
                                        checked={selectedFichesIds.includes(docItem.id)}
                                        onChange={() => toggleFicheSelection(docItem.id)}
                                      />
                                    )}
                                  </td>
                                  <td className="py-2 px-2 md:py-2.5 md:px-3 font-bold text-encre-noire dark:text-cordel-bg-light">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {docItem.type === 'culture_fiche' && (
                                        <SeloAxeStamp 
                                          size="xs" 
                                          iconeStamp={docItem.iconeStamp || docItem.stampKey || 'axe-default'}
                                          hexSecondary={docItem.hexSecondary || (docItem.couleurs && docItem.couleurs[1]) || (docItem.couleursTheme && docItem.couleursTheme[1]) || '#FFFFFF'}
                                        />
                                      )}
                                      <span>{docItem.titre}</span>
                                      {docItem.id === newestDocumentId && (
                                        <span className="theme-stamp-badge theme-stamp-badge-wood text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-[#d99f4d]/30 text-encre-noire border border-encre-noire animate-pulse select-none">
                                          {t('documents.newestBadge') || "✨ Nouveau"}
                                        </span>
                                      )}
                                    </div>
                                    {docItem.sousCategorie && (
                                      <span className="block text-[8px] font-bold text-cordel-wood uppercase tracking-wider mt-0.5">
                                        📁 {docItem.sousCategorie} ({docItem.annee})
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 md:py-2.5 md:px-3 text-center">
                                    <div className="flex justify-center gap-1.5 select-none">
                                      <button 
                                        type="button"
                                        onClick={() => handleToggleState(docItem, 'isHidden')}
                                        className={`relative w-7 h-7 flex items-center justify-center rounded border ${!docItem.isHidden ? 'bg-cordel-vert/10 border-cordel-vert shadow-[1px_1px_0px_0px_var(--color-cordel-vert)] opacity-100' : 'bg-white border-encre-noire/20 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 shadow-sm'} transition-all cursor-pointer`}
                                        title={docItem.isHidden ? "Masqué du Varal. Cliquer pour rendre visible." : "Visible sur le Varal. Cliquer pour masquer."}
                                      >
                                        <span className="text-sm pointer-events-none">{docItem.isHidden ? '🙈' : '👁️'}</span>
                                        {docItem.isHidden && <div className="absolute inset-0 m-auto w-[18px] h-[2.5px] bg-cordel-rouge -rotate-45 rounded-full pointer-events-none"></div>}
                                      </button>
                                      { (docItem.categorie === 'Toadas' || docItem.categorie === 'Culture' || (category.nom || '').toLowerCase().includes('toadas') || (category.nom || '').toLowerCase().includes('culture')) && (
                                        <button 
                                          type="button"
                                          onClick={() => handleToggleState(docItem, 'excludeFromPedagogy')}
                                          className={`relative w-7 h-7 flex items-center justify-center rounded border ${!docItem.excludeFromPedagogy ? 'bg-cordel-ocre/10 border-cordel-ocre shadow-[1px_1px_0px_0px_var(--color-cordel-ocre)] opacity-100' : 'bg-white border-encre-noire/20 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 shadow-sm'} transition-all cursor-pointer`}
                                          title={docItem.excludeFromPedagogy ? "Exclu du QCM/Carnet. Cliquer pour inclure." : "Inclus dans QCM/Carnet. Cliquer pour exclure."}
                                        >
                                          <span className="text-sm pointer-events-none">{docItem.excludeFromPedagogy ? '📕' : '📖'}</span>
                                        </button>
                                      )}
                                      <button 
                                        type="button"
                                        onClick={() => handleToggleState(docItem, 'isArchived')}
                                        className={`relative w-7 h-7 flex items-center justify-center rounded border ${docItem.isArchived ? 'bg-cordel-wood/10 border-cordel-wood shadow-[1px_1px_0px_0px_var(--color-cordel-wood)] opacity-100' : 'bg-white border-encre-noire/20 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 shadow-sm'} transition-all cursor-pointer`}
                                        title={docItem.isArchived ? "Archivé (Carton fermé). Cliquer pour remettre sur le varal." : "Sur le Varal (Carton ouvert). Cliquer pour archiver."}
                                      >
                                        <span className="text-sm pointer-events-none">{docItem.isArchived ? '📦' : '📤'}</span>
                                      </button>
                                      {isAuthorized && (
                                        <button 
                                          type="button"
                                          onClick={() => handleTogglePublic(docItem)}
                                          className={`relative w-7 h-7 flex items-center justify-center rounded border ${docItem.isPublic ? 'bg-cordel-vert/10 border-cordel-vert shadow-[1px_1px_0px_0px_var(--color-cordel-vert)] opacity-100' : 'bg-cordel-ocre/10 border-cordel-ocre shadow-[1px_1px_0px_0px_var(--color-cordel-ocre)] opacity-100'} transition-all cursor-pointer`}
                                          title={docItem.isPublic ? "Public dans le Terreiro. Cliquer pour dépublier." : "Privé. Cliquer pour publier dans le Terreiro."}
                                        >
                                          <span className="text-sm pointer-events-none">{docItem.isPublic ? '🔓' : '🔒'}</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2 md:py-2.5 md:px-3 font-semibold text-[10px]">
                                    {getDocTypeBadge(docItem.type || 'pdf')}
                                  </td>
                                  <td className="py-2 px-2 md:py-2.5 md:px-3 text-center">
                                    {sortMethod === 'order' ? (
                                      <div className="flex justify-center gap-1 select-none">
                                        <button
                                          onClick={() => handleMoveUp(docItem, catDocs)}
                                          disabled={index === 0}
                                          className="p-1 text-[9px] font-extrabold bg-cordel-bg border border-encre-noire rounded shadow-[1px_1px_0px_0px_#181716] hover:bg-neutral-100 disabled:opacity-30 disabled:shadow-none cursor-pointer"
                                          title="Déplacer vers le haut"
                                        >
                                          ▲
                                        </button>
                                        <button
                                          onClick={() => handleMoveDown(docItem, catDocs)}
                                          disabled={index === catDocs.length - 1}
                                          className="p-1 text-[9px] font-extrabold bg-cordel-bg border border-encre-noire rounded shadow-[1px_1px_0px_0px_#181716] hover:bg-neutral-100 disabled:opacity-30 disabled:shadow-none cursor-pointer"
                                          title="Déplacer vers le bas"
                                        >
                                          ▼
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] italic opacity-40 select-none">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 md:py-2.5 md:px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {(docItem.fileUrl || docItem.type === 'report' || docItem.type === 'culture_fiche' || docItem.type === 'song' || (docItem.categorie || '').toLowerCase().includes('culture') || (docItem.categorie || '').toLowerCase().includes('toada')) && (
                                        <button
                                          onClick={() => {
                                            const cat = (docItem.categorie || '').toLowerCase();
                                            const inferredType = docItem.type || (cat.includes('toada') ? 'song' : (cat.includes('culture') || cat.includes('fiche') ? 'culture_fiche' : 'pdf'));
                                            
                                            if (inferredType === 'report') {
                                              setSelectedReport(docItem);
                                            } else if (inferredType === 'song') {
                                              setSelectedToada(docItem);
                                            } else if (inferredType === 'culture_fiche') {
                                              setSelectedCultureCard(docItem);
                                            } else {
                                              window.open(docItem.fileUrl, '_blank');
                                            }
                                          }}
                                          className="text-[9px] font-black uppercase bg-neutral-100 hover:bg-neutral-200 text-encre-noire border border-encre-noire/30 px-2.5 py-1 rounded"
                                        >
                                          Aperçu
                                        </button>
                                      )}
                                      <button
                                        onClick={() => setDocumentToEdit(docItem)}
                                        className="text-[9px] font-black uppercase bg-[#d99f4d]/80 hover:bg-[#d99f4d] text-encre-noire border border-encre-noire/30 px-2.5 py-1 rounded"
                                      >
                                        Modifier
                                      </button>
                                      <button
                                        onClick={() => handleDelete(docItem)}
                                        className="text-[9px] font-black uppercase bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-2.5 py-1 rounded"
                                      >
                                        Supprimer
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </CordelCard>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modale de lecture du Compte-Rendu (Gestionnaire / Cordel) */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
          <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-2xl p-6 text-left relative bg-cordel-bg shadow-xl max-h-[85vh] flex flex-col">
            {/* Header / Stamp */}
            <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/20 pb-3 mb-4 shrink-0">
              <div>
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] tracking-wider mb-1 inline-block">
                  📜 COMPTE-RENDU DE RÉUNION
                </span>
                <h3 className="text-base font-extrabold text-cordel-wood uppercase">
                  {selectedReport.titre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-xs font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs">
              
              {/* Presents Badge Row */}
              {selectedReport.presents && selectedReport.presents.length > 0 && (
                <div className="bg-cordel-bg-light/45 p-3 rounded border border-dashed border-encre-noire/15 flex flex-col gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-cordel-master-dark opacity-65">
                    Membres présents à cette réunion :
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedReport.presents.map((name, i) => (
                      <span key={`${name}-${i}`} className="text-[9px] font-bold px-2 py-0.5 bg-neutral-200/50 rounded">
                        👤 {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured points list */}
              <div className="flex flex-col gap-4 mt-2">
                {selectedReport.points && selectedReport.points.length > 0 ? (
                  selectedReport.points.map((p, idx) => (
                    <div key={p.id || idx} className="theme-inner-panel p-4 rounded-[4px_6px_3px_5px] flex flex-col gap-2">
                      <span className="font-extrabold text-encre-noire border-b border-dashed border-encre-noire/10 pb-1">
                        📌 {p.titre}
                      </span>
                      <p className="opacity-90 leading-relaxed font-semibold italic whitespace-pre-wrap pl-2 text-encre-noire">
                        {p.notesCR || "Aucune note rédigée pour ce point."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="theme-inner-panel p-4 rounded-[4px_6px_3px_5px] whitespace-pre-wrap leading-relaxed italic font-semibold text-encre-noire">
                    {selectedReport.texte || "Aucun contenu."}
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-dashed border-cordel-master-dark/15 text-center text-[9px] font-black text-cordel-wood opacity-55 shrink-0 select-none uppercase tracking-widest">
              O Girador - Document Officiel Archivé
            </div>
          </CordelCard>
        </div>
      )}

      {/* Modale de lecture d'une Toada (Carnet de Chants) */}
      {selectedToada && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-6 md:p-12 animate-fadeIn overflow-hidden">
          <div className="w-full max-w-[560px] max-h-[95vh] flex flex-col bg-cordel-bg rounded-lg shadow-2xl overflow-hidden">
            {/* Header avec bouton fermeture */}
            <div className="w-full flex justify-between items-center p-3 border-b-2 border-dashed border-cordel-master-dark/20 shrink-0 bg-cordel-bg">
              <span className="text-xs font-black uppercase text-cordel-wood tracking-wider">Carnet de Chants</span>
              <button
                type="button"
                onClick={() => setSelectedToada(null)}
                className="bg-[#8b2a1a] text-white w-7 h-7 rounded font-black flex items-center justify-center shadow hover:bg-red-700 transition-colors border border-white cursor-pointer"
                title="Fermer"
              >
                X
              </button>
            </div>
            {/* Contenu défilable */}
            <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center p-0 bg-cordel-bg-light">
              <div className="w-full h-full max-w-full">
                <SongCard song={selectedToada} defaultRevisionMode={false} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de lecture d'une Fiche Culture */}
      {selectedCultureCard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-6 md:p-12 animate-fadeIn overflow-hidden">
          <div className="w-full max-w-[560px] max-h-[95vh] flex flex-col bg-cordel-bg rounded-lg shadow-2xl overflow-hidden">
            {/* Header avec bouton fermeture */}
            <div className="w-full flex justify-between items-center p-3 border-b-2 border-dashed border-cordel-master-dark/20 shrink-0 bg-cordel-bg">
              <span className="text-xs font-black uppercase text-cordel-wood tracking-wider">Fiche Culturelle</span>
              <button
                type="button"
                onClick={() => setSelectedCultureCard(null)}
                className="bg-[#8b2a1a] text-white w-7 h-7 rounded font-black flex items-center justify-center shadow hover:bg-red-700 transition-colors border border-white cursor-pointer"
                title="Fermer"
              >
                X
              </button>
            </div>
            {/* Contenu défilable */}
            <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center p-0 bg-cordel-bg-light">
              <div className="w-full h-full max-w-full">
                <CultureCard culture={selectedCultureCard} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Bulk Print Hidden Container (Portaled to body to escape all parent layouts) */}
    {isPrinting && createPortal(
      <div className="print:block bg-white w-full">
        {documents
          .filter(d => selectedSongsIds.includes(d.id))
          .map(song => (
            <div key={song.id} className="print-song-page">
              <SongCard song={song} defaultRevisionMode={false} isPrintVersion={true} printSections={printSections} />
            </div>
          ))}
      </div>,
      document.body
    )}

    {/* Bulk Print Modal */}
    {showBulkPrintModal && (
      <PrintConfigModal
        title={`Impression du Carnet (${selectedSongsIds.length} chants)`}
        onClose={() => setShowBulkPrintModal(false)}
        onConfirm={handleBulkPrint}
      />
    )}
    </>
  );
}
