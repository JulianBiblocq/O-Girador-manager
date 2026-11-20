// Panneau de contrôles réutilisable pour l'impression d'une Toada ou du Carnet de chants (< 135 lignes).
import React, { useState } from 'react';
import { useTranslation } from '../../LanguageContext';
import { BUILTIN_TOADA_PRINT_PRESETS } from '../../../utils/toadaPrintPrefsUtils';
import ToadaPrintMarginsControl from './ToadaPrintMarginsControl';
import SongbookExtraControls from './SongbookExtraControls';

export default function ToadaPrintControlsPanel({ prefs, songbookExtra = null }) {
  const { t } = useTranslation();
  const [addingPreset, setAddingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const {
    format, sections, lyricsColumnsMode, bwMode, margins, customPresets,
    activeBuiltinPreset, isDefaultConfig, isSingleLanguageActive,
    setFormat, setBwMode, setLyricsColumnsMode, updateMargins, toggleSection,
    applyBuiltinPreset, applyCustomPreset, saveAsDefault, saveCustomPreset, deleteCustomPreset
  } = prefs;

  const sectionItems = [
    { key: 'original', label: t('toadaPrint.secOriginal') },
    { key: 'phonetic', label: t('toadaPrint.secPhonetic') },
    { key: 'translation', label: t('toadaPrint.secTranslation') },
    { key: 'lexicon', label: t('toadaPrint.secLexicon') },
    { key: 'anecdote', label: t('toadaPrint.secAnecdote') }
  ];
  const colModes = [
    { id: 'auto', icon: '✨', label: t('toadaPrint.colAuto') },
    { id: 'single-centered', icon: '📄', label: t('toadaPrint.colSingleCentered') },
    { id: 'two-columns', icon: '📖', label: t('toadaPrint.colTwoColumns') }
  ];
  const formats = [
    { id: 'A5', icon: '📄', label: t('toadaPrint.formatA5') },
    { id: 'A4', icon: '📑', label: t('toadaPrint.formatA4') },
    { id: 'A3', icon: '📜', label: t('toadaPrint.formatA3') }
  ];

  const handleConfirmPreset = async () => {
    const ok = await saveCustomPreset(presetName);
    if (ok) { setPresetName(''); setAddingPreset(false); }
  };

  return (
    <div className="flex flex-col gap-4 text-left text-encre-noire dark:text-stone-200">
      {/* 1. Presets rapides + presets perso + bouton Par défaut */}
      <div className="flex flex-col gap-2">
        <span className="font-black uppercase tracking-wider text-xs">{t('toadaPrint.presetsLabel')}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {BUILTIN_TOADA_PRINT_PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => applyBuiltinPreset(p.id)} className={`px-2.5 py-1 rounded border text-xs font-black cursor-pointer transition-colors ${activeBuiltinPreset === p.id ? 'bg-cordel-wood text-white border-encre-noire' : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-neutral-100 dark:bg-stone-900 dark:text-stone-200'}`}>
              {p.icon} {t(p.labelKey)}
            </button>
          ))}
          {customPresets.map((cp) => (
            <span key={cp.id} className="inline-flex items-center rounded border border-encre-noire/40 bg-amber-50 text-amber-950 text-xs font-bold overflow-hidden">
              <button type="button" onClick={() => applyCustomPreset(cp)} className="px-2 py-1 hover:bg-amber-100 cursor-pointer">🔖 {cp.name}</button>
              <button type="button" onClick={() => deleteCustomPreset(cp.id)} title={t('toadaPrint.deletePresetTitle')} className="px-1.5 py-1 text-red-800 hover:bg-red-100 font-black cursor-pointer">×</button>
            </span>
          ))}
          {customPresets.length < 2 && !addingPreset && (
            <button type="button" onClick={() => setAddingPreset(true)} className="px-2 py-1 rounded border border-dashed border-encre-noire/40 text-[11px] font-bold hover:bg-white cursor-pointer">
              + {t('toadaPrint.btnAddCustomPreset')}
            </button>
          )}
        </div>

        {addingPreset && (
          <div className="flex items-center gap-1.5">
            <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder={t('toadaPrint.customPresetPlaceholder')} maxLength={24} className="theme-input text-xs py-1 px-2 flex-1" />
            <button type="button" onClick={handleConfirmPreset} className="px-2.5 py-1 rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white text-xs font-black cursor-pointer">{t('toadaPrint.btnConfirmPreset')}</button>
            <button type="button" onClick={() => { setAddingPreset(false); setPresetName(''); }} className="px-2 py-1 rounded border border-encre-noire/30 text-xs font-bold cursor-pointer">✕</button>
          </div>
        )}

        <button type="button" onClick={saveAsDefault} className={`self-start px-2.5 py-1 rounded border text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors ${isDefaultConfig ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire' : 'bg-white/80 text-encre-noire border-encre-noire/30 hover:bg-white dark:bg-stone-900 dark:text-stone-200'}`}>
          {isDefaultConfig ? `✓ ${t('toadaPrint.btnSavedDefault')}` : `⭐ ${t('toadaPrint.btnSaveDefault')}`}
        </button>
      </div>

      {/* 2. Cases à cocher des 5 sections */}
      <div className="flex flex-col gap-1.5">
        <span className="font-black uppercase tracking-wider text-xs">{t('toadaPrint.sectionsLabel')}</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
          {sectionItems.map((sec) => (
            <label key={sec.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={Boolean(sections[sec.key])} onChange={() => toggleSection(sec.key)} className="accent-[var(--color-cordel-vert,#2d6a4f)] w-4 h-4 cursor-pointer" />
              <span>{sec.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Sélecteur de disposition dès que original XOR phonetic est actif */}
      {isSingleLanguageActive && (
        <div className="flex flex-col gap-1.5">
          <span className="font-black uppercase tracking-wider text-xs">{t('toadaPrint.columnsModeLabel')}</span>
          <div className="grid grid-cols-3 gap-1.5">
            {colModes.map((m) => (
              <button key={m.id} type="button" onClick={() => setLyricsColumnsMode(m.id)} className={`py-1.5 px-2 rounded border text-[10.5px] font-black uppercase cursor-pointer transition-colors ${lyricsColumnsMode === m.id ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire' : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-neutral-100 dark:bg-stone-900 dark:text-stone-200'}`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Format de papier & Mode Noir & Blanc */}
      <div className="flex flex-col gap-2">
        <span className="font-black uppercase tracking-wider text-xs">{t('toadaPrint.formatLabel')}</span>
        <div className="grid grid-cols-3 gap-2">
          {formats.map((f) => (
            <button key={f.id} type="button" onClick={() => setFormat(f.id)} className={`py-1.5 px-2 border-2 rounded font-black uppercase text-xs cursor-pointer transition-colors ${format === f.id ? 'bg-[var(--color-cordel-vert,#2d6a4f)] border-[var(--color-cordel-vert,#2d6a4f)] text-white' : 'bg-white border-encre-noire/40 text-encre-noire hover:bg-neutral-100 dark:bg-stone-900 dark:text-stone-200'}`}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-black uppercase tracking-wider pt-1">
          <input type="checkbox" checked={Boolean(bwMode)} onChange={(e) => setBwMode(e.target.checked)} className="accent-encre-noire w-4 h-4 cursor-pointer" />
          <span>{t('toadaPrint.bwModeLabel')}</span>
        </label>
      </div>

      {/* 5. Marges d'impression & Marge de reliure (Fiche seule & Carnet) */}
      <ToadaPrintMarginsControl margins={margins} onUpdateMargins={updateMargins} />

      {/* 6. Options additionnelles du Carnet de chants global */}
      {songbookExtra && <SongbookExtraControls {...songbookExtra} />}
    </div>
  );
}
