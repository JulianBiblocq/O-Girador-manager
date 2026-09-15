import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { resolveEffectiveDropUrl, parseYouTubeMedia } from '../../utils/mediaUrlUtils';

/**
 * Composant modulaire : EventMediaCaptureSection
 * Affiche le flux vidéo participatif sur la fiche événement :
 * 1. Bouton adhérent « 📹 Déposer une vidéo » (si le dépôt est autorisé et l'URL résolue)
 * 2. Bloc de restitution YouTube (bouton direct « 🎬 Voir la vidéo » et lecteur responsive lazy)
 *
 * @param {Object} props
 * @param {Object} props.event - Objet événement complet
 * @param {string} [props.defaultDropUrl] - URL de repli configurée au niveau de l'association
 */
export default function EventMediaCaptureSection({ event, defaultDropUrl = '' }) {
  if (!event) return null;

  // 1. Détermination de l'autorisation de dépôt de vidéos
  const isVideoDropAllowed = event.enableVideoDrop !== undefined
    ? Boolean(event.enableVideoDrop)
    : ['atelier', 'repetition', 'stage'].includes(event.type);

  // 2. Résolution de l'URL de dépôt avec repli automatique
  const effectiveDropUrl = resolveEffectiveDropUrl(event.dropUrl, event.lienDepotMedias, defaultDropUrl);
  const showDropButton = isVideoDropAllowed && Boolean(effectiveDropUrl);

  // 3. Analyse du média YouTube de restitution (vidéo ou playlist)
  const rawVideoUrl = (event.videoUrl || '').trim();
  const youtubeMedia = rawVideoUrl ? parseYouTubeMedia(rawVideoUrl) : null;

  // Si aucun média de captation ni vidéo de restitution n'est disponible, masquer la section
  if (!showDropButton && !youtubeMedia) {
    return null;
  }

  // Libellé adapté selon le type d'événement
  const isAtelierOrRepetition = ['atelier', 'repetition', 'stage'].includes(event.type);
  const watchButtonLabel = youtubeMedia?.isPlaylistOnly
    ? (isAtelierOrRepetition ? '🎬 Voir la playlist de répétition' : '🎬 Voir la playlist de captation')
    : (isAtelierOrRepetition ? '🎬 Voir la vidéo de répétition' : '🎬 Voir la vidéo de captation');

  return (
    <CordelCard
      variant="default"
      useExtremeBorder={true}
      className="p-4 sm:p-5 flex flex-col gap-4 text-left select-none bg-[#fdfaf2] border-2 border-encre-noire shadow-[2.5px_2.5px_0px_0px_#181716]"
    >
      {/* En-tête de la section */}
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📹</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              Médias & Captations
            </h4>
            <p className="text-[10px] text-encre-noire/70 font-semibold">
              Dépôt participatif Framaspace et restitution vidéo
            </p>
          </div>
        </div>

        {youtubeMedia && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
            {youtubeMedia.isPlaylistOnly ? '📑 Playlist YouTube' : '🎬 Vidéo YouTube'}
          </span>
        )}
      </div>

      {/* Bouton d'action Adhérent : Déposer une vidéo brute */}
      {showDropButton && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-amber-50/80 border-2 border-dashed border-amber-500/40 rounded-[6px_9px_7px_8px]">
          <div className="flex flex-col text-left">
            <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
              <span>📤</span> Partager vos prises de vue
            </span>
            <span className="text-[10px] text-stone-600 font-medium leading-tight mt-0.5">
              Déposez vos vidéos brutes directement dans le dossier sécurisé (sans compte Google ni YouTube).
            </span>
          </div>

          <a
            href={effectiveDropUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--theme-bg-ocre,#c05621)] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-[4px_6px_5px_7px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer whitespace-nowrap"
            title="Ouvrir le dossier Framaspace File Drop dans un nouvel onglet"
          >
            <span>📹</span>
            <span>Déposer une vidéo</span>
            <span className="text-[10px] opacity-80">↗</span>
          </a>
        </div>
      )}

      {/* Bloc de restitution vidéo / playlist YouTube */}
      {youtubeMedia && (
        <div className="flex flex-col gap-3 pt-1 border-t border-dashed border-cordel-master-dark/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-encre-noire flex items-center gap-1.5">
              <span>🎬</span> Restitution de la séance
            </span>

            {/* Bouton d'accès direct vers YouTube */}
            <a
              href={youtubeMedia.directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="theme-btn theme-btn-extreme theme-bg-vert py-1.5 px-3 text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto text-white cursor-pointer"
            >
              <span>{watchButtonLabel}</span>
              <span className="text-[9px] opacity-80">↗</span>
            </a>
          </div>

          {/* Lecteur vidéo intégré responsive au ratio 16:9 avec chargement différé (lazy) */}
          {youtubeMedia.embedUrl && (
            <div className="relative w-full aspect-video overflow-hidden rounded-[8px_6px_10px_7px] border-2 border-encre-noire bg-black shadow-[2.5px_2.5px_0px_0px_#181716]">
              <iframe
                src={youtubeMedia.embedUrl}
                title={watchButtonLabel}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          )}
        </div>
      )}
    </CordelCard>
  );
}
