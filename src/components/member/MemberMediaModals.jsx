import React from 'react';
import TablatureModal from '../mestre/TablatureModal';
import PieceLyricsModal from './PieceLyricsModal';
import PieceCultureModal from './PieceCultureModal';

/**
 * Modales multimédias et d'apprentissage pour le Répertoire Adhérent.
 * Isole les fenêtres modales de Tablature, Paroles (PieceLyricsModal)
 * et Fiches Culturelles (PieceCultureModal) (Règle Anti-Monolithe).
 */
export default function MemberMediaModals({
  activeTablaturePiece,
  onCloseTablature,
  activeToadaToView,
  onCloseToada,
  activeCultureDocToView,
  onCloseCulture,
  groupId,
  profileData
}) {
  return (
    <>
      {/* Modale de consultation de la tablature */}
      <TablatureModal
        isOpen={Boolean(activeTablaturePiece)}
        onClose={onCloseTablature}
        piece={activeTablaturePiece}
      />

      {/* Modale d'apprentissage Paroles (Option A Parolier, Option B Récitation, Option C Quiz) */}
      <PieceLyricsModal
        isOpen={Boolean(activeToadaToView)}
        onClose={onCloseToada}
        song={activeToadaToView}
        piece={activeToadaToView?.piece}
        groupId={groupId}
        profileData={profileData}
      />

      {/* Modale d'apprentissage Culture (Option A Lire la fiche, Option B Quiz Culture, Sélecteur multi-fiches) */}
      <PieceCultureModal
        isOpen={Boolean(activeCultureDocToView)}
        onClose={onCloseCulture}
        cultureDocs={activeCultureDocToView?.docs || (activeCultureDocToView ? [activeCultureDocToView] : [])}
        initialDocId={activeCultureDocToView?.id}
        piece={activeCultureDocToView?.piece}
        groupId={groupId}
        profileData={profileData}
      />
    </>
  );
}
