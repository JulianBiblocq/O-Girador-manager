import React, { createContext, useContext } from 'react';

const PresenceContext = createContext({
  onlineMembers: [],
  onlineCount: 0,
  onlineUserIds: new Set(),
  isPresenceEnabled: true
});

export const PresenceProvider = PresenceContext.Provider;

export const usePresenceContext = () => useContext(PresenceContext);
