import React, { useState, useMemo } from 'react';

/**
 * Extrait le premier identifiant vidéo YouTube (11 caractères) trouvé dans un texte libre.
 * @param {string} text
 * @returns {string|null}
 */
export function extractFirstYouTubeIdFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(
    /(?:youtube\.com\/(?:watch\?(?:[^\s]*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match && match[1] ? match[1] : null;
}

/**
 * Vignette et lecteur YouTube intégré directement dans une bulle de discussion du Porte-Voix.
 * Permet de visionner la vidéo partagée sans quitter Organizador.
 */
export default function ChatYouTubePreview({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = useMemo(() => extractFirstYouTubeIdFromText(text), [text]);

  if (!videoId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

  return (
    <div className="mt-1.5 mb-1 w-full min-w-[220px] sm:min-w-[280px] max-w-[360px] rounded-[6px_8px_6px_7px] overflow-hidden border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] bg-black">
      {isPlaying ? (
        <div className="relative w-full aspect-video">
          <iframe
            src={embedUrl}
            title="Lecteur vidéo YouTube"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          className="relative w-full aspect-video block group/yt cursor-pointer overflow-hidden bg-black text-left"
          title="Lire la vidéo YouTube directement dans la discussion"
        >
          <img
            src={thumbnailUrl}
            alt="Aperçu vidéo YouTube"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover/yt:scale-105 transition-transform duration-200 opacity-90"
          />
          <div className="absolute inset-0 bg-black/30 group-hover/yt:bg-black/40 transition-colors flex flex-col items-center justify-center gap-1.5">
            <span className="w-11 h-8 rounded-lg bg-[var(--color-cordel-rouge,#8b2a1a)] border-2 border-white text-white flex items-center justify-center text-sm shadow-md group-hover/yt:scale-110 transition-transform">
              ▶
            </span>
            <span className="px-2 py-0.5 rounded bg-black/75 text-white text-[9px] font-black uppercase tracking-wider border border-white/30">
              🎥 Lire sur place
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

