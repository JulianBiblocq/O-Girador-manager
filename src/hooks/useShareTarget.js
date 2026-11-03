import { useState, useEffect, useCallback, useRef } from 'react';
import {
  readSharedPayloadFromIdb,
  clearSharedPayloadFromIdb,
  extractUrlFromSharedText
} from '../utils/shareTargetIdbUtils';

/**
 * Hook de réception des contenus partagés via l'API Web Share Target (Organizador).
 * S'active lorsque l'utilisateur est authentifié et que l'URL indique un partage entrant.
 *
 * @param {Object} user - Utilisateur Firebase Auth
 * @param {Object} profileData - Profil Firestore de l'adhérent
 * @returns {{ sharedPayload: Object|null, clearShareTarget: Function }}
 */
export function useShareTarget(user, profileData) {
  const [sharedPayload, setSharedPayload] = useState(null);
  const previewUrlRef = useRef(null);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      try {
        URL.revokeObjectURL(previewUrlRef.current);
      } catch {}
      previewUrlRef.current = null;
    }
  }, []);

  const clearShareTarget = useCallback(async () => {
    revokePreview();
    setSharedPayload(null);
    await clearSharedPayloadFromIdb();
  }, [revokePreview]);

  useEffect(() => {
    if (!user?.uid || !profileData || typeof window === 'undefined') return;

    const checkIncomingShare = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hasShareFlag = searchParams.has('share-target');
      const urlTitle = searchParams.get('title') || '';
      const urlText = searchParams.get('text') || '';
      const urlParam = searchParams.get('url') || '';
      const hasGetShareParams = Boolean(hasShareFlag || urlParam || (urlTitle && urlText));

      const idbData = await readSharedPayloadFromIdb();
      if (!idbData && !hasGetShareParams) return;

      // Nettoyage immédiat des paramètres d'URL de partage sans recharger la page
      if (hasShareFlag || urlParam) {
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete('share-target');
        cleanParams.delete('title');
        cleanParams.delete('text');
        cleanParams.delete('url');
        const nextQuery = cleanParams.toString();
        const nextUrl = window.location.pathname + (nextQuery ? `?${nextQuery}` : '');
        window.history.replaceState(window.history.state || {}, document.title, nextUrl);
      }

      const rawTitle = idbData?.title || urlTitle || '';
      const rawText = idbData?.text || urlText || '';
      const rawUrl = idbData?.url || urlParam || '';
      const files = Array.isArray(idbData?.files) ? idbData.files : [];
      const primaryFile = files[0] || null;

      const { cleanText, extractedUrl, isYouTube } = extractUrlFromSharedText(rawText, rawUrl);

      if (!rawTitle && !cleanText && !extractedUrl && !primaryFile) {
        await clearSharedPayloadFromIdb();
        return;
      }

      revokePreview();
      const isImage = Boolean(primaryFile?.type && primaryFile.type.startsWith('image/'));
      const isPdf = Boolean(
        primaryFile && (primaryFile.type === 'application/pdf' || /\.pdf$/i.test(primaryFile.name || ''))
      );

      if (isImage && primaryFile) {
        try {
          previewUrlRef.current = URL.createObjectURL(primaryFile);
        } catch {}
      }

      setSharedPayload({
        title: String(rawTitle).trim(),
        text: cleanText,
        url: extractedUrl,
        isYouTube,
        file: primaryFile,
        files,
        isImage,
        isPdf,
        previewUrl: previewUrlRef.current
      });
    };

    checkIncomingShare();

    return () => {
      revokePreview();
    };
  }, [user?.uid, profileData, revokePreview]);

  return { sharedPayload, clearShareTarget };
}

