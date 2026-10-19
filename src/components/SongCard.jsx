import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import PrintConfigModal from './PrintConfigModal';
import CordelCard from './CordelCard';
import SongCardHeader from './song/SongCardHeader';
import SongCardLyricsSection from './song/SongCardLyricsSection';
import SongCardDetailsSection from './song/SongCardDetailsSection';

/**
 * Composant Fiche de Chant (Toada) O-Girador (< 130 lignes).
 * Orchestration modulaire de l'en-tête, des paroles et du contexte.
 * Intègre RepertoirePasserelleButton (délégué à SongCardDetailsSection).
 */
export default function SongCard({
  song,
  isPrintVersion = false,
  defaultRevisionMode = true,
  onPrintAll,
  isRevisionRequested = null,
  onToggleRevision = null,
  profileData = null,
  userId = null,
  groupId = null,
  onNavigateToView = null
}) {
  const [activePuxador, setActivePuxador] = useState(true);
  const [activeChoeur, setActiveChoeur] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const isRevealedMode = isPrintVersion || !defaultRevisionMode;

  // Gestion autonome ou contrôlée de la révision 1-clic
  const effectiveUserId = userId || profileData?.uid || profileData?.id || auth?.currentUser?.uid;
  const effectiveGroupId = groupId || profileData?.groupId || song?.groupId;
  const [internalRequested, setInternalRequested] = useState(false);

  useEffect(() => {
    if (isRevisionRequested !== null && isRevisionRequested !== undefined) {
      setInternalRequested(isRevisionRequested);
    } else if (effectiveUserId && effectiveGroupId && song?.id) {
      getDoc(doc(db, 'users', effectiveUserId, 'parcours', effectiveGroupId))
        .then((snap) => {
          if (snap.exists()) setInternalRequested(Boolean(snap.data().revisionsDemandees?.[song.id]));
        })
        .catch(() => {});
    }
  }, [isRevisionRequested, effectiveUserId, effectiveGroupId, song?.id]);

  const effectiveIsRequested = isRevisionRequested !== null && isRevisionRequested !== undefined ? isRevisionRequested : internalRequested;

  const handleToggleClick = async () => {
    if (onToggleRevision) {
      onToggleRevision();
      return;
    }
    if (!effectiveUserId || !effectiveGroupId || !song?.id) return;
    const nextVal = !effectiveIsRequested;
    setInternalRequested(nextVal);

    try {
      const pRef = doc(db, 'users', effectiveUserId, 'parcours', effectiveGroupId);
      await setDoc(pRef, { revisionsDemandees: { [song.id]: nextVal } }, { merge: true });
    } catch (err) {
      console.error("SongCard - Erreur sauvegarde révision :", err);
    }
  };

  const handlePrintSubmit = (config) => {
    setShowPrintModal(false);
    if (config.isBulk && onPrintAll) {
      onPrintAll(config);
      return;
    }
    window.print();
  };

  if (!song) return null;

  return (
    <CordelCard
      variant="default"
      useExtremeBorder={true}
      className="p-4 sm:p-6 flex flex-col gap-4 bg-[#fdfaf2] text-encre-noire w-full max-w-2xl mx-auto shadow-lg"
    >
      {/* 1. En-tête de la Toada */}
      <SongCardHeader
        song={song}
        isPrintVersion={isPrintVersion}
        isRevealedMode={isRevealedMode}
        effectiveIsRequested={effectiveIsRequested}
        onToggleRevision={handleToggleClick}
        onOpenPrintModal={() => setShowPrintModal(true)}
      />

      {/* 2. Paroles épurées avec bandeau musical et accords */}
      <SongCardLyricsSection
        song={song}
        activePuxador={activePuxador}
        setActivePuxador={setActivePuxador}
        activeChoeur={activeChoeur}
        setActiveChoeur={setActiveChoeur}
        isRevealedMode={isRevealedMode}
      />

      {/* 3. Traduction, Contexte et Passerelle Répertoire */}
      <SongCardDetailsSection
        song={song}
        groupId={effectiveGroupId}
        onNavigateToView={onNavigateToView}
      />

      {/* 4. Modale de configuration d'impression */}
      {showPrintModal && (
        <PrintConfigModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          onPrint={handlePrintSubmit}
          hasBulkOption={Boolean(onPrintAll)}
        />
      )}
    </CordelCard>
  );
}
