/**
 * Bandeau de sélection rapide d'un morceau du Répertoire en tête de l'Atelier (< 140 lignes).
 * Met automatiquement en avant les morceaux programmés lors de la prochaine répétition de l'Agenda.
 */

import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

export default function PieceRevisionSelectorBanner({
  repertoirePieces = [],
  scheduledPieces = [],
  nextRehearsalTitle = '',
  onSelectPiece,
  onFocusPiece = null
}) {
  const { t } = useTranslation();
  const [selectedPieceId, setSelectedPieceId] = useState(
    scheduledPieces[0]?.id || repertoirePieces[0]?.id || ''
  );

  if (!Array.isArray(repertoirePieces) || repertoirePieces.length === 0) {
    return null;
  }

  const effectiveSelectedId = selectedPieceId || scheduledPieces[0]?.id || repertoirePieces[0]?.id || '';
  const selectedPiece = repertoirePieces.find((p) => p.id === effectiveSelectedId) || repertoirePieces[0];

  const handleLaunch = () => {
    if (selectedPiece && onSelectPiece) {
      onSelectPiece(selectedPiece);
    }
  };

  return (
    <CordelCard className="p-5 bg-[#fdfaf2] border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] flex flex-col gap-3.5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base md:text-lg font-heading uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>🎼</span>
            <span>{t('pedagogy.pieceRevisionBannerTitle')}</span>
          </h3>
          <p className="text-xs font-bold text-encre-noire/75 mt-0.5">
            {t('pedagogy.pieceRevisionBannerSubtitle')}
          </p>
        </div>

        {scheduledPieces.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-cordel-ocre)]/15 border border-[var(--color-cordel-ocre)]/40 text-[10px] font-black uppercase tracking-wider text-[var(--color-cordel-ocre)] shrink-0">
            <span>📅</span>
            <span>
              {t('pedagogy.nextRehearsalBadge')}
              {nextRehearsalTitle ? ` • ${nextRehearsalTitle}` : ''}
            </span>
          </span>
        )}
      </div>

      {/* Mise en avant automatique des morceaux programmés à la prochaine répétition */}
      {scheduledPieces.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {scheduledPieces.map((piece) => (
            <button
              key={piece.id}
              type="button"
              onClick={() => {
                setSelectedPieceId(piece.id);
                if (onSelectPiece) onSelectPiece(piece);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-[var(--color-cordel-ocre)]/10 hover:bg-[var(--color-cordel-ocre)] hover:text-white text-encre-noire border-2 border-[var(--color-cordel-ocre)] transition-all cursor-pointer shadow-2xs"
            >
              <span>⭐</span>
              <span>{piece.titre}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sélecteur rapide de morceau du Répertoire */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <select
          value={effectiveSelectedId}
          onChange={(e) => {
            const nextId = e.target.value;
            setSelectedPieceId(nextId);
            if (onFocusPiece) {
              onFocusPiece(repertoirePieces.find((p) => p.id === nextId) || null);
            }
          }}
          aria-label={t('pedagogy.pieceRevisionSelectPlaceholder')}
          className="theme-input flex-1 text-xs md:text-sm font-bold py-2 px-3 bg-white border-2 border-encre-noire/30 rounded-lg cursor-pointer"
        >
          {repertoirePieces.map((piece) => (
            <option key={piece.id} value={piece.id}>
              {piece.isScheduledNextRehearsal ? `📅 [${t('pedagogy.nextRehearsalBadge')}] ` : '🎼 '}
              {piece.titre}
              {piece.rythme ? ` — ${piece.rythme}` : ''}
            </option>
          ))}
        </select>

        <CordelButton
          variant="primary"
          onClick={handleLaunch}
          className="px-5 py-2.5 text-xs font-black uppercase tracking-widest bg-[var(--color-cordel-vert)] text-white shrink-0"
        >
          {t('pedagogy.btnReviseSelectedPiece')}
        </CordelButton>
      </div>
    </CordelCard>
  );
}

