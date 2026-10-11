import { useEffect } from 'react';

/**
 * Dessine l'anneau officiel gravé O Girador (128x128).
 */
function drawNeutralFrame(ctx, bgCol = '#f4ecd8', primaryCol = '#8B2A1A', textCol = '#181716') {
  ctx.clearRect(0, 0, 128, 128);
  ctx.save();
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.clip();

  // Fond parchemin & cercles gravure bois
  ctx.fillStyle = bgCol;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = primaryCol;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(64, 64, 57, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#c05621'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(64, 64, 53, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = primaryCol; ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);

  // Gravure circulaire "★ O GIRADOR ★"
  ctx.font = 'bold 8px Courier New, monospace, serif';
  ctx.fillStyle = textCol;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = '★ O GIRADOR ★';
  const startAngle = Math.PI / 2 + (label.length - 1) * 0.20 / 2;
  for (let i = 0; i < label.length; i++) {
    const charAngle = startAngle - i * 0.20;
    ctx.save();
    ctx.translate(64 + Math.cos(charAngle) * 43, 64 + Math.sin(charAngle) * 43);
    ctx.rotate(charAngle - Math.PI / 2);
    ctx.fillText(label[i], 0, 0);
    ctx.restore();
  }

  // Disque central
  ctx.beginPath();
  ctx.arc(64, 58, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#faf6ec';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = primaryCol;
  ctx.stroke();
  ctx.restore();
}

/**
 * Dessine le logo de l'association centré et proportionné dans le masque circulaire.
 */
function drawLogoInCenter(ctx, img) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(64, 58, 35, 0, Math.PI * 2);
  ctx.clip();
  const targetSize = 70;
  const ratio = (img.width || targetSize) / (img.height || targetSize);
  const w = ratio > 1 ? targetSize : targetSize * ratio;
  const h = ratio > 1 ? targetSize / ratio : targetSize;
  ctx.drawImage(img, 64 - w / 2, 58 - h / 2, w, h);
  ctx.restore();
}

/**
 * Dessine les initiales sobres en l'absence de logo.
 */
function drawInitialsInCenter(ctx, name, textCol = '#8B2A1A') {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : (words[0]?.slice(0, 2) || 'OG').toUpperCase();
  ctx.save();
  ctx.font = 'bold 22px Courier New, monospace, serif';
  ctx.fillStyle = textCol;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, 64, 59);
  ctx.restore();
}

/**
 * Injecte l'icône dans les balises favicon et apple-touch-icon du DOM.
 */
function updateFavicon(url) {
  if (!url || typeof document === 'undefined') return;
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (link.href !== url) {
    link.type = 'image/png';
    link.href = url;
  }
  const appleLink = document.querySelector("link[rel='apple-touch-icon']");
  if (appleLink && appleLink.href !== url) appleLink.href = url;
}

/**
 * Hook dynamique de gestion du favicon :
 * - Mode 'pure' (Mostrador) : logo direct de l'association sans anneau
 * - Mode 'composite' (Organizad'Or) : macaron gravé O Girador avec logo ou initiales
 */
export default function useDynamicFavicon(associationData, options = {}) {
  const isPureLogo = Boolean(options?.isPureLogo);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    let isMounted = true;
    let activeImg = null;

    const logoUrl = associationData?.branding?.logoUrl || associationData?.logoUrl || null;
    const name = associationData?.nom || associationData?.name || associationData?.associationName || '';
    const colors = associationData?.branding?.colors || {};

    // 1. Mode Vitrine Publique (Mostrador) : injection directe du logo pur de l'association
    if (isPureLogo) {
      if (logoUrl) {
        updateFavicon(logoUrl);
        window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: logoUrl }));
      } else {
        updateFavicon('/og-girador-frame.svg');
      }
      return () => { isMounted = false; };
    }

    // 2. Mode Manager (Organizad'Or) : composition sur canvas Retina avec anneau O Girador
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
              window.dispatchEvent(new CustomEvent('combined-logo-ready', { detail: dataUrl }));
            } catch {
              drawInitialsInCenter(ctx, name, colors.primary || '#8B2A1A');
              updateFavicon(canvas.toDataURL('image/png'));
            }
          };
          activeImg.onerror = () => {
            if (!isMounted) return;
            drawInitialsInCenter(ctx, name, colors.primary || '#8B2A1A');
            try {
              updateFavicon(canvas.toDataURL('image/png'));
            } catch {
              updateFavicon('/og-girador-frame.svg');
            }
          };
          // Sécurisation anti-collision cache navigateur (CORS vs no-CORS)
          activeImg.src = logoUrl.includes('?') ? `${logoUrl}&cvs=1` : `${logoUrl}?cvs=1`;
        } else {
          drawInitialsInCenter(ctx, name, colors.primary || '#8B2A1A');
          const dataUrl = canvas.toDataURL('image/png');
          updateFavicon(dataUrl);
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
    associationData?.logoUrl,
    associationData?.branding?.logoUrl,
    associationData?.name,
    associationData?.nom,
    associationData?.id,
    associationData?.groupId,
    isPureLogo
  ]);
}
