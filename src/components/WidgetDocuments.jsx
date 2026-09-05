import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { XiloChisel } from './XiloIcons';
import { getInstrumentStamp } from './InstrumentStampSVG';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import DocumentUploadForm from './DocumentUploadForm';
import SongCard from './SongCard';
import CultureCard from './CultureCard';
import FabricationCard from './FabricationCard';
import SeloAxeStamp from './SeloAxeStamp';
import InstrumentModelCard from './InstrumentModelCard';
import PrintConfigModal from './PrintConfigModal';
import { createPortal } from 'react-dom';

import { useTranslation } from './LanguageContext';
import useConfirm from '../hooks/useConfirm';
import ReunionViewModal from './ReunionViewModal';
import { projectWorkshopBooklets, isWorkshopVirtualDoc } from '../utils/workshopProjectionUtils';

export const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Toadas', nom: 'Toadas', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutorielsVideo', nom: 'Tutoriels Vidéo', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutosFabrication', nom: 'Tutos Fabrication', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'PhotosPrestations', nom: 'Photos Prestations', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'ComptesRendus', nom: 'Comptes-rendus', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true },
  { id: 'Administratif', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false }
];

/**
 * Table de correspondance par défaut reliant chaque pôle métier à ses cordes natives du Varal.
 */
export const DEFAULT_POLE_ROPES = {
  pedagogie: ['Toadas', 'Culture', 'TutorielsVideo'],
  secretariat: ['Administratif', 'ComptesRendus'],
  studio: ['PhotosPrestations'],
  lutherie: ['TutosFabrication']
};

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
const HangingRopeCurve = ({ className = "absolute top-[44px] left-0 right-0 h-8 w-full z-0 select-none pointer-events-none overflow-visible" }) => (
  <div className={className}>
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

export default function WidgetDocuments({ 
  role, 
  isSystemAdmin, 
  groupId, 
  user, 
  profileData,
  poleId = null,
  userTags = null,
  canWrite = false,
  onNavigateToView = null
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const [documents, setDocuments] = useState([]);
  const [varalCategories, setVaralCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState(null);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [eventsWithMedia, setEventsWithMedia] = useState([]);
  const [reunions, setReunions] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedToada, setSelectedToada] = useState(null);
  const [selectedCultureCard, setSelectedCultureCard] = useState(null);
  const [selectedFabrication, setSelectedFabrication] = useState(null);
  const [selectedInstrumentModel, setSelectedInstrumentModel] = useState(null);
  const [selectedReunion, setSelectedReunion] = useState(null);
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);
  const [instrumentModels, setInstrumentModels] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printCategory, setPrintCategory] = useState(null);
  const [printSections, setPrintSections] = useState(null);

  // Culture filtrer state
  const [cultureFilter, setCultureFilter] = useState('all');

  const CULTURE_THEMES = [
    { id: 'all', label: translate('docs.themeAll', 'Toute la Culture'), icon: <span className="text-[12px] md:text-sm pt-0.5">✨</span> },
    {
      id: 'orixás',
      label: translate('docs.themeOrixas', 'Orixás'),
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5">
          <defs>
            <mask id="icon-mask-orixa">
              <rect width="100" height="100" fill="white" />
              <g stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="39" y1="36" x2="39" y2="52" strokeDasharray="3 3" />
                <line x1="44" y1="34" x2="44" y2="57" strokeDasharray="3 3" />
                <line x1="51" y1="35" x2="51" y2="60" strokeDasharray="3 3" />
                <line x1="57" y1="34" x2="57" y2="56" strokeDasharray="3 3" />
                <circle cx="60" cy="22" r="2" fill="black" stroke="none" />
                <path d="M 45 28 L 55 28" fill="none" strokeWidth="1.5" />
              </g>
            </mask>
          </defs>
          <path fill="currentColor" mask="url(#icon-mask-orixa)" d="M 50 3 L 44 14 L 36 24 L 38 31 L 31 39 L 34 46 L 24 50 L 19 63 L 12 90 L 88 90 L 83 66 L 74 49 L 66 44 L 69 37 L 62 31 L 64 26 L 57 13 Z" />
        </svg>
      )
    },
    {
      id: 'cuisine',
      label: 'Cuisine',
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5">
          <defs>
            <mask id="icon-mask-cuisine">
              <rect width="100" height="100" fill="white" />
              <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 30 75 Q 50 85 70 75" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 35 65 Q 50 75 65 65" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <line x1="25" y1="50" x2="75" y2="50" strokeWidth="1" strokeDasharray="2 2" />
              </g>
            </mask>
          </defs>
          <path fill="currentColor" mask="url(#icon-mask-cuisine)" d="M 20 50 L 25 80 C 30 90 70 90 75 80 L 80 50 Z M 15 40 C 15 35 85 35 85 40 L 80 45 L 20 45 Z M 10 40 C 5 40 5 50 10 50 C 15 50 15 40 10 40 Z M 90 40 C 95 40 95 50 90 50 C 85 50 85 40 90 40 Z M 40 30 Q 30 15 40 5 Q 50 15 40 30 M 60 35 Q 50 20 60 10 Q 70 20 60 35" />
        </svg>
      )
    },
    {
      id: 'histoire',
      label: 'Histoire',
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5">
          <defs>
            <mask id="icon-mask-histoire">
              <rect width="100" height="100" fill="white" />
              <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="50" y1="32" x2="50" y2="72" strokeWidth="3" />
                <path d="M 15 30 Q 30 35 45 40" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 15 45 Q 30 50 45 55" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 15 60 Q 30 65 45 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 85 30 Q 70 35 55 40" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 85 45 Q 70 50 55 55" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 85 60 Q 70 65 55 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              </g>
            </mask>
          </defs>
          <path fill="currentColor" mask="url(#icon-mask-histoire)" d="M 10 20 L 45 30 L 50 32 L 55 30 L 90 20 L 90 80 L 55 70 L 55 90 L 50 85 L 45 90 L 45 70 L 10 80 Z" />
        </svg>
      )
    },
    {
      id: 'musique',
      label: 'Musique',
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5">
          <defs>
            <mask id="icon-mask-musique">
              <rect width="100" height="100" fill="white" />
              <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="10" y1="50" x2="90" y2="50" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="10" y1="40" x2="90" y2="40" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="10" y1="60" x2="90" y2="60" strokeWidth="2" strokeDasharray="5 5" />
              </g>
            </mask>
          </defs>
          <path fill="currentColor" mask="url(#icon-mask-musique)" d="M 20 80 C 20 65 40 65 40 80 C 40 95 20 95 20 80 Z M 60 70 C 60 55 80 55 80 70 C 80 85 60 85 60 70 Z M 32 75 L 32 20 L 72 10 L 72 65 L 65 65 L 65 22 L 40 28 L 40 75 Z" />
        </svg>
      )
    },
    {
      id: 'cortège',
      label: 'Cortège',
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5">
          <defs>
            <mask id="icon-mask-cortejo">
              <rect width="100" height="100" fill="white" />
              <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 25 85 Q 50 75 75 85" fill="none" strokeWidth="3" strokeDasharray="5 3" />
                <path d="M 32 75 Q 50 65 68 75" fill="none" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="45" y1="50" x2="40" y2="80" strokeDasharray="2 2" />
                <line x1="55" y1="50" x2="60" y2="80" strokeDasharray="2 2" />
              </g>
            </mask>
          </defs>
          <path fill="currentColor" mask="url(#icon-mask-cortejo)" d="M 50 5 A 8 8 0 1 0 50 21 A 8 8 0 1 0 50 5 Z M 48 23 L 30 40 L 25 35 L 20 40 L 35 55 L 43 45 L 35 85 L 15 90 L 20 95 L 80 95 L 85 90 L 65 85 L 57 45 L 65 55 L 80 40 L 75 35 L 70 40 L 52 23 Z" />
        </svg>
      )
    },
    {
      id: 'territoire',
      label: 'Territoire',
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5">
          <defs>
            <mask id="icon-mask-territoire">
              <rect width="100" height="100" fill="white" />
              <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="35" y1="15" x2="35" y2="75" strokeWidth="2.5" />
                <line x1="65" y1="25" x2="65" y2="85" strokeWidth="2.5" />
                <path d="M 25 45 Q 50 30 75 65" fill="none" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="75" cy="65" r="4" fill="black" stroke="none" />
                <circle cx="25" cy="45" r="4" fill="black" stroke="none" />
              </g>
            </mask>
          </defs>
          <path fill="currentColor" mask="url(#icon-mask-territoire)" d="M 15 25 L 35 15 L 65 25 L 85 15 L 85 75 L 65 85 L 35 75 L 15 85 Z" />
        </svg>
      )
    },
    {
      id: 'folklore',
      label: 'Folklore',
      icon: (
        <svg viewBox="0 0 100 100" className="w-5 h-5">
          <defs>
            <mask id="icon-mask-folklore">
              <rect width="100" height="100" fill="white" />
              <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="42" cy="55" r="4" fill="black" stroke="none" />
                <circle cx="58" cy="55" r="4" fill="black" stroke="none" />
                <path d="M 50 35 L 52 40 L 57 40 L 53 43 L 55 48 L 50 45 L 45 48 L 47 43 L 43 40 L 48 40 Z" fill="black" stroke="none" />
                <path d="M 45 75 Q 50 85 55 75" fill="none" strokeWidth="2" strokeDasharray="2 2" />
              </g>
            </mask>
          </defs>
          <path fill="currentColor" mask="url(#icon-mask-folklore)" d="M 30 15 C 20 15 15 25 15 40 C 15 35 25 35 35 45 C 35 60 45 90 50 90 C 55 90 65 60 65 45 C 75 35 85 35 85 40 C 85 25 80 15 70 15 C 60 15 55 30 50 30 C 45 30 40 15 30 15 Z" />
        </svg>
      )
    }
  ];

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
      setPrintCategory(null);
    }, 100);
  };

  const handleEdit = (docItem) => {
    setDocumentToEdit(docItem);
  };

  const handleDelete = async (docItem) => {
    const confirmMsg = translate('documents.deleteConfirm', "Voulez-vous vraiment supprimer ce document ?");
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
    if (!cat) return '';
    if (typeof cat === 'string') return cat;
    return cat.nom || cat.id || '';
  };

  const getDocType = (docItem) => {
    if (docItem.type) return docItem.type;
    const cat = (docItem.categorie || '').toLowerCase();
    if (cat.includes('toada')) return 'song';
    if (cat.includes('culture') || cat.includes('fiche')) return 'culture_fiche';
    
    const url = docItem.fileUrl || '';
    if (url.includes('drive.google.com/drive/folders') || url.includes('dropbox.com') || url.includes('onedrive')) return 'dossier_externe';
    if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a')) return 'audio';
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) return 'video';
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.svg') || url.includes('.webp')) return 'image';
    if (url.startsWith('http') && !url.includes('.pdf')) return 'web';
    return 'pdf'; // default fallback
  };


  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // Synchronisation en temps réel avec la collection Firestore des documents
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

      // Trier par ordre croissant, puis par date d'ajout descendante
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

  // Synchronisation des Modèles d'Instruments
  useEffect(() => {
    if (!groupId) {
      setInstrumentModels([]);
      return;
    }
    const modelsRef = collection(db, 'instrument_models');
    const qModels = query(modelsRef, where('groupId', '==', groupId));
    const unsubscribeModels = onSnapshot(qModels, (querySnapshot) => {
      const fetchedModels = [];
      querySnapshot.forEach((docSnap) => {
        fetchedModels.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setInstrumentModels(fetchedModels);
    }, (error) => {
      console.error("WidgetDocuments - Erreur onSnapshot models :", error);
    });

    return () => unsubscribeModels();
  }, [groupId]);

  // Synchroniser les événements pour extraire les dépôts médias vers "PhotosPrestations" et récupérer les réunions
  useEffect(() => {
    if (!groupId) {
      setEventsWithMedia([]);
      setReunions([]);
      return;
    }
    const eventsRef = collection(db, 'events');
    const qEvents = query(eventsRef, where('groupId', '==', groupId));
    const unsubscribeEvents = onSnapshot(qEvents, (querySnapshot) => {
      const fetchedEvents = [];
      const fetchedReunions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lienDepotMedias || data.albumPhotosUrl) {
          fetchedEvents.push({ id: doc.id, ...data });
        }
        if (data.type === 'reunion' && data.date) {
          fetchedReunions.push({ id: doc.id, ...data });
        }
      });
      setEventsWithMedia(fetchedEvents);
      setReunions(fetchedReunions);
    }, (error) => {
      console.error("WidgetDocuments - Erreur onSnapshot events :", error);
    });

    return () => unsubscribeEvents();
  }, [groupId]);

  // Synchroniser varalCategories depuis la configuration de l'association
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
          const rawCats = data.varalCategories;
          const mergedCats = DEFAULT_VARAL_CATEGORIES.map(defaultCat => {
            const customCat = rawCats.find(c => c.id === defaultCat.id) || rawCats.find(c => c.nom === defaultCat.nom);
            if (customCat) {
              return { ...defaultCat, ...customCat, id: defaultCat.id }; // Force the native ID
            }
            return defaultCat;
          });
          setVaralCategories(mergedCats);
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

  // 1. Identification globale du tout dernier document ajouté sur l'ensemble du Varal (toutes catégories confondues)
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

  // Groupement des documents par catégorie en JavaScript
  const groupedDocs = useMemo(() => {
    const groups = {};
    const allDocs = [...documents];

    allDocs.forEach((docItem) => {
      // Recherche de la catégorie correspondante par priorité : categoryId d'abord, puis nom, puis id
      const catObj = (docItem.categoryId && varalCategories.find(c => c.id === docItem.categoryId))
        || (docItem.categorie && varalCategories.find(c => c.nom === docItem.categorie))
        || (docItem.categorie && varalCategories.find(c => c.id === docItem.categorie));
      let catId = catObj ? catObj.id : 'Autre';

      // MIGRATION FORCÉE FRONT-END : Nettoyage du varal Administratif
      if (catId === 'Administratif') {
        const titre = (docItem.titre || '').toLowerCase();
        const isCoreAdmin = titre.includes('compo ca') || titre.includes('règlement') || titre.includes('reglement') || titre.includes('statut') || titre.includes('rib');

        if (!isCoreAdmin) {
          // Tous les autres (dont ceux qui commencent par CR) sont basculés sur ComptesRendus
          catId = 'ComptesRendus';
        }
      }

      if (!docItem.isHidden) {
        if (!groups[catId]) {
          groups[catId] = [];
        }
        groups[catId].push(docItem);
      }
    });

    // Injection des dépôts médias des événements dans le varal "PhotosPrestations"
    if (eventsWithMedia && eventsWithMedia.length > 0) {
      if (!groups['PhotosPrestations']) {
        groups['PhotosPrestations'] = [];
      }
      eventsWithMedia.forEach(ev => {
        // Éviter les doublons si un document Firestore réel existe déjà pour cet événement
        const alreadyExists = groups['PhotosPrestations'].some(d => d.eventId === ev.id);
        if (!alreadyExists) {
          const targetUrl = ev.albumPhotosUrl || ev.lienDepotMedias;
          if (targetUrl) {
            groups['PhotosPrestations'].push({
              id: `event-media-${ev.id}`,
              titre: `[Album] ${ev.titre || 'Événement'}`,
              fileUrl: targetUrl,
              categorie: 'PhotosPrestations',
              categoryId: 'PhotosPrestations',
              type: 'dossier_externe',
              dateAjout: ev.dateDebut || ev.createdAt || new Date().toISOString(),
              description: ev.albumPhotosUrl
                ? `Album photos finalisé de l'événement du ${new Date(ev.dateDebut || Date.now()).toLocaleDateString('fr-FR')}.`
                : `Dossier partagé pour consulter et déposer des médias liés à l'événement du ${new Date(ev.dateDebut || Date.now()).toLocaleDateString('fr-FR')}.`,
              isVirtualEventMedia: true,
              eventId: ev.id,
            });
          }
        }
      });

      // Retrier "PhotosPrestations" par date
      groups['PhotosPrestations'].sort((a, b) => {
        const dateA = new Date(a.dateAjout || 0).getTime();
        const dateB = new Date(b.dateAjout || 0).getTime();
        return dateB - dateA;
      });
    }

    // Injection des réunions en tant que brouillons ou comptes-rendus dans le varal "ComptesRendus"
    if (reunions && reunions.length > 0) {
      if (!groups['ComptesRendus']) {
        groups['ComptesRendus'] = [];
      }
      reunions.forEach(reunion => {
        const eventDate = new Date(reunion.date);
        const now = new Date();
        // Considère la réunion comme passée si la date de fin est dépassée
        // On se base sur la date du jour (simplification)
        const isPast = eventDate <= now;
        const isPublished = (reunion.compteRenduStatus === 'publie');
        
        let isHidden = false;
        if (isPast && !isPublished) {
          isHidden = true; // Caché aux membres normaux, visible uniquement par CA
        }

        const pad = (n) => n.toString().padStart(2, '0');
        const formattedDate = `${pad(eventDate.getDate())}-${pad(eventDate.getMonth() + 1)}-${eventDate.getFullYear()}`;

        if (!isHidden || isAuthorized) {
          groups['ComptesRendus'].push({
            id: reunion.id,
            titre: `CR du ${formattedDate}`,
            type: 'reunion',
            typeDoc: 'reunion',
            date: reunion.date,
            isHidden: isHidden,
            isPast: isPast,
            isPublished: isPublished,
            isArchived: false,
            order: 0,
            reunionData: reunion // Stocker les données pour la modale
          });
        }
      });
    }

    // Trier "ComptesRendus" par date décroissante (les plus récents / futurs en premier)
    if (groups['ComptesRendus']) {
      groups['ComptesRendus'].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : new Date(a.createdAt || 0).getTime();
        const dateB = b.date ? new Date(b.date).getTime() : new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }

    // Projection dynamique en mémoire des modèles d'atelier et de leurs pièces dans "TutosFabrication"
    const workshopBooklets = projectWorkshopBooklets(instrumentModels);
    if (workshopBooklets && workshopBooklets.length > 0) {
      if (!groups['TutosFabrication']) {
        groups['TutosFabrication'] = [];
      }
      workshopBooklets.forEach((booklet) => {
        groups['TutosFabrication'].push(booklet);
      });
    }

    return groups;
  }, [documents, instrumentModels, varalCategories, eventsWithMedia, reunions]);

  // Résolution des badges / étiquettes effectifs de l'utilisateur
  const effectiveTags = useMemo(() => {
    if (Array.isArray(userTags) && userTags.length > 0) return userTags;
    if (Array.isArray(profileData?.tags)) return profileData.tags;
    return [];
  }, [userTags, profileData?.tags]);

  // Filtrage des catégories selon le pôle actif et les autorisations de badges
  const visibleCategories = useMemo(() => {
    return varalCategories.filter((category) => {
      // 1. Filtrage par pôle
      if (poleId) {
        const catPole = category.poleId || Object.keys(DEFAULT_POLE_ROPES).find(p => DEFAULT_POLE_ROPES[p].includes(category.id));
        if (catPole !== poleId) return false;
      }

      // 2. Filtrage par badge / allowedTags (Bypass Super-Admin, Mestre et isSystemAdmin)
      if (isAuthorized) return true;
      if (!category.allowedTags || category.allowedTags.length === 0) return true;

      return effectiveTags.some(userTag => {
        const uTag = (typeof userTag === 'string' ? userTag : (userTag.id || userTag.nomM || userTag.nomF || '')).toLowerCase().trim();
        return category.allowedTags.some(catTag => {
          const cTag = (typeof catTag === 'string' ? catTag : (catTag.id || catTag.nomM || catTag.nomF || '')).toLowerCase().trim();
          return uTag === cTag;
        });
      });
    });
  }, [varalCategories, poleId, isAuthorized, effectiveTags]);

  const categoryVariants = {
    'Partitions': 'ocre',
    'Tutoriels': 'vert',
    'Culture': 'ocre',
    'Administratif': 'rouge',
    'DocumentsFixes': 'bleu'
  };

  // Gestionnaire d'ouverture du dépôt direct sur une corde spécifique
  const handleOpenAddForCategory = (cat) => {
    setSelectedCategoryForAdd(cat);
    setDocumentToEdit(null);
    setIsAdding(true);
  };

  // Vérifie si l'utilisateur a les droits de dépôt/écriture sur une corde
  const canDepositOnCategory = (category) => {
    // 0. Si l'upload public est explicitement activé pour cette catégorie
    if (category.activerUploadPublic) return true;

    // 1. Bypass administrateurs et maîtres
    if (isAuthorized) return true;

    // 2. Si l'utilisateur possède l'accès en écriture au pôle (canWrite)
    if (canWrite) {
      if (!category.allowedTags || category.allowedTags.length === 0) return true;
      return effectiveTags.some(uTag => {
        return category.allowedTags.some(catTag => {
          const cTag = (typeof catTag === 'string' ? catTag : (catTag.id || catTag.nomM || catTag.nomF || '')).toLowerCase().trim();
          return uTag === cTag;
        });
      });
    }

    // 3. Si la catégorie possède des badges autorisés et que l'utilisateur en possède au moins un
    if (category.allowedTags && category.allowedTags.length > 0) {
      return effectiveTags.some(uTag => {
        return category.allowedTags.some(catTag => {
          const cTag = (typeof catTag === 'string' ? catTag : (catTag.id || catTag.nomM || catTag.nomF || '')).toLowerCase().trim();
          return uTag === cTag;
        });
      });
    }

    return false;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Barre de titre et action globale */}
      <div className="flex justify-between items-center pl-1 pr-1">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left">
          {t('widgetDocuments.title')}
        </h3>
        {!loading && (isAuthorized || canWrite) && !isAdding && poleId !== 'secretariat' && poleId !== 'pedagogie' && (
          <CordelButton
            variant="default"
            onClick={() => {
              setSelectedCategoryForAdd(null);
              setDocumentToEdit(null);
              setIsAdding(true);
            }}
            className="text-[10px] px-2 py-1 uppercase tracking-widest font-black"
          >
            {t('widgetDocuments.uploadBtn')}
          </CordelButton>
        )}
      </div>

      {/* Chargement de state */}
      {loading && (
        <div className="flex justify-center items-center py-6">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      )}

      {/* Vue formulaire d'upload ou édition avec bouton retour en tête */}
      {!loading && (isAdding || documentToEdit) && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-start select-none">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setDocumentToEdit(null);
                setSelectedCategoryForAdd(null);
              }}
              className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <span>⬅️</span>
              <span>{t('common.back') || "Retour au Varal"}</span>
            </button>
          </div>

          <DocumentUploadForm
            groupId={groupId}
            varalCategories={visibleCategories.length > 0 ? visibleCategories : varalCategories}
            documentToEdit={documentToEdit}
            initialCategoryId={selectedCategoryForAdd ? selectedCategoryForAdd.id : undefined}
            lockCategory={!!selectedCategoryForAdd}
            onClose={() => {
              setIsAdding(false);
              setDocumentToEdit(null);
              setSelectedCategoryForAdd(null);
            }}
          />
        </div>
      )}

      {/* Documents Clothesline View (grouped by category) */}
      {!loading && !isAdding && !documentToEdit && (
        visibleCategories.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-6 text-center bg-cordel-bg">
            <p className="text-xs font-bold text-cordel-master-dark opacity-75">
              Aucun document ou corde accessible dans ce pôle.
            </p>
          </CordelCard>
        ) : (<div className="flex flex-col gap-4 w-full">
          {visibleCategories.map((category) => {
            let docList = groupedDocs[category.id] || [];
            const variant = categoryVariants[category.id] || 'default';
            const currentYear = new Date().getFullYear();

            if (category.id === 'Culture' && cultureFilter !== 'all') {
              docList = docList.filter(d => {
                if (d.type !== 'culture_fiche') return false;
                const dCat = (d.categorieFiche || '').toLowerCase();
                const dTheme = (d.themeCulture || '').toLowerCase();
                const filterCat = cultureFilter.toLowerCase();

                if (filterCat === 'all') {
                  // Do nothing, true for all
                } else if (filterCat === 'cuisine') {
                  if (!dCat.includes('cuisine') && !dTheme.includes('cuisine') && !dCat.includes('recette') && !dTheme.includes('gastronomi')) return false;
                } else if (filterCat === 'cortège') {
                  if (!dCat.includes('cour') && !dCat.includes('personnage') && !dCat.includes('cortège') && !dTheme.includes('cortejo') && !dTheme.includes('cortège')) return false;
                } else if (filterCat === 'orixás') {
                  if (!dCat.includes('orix') && !dCat.includes('spirit') && !dTheme.includes('orixa')) return false;
                } else if (filterCat === 'histoire') {
                  if (!dCat.includes('histoire') && !dCat.includes('origine') && !dTheme.includes('histoire')) return false;
                } else if (filterCat === 'musique') {
                  if (!dCat.includes('musique') && !dTheme.includes('musique')) return false;
                } else if (filterCat === 'territoire') {
                  if (!dCat.includes('territoire') && !dTheme.includes('territoire') && !dCat.includes('géographie') && !dCat.includes('lieu')) return false;
                } else if (filterCat === 'folklore') {
                  if (!dCat.includes('folklore') && !dTheme.includes('folklore')) return false;
                } else {
                  if (dCat !== filterCat && dTheme !== filterCat) return false;
                }
                return true;
              });
            }

            return (
              <CordelCard key={category.id} variant="default" useExtremeBorder={true} className="pt-3 pb-4 relative overflow-hidden bg-[#FEF9E7] dark:bg-[#1A1712] border-2 border-cordel-master-dark/30 rounded-xl shadow-[4px_6px_16px_rgba(24,23,22,0.12)] w-full my-4 transition-all">
                {/* Category Title Stamp & Filters */}
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2 mb-2 pl-3 pr-3 select-none relative z-20">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`theme-stamp-badge theme-stamp-badge-${variant === 'ocre' || variant === 'vert' ? 'wood' : 'dark'} text-[8.5px] tracking-wider font-extrabold`}>
                      {getCategoryLabel(category.nom)}
                    </span>

                    {/* Bouton "+ Déposer" compact par corde */}
                    {canDepositOnCategory(category) && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddForCategory(category)}
                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[3px_5px_2px_4px] bg-[var(--color-cordel-vert,#2d6a4f)] text-[#FEF9E7] border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer select-none flex items-center gap-1 transition-all"
                        title={`Déposer un document sur la corde ${category.nom}`}
                      >
                        <span className="text-[11px] leading-none">+</span>
                        <span>{t('widgetDocuments.addShort') || "Déposer"}</span>
                      </button>
                    )}

                    {(category.id === 'TutosFabrication' || category.nom === 'Tutos Fabrication') && onNavigateToView && (canWrite || isAuthorized) && (
                      <button
                        type="button"
                        onClick={() => onNavigateToView('instrument-models')}
                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[3px_5px_2px_4px] bg-[var(--color-cordel-ocre,#c05621)] text-[#FEF9E7] border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer select-none flex items-center gap-1 transition-all"
                        title="Ouvrir l'éditeur de gabarits et de pièces dans l'Atelier Lutherie"
                      >
                        <span>🛠️ Modèles d'Atelier</span>
                        <span>➜</span>
                      </button>
                    )}

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

                    {/* THEME ICONS (ONLY FOR CULTURE) */}
                    {category.id === 'Culture' && (
                      <div className="flex flex-wrap gap-1 items-center bg-[#fdfaf2] border border-encre-noire/20 p-1 rounded-md shadow-sm md:ml-2">
                        {CULTURE_THEMES.map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => setCultureFilter(theme.id)}
                            className={`text-[12px] md:text-sm px-1.5 py-1 rounded flex items-center justify-center transition-all ${cultureFilter === theme.id
                              ? 'bg-cordel-wood text-[#fdfaf2] shadow-[1px_1px_0px_0px_#181716] scale-110 z-10'
                              : 'text-cordel-master-dark hover:bg-neutral-200 opacity-80 hover:opacity-100'
                              }`}
                            title={theme.label}
                          >
                            {theme.icon}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {category.activerUploadPublic && category.lienUploadPublic && (
                    <a
                      href={category.lienUploadPublic}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-black uppercase text-blue-700 hover:underline flex items-center gap-1 cursor-pointer mt-1 md:mt-0"
                    >
                      📤 {translate('documents.publicUploadLink', "Partager vos photos/vidéos")}
                    </a>
                  )}
                </div>

                {/* Relative container so the rope shifts down with the cordels if the header grows */}
                <div className="relative w-full mt-2">
                  {/* Realistic 3D Hemp Rope */}
                  <HangingRopeCurve className="absolute top-[12px] left-0 right-0 h-8 w-full z-0 select-none pointer-events-none overflow-visible" />

                  {/* Hanging Booklets Directly Mounted on Rope Line */}
                  <div className="flex flex-nowrap overflow-x-auto overflow-y-visible justify-start items-start gap-4 sm:gap-6 pt-[33px] pb-6 relative z-10 w-full varal-scrollbar px-6 min-h-[210px]">
                    {docList.length === 0 ? (
                      <p className="text-[10px] italic opacity-60 self-center py-6 text-cordel-master-dark">{translate('documents.noDocumentsCategory', "Aucun document dans cette rubrique.")}</p>
                    ) : (
                      docList.map((docItem, index) => {
                        const isLatestDoc = docItem.id === newestDocumentId;

                        const isArchived = (docItem.isArchived === true);
                        const opacityClass = isArchived ? 'opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 transition-all duration-300' : 'opacity-100';

                        const docType = getDocType(docItem);

                        let colorClass = 'default';
                        if (category.id === 'Administratif' || category.id === 'DocumentsFixes' || category.nom === 'Administratif') {
                          colorClass = 'bleu-ardoise'; // Slate grey exclusif pour les documents administratifs fixes
                        } else if (category.id === 'ComptesRendus' || category.nom === 'Comptes-rendus') {
                          colorClass = 'rouge'; // Rouge distinctif pour les Comptes-rendus
                        } else {
                          colorClass = getDeterministicColor(docItem.id);
                        }
                        const typeIcons = {
                          pdf: '📄',
                          audio: '🎵',
                          image: '📷',
                          video: '🎥',
                          web: '🌐',
                          dossier_externe: '📂',
                          drive: '📂',
                          report: '📜',
                          culture_fiche: '📖',
                          instrument_model: '🛠️',
                          instrument_part: '⚙️'
                        };
                        const typeIcon = typeIcons[docType] || (docItem.typeDoc === 'instrument_part' || docItem.type === 'instrument_part' ? '⚙️' : (docItem.typeDoc === 'instrument_model' || docItem.type === 'instrument_model' ? '🛠️' : '📄'));

                        const isDarkBg = colorClass === 'rouge' || colorClass === 'bleu-ardoise' || colorClass === 'bleu';
                        const textClass = isDarkBg ? 'text-[#FEF9E7]' : 'text-encre-noire';
                        const borderDashedClass = isDarkBg ? 'border-[#FEF9E7]/35' : 'border-encre-noire/25';
                        const yearBadgeClass = isDarkBg ? 'bg-white/25 text-[#FEF9E7]' : 'bg-encre-noire/10 text-encre-noire';

                        /* Classe d'animation : le Petit Nouveau garde son swing fort,
                           les autres reçoivent la brise légère désynchronisée */
                        const cardAnimationClass = isLatestDoc
                          ? 'animate-varal-newest'
                          : 'animate-varal-breeze hover:z-30 hover:scale-105 hover:rotate-0';

                        /* Style dynamique : désynchronisation de la brise par index
                           pour simuler un vent naturel irrégulier.
                           Le Petit Nouveau ne reçoit aucun style inline (géré 100% par CSS). */
                        const cardAnimationStyle = isLatestDoc
                          ? {}
                          : {
                            animationDelay: `${(index * 0.4) % 1.5}s`,
                            animationDuration: `${3 + (index % 3) * 0.6}s`,
                          };

                        return (
                          <div
                            key={docItem.id}
                            onClick={() => {
                              if (isWorkshopVirtualDoc(docItem) || docItem.typeDoc === 'instrument_model' || docItem.typeDoc === 'instrument_part') {
                                setSelectedInstrumentModel({
                                  ...(docItem.modelData || docItem),
                                  focusedPartId: docItem.partId || null
                                });
                              } else if (docType === 'report') {
                                setSelectedReport(docItem);
                              } else if (docType === 'song') {
                                setSelectedToada(docItem);
                              } else if (docType === 'culture_fiche') {
                                setSelectedCultureCard(docItem);
                              } else if (docType === 'fabrication') {
                                setSelectedFabrication(docItem);
                              } else if (docType === 'reunion') {
                                setSelectedReunion(docItem);
                              } else {
                                if (docItem.fileUrl) {
                                  window.open(docItem.fileUrl, '_blank', 'noopener,noreferrer');
                                }
                              }
                            }}
                            className={`
                              relative flex flex-col items-center group cursor-pointer
                              transition-all duration-300 origin-top shrink-0 flex-none
                              ${cardAnimationClass}
                              ${opacityClass}
                            `}
                            style={cardAnimationStyle}
                            title={`${translate('common.open', "Ouvrir")} ${docItem.titre} ${isArchived ? '(' + translate('documents.archiveTag', "Archive") + ')' : ''}`}
                          >
                            {/* Badge "✨ Nouveau" exclusif au tout dernier document global */}
                            {isLatestDoc && (
                              <span className="absolute -top-2.5 -left-3 z-40 bg-[#d99f4d] text-encre-noire border-2 border-encre-noire rounded-[4px_6px_3px_5px] px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#181716] animate-bounce select-none">
                                {translate('documents.newestBadge', "✨ Nouveau")}
                              </span>
                            )}

                            {/* Pince à linge 3D (Wooden Clothespin) */}
                            <WoodenClothespin className="absolute -top-[16px] z-30 pointer-events-none" />

                            {/* Booklet Cover */}
                            <div
                              className={`
                                relative w-36 h-48 border-2 border-encre-noire p-3.5 flex flex-col justify-between text-left
                                bg-cordel-bg-light shadow-[4px_4px_0px_0px_#181716]
                                rounded-[4px_10px_3px_8px]
                                border-l-4 border-l-double
                                theme-bg-${colorClass}
                                overflow-hidden
                              `}
                            >
                              {/* Draft / Unvalidated Hatching Pattern */}
                              {docItem.type === 'reunion' && !docItem.isPublished && (
                                <div className="absolute inset-0 pointer-events-none z-[5] opacity-20 mix-blend-multiply" 
                                     style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, #181716 8px, #181716 10px)` }}
                                />
                              )}

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

                              {/* Archive Stamp */}
                              {isArchived && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[-15deg] opacity-80 mix-blend-multiply">
                                  <span className="border-4 border-cordel-master-dark text-cordel-master-dark px-2 py-1 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#181716] bg-cordel-bg-light/90 rotate-[-5deg]">Archivé</span>
                                </div>
                              )}

                              {/* Draft/Waiting Stamp for Reunions */}
                              {docItem.type === 'reunion' && !docItem.isPublished && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[10deg] opacity-90">
                                  <span className="border-[3px] border-[#c05621] text-[#c05621] px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#181716] bg-cordel-bg-light/95 rotate-[-5deg] text-center leading-tight whitespace-pre-line">
                                    {docItem.isPast ? "En attente\nde CA" : "ODJ\nen cours"}
                                  </span>
                                </div>
                              )}

                              {/* Universal Central Stamp Overlays */}
                              {(() => {
                                const theme = ((docItem.themeCulture || '') + ' ' + (docItem.stampKey || '') + ' ' + (docItem.categorieFiche || '') + ' ' + (docItem.sousCategorieFiche || '')).toLowerCase();
                                const isOrixa = theme.includes('orixa') || theme.includes('spiritualit');
                                const isCortejo = theme.includes('cortejo') || theme.includes('cortège');
                                const isCuisine = theme.includes('cuisine') || theme.includes('gastronomi');
                                const isHistoire = theme.includes('histoire');
                                const isMusique = theme.includes('musique');
                                const isTerritoire = theme.includes('territoire') || theme.includes('geograph');
                                const isFolklore = theme.includes('folklore');

                                const isAdminOrCR = category.id === 'Administratif' || category.nom === 'Administratif' || category.id === 'ComptesRendus' || category.nom === 'Comptes-rendus' || category.id === 'DocumentsFixes';
                                const isTutoFab = category.id === 'TutosFabrication' || category.nom === 'TutosFabrication' || category.nom === 'Tutos Fabrication';

                                const renderIcon = (id, paths, maskLines, extraClasses = "w-24 h-24 opacity-60") => (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={`absolute inset-0 m-auto z-0 pointer-events-none ${isDarkBg ? 'text-encre-noire' : 'text-white'} ${extraClasses}`}>
                                    <defs>
                                      <mask id={`${id}-${docItem.id}`}>
                                        <rect width="100" height="100" fill="white" />
                                        <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          {maskLines}
                                        </g>
                                      </mask>
                                    </defs>
                                    <path fill="currentColor" mask={`url(#${id}-${docItem.id})`} d={paths} />
                                  </svg>
                                );

                                if (docType === 'song') return renderIcon(
                                  'song',
                                  "M 30 30 C 30 10, 70 10, 70 30 C 70 50, 30 50, 30 30 M 27 32 C 27 5, 73 5, 73 32 C 73 55, 27 55, 27 32 M 35 15 L 65 45 M 45 12 L 70 35 M 30 25 L 55 48 M 65 15 L 35 45 M 55 12 L 30 35 M 70 25 L 45 48 M 30 30 Q 50 35 70 30 M 35 20 Q 50 25 65 20 M 35 50 Q 50 55 65 50 M 33 53 Q 50 58 67 53 M 38 52 L 43 90 C 43 95, 57 95, 57 90 L 62 52 M 35 55 L 40 92 M 65 55 L 60 92 M 50 93 Q 45 105 60 98 Q 75 90 70 75 M 48 93 Q 43 108 62 100 Q 78 92 72 73",
                                  <></>, "w-16 h-16 opacity-80"
                                );

                                if (isAdminOrCR) return renderIcon(
                                  'admin',
                                  "M 50 10 C 27.9 10 10 27.9 10 50 C 10 72.1 27.9 90 50 90 C 72.1 90 90 72.1 90 50 C 90 27.9 72.1 10 50 10 Z M 50 15 C 69.3 15 85 30.7 85 50 C 85 69.3 69.3 85 50 85 C 30.7 85 15 69.3 15 50 C 15 30.7 30.7 15 50 15 Z M 50 25 C 36.2 25 25 36.2 25 50 C 25 63.8 36.2 75 50 75 C 63.8 75 75 63.8 75 50 C 75 36.2 63.8 25 50 25 Z M 50 33 L 55.3 43.8 L 67 45.5 L 58.5 53.8 L 60.5 65 L 50 59.5 L 39.5 65 L 41.5 53.8 L 33 45.5 L 44.7 43.8 L 50 33 Z",
                                  <>
                                    <path d="M 15 50 L 30 50 M 70 50 L 85 50 M 50 15 L 50 30 M 50 70 L 50 85" strokeWidth="2" strokeDasharray="3 3" />
                                  </>, "w-20 h-20 opacity-30"
                                );

                                if (docType === 'video') return renderIcon(
                                  'video',
                                  "M 20 30 L 60 30 C 65 30 70 35 70 40 L 70 60 C 70 65 65 70 60 70 L 20 70 C 15 70 10 65 10 60 L 10 40 C 10 35 15 30 20 30 Z M 70 40 L 90 25 L 90 75 L 70 60 Z M 30 50 C 30 44.5 34.5 40 40 40 C 45.5 40 50 44.5 50 50 C 50 55.5 45.5 60 40 60 C 34.5 60 30 55.5 30 50 Z",
                                  <>
                                    <circle cx="40" cy="50" r="4" fill="black" />
                                    <line x1="20" y1="40" x2="60" y2="40" strokeWidth="1" strokeDasharray="2 2" />
                                  </>, "w-16 h-16 opacity-30"
                                );

                                if (isTutoFab) {
                                  const instr = docItem.instrument || docItem.familleInstrument || docItem.categorieFiche || docItem.categorie;
                                  if (instr) {
                                    return (
                                      <div className={`absolute inset-0 m-auto flex items-center justify-center z-0 pointer-events-none opacity-20 ${isDarkBg ? 'text-encre-noire' : 'text-[#523214]'}`}>
                                        <div className="scale-[1.2] origin-center mix-blend-multiply dark:mix-blend-normal">
                                          {getInstrumentStamp(instr, "currentColor")}
                                        </div>
                                      </div>
                                    );
                                  }
                                }

                                if (isOrixa) return renderIcon(
                                  'orixa',
                                  "M 50 3 L 44 14 L 36 24 L 38 31 L 31 39 L 34 46 L 24 50 L 19 63 L 12 90 L 88 90 L 83 66 L 74 49 L 66 44 L 69 37 L 62 31 L 64 26 L 57 13 Z",
                                  <>
                                    <line x1="39" y1="36" x2="39" y2="52" strokeDasharray="3 3" />
                                    <line x1="44" y1="34" x2="44" y2="57" strokeDasharray="3 3" />
                                    <line x1="51" y1="35" x2="51" y2="60" strokeDasharray="3 3" />
                                    <line x1="57" y1="34" x2="57" y2="56" strokeDasharray="3 3" />
                                    <line x1="62" y1="37" x2="62" y2="51" strokeDasharray="3 3" />
                                    <path d="M 22 62 Q 50 78 78 61" fill="none" strokeWidth="2" strokeDasharray="4 2" />
                                    <path d="M 18 78 Q 50 95 82 77" fill="none" strokeWidth="3" />
                                    <path d="M 50 72 L 50 90" fill="none" strokeWidth="2" strokeDasharray="5 3" />
                                    <circle cx="50" cy="15" r="2.5" fill="black" stroke="none" />
                                    <circle cx="40" cy="22" r="2" fill="black" stroke="none" />
                                    <circle cx="60" cy="22" r="2" fill="black" stroke="none" />
                                    <path d="M 45 28 L 55 28" fill="none" strokeWidth="1.5" />
                                  </>
                                );

                                if (isCortejo) return renderIcon(
                                  'cortejo',
                                  "M 50 5 A 8 8 0 1 0 50 21 A 8 8 0 1 0 50 5 Z M 48 23 L 30 40 L 25 35 L 20 40 L 35 55 L 43 45 L 35 85 L 15 90 L 20 95 L 80 95 L 85 90 L 65 85 L 57 45 L 65 55 L 80 40 L 75 35 L 70 40 L 52 23 Z",
                                  <>
                                    <path d="M 25 85 Q 50 75 75 85" fill="none" strokeWidth="3" strokeDasharray="5 3" />
                                    <path d="M 32 75 Q 50 65 68 75" fill="none" strokeWidth="2" strokeDasharray="4 2" />
                                    <line x1="45" y1="50" x2="40" y2="80" strokeDasharray="2 2" />
                                    <line x1="55" y1="50" x2="60" y2="80" strokeDasharray="2 2" />
                                  </>
                                );

                                if (isCuisine) return renderIcon(
                                  'cuisine',
                                  "M 20 50 L 25 80 C 30 90 70 90 75 80 L 80 50 Z M 15 40 C 15 35 85 35 85 40 L 80 45 L 20 45 Z M 10 40 C 5 40 5 50 10 50 C 15 50 15 40 10 40 Z M 90 40 C 95 40 95 50 90 50 C 85 50 85 40 90 40 Z M 40 30 Q 30 15 40 5 Q 50 15 40 30 M 60 35 Q 50 20 60 10 Q 70 20 60 35",
                                  <>
                                    <path d="M 30 75 Q 50 85 70 75" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                                    <path d="M 35 65 Q 50 75 65 65" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                                    <line x1="25" y1="50" x2="75" y2="50" strokeWidth="1" strokeDasharray="2 2" />
                                  </>
                                );

                                if (isHistoire) return renderIcon(
                                  'histoire',
                                  "M 10 20 L 45 30 L 50 32 L 55 30 L 90 20 L 90 80 L 55 70 L 55 90 L 50 85 L 45 90 L 45 70 L 10 80 Z",
                                  <>
                                    <line x1="50" y1="32" x2="50" y2="72" strokeWidth="3" />
                                    <path d="M 15 30 Q 30 35 45 40" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                                    <path d="M 15 45 Q 30 50 45 55" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                                    <path d="M 15 60 Q 30 65 45 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                                    <path d="M 85 30 Q 70 35 55 40" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                                    <path d="M 85 45 Q 70 50 55 55" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                                    <path d="M 85 60 Q 70 65 55 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                                  </>
                                );

                                if (isMusique && docType !== 'song') return renderIcon(
                                  'musique',
                                  "M 20 80 C 20 65 40 65 40 80 C 40 95 20 95 20 80 Z M 60 70 C 60 55 80 55 80 70 C 80 85 60 85 60 70 Z M 32 75 L 32 20 L 72 10 L 72 65 L 65 65 L 65 22 L 40 28 L 40 75 Z",
                                  <>
                                    <line x1="10" y1="50" x2="90" y2="50" strokeWidth="2" strokeDasharray="5 5" />
                                    <line x1="10" y1="40" x2="90" y2="40" strokeWidth="2" strokeDasharray="5 5" />
                                    <line x1="10" y1="60" x2="90" y2="60" strokeWidth="2" strokeDasharray="5 5" />
                                  </>
                                );

                                if (isTerritoire) return renderIcon(
                                  'territoire',
                                  "M 15 25 L 35 15 L 65 25 L 85 15 L 85 75 L 65 85 L 35 75 L 15 85 Z",
                                  <>
                                    <line x1="35" y1="15" x2="35" y2="75" strokeWidth="2.5" />
                                    <line x1="65" y1="25" x2="65" y2="85" strokeWidth="2.5" />
                                    <path d="M 25 45 Q 50 30 75 65" fill="none" strokeWidth="2" strokeDasharray="3 3" />
                                    <circle cx="75" cy="65" r="4" fill="black" stroke="none" />
                                    <circle cx="25" cy="45" r="4" fill="black" stroke="none" />
                                  </>
                                );

                                if (isFolklore) return renderIcon(
                                  'folklore',
                                  "M 30 15 C 20 15 15 25 15 40 C 15 35 25 35 35 45 C 35 60 45 90 50 90 C 55 90 65 60 65 45 C 75 35 85 35 85 40 C 85 25 80 15 70 15 C 60 15 55 30 50 30 C 45 30 40 15 30 15 Z",
                                  <>
                                    <circle cx="42" cy="55" r="4" fill="black" stroke="none" />
                                    <circle cx="58" cy="55" r="4" fill="black" stroke="none" />
                                    <path d="M 50 35 L 52 40 L 57 40 L 53 43 L 55 48 L 50 45 L 45 48 L 47 43 L 43 40 L 48 40 Z" fill="black" stroke="none" />
                                    <path d="M 45 75 Q 50 85 55 75" fill="none" strokeWidth="2" strokeDasharray="2 2" />
                                  </>
                                );

                                return null;
                              })()}
                              {/* Edit & Supprimer & Reorder Action Buttons */}
                              {isAuthorized && !docItem.isVirtualEventMedia && !isWorkshopVirtualDoc(docItem) && (
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
                              <div className="flex flex-col min-w-0 relative z-10">
                                <div className={`w-full border-b border-dashed ${borderDashedClass} pb-1 select-none flex justify-between items-center`}>
                                  <span className="text-xs select-none">
                                    {typeIcon}
                                  </span>
                                  {isWorkshopVirtualDoc(docItem) ? (
                                    <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 border border-amber-800/30">
                                      {docItem.isPartStep ? `⚙️ ${docItem.etapesCount} ét.` : '📐 Modèle'}
                                    </span>
                                  ) : (
                                    docItem.annee && (
                                      <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-sm ${yearBadgeClass}`}>
                                        {docItem.annee}
                                      </span>
                                    )
                                  )}
                                </div>
                                <h4 className={`font-black text-xs ${textClass} leading-snug mt-2 break-words line-clamp-3`}>
                                  {docItem.titre}
                                </h4>
                                {docItem.sousTitre && (
                                  <span className={`text-[8px] font-bold uppercase tracking-wider opacity-75 mt-0.5 block truncate ${textClass}`}>
                                    {docItem.sousTitre}
                                  </span>
                                )}
                              </div>

                              {/* Booklet Bottom */}
                              <div className="mt-auto select-none">
                                <div className={`text-[8.5px] text-right font-black uppercase tracking-wider mt-1 ${textClass}`}>
                                  {isWorkshopVirtualDoc(docItem)
                                    ? (docItem.isPartStep ? "Usinage ➜" : "Nomenclature ➜")
                                    : translate('documents.readBtn', "Lire ➜")}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-6 md:p-12 animate-fadeIn overflow-hidden">
          <div className="relative w-full max-w-[560px] max-h-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedToada(null)}
              className="absolute -top-3 -right-3 z-50 bg-[#8b2a1a] text-white w-8 h-8 rounded-full font-black flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors border-2 border-white cursor-pointer"
              title="Fermer"
            >
              X
            </button>
            <div className="w-full h-full overflow-y-auto scrollbar-hide rounded-lg shadow-2xl flex justify-center">
              <SongCard
                song={selectedToada}
                defaultRevisionMode={false}
                allDocsToPrint={groupedDocs['Toadas'] || []}
                onPrintAll={(config) => {
                  setSelectedToada(null);
                  setPrintCategory('Toadas');
                  handleBulkPrint(config);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modale de lecture d'une Fiche Culture */}
      {selectedCultureCard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-6 md:p-12 animate-fadeIn overflow-hidden">
          <div className="relative w-full max-w-[560px] max-h-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedCultureCard(null)}
              className="absolute -top-3 -right-3 z-50 bg-[#8b2a1a] text-white w-8 h-8 rounded-full font-black flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors border-2 border-white cursor-pointer"
              title="Fermer"
            >
              X
            </button>
            <div className="w-full h-full overflow-y-auto scrollbar-hide rounded-lg shadow-2xl flex justify-center">
              <CultureCard culture={selectedCultureCard} />
            </div>
          </div>
        </div>
      )}

      {selectedFabrication && (
        <FabricationCard fabrication={selectedFabrication} onClose={() => setSelectedFabrication(null)} />
      )}

      {selectedInstrumentModel && (
        <InstrumentModelCard 
          model={selectedInstrumentModel} 
          initialPartId={selectedInstrumentModel.focusedPartId}
          profileData={profileData}
          onClose={() => setSelectedInstrumentModel(null)} 
        />
      )}

      {/* Bulk Print Hidden Container (Portaled to body to escape all parent layouts) */}
      {isPrinting && printCategory && createPortal(
        <div className="print:block bg-white w-full">
          {(groupedDocs[printCategory] || [])
            .filter(d => d.type === 'song' || !d.type) // Safe fallback for older documents
            .map(song => (
              <div key={song.id} className="print-song-page">
                <SongCard song={song} defaultRevisionMode={false} isPrintVersion={true} printSections={printSections} />
              </div>
            ))}
        </div>,
        document.body
      )}

      {/* Bulk Print Modal */}
      {showBulkPrintModal && printCategory && (
        <PrintConfigModal
          title={`Imprimer le Carnet (${(groupedDocs[printCategory] || []).length} chants)`}
          onClose={() => setShowBulkPrintModal(false)}
          onConfirm={handleBulkPrint}
        />
      )}

      {selectedReunion && (
        <ReunionViewModal
          event={selectedReunion.reunionData}
          user={user}
          profileData={profileData}
          onClose={() => setSelectedReunion(null)}
        />
      )}
    </div>
  );
}
