import { createContext, useContext } from 'react';

// Contexte global de présence pour diffuser l'état des membres connectés et de visibilité
const PresenceContext = createContext({
  onlineMembers: [],
  onlineCount: 0,
  onlineUserIds: new Set(),
  isPresenceEnabled: true,
  afficherEnLigne: true
});

export const PresenceProvider = PresenceContext.Provider;

export const usePresenceContext = () => useContext(PresenceContext);

