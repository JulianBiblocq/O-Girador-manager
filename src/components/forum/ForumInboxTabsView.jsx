import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import ConversationCard from './ConversationCard';

/**
 * Vue des onglets « Messages privés (1-à-1) » et « Groupes de discussion » dans `Forum.jsx`.
 */
export default function ForumInboxTabsView({
  activeTab,
  directConversations = [],
  groupConversations = [],
  user,
  usersMap = {},
  createDirectConversation,
  setActiveConversationId,
  setActiveChatUserId,
  setIsNewDirectModalOpen,
  setIsNewGroupModalOpen
}) {
  if (activeTab === 'direct') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1 select-none flex-wrap gap-2">
          <h2 className="panel-title text-sm font-extrabold text-cordel-master-dark opacity-80 uppercase">
            ✉️ Messages privés (1-à-1)
          </h2>
          <CordelButton
            variant="vert"
            onClick={() => setIsNewDirectModalOpen(true)}
            className="text-xs px-3 py-1.5 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Démarrer un nouveau message direct"
          >
            <span>➕</span>
            <span>Nouveau message</span>
          </CordelButton>
        </div>

        {directConversations.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg select-none flex flex-col items-center gap-3">
            <span className="text-3xl">✉️</span>
            <p className="text-xs opacity-75 font-semibold max-w-sm">
              Aucun message privé pour le moment. Vous pouvez démarrer un échange en tête-à-tête avec n'importe quel membre actif de l'association !
            </p>
            <CordelButton
              variant="vert"
              onClick={() => setIsNewDirectModalOpen(true)}
              className="mt-1 text-xs px-4 py-2 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>➕</span>
              <span>Démarrer un message</span>
            </CordelButton>
          </CordelCard>
        ) : (
          <div className="flex flex-col gap-3">
            {directConversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                currentUserId={user?.uid}
                usersMap={usersMap}
                onClick={async () => {
                  if (conv.isLegacy) {
                    const otherId = conv.participantIds?.find((id) => id !== user?.uid);
                    try {
                      const convId = await createDirectConversation(otherId);
                      if (convId) {
                        setActiveConversationId(convId);
                      } else {
                        setActiveChatUserId(otherId);
                      }
                    } catch (err) {
                      console.warn('Forum - Erreur ouverture conversation (repli legacy actif) :', err);
                      setActiveChatUserId(otherId);
                    }
                  } else {
                    setActiveConversationId(conv.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'groups') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1 select-none flex-wrap gap-2">
          <h2 className="panel-title text-sm font-extrabold text-cordel-master-dark opacity-80 uppercase">
            👥 Groupes de discussion
          </h2>
          <CordelButton
            variant="vert"
            onClick={() => setIsNewGroupModalOpen(true)}
            className="text-xs px-3 py-1.5 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Créer une nouvelle boucle de discussion de groupe"
          >
            <span>➕</span>
            <span>Nouveau groupe</span>
          </CordelButton>
        </div>

        {groupConversations.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg select-none flex flex-col items-center gap-3">
            <span className="text-3xl">👥</span>
            <p className="text-xs opacity-75 font-semibold max-w-sm">
              Aucun groupe de discussion pour le moment. Fondez une boucle d'échange pour un projet, un événement, une section ou un covoiturage !
            </p>
            <CordelButton
              variant="vert"
              onClick={() => setIsNewGroupModalOpen(true)}
              className="mt-1 text-xs px-4 py-2 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>➕</span>
              <span>Créer un groupe</span>
            </CordelButton>
          </CordelCard>
        ) : (
          <div className="flex flex-col gap-3">
            {groupConversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                currentUserId={user?.uid}
                usersMap={usersMap}
                onClick={() => {
                  setActiveConversationId(conv.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
