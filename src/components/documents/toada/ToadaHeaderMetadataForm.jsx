import React from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Sous-formulaire des métadonnées musicales d'en-tête pour une Toada :
 * Signature rythmique, Tempo par défaut (BPM) et Tonalité musicale.
 */
export default function ToadaHeaderMetadataForm({
  signature = '4/4',
  onChangeSignature,
  bpmDefaut = '',
  onChangeBpm,
  tonaliteDefaut = '',
  onChangeTonalite,
  disabled = false
}) {
  const { t } = useTranslation();

  const SIGNATURES = ['4/4', '2/4', '3/4', '6/8', '12/8'];
  const TONALITES = ['', 'C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G', 'Gm', 'A', 'Am', 'B', 'Bm', 'Bb', 'Eb', 'Ab'];

  return (
    <div className="p-3 bg-cordel-bg-light/60 border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col gap-2">
      <span className="text-[9.5px] uppercase font-black tracking-wider text-cordel-wood flex items-center gap-1.5">
        <span>🎼</span>
        <span>{t('toada.headerMetadataTitle') || "En-tête Musical de la Toada"}</span>
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Signature Rythmique */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark">
            {t('toada.signature') || "Signature"}
          </label>
          <select
            value={signature || '4/4'}
            onChange={(e) => onChangeSignature && onChangeSignature(e.target.value)}
            disabled={disabled}
            className="theme-input text-xs font-bold py-1 bg-white cursor-pointer"
          >
            {SIGNATURES.map((sig) => (
              <option key={sig} value={sig}>{sig}</option>
            ))}
          </select>
        </div>

        {/* Tempo par défaut (BPM) */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark">
            {t('toada.bpm') || "Tempo (BPM)"}
          </label>
          <input
            type="number"
            min="40"
            max="240"
            value={bpmDefaut || ''}
            onChange={(e) => onChangeBpm && onChangeBpm(e.target.value ? parseInt(e.target.value, 10) : '')}
            disabled={disabled}
            placeholder="Ex: 110"
            className="theme-input text-xs font-bold py-1 bg-white"
          />
        </div>

        {/* Tonalité musicale */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark">
            {t('toada.tonalite') || "Tonalité"}
          </label>
          <input
            type="text"
            list="tonalites-list"
            value={tonaliteDefaut || ''}
            onChange={(e) => onChangeTonalite && onChangeTonalite(e.target.value.toUpperCase())}
            disabled={disabled}
            placeholder="Ex: Dm ou G"
            className="theme-input text-xs font-bold py-1 bg-white uppercase"
          />
          <datalist id="tonalites-list">
            {TONALITES.map((ton) => (
              <option key={ton} value={ton} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
