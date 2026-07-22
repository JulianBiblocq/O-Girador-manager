import React, { createContext, useContext } from 'react';

const PresenceContext = createContext({
  onlineMembers: [],
  onlineCount: 0,
  onlineUserIds: new Set()
});

export const PresenceProvider = PresenceContext.Provider;

export const usePresenceContext = () => useContext(PresenceContext);
