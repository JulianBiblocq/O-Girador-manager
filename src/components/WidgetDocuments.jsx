import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import DocumentUploadForm from './DocumentUploadForm';

import { useTranslation } from './LanguageContext';

export const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Partitions', nom: 'Partitions', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Tutoriels', nom: 'Tutoriels', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Administratif', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true }
];

export default function WidgetDocuments({ role, isSystemAdmin, groupId }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [varalCategories, setVaralCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleEdit = (docItem) => {
    setDocumentToEdit(docItem);
  };

  const handleDelete = async (docItem) => {
    const confirmMsg = t('documents.deleteConfirm') || "Voulez-vous vraiment supprimer ce document ?";
    if (!window.confirm(confirmMsg)) return;

    try {
      if (docItem.fileUrl && docItem.fileUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const fileRef = ref(storage, docItem.fileUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error("WidgetDocuments - Erreur de suppression Storage :", storageError);
        }
      }

      const docRef = doc(db, 'documents', docItem.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("WidgetDocuments - Erreur de suppression :", error);
      alert(t('documents.deleteError') || "Erreur lors de la suppression du document.");
    }
  };

  const updateDocumentsOrder = async (newOrderedList) => {
    try {
      const promises = newOrderedList.map((docItem, idx) => {
        const docRef = doc(db, 'documents', docItem.id);
        return updateDoc(docRef, { order: idx });
      });
      await Promise.all(promises);
    } catch (err) {
      console.error("WidgetDocuments - Erreur lors de la mise à jour de l'ordre :", err);
    }
  };

  const handleMoveLeft = async (docItem, docList) => {
    const idx = docList.findIndex(d => d.id === docItem.id);
    if (idx <= 0) return;
    const newList = [...docList];
    const temp = newList[idx];
    newList[idx] = newList[idx - 1];
    newList[idx - 1] = temp;
    await updateDocumentsOrder(newList);
  };

  const handleMoveRight = async (docItem, docList) => {
    const idx = docList.findIndex(d => d.id === docItem.id);
    if (idx === -1 || idx >= docList.length - 1) return;
    const newList = [...docList];
    const temp = newList[idx];
    newList[idx] = newList[idx + 1];
    newList[idx + 1] = temp;
    await updateDocumentsOrder(newList);
  };

  const getCategoryLabel = (cat) => {
    return t(`documents.${cat}`) || cat;
  };

  const getDocType = (docItem) => {
    if (docItem.type) return docItem.type;
    const url = docItem.fileUrl || '';
    if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a')) return 'audio';
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('drive.google.com')) return 'video';
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.svg') || url.includes('.webp')) return 'image';
    if (url.startsWith('http') && !url.includes('.pdf')) return 'web';
    return 'pdf'; // default fallback
  };

  const getDocColorVariant = (docItem) => {
    const type = getDocType(docItem);
    if (type === 'video') return 'rouge';
    if (type === 'pdf') return 'bleu';
    if (type === 'audio') return 'vert';
    if (type === 'web') return 'jaune';
    return 'default'; // fallback
  };

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // Real-time synchronization with Firestore documents collection
  useEffect(() => {
    if (!groupId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedDocs = [];
      querySnapshot.forEach((doc) => {
        fetchedDocs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by order asc, then upload date desc
      fetchedDocs.sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 9999;
        const orderB = typeof b.order === 'number' ? b.order : 9999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.dateAjout) - new Date(a.dateAjout);
      });
      setDocuments(fetchedDocs);
      setLoading(false);
    }, (error) => {
      console.error("WidgetDocuments - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Sync varalCategories from association configuration
  useEffect(() => {
    if (!groupId) {
      setVaralCategories(DEFAULT_VARAL_CATEGORIES);
      return;
    }

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.varalCategories)) {
          setVaralCategories(data.varalCategories);
          return;
        }
      }
      setVaralCategories(DEFAULT_VARAL_CATEGORIES);
    }, (error) => {
      console.error("WidgetDocuments - Erreur onSnapshot association :", error);
      setVaralCategories(DEFAULT_VARAL_CATEGORIES);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Group documents by category in JavaScript
  const groupedDocs = documents.reduce((acc, docItem) => {
    // Find matching category object
    const catObj = varalCategories.find(c => c.id === docItem.categoryId || c.nom === docItem.categorie || c.id === docItem.categorie);
    const catId = catObj ? catObj.id : 'Autre';
    
    if (!acc[catId]) {
      acc[catId] = [];
    }
    acc[catId].push(docItem);
    return acc;
  }, {});

  const categoryVariants = {
    'Partitions': 'ocre',
    'Tutoriels': 'vert',
    'Culture': 'ocre',
    'Administratif': 'bleu'
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Title & Action Bar */}
      <div className="flex justify-between items-center pl-1 pr-1">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left">
          {t('widgetDocuments.title')}
        </h3>
        {!loading && isAuthorized && !isAdding && (
          <CordelButton 
            variant="default" 
            onClick={() => setIsAdding(true)} 
            className="text-[10px] px-2 py-1 uppercase tracking-widest font-black"
          >
            {t('widgetDocuments.uploadBtn')}
          </CordelButton>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-6">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      )}

      {/* Upload/Edit Form view */}
      {!loading && (isAdding || documentToEdit) && (
        <DocumentUploadForm 
          groupId={groupId} 
          varalCategories={varalCategories}
          documentToEdit={documentToEdit}
          onClose={() => {
            setIsAdding(false);
            setDocumentToEdit(null);
          }} 
        />
      )}

      {/* Documents Clothesline View (grouped by category) */}
      {!loading && !isAdding && !documentToEdit && (
        documents.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-4 text-center">
            <p className="text-xs opacity-75 font-semibold">Aucun document suspendu.</p>
          </CordelCard>
        ) : (          <div className="flex flex-col gap-4 w-full">
            {varalCategories.map((category) => {
              const docList = groupedDocs[category.id] || [];
              const variant = categoryVariants[category.id] || 'default';
              const currentYear = new Date().getFullYear();
              
              return (
                <CordelCard key={category.id} variant="default" useExtremeBorder={true} className="pb-8 pt-4 relative overflow-hidden bg-cordel-bg-light w-full">
                  {/* Category Title Stamp */}
                  <div className="text-left mb-2 pl-2 flex justify-between items-center pr-3 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className={`theme-stamp-badge theme-stamp-badge-${variant === 'ocre' || variant === 'vert' ? 'wood' : 'dark'} text-[8px] tracking-wider`}>
                        {getCategoryLabel(category.nom)}
                      </span>
                      {isAuthorized && (
                        <button
                          type="button"
                          onClick={() => setEditingCategory(category)}
                          className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm opacity-60 hover:opacity-100 transition-opacity"
                          title="Modifier la catégorie"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {category.activerUploadPublic && category.lienUploadPublic && (
                      <a 
                        href={category.lienUploadPublic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-black uppercase text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        📤 {t('documents.publicUploadLink') || "Partager vos photos/vidéos"}
                      </a>
                    )}
                  </div>

                  {/* SVG Curved Clothesline Rope */}
                  <div className="absolute top-10 left-0 right-0 h-10 w-full z-0 select-none pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 350 30" preserveAspectRatio="none">
                      <path 
                        d="M 10 10 Q 175 30 340 10" 
                        fill="none" 
                        stroke="var(--cordel-border)" 
                        strokeWidth="2" 
                        strokeDasharray="4 3" 
                      />
                    </svg>
                  </div>

                  {/* Hanging Booklets */}
                  <div className="flex flex-nowrap overflow-x-auto justify-start items-start gap-3 sm:gap-4 mt-8 relative z-10 w-full no-scrollbar pb-3 px-4">
                    {docList.length === 0 ? (
                      <p className="text-[9px] italic opacity-60 self-center py-2">{t('documents.noDocumentsCategory') || "Aucun document dans cette rubrique."}</p>
                    ) : (
                      docList.map((docItem, index) => {
                        // Alternate rotation slightly for that organic handcrafted feel
                        const rotationClass = index % 2 === 0 ? 'rotate-[-3deg]' : 'rotate-[2.5deg]';
                        const isArchived = category.activerOpaciteArchive && docItem.annee && docItem.annee < currentYear;
                        const opacityClass = isArchived ? 'opacity-60 hover:opacity-100 transition-opacity duration-200' : 'opacity-100';

                        const docType = getDocType(docItem);
                        const colorClass = getDocColorVariant(docItem);
                        const typeIcons = {
                          pdf: '📄',
                          audio: '🎵',
                          image: '📷',
                          video: '🎥',
                          web: '🌐'
                        };
                        const typeIcon = typeIcons[docType] || '📄';

                        return (
                          <div 
                            key={docItem.id}
                            onClick={() => window.open(docItem.fileUrl, '_blank')}
                            className={`
                              relative flex flex-col items-center group cursor-pointer
                              transition-all duration-300 origin-top shrink-0
                              ${rotationClass} hover:rotate-0 hover:scale-105
                              ${opacityClass}
                            `}
                            title={`${t('common.open') || "Ouvrir"} ${docItem.titre} ${isArchived ? '(' + (t('documents.archiveTag') || "Archive") + ')' : ''}`}
                          >
                            {/* Clothespin Simulator (Pince à linge) */}
                            <div className="absolute -top-3 w-2.5 h-6 bg-[#a67a53] border border-encre-noire rounded-sm shadow-sm z-30 flex flex-col justify-between py-0.5 items-center select-none">
                              <div className="w-1.5 h-0.5 bg-neutral-800 opacity-60"></div>
                              <div className="w-1.5 h-0.5 bg-neutral-800 opacity-40"></div>
                            </div>

                            {/* Booklet Cover */}
                            <div 
                              className={`
                                relative w-28 h-36 border-2 border-encre-noire p-3 flex flex-col justify-between text-left
                                bg-cordel-bg-light shadow-[3px_3px_0px_0px_#181716]
                                rounded-[4px_10px_3px_8px]
                                border-l-4 border-l-double
                                theme-bg-${colorClass}
                              `}
                            >
                              {/* Edit & Delete & Reorder Action Buttons */}
                              {isAuthorized && (
                                <div className="absolute top-1.5 right-1.5 flex gap-1 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {index > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveLeft(docItem, docList);
                                      }}
                                      className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm font-bold text-[8px]"
                                      title="Déplacer vers la gauche"
                                    >
                                      ◀
                                    </button>
                                  )}
                                  {index < docList.length - 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveRight(docItem, docList);
                                      }}
                                      className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm font-bold text-[8px]"
                                      title="Déplacer vers la droite"
                                    >
                                      ▶
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(docItem);
                                    }}
                                    className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm"
                                    title={t('common.edit') || "Modifier"}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(docItem);
                                    }}
                                    className="p-1 rounded bg-[var(--cordel-bg)] text-red-600 border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm"
                                    title={t('common.delete') || "Supprimer"}
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      <line x1="10" y1="11" x2="10" y2="17" />
                                      <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                              {/* Booklet Top */}
                              <div className="flex flex-col min-w-0">
                                <div className="w-full border-b border-dashed border-encre-noire/25 pb-1 select-none flex justify-between items-center">
                                  <span className="text-[10px] select-none">
                                    {typeIcon}
                                  </span>
                                  {docItem.annee && (
                                    <span className="text-[7px] font-black bg-encre-noire/10 text-encre-noire px-1 rounded-sm">
                                      {docItem.annee}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-extrabold text-[10px] text-encre-noire leading-tight mt-1.5 break-words line-clamp-3">
                                  {docItem.titre}
                                </h4>
                              </div>

                              {/* Booklet Bottom */}
                              <div className="mt-auto select-none">
                                <div className="text-[7px] text-right font-black uppercase mt-1">
                                  {t('documents.readBtn') || "Lire ➜"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CordelCard>
              );
            })}
          </div>
        )
      )}

      {/* Category Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
          <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-md p-6 text-left relative bg-cordel-bg shadow-xl">
            <h3 className="text-sm font-extrabold tracking-wider text-cordel-wood uppercase mb-4 border-b-2 border-dashed border-cordel-master-dark/20 pb-2">
              ✏️ Modifier la Corde / Catégorie
            </h3>
            
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                  Nom de la catégorie
                </label>
                <input 
                  type="text"
                  value={editingCategory.nom}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, nom: e.target.value }))}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer mt-1">
                <input 
                  type="checkbox"
                  checked={editingCategory.activerUploadPublic}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, activerUploadPublic: e.target.checked }))}
                  className="w-4 h-4 cursor-pointer mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-encre-noire">Activer l'upload public</span>
                  <span className="text-[9px] text-cordel-master-dark/70 font-semibold leading-relaxed">
                    Permet aux membres d'accéder à un lien externe pour verser des fichiers.
                  </span>
                </div>
              </label>

              {editingCategory.activerUploadPublic && (
                <div className="flex flex-col gap-1 pl-6">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Lien d'upload (Drive, Dropbox...)
                  </label>
                  <input 
                    type="url"
                    value={editingCategory.lienUploadPublic || ''}
                    onChange={(e) => setEditingCategory(prev => ({ ...prev, lienUploadPublic: e.target.value }))}
                    placeholder="https://..."
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  />
                </div>
              )}

              <label className="flex items-start gap-2 cursor-pointer mt-1">
                <input 
                  type="checkbox"
                  checked={editingCategory.activerOpaciteArchive}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, activerOpaciteArchive: e.target.checked }))}
                  className="w-4 h-4 cursor-pointer mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-encre-noire">Archiver visuellement</span>
                  <span className="text-[9px] text-cordel-master-dark/70 font-semibold leading-relaxed">
                    Réduit l'opacité des livrets des années antérieures.
                  </span>
                </div>
              </label>

              <div className="flex justify-end gap-3 mt-4 border-t border-dashed border-cordel-master-dark/20 pt-4">
                <CordelButton 
                  type="button" 
                  variant="default"
                  onClick={() => setEditingCategory(null)}
                  className="text-[10px] px-3 py-1.5 uppercase font-bold"
                >
                  Annuler
                </CordelButton>
                <CordelButton 
                  type="button" 
                  variant="ocre"
                  onClick={async () => {
                    if (!editingCategory.nom.trim()) {
                      alert("Le nom de la catégorie ne peut pas être vide !");
                      return;
                    }
                    try {
                      const assocRef = doc(db, 'associations', groupId);
                      const updatedCategories = varalCategories.map(c => c.id === editingCategory.id ? { ...editingCategory, nom: editingCategory.nom.trim() } : c);
                      await updateDoc(assocRef, { varalCategories: updatedCategories });
                      setEditingCategory(null);
                    } catch (err) {
                      console.error("Erreur lors de la mise à jour de la catégorie :", err);
                      alert("Erreur lors de l'enregistrement.");
                    }
                  }}
                  className="text-[10px] px-3 py-1.5 uppercase font-bold"
                >
                  Enregistrer
                </CordelButton>
              </div>
            </div>
          </CordelCard>
        </div>
      )}
    </div>
  );
}
