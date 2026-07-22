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
  if (!docId) return 'kraft';
  // Exclude bleu and bleu-ardoise (reserved exclusively for Administrative documents)
  const colors = ['vert', 'ocre', 'rouge', 'jaune', 'kraft', 'orange'];
  let hash = 0;
  for (let i = 0; i < docId.length; i++) {
    hash = docId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Realistic Wooden Clothespin (Pince à linge artisanale en bois)
// Realistic 3D Wooden Clothespin (Pince à linge artisanale en bois)
const WoodenClothespin = ({ className = "" }) => (
  <svg 
    width="22" 
    height="42" 
    viewBox="0 0 22 42" 
    fill="none" 
    className={`select-none drop-shadow-[1px_2px_3px_rgba(24,23,22,0.5)] ${className}`}
  >
    <defs>
      <linearGradient id="woodLeft" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E2B274" />
        <stop offset="40%" stopColor="#C48E44" />
        <stop offset="100%" stopColor="#7E5220" />
      </linearGradient>
      <linearGradient id="woodRight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F1C78B" />
        <stop offset="40%" stopColor="#D4A359" />
        <stop offset="100%" stopColor="#825220" />
      </linearGradient>
      <linearGradient id="springMetal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#EEEEEE" />
        <stop offset="50%" stopColor="#999999" />
        <stop offset="100%" stopColor="#444444" />
      </linearGradient>
    </defs>

    {/* Top Wooden Handles (Above rope) */}
    <path d="M 4 2 Q 5 1, 8.5 1 L 8.5 18 L 4 17 Z" fill="url(#woodLeft)" stroke="#261A10" strokeWidth="0.9" />
    <path d="M 13.5 1 Q 17 1, 18 2 L 18 17 L 13.5 18 Z" fill="url(#woodRight)" stroke="#261A10" strokeWidth="0.9" />

    {/* Central Steel Spring Coil */}
    <rect x="6.5" y="15" width="9" height="5.5" rx="1.8" fill="url(#springMetal)" stroke="#1A1A1A" strokeWidth="0.8" />
    <circle cx="11" cy="17.7" r="1.6" fill="#1A1A1A" />

    {/* Lower Wooden Jaws (Clamping Paper Cover & Rope Notch) */}
    <path d="M 4 21 L 8.5 21 L 8.5 40 L 6.5 41 Q 4 40, 4 36 Z" fill="url(#woodLeft)" stroke="#261A10" strokeWidth="0.9" />
    <path d="M 13.5 21 L 18 21 L 18 36 Q 18 40, 15.5 41 L 13.5 40 Z" fill="url(#woodRight)" stroke="#261A10" strokeWidth="0.9" />

    {/* Woodgrain accents */}
    <line x1="6" y1="4" x2="6" y2="12" stroke="#5E3915" strokeWidth="0.6" opacity="0.45" />
    <line x1="16" y1="4" x2="16" y2="13" stroke="#5E3915" strokeWidth="0.6" opacity="0.45" />
    <line x1="6" y1="25" x2="6" y2="36" stroke="#5E3915" strokeWidth="0.6" opacity="0.45" />
    <line x1="16" y1="25" x2="16" y2="35" stroke="#5E3915" strokeWidth="0.6" opacity="0.45" />
  </svg>
);

// Curved SVG Twisted Hemp Rope (Sagging catenary 3D textured hemp rope)
const HangingRopeCurve = () => (
  <div className="absolute top-[44px] left-0 right-0 h-8 w-full z-0 select-none pointer-events-none overflow-visible">
    <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="hempMain" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6E4420" />
          <stop offset="25%" stopColor="#A47442" />
          <stop offset="50%" stopColor="#E0B67C" />
          <stop offset="75%" stopColor="#A47442" />
          <stop offset="100%" stopColor="#6E4420" />
        </linearGradient>
        <linearGradient id="hempHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4A26A" />
          <stop offset="50%" stopColor="#FFF3D4" />
          <stop offset="100%" stopColor="#D4A26A" />
        </linearGradient>
      </defs>

      {/* Left Wall Hook / Knot */}
      <rect x="2" y="2" width="14" height="12" rx="3" fill="#3D220E" stroke="#181716" strokeWidth="1.5" />
      <circle cx="9" cy="8" r="3" fill="#E0B67C" />

      {/* Right Wall Hook / Knot */}
      <rect x="984" y="2" width="14" height="12" rx="3" fill="#3D220E" stroke="#181716" strokeWidth="1.5" />
      <circle cx="991" cy="8" r="3" fill="#E0B67C" />

      {/* 1. Drop Shadow under Curved Sagging Rope */}
      <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="#181716" strokeWidth="7" strokeOpacity="0.22" strokeLinecap="round" />

      {/* 2. Dark Rope Outline/Core */}
      <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="#3D220E" strokeWidth="6" strokeLinecap="round" />

      {/* 3. Lighter Warm Natural Hemp Body */}
      <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="url(#hempMain)" strokeWidth="4.5" strokeLinecap="round" />

      {/* 4. Twisted Fiber Strands (Woven depth) */}
      <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="#2B1607" strokeWidth="2.2" strokeDasharray="7 4" strokeLinecap="round" opacity="0.9" />

      {/* 5. Fine Natural Fiber Specks / Micro-dots */}
      <path d="M 9 8 Q 500 28, 991 8" fill="none" stroke="#523214" strokeWidth="1.8" strokeDasharray="1.5 5" strokeLinecap="round" opacity="0.8" />

      {/* 6. Golden Fiber Strand Highlights */}
      <path d="M 9 7.5 Q 500 27.5, 991 7.5" fill="none" stroke="url(#hempHighlight)" strokeWidth="1.2" strokeDasharray="4 6" strokeLinecap="round" opacity="0.9" />
      <path d="M 9 7 Q 500 27, 991 7" fill="none" stroke="#FFF7E6" strokeWidth="1" strokeDasharray="1 7" strokeLinecap="round" opacity="0.75" />
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
                <CordelCard key={category.id} variant="default" useExtremeBorder={true} className="pt-3 pb-4 relative overflow-hidden bg-[#FEF9E7] dark:bg-[#1A1712] border-2 border-cordel-master-dark/30 rounded-xl shadow-[4px_6px_16px_rgba(24,23,22,0.12)] w-full my-4 transition-all">
                  {/* Category Title Stamp */}
                  <div className="text-left mb-2 pl-3 flex justify-between items-center pr-3 select-none relative z-20">
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

                  {/* Realistic 3D Hemp Rope */}
                  <HangingRopeCurve />

                  {/* Hanging Booklets Directly Mounted on Rope Line */}
                  <div className="flex flex-nowrap overflow-x-auto overflow-y-hidden justify-start items-start gap-4 sm:gap-6 pt-5 pb-3 relative z-10 w-full no-scrollbar px-6 min-h-[200px]">
                    {docList.length === 0 ? (
                      <p className="text-[10px] italic opacity-60 self-center py-6 text-cordel-master-dark">{translate('documents.noDocumentsCategory', "Aucun document dans cette rubrique.")}</p>
                    ) : (
                      docList.map((docItem, index) => {
                        const rotationDeg = index % 2 === 0 ? (-3 + (index % 3)) : (2.5 - (index % 2));

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
                            style={{ transform: `rotate(${rotationDeg}deg)` }}
                            title={`${translate('common.open', "Ouvrir")} ${docItem.titre} ${isArchived ? '(' + translate('documents.archiveTag', "Archive") + ')' : ''}`}
                          >
                            {/* Wooden Clothespin (Pince à linge 3D mordant la corde et le haut du livret) */}
                            <WoodenClothespin className="absolute -top-[16px] z-30 pointer-events-none" />

                            {/* Booklet Cover */}
                            <div 
                              className={`
                                relative w-32 h-44 border-2 border-encre-noire p-3 flex flex-col justify-between text-left
                                bg-cordel-bg-light shadow-[4px_4px_0px_0px_#181716]
                                rounded-[4px_10px_3px_8px]
                                border-l-4 border-l-double
                                theme-bg-${colorClass}
                                overflow-hidden
                              `}
                            >
                              {/* Wood Grain Xylogravure Texture Overlay (Les veines et stries du bois gravé) */}
                              <div 
                                className="absolute inset-0 pointer-events-none opacity-[0.16] mix-blend-multiply select-none"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23181716' stroke-linecap='round'%3E%3Cpath d='M6 0 V120 M17 0 Q22 40 17 80 T17 120 M31 0 V120 M43 0 Q39 50 43 100 V120 M56 0 V120 M70 0 Q74 30 70 85 V120 M85 0 V120 M98 0 Q94 60 98 110 V120 M110 0 V120' stroke-width='1.1' stroke-dasharray='9 3 18 5'/%3E%3Cpath d='M11 0 V120 M25 0 V120 M49 0 V120 M63 0 V120 M78 0 V120 M92 0 V120 M104 0 V120' stroke-width='0.6' stroke-dasharray='4 7 12 6' opacity='0.7'/%3E%3Cpath d='M42 35 C42 28, 48 24, 55 28 C62 32, 59 41, 51 42 C44 43, 42 37, 42 35 Z' stroke-width='1' opacity='0.6'/%3E%3Cpath d='M45 35 C45 31, 49 28, 54 31 C59 34, 57 39, 51 40 C46 41, 45 37, 45 35 Z' stroke-width='0.6' opacity='0.4'/%3E%3C/g%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'repeat'
                                }}
                              />
                              {/* Aged Cordel Paper Patina Gradient Overlay */}
                              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-200/15 via-transparent to-black/20 select-none" />
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
