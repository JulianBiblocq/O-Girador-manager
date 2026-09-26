import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Vue en superposition pour les états terminaux ou transitoires du salon :
 * - Salon annulé par l'hôte
 * - Partie lancée / en cours
 *
 * @param {string} status 'cancelled' | 'playing'
 * @param {string} themeTitle Titre du thème sélectionné
 * @param {number} playerCount Nombre de joueurs
 * @param {Function} onClose Callback de fermeture
 */
export default function GameLobbyStatusOverlay({
  status,
  themeTitle,
  playerCount,
  onClose
}) {
  if (status === 'cancelled') {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <div className="relative w-full max-w-sm">
          <CordelCard variant="default" useExtremeBorder={true} className="p-5 text-center">
            <span className="text-3xl block mb-2">🛑</span>
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-cordel-rouge)]">
              Salon annulé
            </h3>
            <p className="text-xs text-cordel-master-dark/80 my-3 font-semibold">
              Ce salon a été clôturé par l'hôte.
            </p>
            <CordelButton variant="ocre" onClick={onClose} className="w-full py-1.5 text-xs font-bold uppercase">
              Retour
            </CordelButton>
          </CordelCard>
        </div>
      </div>
    );
  }

  if (status === 'playing') {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <div className="relative w-full max-w-md">
          <CordelCard variant="default" useExtremeBorder={true} className="p-6 text-center animate-fade-in">
            <span className="text-4xl block mb-3 animate-bounce">🥁</span>
            <h3 className="text-base font-black uppercase tracking-wider text-[var(--color-cordel-vert)]">
              La partie commence !
            </h3>
            <p className="text-xs text-cordel-master-dark/80 my-3 font-semibold">
              Connexion des {playerCount} participants à l'arène {themeTitle}...
            </p>
            <div className="my-4 py-2 border-y border-dashed border-cordel-master-dark/30 text-xs font-mono font-bold text-cordel-wood">
              Chargement des questions de la Roda Quiz...
            </div>
            <CordelButton variant="ocre" onClick={onClose} className="w-full py-1.5 text-xs font-bold uppercase">
              Fermer la vue d'attente
            </CordelButton>
          </CordelCard>
        </div>
      </div>
    );
  }

  return null;
}
