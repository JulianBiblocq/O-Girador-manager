import React from 'react';
import CordelButton from '../../CordelButton';
import { SIX_TOADA_PRESETS } from '../../../utils/toadaSixPresetsSync';

/**
 * Section d'importation par lot pour documents (Toadas, Culture, TutosFabrication) via fichier JSON (< 90 lignes).
 * Inclut la fusion intelligente (Upsert sans doublon) et le téléchargement/pré-intégration des 6 Toadas.
 */
export default function DocumentFormBatchSection({
  category,
  batchFile,
  onBatchFileChange,
  isSubmitting,
  onDownloadTemplate,
  onSyncSixToadas = null
}) {
  const handleDownloadSixPresetsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(SIX_TOADA_PRESETS, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'pack_6_toadas_structures.json');
    dlAnchor.click();
  };

  return (
    <div className="flex flex-col gap-4 border-2 border-dashed border-cordel-master-dark/20 p-4 rounded bg-cordel-bg">
      <p className="text-xs text-cordel-master-dark">
        L'import JSON permet d'ajouter ou d'enrichir sans doublon (Upsert par titre) un lot entier de fiches ({category}).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <CordelButton
          type="button"
          variant="default"
          onClick={() => onDownloadTemplate(category)}
          className="text-xs px-4 py-2 self-start cursor-pointer"
        >
          ⬇️ Télécharger un modèle vierge (.json)
        </CordelButton>
        {category === 'Toadas' && (
          <CordelButton
            type="button"
            variant="ocre"
            onClick={onSyncSixToadas || handleDownloadSixPresetsJson}
            disabled={isSubmitting}
            className="text-xs px-4 py-2 self-start cursor-pointer font-bold"
          >
            🎼 Pré-intégrer les 6 structures Toadas
          </CordelButton>
        )}
      </div>

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
