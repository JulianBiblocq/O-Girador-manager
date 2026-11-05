import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import LiteYouTubeEmbed, { extractYouTubeVideoId } from '../common/LiteYouTubeEmbed';
import ModalVideoALaUne from './ModalVideoALaUne';
import CinemaVideoModal from './CinemaVideoModal';

/**
 * Composant : WidgetVideoALaUne
 *
 * Widget d'accueil présentant la vidéo à la une sélectionnée par l'équipe administrative.
 * Intègre un mode d'édition directe pour les Mestres et Administrateurs avec ModalVideoALaUne
 * ainsi qu'une modale plein écran « Mode Cinéma » adaptée aux vidéos portrait et paysage.
 *
 * @param {Object} videoALaUne - Données de la vidéo : { url: string, titre: string, active: boolean }
 * @param {string} [groupId] - Identifiant de l'association courante
 * @param {boolean} [isAuthorized=false] - Indique si l'utilisateur peut administrer la vidéo
 * @param {string} [className] - Classes CSS optionnelles pour adapter la disposition
 */
export default function WidgetVideoALaUne({
  videoALaUne,
  groupId,
  isAuthorized = false,
  className = ''
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCinemaModalOpen, setIsCinemaModalOpen] = useState(false);

  const videoId = extractYouTubeVideoId(videoALaUne?.url);
  const isVideoActive = videoALaUne?.active === true && Boolean(videoId);

  // 1. Cas où aucune vidéo n'est active
  if (!isVideoActive) {
    // Si l'utilisateur est administrateur, afficher un bandeau d'invitation pour configurer la vidéo
    if (isAuthorized) {
      return (
        <>
          <CordelCard
            variant="default"
            useExtremeBorder={true}
            className={`p-3.5 sm:p-4 bg-cordel-bg text-left select-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-dashed border-cordel-master-dark/30 ${className}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">🎬</span>
              <div>
                <h4 className="font-sans font-black text-xs uppercase tracking-wider text-cordel-wood">
                  Vidéo à la une (Accueil)
                </h4>
                <p className="text-[10px] text-cordel-master-dark/75 font-semibold mt-0.5">
                  Aucune vidéo n&apos;est actuellement diffusée sur l&apos;Accueil. Partagez un concert ou un tutoriel vidéo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 cursor-pointer shrink-0 self-start sm:self-center transition-all"
            >
              + Définir une vidéo
            </button>
          </CordelCard>

          <ModalVideoALaUne
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            videoALaUne={videoALaUne}
            groupId={groupId}
          />
        </>
      );
    }

    // Masquage complet pour les simples adhérents / visiteurs
    return null;
  }

  // 2. Cas où la vidéo est active et valide
  const titreVideo = (videoALaUne?.titre || '').trim() || 'Vidéo à la une';

  return (
    <>
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className={`p-4 sm:p-5 bg-cordel-bg text-left select-none flex flex-col gap-3 transition-all duration-300 ${className}`}
      >
        {/* En-tête Cordel du widget */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-cordel-master-dark/25 pb-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-widest text-cordel-wood bg-white/70 px-2 py-0.5 rounded border border-cordel-wood/30 shrink-0">
                🎬 À LA UNE
              </span>
            </div>
            <h3 className="font-sans font-black text-sm sm:text-base text-encre-noire tracking-wide uppercase mt-1 truncate">
              {titreVideo}
            </h3>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center flex-wrap">
            {/* Bouton d'ouverture de la modale plein écran Mode Cinéma */}
            <button
              type="button"
              onClick={() => setIsCinemaModalOpen(true)}
              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-white hover:bg-amber-100 text-encre-noire border border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all"
              title="Ouvrir la vidéo en modale plein écran (Mode Cinéma)"
              aria-label="Ouvrir le Mode Cinéma plein écran"
            >
              <span className="text-xs">⛶</span>
              <span>Mode Cinéma</span>
            </button>

            {/* Bouton d'administration réservé aux Mestres et Administrateurs */}
            {isAuthorized && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-white border border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:bg-neutral-50 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1 transition-all"
                title="Modifier ou retirer la vidéo à la une"
              >
                <span>✏️</span>
                <span>Modifier</span>
              </button>
            )}

            {/* Lien externe vers YouTube */}
            {videoALaUne?.url && (
              <a
                href={videoALaUne.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-cordel-wood hover:text-encre-noire transition-colors ml-1"
                title="Ouvrir la vidéo directement sur YouTube dans un nouvel onglet"
              >
                <span>YouTube</span>
                <span className="text-xs">↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Lecteur vidéo standard (démonté pendant l'ouverture du Mode Cinéma pour éviter la double lecture) */}
        <div className="w-full flex justify-center items-center py-1">
          <div className="w-full max-w-xl lg:max-w-2xl">
            {!isCinemaModalOpen ? (
              <LiteYouTubeEmbed
                videoId={videoId}
                url={videoALaUne.url}
                title={titreVideo}
              />
            ) : (
              <div className="aspect-video w-full rounded-[8px_6px_10px_7px] border-2 border-encre-noire bg-black/90 text-[#f4ecd8] flex flex-col items-center justify-center gap-2 p-4 text-center">
                <span className="text-2xl">🎬</span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Lecture en cours en Mode Cinéma plein écran…
                </span>
              </div>
            )}
          </div>
        </div>
      </CordelCard>

      {/* Modale plein écran Mode Cinéma */}
      <CinemaVideoModal
        isOpen={isCinemaModalOpen}
        onClose={() => setIsCinemaModalOpen(false)}
        videoId={videoId}
        url={videoALaUne.url}
        title={titreVideo}
      />

      {/* Modale d'administration de la vidéo à la une */}
      <ModalVideoALaUne
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoALaUne={videoALaUne}
        groupId={groupId}
      />
    </>
  );
}
