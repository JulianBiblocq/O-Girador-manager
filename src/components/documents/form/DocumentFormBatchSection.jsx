import React from 'react';
import CordelButton from '../../CordelButton';

/**
 * Section d'importation par lot pour documents (Toadas, Culture, TutosFabrication) via fichier JSON.
 */
export default function DocumentFormBatchSection({
  category,
  batchFile,
  onBatchFileChange,
  isSubmitting,
  onDownloadTemplate
}) {
  return (
    <div className="flex flex-col gap-4 border-2 border-dashed border-cordel-master-dark/20 p-4 rounded bg-cordel-bg">
      <p className="text-xs text-cordel-master-dark">
        L'import JSON permet d'ajouter un lot entier de fiches d'un seul coup (idéal pour initialiser vos {category}).
      </p>
      <CordelButton 
        type="button" 
        variant="default"
        onClick={() => onDownloadTemplate(category)}
        className="text-xs px-4 py-2 self-start cursor-pointer"
      >
        ⬇️ Télécharger un modèle vierge (.json)
      </CordelButton>

      <div className="flex flex-col gap-1 mt-2">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Fichier JSON à importer
        </label>
        <input
          type="file"
          accept=".json"
          onChange={(e) => onBatchFileChange(e.target.files[0] || null)}
          disabled={isSubmitting}
          className="theme-input w-full disabled:opacity-50 text-xs py-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
        />
        {batchFile && (
          <span className="text-[10px] text-cordel-vert font-bold mt-1">
            ✓ Fichier sélectionné : {batchFile.name}
          </span>
        )}
      </div>
    </div>
  );
}
