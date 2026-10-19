import React from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Sous-composant dédié pour l'audio témoin (Enregistrement de référence) d'une Toada.
 * Gère le téléversement de fichier ou la saisie d'un lien direct.
 */
export default function ToadaAudioWitnessField({
  audioUploadType = 'file',
  setAudioUploadType,
  audioFile = null,
  setAudioFile,
  audioUrl = '',
  setAudioUrl,
  isSubmitting = false
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 p-3 bg-cordel-wood/5 border border-cordel-wood/20 rounded-md text-left">
      <div className="flex items-center justify-between">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
          <span>🎵</span> {t('toada.audioWitnessTitle') || "Audio témoin (Enregistrement de référence)"}
        </label>
        <div className="flex gap-1.5">
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
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            onChange={(e) => setAudioFile(e.target.files[0] || null)}
            disabled={isSubmitting}
            className="theme-input w-full text-xs py-1.5 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
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
          onChange={(e) => setAudioUrl(e.target.value)}
          disabled={isSubmitting}
          placeholder="https://... (Lien direct vers fichier audio)"
          className="theme-input w-full text-xs font-semibold"
        />
      )}
    </div>
  );
}
