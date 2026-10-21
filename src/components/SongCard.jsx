import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import PrintConfigModal from './PrintConfigModal';
import RepertoirePasserelleButton from './repertoire/RepertoirePasserelleButton';
import SongCardHeader from './song/SongCardHeader';
import SongCardLyricsSection from './song/SongCardLyricsSection';
import SongCardDetailsSection from './song/SongCardDetailsSection';
import { useTranslation } from './LanguageContext';

/**
 * Composant Fiche de Chant (Toada) O-Girador (restauration 14-16 octobre).
 * Structure de pagination par table HTML, portail d'impression dynamique,
 * boutons d'action d'entraînement et révision 1-clic.
 */
export default function SongCard({
  song,
  isPrintVersion = false,
  defaultRevisionMode = true,
  onPrintAll,
  printSections = null,
  isRevisionRequested = null,
  onToggleRevision = null,
  profileData = null,
  userId = null,
  groupId = null,
  onNavigateToView = null
}) {
  const { t } = useTranslation();
  const [activePuxador, setActivePuxador] = useState(!defaultRevisionMode || isPrintVersion);
  const [activeChoeur, setActiveChoeur] = useState(!defaultRevisionMode || isPrintVersion);
  const [localReveals, setLocalReveals] = useState({});
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [localPrintSections, setLocalPrintSections] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

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

  const handleToggleClick = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onToggleRevision) {
      onToggleRevision();
      return;
    }
    if (!effectiveUserId || !effectiveGroupId || !song?.id) return;
    const nextVal = !effectiveIsRequested;
    setInternalRequested(nextVal);

    try {
      const pRef = doc(db, 'users', effectiveUserId, 'parcours', effectiveGroupId);
      try {
        await updateDoc(pRef, { [`revisionsDemandees.${song.id}`]: nextVal });
      } catch {
        await setDoc(pRef, { revisionsDemandees: { [song.id]: nextVal } }, { merge: true });
      }
    } catch (err) {
      console.error('SongCard - Erreur sauvegarde révision :', err);
    }
  };

  const getSectionVisibility = (section) => {
    if (!isPrintVersion) return true;
    const activeSections = printSections || localPrintSections;
    if (!activeSections) return true;
    return Boolean(activeSections[section]);
  };

  const renderFlashcard = (id, content, extraClass = '') => {
    if (isRevealedMode) return <div className={extraClass}>{content}</div>;
    if (localReveals[id]) {
      return (
        <div onClick={() => setLocalReveals((prev) => ({ ...prev, [id]: false }))} className={`${extraClass} cursor-pointer hover:opacity-80 transition-opacity`}>
          {content}
        </div>
      );
    }
    return (
      <div
        onClick={() => setLocalReveals((prev) => ({ ...prev, [id]: true }))}
        className={`relative cursor-pointer group rounded border border-dashed border-cordel-master-dark/30 overflow-hidden bg-[#fdfaf2] dark:bg-[#1a1816] flex items-center justify-center min-h-[1.5em] min-w-[60px] ${extraClass}`}
      >
        <div className="absolute inset-0 bg-[#fdfaf2] dark:bg-[#1a1816] flex items-center justify-center transition-all group-hover:bg-[#fdfaf2]/90 dark:group-hover:bg-[#1a1816]/90 z-10">
          <span className="bg-cordel-wood text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-md transform group-hover:scale-105 transition-transform">
            👁️ {t('pedagogy.btnReveal') || 'Découvrir'}
          </span>
        </div>
        <div className="opacity-0 select-none">{content}</div>
      </div>
    );
  };

  const handlePrint = ({ format = 'A4', isBW = false, isBulk = false, printSections: selectedSections = null }) => {
    if (isBulk && onPrintAll) {
      setShowPrintModal(false);
      onPrintAll({ format, isBW, printSections: selectedSections });
      return;
    }
    setShowPrintModal(false);
    setLocalPrintSections(selectedSections);
    setIsPrinting(true);

    if (isBW) document.body.classList.add('print-bw');
    document.body.classList.add(`print-format-${format}`);
    document.body.classList.add('printing-song');

    const styleId = 'dynamic-print-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const margins = { A5: '10mm', A4: '15mm', A3: '20mm' };
    styleEl.innerHTML = `@media print { @page { size: ${format}; margin: ${margins[format] || '15mm'}; } }`;

    setTimeout(() => {
      window.print();
      if (isBW) document.body.classList.remove('print-bw');
      document.body.classList.remove(`print-format-${format}`);
      document.body.classList.remove('printing-song');
      if (styleEl) styleEl.innerHTML = '';
      setIsPrinting(false);
    }, 150);
  };

  if (!song) return null;

  return (
    <>
      <div
        id={`song-card-${song?.id || 'temp'}`}
        className="bg-[#fdfaf2] dark:bg-[#1a1816] border-2 border-encre-noire rounded-lg shadow-[3px_3px_0px_0px_#181716] w-full max-w-[580px] mx-auto flex flex-col relative print:shadow-none print:border-none print:max-w-full print:min-h-0 print:h-auto print:mx-0 print:overflow-visible text-left"
      >
        {/* Boutons d'actions fiche (Impression & Demande de révision 1-clic) */}
        {!isPrintVersion && (
          <div className="absolute top-3 left-3 z-20 print:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              title={t('pedagogy.cards.imprimerCetteFiche') || 'Imprimer cette fiche'}
              className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-cordel-master-dark/30 text-cordel-master-dark/60 hover:bg-neutral-100 transition-all hover:text-cordel-wood hover:border-cordel-wood cursor-pointer bg-white"
            >
              🖨️
            </button>

            {song?.id && (
              <button
                type="button"
                onClick={handleToggleClick}
                className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all border shadow-xs flex items-center gap-1 cursor-pointer ${
                  effectiveIsRequested
                    ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-[#1b4332]'
                    : 'bg-[#fdfaf2] text-cordel-master-dark hover:bg-white border-encre-noire/30'
                }`}
                title={effectiveIsRequested ? 'Demande de révision active pour ce chant' : 'Signaler au Mestre le besoin de réviser ce chant'}
              >
                <span>🙋</span>
                <span>{effectiveIsRequested ? (t('pedagogy.revisionRequestedNotice') || 'Révision demandée ✓') : (t('pedagogy.btnAskToRevise') || 'Demander à réviser')}</span>
              </button>
            )}
          </div>
        )}

        {/* Structure Table pour saut de page pagination A4/A5 */}
        <table className="w-full table-fixed border-collapse">
          <thead className="table-header-group">
            <tr>
              <td className="p-4 md:p-6 pb-0 pt-4 print:pt-0">
                <SongCardHeader
                  song={song}
                  isPrintVersion={isPrintVersion}
                  groupId={effectiveGroupId}
                  onNavigateToView={onNavigateToView}
                  renderFlashcard={renderFlashcard}
                />
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 md:px-6 pb-6 pt-1 md:pt-2 print:pt-1">
                {/* Toggles d'entraînement Puxador / Chœur */}
                {!isRevealedMode && (
                  <div className="flex justify-center gap-4 md:gap-6 py-2 mb-4 bg-cordel-wood/5 rounded border border-cordel-wood/20">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activePuxador}
                        onChange={(e) => setActivePuxador(e.target.checked)}
                        className="accent-cordel-wood w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-encre-noire">
                        {t('pedagogy.cards.puxadorSoliste') || 'Puxador (Soliste)'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeChoeur}
                        onChange={(e) => setActiveChoeur(e.target.checked)}
                        className="accent-cordel-wood w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-encre-noire">
                        {t('pedagogy.cards.coroChUr') || 'Coro (Chœur)'}
                      </span>
                    </label>
                  </div>
                )}

                {/* Paroles en 2 colonnes côte à côte */}
                <SongCardLyricsSection
                  song={song}
                  activePuxador={activePuxador}
                  activeChoeur={activeChoeur}
                  isRevealedMode={isRevealedMode}
                  showOriginal={getSectionVisibility('originale')}
                  showPhonetic={getSectionVisibility('phonetique')}
                />

                {/* Traduction, Lexique à bordure orange et Anecdote */}
                <SongCardDetailsSection
                  song={song}
                  groupId={effectiveGroupId}
                  onNavigateToView={onNavigateToView}
                  isPrintVersion={isPrintVersion}
                  printSections={localPrintSections || printSections}
                  renderFlashcard={renderFlashcard}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modale de configuration d'impression */}
      {showPrintModal && (
        <PrintConfigModal
          title={`Imprimer "${song?.titre || 'Chant'}"`}
          onClose={() => setShowPrintModal(false)}
          onConfirm={handlePrint}
          allowBulk={Boolean(onPrintAll)}
        />
      )}

      {/* Rendu portail dédié à l'impression */}
      {isPrinting && createPortal(
        <div className="print:block bg-white w-full">
          <div className="print-song-page">
            <SongCard
              song={song}
              defaultRevisionMode={false}
              isPrintVersion={true}
              printSections={localPrintSections}
              groupId={effectiveGroupId}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
