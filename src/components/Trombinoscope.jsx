import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import XiloAvatar from './XiloAvatar';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import { XiloCaixa, XiloPeople } from './XiloIcons';
import { useInstrumentColor } from '../hooks/useInstrumentColor';
import ImageLightboxModal from './ImageLightboxModal';
import { formatTagGender, getTagId, filterPublicPercussionInstruments, computePupitresList, filterUserAssignedTags } from '../utils/tagUtils';
import { usePresenceContext } from '../context/PresenceContext';
import useHardwareBack from '../hooks/useHardwareBack';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
const CordelImageEditor = React.lazy(() => import('./CordelImageEditor'));

// Sous-composants modulaires du Trombinoscope (Planche de timbres et modale détaillée)
import MemberStampCard from './trombinoscope/MemberStampCard';
import MemberDetailModal from './trombinoscope/MemberDetailModal';

// Détection inclusive d'un membre pratiquant la danse
const isDanseMember = (m) => {
  if (!m) return false;
  if (m.pratiqueDanse === true) return true;
  if (m.niveauDanse && m.niveauDanse !== 'aucun') return true;
  const userInstruments = (Array.isArray(m.instrumentsJoues) && m.instrumentsJoues.length > 0)
    ? m.instrumentsJoues
    : [m.instrumentPrincipal || m.instrument || m.instrumentSecondaire].filter(Boolean);
  return userInstruments.some(inst => String(inst).toLowerCase().includes('danse'));
};

/**
 * Retourne le chemin de l'icône associée à un pupitre ou une section
 */
const getPupitreIcon = (name) => {
  if (!name) return '/favicon.svg';
  const lower = String(name).toLowerCase();
  if (lower.includes('agbe') || lower.includes('agbê') || lower.includes('mineiro') || lower.includes('semente') || lower.includes('shekere') || lower.includes('xequere')) {
    return '/icones/agbe.svg';
  }
  if (lower.includes('caixa') || lower.includes('tarol') || lower.includes('snare')) {
    return '/icones/caixa.svg';
  }
  if (lower.includes('alfaia') || lower.includes('zabumba') || lower.includes('surdo')) {
    return '/icones/alfaia.svg';
  }
  if (lower.includes('gongue') || lower.includes('gonguê') || lower.includes('cloche') || lower.includes('agogo') || lower.includes('agogô')) {
    return '/icones/gongue.svg';
  }
  if (lower.includes('apito') || lower.includes('mestre') || lower.includes('direction') || lower.includes('chef')) {
    return '/icones/apito.svg';
  }
  if (lower.includes('danse') || lower.includes('chant') || lower.includes('voix') || lower.includes('micro')) {
    return '/icones/micro.svg';
  }
  return '/favicon.svg';
};

const DEFAULT_INSTRUMENTS = ["Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"];

export default function Trombinoscope({ user, profileData, onBack, onContactUser }) {
  const { t, locale } = useTranslation();
  const { tRole, majoriteFeminine } = useTerminologie();
  const { getColorForInstrument } = useInstrumentColor(profileData?.groupId);
  const [members, setMembers] = useState([]);
  const [tagsDisponibles, setTagsDisponibles] = useState([]);
  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEditor, setShowEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const fileInputRef = useRef(null);
  const { uploadAvatar, compressAndPrepareFile, isCompressing, isUploading: isUploadingPhoto } = useAvatarUpload();

  useHardwareBack(showEditor, () => setShowEditor(false));
  useHardwareBack(!!lightboxPhoto, () => setLightboxPhoto(null));
  useHardwareBack(!!selectedMember, () => setSelectedMember(null));

  const handleOpenLightbox = useCallback((url, name) => {
    setLightboxPhoto({ url, name });
  }, []);

  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);
  const [linkedInstruments, setLinkedInstruments] = useState([]);

  // États des filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  const isViewerAdmin = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

  // Calcul de la liste consolidée des pupitres de l'association
  const basePercs = useMemo(() => {
    return filterPublicPercussionInstruments(instrumentsDisponibles);
  }, [instrumentsDisponibles]);

  const pupitresList = useMemo(() => {
    return computePupitresList(basePercs, linkedInstruments);
  }, [basePercs, linkedInstruments]);

  // Définition dynamique des sections ordonnées du Trombinoscope
  const dynamicSections = useMemo(() => {
    const sections = [
      {
        id: 'mestre',
        label: t('trombinoscope.sectionMestre') || 'Direction & Mestria',
        icon: '/icones/apito.svg'
      }
    ];

    pupitresList.forEach(pupitre => {
      sections.push({
        id: `pupitre-${pupitre}`,
        pupitreName: pupitre,
        label: pupitre,
        icon: getPupitreIcon(pupitre)
      });
    });

    sections.push({
      id: 'chant_danse',
      label: t('trombinoscope.sectionChantDanse') || 'Chant & Danse',
      icon: '/icones/micro.svg'
    });

    sections.push({
      id: 'autres',
      label: t('trombinoscope.sectionAutres') || 'Autres Instruments',
      icon: '/favicon.svg'
    });

    return sections;
  }, [pupitresList, t]);

  const getPupitreName = useCallback((inst) => {
    if (!inst) return null;
    const cleanInst = String(inst).trim();
    const parts = cleanInst.split(' + ').map(p => p.trim());
    
    // 1. Recherche par correspondance exacte ou inversée du groupe multi-instruments
    const match = linkedInstruments.find(group => {
      const groupInsts = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2].filter(Boolean));
      if (groupInsts.length !== parts.length) return false;
      const sortedGroup = [...groupInsts].map(s => String(s).toLowerCase().trim()).sort();
      const sortedParts = [...parts].map(s => String(s).toLowerCase().trim()).sort();
      return sortedGroup.every((val, idx) => val === sortedParts[idx]);
    });
    if (match && match.name && match.name.trim()) return match.name.trim();

    // 2. Recherche si l'instrument unique appartient à un pupitre lié
    const lowerClean = cleanInst.toLowerCase();
    const containingGroup = linkedInstruments.find(group => {
      const groupInsts = (group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2].filter(Boolean)))
        .map(i => String(i).toLowerCase().trim());
      return groupInsts.includes(lowerClean) || (group.name && group.name.toLowerCase().trim() === lowerClean);
    });
    if (containingGroup && containingGroup.name && containingGroup.name.trim()) {
      return containingGroup.name.trim();
    }
    return null;
  }, [linkedInstruments]);

  // Résolution automatique et bidirectionnelle d'un instrument vers son pupitre
  const resolvePupitreSection = useCallback((instName, member) => {
    const lower = String(instName || '').toLowerCase().trim();

    // A. Mestria & Direction
    if (lower.includes('mestre') || lower.includes('direction') || lower.includes('apito') || lower.includes('chef de bateria')) {
      return 'mestre';
    }
    if (member && (member.role === 'mestre' || member.role === 'super-admin') && (member.pratiquePercussion || member.isSystemAdmin)) {
      if (!instName || lower === 'direction & mestria' || lower === 'mestre') {
        return 'mestre';
      }
    }

    // B. Danse / Chant
    if (lower.includes('danse') || lower.includes('chant') || lower.includes('voix')) {
      return 'chant_danse';
    }

    if (!lower) return 'autres';

    // C. Groupes d'instruments liés configurés (ex: Sementes pour Agbê et Mineiro)
    for (const group of linkedInstruments) {
      const groupInsts = (group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2].filter(Boolean)))
        .map(i => String(i).toLowerCase().trim());
      const groupName = group.name && group.name.trim() ? group.name.trim() : (group.instruments || []).join(' + ');
      const lowerGroupName = groupName.toLowerCase().trim();

      if (groupInsts.includes(lower) || lowerGroupName === lower || lowerGroupName.includes(lower) || lower.includes(lowerGroupName)) {
        return `pupitre-${groupName}`;
      }
    }

    // D. Pupitres autonomes configurés
    for (const pupitre of pupitresList) {
      const lowerPupitre = pupitre.toLowerCase().trim();
      if (lower === lowerPupitre || lower.includes(lowerPupitre) || lowerPupitre.includes(lower)) {
        return `pupitre-${pupitre}`;
      }
    }

    // E. Familles Maracatu traditionnelles si non encore associées
    if (lower.includes('agbe') || lower.includes('agbê') || lower.includes('mineiro') || lower.includes('semente')) {
      const found = pupitresList.find(p => {
        const l = p.toLowerCase();
        return l.includes('agbe') || l.includes('agbê') || l.includes('mineiro') || l.includes('semente');
      });
      if (found) return `pupitre-${found}`;
    }
    if (lower.includes('caixa') || lower.includes('tarol')) {
      const found = pupitresList.find(p => {
        const l = p.toLowerCase();
        return l.includes('caixa') || l.includes('tarol');
      });
      if (found) return `pupitre-${found}`;
    }
    if (lower.includes('alfaia')) {
      const found = pupitresList.find(p => p.toLowerCase().includes('alfaia'));
      if (found) return `pupitre-${found}`;
    }
    if (lower.includes('gongue') || lower.includes('gonguê')) {
      const found = pupitresList.find(p => p.toLowerCase().includes('gongue') || p.toLowerCase().includes('gonguê'));
      if (found) return `pupitre-${found}`;
    }

    return 'autres';
  }, [linkedInstruments, pupitresList]);

  // Charger les étiquettes et instruments de l'association
  useEffect(() => {
    if (!profileData?.groupId) return;
    const loadAssocData = async () => {
      try {
        const assocRef = doc(db, 'associations', profileData.groupId);
        const docSnap = await getDoc(assocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.tagsDisponibles)) {
            setTagsDisponibles(data.tagsDisponibles);
          }
          if (Array.isArray(data.instrumentsDisponibles)) {
            setInstrumentsDisponibles(data.instrumentsDisponibles);
          } else {
            setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
          }
          if (Array.isArray(data.linkedInstruments)) {
            const normalized = data.linkedInstruments.map(link => {
              if (Array.isArray(link)) {
                return { name: '', instruments: link };
              } else if (link && typeof link === 'object') {
                if (Array.isArray(link.instruments)) {
                  return { name: link.name || '', instruments: link.instruments };
                } else if (link.inst1 && link.inst2) {
                  return { name: link.name || '', instruments: [link.inst1, link.inst2] };
                }
              }
              return null;
            }).filter(Boolean);
            setLinkedInstruments(normalized);
          } else {
            setLinkedInstruments([]);
          }
          if (data.fieldsConfig) {
            setFieldsConfig(data.fieldsConfig);
          }
        }
      } catch (err) {
        console.error("Trombinoscope - Erreur chargement config association :", err);
      }
    };
    loadAssocData();
  }, [profileData?.groupId]);

  useEffect(() => {
    if (!profileData?.groupId) {
      setMembers([{
        id: user?.uid || 'temp',
        prenom: profileData?.prenom || 'Vous',
        nom: profileData?.nom || '',
        email: user?.email || '',
        photoURL: profileData?.photoURL || user?.photoURL || null,
        role: profileData?.role || 'membre',
        tags: profileData?.tags || [],
        statutActuel: profileData?.statutActuel || 'active'
      }]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', profileData.groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMembers = [];
      const currentUserId = user?.uid;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const cleanData = { ...data };
        if (!isViewerAdmin && doc.id !== currentUserId) {
          delete cleanData.adresse;
          delete cleanData.adresseRue;
          delete cleanData.adresseCP;
          delete cleanData.adressePhysique;
        }
        fetchedMembers.push({
          id: doc.id,
          ...cleanData,
          photoURL: (currentUserId && doc.id === currentUserId) ? (cleanData.photoURL || user?.photoURL) : cleanData.photoURL || null
        });
      });

      if (fetchedMembers.length === 0) {
        fetchedMembers.push({
          id: user?.uid || 'temp',
          prenom: profileData?.prenom || 'Vous',
          nom: profileData?.nom || '',
          email: user?.email || '',
          photoURL: profileData?.photoURL || user?.photoURL || null,
          role: profileData?.role || 'membre',
          tags: profileData?.tags || [],
          statutActuel: profileData?.statutActuel || 'active'
        });
      }

      setMembers(fetchedMembers);
      setLoading(false);
    }, (err) => {
      console.error("Trombinoscope - Erreur Firestore :", err);
      setError(t('trombinoscope.error'));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData, user, isViewerAdmin, t]);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressAndPrepareFile(file);
      if (base64) {
        setSelectedImage(base64);
        setShowEditor(true);
      }
    } catch (err) {
      console.error("Trombinoscope - Erreur sélection photo :", err);
      alert(t('common.saveError') || "Erreur lors de la lecture de la photo.");
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleEditorComplete = async (processedBase64) => {
    setShowEditor(false);
    setSelectedImage(null);
    if (!user?.uid) return;

    try {
      const downloadURL = await uploadAvatar(user.uid, processedBase64);
      setMembers(prev => prev.map(m => m.id === user.uid ? { ...m, photoURL: downloadURL } : m));
      alert(t('common.saveSuccess') || "Photo mise à jour !");
    } catch (err) {
      console.error("Trombinoscope - Erreur d'upload de photo :", err);
      alert(t('common.saveError') || "Erreur lors de la sauvegarde.");
    }
  };

  // Memoized Filtered Members (Filtrage préalable par recherche, pupitre et tag)
  const filteredMembers = useMemo(() => {
    const queryStr = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      if (member.statutActuel === 'archived') return false;

      // 1. Recherche textuelle (Prénom, Nom, Surnom, Ville)
      const fullName = `${member.prenom || ''} ${member.nom || ''} ${member.surnom || ''} ${member.adresseVille || ''}`.toLowerCase();
      const matchesSearch = !queryStr || fullName.includes(queryStr);

      // Récupération de tous les instruments du membre
      const userInstruments = (Array.isArray(member.instrumentsJoues) && member.instrumentsJoues.length > 0)
        ? member.instrumentsJoues
        : [member.instrumentPrincipal || member.instrument || member.instrumentSecondaire].filter(Boolean);

      const isDancer = isDanseMember(member);
      const isMestre = (member.role === 'mestre' || member.role === 'super-admin') && (member.pratiquePercussion || member.isSystemAdmin);

      // 2. Filtre par instrument / pupitre
      let matchesInstrument = filterInstrument === 'all';
      if (!matchesInstrument) {
        if (filterInstrument === 'mestre') {
          matchesInstrument = isMestre || userInstruments.some(inst => resolvePupitreSection(inst, member) === 'mestre');
        } else if (filterInstrument.toLowerCase().includes('danse')) {
          matchesInstrument = isDancer;
        } else if (filterInstrument === 'Autre') {
          matchesInstrument = userInstruments.length === 0 ? (!isDancer && !isMestre) : userInstruments.some(inst => resolvePupitreSection(inst, member) === 'autres');
        } else {
          // Filtre par nom de pupitre configuré (ex: Sementes, Caixa & Tarol, Alfaia)
          const targetSection = `pupitre-${filterInstrument}`;
          matchesInstrument = userInstruments.some(inst => resolvePupitreSection(inst, member) === targetSection);
        }
      }

      // 3. Filtre par étiquettes (Tags)
      const matchesTag = filterTag === 'all' || 
        (member.tags && (
          member.tags.includes(filterTag) || 
          member.tags.some(t => getTagId(t) === filterTag)
        ));

      return matchesSearch && matchesInstrument && matchesTag;
    });
  }, [members, searchQuery, filterInstrument, filterTag, resolvePupitreSection]);

  // Distribution des membres dans les pupitres dynamiques avec support des Cartes Fantômes (Polyvalence)
  const groupedMembers = useMemo(() => {
    const groups = {};
    dynamicSections.forEach(sec => {
      groups[sec.id] = [];
    });

    filteredMembers.forEach((member) => {
      const rawInstruments = (Array.isArray(member.instrumentsJoues) && member.instrumentsJoues.length > 0)
        ? member.instrumentsJoues
        : [member.instrumentPrincipal || member.instrument || member.instrumentSecondaire].filter(Boolean);

      const isDancer = isDanseMember(member);
      const isMestre = (member.role === 'mestre' || member.role === 'super-admin') && (member.pratiquePercussion || member.isSystemAdmin);

      // Détermination du rôle ou instrument principal et de sa section de rattachement
      let primaryInst = member.instrumentPrincipal || member.instrument || (rawInstruments.length > 0 ? rawInstruments[0] : '');
      let primarySection = 'autres';

      if (isMestre && (!rawInstruments.length || rawInstruments.some(i => String(i).toLowerCase().includes('mestre') || String(i).toLowerCase().includes('direction') || String(i).toLowerCase().includes('apito')))) {
        primarySection = 'mestre';
        if (!primaryInst) primaryInst = 'Direction & Mestria';
      } else if (rawInstruments.length === 0) {
        if (isDancer) {
          primarySection = 'chant_danse';
          primaryInst = 'Danse';
        } else if (isMestre) {
          primarySection = 'mestre';
          primaryInst = 'Direction & Mestria';
        } else {
          primarySection = 'autres';
        }
      } else {
        if (isDancer && (!primaryInst || String(primaryInst).toLowerCase().includes('danse'))) {
          primarySection = 'chant_danse';
        } else {
          primarySection = resolvePupitreSection(primaryInst, member);
        }
      }

      // Cas où le membre n'a aucun instrument de percussion configuré
      if (rawInstruments.length === 0) {
        if (!groups[primarySection]) groups[primarySection] = [];
        groups[primarySection].push({
          ...member,
          isGhost: false,
          primaryInstrumentName: primaryInst || (primarySection === 'chant_danse' ? 'Danse' : primarySection === 'mestre' ? 'Direction & Mestria' : ''),
          cardKey: `${member.id}-${primarySection}-main`
        });
        return;
      }

      const addedSections = new Set();

      // Si un filtre d'instrument / pupitre spécifique est sélectionné
      if (filterInstrument !== 'all') {
        let targetSection = '';
        if (filterInstrument === 'mestre') targetSection = 'mestre';
        else if (filterInstrument.toLowerCase().includes('danse')) targetSection = 'chant_danse';
        else if (filterInstrument === 'Autre') targetSection = 'autres';
        else targetSection = `pupitre-${filterInstrument}`;

        if (targetSection === 'chant_danse' && isDancer) {
          const isMainForMember = primarySection === 'chant_danse';
          if (!groups.chant_danse) groups.chant_danse = [];
          groups.chant_danse.push({
            ...member,
            isGhost: !isMainForMember,
            primaryInstrumentName: primaryInst || 'Danse',
            cardKey: `${member.id}-chant_danse-${isMainForMember ? 'main' : 'ghost'}`
          });
          return;
        }

        if (targetSection === 'mestre' && isMestre) {
          const isMainForMember = primarySection === 'mestre';
          if (!groups.mestre) groups.mestre = [];
          groups.mestre.push({
            ...member,
            isGhost: !isMainForMember,
            primaryInstrumentName: primaryInst || 'Direction & Mestria',
            cardKey: `${member.id}-mestre-${isMainForMember ? 'main' : 'ghost'}`
          });
          return;
        }

        rawInstruments.forEach((inst) => {
          const sec = resolvePupitreSection(inst, member);
          if (sec === targetSection && !addedSections.has(sec)) {
            addedSections.add(sec);
            const isMainForMember = (sec === primarySection);
            if (!groups[sec]) groups[sec] = [];
            groups[sec].push({
              ...member,
              isGhost: !isMainForMember,
              primaryInstrumentName: primaryInst,
              cardKey: `${member.id}-${sec}-${isMainForMember ? 'main' : 'ghost'}`
            });
          }
        });
        return;
      }

      // Mode standard (vue globale de tous les pupitres)
      // 1. Carte principale dans le pupitre principal
      if (!groups[primarySection]) groups[primarySection] = [];
      groups[primarySection].push({
        ...member,
        isGhost: false,
        primaryInstrumentName: primaryInst,
        cardKey: `${member.id}-${primarySection}-main`
      });
      addedSections.add(primarySection);

      // 2. Cartes Fantômes dans les pupitres secondaires
      rawInstruments.forEach((inst) => {
        const sec = resolvePupitreSection(inst, member);
        if (sec && !addedSections.has(sec) && groups[sec]) {
          addedSections.add(sec);
          groups[sec].push({
            ...member,
            isGhost: true,
            primaryInstrumentName: primaryInst || 'Instrument principal',
            cardKey: `${member.id}-${sec}-ghost`
          });
        }
      });

      // 3. Carte Fantôme pour la Danse si pratiquée en secondaire
      if (isDancer && !addedSections.has('chant_danse') && groups.chant_danse) {
        addedSections.add('chant_danse');
        groups.chant_danse.push({
          ...member,
          isGhost: true,
          primaryInstrumentName: primaryInst || 'Danse',
          cardKey: `${member.id}-chant_danse-ghost`
        });
      }

      // 4. Carte Fantôme pour Direction / Mestria si rôle Mestre sans être le pupitre principal
      if (isMestre && !addedSections.has('mestre') && groups.mestre) {
        addedSections.add('mestre');
        groups.mestre.push({
          ...member,
          isGhost: true,
          primaryInstrumentName: primaryInst || 'Direction & Mestria',
          cardKey: `${member.id}-mestre-ghost`
        });
      }
    });

    return groups;
  }, [filteredMembers, dynamicSections, filterInstrument, resolvePupitreSection]);

  // Memoized callback handlers
  const handleContactUser = useCallback((memberId) => {
    if (onContactUser) {
      onContactUser(memberId);
    }
  }, [onContactUser]);

  const handleEditPhoto = useCallback((photoURL) => {
    const currentPhoto = photoURL || profileData?.photoURL || user?.photoURL;
    if (!currentPhoto) {
      // Si le membre n'a pas encore de photo, déclencher directement le sélecteur de fichier
      if (fileInputRef.current) {
        fileInputRef.current.click();
        return;
      }
    }
    setSelectedImage(currentPhoto || null);
    setShowEditor(true);
  }, [profileData?.photoURL, user?.photoURL]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center py-2 border-b-2 border-dashed border-cordel-master-dark/30 flex justify-between items-center">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs select-none">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-xl font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5 select-none">
          <XiloPeople size={18} /> {t('trombinoscope.title')}
        </span>
        <div className="w-16"></div>
      </div>

      {/* Info / Group badge */}
      <div className="text-center -mt-2 select-none">
        <span className="text-[10px] uppercase font-bold tracking-widest text-cordel-master-dark opacity-65">
          {t('trombinoscope.group')}{profileData?.groupId || t('trombinoscope.noGroup')}
        </span>
      </div>

      {/* Bannière incitative si l'adhérent connecté n'a pas encore de photo */}
      {user?.uid && !profileData?.photoURL && !user?.photoURL && (
        <div className="bg-amber-100 dark:bg-amber-950/40 border-2 border-dashed border-amber-600 text-amber-900 dark:text-amber-200 p-3 rounded-[var(--theme-border-radius)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-left shadow-sm select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl shrink-0">📸</span>
            <div>
              <span className="font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 text-[10px] block">
                {t('trombinoscope.bannerMissingTitle') || "Votre photo est manquante dans le Trombinoscope"}
              </span>
              <span className="font-bold text-[11px] leading-tight">
                {t('trombinoscope.bannerMissingDesc') || "Ajoutez votre portrait pour permettre aux autres membres du groupe de vous reconnaître facilement !"}
              </span>
            </div>
          </div>
          <CordelButton
            type="button"
            variant="vert"
            useExtremeBorder={true}
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] py-1.5 px-3 uppercase font-black shrink-0 flex items-center justify-center gap-1"
          >
            📸 {isCompressing ? (t('common.loading') || "Chargement...") : (t('trombinoscope.addMyPhoto') || "Ajouter ma photo")}
          </CordelButton>
        </div>
      )}

      {/* Dynamic Search & Filters Toolbar */}
      {!loading && !error && (
        <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg flex flex-col gap-3 select-none">
          {/* Saisie textuelle */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
              🔍 {t('trombinoscope.search')}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('trombinoscope.searchPlaceholder')}
              className="theme-input w-full text-xs font-bold py-1.5"
            />
          </div>

          {/* Sélecteurs déroulants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
                <XiloCaixa size={12} /> {t('trombinoscope.instrument')}
              </label>
              <select
                value={filterInstrument}
                onChange={(e) => setFilterInstrument(e.target.value)}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="all">{t('trombinoscope.all')}</option>
                <option value="mestre">{t('trombinoscope.sectionMestre') || 'Direction & Mestria'}</option>
                {pupitresList.map((pupitre) => (
                  <option key={pupitre} value={pupitre}>{pupitre}</option>
                ))}
                <option value="Danse">{t('trombinoscope.dance') || 'Danse'}</option>
                <option value="Autre">{t('trombinoscope.other')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
                🏷️ {t('trombinoscope.tag')}
              </label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="all">{t('trombinoscope.all')}</option>
                {tagsDisponibles.map((tag) => {
                  const tagId = getTagId(tag);
                  const formattedLabel = formatTagGender(tag, null, majoriteFeminine, tagsDisponibles);
                  return (
                    <option key={tagId} value={tagId}>{formattedLabel}</option>
                  );
                })}
              </select>
            </div>
          </div>
        </CordelCard>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3 min-h-[300px] animate-pulse select-none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((n) => (
            <div key={n} className="rounded-md border-2 border-dashed border-cordel-master-dark/20 bg-cordel-master-dark/5 overflow-hidden flex flex-col">
              <div className="aspect-square w-full bg-cordel-master-dark/15" />
              <div className="p-1.5 flex flex-col items-center gap-1">
                <div className="h-2.5 bg-cordel-master-dark/20 rounded w-3/4" />
                <div className="h-2 bg-cordel-master-dark/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <CordelCard variant="default" useExtremeBorder={true} className="text-center py-8">
          <p className="text-sm font-bold text-cordel-wood mb-4">{error}</p>
          <CordelButton variant="ocre" onClick={onBack}>{t('common.back')}</CordelButton>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Group Warning if no groupId */}
          {!profileData?.groupId && (
            <CordelCard variant="ocre" useExtremeBorder={false} className="p-3 text-left">
              <p className="text-xs leading-relaxed font-semibold">
                ⚠️ {t('trombinoscope.noGroupWarning')}
              </p>
            </CordelCard>
          )}

          {/* Grille responsive de portraits */}
          {filteredMembers.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
              <p className="text-xs font-bold opacity-75">{t('trombinoscope.noMembers')}</p>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-8">
              {dynamicSections.map((sec) => {
                const sectionMembers = groupedMembers[sec.id] || [];
                if (sectionMembers.length === 0) return null;

                return (
                  <div key={sec.id} className="flex flex-col gap-4">
                    {/* Section Header */}
                    <div className="border-b border-dashed border-cordel-master-dark/20 pb-2 text-left mt-2 flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-marron,#8b2a1a)] flex items-center gap-1.5 select-none">
                        <img 
                          src={sec.icon} 
                          alt={sec.label} 
                          loading="lazy" 
                          decoding="async" 
                          className="w-4 h-4 object-contain inline-block dark:invert" 
                        />
                        <span>{sec.label}</span>
                        <span className="text-[11px] font-bold text-stone-500 font-sans tracking-normal ml-0.5">
                          ({sectionMembers.length})
                        </span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3">
                      {sectionMembers.map((member) => (
                        <MemberStampCard
                          key={member.cardKey || `${member.id}-${sec.id}-${member.isGhost ? 'ghost' : 'main'}`}
                          member={member}
                          isOnline={member.isOnline === true}
                          isCurrentUser={Boolean(user?.uid && member.id === user.uid)}
                          pupitreColor={getColorForInstrument(member.instrument || sec.pupitreName || sec.label, 'solid') || '#181716'}
                          onClick={(m) => setSelectedMember(m)}
                          onEditPhoto={handleEditPhoto}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Editeur Photo Cordel / Xylogravure */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full max-h-[95vh] overflow-y-auto">
            <React.Suspense fallback={
              <CordelCard variant="default" useExtremeBorder={true} className="p-8 flex flex-col items-center justify-center bg-cordel-bg">
                <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
                <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
                  Chargement de l'éditeur...
                </span>
              </CordelCard>
            }>
              <CordelImageEditor 
                imageSrc={selectedImage}
                lang={locale || 'fr'}
                onComplete={handleEditorComplete}
                onCancel={() => {
                  setShowEditor(false);
                  setSelectedImage(null);
                }}
              />
            </React.Suspense>
          </div>
        </div>
      )}

      {/* Input de sélection de fichier masqué pour le Trombinoscope */}
      <input 
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Lightbox Photo Modal */}
      <ImageLightboxModal 
        isOpen={!!lightboxPhoto}
        photoURL={lightboxPhoto?.url}
        name={lightboxPhoto?.name}
        onClose={() => setLightboxPhoto(null)}
      />

      {/* Modale Fiche Membre détaillée (Lightbox Cordel) */}
      <MemberDetailModal
        member={selectedMember}
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        isOnline={selectedMember?.isOnline === true}
        isCurrentUser={Boolean(user?.uid && selectedMember?.id === user.uid)}
        fieldsConfig={fieldsConfig}
        tagsDisponibles={tagsDisponibles}
        majoriteFeminine={majoriteFeminine}
        getPupitreName={getPupitreName}
        onContactUser={handleContactUser}
        onEditPhoto={handleEditPhoto}
        t={t}
        tRole={tRole}
        locale={locale}
        getColorForInstrument={getColorForInstrument}
      />
    </div>
  );
}
