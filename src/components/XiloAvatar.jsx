import React, { useState, useEffect } from 'react';

export default function XiloAvatar({ src, name, size = 80 }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
    } else {
      setError(false);
    }
  }, [src]);

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
        className="rounded-[12px_6px_10px_8px] border-2 border-encre-noire bg-cordel-wood flex items-center justify-center text-cordel-bg-light font-black text-2xl shadow-[2px_2px_0px_0px_#181716] select-none shrink-0"
      >
        {initials}
      </div>
    );
  }

  return (
    <div 
      style={{ width: size, height: size }}
      className="relative rounded-[12px_6px_10px_8px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] bg-cordel-bg overflow-hidden select-none pointer-events-none shrink-0"
    >
      <img 
        src={src} 
        alt={name}
        onError={() => setError(true)}
        className="w-full h-full object-cover grayscale contrast-[130%] sepia-[40%] mix-blend-multiply brightness-[95%]"
      />
    </div>
  );
}
