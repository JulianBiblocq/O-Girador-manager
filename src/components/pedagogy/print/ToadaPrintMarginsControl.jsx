// Sélecteur compact des marges de page et de la marge de reliure / perforation (< 120 lignes).
import React from 'react';
import { useTranslation } from '../../LanguageContext';
import { normalizePrintMargins } from '../../../utils/toadaPrintMarginsUtils';

export default function ToadaPrintMarginsControl({ margins, onUpdateMargins }) {
  const { t } = useTranslation();
  const norm = normalizePrintMargins(margins);

  const marginPresets = [
    { id: 'narrow', label: t('toadaPrint.marginNarrow') },
    { id: 'normal', label: t('toadaPrint.marginNormal') },
    { id: 'wide', label: t('toadaPrint.marginWide') },
    { id: 'custom', label: t('toadaPrint.marginCustom') }
  ];
  const customFields = [
    { key: 'top', label: t('toadaPrint.marginTop') },
    { key: 'bottom', label: t('toadaPrint.marginBottom') },
    { key: 'left', label: t('toadaPrint.marginLeft') },
    { key: 'right', label: t('toadaPrint.marginRight') }
  ];
  const gutterOptions = [
    { value: 0, label: t('toadaPrint.bindingNone') },
    { value: 8, label: t('toadaPrint.bindingBinder') },
    { value: 15, label: t('toadaPrint.bindingBooklet') }
  ];
  const bindingSides = [
    { id: 'left', icon: '📄', label: t('toadaPrint.bindingSideLeft') },
    { id: 'alternating', icon: '📖', label: t('toadaPrint.bindingSideAlternating') }
  ];

  const btnClass = (isActive) =>
    `py-1.5 px-2 rounded border text-[10.5px] font-black cursor-pointer transition-colors ${
      isActive
        ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire'
        : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-neutral-100 dark:bg-stone-900 dark:text-stone-200'
    }`;

  const handleCustomSideChange = (sideKey, rawValue) => {
    const nextVal = rawValue === '' ? 0 : Number(rawValue);
    onUpdateMargins({ preset: 'custom', [sideKey]: nextVal });
  };

  return (
    <div className="flex flex-col gap-2.5 pt-2 border-t border-dashed border-encre-noire/15">
      {/* 1. Marges de la feuille (presets 1-clic + mode Sur-mesure) */}
      <div className="flex flex-col gap-1.5">
        <span className="font-black uppercase tracking-wider text-xs">{t('toadaPrint.marginsLabel')}</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {marginPresets.map((mp) => (
            <button key={mp.id} type="button" onClick={() => onUpdateMargins({ preset: mp.id })} className={btnClass(norm.preset === mp.id)}>
              {mp.label}
            </button>
          ))}
        </div>

        {norm.preset === 'custom' && (
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {customFields.map((field) => (
              <label key={field.key} className="flex flex-col gap-0.5 text-[10px] font-bold">
                <span className="opacity-80 truncate">{field.label} (mm)</span>
                <input
                  type="number" min={0} max={35} step={1} value={norm[field.key]}
                  onChange={(e) => handleCustomSideChange(field.key, e.target.value)}
                  className="theme-input text-xs py-1 px-1.5 text-center font-mono font-bold w-full"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 2. Marge de reliure / perforation (gouttière) */}
      <div className="flex flex-col gap-1.5">
        <span className="font-black uppercase tracking-wider text-xs">{t('toadaPrint.bindingLabel')}</span>
        <div className="grid grid-cols-3 gap-1.5">
          {gutterOptions.map((opt) => (
            <button key={opt.value} type="button" onClick={() => onUpdateMargins({ gutterMm: opt.value })} className={btnClass(norm.gutterMm === opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>

        {norm.gutterMm > 0 && (
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {bindingSides.map((side) => (
              <button key={side.id} type="button" onClick={() => onUpdateMargins({ bindingSide: side.id })} className={btnClass(norm.bindingSide === side.id)}>
                {side.icon} {side.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10.5px] italic opacity-75 leading-snug">{t('toadaPrint.marginsBrowserHint')}</p>
    </div>
  );
}
