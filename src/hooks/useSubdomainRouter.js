import { useState, useEffect } from 'react';

export default function useSubdomainRouter() {
  const getInitialState = () => {
    if (typeof window === 'undefined') return { mode: 'organizador', group: null, local: false };
    
    const hostname = window.location.hostname;
    const urlParams = new URLSearchParams(window.location.search);
    const appParam = urlParams.get('app');
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    let currentMode = 'orchestrador';
    if (isLocal) {
      if (appParam === 'mostrador') currentMode = 'mostrador';
      else if (appParam === 'organizador') currentMode = 'organizador';
      else if (appParam === 'orchestrador') currentMode = 'orchestrador';
    } else {
      if (hostname === 'o-girador.com' || hostname === 'www.o-girador.com' || hostname === 'o-girador-7828c.web.app') {
        currentMode = 'orchestrador';
      } else if (hostname.includes('mostrador')) {
        currentMode = 'mostrador';
      } else if (hostname.includes('organizador') || hostname.includes('manager')) {
        currentMode = 'organizador';
      }
    }

    let extractedGroupId = urlParams.get('groupe') || urlParams.get('assoc');
    if (!isLocal) {
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'mostrador' && parts[0] !== 'organizador' && parts[0] !== 'manager') {
        extractedGroupId = parts[0];
      }
    }

    return { mode: currentMode, group: extractedGroupId, local: isLocal };
  };

  const [initialState] = useState(getInitialState);
  
  const [appMode, setAppMode] = useState(initialState.mode);
  const [groupId, setGroupId] = useState(initialState.group);
  const [isLocalhost, setIsLocalhost] = useState(initialState.local);
  const [urls, setUrls] = useState({ mostrador: '', organizador: '', orchestrador: '' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const extractedGroupId = groupId;
      const isLocal = isLocalhost;
      
      if (isLocal) {
        setUrls({
          mostrador: `/?app=mostrador${extractedGroupId ? `&groupe=${extractedGroupId}` : ''}`,
          organizador: `/login${extractedGroupId ? `?groupe=${extractedGroupId}` : ''}`,
          orchestrador: `/?app=orchestrador`
        });
      } else {
        const groupPrefix = extractedGroupId ? `${extractedGroupId}.` : '';
        setUrls({
          mostrador: `https://${groupPrefix}mostrador.o-girador.com`,
          organizador: `https://${groupPrefix}organizador.o-girador.com`,
          orchestrador: `https://o-girador.com`
        });
      }
    }
  }, [groupId, isLocalhost]);

  return { appMode, groupId, urls, isLocalhost };
}
