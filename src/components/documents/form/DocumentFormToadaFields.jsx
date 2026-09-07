import React from 'react';
import RichTextEditor from '../../RichTextEditor';

/**
 * Sous-formulaire pour la saisie des chants et Toadas :
 * Paroles originales, transcription phonétique, traduction, audio témoin et informations contextuelles.
 */
export default function DocumentFormToadaFields({
  category = 'Toadas',
  nacao = '',
  setNacao,
  rythme = '',
  setRythme,
  audioUploadType = 'file',
  setAudioUploadType,
  audioFile = null,
  setAudioFile,
  audioUrl = '',
  setAudioUrl,
  parolesOriginales = '',
  setParolesOriginales,
  parolesPhonetiques = '',
  setParolesPhonetiques,
  traduction = '',
  setTraduction,
  anecdote = '',
  setAnecdote,
  isSubmitting = false
}) {
  return (
    <div className="flex flex-col gap-4 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Origine / Nation / Auteur
          </label>
          <input
            type="text"
            value={nacao}
            onChange={(e) => setNacao(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ex: Porto Rico"
            className="theme-input w-full disabled:opacity-50 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {category === 'Culture' ? "Époque / Période" : "Rythme"}
          </label>
          <input
            type="text"
            value={rythme}
            onChange={(e) => setRythme(e.target.value)}
            disabled={isSubmitting}
            placeholder={category === 'Culture' ? "Ex: 19ème Siècle" : "Ex: Baque de Virada"}
            className="theme-input w-full disabled:opacity-50 text-xs"
          />
        </div>
      </div>

      {/* Audio Témoin du Chant */}
      <div className="flex flex-col gap-2 p-3 bg-cordel-wood/5 border border-cordel-wood/20 rounded-md">
        <div className="flex items-center justify-between">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
            <span>🎵</span> Audio témoin (Enregistrement de référence)
          </label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setAudioUploadType('file')}
              className={`text-[8px] uppercase font-extrabold px-2 py-0.5 rounded transition-all cursor-pointer ${
                audioUploadType === 'file' ? 'bg-cordel-wood text-[#fdfaf2] shadow-xs' : 'text-encre-noire hover:bg-encre-noire/10'
              }`}
            >
              Fichier audio
            </button>
            <button
              type="button"
              onClick={() => setAudioUploadType('url')}
              className={`text-[8px] uppercase font-extrabold px-2 py-0.5 rounded transition-all cursor-pointer ${
                audioUploadType === 'url' ? 'bg-cordel-wood text-[#fdfaf2] shadow-xs' : 'text-encre-noire hover:bg-encre-noire/10'
              }`}
            >
              Lien URL
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
            {(audioUrl && !audioFile) && (
              <span className="text-[9px] text-cordel-vert font-bold whitespace-nowrap">✓ Audio actuel conservé</span>
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

      <div className={`grid grid-cols-1 ${category === 'Toadas' ? 'md:grid-cols-2' : ''} gap-4`}>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {category === 'Culture' ? "Texte de contenu (Fiche Culturelle)" : "Paroles Originales (Mettez en gras le Puxador/Soliste)"}
          </label>
          <div className="mt-1">
            <RichTextEditor
              value={parolesOriginales}
              onChange={(html) => setParolesOriginales(html)}
              disabled={isSubmitting}
              placeholder={category === 'Culture' ? "Rédigez la fiche culturelle ici..." : "Paroles dans la langue d'origine..."}
              minHeight="120px"
              showImage={category === 'Culture'}
              showLists={category === 'Culture'}
              showAlign={category === 'Culture'}
            />
          </div>
        </div>
        
        {category === 'Toadas' && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Paroles Phonétiques (Mettez en gras le Puxador/Soliste)
            </label>
            <div className="mt-1">
              <RichTextEditor
                value={parolesPhonetiques}
                onChange={(html) => setParolesPhonetiques(html)}
                disabled={isSubmitting}
                placeholder="Prononciation..."
                minHeight="120px"
                showImage={false}
                showLists={false}
                showAlign={false}
              />
            </div>
          </div>
        )}
      </div>
      
      {category === 'Toadas' && (
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Traduction
          </label>
          <textarea
            value={traduction}
            onChange={(e) => setTraduction(e.target.value)}
            disabled={isSubmitting}
            placeholder="Traduction française..."
            className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px] resize-y"
          />
        </div>
      )}

      <div className="flex flex-col gap-1 mt-2">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Information
        </label>
        <textarea
          value={anecdote}
          onChange={(e) => setAnecdote(e.target.value)}
          disabled={isSubmitting}
          placeholder="Informations ou contexte supplémentaire..."
          className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px] resize-y"
        />
      </div>
    </div>
  );
}
