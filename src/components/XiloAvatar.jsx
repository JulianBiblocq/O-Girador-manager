import React, { useState, useEffect } from 'react';
import { processCordelEffect, defaultCordelOptions } from '../utils/cordelEffect';

export default function XiloAvatar({ src, name, size = 80 }) {
  const [processedSrc, setProcessedSrc] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Crucial for CORS-enabled image hosting (like Google profile pictures)
    
    img.onload = () => {
      try {
        // Apply the woodcut black & white filter
        const result = processCordelEffect(img, {
          ...defaultCordelOptions,
          isMirror: false, // Keep standard orientation
          zoom: 130,       // Zoom in slightly on the face
          detail: 65,      // Good details
          shadow: 125      // Ink density adjustment
        }, size * 2);      // Generate at twice the size for retina display sharpness
        
        if (result) {
          setProcessedSrc(result);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("XiloAvatar - Erreur de filtrage :", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    img.onerror = (err) => {
      console.warn("XiloAvatar - Échec du chargement de l'image (CORS ou réseau) :", src);
      setError(true);
      setLoading(false);
    };

    img.src = src;
  }, [src, size]);

  // Fallback visual: woodcut stamp styled initials (Prénom + Nom)
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    const firstInitial = parts[0].charAt(0);
    const lastInitial = parts[parts.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  };

  const initials = getInitials(name);

  if (error || !src) {
    return (
      <div 
        style={{ width: size, height: size }}
        className="rounded-[12px_6px_10px_8px] border-2 border-encre-noire bg-cordel-wood flex items-center justify-center text-cordel-bg-light font-black text-2xl shadow-[2px_2px_0px_0px_#181716] select-none"
      >
        {initials}
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        style={{ width: size, height: size }}
        className="rounded-[12px_6px_10px_8px] border-2 border-encre-noire bg-[#ece4d0] flex items-center justify-center text-encre-noire animate-pulse"
      >
        <span className="text-xs font-bold uppercase tracking-widest opacity-60">⏳</span>
      </div>
    );
  }

  return (
    <img 
      src={processedSrc || src} 
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-[12px_6px_10px_8px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] object-cover select-none pointer-events-none"
    />
  );
}
