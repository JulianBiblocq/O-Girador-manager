import React, { useState, useEffect, useMemo } from 'react';
import { parseYouTubeMedia } from '../../utils/mediaUrlUtils';

/**
 * Composant de visionnage multi-vidéos et multi-instruments pour les fiches Répertoire (< 150 lignes).
 * Affiche UN SEUL lecteur vidéo surmonté d'un sélecteur de pastilles (pills) avec smart-default élève.
 *
 * @param {Array} videos - Liste des vidéos [{ url, titre, instruments: string[] }]
 * @param {string} defaultVideoUrl - Fallback historique piece.videoUrl
 * @param {string} userInstrument - Instrument du profil de l'utilisateur connecté
 */
export default function PieceVideoSection({ videos = [], defaultVideoUrl = '', userInstrument = '' }) {
  // Normalisation des vidéos disponibles avec repli rétrocompatible (pupitre -> instruments)
  const normalizedVideos = useMemo(() => {
    let list = [];
    if (Array.isArray(videos)) {
      list = videos
        .filter((v) => v && (typeof v === 'string' ? v.trim() !== '' : Boolean(v.url && v.url.trim())))
        .map((v) => {
          if (typeof v === 'string') {
            return { url: v.trim(), titre: 'Vidéo', instruments: [] };
          }
          const insts = Array.isArray(v.instruments)
            ? v.instruments.filter(Boolean)
            : (v.pupitre ? [v.pupitre.trim()] : []);
          return {
            url: (v.url || '').trim(),
            titre: (v.titre || '').trim(),
            instruments: insts
          };
        });
    }
    if (list.length === 0 && defaultVideoUrl && typeof defaultVideoUrl === 'string' && defaultVideoUrl.trim()) {
      list = [{ url: defaultVideoUrl.trim(), titre: 'Vidéo principale', instruments: [] }];
    }
    return list;
  }, [videos, defaultVideoUrl]);

  // Calcul du smart-default selon l'instrument de l'adhérent connecté
  const defaultIndex = useMemo(() => {
    if (normalizedVideos.length <= 1) return 0;
    const instNorm = (userInstrument || '').toLowerCase().trim();

    // 1. Première vidéo dont le tableau video.instruments inclut userInstrument
    if (instNorm) {
      const matchIdx = normalizedVideos.findIndex((v) => {
        return (v.instruments || []).some((i) => {
          const inorm = (i || '').toLowerCase().trim();
          return inorm && (inorm === instNorm || instNorm.includes(inorm) || inorm.includes(instNorm));
        });
      });
      if (matchIdx !== -1) return matchIdx;
    }

    // 2. À défaut, la première vidéo marquée avec tous les instruments ou sans restriction
    const globalIdx = normalizedVideos.findIndex((v) => {
      if (!v.instruments || v.instruments.length === 0) return true;
      return v.instruments.some((i) => {
        const inorm = (i || '').toLowerCase().trim();
        return inorm.includes('tous') || inorm.includes('globale');
      });
    });
    if (globalIdx !== -1) return globalIdx;

    // 3. À défaut, la première vidéo du tableau
    return 0;
  }, [normalizedVideos, userInstrument]);

  const [activeVideoIndex, setActiveVideoIndex] = useState(defaultIndex);
  useEffect(() => { setActiveVideoIndex(defaultIndex); }, [defaultIndex]);

  if (normalizedVideos.length === 0) return null;
  const activeVideo = normalizedVideos[activeVideoIndex] || normalizedVideos[0];
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
      {/* Barre de pastilles horizontales si plusieurs vidéos */}
      {normalizedVideos.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin select-none">
          {normalizedVideos.map((vid, idx) => {
            const isActive = idx === activeVideoIndex;
            const displayLabel = vid.titre || (vid.instruments?.length > 0 ? vid.instruments.join(', ') : `Vidéo #${idx + 1}`);
            const instDesc = vid.instruments?.length > 0 ? vid.instruments.join(', ') : 'Tous pupitres';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveVideoIndex(idx)}
                className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isActive ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] scale-102' : 'bg-white/80 hover:bg-white text-stone-700 hover:text-encre-noire border-encre-noire/20 shadow-2xs'
                }`}
                title={vid.titre ? `${instDesc} : ${vid.titre}` : instDesc}
              >
                <span>🎬</span>
                <span>{displayLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* En-tête : Titre actif, instruments et lien direct */}
      <div className="flex items-center justify-between text-[10px] font-bold text-stone-700">
        <span className="flex items-center gap-1.5 font-black uppercase text-cordel-wood truncate">
          <span>🎬</span>
          <span className="truncate">
            {activeVideo.instruments?.length > 0 ? `[${activeVideo.instruments.join(', ')}] ` : ''}
            {activeVideo.titre || 'Vidéo du morceau'}
          </span>
        </span>
        <a href={embedInfo?.directUrl || url} target="_blank" rel="noopener noreferrer" className="text-[9.5px] text-stone-500 hover:text-cordel-wood font-medium underline lowercase shrink-0" title="Ouvrir la vidéo dans un nouvel onglet">
          ouvrir la source ↗
        </a>
      </div>

      {/* Lecteur unique Lite YouTube / Iframe / Video */}
      <div className="relative w-full aspect-video rounded overflow-hidden border-2 border-encre-noire bg-black shadow-inner">
        {embedInfo?.type === 'direct' ? (
          <video controls src={embedInfo.embedUrl} className="w-full h-full" preload="metadata" />
        ) : embedInfo?.embedUrl ? (
          <iframe src={embedInfo.embedUrl} title={activeVideo.titre || 'Vidéo'} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-white gap-2">
            <span className="text-2xl">🎬</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline hover:text-amber-300">Ouvrir la vidéo externe ↗</a>
          </div>
        )}
      </div>
    </div>
  );
}
