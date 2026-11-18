import { useEffect } from 'react';
import { drawSealNeutralFrame, drawSealLogoCenter, drawSealInitialsCenter, updateDocumentOpenGraphTags } from '../utils/shareUtils.js';
import { loadMatriceImage } from '../utils/sealMatrice.js';

function drawLogoInCenter(ctx, img) {
  drawSealLogoCenter(ctx, 128, img);
}

function drawInitialsInCenter(ctx, name, textCol = '#8B2A1A') {
  drawSealInitialsCenter(ctx, 128, name, textCol);
}

function updateFavicon(rawUrl) {
  if (!rawUrl || typeof document === 'undefined') return;
  const versionTag = 'v=og-2';
  const finalUrl = rawUrl.startsWith('data:') 
    ? rawUrl 
    : (rawUrl.includes('?') ? `${rawUrl}&${versionTag}` : `${rawUrl}?${versionTag}`);

  let mainFavicon = document.getElementById('favicon') || document.querySelector("link[rel*='icon']");
  if (!mainFavicon) {
    mainFavicon = document.createElement('link');
    mainFavicon.id = 'favicon';
    mainFavicon.rel = 'icon';
    document.head.appendChild(mainFavicon);
  }
  mainFavicon.type = finalUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  mainFavicon.href = finalUrl;

  const allIcons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon'], link[rel='shortcut icon']");
  allIcons.forEach(link => {
    link.href = finalUrl;
    if (!finalUrl.endsWith('.svg')) link.type = 'image/png';
  });
}

/**
 * Hook dynamique de gestion du favicon et des méta-tags de partage :
 * - Mode 'pure' (Mostrador) : logo direct sans anneau
 * - Mode 'composite' (Organizador) : Matrice O Girador + logo de l'association centré (sans cercle procédural)
 */
export default function useDynamicFavicon(associationData, options = {}) {
  const isPureLogo = Boolean(options?.isPureLogo);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    let isMounted = true;
    let activeImg = null;

    const logoUrl = associationData?.branding?.logoUrl || associationData?.logoUrl || null;
    const combinedLogoUrl = associationData?.branding?.combinedLogoUrl || associationData?.combinedLogoUrl || null;
    const name = (associationData?.nom || associationData?.name || associationData?.associationName || '').trim();
    const colors = associationData?.branding?.colors || {};

    if (isPureLogo) {
      if (logoUrl) {
        updateFavicon(logoUrl);
        updateDocumentOpenGraphTags({ image: logoUrl, title: name || undefined });
        window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: logoUrl }));
      } else {
        updateFavicon('/og-girador-frame.svg');
        updateDocumentOpenGraphTags({ image: '/og-girador-frame.png', title: name || undefined });
      }
      return () => { isMounted = false; };
    }

    const rawGroup = associationData?.groupId || associationData?.id || '';
    const ogTitle = name || 'O Girador';

    if (!rawGroup && !name && !logoUrl && !combinedLogoUrl) {
      updateFavicon('/og-girador-frame.svg');
      updateDocumentOpenGraphTags({ image: '/og-girador-frame.png', title: 'O Girador', updateDocumentTitle: false });
      return () => { isMounted = false; };
    }
    if (combinedLogoUrl) {
      updateFavicon(combinedLogoUrl);
      updateDocumentOpenGraphTags({ image: combinedLogoUrl, title: ogTitle, updateDocumentTitle: false });
      window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: combinedLogoUrl }));
      return () => { isMounted = false; };
    }

    const generateFavicon = async () => {
      try {
        // Fond officiel « Matrice » (organizador-matrice.png) : anneau + gravure O Girador déjà dessinés
        const matrice = await loadMatriceImage();
        if (!isMounted) return;
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawSealNeutralFrame(ctx, 128, matrice);

        if (logoUrl) {
          activeImg = new Image();
          activeImg.crossOrigin = 'anonymous';
          activeImg.onload = () => {
            if (!isMounted) return;
            try {
              drawLogoInCenter(ctx, activeImg);
              const dataUrl = canvas.toDataURL('image/png');
              updateFavicon(dataUrl);
              updateDocumentOpenGraphTags({ image: dataUrl, title: ogTitle, updateDocumentTitle: false });
              window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: dataUrl }));
            } catch {
              drawInitialsInCenter(ctx, name, colors.primary || '#8B2A1A');
              const fallbackUrl = canvas.toDataURL('image/png');
              updateFavicon(fallbackUrl);
              updateDocumentOpenGraphTags({ image: fallbackUrl, title: ogTitle, updateDocumentTitle: false });
            }
          };
          activeImg.onerror = () => {
            if (!isMounted) return;
            drawInitialsInCenter(ctx, name, colors.primary || '#8B2A1A');
            try {
              const fallbackUrl = canvas.toDataURL('image/png');
              updateFavicon(fallbackUrl);
              updateDocumentOpenGraphTags({ image: fallbackUrl, title: ogTitle, updateDocumentTitle: false });
            } catch {
              updateFavicon('/og-girador-frame.svg');
            }
          };
          activeImg.src = logoUrl.includes('?') ? `${logoUrl}&cvs=1` : `${logoUrl}?cvs=1`;
        } else {
          drawInitialsInCenter(ctx, name, colors.primary || '#8B2A1A');
          const dataUrl = canvas.toDataURL('image/png');
          updateFavicon(dataUrl);
          updateDocumentOpenGraphTags({ image: dataUrl, title: ogTitle, updateDocumentTitle: false });
          window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: dataUrl }));
        }
      } catch {
        updateFavicon('/og-girador-frame.svg');
      }
    };

    generateFavicon();
    return () => {
      isMounted = false;
      if (activeImg) {
        activeImg.onload = null;
        activeImg.onerror = null;
      }
    };
  }, [
    associationData?.logoUrl, associationData?.branding?.logoUrl,
    associationData?.name, associationData?.nom,
    associationData?.id, associationData?.groupId,
    isPureLogo
  ]);
}
