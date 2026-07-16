import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import XiloAvatar from './XiloAvatar';

export default function Trombinoscope({ user, profileData, onBack }) {
  const [members, setMembers] = useState([]);
  const [tagsDisponibles, setTagsDisponibles] = useState([]);
  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const DEFAULT_INSTRUMENTS = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Paroles", "Chant", "Danse"];
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstrument, setFilterInstrument] = useState('all');
  const [filterLateralite, setFilterLateralite] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

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
        photoURL: user.photoURL,
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
        fetchedMembers.push({
          id: doc.id,
          ...data,
          photoURL: doc.id === user.uid ? user.photoURL : data.photoURL || null
        });
      });

      if (fetchedMembers.length === 0) {
        fetchedMembers.push({
          id: user.uid,
          prenom: profileData?.prenom || 'Vous',
          nom: profileData?.nom || '',
          email: user.email,
          photoURL: user.photoURL,
          role: profileData?.role || 'membre',
          tags: profileData?.tags || [],
          statutActuel: profileData?.statutActuel || 'active'
        });
      }

      setMembers(fetchedMembers);
      setLoading(false);
    }, (err) => {
      console.error("Trombinoscope - Erreur Firestore :", err);
      setError("Impossible de charger les membres du groupe.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData, user]);

  // Cascade Filtering logic
  const filteredMembers = members.filter((member) => {
    const fullName = `${member.prenom || ''} ${member.nom || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    const matchesInstrument = filterInstrument === 'all' || 
      member.instrument === filterInstrument;

    const matchesLateralite = filterLateralite === 'all' || 
      member.lateralite === filterLateralite;

    const matchesTag = filterTag === 'all' || 
      (member.tags && member.tags.includes(filterTag));

    return matchesSearch && matchesInstrument && matchesLateralite && matchesTag;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center py-2 border-b-2 border-dashed border-cordel-master-dark/30 flex justify-between items-center">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ← Retour
        </CordelButton>
        <span className="panel-title text-xl font-extrabold tracking-wider text-cordel-wood">
          TROMBINOSCOPE
        </span>
        <div className="w-16"></div> {/* Spacer for symmetry */}
      </div>

      {/* Info / Group badge */}
      <div className="text-center -mt-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-cordel-master-dark opacity-65">
          Groupe : {profileData?.groupId || 'Aucun groupe assigné'}
        </span>
      </div>

      {/* Dynamic Search & Filters Toolbar */}
      {!loading && !error && (
        <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg flex flex-col gap-3">
          {/* Saisie textuelle */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
              🔍 Rechercher un membre
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Prénom ou Nom de famille..."
              className="theme-input w-full text-xs font-bold py-1.5"
            />
          </div>

          {/* Sélecteurs déroulants */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
                🥁 Instrument
              </label>
              <select
                value={filterInstrument}
                onChange={(e) => setFilterInstrument(e.target.value)}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="all">Tous</option>
                {instrumentsDisponibles.map((inst) => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
                🫱 Latéralité
              </label>
              <select
                value={filterLateralite}
                onChange={(e) => setFilterLateralite(e.target.value)}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="all">Toutes</option>
                <option value="droitier">Droitier</option>
                <option value="gaucher">Gaucher</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
                🏷️ Tag / Badge
              </label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="all">Tous</option>
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
            Impression en cours...
          </span>
        </div>
      ) : error ? (
        <CordelCard variant="default" useExtremeBorder={true} className="text-center py-8">
          <p className="text-sm font-bold text-cordel-wood mb-4">{error}</p>
          <CordelButton variant="ocre" onClick={onBack}>Retour</CordelButton>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Group Warning if no groupId */}
          {!profileData?.groupId && (
            <CordelCard variant="ocre" useExtremeBorder={false} className="p-3 text-left">
              <p className="text-xs leading-relaxed font-semibold">
                ⚠️ Vous n'avez pas de groupe associé. Vous ne voyez que votre profil. Rapprochez-vous du Mestre pour obtenir votre lien d'invitation.
              </p>
            </CordelCard>
          )}

          {/* Grille responsive de portraits */}
          {filteredMembers.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
              <p className="text-xs font-bold opacity-75">Aucun membre ne correspond à vos filtres.</p>
            </CordelCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMembers.map((member) => {
                const fullName = `${member.prenom} ${member.nom}`;
                const hasRoleBadge = member.role && member.role !== 'membre';
                const hasTags = member.tags && member.tags.length > 0;

                const isViewerAdmin = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;
                const isPhoneEnabled = fieldsConfig?.telephone?.enabled !== false;
                const showPhone = isPhoneEnabled && member.telephone && (isViewerAdmin || member.publierTelephone === true);

                const isBirthdateEnabled = fieldsConfig?.dateNaissance?.enabled !== false;
                const showBirthdate = isBirthdateEnabled && member.dateNaissance && (isViewerAdmin || member.publierDateNaissance === true);

                return (
                  <div key={member.id} className="relative flex flex-col items-center">
                    <CordelCard 
                      variant="default" 
                      useExtremeBorder={true} 
                      className="w-full flex flex-col items-center p-4 min-h-[220px] relative overflow-hidden"
                    >
                      {/* Avatar with Xylogravure Filter */}
                      <div className="mb-3">
                        <XiloAvatar src={member.photoURL} name={fullName} size={72} />
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
                      <div className="text-center mt-2 text-[9px] leading-tight text-cordel-master-dark/85 flex flex-col gap-0.5 w-full">
                        <span className="font-semibold text-cordel-wood">🥁 {member.instrument || 'Autre'}</span>
                        {showPhone && (
                          <span className="truncate">📞 {member.telephone}</span>
                        )}
                        {showBirthdate && (
                          <span>🎂 {member.dateNaissance ? new Date(member.dateNaissance).toLocaleDateString('fr-FR') : ''}</span>
                        )}
                      </div>

                      {/* Member Tags (Custom ink stamp badges) */}
                      {hasTags && (
                        <div className="flex flex-wrap gap-1 mt-2.5 justify-center max-w-full z-10">
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

                      {/* Role Stamp overlay */}
                      {hasRoleBadge && (
                        <div className="absolute top-2 -right-1 z-25">
                          <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] rotate-[-6deg] select-none">
                            {member.role}
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
    </div>
  );
}
