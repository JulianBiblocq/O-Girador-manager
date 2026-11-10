import React from 'react';

const PROJECT_TABS = [
  { id: 'projet_presentation', label: '🌟 Présentation / Note illustrée' },
  { id: 'file', label: '📄 Fichier (PDF ou Photo)' },
  { id: 'dossier_externe', label: '📸 Album Photos / Dossier Cloud' }
];

const TITLE_PLACEHOLDERS = {
  projet_presentation: 'Ex : Les 30 ans de Samambaia — Le Grand Projet',
  file: 'Ex : Plan du site, Affiche officielle, Rétro-planning...',
  dossier_externe: 'Ex : Photos repérage du site ou Archives 30 ans'
};

/**
 * Sous-formulaire polyvalent dédié aux cordes dynamiques de Projet (`projet_${eventId}`).
 * Propose 3 modes par onglets : Présentation illustrée, Fichier PDF/Photo compressé, ou Album Cloud.
 */
export default function DocumentFormProjectFields({
  projectMode = 'projet_presentation', setProjectMode,
  title = '', setTitle, projectText = '', setProjectText,
  projectNotes = '', setProjectNotes,
  illustrationUploadType = 'file', setIllustrationUploadType,
  illustrationFile = null, setIllustrationFile,
  illustrationUrl = '', setIllustrationUrl,
  isPinnedFirst = true, setIsPinnedFirst,
  file = null, onFileChange, externalUrl = '', setExternalUrl,
  isEditMode = false, isSubmitting = false
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Sélecteur de format en 3 onglets Cordel */}
      <div className="flex flex-col sm:flex-row gap-1.5 p-1.5 bg-cordel-master-dark/5 rounded-[4px_8px_3px_6px] border border-encre-noire/20 select-none">
        {PROJECT_TABS.map((tab) => (
          <button
            key={tab.id} type="button" disabled={isSubmitting} onClick={() => setProjectMode(tab.id)}
            className={`flex-1 text-xs py-2 px-2.5 font-extrabold rounded-[3px_6px_2px_5px] transition-all cursor-pointer border ${
              projectMode === tab.id
                ? 'bg-[var(--color-cordel-ocre,#c05621)] text-[#FEF9E7] border-encre-noire shadow-[2px_2px_0px_0px_#181716]'
                : 'bg-cordel-bg text-cordel-master-dark border-transparent hover:border-encre-noire/25'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Champ Titre contextualisé selon l'onglet actif */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Titre du livret sur la corde Projet
        </label>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting}
          placeholder={TITLE_PLACEHOLDERS[projectMode] || TITLE_PLACEHOLDERS.projet_presentation}
          className="theme-input w-full disabled:opacity-50 font-bold text-xs"
        />
      </div>

      {/* MODE A — 🌟 Présentation / Note illustrée (type: 'projet_presentation') */}
      {projectMode === 'projet_presentation' && (
        <div className="flex flex-col gap-3.5 p-3.5 bg-cordel-bg-light/70 border border-dashed border-encre-noire/25 rounded-[4px_8px_3px_6px]">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Texte de présentation globale (Objectifs, dates clés, liens cliquables)
            </label>
            <textarea
              rows={7} value={projectText} onChange={(e) => setProjectText(e.target.value)} required disabled={isSubmitting}
              placeholder="Rédigez la présentation générale du projet, les grandes échéances et ajoutez vos liens utiles (ex: https://... ou [Libellé](https://...))..."
              className="theme-input w-full disabled:opacity-50 text-xs leading-relaxed whitespace-pre-line"
            />
          </div>

          {/* Visuel d'illustration optionnel (Upload compressé ou URL externe) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Visuel d&apos;illustration en en-tête (Optionnel)
              </label>
              <div className="flex gap-1 text-[10px] font-bold">
                <button
                  type="button" onClick={() => setIllustrationUploadType('file')}
                  className={`px-2 py-0.5 rounded border cursor-pointer ${
                    illustrationUploadType === 'file' ? 'bg-cordel-wood text-[#FEF9E7] border-encre-noire' : 'bg-cordel-bg text-cordel-master-dark border-encre-noire/20'
                  }`}
                >
                  📷 Image locale (compressée)
                </button>
                <button
                  type="button" onClick={() => setIllustrationUploadType('url')}
                  className={`px-2 py-0.5 rounded border cursor-pointer ${
                    illustrationUploadType === 'url' ? 'bg-cordel-wood text-[#FEF9E7] border-encre-noire' : 'bg-cordel-bg text-cordel-master-dark border-encre-noire/20'
                  }`}
                >
                  🌐 URL externe
                </button>
              </div>
            </div>

            {illustrationUploadType === 'file' ? (
              <div className="flex flex-col gap-1.5">
                {(illustrationFile || illustrationUrl) && (
                  <div className="text-xs font-bold text-cordel-wood bg-cordel-wood/10 px-2.5 py-1.5 rounded border border-cordel-wood/30 flex items-center justify-between gap-2">
                    <span className="truncate">🖼️ {illustrationFile ? illustrationFile.name : 'Visuel actuel conservé'}</span>
                    <button
                      type="button" onClick={() => { setIllustrationFile(null); setIllustrationUrl(''); }}
                      className="text-[10px] font-black uppercase text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline cursor-pointer"
                    >
                      Retirer
                    </button>
                  </div>
                )}
                <input
                  type="file" accept="image/*" disabled={isSubmitting}
                  onChange={(e) => { if (e.target.files?.[0]) setIllustrationFile(e.target.files[0]); }}
                  className="theme-input w-full disabled:opacity-50 text-xs py-1.5 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                />
              </div>
            ) : (
              <input
                type="url" value={illustrationUrl} onChange={(e) => setIllustrationUrl(e.target.value)} disabled={isSubmitting}
                placeholder="https://... (Lien vers une affiche ou bannière)"
                className="theme-input w-full disabled:opacity-50 text-xs font-semibold"
              />
            )}
          </div>

          {/* Case à cocher d'épinglage en tête de la corde */}
          <div className="flex items-center gap-2 bg-cordel-bg border border-[var(--color-cordel-ocre,#c05621)]/50 p-2.5 rounded shadow-2xs">
            <input
              type="checkbox" id="pinProjectPresentationFirst" checked={isPinnedFirst}
              onChange={(e) => setIsPinnedFirst(e.target.checked)} disabled={isSubmitting}
              className="w-4 h-4 text-[var(--color-cordel-ocre,#c05621)] rounded cursor-pointer"
            />
            <label htmlFor="pinProjectPresentationFirst" className="text-xs font-extrabold text-cordel-master-dark cursor-pointer select-none">
              📌 Épingler en tête de la corde (avant les commissions)
            </label>
          </div>
        </div>
      )}

      {/* MODE B (Fichier PDF/Photo) ou MODE C (Album Photos / Dossier Cloud) */}
      {(projectMode === 'file' || projectMode === 'dossier_externe') && (
        <div className="flex flex-col gap-3.5 p-3.5 bg-cordel-bg-light/70 border border-dashed border-encre-noire/25 rounded-[4px_8px_3px_6px]">
          {projectMode === 'file' ? (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Fichier PDF ou Photo (Compression automatique si image)
              </label>
              {file && (
                <div className="text-xs font-bold text-cordel-wood bg-cordel-wood/10 px-2.5 py-1.5 rounded border border-cordel-wood/30 flex items-center justify-between">
                  <span className="truncate">📎 {file.name}</span>
                </div>
              )}
              <input
                type="file" onChange={onFileChange} required={!file && !isEditMode} disabled={isSubmitting} accept="application/pdf,image/*"
                className="theme-input w-full disabled:opacity-50 text-xs py-2 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                URL externe de l&apos;album ou du dossier Cloud (Framaspace / Nextcloud / Drive)
              </label>
              <input
                type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} required disabled={isSubmitting}
                placeholder="https://framaspace.org/s/... ou https://drive.google.com/drive/folders/..."
                className="theme-input w-full disabled:opacity-50 text-xs font-semibold"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Notes courtes / légende (Optionnel)
            </label>
            <textarea
              rows={3} value={projectNotes} onChange={(e) => setProjectNotes(e.target.value)} disabled={isSubmitting}
              placeholder="Précisions ou contexte rapide sur ce document ou dossier partagé..."
              className="theme-input w-full disabled:opacity-50 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
