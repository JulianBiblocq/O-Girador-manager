// Hook contrôleur de SongCard : suivi de vue Varal, demande de révision 1-clic et tirage fiche (< 115 lignes).
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { recordVaralDocumentView } from '../utils/varalViewTracker';
import { executeToadaWindowPrint } from '../utils/toadaPrintRunner';
import { normalizePrintSections } from '../utils/toadaPrintPrefsUtils';

export default function useSongCardController({
  song,
  isPrintVersion = false,
  isRevisionRequested = null,
  onToggleRevision = null,
  profileData = null,
  userId = null,
  groupId = null,
  onPrintAll = null
}) {
  const effectiveUserId = userId || profileData?.uid || profileData?.id || auth?.currentUser?.uid || null;
  const effectiveGroupId = groupId || profileData?.groupId || song?.groupId || null;

  const [internalRequested, setInternalRequested] = useState(false);
  const [localReveals, setLocalReveals] = useState({});
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSongbookModal, setShowSongbookModal] = useState(false);
  const [localPrintJob, setLocalPrintJob] = useState(null);

  useEffect(() => {
    if (!isPrintVersion && song?.id) recordVaralDocumentView(song, effectiveUserId);
  }, [isPrintVersion, song, effectiveUserId]);

  useEffect(() => {
    if (isRevisionRequested !== null && isRevisionRequested !== undefined) {
      setInternalRequested(isRevisionRequested);
    } else if (!isPrintVersion && effectiveUserId && effectiveGroupId && song?.id) {
      getDoc(doc(db, 'users', effectiveUserId, 'parcours', effectiveGroupId))
        .then((snap) => {
          if (snap.exists()) setInternalRequested(Boolean(snap.data().revisionsDemandees?.[song.id]));
        })
        .catch(() => {});
    }
  }, [isPrintVersion, isRevisionRequested, effectiveUserId, effectiveGroupId, song?.id]);

  const effectiveIsRequested = isRevisionRequested !== null && isRevisionRequested !== undefined
    ? isRevisionRequested
    : internalRequested;

  const handleToggleClick = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (onToggleRevision) { onToggleRevision(); return; }
    if (!effectiveUserId || !effectiveGroupId || !song?.id) return;
    const nextVal = !effectiveIsRequested;
    setInternalRequested(nextVal);
    try {
      const pRef = doc(db, 'users', effectiveUserId, 'parcours', effectiveGroupId);
      try { await updateDoc(pRef, { [`revisionsDemandees.${song.id}`]: nextVal }); }
      catch { await setDoc(pRef, { revisionsDemandees: { [song.id]: nextVal } }, { merge: true }); }
    } catch { /* Silencieux */ }
  };

  const handleConfirmSinglePrint = ({
    format = 'A4',
    isBW = false,
    bwMode = false,
    isBulk = false,
    printSections = null,
    sections = null,
    lyricsColumnsMode = 'auto',
    margins = null
  }) => {
    const resolvedSections = normalizePrintSections(sections || printSections);
    const resolvedBw = Boolean(bwMode || isBW);
    if (isBulk && onPrintAll) {
      setShowPrintModal(false);
      onPrintAll({ format, isBW: resolvedBw, printSections: resolvedSections, margins });
      return;
    }
    setShowPrintModal(false);
    setLocalPrintJob({ sections: resolvedSections, lyricsColumnsMode });
    executeToadaWindowPrint({
      format,
      bwMode: resolvedBw,
      margins,
      onDone: () => setLocalPrintJob(null)
    });
  };

  return {
    effectiveGroupId,
    effectiveIsRequested,
    localReveals,
    setLocalReveals,
    showPrintModal,
    setShowPrintModal,
    showSongbookModal,
    setShowSongbookModal,
    localPrintJob,
    handleToggleClick,
    handleConfirmSinglePrint
  };
}
