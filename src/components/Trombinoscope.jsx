import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import XiloAvatar from './XiloAvatar';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import { XiloCaixa, XiloPeople } from './XiloIcons';
import { useInstrumentColor } from '../hooks/useInstrumentColor';
import ImageLightboxModal from './ImageLightboxModal';
import { formatTagGender, getTagId } from '../utils/tagUtils';
import { usePresenceContext } from '../context/PresenceContext';
const CordelImageEditor = React.lazy(() => import('./CordelImageEditor'));

// Memoized MemberCard subcomponent
const MemberCard = React.memo(({
  id,
  prenom,
  nom,
  photoURL,
  isOnline = false,
  role,
  genre,
  tags = [],
  telephone,
  adresseRue,
  adresseCP,
  adresseVille,
  adresse,
  dateNaissance,
  afficherTelephone,
  afficherDateNaissance,
  afficherVille,
  visibiliteAdresse,
  publierTelephone,
  publierDateNaissance,
  niveau,
  niveauDanse,
  instrumentsJoues = [],
  instrument,
  isCurrentUser,
  isViewerAdmin,
  fieldsConfig,
  onContactUser,
  onEditPhoto,
  onOpenLightbox,
  t,
  tRole,
  getPupitreName,
  getColorForInstrument,
  tagsDisponibles = [],
  majoriteFeminine = false,
  isDependent = false
}) => {
  const fullName = `${prenom || ''} ${nom || ''}`;
  const hasRoleBadge = role && role !== 'membre';
  const hasTags = tags && tags.length > 0;

  const isPhoneEnabled = fieldsConfig?.telephone?.enabled !== false;
  const isPhoneAllowed = afficherTelephone !== undefined ? (afficherTelephone === true) : (publierTelephone === true);
  const showPhone = isPhoneEnabled && telephone && (isPhoneAllowed || (isViewerAdmin && !isCurrentUser));

  const isBirthdateEnabled = fieldsConfig?.dateNaissance?.enabled !== false;
  const isBirthdateAllowed = afficherDateNaissance !== undefined ? (afficherDateNaissance === true) : (publierDateNaissance === true);
  const showBirthdate = isBirthdateEnabled && dateNaissance && (isBirthdateAllowed || (isViewerAdmin && !isCurrentUser));

  const isAddressEnabled = fieldsConfig?.adresse?.enabled !== false;
  const isNiveauxEnabled = fieldsConfig?.niveaux?.enabled !== false;
  const isAddressAllowed = afficherVille !== undefined ? (afficherVille === true) : (visibiliteAdresse !== 'masquee');
  const showCity = isAddressEnabled && (isAddressAllowed || (isViewerAdmin && !isCurrentUser));

  const getDisplayCity = (cityVal, cpVal, fullAddr) => {
    if (cityVal && cityVal.trim()) return cityVal.trim();
    if (fullAddr) {
      if (cpVal) {
        const parts = fullAddr.split(cpVal);
        if (parts.length > 1 && parts[1].trim()) {
          return parts[1].trim().replace(/^,/, '').trim();
        }
      }
      const match = fullAddr.match(/(?:\d{5}|\d{4})\s+([A-Za-zÀ-ÿ\s\-]+)/);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  };

  const displayAddress = showCity ? getDisplayCity(adresseVille, adresseCP, adresse) : null;

  const formatBirthday = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month)) {
        const d = new Date(year, month, day);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      }
    }
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    } catch {
      return dateStr;
    }
  };

  const userInstruments = instrumentsJoues && instrumentsJoues.length > 0
    ? instrumentsJoues
    : [instrument].filter(Boolean);

  const percussions = userInstruments.filter(inst => {
    const name = inst.toLowerCase().trim();
    return name !== 'danse' && !name.includes('danse');
  });

  const hasPercussions = percussions.length > 0;
  const hasDanse = (niveauDanse && niveauDanse !== 'aucun') || userInstruments.some(inst => inst.toLowerCase().trim() === 'danse');
  const danseLevel = niveauDanse && niveauDanse !== 'aucun' ? niveauDanse : null;

  const mainInstrument = userInstruments[0] || '';
  const cardBgColor = getColorForInstrument ? getColorForInstrument(mainInstrument, 'pastel') : undefined;

  const { isPresenceEnabled } = usePresenceContext();

  return (
    <div className="relative flex flex-col items-center">
      <CordelCard 
        variant="default" 
        useExtremeBorder={true} 
        className="w-full flex flex-col items-center p-4 min-h-[220px] relative overflow-hidden"
        style={cardBgColor ? { backgroundColor: cardBgColor } : undefined}
      >
        {/* Avatar with Xylogravure Filter */}
        <div 
          className="mb-3 relative group cursor-pointer"
          onClick={() => photoURL && onOpenLightbox && onOpenLightbox(photoURL, fullName)}
          title="Cliquer pour agrandir la photo"
        >
          <XiloAvatar src={photoURL} name={fullName} size={72} />
          {isPresenceEnabled !== false && isOnline && (
            <span 
              className="absolute -bottom-0.5 -right-0.5 z-20 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-md"
              title="Actuellement en ligne"
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            </span>
          )}
          {isCurrentUser && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditPhoto(photoURL);
              }}
              className="absolute -bottom-1 -right-1 bg-encre-noire text-cordel-bg-light hover:bg-cordel-wood rounded-full p-1 border border-encre-noire shadow-[1px_1px_0px_0px_#181716] cursor-pointer z-30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center select-none"
              title="Éditer la photo (Filtre Xylogravure)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>

        {/* Member Name */}
        <div className="text-center mt-1 w-full select-none flex flex-col items-center">
          {isDependent && (
            <span className="bg-amber-200 text-amber-900 border border-amber-400 text-[8px] font-black px-1.5 py-0.2 rounded uppercase mb-0.5 inline-block">
              👶 Enfant
            </span>
          )}
          <div className="font-bold text-xs truncate leading-snug">
            {prenom}
          </div>
          <div className="font-bold text-xs truncate leading-none uppercase text-[10px] opacity-75 mt-0.5">
            {nom}
          </div>
        </div>

        {/* Member Details */}
        <div className="text-center mt-2.5 text-[9px] leading-tight text-cordel-master-dark/85 flex flex-col gap-1.5 w-full select-none">
          {hasPercussions && (
            <div className="flex flex-col items-center">
              <span className="font-extrabold text-cordel-wood flex items-center justify-center gap-0.5 uppercase text-[8.5px] tracking-wider">
                <XiloCaixa size={9} /> Percussion {isNiveauxEnabled && niveau ? `(${niveau === 'confirme' ? t('userProfile.levelConfirmSimple') || 'Confirmé' : niveau === 'debutant' ? t('userProfile.levelBeginner') || 'Débutant' : t('common.none') || 'Aucun'})` : ''}
              </span>
              <span className="font-semibold text-encre-noire text-[9.5px] mt-0.5 leading-snug">
                {percussions.map((inst) => {
                  const pupitreName = getPupitreName(inst);
                  return pupitreName ? `${inst} (${pupitreName})` : inst;
                }).join(', ')}
              </span>
            </div>
          )}

          {hasDanse && (
            <div className={`flex flex-col items-center ${hasPercussions ? 'mt-1.5 border-t border-dashed border-cordel-master-dark/10 pt-1.5' : ''}`}>
              <span className="font-extrabold text-cordel-wood flex items-center justify-center gap-0.5 uppercase text-[8.5px] tracking-wider">
                💃 Danse
              </span>
              {isNiveauxEnabled && (
                <span className="font-semibold text-encre-noire text-[9.5px] mt-0.5">
                  {danseLevel ? (danseLevel === 'confirme' ? t('userProfile.levelConfirmSimple') || 'Confirmé' : t('userProfile.levelBeginner') || 'Débutant') : (t('userProfile.levelBeginner') || 'Débutant')}
                </span>
              )}
            </div>
          )}

          {(showPhone || showBirthdate || displayAddress) && (
            <div className="flex flex-col items-center mt-1.5 border-t border-dashed border-cordel-master-dark/10 pt-1.5 gap-0.5 text-cordel-master-dark/75 font-bold">
              {showPhone && (
                <span className="truncate">📞 {telephone}</span>
              )}
              {showBirthdate && (
                <span>🎂 {formatBirthday(dateNaissance)}</span>
              )}
              {displayAddress && (
                <span className="truncate text-[8.5px] max-w-full">📍 {displayAddress}</span>
              )}
            </div>
          )}
        </div>

        {/* Member Tags (Custom ink stamp badges) */}
        {hasTags && (
          <div className="flex flex-wrap gap-1 mt-3 justify-center max-w-full z-10 select-none">
            {tags.map((tag, tagIdx) => {
              const formattedTag = formatTagGender(tag, genre, majoriteFeminine, tagsDisponibles);
              const tagStr = typeof tag === 'string' ? tag : (tag.id || tagIdx);
              const rotation = ((String(tagStr).charCodeAt(0) + tagIdx) % 5) - 2;
              return (
                <span 
                  key={`tag-${tagStr}`} 
                  style={{ transform: `rotate(${rotation}deg)` }}
                  className="theme-stamp-badge theme-stamp-badge-wood text-[7px] px-1.5 py-0.5 border-dashed select-none bg-transparent shadow-none"
                >
                  {formattedTag}
                </span>
              );
            })}
          </div>
        )}

        {/* Contact button */}
        {!isCurrentUser && onContactUser && (
          <button
            type="button"
            onClick={() => onContactUser(id)}
            className="mt-3 text-[9px] font-black uppercase tracking-wider bg-cordel-bg-light text-encre-noire border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-cordel-hover cursor-pointer flex items-center justify-center gap-1 w-full max-w-[120px] mx-auto transition-all select-none z-10"
          >
            ✉️ Contacter
          </button>
        )}

        {/* Role Stamp overlay */}
        {hasRoleBadge && (
          <div className="absolute top-2 right-2 z-25 max-w-[70%] flex justify-end">
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] rotate-[-6deg] select-none break-words whitespace-normal text-right">
              {tRole(role, genre)}
            </span>
          </div>
        )}
      </CordelCard>
    </div>
  );
}, (prevProps, nextProps) => {
  // high performance equality check to prevent unneeded card renders
  return prevProps.id === nextProps.id &&
         prevProps.isOnline === nextProps.isOnline &&
         prevProps.prenom === nextProps.prenom &&
         prevProps.nom === nextProps.nom &&
         prevProps.photoURL === nextProps.photoURL &&
         prevProps.role === nextProps.role &&
         prevProps.genre === nextProps.genre &&
         prevProps.telephone === nextProps.telephone &&
         prevProps.adresseRue === nextProps.adresseRue &&
         prevProps.adresseCP === nextProps.adresseCP &&
         prevProps.adresseVille === nextProps.adresseVille &&
         prevProps.adresse === nextProps.adresse &&
         prevProps.dateNaissance === nextProps.dateNaissance &&
         prevProps.afficherTelephone === nextProps.afficherTelephone &&
         prevProps.afficherDateNaissance === nextProps.afficherDateNaissance &&
         prevProps.afficherVille === nextProps.afficherVille &&
         prevProps.visibiliteAdresse === nextProps.visibiliteAdresse &&
         prevProps.publierTelephone === nextProps.publierTelephone &&
         prevProps.publierDateNaissance === nextProps.publierDateNaissance &&
         prevProps.niveau === nextProps.niveau &&
         prevProps.niveauDanse === nextProps.niveauDanse &&
         prevProps.instrument === nextProps.instrument &&
         prevProps.isCurrentUser === nextProps.isCurrentUser &&
         prevProps.isViewerAdmin === nextProps.isViewerAdmin &&
         prevProps.onContactUser === nextProps.onContactUser &&
         prevProps.onEditPhoto === nextProps.onEditPhoto &&
         prevProps.getColorForInstrument === nextProps.getColorForInstrument &&
         prevProps.fieldsConfig?.niveaux?.enabled === nextProps.fieldsConfig?.niveaux?.enabled &&
         JSON.stringify(prevProps.tags) === JSON.stringify(nextProps.tags) &&
         JSON.stringify(prevProps.instrumentsJoues) === JSON.stringify(nextProps.instrumentsJoues);
});

const SECTION_ORDER = ['mestre', 'agbe', 'gongue', 'caixa_tarol', 'alfaia', 'chant_danse', 'autres'];

const getMemberSection = (member) => {
  const userInstruments = member.instrumentsJoues && member.instrumentsJoues.length > 0
    ? member.instrumentsJoues
    : [member.instrument].filter(Boolean);

  const insts = userInstruments.map(i => i.toLowerCase().trim());

  if (insts.some(i => i.includes('mestre'))) return 'mestre';
  if (insts.some(i => i.includes('agbê') || i.includes('agbe'))) return 'agbe';
  if (insts.some(i => i.includes('gonguê') || i.includes('gongue'))) return 'gongue';
  if (insts.some(i => i.includes('caixa') || i.includes('tarol'))) return 'caixa_tarol';
  if (insts.some(i => i.includes('alfaia'))) return 'alfaia';
  
  const hasDanse = (member.niveauDanse && member.niveauDanse !== 'aucun') || insts.some(i => i.includes('danse'));
  const hasChant = insts.some(i => i.includes('chant'));
  if (hasDanse || hasChant) return 'chant_danse';
  
  return 'autres';
};

const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"];

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

  const getPupitreName = useCallback((inst) => {
    if (!inst) return null;
    const parts = inst.split(' + ').map(p => p.trim());
    const match = linkedInstruments.find(group => {
      const groupInsts = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
      if (groupInsts.length !== parts.length) return false;
      const sortedGroup = [...groupInsts].sort();
      const sortedParts = [...parts].sort();
      return sortedGroup.every((val, idx) => val === sortedParts[idx]);
    });
    if (match && match.name) return match.name;

    if (parts.length === 1) {
      const containingGroup = linkedInstruments.find(group => {
        const groupInsts = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
        return groupInsts.includes(parts[0]) && group.name;
      });
      if (containingGroup) return containingGroup.name;
    }
    return null;
  }, [linkedInstruments]);

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
        id: user.uid,
        prenom: profileData?.prenom || 'Vous',
        nom: profileData?.nom || '',
        email: user.email,
        photoURL: profileData?.photoURL || user.photoURL,
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
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const cleanData = { ...data };
        if (!isViewerAdmin && doc.id !== user.uid) {
          delete cleanData.adresse;
          delete cleanData.adresseRue;
          delete cleanData.adresseCP;
          delete cleanData.adressePhysique;
        }
        fetchedMembers.push({
          id: doc.id,
          ...cleanData,
          photoURL: doc.id === user.uid ? (cleanData.photoURL || user.photoURL) : cleanData.photoURL || null
        });
      });

      if (fetchedMembers.length === 0) {
        fetchedMembers.push({
          id: user.uid,
          prenom: profileData?.prenom || 'Vous',
          nom: profileData?.nom || '',
          email: user.email,
          photoURL: profileData?.photoURL || user.photoURL,
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

  const handleEditorComplete = async (processedBase64) => {
    setShowEditor(false);
    setSelectedImage(null);
    if (!user?.uid) return;

    setUploadingPhoto(true);

    try {
      const base64ToBlob = (base64, mimeType = 'image/jpeg') => {
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeType });
      };

      const blob = base64ToBlob(processedBase64);

      const storageRef = ref(storage, `avatars/${user.uid}/profile_pic_${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL
      });

      setMembers(prev => prev.map(m => m.id === user.uid ? { ...m, photoURL: downloadURL } : m));

      alert(t('common.saveSuccess') || "Photo mise à jour !");
    } catch (err) {
      console.error("Trombinoscope - Erreur d'upload de photo :", err);
      alert(t('common.saveError') || "Erreur lors de la sauvegarde.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Memoized Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (member.statutActuel === 'archived') return false;

      const fullName = `${member.prenom || ''} ${member.nom || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());

      const matchesInstrument = filterInstrument === 'all' || 
        member.instrument === filterInstrument;

      const matchesTag = filterTag === 'all' || 
        (member.tags && (
          member.tags.includes(filterTag) || 
          member.tags.some(t => getTagId(t) === filterTag)
        ));

      return matchesSearch && matchesInstrument && matchesTag;
    });
  }, [members, searchQuery, filterInstrument, filterTag]);

  // Group members by section
  const groupedMembers = useMemo(() => {
    const groups = {
      mestre: [],
      agbe: [],
      gongue: [],
      caixa_tarol: [],
      alfaia: [],
      chant_danse: [],
      autres: []
    };

    filteredMembers.forEach(member => {
      const section = getMemberSection(member);
      groups[section].push(member);
    });

    return groups;
  }, [filteredMembers]);

  // Memoized callback handlers
  const handleContactUser = useCallback((memberId) => {
    if (onContactUser) {
      onContactUser(memberId);
    }
  }, [onContactUser]);

  const handleEditPhoto = useCallback((photoURL) => {
    setSelectedImage(photoURL || user.photoURL);
    setShowEditor(true);
  }, [user.photoURL]);

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
                {instrumentsDisponibles.map((inst) => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[500px] animate-pulse select-none">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-cordel-master-dark/5 border-2 border-dashed border-cordel-master-dark/15 rounded-lg p-4 h-[210px] flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-cordel-master-dark/20 rounded-lg shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 bg-cordel-master-dark/20 rounded w-3/4" />
                  <div className="h-3 bg-cordel-master-dark/15 rounded w-1/2" />
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="h-3 bg-cordel-master-dark/15 rounded w-full" />
                <div className="h-3 bg-cordel-master-dark/15 rounded w-2/3" />
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
              {SECTION_ORDER.map((sectionKey) => {
                const sectionMembers = groupedMembers[sectionKey];
                if (sectionMembers.length === 0) return null;

                 const getSectionIcon = (key) => {
                   let iconPath = '';
                   switch (key) {
                      case 'mestre': iconPath = '/icones/apito.svg'; break;
                      case 'agbe': iconPath = '/icones/agbe.svg'; break;
                      case 'gongue': iconPath = '/icones/gongue.svg'; break;
                      case 'caixa_tarol': iconPath = '/icones/caixa.svg'; break;
                      case 'alfaia': iconPath = '/icones/alfaia.svg'; break;
                      case 'chant_danse': iconPath = '/icones/micro.svg'; break;
                      default: iconPath = '/favicon.svg'; break;
                   }
                   return <img src={iconPath} alt={key} className="w-5 h-5 object-contain inline-block dark:invert" />;
                 };

                 const getTranslationKey = (key) => {
                   switch (key) {
                     case 'mestre': return 'trombinoscope.sectionMestre';
                     case 'agbe': return 'trombinoscope.sectionAgbe';
                     case 'gongue': return 'trombinoscope.sectionGongue';
                     case 'caixa_tarol': return 'trombinoscope.sectionCaixaTarol';
                     case 'alfaia': return 'trombinoscope.sectionAlfaia';
                     case 'chant_danse': return 'trombinoscope.sectionChantDanse';
                     case 'autres': return 'trombinoscope.sectionAutres';
                     default: return '';
                   }
                 };

                return (
                  <div key={sectionKey} className="flex flex-col gap-4">
                    {/* Section Header */}
                    <div className="border-b border-dashed border-cordel-master-dark/20 pb-2 text-left mt-2">
                      <h3 className="panel-title text-sm font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2 select-none">
                        <span>{getSectionIcon(sectionKey)}</span>
                        <span>{t(getTranslationKey(sectionKey)) || sectionKey}</span>
                      </h3>
                    </div>

                    <div 
                      className="grid gap-4"
                      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
                    >
                      {sectionMembers.map((member) => (
                        <MemberCard
                          key={member.id}
                          id={member.id}
                          prenom={member.prenom}
                          nom={member.nom}
                          photoURL={member.photoURL}
                          isOnline={member.isOnline === true}
                          role={member.role}
                          genre={member.genre}
                          tags={member.tags}
                          telephone={member.telephone}
                          adresseRue={member.adresseRue}
                          adresseCP={member.adresseCP}
                          adresseVille={member.adresseVille}
                          adresse={member.adresse}
                          dateNaissance={member.dateNaissance}
                          afficherTelephone={member.afficherTelephone}
                          afficherDateNaissance={member.afficherDateNaissance}
                          afficherVille={member.afficherVille}
                          visibiliteAdresse={member.visibiliteAdresse}
                          publierTelephone={member.publierTelephone}
                          publierDateNaissance={member.publierDateNaissance}
                          niveau={member.niveau}
                          niveauDanse={member.niveauDanse}
                          instrumentsJoues={member.instrumentsJoues}
                          instrument={member.instrument}
                          isCurrentUser={member.id === user.uid}
                          isViewerAdmin={isViewerAdmin}
                          fieldsConfig={fieldsConfig}
                          onContactUser={handleContactUser}
                          onEditPhoto={handleEditPhoto}
                          onOpenLightbox={handleOpenLightbox}
                          t={t}
                          tRole={tRole}
                          getPupitreName={getPupitreName}
                          getColorForInstrument={getColorForInstrument}
                          tagsDisponibles={tagsDisponibles}
                          majoriteFeminine={majoriteFeminine}
                          isDependent={member.isDependent === true}
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

      {/* Editor Modal Overlay */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--cordel-bg)] max-w-md w-full rounded-lg shadow-xl overflow-hidden relative border-4 border-encre-noire max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <React.Suspense fallback={
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
                  <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
                    Chargement de l'éditeur...
                  </span>
                </div>
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
        </div>
      )}
      {/* Lightbox Photo Modal */}
      <ImageLightboxModal 
        isOpen={!!lightboxPhoto}
        photoURL={lightboxPhoto?.url}
        name={lightboxPhoto?.name}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  );
}
