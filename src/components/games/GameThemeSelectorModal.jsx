import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { GAME_ROOM_THEMES } from '../../utils/gameUtils';
import { useTranslation } from '../LanguageContext';

/**
 * Micro-sélecteur de thème pour proposer un nouveau défi multijoueur.
 *
 * @param {boolean} isOpen Indique si la modale est affichée
 * @param {Function} onClose Callback de fermeture
 * @param {Function} onSelectTheme Callback de validation avec le thème choisi ('rythme' | 'culture' | 'cadavre_exquis')
 * @param {boolean} isCreating Indique si la création du salon Firestore est en cours
 */
export default function GameThemeSelectorModal({
  isOpen,
  onClose,
  onSelectTheme,
  isCreating = false
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getThemeTitle = (themeId, fallback) => {
    switch (themeId) {
      case 'rythme':
        return t('pedagogy.challengeRhythmTitle');
      case 'culture':
        return t('pedagogy.challengeCultureTitle');
      case 'cadavre_exquis':
        return t('pedagogy.challengeExquisiteCorpseTitle');
      default:
        return fallback;
    }
  };

  const getThemeDesc = (themeId, fallback) => {
    switch (themeId) {
      case 'rythme':
        return t('pedagogy.challengeRhythmDesc');
      case 'culture':
        return t('pedagogy.challengeCultureDesc');
      case 'cadavre_exquis':
        return t('pedagogy.challengeExquisiteCorpseDesc');
      default:
        return fallback;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in">
      {/* Fond cliquable pour fermer */}
      <div className="fixed inset-0" onClick={isCreating ? undefined : onClose} />

      <div className="relative w-full max-w-sm z-10">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 text-left">
          {/* En-tête */}
          <div className="flex justify-between items-center pb-2.5 border-b-2 border-dashed border-cordel-master-dark/25 mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>🎲</span>
              <span>{t('pedagogy.proposeChallengeTitle')}</span>
            </h3>

            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="p-1 min-w-[24px] min-h-[24px] flex items-center justify-center text-xs font-black border border-encre-noire rounded hover:bg-neutral-200 cursor-pointer"
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-cordel-master-dark/80 font-semibold mb-4 leading-relaxed">
            {t('pedagogy.proposeChallengeDesc')}
          </p>

          {/* Choix des thèmes */}
          <div className="flex flex-col gap-3">
            {Object.values(GAME_ROOM_THEMES).map((th) => (
              <button
                key={th.id}
                type="button"
                disabled={isCreating}
                onClick={() => onSelectTheme(th.id)}
                className="p-3.5 border-2 border-encre-noire bg-cordel-bg-light hover:bg-white rounded-[6px_10px_6px_8px] shadow-[2px_2px_0px_0px_#181716] hover:scale-[1.02] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all text-left flex items-start gap-3 cursor-pointer disabled:opacity-50"
              >
                <span className="text-2xl select-none">{th.icon}</span>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase text-encre-noire flex items-center gap-1.5">
                    {getThemeTitle(th.id, th.label)}
                  </h4>
                  <p className="text-[10px] text-cordel-master-dark/75 font-medium mt-0.5 leading-snug">
                    {getThemeDesc(th.id, th.description)}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Bouton Annuler */}
          <div className="mt-5 pt-3 border-t border-dashed border-cordel-master-dark/20 text-center">
            <CordelButton
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="w-full py-1.5 text-xs font-bold uppercase tracking-wider"
            >
              {t('pedagogy.btnCancelChallenge')}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
