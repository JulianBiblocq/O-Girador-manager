import { useState, useEffect } from 'react';

export default function useSubdomainRouter() {
  const [appMode, setAppMode] = useState('organizador');
  const [groupId, setGroupId] = useState(null);
  const [urls, setUrls] = useState({ mostrador: '', organizador: '' });
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const urlParams = new URLSearchParams(window.location.search);
      const appParam = urlParams.get('app');
      
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      setIsLocalhost(isLocal);

      let currentMode = 'orchestrador'; // par défaut

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

      setAppMode(currentMode);

      // Extraction du Group ID (ex: [groupId].mostrador.o-girador.com)
      let extractedGroupId = urlParams.get('groupe') || urlParams.get('assoc');
      if (!isLocal) {
        const parts = hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'mostrador' && parts[0] !== 'organizador' && parts[0] !== 'manager') {
          extractedGroupId = parts[0];
        }
      }
      setGroupId(extractedGroupId);

      // Génération des URLs cibles
      if (isLocal) {
        setUrls({
          mostrador: `/?app=mostrador${extractedGroupId ? `&groupe=${extractedGroupId}` : ''}`,
          organizador: `/login${extractedGroupId ? `?groupe=${extractedGroupId}` : ''}`,
          orchestrador: `/?app=orchestrador`
        });
      } else {
        const groupPrefix = extractedGroupId ? `${extractedGroupId}.` : '';
        // Utilisation du domaine principal o-girador.com
        setUrls({
          mostrador: `https://${groupPrefix}mostrador.o-girador.com`,
          organizador: `https://${groupPrefix}organizador.o-girador.com`,
          orchestrador: `https://o-girador.com`
        });
      }
    }
  }, []);

  return { appMode, groupId, urls, isLocalhost };
}
