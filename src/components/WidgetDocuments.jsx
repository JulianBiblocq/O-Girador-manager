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

const getDeterministicColor = (docId) => {
  if (!docId) return 'default';
  const colors = ['vert', 'bleu', 'rouge', 'jaune', 'violet', 'orange'];
  let hash = 0;
  for (let i = 0; i < docId.length; i++) {
    hash = docId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Realistic Wooden Clothespin (Pince à linge artisanale en bois)
const WoodenClothespin = ({ className = "" }) => (
  <svg 
    width="20" 
    height="38" 
    viewBox="0 0 20 38" 
    fill="none" 
    className={`select-none drop-shadow-[1px_2px_2px_rgba(24,23,22,0.45)] ${className}`}
  >
    <defs>
      <linearGradient id="woodLeft" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D4A359" />
        <stop offset="50%" stopColor="#B07D3B" />
        <stop offset="100%" stopColor="#7E5220" />
      </linearGradient>
      <linearGradient id="woodRight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E6B873" />
        <stop offset="50%" stopColor="#C48E44" />
        <stop offset="100%" stopColor="#7E5220" />
      </linearGradient>
      <linearGradient id="springMetal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#DDDDDD" />
        <stop offset="50%" stopColor="#888888" />
        <stop offset="100%" stopColor="#444444" />
      </linearGradient>
    </defs>

    {/* Upper Wooden Pegs */}
    <path d="M 3.5 2 Q 4.5 1, 7.5 1 L 7.5 17 L 3.5 16 Z" fill="url(#woodLeft)" stroke="#261A10" strokeWidth="0.8" />
    <path d="M 12.5 1 Q 15.5 1, 16.5 2 L 16.5 16 L 12.5 17 Z" fill="url(#woodRight)" stroke="#261A10" strokeWidth="0.8" />

    {/* Central Steel Spring Coil */}
    <rect x="6" y="14" width="8" height="5" rx="1.5" fill="url(#springMetal)" stroke="#1A1A1A" strokeWidth="0.7" />
    <circle cx="10" cy="16.5" r="1.5" fill="#222222" />

    {/* Lower Clamping Jaws Over Paper & Rope */}
    <path d="M 3.5 19 L 7.5 19 L 7.5 36 L 5.5 37 Q 3.5 36, 3.5 33 Z" fill="url(#woodLeft)" stroke="#261A10" strokeWidth="0.8" />
    <path d="M 12.5 19 L 16.5 19 L 16.5 33 Q 16.5 36, 14.5 37 L 12.5 36 Z" fill="url(#woodRight)" stroke="#261A10" strokeWidth="0.8" />

    {/* Fine Woodgrain Textures */}
    <line x1="5.5" y1="4" x2="5.5" y2="11" stroke="#5E3915" strokeWidth="0.5" opacity="0.5" />
    <line x1="14.5" y1="4" x2="14.5" y2="12" stroke="#5E3915" strokeWidth="0.5" opacity="0.5" />
    <line x1="5.5" y1="23" x2="5.5" y2="32" stroke="#5E3915" strokeWidth="0.5" opacity="0.5" />
    <line x1="14.5" y1="23" x2="14.5" y2="31" stroke="#5E3915" strokeWidth="0.5" opacity="0.5" />
  </svg>
);

// Curved SVG Twisted Hemp Rope
const HangingRopeCurve = () => (
  <div className="absolute top-9 left-0 right-0 h-16 w-full z-0 select-none pointer-events-none overflow-visible">
    <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 65" preserveAspectRatio="none">
      <defs>
        <linearGradient id="hempStrand" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#69401F" />
          <stop offset="25%" stopColor="#A47242" />
          <stop offset="50%" stopColor="#C3935B" />
          <stop offset="75%" stopColor="#A47242" />
          <stop offset="100%" stopColor="#69401F" />
        </linearGradient>
      </defs>

      {/* Left End Fastener Peg */}
      <circle cx="12" cy="12" r="9" fill="#523218" stroke="#181716" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" fill="#B38350" />

      {/* Right End Fastener Peg */}
      <circle cx="988" cy="12" r="9" fill="#523218" stroke="#181716" strokeWidth="2" />
      <circle cx="988" cy="12" r="4.5" fill="#B38350" />

      {/* Rope Soft Drop Shadow */}
      <path d="M 12 12 Q 500 50 988 12" fill="none" stroke="#181716" strokeWidth="5.5" strokeOpacity="0.25" />

      {/* Main Hemp Rope Body */}
      <path d="M 12 12 Q 500 50 988 12" fill="none" stroke="url(#hempStrand)" strokeWidth="4.5" strokeLinecap="round" />

      {/* Twisted Fibers Pattern 1 */}
      <path d="M 12 12 Q 500 50 988 12" fill="none" stroke="#3D220E" strokeWidth="1.8" strokeDasharray="6 6" strokeLinecap="round" />

      {/* Twisted Fibers Pattern 2 (Golden Highlight) */}
      <path d="M 12 11 Q 500 49 988 11" fill="none" stroke="#F1D59F" strokeWidth="1.2" strokeDasharray="3 9" strokeLinecap="round" opacity="0.8" />
    </svg>
  </div>
);

export default function WidgetDocuments({ role, isSystemAdmin, groupId }) {
  const { t } = useTranslation();

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const [documents, setDocuments] = useState([]);
  const [varalCategories, setVaralCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const handleEdit = (docItem) => {
    setDocumentToEdit(docItem);
  };

  const handleDelete = async (docItem) => {
    const confirmMsg = translate('documents.deleteConfirm', "Voulez-vous vraiment supprimer ce document ?");
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
      alert(translate('documents.deleteError', "Erreur lors de la suppression du document."));
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
    const translation = t(`documents.${cat}`);
    if (translation === `documents.${cat}`) {
      return cat;
    }
    return translation;
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
        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
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
                <CordelCard key={category.id} variant="default" useExtremeBorder={true} className="pt-4 pb-8 relative overflow-visible bg-[#FEF9E7] dark:bg-[#1A1712] border-2 border-cordel-master-dark/30 rounded-xl shadow-[4px_6px_16px_rgba(24,23,22,0.12)] w-full my-5 transition-all">
                  {/* Category Title Stamp */}
                  <div className="text-left mb-1 pl-3 flex justify-between items-center pr-3 select-none relative z-20">
                    <div className="flex items-center gap-1.5">
                      <span className={`theme-stamp-badge theme-stamp-badge-${variant === 'ocre' || variant === 'vert' ? 'wood' : 'dark'} text-[8.5px] tracking-wider font-extrabold`}>
                        {getCategoryLabel(category.nom)}
                      </span>
                      {isAuthorized && (
                        <button
                          type="button"
                          onClick={() => setEditingCategory(category)}
                          className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm opacity-65 hover:opacity-100 transition-opacity"
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
                        📤 {translate('documents.publicUploadLink', "Partager vos photos/vidéos")}
                      </a>
                    )}
                  </div>

                  {/* Realistic Curved SVG Hemp Rope */}
                  <HangingRopeCurve />

                  {/* Hanging Booklets with Natural Sag Offset */}
                  <div className="flex flex-nowrap overflow-x-auto justify-start items-start gap-4 sm:gap-6 pt-11 pb-8 relative z-10 w-full no-scrollbar px-6 overflow-y-visible min-h-[220px]">
                    {docList.length === 0 ? (
                      <p className="text-[10px] italic opacity-60 self-center py-6 text-cordel-master-dark">{translate('documents.noDocumentsCategory', "Aucun document dans cette rubrique.")}</p>
                    ) : (
                      docList.map((docItem, index) => {
                        const totalDocs = Math.max(docList.length, 1);
                        const relPos = docList.length <= 1 ? 0.5 : (index / (totalDocs - 1));
                        // Parabolic vertical dip according to catenary sag (up to 35px in middle)
                        const dipY = Math.round(Math.sin(relPos * Math.PI) * 35);
                        const rotationDeg = index % 2 === 0 ? (-3.5 + (index % 3)) : (2.5 - (index % 2));

                        const isArchived = category.activerOpaciteArchive && docItem.annee && docItem.annee < currentYear;
                        const opacityClass = isArchived ? 'opacity-60 hover:opacity-100 transition-opacity duration-200' : 'opacity-100';

                        const docType = getDocType(docItem);
                        
                        let colorClass = 'default';
                        if (category.id === 'Administratif' || category.nom === 'Administratif') {
                          colorClass = 'bleu-ardoise'; // Exclusive slate grey for Administratif
                        } else {
                          colorClass = getDeterministicColor(docItem.id);
                        }
                        const typeIcons = {
                          pdf: '📄',
                          audio: '🎵',
                          image: '📷',
                          video: '🎥',
                          web: '🌐',
                          report: '📜'
                        };
                        const typeIcon = typeIcons[docType] || '📄';

                        return (
                          <div 
                            key={docItem.id}
                            onClick={() => {
                              if (docType === 'report') {
                                setSelectedReport(docItem);
                              } else {
                                window.open(docItem.fileUrl, '_blank');
                              }
                            }}
                            className={`
                              relative flex flex-col items-center group cursor-pointer
                              transition-all duration-300 origin-top shrink-0 flex-none
                              hover:z-30 hover:scale-105 hover:rotate-0
                              ${opacityClass}
                            `}
                            style={{ transform: `translateY(${dipY}px) rotate(${rotationDeg}deg)` }}
                            title={`${translate('common.open', "Ouvrir")} ${docItem.titre} ${isArchived ? '(' + translate('documents.archiveTag', "Archive") + ')' : ''}`}
                          >
                            {/* Wooden Clothespin (Pince à linge artisanale accrochée fermement sur la corde) */}
                            <WoodenClothespin className="absolute -top-7 z-30 pointer-events-none" />

                            {/* Booklet Cover */}
                            <div 
                              className={`
                                relative w-32 h-44 border-2 border-encre-noire p-3 flex flex-col justify-between text-left
                                bg-cordel-bg-light shadow-[4px_4px_0px_0px_#181716]
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
                                    title={translate('common.edit', "Modifier")}
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
                                    title={translate('common.delete', "Supprimer")}
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
                                  {translate('documents.readBtn', "Lire ➜")}
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

      {/* Modale de lecture du Compte-Rendu (Varal / Cordel) */}
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
                {translate('common.close', "Fermer")}
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
