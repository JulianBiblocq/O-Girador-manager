import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import XiloAvatar from './XiloAvatar';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import { XiloCaixa, XiloPeople } from './XiloIcons';
import CordelImageEditor from './CordelImageEditor';

export default function Trombinoscope({ user, profileData, onBack, onContactUser }) {
  const { t, locale } = useTranslation();
  const { tRole } = useTerminologie();
  const [members, setMembers] = useState([]);
  const [tagsDisponibles, setTagsDisponibles] = useState([]);
  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isViewerAdmin = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

  const [showEditor, setShowEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"];
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);
  const [linkedInstruments, setLinkedInstruments] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  const getPupitreName = (inst) => {
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
  };

  // Load association tags and instruments
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
          delete cleanData.adresseVille;
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
  }, [profileData, user]);

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

      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/profile_pic_${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save to Firestore users collection
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL
      });

      // Update local state immediately
      setMembers(prev => prev.map(m => m.id === user.uid ? { ...m, photoURL: downloadURL } : m));

      alert(t('common.saveSuccess') || "Photo mise à jour !");
    } catch (err) {
      console.error("Trombinoscope - Erreur d'upload de photo :", err);
      alert(t('common.saveError') || "Erreur lors de la sauvegarde.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Cascade Filtering logic
  const filteredMembers = members.filter((member) => {
    // Exclude archived members from the Trombinoscope
    if (member.statutActuel === 'archived') return false;

    const fullName = `${member.prenom || ''} ${member.nom || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    const matchesInstrument = filterInstrument === 'all' || 
      member.instrument === filterInstrument;

    const matchesTag = filterTag === 'all' || 
      (member.tags && member.tags.includes(filterTag));

    return matchesSearch && matchesInstrument && matchesTag;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center py-2 border-b-2 border-dashed border-cordel-master-dark/30 flex justify-between items-center">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-xl font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
          <XiloPeople size={18} /> {t('trombinoscope.title')}
        </span>
        <div className="w-16"></div> {/* Spacer for symmetry */}
      </div>

      {/* Info / Group badge */}
      <div className="text-center -mt-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-cordel-master-dark opacity-65">
          {t('trombinoscope.group')}{profileData?.groupId || t('trombinoscope.noGroup')}
        </span>
      </div>

      {/* Dynamic Search & Filters Toolbar */}
      {!loading && !error && (
        <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg flex flex-col gap-3">
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
                {tagsDisponibles.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </CordelCard>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex-1 flex flex-col justify-center items-center py-20">
          <div className="animate-spin text-3xl mb-4 select-none">⏳</div>
          <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
            {t('trombinoscope.loading')}
          </span>
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
            <div 
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
            >
              {filteredMembers.map((member) => {
                const fullName = `${member.prenom} ${member.nom}`;
                const hasRoleBadge = member.role && member.role !== 'membre';
                const hasTags = member.tags && member.tags.length > 0;

                const isPhoneEnabled = fieldsConfig?.telephone?.enabled !== false;
                const showPhone = isPhoneEnabled && member.telephone && (member.id === user.uid || isViewerAdmin || member.publierTelephone === true);

                const isBirthdateEnabled = fieldsConfig?.dateNaissance?.enabled !== false;
                const showBirthdate = isBirthdateEnabled && member.dateNaissance && (member.id === user.uid || isViewerAdmin || member.publierDateNaissance === true);

                // Instruments and Danse conditional logic
                const userInstruments = member.instrumentsJoues && member.instrumentsJoues.length > 0
                  ? member.instrumentsJoues
                  : [member.instrument].filter(Boolean);

                const percussions = userInstruments.filter(inst => {
                  const norm = inst.toLowerCase().trim();
                  return norm !== 'danse' && norm !== 'chant' && norm !== 'aucun' && norm !== '';
                });

                const hasPercussions = percussions.length > 0;
                const percuLevel = member.niveau;

                const hasDanse = (member.niveauDanse && member.niveauDanse !== 'aucun') || userInstruments.some(inst => inst.toLowerCase().trim() === 'danse');
                const danseLevel = member.niveauDanse && member.niveauDanse !== 'aucun' ? member.niveauDanse : null;

                return (
                  <div key={member.id} className="relative flex flex-col items-center">
                    <CordelCard 
                      variant="default" 
                      useExtremeBorder={true} 
                      className="w-full flex flex-col items-center p-4 min-h-[220px] relative overflow-hidden"
                    >
                      {/* Avatar with Xylogravure Filter */}
                      <div className="mb-3 relative group">
                        <XiloAvatar src={member.photoURL} name={fullName} size={72} />
                        {member.id === user.uid && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImage(member.photoURL || user.photoURL);
                              setShowEditor(true);
                            }}
                            className="absolute -bottom-1 -right-1 bg-encre-noire text-cordel-bg-light hover:bg-cordel-wood rounded-full p-1 border border-encre-noire shadow-[1px_1px_0px_0px_#181716] cursor-pointer z-30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                            title="Éditer la photo (Filtre Xylogravure)"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Member Name */}
                      <div className="text-center mt-1 w-full">
                        <div className="font-bold text-xs truncate leading-snug">
                          {member.prenom}
                        </div>
                        <div className="font-bold text-xs truncate leading-none uppercase text-[10px] opacity-75 mt-0.5">
                          {member.nom}
                        </div>
                      </div>

                      {/* Member Details */}
                      <div className="text-center mt-2.5 text-[9px] leading-tight text-cordel-master-dark/85 flex flex-col gap-1.5 w-full">
                        {hasPercussions && (
                          <div className="flex flex-col items-center">
                            <span className="font-extrabold text-cordel-wood flex items-center justify-center gap-0.5 uppercase text-[8.5px] tracking-wider">
                              <XiloCaixa size={9} /> Percussion {percuLevel && `(${percuLevel === 'confirme' ? t('userProfile.levelConfirmSimple') || 'Confirmé' : percuLevel === 'debutant' ? t('userProfile.levelBeginner') || 'Débutant' : t('common.none') || 'Aucun'})`}
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
                            <span className="font-semibold text-encre-noire text-[9.5px] mt-0.5">
                              {danseLevel ? (danseLevel === 'confirme' ? t('userProfile.levelConfirmSimple') || 'Confirmé' : t('userProfile.levelBeginner') || 'Débutant') : (t('userProfile.levelBeginner') || 'Débutant')}
                            </span>
                          </div>
                        )}

                        {(showPhone || showBirthdate) && (
                          <div className={`flex flex-col items-center mt-1.5 border-t border-dashed border-cordel-master-dark/10 pt-1.5 gap-0.5 text-cordel-master-dark/75 font-bold`}>
                            {showPhone && (
                              <span className="truncate">📞 {member.telephone}</span>
                            )}
                            {showBirthdate && (
                              <span>🎂 {member.dateNaissance ? new Date(member.dateNaissance).toLocaleDateString('fr-FR') : ''}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Member Tags (Custom ink stamp badges) */}
                      {hasTags && (
                        <div className="flex flex-wrap gap-1 mt-3 justify-center max-w-full z-10">
                          {member.tags.map((tag, tagIdx) => {
                            const rotation = ((tag.charCodeAt(0) + tagIdx) % 5) - 2; // -2deg to 2deg
                            return (
                              <span 
                                key={tag} 
                                style={{ transform: `rotate(${rotation}deg)` }}
                                className="theme-stamp-badge theme-stamp-badge-wood text-[7px] px-1.5 py-0.5 border-dashed select-none bg-transparent shadow-none"
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Contact button */}
                      {member.id !== user.uid && onContactUser && (
                        <button
                          type="button"
                          onClick={() => onContactUser(member.id)}
                          className="mt-3 text-[9px] font-black uppercase tracking-wider bg-cordel-bg-light text-encre-noire border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-cordel-hover cursor-pointer flex items-center justify-center gap-1 w-full max-w-[120px] mx-auto transition-all select-none z-10"
                        >
                          ✉️ Contacter
                        </button>
                      )}

                      {/* Role Stamp overlay */}
                      {hasRoleBadge && (
                        <div className="absolute top-2 -right-1 z-25">
                          <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] rotate-[-6deg] select-none">
                            {tRole(member.role, member.genre)}
                          </span>
                        </div>
                      )}
                    </CordelCard>
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
              <CordelImageEditor 
                imageSrc={selectedImage}
                lang={locale || 'fr'}
                onComplete={handleEditorComplete}
                onCancel={() => {
                  setShowEditor(false);
                  setSelectedImage(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
