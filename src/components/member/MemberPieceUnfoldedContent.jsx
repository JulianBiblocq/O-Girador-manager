import React, { useMemo } from 'react';
import PieceAisanceSection from './PieceAisanceSection';
import { parseYouTubeMedia } from '../../utils/mediaUrlUtils';
import { useTranslation } from '../LanguageContext';

/**
 * Contenu déplié de la carte morceau pour adhérents (lecture seule stricte).
 * Affiche les notes, lecteurs audios, toadas, tablatures, danse, culture,
 * lecteur vidéo intégré direct et entraînements.
 */
export default function MemberPieceUnfoldedContent({
  piece,
  userId,
  groupId,
  trainings = [],
  aisanceMap = {},
  onOpenTablature,
  onOpenToada,
  onOpenCulture,
  onOpenSignals,
  sequenceurUrl
}) {
  const { t } = useTranslation();
  const audioUrl = piece.activeAudioUrl || piece.audioUrl;
  const videoUrl = piece.activeVideoUrl || piece.videoUrl || piece.youtubeUrl;
  const hasToada = Boolean(
    piece.activeToada && (
      (typeof piece.activeToada.paroles === 'string' && piece.activeToada.paroles.trim() !== '') ||
      (typeof piece.activeToada.texte === 'string' && piece.activeToada.texte.trim() !== '') ||
      (Array.isArray(piece.activeToada.strophes) && piece.activeToada.strophes.length > 0) ||
      (typeof piece.activeToada.titre === 'string' && piece.activeToada.titre.trim() !== '')
    )
  );
  const cultureDocs = Array.isArray(piece.activeCultureDocs) && piece.activeCultureDocs.length > 0
    ? piece.activeCultureDocs
    : (piece.activeCultureDoc ? [piece.activeCultureDoc] : []);
  const hasCulture = Boolean(
    cultureDocs.length > 0 ||
    (Array.isArray(piece.cultureDocIds) && piece.cultureDocIds.length > 0) ||
    piece.cultureDocId
  );
  const hasSignals = Boolean(
    (Array.isArray(piece.signalIds) && piece.signalIds.length > 0) ||
    (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0) ||
    (Array.isArray(piece.activeSinaisDoMestre) && piece.activeSinaisDoMestre.length > 0)
  );

  // Résolution sécurisée du lecteur vidéo intégré (sans autoplay intrusif)
  const embedInfo = useMemo(() => {
    if (!videoUrl || typeof videoUrl !== 'string') return null;
    const trimmed = videoUrl.trim();
    const yt = parseYouTubeMedia(trimmed);
    if (yt?.embedUrl) return { type: 'youtube', embedUrl: yt.embedUrl };
    const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch?.[1]) return { type: 'drive', embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
    const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch?.[1]) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    if (trimmed.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return { type: 'direct', embedUrl: trimmed };
    return null;
  }, [videoUrl]);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-left">
      {/* 1. Notes du Mestre */}
      {piece.notes && piece.notes.trim() !== '' && (
        <div className="p-2.5 rounded bg-amber-50/80 border border-dashed border-amber-300 text-left">
          <span className="text-[9.5px] uppercase font-black text-amber-950 flex items-center gap-1 mb-1">
            <span>📝</span>
            <span>Notes du Mestre</span>
          </span>
          <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">{piece.notes}</p>
        </div>
      )}

      {/* 2. Lecteur audio compact Cordel */}
      {audioUrl && (
        <div className="flex items-center gap-2 p-2 rounded bg-cordel-bg-light border border-encre-noire/15">
          <span className="text-xs select-none">🎧</span>
          <audio controls src={audioUrl} className="w-full h-8" preload="none" />
        </div>
      )}

      {/* 3. Passerelles multimédias épurées */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Passerelle Paroles (lecture complète directe) */}
        {hasToada && (
          <button
            type="button"
            onClick={() => onOpenToada && onOpenToada(piece.activeToada, piece)}
            className="px-2.5 py-1 text-xs font-bold rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none"
            title="Consulter les paroles complètes du chant"
          >
            <span>🗣️</span>
            <span>{t('paroles', 'Paroles')}{piece.activeToada?.titre ? ` (${piece.activeToada.titre})` : ''}</span>
          </button>
        )}

        {/* Passerelle Fiches Culturelles (lecture seule) */}
        {hasCulture && (
          <button
            type="button"
            onClick={() => onOpenCulture && onOpenCulture(cultureDocs[0] || null, piece, cultureDocs)}
            className="px-2.5 py-1 text-xs font-bold rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none"
            title="Consulter la fiche culturelle"
          >
            <span>📖</span>
            <span>
              {t('culture', 'Culture')}
              {cultureDocs.length === 1 && (cultureDocs[0].titre || cultureDocs[0].name)
                ? ` : ${cultureDocs[0].titre || cultureDocs[0].name}`
                : cultureDocs.length > 1
                  ? ` (${cultureDocs.length})`
                  : ''}
            </span>
          </button>
        )}

        {/* Passerelle Tablature */}
        {piece.hasTablature && (
          <button
            type="button"
            onClick={() => onOpenTablature && onOpenTablature(piece)}
            className="px-2.5 py-1 text-xs font-bold rounded bg-stone-50 hover:bg-stone-100 border border-stone-300 text-stone-900 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none"
            title="Consulter la tablature complète"
          >
            <span>📄</span>
            <span>Tablature</span>
          </button>
        )}

        {/* Passerelle Signes du Mestre (affiché UNIQUEMENT si signaux déclarés) */}
        {hasSignals && (
          <button
            type="button"
            onClick={() => onOpenSignals && onOpenSignals(piece)}
            className="px-2.5 py-1 text-xs font-bold rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none"
            title="Consulter l'aide-mémoire des signes du Mestre"
          >
            <span>🖐️</span>
            <span>{t('signes', 'Signes')}</span>
          </button>
        )}

        {/* Danse / Chorégraphie */}
        {piece.activeChoreography && (
          <div className="px-2.5 py-1 text-xs font-bold rounded bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-1.5 shadow-2xs select-none">
            <span>💃</span>
            <span>Danse : {piece.activeChoreography.nom || piece.activeChoreography.titre || 'Chorégraphie'}</span>
          </div>
        )}
      </div>

      {/* 4. Lecteur vidéo intégré direct sans quitter l'application */}
      {embedInfo && (
        <div className="flex flex-col gap-1.5 p-2.5 rounded bg-cordel-bg-light/80 border border-encre-noire/15 shadow-2xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-stone-700">
            <span className="flex items-center gap-1 font-black uppercase text-cordel-wood">
              <span>🎬</span>
              <span>Vidéo du morceau</span>
            </span>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9.5px] text-stone-500 hover:text-cordel-wood font-medium underline lowercase"
              title="Ouvrir la vidéo dans un nouvel onglet"
            >
              ouvrir la source ↗
            </a>
          </div>

          <div className="relative w-full aspect-video rounded overflow-hidden border-2 border-encre-noire bg-black shadow-inner">
            {embedInfo.type === 'direct' ? (
              <video controls src={embedInfo.embedUrl} className="w-full h-full" preload="metadata" />
            ) : (
              <iframe src={embedInfo.embedUrl} title={`Vidéo - ${piece.titre}`} className="w-full h-full border-0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
            )}
          </div>
        </div>
      )}

      {/* Repli lien externe si URL vidéo non intégrable en iframe */}
      {!embedInfo && videoUrl && (
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 text-xs font-bold rounded bg-red-50 hover:bg-red-100 border border-red-300 text-red-900 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none self-start" title="Regarder la vidéo du morceau">
          <span>🎬</span>
          <span>Vidéo</span>
        </a>
      )}

      {/* 5. Bloc Entraînements et Paliers d'Aisance */}
      <PieceAisanceSection piece={piece} trainings={trainings} aisanceMap={aisanceMap} userId={userId} groupId={groupId} sequenceurUrl={sequenceurUrl} />
    </div>
  );
}
