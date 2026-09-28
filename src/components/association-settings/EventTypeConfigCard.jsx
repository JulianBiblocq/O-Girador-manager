/**
 * Composant de carte accordéon configurable pour un type d'événement dans l'Agenda.
 * Permet à l'administrateur de personnaliser les modules activés par défaut,
 * les règles d'inscription, les délais et les liens de dépôt cloud pour chaque format.
 */

import React from 'react';
import {
  getEventTypeEmoji,
  resolveTypeEffectiveConfig,
  buildConfigSummary
} from '../../utils/eventTypeConfigUtils';

export {
  getEventTypeEmoji,
  resolveTypeEffectiveConfig,
  buildConfigSummary
};

export default function EventTypeConfigCard({
  type,
  rawConfig = {},
  onChangeConfig,
  onRemoveType,
  saving = false,
  isExpanded = false,
  onToggleExpand
}) {
  const config = resolveTypeEffectiveConfig(type, rawConfig);
  const emoji = getEventTypeEmoji(type);
  const summaryText = buildConfigSummary(config);

  const handleToggle = (key, value) => {
    const updated = {
      ...rawConfig,
      ...config,
      [key]: value
    };
    // Synchronisation bidirectionnelle pour les alias vidéo
    if (key === 'enableVideoDrop') {
      updated.activerDepotVideo = value;
    } else if (key === 'activerDepotVideo') {
      updated.enableVideoDrop = value;
    }
    // Synchronisation bidirectionnelle pour les alias plan de scène et révision
    if (key === 'enableStageLayout') {
      updated.agendaEnableStageLayout = value;
    }
    if (key === 'enableRevisionProgram') {
      updated.agendaEnableRevisionProgram = value;
    }
    onChangeConfig(type, updated);
  };

  const handleDeadlineChange = (val) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    const updated = {
      ...rawConfig,
      ...config,
      defaultDeadlineHours: num
    };
    onChangeConfig(type, updated);
  };

  const handleUrlChange = (val) => {
    const updated = {
      ...rawConfig,
      ...config,
      defaultDropUrl: val.trim()
    };
    onChangeConfig(type, updated);
  };

  return (
    <div className="border-2 border-encre-noire rounded-[6px_9px_7px_8px] bg-cordel-bg-light/60 overflow-visible shadow-[2px_2px_0px_0px_#181716] transition-all h-auto">
      {/* Barre d'en-tête Cordel (Ligne accordéon cliquable) */}
      <div className="p-3 bg-cordel-bg flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap border-b border-dashed border-cordel-master-dark/15 rounded-t-[4px_7px_0px_0px]">
        <div 
          onClick={onToggleExpand}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpand();
            }
          }}
          title={isExpanded ? "Replier la configuration" : "Déplier pour configurer"}
        >
          <span className="text-lg leading-none shrink-0">{emoji}</span>
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-xs font-black capitalize text-cordel-wood truncate">
              {type}
            </span>
            <span className="text-[10px] text-encre-noire/70 truncate font-semibold" title={summaryText}>
              {summaryText}
            </span>
          </div>
        </div>

        {/* Boutons d'action : Configurer & Supprimer */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleExpand}
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/40 bg-white hover:bg-neutral-100 text-encre-noire shadow-xs cursor-pointer transition-colors select-none flex items-center gap-1"
          >
            <span>⚙️ {isExpanded ? 'Fermer ▲' : 'Configurer ▾'}</span>
          </button>

          <button
            type="button"
            onClick={() => onRemoveType(type)}
            disabled={saving}
            className="p-1 px-2 text-[10px] font-black rounded border border-red-300 bg-red-50 text-[var(--color-cordel-rouge,#8b2a1a)] hover:bg-red-100 hover:border-red-500 cursor-pointer transition-colors select-none"
            title={`Supprimer le type "${type}"`}
            aria-label={`Supprimer ${type}`}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tiroir dépliable (Formulaire des presets du type) */}
      {isExpanded && (
        <div className="p-3.5 pb-6 bg-white/70 flex flex-col gap-4 text-left animate-fade-in text-encre-noire h-auto overflow-visible rounded-b-[0px_0px_5px_6px]">
          {/* Section 1 : Modules & Outils */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-cordel-wood mb-2 border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center gap-1.5">
              <span>📦</span>
              <span>Modules & Outils activés par défaut</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-semibold select-none">
              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-black/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableRoadbook}
                  onChange={(e) => handleToggle('enableRoadbook', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-snug">📄 Feuille de route (Roadbook)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-black/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.activerRecolteMedias}
                  onChange={(e) => handleToggle('activerRecolteMedias', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-snug">📸 Boîte Photos (QR Code)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-black/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableVideoDrop}
                  onChange={(e) => handleToggle('enableVideoDrop', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-snug">📹 Dépôt de vidéos</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-black/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableStageLayout}
                  onChange={(e) => handleToggle('enableStageLayout', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-snug">📐 Plan de scène</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-black/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableRevisionProgram}
                  onChange={(e) => handleToggle('enableRevisionProgram', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-snug">🎵 Programme / Séquenceur</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-black/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableCarpool}
                  onChange={(e) => handleToggle('enableCarpool', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-snug">🚗 Covoiturage actif</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-black/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includesPercussion}
                  onChange={(e) => handleToggle('includesPercussion', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-snug">🥁 Section Percussion</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-black/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includesDance}
                  onChange={(e) => handleToggle('includesDance', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-snug">💃 Section Danse</span>
              </label>
            </div>
          </div>

          {/* Section 2 : Inscriptions & Délais */}
          <div className="pb-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-cordel-wood mb-2 border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center gap-1.5">
              <span>👥</span>
              <span>Inscriptions & Délais</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch select-none">
              <label className="flex items-start gap-2.5 p-3 rounded bg-cordel-bg-light/50 border border-cordel-master-dark/20 cursor-pointer min-h-[90px]">
                <input
                  type="checkbox"
                  checked={config.requiresValidation}
                  onChange={(e) => handleToggle('requiresValidation', e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-encre-noire">
                    🔒 Validation obligatoire par un administrateur
                  </span>
                  <span className="text-[9.5px] text-neutral-500 font-medium leading-relaxed mt-0.5">
                    Les inscriptions des membres sont placées « En attente » tant qu'un admin ne les a pas confirmées.
                  </span>
                </div>
              </label>

              <div className="flex flex-col justify-between gap-1.5 p-3 rounded bg-cordel-bg-light/50 border border-cordel-master-dark/20 min-h-[90px]">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-encre-noire flex items-center gap-1">
                    <span>⏳</span>
                    <span>Délai limite d'inscription (avant l'événement)</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ex: 48 (clôture 48h avant)"
                      value={config.defaultDeadlineHours ?? ''}
                      onChange={(e) => handleDeadlineChange(e.target.value)}
                      disabled={saving}
                      className="theme-input text-xs font-bold py-1.5 px-2 bg-white w-36 border border-cordel-master-dark/30 rounded"
                    />
                    <span className="text-[10px] text-stone-600 font-bold">heures avant</span>
                  </div>
                </div>
                <span className="text-[9px] text-neutral-500 leading-tight">
                  Laissez vide ou 0 pour ne pas imposer de date limite automatique lors de la création.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3 : Lien Cloud par défaut (Optionnel) */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-cordel-wood mb-2 border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center gap-1.5">
              <span>☁️</span>
              <span>Lien Cloud & Dépôt par défaut (Optionnel)</span>
            </h4>
            <div className="flex flex-col gap-1">
              <input
                type="url"
                placeholder="https://framaspace.org/... ou Google Drive spécifique à ce type"
                value={config.defaultDropUrl || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={saving}
                className="theme-input text-xs font-semibold py-1.5 px-2 bg-white w-full"
              />
              <span className="text-[9px] text-neutral-500">
                Pré-remplit automatiquement le lien de téléversement (photos/vidéos) lors de la création d'un événement de type « {type} ».
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
