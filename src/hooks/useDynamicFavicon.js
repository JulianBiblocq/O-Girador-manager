import { useEffect } from 'react';
import { 
  drawSealNeutralFrame, 
  drawSealLogoCenter, 
  drawSealInitialsCenter, 
  updateDocumentOpenGraphTags 
} from '../utils/shareUtils.js';

/**
 * Dessine l'anneau officiel gravé O Girador (128x128).
 */
function drawNeutralFrame(ctx, bgCol = '#f4ecd8', primaryCol = '#8B2A1A', textCol = '#181716') {
  ctx.save();
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.clip();
  drawSealNeutralFrame(ctx, 128, bgCol, primaryCol, '#c05621', textCol);
  ctx.restore();
}

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
 * - Mode 'composite' (Organizad'Or) : sceau combiné officiel O Girador × Association
 */
export default function useDynamicFavicon(associationData, options = {}) {
  const isPureLogo = Boolean(options?.isPureLogo);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    let isMounted = true;
    let activeImg = null;

    const logoUrl = associationData?.branding?.logoUrl || associationData?.logoUrl || null;
    const combinedLogoUrl = associationData?.branding?.combinedLogoUrl || null;
    const name = associationData?.nom || associationData?.name || associationData?.associationName || '';
    const colors = associationData?.branding?.colors || {};

    // 1. Mode Vitrine Publique (Mostrador) : logo pur de l'association
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

    // 2. Mode Manager (Organizad'Or) : Sceau combiné persistant ou Samambaia
    const rawGroup = associationData?.groupId || associationData?.id || '';
    const isSamambaia = !rawGroup || String(rawGroup).trim().toLowerCase() === 'samambaia' || name.toLowerCase().includes('samambaia');

    if (combinedLogoUrl) {
      updateFavicon(combinedLogoUrl);
      updateDocumentOpenGraphTags({ image: combinedLogoUrl, title: name ? `O Girador | ${name}` : undefined });
      window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: combinedLogoUrl }));
      return () => { isMounted = false; };
    }

    if (isSamambaia) {
      const sealUrl = '/brandings/logoOGSamambaia.png';
      updateFavicon(sealUrl);
      updateDocumentOpenGraphTags({ image: sealUrl, title: 'O Girador | Samambaia' });
      window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: sealUrl }));
      return () => { isMounted = false; };
    }

    const generateFavicon = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawNeutralFrame(ctx, colors.background || '#f4ecd8', colors.primary || '#8B2A1A', colors.text || '#181716');

        if (logoUrl) {
          activeImg = new Image();
          activeImg.crossOrigin = 'anonymous';
          activeImg.onload = () => {
            if (!isMounted) return;
            try {
              drawLogoInCenter(ctx, activeImg);
              const dataUrl = canvas.toDataURL('image/png');
              updateFavicon(dataUrl);
              updateDocumentOpenGraphTags({ image: dataUrl, title: name ? `O Girador | ${name}` : undefined });
              window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: dataUrl }));
            } catch {
              drawInitialsInCenter(ctx, name, colors.primary || '#8B2A1A');
              const fallbackUrl = canvas.toDataURL('image/png');
              updateFavicon(fallbackUrl);
              updateDocumentOpenGraphTags({ image: fallbackUrl, title: name ? `O Girador | ${name}` : undefined });
            }
          };
          activeImg.onerror = () => {
            if (!isMounted) return;
            drawInitialsInCenter(ctx, name, colors.primary || '#8B2A1A');
            try {
              const fallbackUrl = canvas.toDataURL('image/png');
              updateFavicon(fallbackUrl);
              updateDocumentOpenGraphTags({ image: fallbackUrl, title: name ? `O Girador | ${name}` : undefined });
            } catch {
              updateFavicon('/og-girador-frame.svg');
            }
          };
          activeImg.src = logoUrl.includes('?') ? `${logoUrl}&cvs=1` : `${logoUrl}?cvs=1`;
        } else {
          drawInitialsInCenter(ctx, name, colors.primary || '#8B2A1A');
          const dataUrl = canvas.toDataURL('image/png');
          updateFavicon(dataUrl);
          updateDocumentOpenGraphTags({ image: dataUrl, title: name ? `O Girador | ${name}` : undefined });
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
