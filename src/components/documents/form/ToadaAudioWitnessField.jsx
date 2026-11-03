import React, { useState } from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Sous-composant dédié pour les médias de référence (Audio témoin + Vidéo YouTube)
 * et le statut de validation Cantador d'une Toada (< 140 lignes).
 */
export default function ToadaAudioWitnessField({
  category = 'Toadas',
  audioUploadType = 'file',
  setAudioUploadType,
  audioFile = null,
  setAudioFile,
  audioUrl = '',
  setAudioUrl,
  videoUrl = '',
  setVideoUrl,
  cantadorValidated = false,
  setCantadorValidated,
  isSubmitting = false
}) {
  const { t } = useTranslation();
  const [wasAudioRemoved, setWasAudioRemoved] = useState(false);

  const hasAudio = Boolean(audioUrl || audioFile);

  const handleRemoveAudio = () => {
    if (setAudioFile) setAudioFile(null);
    if (setAudioUrl) setAudioUrl('');
    setWasAudioRemoved(true);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Audio témoin + Suppression */}
      <div className="flex flex-col gap-2 p-3 bg-cordel-wood/5 border border-cordel-wood/20 rounded-md text-left">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
            <span>🎵</span> {t('toada.audioWitnessTitle') || "Audio témoin (Enregistrement de référence)"}
          </label>
          <div className="flex items-center gap-1.5">
            {hasAudio && (
              <button
                type="button"
                onClick={handleRemoveAudio}
                disabled={isSubmitting}
                className="text-[8.5px] uppercase font-black px-2 py-0.5 rounded bg-[var(--color-cordel-rouge,#8b2a1a)]/10 text-[var(--color-cordel-rouge,#8b2a1a)] border border-[var(--color-cordel-rouge,#8b2a1a)]/40 hover:bg-[var(--color-cordel-rouge,#8b2a1a)] hover:text-white transition-all cursor-pointer"
                title="Retirer l'enregistrement audio de cette fiche"
              >
                🗑️ Retirer l&apos;audio
              </button>
            )}
            <button
              type="button"
              onClick={() => setAudioUploadType('file')}
              className={`text-[8px] uppercase font-extrabold px-2 py-0.5 rounded transition-all cursor-pointer ${
                audioUploadType === 'file'
                  ? 'bg-cordel-wood text-[#fdfaf2] shadow-xs'
                  : 'text-encre-noire hover:bg-encre-noire/10'
              }`}
            >
              {t('common.file') || "Fichier audio"}
            </button>
            <button
              type="button"
              onClick={() => setAudioUploadType('url')}
              className={`text-[8px] uppercase font-extrabold px-2 py-0.5 rounded transition-all cursor-pointer ${
                audioUploadType === 'url'
                  ? 'bg-cordel-wood text-[#fdfaf2] shadow-xs'
                  : 'text-encre-noire hover:bg-encre-noire/10'
              }`}
            >
              {t('common.url') || "Lien URL"}
            </button>
          </div>
        </div>

        {audioUploadType === 'file' ? (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a"
              onChange={(e) => {
                setAudioFile(e.target.files[0] || null);
                if (e.target.files[0]) setWasAudioRemoved(false);
              }}
              disabled={isSubmitting}
              className="theme-input flex-1 text-xs py-1.5 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
            />
            {audioUrl && !audioFile && (
              <span className="text-[9px] text-[var(--color-cordel-vert,#2d6a4f)] font-bold whitespace-nowrap">
                ✓ {t('toada.currentAudioPreserved') || "Audio actuel conservé"}
              </span>
            )}
          </div>
        ) : (
          <input
            type="url"
            value={audioUrl}
            onChange={(e) => {
              setAudioUrl(e.target.value);
              if (e.target.value) setWasAudioRemoved(false);
            }}
            disabled={isSubmitting}
            placeholder="https://... (Lien direct vers fichier MP3 / WAV / OGG)"
            className="theme-input w-full text-xs font-semibold"
          />
        )}

        {wasAudioRemoved && !hasAudio && (
          <span className="text-[9px] font-bold text-[var(--color-cordel-rouge,#8b2a1a)]">
            🗑️ Audio retiré — il sera effacé de la fiche lors de l&apos;enregistrement.
          </span>
        )}
      </div>

      {/* 2. Lien Vidéo YouTube optionnel (coexistence avec l'audio) */}
      {setVideoUrl && (
        <div className="flex flex-col gap-1 p-3 bg-cordel-bg/60 border border-cordel-master-dark/15 rounded-md text-left">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
            <span>🎬</span> Lien Vidéo YouTube (Optionnel — coexiste avec l&apos;audio)
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={isSubmitting}
            placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
            className="theme-input w-full text-xs font-semibold"
          />
        </div>
      )}

      {/* 3. Validation Cantador pour affichage du bouton aux adhérents */}
      {category === 'Toadas' && setCantadorValidated && (
        <label className="flex items-center gap-2 p-2.5 bg-[var(--color-cordel-vert,#2d6a4f)]/10 border border-[var(--color-cordel-vert,#2d6a4f)]/40 rounded-md cursor-pointer select-none text-left">
          <input
            type="checkbox"
            checked={Boolean(cantadorValidated)}
            onChange={(e) => setCantadorValidated(e.target.checked)}
            disabled={isSubmitting}
            className="w-4 h-4 accent-[var(--color-cordel-vert,#2d6a4f)] rounded cursor-pointer"
          />
          <span className="text-xs font-bold text-encre-noire">
            ✅ Chant prêt et validé dans Cantador (afficher le bouton aux adhérents)
          </span>
        </label>
      )}
    </div>
  );
}
