import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import XiloAvatar from './XiloAvatar';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import { XiloCaixa, XiloPeople } from './XiloIcons';
import { useInstrumentColor } from '../hooks/useInstrumentColor';
import ImageLightboxModal from './ImageLightboxModal';
import { formatTagGender, getTagId } from '../utils/tagUtils';
import useHardwareBack from '../hooks/useHardwareBack';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
const CordelImageEditor = React.lazy(() => import('./CordelImageEditor'));

// Sous-composants modulaires du Trombinoscope (Planche de timbres et modale détaillée)
import MemberStampCard from './trombinoscope/MemberStampCard';
import MemberDetailModal from './trombinoscope/MemberDetailModal';
import {
  FIVE_PUPITRES,
  isDanseMember,
  isRenfortMember,
  isChantReferent,
  resolveMemberPrimaryPupitre,
  extractMemberBadges,
  getEffectiveMemberTags,
  isDefaultMemberBadge
} from './trombinoscope/trombinoscopeUtils';



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

    // 3. Unification canonique Maracatu (Sementes & Caixas)
    if (lowerClean.includes('agbe') || lowerClean.includes('agbê') || lowerClean.includes('mineiro') || lowerClean.includes('semente')) {
      return 'Sementes';
    }
    if (lowerClean.includes('caixa') || lowerClean.includes('tarol')) {
      return 'Caixas';
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
        id: user?.uid || 'temp',
        prenom: profileData?.prenom || 'Vous',
        nom: profileData?.nom || '',
        email: user?.email || '',
        photoURL: profileData?.photoURL || user?.photoURL || null,
        role: profileData?.role || 'membre',
        tags: profileData?.tags || [],
        statutActuel: profileData?.statutActuel || 'active',
        dateNaissance: profileData?.dateNaissance || '',
        afficherDateNaissance: profileData?.afficherDateNaissance,
        publierDateNaissance: profileData?.publierDateNaissance
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
          statutActuel: profileData?.statutActuel || 'active',
          dateNaissance: profileData?.dateNaissance || '',
          afficherDateNaissance: profileData?.afficherDateNaissance,
          publierDateNaissance: profileData?.publierDateNaissance
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

  // Liste consolidée des étiquettes disponibles pour le filtre (inclut systématiquement Bureau et C.A.)
  const availableFilterTags = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addTag = (id, label) => {
      const key = String(id).toLowerCase().replace(/\./g, '').trim();
      if (!seen.has(key) && !isDefaultMemberBadge(id) && !isDefaultMemberBadge(label)) {
        seen.add(key);
        list.push({ id, label });
      }
    };

    // 1. Tags institutionnels prioritaires garantis dans le filtre
    addTag('Bureau', '🏛️ Bureau');
    addTag('C.A.', '📜 C.A.');

    // 2. Tags configurés de l'association
    (tagsDisponibles || []).forEach((t) => {
      const id = getTagId(t);
      const label = formatTagGender(t, null, majoriteFeminine, tagsDisponibles);
      if (id) addTag(id, label);
    });

    return list;
  }, [tagsDisponibles, majoriteFeminine]);

  // Distribution des membres dans les 5 pupitres SaaS et isolation des renforts (Dédoublonnage strict)
  const { regularByPupitre, renfortsList, totalFilteredCount } = useMemo(() => {
    const queryStr = searchQuery.trim().toLowerCase();

    const byPupitre = {
      alfaias: [],
      caixas: [],
      gongue: [],
      sementes: [],
      danse: []
    };
    const renforts = [];
    let count = 0;

    members.forEach((member) => {
      if (member.statutActuel === 'archived') return;

      // Expansion automatique des étiquettes (Présidence -> Bureau -> C.A.)
      const effectiveTags = getEffectiveMemberTags(member);

      // 1. Recherche textuelle (Prénom, Nom, Surnom, Ville)
      const fullName = `${member.prenom || ''} ${member.nom || ''} ${member.surnom || ''} ${member.adresseVille || ''}`.toLowerCase();
      if (queryStr && !fullName.includes(queryStr)) return;

      // 2. Filtre par étiquettes (Tags) avec prise en compte des tags effectifs
      if (filterTag !== 'all') {
        const cleanFilter = String(filterTag).toLowerCase().replace(/\./g, '').trim();
        const hasTag = effectiveTags.some((t) => {
          const rawTag = String(getTagId(t) || t).toLowerCase().trim();
          const cleanTag = rawTag.replace(/\./g, '');
          return (
            rawTag === cleanFilter ||
            cleanTag === cleanFilter ||
            (cleanFilter === 'ca' && (cleanTag === 'ca' || cleanTag.includes('conseil'))) ||
            (cleanFilter === 'bureau' && cleanTag === 'bureau')
          );
        });
        if (!hasTag) return;
      }

      const isRenfort = isRenfortMember(member);
      const primaryPupitreId = resolveMemberPrimaryPupitre(member);
      const badges = extractMemberBadges(member, isRenfort ? 'renfort' : primaryPupitreId);
      const isLead = isChantReferent(member);

      const enrichedMember = {
        ...member,
        tags: effectiveTags,
        primaryPupitreId: isRenfort ? 'renfort' : primaryPupitreId,
        secondaryBadges: badges,
        isLeadSinger: isLead,
        isGhost: false
      };

      // 3. Filtre par pupitre / sélection
      if (isRenfort) {
        if (filterInstrument === 'all' || filterInstrument === 'renforts') {
          renforts.push(enrichedMember);
          count++;
        }
      } else {
        if (filterInstrument === 'renforts') {
          return;
        }
        if (filterInstrument === 'all' || filterInstrument === primaryPupitreId) {
          if (byPupitre[primaryPupitreId]) {
            byPupitre[primaryPupitreId].push(enrichedMember);
            count++;
          }
        }
      }
    });

    return { regularByPupitre: byPupitre, renfortsList: renforts, totalFilteredCount: count };
  }, [members, searchQuery, filterInstrument, filterTag]);

  // Détection conditionnelle stricte : y a-t-il des musiciens extérieurs / renforts dans l'association ?
  const hasRenforts = useMemo(() => {
    return (members || []).some((m) => m.statutActuel !== 'archived' && isRenfortMember(m));
  }, [members]);

  // Indique si au moins un filtre est actif
  const hasActiveFilter = Boolean(searchQuery.trim() || filterInstrument !== 'all' || filterTag !== 'all');

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

      {/* Barre de recherche et filtres unifiée (1 seule ligne desktop md:flex-row, empilée verticalement sur mobile) */}
      {!loading && !error && (
        <CordelCard
          variant="default"
          useExtremeBorder={false}
          className="p-2 sm:p-2.5 bg-cordel-bg flex flex-col md:flex-row md:items-center gap-2 md:gap-3 select-none"
        >
          {/* 1. Champ texte avec loupe intégrée à gauche (Prend tout l'espace disponible : flex-1) */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-xs flex items-center leading-none">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Prénom, nom, surnom..."
              className="theme-input w-full pl-10 pr-8 py-1.5 text-xs font-bold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Filtre Pupitre (menu déroulant compact w-auto shrink-0) */}
          <div className="w-full md:w-auto shrink-0">
            <select
              value={filterInstrument}
              onChange={(e) => setFilterInstrument(e.target.value)}
              className="theme-input w-full md:w-auto text-xs font-bold py-1.5 px-2 bg-cordel-bg-light cursor-pointer"
            >
              <option value="all">Tous les pupitres</option>
              {FIVE_PUPITRES.map((pupitre) => (
                <option key={pupitre.id} value={pupitre.id}>{pupitre.label}</option>
              ))}
              {hasRenforts && (
                <option value="renforts">🎪 Renforts &amp; Extérieurs</option>
              )}
            </select>
          </div>

          {/* 3. Filtre Étiquettes / Badges (menu déroulant compact w-auto shrink-0) */}
          <div className="w-full md:w-auto shrink-0">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="theme-input w-full md:w-auto text-xs font-bold py-1.5 px-2 bg-cordel-bg-light cursor-pointer"
            >
              <option value="all">🏷️ Toutes les étiquettes</option>
              {availableFilterTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.label}</option>
              ))}
            </select>
          </div>

          {/* 4. Compteur d'adhérents / Remise à zéro */}
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterInstrument('all');
                setFilterTag('all');
              }}
              className="w-full md:w-auto shrink-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded border border-cordel-wood/40 text-[11px] font-bold text-[var(--color-cordel-marron,#8b2a1a)] bg-cordel-bg-light hover:bg-stone-200 transition-colors cursor-pointer"
              title="Réinitialiser tous les filtres"
            >
              <span>✕</span>
              <span>{totalFilteredCount} {totalFilteredCount > 1 ? 'membres' : 'membre'}</span>
            </button>
          ) : (
            <div className="w-full md:w-auto shrink-0 text-center md:text-right px-2 py-1 text-[11px] font-extrabold text-stone-600 dark:text-stone-300 whitespace-nowrap">
              {totalFilteredCount} {totalFilteredCount > 1 ? 'membres' : 'membre'}
            </div>
          )}
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
          {totalFilteredCount === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
              <p className="text-xs font-bold opacity-75">{t('trombinoscope.noMembers')}</p>
            </CordelCard>
          ) : (
            <div className="flex flex-col gap-8">
              {/* 5 Pupitres SaaS ordonnés */}
              {FIVE_PUPITRES.map((sec) => {
                const sectionMembers = regularByPupitre[sec.id] || [];
                if (sectionMembers.length === 0) return null;

                return (
                  <div key={sec.id} className="flex flex-col gap-4">
                    {/* En-tête du pupitre avec son tampon xylogravé */}
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

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3 items-stretch">
                      {sectionMembers.map((member) => (
                        <MemberStampCard
                          key={member.id}
                          member={member}
                          isOnline={member.isOnline === true}
                          isCurrentUser={Boolean(user?.uid && member.id === user.uid)}
                          pupitreColor={getColorForInstrument(sec.colorKey, 'solid') || '#181716'}
                          onClick={(m) => setSelectedMember(m)}
                          onEditPhoto={handleEditPhoto}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Section isolée pour les renforts & musiciens extérieurs (masquage strict si aucun renfort) */}
              {hasRenforts && renfortsList.length > 0 && (
                <div className="flex flex-col gap-4 mt-2 pt-6 border-t-2 border-dashed border-cordel-master-dark/30">
                  <div className="border-b border-dashed border-cordel-master-dark/20 pb-2 text-left flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-marron,#8b2a1a)] flex items-center gap-1.5 select-none">
                      <span>🎪 Renforts & Musiciens extérieurs</span>
                      <span className="text-[11px] font-bold text-stone-500 font-sans tracking-normal ml-0.5">
                        ({renfortsList.length})
                      </span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3 items-stretch">
                    {renfortsList.map((member) => (
                      <MemberStampCard
                        key={member.id}
                        member={member}
                        isOnline={member.isOnline === true}
                        isCurrentUser={Boolean(user?.uid && member.id === user.uid)}
                        pupitreColor={getColorForInstrument(member.instrumentPrincipal || member.instrument || 'Renfort', 'solid') || '#181716'}
                        onClick={(m) => setSelectedMember(m)}
                        onEditPhoto={handleEditPhoto}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
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
