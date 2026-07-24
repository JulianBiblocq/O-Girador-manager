import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import DocumentUploadForm from './DocumentUploadForm';
import { useTranslation } from './LanguageContext';
import { XiloChisel } from './XiloIcons';

const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Partitions', nom: 'Partitions', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Tutoriels', nom: 'Tutoriels', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Administratif', nom: 'Comptes-rendus', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true },
  { id: 'DocumentsFixes', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false }
];

export default function VaralManager({ groupId, onBack, role, isSystemAdmin }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [varalCategories, setVaralCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Sorting state per category
  const [sortMethods, setSortMethods] = useState({});

  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatUpload, setNewCatUpload] = useState(false);
  const [newCatUploadUrl, setNewCatUploadUrl] = useState('');
  const [newCatArchive, setNewCatArchive] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

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
    if (window.confirm(msg)) {
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
        const rawCats = docSnap.data().varalCategories;
        if (Array.isArray(rawCats)) {
          const cats = rawCats.map(c => {
            if (c.id === 'Administratif' && (c.nom === 'Administratif' || !c.nom)) {
              return { ...c, nom: 'Comptes-rendus' };
            }
            return c;
          });
          if (!cats.some(c => c.id === 'DocumentsFixes')) {
            cats.push({ id: 'DocumentsFixes', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false });
          }
          setVaralCategories(cats);
        } else {
          setVaralCategories(DEFAULT_VARAL_CATEGORIES);
        }
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
      // Sort initially by order or date
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
    if (!window.confirm(confirmMsg)) return;

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

  return (
    <div className="flex flex-col gap-6 text-left select-none max-w-5xl mx-auto w-full">
      {/* Header */}
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

      {/* Main Workspace */}
      {isAdding || documentToEdit ? (
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
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 select-none">
            <p className="text-xs opacity-75 leading-relaxed max-w-xl">
              Gérez les fichiers, partitions, tutoriels et enregistrements audios de votre groupe sous forme de tableaux structurés par corde. Les modifications d'ordre personnalisé s'appliquent en direct sur l'accueil.
            </p>
            <div className="flex gap-2 shrink-0">
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
              
              <div className="flex flex-col gap-3 pb-3 border-b border-dashed border-cordel-master-dark/15 text-xs text-left">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Nom de la catégorie (ex: Partitions, Tutoriels...)
                    </label>
                    <input 
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Saisissez un nom..."
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={newCatUpload}
                        onChange={(e) => setNewCatUpload(e.target.checked)}
                        className="w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-semibold text-encre-noire">Activer un lien d'upload public pour cette catégorie</span>
                    </label>

                    {newCatUpload && (
                      <div className="flex flex-col gap-1 ml-5">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Lien d'upload (ex: Google Drive, Dropbox...)
                        </label>
                        <input 
                          type="url"
                          value={newCatUploadUrl}
                          onChange={(e) => setNewCatUploadUrl(e.target.value)}
                          placeholder="https://..."
                          className="theme-input text-xs font-bold py-1 bg-cordel-bg-light w-full"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={newCatArchive}
                        onChange={(e) => setNewCatArchive(e.target.checked)}
                        className="w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="font-semibold text-encre-noire">Activer l'opacité sur les documents archivés (ex: Administratif)</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <CordelButton 
                    type="button"
                    variant="ocre"
                    useExtremeBorder={true}
                    onClick={handleAddCategory}
                    disabled={savingSettings || !newCatName.trim() || (newCatUpload && !newCatUploadUrl.trim())}
                    className="py-1.5 text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
                  >
                    + Ajouter
                  </CordelButton>
                </div>
              </div>

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
                            title="Modifier le nom de la corde"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(idx, -1)}
                            disabled={idx === 0 || savingSettings}
                            className="text-xs p-1 hover:text-cordel-wood disabled:opacity-30 cursor-pointer select-none font-bold"
                            title="Monter"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(idx, 1)}
                            disabled={idx === varalCategories.length - 1 || savingSettings}
                            className="text-xs p-1 hover:text-cordel-wood disabled:opacity-30 cursor-pointer select-none font-bold"
                            title="Descendre"
                          >
                            ▼
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRemoveCategory(cat.id)}
                            className="text-xs hover:text-red-500 font-bold px-2 py-1 cursor-pointer select-none"
                            title="Supprimer"
                          >
                            ✕
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
                
                // Filter docs by category (matching priority: categoryId first, then name, then id fallback)
                let catDocs = documents.filter(d => {
                  const matchObj = (d.categoryId && varalCategories.find(c => c.id === d.categoryId))
                    || (d.categorie && varalCategories.find(c => c.nom === d.categorie))
                    || (d.categorie && varalCategories.find(c => c.id === d.categorie));
                  return matchObj ? matchObj.id === category.id : false;
                });
                
                // Sort docs dynamically
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
                                <th className="py-1.5 px-2 md:py-2 md:px-3">{t('documents.docTitleLabel')}</th>
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
                                  <td className="py-2 px-2 md:py-2.5 md:px-3 font-bold text-encre-noire dark:text-cordel-bg-light">
                                    {docItem.titre}
                                    {docItem.sousCategorie && (
                                      <span className="block text-[8px] font-bold text-cordel-wood uppercase tracking-wider mt-0.5">
                                        📁 {docItem.sousCategorie} ({docItem.annee})
                                      </span>
                                    )}
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
                                      {(docItem.fileUrl || docItem.type === 'report') && (
                                        <button
                                          onClick={() => {
                                            if (docItem.type === 'report') {
                                              setSelectedReport(docItem);
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
                      <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-neutral-200/50 rounded">
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
    </div>
  );
}
