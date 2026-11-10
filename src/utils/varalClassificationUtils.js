/**
 * Utilitaires de classification et constantes des cordes du Varal de documents.
 * Sépare la logique pure de typage (Comptes-rendus, Administratif, Médias) du hook `useVaralData`.
 */

/**
 * Catégories par défaut suspendues sur le Varal de documents.
 */
export const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Toadas', nom: 'Toadas', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutosFabrication', nom: 'Tutos Fabrication', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'PhotosPrestations', nom: 'Photos Prestations', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'ComptesRendus', nom: 'Documents administratifs', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true },
  { id: 'TutorielsVideo', nom: 'Tutoriels Vidéo', actif: false, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Administratif', nom: 'Administratif', actif: false, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Costumerie', nom: 'Costumerie & Patrons', actif: false, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false }
];

/**
 * Table de correspondance par défaut reliant chaque pôle métier à ses cordes natives du Varal.
 */
export const DEFAULT_POLE_ROPES = {
  pedagogie: ['Toadas', 'Culture'],
  secretariat: ['ComptesRendus', 'Administratif'],
  studio: ['PhotosPrestations'],
  lutherie: ['TutosFabrication'],
  costumerie: ['TutosFabrication', 'Costumerie', 'TutosCostumes', 'PatronsCostumes']
};

/**
 * Détermine si un document porte un tag ou une métadonnée explicite de compte-rendu ou PV.
 */
export const hasReportTag = (docItem) => {
  if (!docItem) return false;
  const sousCat = (docItem.sousCategorie || docItem.sousCategorieFiche || '').toLowerCase();
  if (sousCat.includes('compte') || sousCat.includes('rendu') || sousCat.includes('pv') || sousCat.includes('procès') || sousCat.includes('proces')) {
    return true;
  }
  if (Array.isArray(docItem.tags)) {
    return docItem.tags.some((t) => {
      const val = (typeof t === 'string' ? t : (t?.label || t?.nom || t?.name || '')).toLowerCase().trim();
      return val === 'cr' || val === 'pv' || val.includes('compte-rendu') || val.includes('compte rendu') || val.includes('procès-verbal') || val.includes('proces-verbal');
    });
  }
  return false;
};

/**
 * Détermine si un document relève STRICTEMENT des comptes-rendus de réunion (Livret ROUGE).
 */
export const isReportDoc = (docItem) => {
  if (!docItem) return false;
  if (docItem.type === 'report' || docItem.typeDoc === 'report') return true;
  if (docItem.type === 'reunion_pv' || docItem.typeDoc === 'reunion_pv') return true;
  if (docItem.type === 'reunion' || docItem.typeDoc === 'reunion' || docItem.reunionData) return true;
  if (docItem.categoryId === 'ComptesRendus' || docItem.categorie === 'ComptesRendus') return true;
  if (hasReportTag(docItem)) return true;
  return false;
};

/**
 * Détermine si un document relève STRICTEMENT des documents administratifs statutaires fixes (Livret BLEU).
 */
export const isAdministrativeDoc = (docItem) => {
  if (!docItem) return false;
  if (
    docItem.type === 'report' || docItem.typeDoc === 'report' ||
    docItem.type === 'reunion_pv' || docItem.typeDoc === 'reunion_pv' ||
    docItem.type === 'reunion' || docItem.typeDoc === 'reunion' ||
    docItem.reunionData ||
    docItem.categoryId === 'ComptesRendus' || docItem.categorie === 'ComptesRendus'
  ) {
    return false;
  }
  const sousCat = (docItem.sousCategorie || docItem.sousCategorieFiche || '').toLowerCase();
  if (sousCat.includes('compte') || sousCat.includes('rendu') || sousCat.includes('pv') || sousCat.includes('procès') || sousCat.includes('proces')) {
    return false;
  }
  if (Array.isArray(docItem.tags) && docItem.tags.some((t) => {
    const val = (typeof t === 'string' ? t : (t?.label || t?.nom || t?.name || '')).toLowerCase().trim();
    return val === 'cr' || val === 'pv' || val.includes('compte-rendu') || val.includes('compte rendu') || val.includes('procès-verbal') || val.includes('proces-verbal');
  })) {
    return false;
  }

  if (docItem.typeDoc === 'statuts' || docItem.type === 'statuts') return true;
  if (docItem.categoryId === 'Administratif' || docItem.categorie === 'Administratif') return true;
  const titre = (docItem.titre || '').toLowerCase();
  return titre.includes('statut') || titre.includes('règlement') || titre.includes('reglement') ||
    titre.includes('rib') || titre.includes('assurance') || titre.includes('conseil d\'administration') ||
    titre.includes('bureau') || titre.includes('compo ca') || titre.includes('ca ') || titre.includes('administratif');
};

/**
 * Détermine le type fonctionnel d'un document selon ses propriétés ou son extension.
 */
export const getDocType = (docItem) => {
  if (!docItem) return 'pdf';
  if (docItem.type === 'projet_presentation' || docItem.typeDoc === 'projet_presentation') return 'projet_presentation';
  if (docItem.type === 'cordel_commission' || docItem.typeDoc === 'cordel_commission') return 'cordel_commission';
  if (docItem.type) return docItem.type;
  if (docItem.typeDoc) return docItem.typeDoc;
  const cat = (docItem.categorie || docItem.categoryId || '').toLowerCase();
  if (cat.startsWith('projet_')) return 'cordel_commission';
  if (cat.includes('toada')) return 'song';
  if (cat.includes('culture') || cat.includes('fiche')) return 'culture_fiche';

  const url = docItem.fileUrl || '';
  if (url.includes('drive.google.com/drive/folders') || url.includes('dropbox.com') || url.includes('onedrive')) return 'dossier_externe';
  if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a')) return 'audio';
  if (url.includes('.mp4') || url.includes('.webm') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) return 'video';
  if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.svg') || url.includes('.webp')) return 'image';
  if (url.startsWith('http') && !url.includes('.pdf')) return 'web';
  return 'pdf';
};

