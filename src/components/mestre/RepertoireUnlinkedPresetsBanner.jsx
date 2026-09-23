import React, { useState } from 'react';
import CordelButton from '../CordelButton';

/**
 * Encart informatif et repliable pour afficher les presets complets du Séquenceur
 * qui ne sont pas encore répertoriés dans le classeur artistique de la saison.
 *
 * @param {Array} unlinkedPresets - Liste des presets complets du Séquenceur non encore rattachés
 * @param {Function} onImportPreset - Callback d'importation d'un preset dans le Répertoire
 * @param {string|null} importingPresetId - Identifiant du preset en cours d'importation
 */
export default function RepertoireUnlinkedPresetsBanner({
  unlinkedPresets = [],
  onImportPreset,
  importingPresetId = null
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!unlinkedPresets || unlinkedPresets.length === 0) return null;

  return (
    <div className="border-2 border-dashed border-[var(--color-cordel-ocre,#c05621)] bg-[#fdf9ee] rounded-[8px_12px_9px_11px] p-3.5 shadow-sm transition-all text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl select-none">🥁</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-ocre,#c05621)] flex items-center gap-1.5">
              <span>
                {unlinkedPresets.length} preset{unlinkedPresets.length > 1 ? 's' : ''} du Séquenceur non répertorié{unlinkedPresets.length > 1 ? 's' : ''}
              </span>
            </h4>
            <p className="text-[10.5px] text-encre-noire/70 font-bold mt-0.5 leading-snug">
              Des morceaux complets existent dans le Séquenceur sans fiche associée dans le Répertoire de saison.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={false}
            onClick={() => setIsOpen(!isOpen)}
            className="py-1 px-3 text-[10px] font-black uppercase tracking-wider"
          >
            {isOpen ? 'Masquer la liste ▲' : `Afficher (${unlinkedPresets.length}) ▼`}
          </CordelButton>
        </div>
      </div>

      {/* Liste détaillée des morceaux à importer */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-dashed border-[var(--color-cordel-ocre,#c05621)]/30 flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {unlinkedPresets.map((preset) => {
              const pTitle = preset.titre || preset.name || 'Morceau Séquenceur';
              const isImporting = importingPresetId === preset.id;

              return (
                <div
                  key={preset.id}
                  className="bg-white p-3 rounded-[4px_6px_3px_5px] border border-encre-noire/20 flex flex-col justify-between gap-2.5 shadow-2xs text-left"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-extrabold text-encre-noire truncate" title={pTitle}>
                      {pTitle}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300">
                        Preset complet
                      </span>
                      {preset.audioUrl && (
                        <span className="text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-300">
                          🎵 Audio
                        </span>
                      )}
                      {preset.bpm && (
                        <span className="text-[9px] font-bold text-encre-noire/60">
                          {preset.bpm} BPM
                        </span>
                      )}
                    </div>
                  </div>

                  <CordelButton
                    type="button"
                    variant="vert"
                    useExtremeBorder={false}
                    disabled={isImporting}
                    onClick={() => onImportPreset && onImportPreset(preset)}
                    className="py-1 px-2.5 text-[9.5px] font-black uppercase tracking-wider w-full flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    title={`Importer « ${pTitle} » dans le Répertoire`}
                  >
                    <span>{isImporting ? '⏳' : '➕'}</span>
                    <span>{isImporting ? 'Importation...' : 'Importer dans le Répertoire'}</span>
                  </CordelButton>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
