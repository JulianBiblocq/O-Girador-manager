// Modale d'essai du Blind Test pour le formateur / Mestre
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React, { useState, useEffect, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

export default function BlindTestTrialModal({ isOpen, onClose, pieces = [] }) {
  const { t } = useTranslation();
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentPieceIndex, setCurrentPieceIndex] = useState(0);

  // Morceaux éligibles disposant d'un audio
  const audioPieces = useMemo(() => {
    return (pieces || []).filter((p) => p.audioUrl || p.activeAudioUrl);
  }, [pieces]);

  const currentPiece = audioPieces[currentPieceIndex] || null;

  // Génération des 4 choix (1 bonne réponse + 3 leurres)
  const choices = useMemo(() => {
    if (!currentPiece) return [];
    const correctTitle = currentPiece.titre || 'Morceau inconnu';
    const otherTitles = audioPieces
      .filter((p) => p.id !== currentPiece.id)
      .map((p) => p.titre)
      .filter(Boolean);

    const fallbacks = ['Baque Luanda', 'Baque de Parada', 'Baque Estrela', 'Baque de Onda', 'Baque Travado', 'Arrêt Royal'];
    const pool = [...new Set([...otherTitles, ...fallbacks])].filter((t) => t !== correctTitle);
    const shuffledLeurres = pool.sort(() => 0.5 - Math.random()).slice(0, 3);

    const all = [
      { text: correctTitle, isCorrect: true },
      ...shuffledLeurres.map((t) => ({ text: t, isCorrect: false }))
    ];
    return all.sort(() => 0.5 - Math.random());
  }, [currentPiece, audioPieces]);

  useEffect(() => {
    setSelectedChoice(null);
    setShowFeedback(false);
  }, [currentPieceIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (audioPieces.length > 1) {
      setCurrentPieceIndex((prev) => (prev + 1) % audioPieces.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <CordelCard
        variant="default"
        className="w-full max-w-lg p-6 bg-[#fdfaf2] border-2 border-encre-noire shadow-2xl flex flex-col gap-5 select-none relative animate-fadeIn mt-2 sm:mt-0"
      >
        {/* En-tête de la modale */}
        <div className="flex justify-between items-start gap-3 border-b-2 border-dashed border-cordel-master-dark/30 pb-3">
          <div className="flex-1 min-w-0 pr-2 flex items-start gap-2">
            <span className="text-xl">🎧</span>
            <h3 className="text-base font-black uppercase tracking-wider text-cordel-wood">{t('pedagogy.progress.essaiDuDefiBlindTest')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-[var(--color-cordel-wood,#8b2a1a)] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title={t('common.close', 'Fermer')}
            aria-label={t('common.close', 'Fermer')}
          >
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        {audioPieces.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold text-encre-noire/60">{t('pedagogy.progress.aucunMorceauAvecFichierAudio')}</div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-cordel-master-dark opacity-80 text-center">{t('pedagogy.progress.ecoutezLExtraitAudioEt')}</p>

            <div className="flex justify-center w-full">
              <audio
                controls
                src={currentPiece.audioUrl || currentPiece.activeAudioUrl}
                className="w-full max-w-sm rounded outline-none shadow-xs"
              />
            </div>

            {/* Grille des propositions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
              {choices.map((c, i) => {
                let btnStyle = 'bg-white border-encre-noire/30 hover:bg-neutral-100 text-encre-noire';
                if (showFeedback) {
                  if (c.isCorrect) {
                    btnStyle = 'bg-[var(--color-cordel-vert)] text-white border-[var(--color-cordel-vert)]';
                  } else if (selectedChoice === c) {
                    btnStyle = 'bg-[var(--color-cordel-rouge)] text-white border-[var(--color-cordel-rouge)]';
                  } else {
                    btnStyle = 'bg-neutral-100 text-encre-noire/40 border-transparent';
                  }
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (!showFeedback) {
                        setSelectedChoice(c);
                        setShowFeedback(true);
                      }
                    }}
                    className={`p-3 rounded border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{c.text}</span>
                    {showFeedback && c.isCorrect && <span>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Feedback et bouton suivant */}
            {showFeedback && (
              <div className="flex justify-between items-center mt-2 pt-3 border-t border-dashed border-encre-noire/20 animate-fadeIn">
                <span className={`text-xs font-black ${selectedChoice?.isCorrect ? 'text-[var(--color-cordel-vert)]' : 'text-[var(--color-cordel-rouge)]'}`}>
                  {selectedChoice?.isCorrect ? t('pedagogy.progress.bravoBonneReponse') : `❌ Oups ! C'était « ${currentPiece.titre} »`}
                </span>
                <CordelButton variant="wood" onClick={handleNext} className="text-xs px-3 py-1.5 font-black uppercase">{t('pedagogy.progress.morceauSuivant')}</CordelButton>
              </div>
            )}
          </div>
        )}

        {/* Pied de page */}
        <div className="flex justify-end pt-2 border-t border-encre-noire/15">
          <CordelButton variant="outline" onClick={onClose} className="text-xs px-3 py-1 font-black uppercase">{t('pedagogy.progress.fermerLEssai')}</CordelButton>
        </div>
      </CordelCard>
    </div>
  );
}
