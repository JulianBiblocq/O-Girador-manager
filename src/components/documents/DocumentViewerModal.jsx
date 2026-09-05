import React from 'react';
import { useTranslation } from '../LanguageContext';

/**
 * Utilitaires pour analyser les URLs vidéo (YouTube, Vimeo, fichiers directs).
 */
function getMediaEmbedInfo(url) {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.trim();

  // 1. Playlist YouTube (ex: youtube.com/playlist?list=PLBaYhFEJG6Pw1i2dneM6Vkjsll9SSv3vH)
  const playlistMatch = cleanUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (playlistMatch && cleanUrl.includes('youtube')) {
    return {
      type: 'youtube-playlist',
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistMatch[1]}`,
      directUrl: cleanUrl
    };
  }

  // 2. Vidéo YouTube standard (watch?v=...) ou courte (youtu.be/...)
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch) {
    return {
      type: 'youtube-video',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`,
      directUrl: cleanUrl
    };
  }

  // 3. Vidéo Vimeo (ex: vimeo.com/123456789)
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch) {
    const vimeoId = vimeoMatch[3] || vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      directUrl: cleanUrl
    };
  }

  // 4. Fichier vidéo direct (MP4, WebM, Ogg)
  if (cleanUrl.match(/\.(mp4|webm|ogg|m4v)(\?.*)?$/i)) {
    return {
      type: 'video-file',
      embedUrl: cleanUrl,
      directUrl: cleanUrl
    };
  }

  // 5. Fichier audio direct (MP3, WAV, OGG, M4A)
  if (cleanUrl.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i)) {
    return {
      type: 'audio-file',
      embedUrl: cleanUrl,
      directUrl: cleanUrl
    };
  }

  // 6. Image directe
  if (cleanUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
    return {
      type: 'image',
      embedUrl: cleanUrl,
      directUrl: cleanUrl
    };
  }

  // 7. Fichier PDF
  if (cleanUrl.toLowerCase().includes('.pdf')) {
    return {
      type: 'pdf',
      embedUrl: cleanUrl,
      directUrl: cleanUrl
    };
  }

  // 8. Dossier externe / Cloud Drive (Drive, Dropbox, Nextcloud, etc.)
  if (cleanUrl.includes('drive.google.com') || cleanUrl.includes('dropbox.com') || cleanUrl.includes('onedrive') || cleanUrl.includes('framaspace')) {
    return {
      type: 'cloud-drive',
      embedUrl: null,
      directUrl: cleanUrl
    };
  }

  return {
    type: 'web-link',
    embedUrl: null,
    directUrl: cleanUrl
  };
}

/**
 * Modale universelle de lecture et prévisualisation pour tous les documents du Varal.
 * Résout le problème des documents non cliquables (PDF, vidéos, dossiers partagés, comptes-rendus).
 */
export default function DocumentViewerModal({ document: docItem, onClose }) {
  const { t } = useTranslation();

  if (!docItem) return null;

  const targetUrl = docItem.fileUrl || docItem.url || docItem.link || '';
  const mediaInfo = getMediaEmbedInfo(targetUrl);

  const docType = docItem.type || docItem.typeDoc || mediaInfo?.type || 'pdf';
  const isPdf = docType === 'pdf' || (mediaInfo && mediaInfo.type === 'pdf') || targetUrl.toLowerCase().includes('.pdf');
  const isVideo = docType === 'video' || (mediaInfo && ['youtube-playlist', 'youtube-video', 'vimeo', 'video-file'].includes(mediaInfo.type));
  const isAudio = docType === 'audio' || (mediaInfo && mediaInfo.type === 'audio-file');
  const isImage = docType === 'image' || (mediaInfo && mediaInfo.type === 'image');
  const isCloudDrive = docType === 'dossier_externe' || docType === 'drive' || (mediaInfo && mediaInfo.type === 'cloud-drive');
  const isReport = docType === 'report';

  // Formatage de la date
  const displayDate = docItem.dateAjout || docItem.date || docItem.createdAt;
  const formattedDate = displayDate ? new Date(displayDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Arrière-plan cliquable pour fermer */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteneur principal de la modale Cordel */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[var(--cordel-bg)] text-[var(--cordel-text)] border-2 border-cordel-master-dark rounded-[8px_14px_6px_12px] shadow-[6px_6px_0px_0px_#181716] overflow-hidden z-10 animate-scaleUp">
        
        {/* En-tête de la modale */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b-2 border-dashed border-cordel-master-dark/25 bg-[var(--cordel-bg-light,#fffcf5)] shrink-0 gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm select-none">
                {isVideo ? '🎥' : isPdf ? '📄' : isAudio ? '🎵' : isImage ? '📷' : isCloudDrive ? '📂' : '📜'}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-cordel-ocre,#c05621)] text-[#FEF9E7] border border-encre-noire shadow-[1px_1px_0px_0px_#181716]">
                {docItem.categorie || docItem.categoryId || (isPdf ? "Document PDF" : isVideo ? "Vidéo / Tutoriel" : "Document")}
              </span>
              {docItem.annee && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-encre-noire/10 text-encre-noire">
                  {docItem.annee}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-cordel-wood leading-tight break-words mt-1">
              {docItem.titre || "Sans titre"}
            </h3>

            {docItem.sousTitre && (
              <p className="text-xs font-semibold text-stone-600 italic truncate">
                {docItem.sousTitre}
              </p>
            )}
          </div>

          {/* Bouton de fermeture */}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 sm:p-2 rounded-full border-2 border-encre-noire bg-[var(--color-cordel-rouge,#8b2a1a)] text-white shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-all"
            aria-label="Fermer"
            title="Fermer la prévisualisation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corps principal avec affichage du média */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-4 bg-[var(--cordel-bg)] varal-scrollbar min-h-[300px]">
          
          {/* Description ou notes contextuelles si présentes */}
          {docItem.description && (
            <div className="p-3 bg-white/70 border border-dashed border-encre-noire/20 rounded text-xs text-stone-700 leading-relaxed italic">
              {docItem.description}
            </div>
          )}

          {/* 1. CAS VIDÉO : YouTube, Vimeo ou fichier direct */}
          {isVideo && mediaInfo?.embedUrl && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="w-full aspect-video max-h-[68vh] rounded border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] overflow-hidden bg-black">
                {mediaInfo.type === 'video-file' ? (
                  <video 
                    src={mediaInfo.embedUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  >
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                ) : (
                  <iframe
                    src={mediaInfo.embedUrl}
                    title={docItem.titre}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}

          {/* 2. CAS PDF : Affichage Iframe interactif */}
          {isPdf && targetUrl && (
            <div className="w-full flex-1 flex flex-col min-h-[55vh] md:min-h-[65vh] rounded border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] overflow-hidden bg-white">
              <iframe
                src={`${targetUrl}#toolbar=1&navpanes=0`}
                title={docItem.titre}
                className="w-full h-full flex-1 border-0 min-h-[55vh] md:min-h-[65vh]"
              />
            </div>
          )}

          {/* 3. CAS AUDIO : Lecteur sonore */}
          {isAudio && targetUrl && (
            <div className="p-6 bg-white border-2 border-encre-noire rounded shadow-[3px_3px_0px_0px_#181716] flex flex-col items-center gap-4">
              <span className="text-4xl">🎵</span>
              <audio controls src={targetUrl} className="w-full max-w-md">
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
          )}

          {/* 4. CAS IMAGE : Galerie photo */}
          {isImage && targetUrl && (
            <div className="w-full flex items-center justify-center p-2 bg-black/10 rounded border-2 border-encre-noire">
              <img 
                src={targetUrl} 
                alt={docItem.titre} 
                className="max-h-[68vh] w-auto object-contain rounded shadow" 
              />
            </div>
          )}

          {/* 5. CAS DOSSIER EXTERNE / CLOUD (Google Drive, Dropbox, Album Photos) */}
          {(isCloudDrive || (!isVideo && !isPdf && !isAudio && !isImage && targetUrl)) && (
            <div className="p-6 sm:p-8 bg-amber-50/70 border-2 border-dashed border-cordel-master-dark/30 rounded-[6px_10px_4px_8px] text-center flex flex-col items-center gap-4 my-auto">
              <span className="text-5xl">📂</span>
              <div className="max-w-md">
                <h4 className="font-extrabold text-base text-cordel-wood uppercase">
                  Dépôt Externe & Galerie Partagée
                </h4>
                <p className="text-xs text-stone-600 mt-1">
                  Ce livret est relié à un espace de stockage externe (Google Drive, Dropbox ou serveur cloud dédié).
                </p>
              </div>

              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-2 transition-all mt-2"
              >
                <span>Accéder au dossier en ligne</span>
                <span>➜</span>
              </a>
            </div>
          )}

          {/* 6. CAS COMPTE-RENDU TEXTUEL OU MIXTE AVEC PDF */}
          {isReport && (
            <div className="flex flex-col gap-4">
              {/* Affichage des membres présents s'ils sont renseignés */}
              {docItem.presents && docItem.presents.length > 0 && (
                <div className="bg-white/70 p-3 rounded border border-dashed border-encre-noire/15 flex flex-col gap-1.5 text-xs">
                  <span className="text-[8px] font-black uppercase tracking-wider text-cordel-master-dark opacity-75">
                    Membres présents à cette réunion :
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {docItem.presents.map((name, i) => (
                      <span key={`${name}-${i}`} className="text-[9px] font-bold px-2 py-0.5 bg-neutral-200/60 rounded">
                        👤 {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Points à l'ordre du jour rédigés */}
              {docItem.points && docItem.points.length > 0 && (
                <div className="flex flex-col gap-3">
                  {docItem.points.map((p, idx) => (
                    <div key={p.id || idx} className="p-3.5 bg-white border border-encre-noire/20 rounded shadow-xs flex flex-col gap-1.5 text-xs">
                      <span className="font-extrabold text-cordel-wood border-b border-dashed border-encre-noire/10 pb-1">
                        📌 {p.titre}
                      </span>
                      <p className="opacity-90 leading-relaxed font-semibold italic whitespace-pre-wrap pl-2 text-encre-noire">
                        {p.notesCR || "Aucune note rédigée pour ce point."}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Texte libre du compte-rendu */}
              {docItem.texte && !docItem.points?.length && (
                <div className="p-4 bg-white border border-encre-noire/20 rounded shadow-xs text-xs whitespace-pre-wrap leading-relaxed italic font-semibold text-encre-noire">
                  {docItem.texte}
                </div>
              )}

              {/* Si le compte-rendu possède un fichier PDF joint ou scanné */}
              {targetUrl && targetUrl.toLowerCase().includes('.pdf') && (
                <div className="mt-2 flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark">
                    📄 Document scanné officiel (PDF joint) :
                  </span>
                  <div className="w-full flex-1 flex flex-col min-h-[50vh] rounded border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] overflow-hidden bg-white">
                    <iframe
                      src={`${targetUrl}#toolbar=1&navpanes=0`}
                      title={docItem.titre}
                      className="w-full h-full flex-1 border-0 min-h-[50vh]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pied de page de la modale avec actions directes */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 border-t-2 border-dashed border-cordel-master-dark/25 bg-[var(--cordel-bg-light,#fffcf5)] shrink-0">
          <div className="text-[9px] font-black uppercase tracking-wider text-stone-500 select-none">
            {formattedDate ? `Ajouté le ${formattedDate}` : "Document du Varal"}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bouton ouvrir dans un nouvel onglet */}
            {targetUrl && (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] bg-white text-encre-noire border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] hover:bg-stone-50 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all"
                title="Ouvrir dans une nouvelle fenêtre ou un onglet dédié"
              >
                <span>{isPdf ? "Plein écran" : isVideo ? "Ouvrir sur la plateforme" : "Nouvel onglet"}</span>
                <span>↗</span>
              </a>
            )}

            {/* Bouton de téléchargement pour les fichiers téléchargeables */}
            {targetUrl && (isPdf || mediaInfo?.type === 'video-file' || mediaInfo?.type === 'audio-file' || isImage) && (
              <a
                href={targetUrl}
                download={docItem.titre || "document"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] bg-[var(--color-cordel-vert,#2d6a4f)] text-white border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all"
                title="Télécharger le fichier sur votre appareil"
              >
                <span>Télécharger</span>
                <span>📥</span>
              </a>
            )}

            {/* Bouton fermer */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] bg-[var(--cordel-bg)] text-encre-noire border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] hover:bg-stone-200 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
