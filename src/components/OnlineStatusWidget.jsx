import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { usePresenceContext } from '../context/PresenceContext';
import OnlineMemberItem from './presence/OnlineMemberItem';
import GameThemeSelectorModal from './games/GameThemeSelectorModal';
import { formatThemeTitle, formatThemeIcon } from '../utils/gameUtils';

/**
 * Widget de statut de présence affichant le nombre de membres en ligne
 * et ouvrant une modale détaillée avec commutateur de visibilité individuelle (Visible / Discret)
 * et passerelle vers les Défis multijoueurs (Roda Quiz).
 */
export default function OnlineStatusWidget({ 
  onlineMembers = [], 
  onlineCount = 0, 
  className = "", 
  isPresenceEnabled: propIsEnabled,
  compact = false,
  currentUserId = null,
  currentUserProfile = null,
  onStartDirectChat = null,
  onToggleVisibility = null,
  activeLobbyRoom = null,
  onOpenLobby = null,
  onCreateRoom = null,
  onJoinRoom = null,
  isDefisAuthorized = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const context = usePresenceContext();
  const isPresenceEnabled = propIsEnabled !== undefined ? propIsEnabled : context?.isPresenceEnabled;

  const handleMemberChatClick = (targetUserId) => {
    // 1. Fermer la modale des personnes en ligne
    setIsOpen(false);
    // 2. Déclencher le raccordement direct vers la conversation
    if (onStartDirectChat) {
      onStartDirectChat(targetUserId);
    }
  };

  // Liste des membres à afficher dans la modale : garantit que l'utilisateur connecté
  // reste TOUJOURS visible sur sa propre ligne même s'il est en mode discret (isOnline === false)
  const displayMembers = useMemo(() => {
    const list = Array.isArray(onlineMembers) ? [...onlineMembers] : [];
    if (!currentUserId) return list;

    const selfIndex = list.findIndex(m => (m.id || m.uid) === currentUserId);

    // Si l'utilisateur est déjà dans la liste (en ligne et visible pour les camarades)
    if (selfIndex !== -1) {
      if (currentUserProfile) {
        list[selfIndex] = {
          ...list[selfIndex],
          ...currentUserProfile,
          afficherEnLigne: currentUserProfile.afficherEnLigne !== false
        };
      }
      return list;
    }

    // Si l'utilisateur n'est pas dans la liste (ex: mode discret afficherEnLigne === false),
    // nous l'injectons en tête de modale pour lui permettre de basculer son statut à tout moment
    if (currentUserProfile) {
      const selfItem = {
        id: currentUserId,
        uid: currentUserId,
        ...currentUserProfile,
        afficherEnLigne: currentUserProfile.afficherEnLigne !== false,
        isOnline: false
      };
      return [selfItem, ...list];
    }

    return list;
  }, [onlineMembers, currentUserId, currentUserProfile]);

  const handleSelectTheme = async (theme) => {
    if (!onCreateRoom || isCreatingGame) return;
    setIsCreatingGame(true);
    try {
      const roomId = await onCreateRoom(theme);
      setShowThemeSelector(false);
      setIsOpen(false);
      if (onOpenLobby && roomId) {
        onOpenLobby(roomId);
      }
    } catch (err) {
      console.error('[OnlineStatusWidget] Erreur lors de la création du défi :', err);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinActiveRoom = async (roomId) => {
    try {
      if (onJoinRoom) {
        await onJoinRoom(roomId);
      }
      setIsOpen(false);
      if (onOpenLobby) {
        onOpenLobby(roomId);
      }
    } catch (err) {
      console.error('[OnlineStatusWidget] Erreur pour rejoindre la table :', err);
    }
  };

  if (isPresenceEnabled === false) return null;

  return (
    <>
      {/* Bouton déclencheur avec cible tactile minimale 40x40 sur mobile */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 ${
          compact ? 'min-w-[40px] min-h-[40px] px-2 py-1' : 'px-2.5 py-1 min-h-[34px]'
        } bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:scale-[1.03] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer select-none ${className}`}
        title={compact ? `${onlineCount} membre(s) en ligne - Cliquer pour voir la liste` : "Voir les membres connectés en temps réel"}
        aria-label={`${onlineCount} membres en ligne`}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider text-encre-noire">
          {compact ? onlineCount : `${onlineCount} en ligne`}
        </span>
      </button>

      {/* Modale des membres en ligne avec z-[9999] et createPortal pour surmonter tous les bandeaux sticky */}
      {isOpen && typeof document !== 'undefined' && document.body && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="relative w-full max-w-md z-10 animate-fade-in">
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 text-left max-h-[85vh] flex flex-col">
              {/* En-tête de la modale */}
              <div className="flex justify-between items-center pb-3 border-b-2 border-dashed border-cordel-master-dark/25 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                    Membres en ligne ({onlineCount})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center text-xs font-black uppercase border border-encre-noire rounded hover:bg-neutral-200 cursor-pointer active:scale-95 transition-all"
                  aria-label="Fermer la modale"
                >
                  ✕
                </button>
              </div>

              {/* Section Défis Multijoueurs : Encart de salon ouvert ou Bouton Proposer un défi */}
              {isDefisAuthorized && (
                <div className="mb-3 shrink-0">
                  {activeLobbyRoom ? (
                    <div className="p-3 bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_9px_7px_8px] shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl select-none">{formatThemeIcon(activeLobbyRoom.theme)}</span>
                          <div>
                            <h4 className="text-xs font-black text-encre-noire uppercase tracking-wider">
                              {formatThemeTitle(activeLobbyRoom.theme)}
                            </h4>
                            <span className="text-[9.5px] font-bold text-cordel-master-dark/70">
                              Hôte : {activeLobbyRoom.hostName} • ({Object.keys(activeLobbyRoom.players || {}).length}/{activeLobbyRoom.maxPlayers || 4} joueurs)
                            </span>
                          </div>
                        </div>
                        <span className="animate-pulse text-[9px] font-black uppercase text-[var(--color-cordel-vert)] bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          ● En attente
                        </span>
                      </div>

                      {/* Bouton d'action Rejoindre la table ou Ouvrir le salon */}
                      {activeLobbyRoom.players && activeLobbyRoom.players[currentUserId] ? (
                        <CordelButton
                          variant="primary"
                          onClick={() => {
                            setIsOpen(false);
                            if (onOpenLobby) onOpenLobby(activeLobbyRoom.id);
                          }}
                          className="w-full py-1 text-xs font-black uppercase !bg-[var(--color-cordel-vert)] !text-white"
                        >
                          🚪 Voir ma table
                        </CordelButton>
                      ) : (
                        <CordelButton
                          variant="primary"
                          disabled={Object.keys(activeLobbyRoom.players || {}).length >= (activeLobbyRoom.maxPlayers || 4)}
                          onClick={() => handleJoinActiveRoom(activeLobbyRoom.id)}
                          className="w-full py-1 text-xs font-black uppercase !bg-[var(--color-cordel-vert)] !text-white disabled:opacity-50"
                        >
                          {Object.keys(activeLobbyRoom.players || {}).length >= (activeLobbyRoom.maxPlayers || 4)
                            ? 'Table complète (4/4)'
                            : '🎲 Rejoindre la table'}
                        </CordelButton>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowThemeSelector(true)}
                      className="w-full py-2 px-3 bg-cordel-bg-light hover:bg-white text-encre-noire border-2 border-encre-noire rounded-[6px_8px_6px_7px] shadow-[1.5px_1.5px_0px_0px_#181716] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider hover:scale-[1.01] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
                    >
                      <span className="text-sm">🎲</span>
                      <span>Proposer un défi</span>
                    </button>
                  )}
                </div>
              )}

              {/* Liste des membres */}
              <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-2.5 scrollbar-thin">
                {displayMembers.length === 0 ? (
                  <div className="py-8 text-center text-cordel-master-dark/60 text-xs font-bold">
                    Aucun membre actuellement en ligne.
                  </div>
                ) : (
                  <>
                    {displayMembers.map((member) => (
                      <OnlineMemberItem 
                        key={member.id || member.uid} 
                        member={member} 
                        currentUserId={currentUserId}
                        onStartDirectChat={handleMemberChatClick}
                        onToggleVisibility={onToggleVisibility}
                      />
                    ))}

                    {/* Notification discrète si l'utilisateur est seul dans la modale en mode discret */}
                    {onlineMembers.length === 0 && displayMembers.length > 0 && (
                      <div className="py-3 text-center text-cordel-master-dark/60 text-xs font-bold italic">
                        Aucun autre membre connecté pour le moment.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pied de la modale */}
              <div className="mt-4 pt-3 border-t border-dashed border-cordel-master-dark/20 text-center shrink-0">
                <CordelButton
                  variant="ocre"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-xs font-bold uppercase tracking-wider"
                >
                  Fermer
                </CordelButton>
              </div>
            </CordelCard>
          </div>
        </div>,
        document.body
      )}

      {/* Sélecteur de thème pour initier un défi */}
      <GameThemeSelectorModal
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        onSelectTheme={handleSelectTheme}
        isCreating={isCreatingGame}
      />
    </>
  );
}
