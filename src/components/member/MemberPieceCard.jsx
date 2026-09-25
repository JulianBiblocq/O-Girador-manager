import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import MemberPieceUnfoldedContent from './MemberPieceUnfoldedContent';
import PieceSignalsModal from './PieceSignalsModal';
import PieceLyricsModal from './PieceLyricsModal';
import PieceCultureModal from './PieceCultureModal';

// Échelle des 4 niveaux de confort personnel de l'adhérent
export const COMFORT_LEVELS = [
  { level: 1, label: 'Découverte', icon: '🌱', tip: 'En phase de découverte' },
  { level: 2, label: 'En pratique', icon: '🌿', tip: "En cours d'apprentissage" },
  { level: 3, label: 'À l\'aise', icon: '🌳', tip: 'Autonome sur le morceau' },
  { level: 4, label: 'Référent', icon: '👑', tip: 'Parfaitement maîtrisé, prêt à guider' }
];

/**
 * Carte individuelle repliable d'un morceau du Répertoire (< 200 lignes).
 * Mode replié : En-tête avec titre, indicateur, curseur de confort et demande de révision.
 * Mode déplié : Ressources multimédias via MemberPieceUnfoldedContent et modales dédiées.
 */
export default function MemberPieceCard({
  piece,
  userId,
  groupId,
  profileData = null,
  trainings = [],
  aisanceMap = {},
  isRevisionRequested = false,
  comfortLevel = 0,
  isExpanded = false,
  onToggleExpand,
  onToggleRevision,
  onSetComfortLevel,
  onOpenTablature,
  onOpenToada,
  onOpenCulture,
  onOpenSignals = null,
  sequenceurUrl
}) {
  const [isSignalsModalOpen, setIsSignalsModalOpen] = useState(false);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [isCultureModalOpen, setIsCultureModalOpen] = useState(false);

  if (!piece) return null;

  return (
    <CordelCard
      variant="default"
      useExtremeBorder={true}
      className="p-0 overflow-hidden flex flex-col text-left transition-all border-2 border-encre-noire"
    >
      {/* 1. En-tête repliable (toujours visible, style Cordel avec cadre noir net) */}
      <div
        onClick={onToggleExpand}
        className={`p-3 bg-cordel-bg-light/90 hover:bg-stone-100/90 cursor-pointer transition-colors flex flex-col gap-2 select-none ${
          isExpanded ? 'border-b-2 border-dashed border-cordel-master-dark/25' : ''
        }`}
      >
        {/* Ligne supérieure : Flèche de déploiement + Titre en gras + BPM */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-black text-cordel-wood flex-shrink-0">
              {isExpanded ? '▾' : '▸'}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-encre-noire uppercase tracking-wide truncate">
              {piece.titre}
            </h3>
            {piece.activeBpm && (
              <span className="text-[9.5px] font-bold text-stone-600 bg-black/5 px-1.5 py-0.5 rounded border border-encre-noire/15 flex-shrink-0">
                {piece.activeBpm} BPM
              </span>
            )}
          </div>
        </div>

        {/* Ligne inférieure : Demande de révision 1-clic & Curseur de confort compact */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Demande de révision 1-clic */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleRevision && onToggleRevision(piece.id);
              }}
              className={`px-2.5 py-1 text-xs font-black rounded border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs select-none ${
                isRevisionRequested
                  ? 'bg-amber-100 border-[var(--color-cordel-ocre,#c05621)] text-[var(--color-cordel-ocre,#c05621)]'
                  : 'bg-white border-encre-noire/25 text-stone-700 hover:bg-stone-50'
              }`}
              title={isRevisionRequested ? 'Annuler la demande' : 'Signaler au Mestre le besoin de réviser'}
            >
              <span>🙋</span>
              <span>{isRevisionRequested ? 'Révision demandée ✓' : 'Demander à réviser'}</span>
            </button>
          </div>

          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
            title="Mon niveau d'aisance personnel"
          >
            {COMFORT_LEVELS.map((c) => {
              const isSelected = comfortLevel === c.level;
              return (
                <button
                  key={c.level}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetComfortLevel && onSetComfortLevel(piece.id, isSelected ? 0 : c.level);
                  }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded text-xs border transition-all cursor-pointer shadow-2xs select-none ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-950 scale-110 shadow-sm'
                      : 'bg-white border-stone-200 hover:bg-stone-100 opacity-70 hover:opacity-100'
                  }`}
                  title={`${c.icon} ${c.label} : ${c.tip}`}
                >
                  <span>{c.icon}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Contenu déplié (panneau accordéon conditionnel en lecture seule stricte) */}
      {isExpanded && (
        <MemberPieceUnfoldedContent
          piece={piece}
          userId={userId}
          groupId={groupId}
          profileData={profileData}
          trainings={trainings}
          aisanceMap={aisanceMap}
          onOpenTablature={onOpenTablature}
          onOpenToada={(t, p) => (onOpenToada ? onOpenToada(t, p) : setIsLyricsModalOpen(true))}
          onOpenCulture={(c, p, docs) => (onOpenCulture ? onOpenCulture(c, p, docs) : setIsCultureModalOpen(true))}
          onOpenSignals={(p) => (onOpenSignals ? onOpenSignals(p) : setIsSignalsModalOpen(true))}
          sequenceurUrl={sequenceurUrl}
        />
      )}

      {/* 3. Modale dédiée des Signes du Mestre (Option A Aide-mémoire & Option B Défi) */}
      {isSignalsModalOpen && (
        <PieceSignalsModal
          isOpen={isSignalsModalOpen}
          onClose={() => setIsSignalsModalOpen(false)}
          piece={piece}
          groupId={groupId}
          profileData={profileData}
        />
      )}

      {/* 4. Modale dédiée des Paroles (Option A Parolier, Option B Récitation, Option C Quiz) */}
      {isLyricsModalOpen && (
        <PieceLyricsModal
          isOpen={isLyricsModalOpen}
          onClose={() => setIsLyricsModalOpen(false)}
          song={piece.activeToada}
          piece={piece}
          groupId={groupId}
          profileData={profileData}
        />
      )}

      {/* 5. Modale dédiée Culture (lecture seule) */}
      {isCultureModalOpen && (
        <PieceCultureModal
          isOpen={isCultureModalOpen}
          onClose={() => setIsCultureModalOpen(false)}
          cultureDocs={Array.isArray(piece.activeCultureDocs) && piece.activeCultureDocs.length > 0 ? piece.activeCultureDocs : (piece.activeCultureDoc ? [piece.activeCultureDoc] : [])}
          initialDocId={piece.activeCultureDocs?.[0]?.id || piece.activeCultureDoc?.id}
          piece={piece}
          groupId={groupId}
          profileData={profileData}
        />
      )}
    </CordelCard>
  );
}
