import React from 'react';
import CordelButton from '../CordelButton';

/**
 * Pied d'action de la Salle d'Attente (Lobby) :
 * - Hôte : Boutons Annuler et Lancer la partie (actif dès 2 joueurs)
 * - Invité : Bouton Quitter la table
 *
 * @param {boolean} isHost Indique si l'utilisateur est l'hôte de la table
 * @param {boolean} canLaunch Indique si au moins 2 joueurs sont assis
 * @param {boolean} actionInProgress Indique si une opération réseau est en cours
 * @param {Function} onCancel Callback d'annulation pour l'hôte
 * @param {Function} onLaunch Callback de lancement pour l'hôte
 * @param {Function} onLeave Callback pour quitter pour l'invité
 */
export default function GameLobbyFooter({
  isHost,
  canLaunch,
  actionInProgress,
  onCancel,
  onLaunch,
  onLeave
}) {
  return (
    <div className="pt-3 border-t border-dashed border-cordel-master-dark/20 flex flex-col sm:flex-row gap-2.5 justify-between items-center">
      {isHost ? (
        <>
          <CordelButton
            variant="danger"
            onClick={onCancel}
            disabled={actionInProgress}
            className="w-full sm:w-auto py-1.5 px-4 text-xs font-black uppercase tracking-wider !bg-[var(--color-cordel-rouge)] !text-white"
          >
            ❌ Annuler
          </CordelButton>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {!canLaunch && (
              <span className="text-[9.5px] font-bold text-cordel-master-dark/70 italic">
                (2 joueurs minimum requis)
              </span>
            )}
            <CordelButton
              variant="primary"
              onClick={onLaunch}
              disabled={!canLaunch || actionInProgress}
              className="w-full sm:w-auto py-1.5 px-5 text-xs font-black uppercase tracking-wider !bg-[var(--color-cordel-vert)] !text-white disabled:opacity-50"
            >
              🥁 Lancer la partie
            </CordelButton>
          </div>
        </>
      ) : (
        <CordelButton
          variant="danger"
          onClick={onLeave}
          disabled={actionInProgress}
          className="w-full py-1.5 text-xs font-black uppercase tracking-wider !bg-[var(--color-cordel-rouge)] !text-white"
        >
          🚪 Quitter la table
        </CordelButton>
      )}
    </div>
  );
}
