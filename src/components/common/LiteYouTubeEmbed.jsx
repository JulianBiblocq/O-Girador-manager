import React, { useState } from 'react';

/**
 * Extrait strictement l'identifiant YouTube de 11 caractères à partir de divers formats d'URL :
 * - youtube.com/watch?v=ID (avec ou sans paramètres supplémentaires : ?si=..., &t=..., &feature=shared)
 * - youtu.be/ID (liens courts de partage)
 * - youtube.com/shorts/ID (YouTube Shorts)
 * - youtube.com/embed/ID
 * 
 * @param {string} url - URL YouTube brute
 * @returns {string|null} - Identifiant unique de 11 caractères ou null si invalide
 */
export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // Cas 1 : Saisie directe d'un identifiant YouTube de 11 caractères
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  // Cas 2 : Analyse des différents formats d'URL et partages (classique, live, shorts, embed, v, youtu.be)
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = cleanUrl.match(regExp);
  return match ? match[1] : null;
}


/**
 * Composant LiteYouTubeEmbed
 * 
 * Lecteur vidéo ultra-performant basé sur le principe "Lite YouTube Embed" :
 * 1. Affiche initialement la miniature officielle YouTube au ratio 16:9 avec un bouton de lecture Cordel.
 * 2. Zéro script Google ni iframe téléchargés tant que l'utilisateur ne clique pas.
 * 3. Au clic, injecte immédiatement l'iframe youtube-nocookie avec autoplay=1.
 * 
 * @param {string} url - URL YouTube complète
 * @param {string} [videoId] - Identifiant de la vidéo (optionnel si url est fourni)
 * @param {string} [title] - Titre descriptif de la vidéo (pour l'accessibilité a11y)
 * @param {string} [className] - Classes CSS personnalisées pour le conteneur
 */
export default function LiteYouTubeEmbed({
  url,
  videoId: propVideoId,
  title = "Vidéo YouTube",
  className = ""
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Résolution de l'identifiant vidéo (soit fourni directement, soit extrait de l'URL)
  const videoId = propVideoId || extractYouTubeVideoId(url);

  // Gestion de la miniature HD (maxresdefault 1080p avec cascade vers sddefault et hqdefault)
  const [thumbUrl, setThumbUrl] = useState(
    videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ''
  );

  React.useEffect(() => {
    if (videoId) {
      setThumbUrl(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    }
  }, [videoId]);

  const handleThumbError = () => {
    // Si maxresdefault n'existe pas (404 sur les vieilles vidéos), repli vers sddefault (640x480) puis hqdefault (480x360)
    if (thumbUrl.includes('maxresdefault.jpg')) {
      setThumbUrl(`https://img.youtube.com/vi/${videoId}/sddefault.jpg`);
    } else if (thumbUrl.includes('sddefault.jpg')) {
      setThumbUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    }
  };

  if (!videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;

  const handleActivate = () => {
    setIsLoaded(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-[8px_6px_10px_7px] border-2 border-encre-noire bg-black shadow-[2.5px_2.5px_0px_0px_#181716] ${className}`}
    >
      {isLoaded ? (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={handleActivate}
          onKeyDown={handleKeyDown}
          aria-label={`Lire la vidéo : ${title}`}
          className="w-full h-full cursor-pointer relative group overflow-hidden select-none outline-hidden focus-visible:ring-2 focus-visible:ring-cordel-wood"
        >
          {/* Miniature officielle YouTube recadrée en plein ratio 16:9 avec zoom parfaitement centré */}
          <img
            src={thumbUrl}
            onError={handleThumbError}
            alt={title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center origin-center block transition-transform duration-500 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100 pointer-events-none"
          />

          {/* Voile sombre dégradé pour faire ressortir le bouton et le titre */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

          {/* Bouton macaron de lecture Cordel parfaitement centré au milieu de la vidéo */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[var(--color-cordel-rouge,#8b2a1a)] border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] flex items-center justify-center text-white origin-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#a63321] group-hover:shadow-[4px_4px_0px_0px_#181716] pointer-events-none"
            title="Lancer la vidéo"
          >
            {/* Flèche de lecture vectorielle nette centrée avec micro-décalage optique pour équilibrer la forme triangulaire */}
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 translate-x-0.5 text-white drop-shadow-md"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
