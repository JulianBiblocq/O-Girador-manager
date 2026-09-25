import React, { useState, useEffect, useMemo } from 'react';
import { parseYouTubeMedia } from '../../utils/mediaUrlUtils';
import { groupVideosByFamily, getDefaultActiveBlockId } from '../../utils/repertoireVideoUtils';

/**
 * Lecteur vidéo à 2 niveaux pour les fiches Répertoire (< 180 lignes).
 * Niveau 1 : Grands blocs de familles (Alfaias, Caixas, Gonguê, Sementes) + bloc Live/Ensemble.
 * Niveau 2 : Sous-pastilles au sein d'une famille ciblant chaque instrument précis (ex: Marcante, Meião, Repique).
 * Permutation instantanée à 60 FPS dans un lecteur unique.
 *
 * @param {Array} videos - Liste des vidéos [{ url, titre, instruments: string[], isLiveOrGlobal?: boolean }]
 * @param {string} defaultVideoUrl - Fallback historique piece.videoUrl
 * @param {string} userInstrument - Instrument du profil de l'adhérent connecté
 * @param {Array} instrumentsList - Pupitres configurés dans l'association
 */
export default function PieceVideoSection({
  videos = [],
  defaultVideoUrl = '',
  userInstrument = '',
  instrumentsList = []
}) {
  // Regroupement en familles de niveau 1
  const blocks = useMemo(() => {
    return groupVideosByFamily(videos, defaultVideoUrl, instrumentsList);
  }, [videos, defaultVideoUrl, instrumentsList]);

  // Détermination du bloc de niveau 1 actif par défaut
  const defaultBlockId = useMemo(() => {
    return getDefaultActiveBlockId(blocks, userInstrument);
  }, [blocks, userInstrument]);

  const [activeBlockId, setActiveBlockId] = useState(defaultBlockId);

  // Synchronisation du bloc par défaut si les blocs changent
  useEffect(() => {
    if (!blocks.some((b) => b.id === activeBlockId)) {
      setActiveBlockId(defaultBlockId);
    }
  }, [blocks, defaultBlockId, activeBlockId]);

  // Bloc actuellement sélectionné
  const currentBlock = useMemo(() => {
    return blocks.find((b) => b.id === activeBlockId) || blocks[0] || null;
  }, [blocks, activeBlockId]);

  const currentVideos = currentBlock?.videos || [];

  // Détermination de la sous-vidéo active par défaut dans le bloc
  const defaultSubVideoIndex = useMemo(() => {
    if (currentVideos.length <= 1) return 0;
    const instNorm = (userInstrument || '').toLowerCase().trim();
    if (instNorm) {
      const matchIdx = currentVideos.findIndex((v) =>
        (v.instruments || []).some((i) => {
          const inorm = (i || '').toLowerCase().trim();
          return inorm && (inorm === instNorm || instNorm.includes(inorm) || inorm.includes(instNorm));
        })
      );
      if (matchIdx !== -1) return matchIdx;
    }
    return 0;
  }, [currentVideos, userInstrument]);

  const [activeVideoIndex, setActiveVideoIndex] = useState(defaultSubVideoIndex);

  // Réinitialiser la sous-pastille active quand on change de bloc
  useEffect(() => {
    setActiveVideoIndex(defaultSubVideoIndex);
  }, [activeBlockId, defaultSubVideoIndex]);

  if (blocks.length === 0) return null;

  const activeVideo = currentVideos[activeVideoIndex] || currentVideos[0];
  const url = activeVideo?.url || '';

  const embedInfo = (() => {
    if (!url) return null;
    const yt = parseYouTubeMedia(url);
    if (yt?.embedUrl) return { type: 'youtube', embedUrl: yt.embedUrl, directUrl: yt.directUrl || url };
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch?.[1]) return { type: 'drive', embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`, directUrl: url };
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch?.[1]) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`, directUrl: url };
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return { type: 'direct', embedUrl: url, directUrl: url };
    return null;
  })();

  return (
    <div className="flex flex-col gap-2 p-2.5 rounded bg-cordel-bg-light/80 border border-encre-noire/15 shadow-2xs text-left">
      {/* Niveau 1 : Onglets des Grands Blocs (Familles & Live) */}
      {blocks.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-dashed border-encre-noire/15 scrollbar-thin select-none">
          {blocks.map((block) => {
            const isBlockActive = block.id === activeBlockId;
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => setActiveBlockId(block.id)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded border-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isBlockActive
                    ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] scale-102'
                    : 'bg-white/80 hover:bg-white text-stone-700 hover:text-encre-noire border-encre-noire/25 shadow-2xs'
                }`}
              >
                <span>{block.icon || '🎬'}</span>
                <span>{block.label}</span>
                <span className="text-[8.5px] px-1 py-0.2 rounded-full bg-black/10 font-bold">
                  {block.videos.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Niveau 2 : Sous-pastilles au sein du bloc actif si plusieurs vidéos */}
      {currentVideos.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin select-none">
          <span className="text-[9px] font-black uppercase text-stone-500 shrink-0">Sous-voix :</span>
          {currentVideos.map((vid, idx) => {
            const isSubActive = idx === activeVideoIndex;
            const displayLabel = vid.titre || (vid.instruments?.length > 0 ? vid.instruments.join(', ') : `Vidéo #${idx + 1}`);
            const instDesc = vid.instruments?.length > 0 ? vid.instruments.join(', ') : 'Vue générale';

            return (
              <button
                key={vid.id || idx}
                type="button"
                onClick={() => setActiveVideoIndex(idx)}
                className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  isSubActive
                    ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                    : 'bg-white hover:bg-stone-50 text-stone-700 hover:text-encre-noire border-encre-noire/20 shadow-2xs'
                }`}
                title={vid.titre ? `${instDesc} : ${vid.titre}` : instDesc}
              >
                <span>🎯</span>
                <span>{displayLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* En-tête de la vidéo active : libellé et lien externe direct */}
      <div className="flex items-center justify-between text-[10px] font-bold text-stone-700">
        <span className="flex items-center gap-1.5 font-black uppercase text-cordel-wood truncate">
          <span>🎬</span>
          <span className="truncate">
            {activeVideo?.instruments?.length > 0 ? `[${activeVideo.instruments.join(', ')}] ` : ''}
            {activeVideo?.titre || currentBlock?.label || 'Vidéo du morceau'}
          </span>
        </span>
        <a
          href={embedInfo?.directUrl || url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9.5px] text-stone-500 hover:text-cordel-wood font-medium underline lowercase shrink-0"
          title="Ouvrir la vidéo dans un nouvel onglet"
        >
          ouvrir la source ↗
        </a>
      </div>

      {/* Lecteur unique (Lite YouTube / Iframe / Video HTML5) */}
      <div className="relative w-full aspect-video rounded overflow-hidden border-2 border-encre-noire bg-black shadow-inner">
        {embedInfo?.type === 'direct' ? (
          <video controls src={embedInfo.embedUrl} className="w-full h-full" preload="metadata" />
        ) : embedInfo?.embedUrl ? (
          <iframe
            src={embedInfo.embedUrl}
            title={activeVideo?.titre || 'Vidéo'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white gap-2">
            <span className="text-2xl">🎬</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline hover:text-amber-300">
              Ouvrir la vidéo externe ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
