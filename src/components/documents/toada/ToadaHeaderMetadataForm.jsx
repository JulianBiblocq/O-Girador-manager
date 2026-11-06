import React from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Sous-formulaire des métadonnées musicales d'en-tête pour une Toada :
 * Signature rythmique, Tempo par défaut (BPM) et TONALITÉ DE LA TROUPE (GAMME)
 * verrouillée en lecture seule lorsqu'elle provient de Cantador / Sequenciador (< 95 lignes).
 */
export default function ToadaHeaderMetadataForm({
  signature = '4/4',
  onChangeSignature,
  bpmDefaut = '',
  onChangeBpm,
  tonaliteDefaut = '',
  onChangeTonalite: _onChangeTonalite,
  tonaliteChanteeOrigine = '',
  transpositionSemitones = undefined,
  cantadorToadaId = '',
  cantadorValidated = false,
  lockedTonaliteDisplay = '',
  disabled = false
}) {
  const { t } = useTranslation();
  const SIGNATURES = ['4/4', '2/4', '3/4', '6/8', '12/8'];

  const hasShift = transpositionSemitones !== undefined && transpositionSemitones !== null && Number(transpositionSemitones) !== 0;
  const stBadge = hasShift ? `${Number(transpositionSemitones) > 0 ? '+' : ''}${Number(transpositionSemitones)} st` : '0 st';
  const shortOrig = tonaliteChanteeOrigine ? (String(tonaliteChanteeOrigine).split(/\s+/)[0] || tonaliteChanteeOrigine) : '';
  const computedDisplay = lockedTonaliteDisplay || (
    tonaliteDefaut
      ? (shortOrig ? `🔒 ${tonaliteDefaut} (prise chantée en ${shortOrig} • ${stBadge})` : `🔒 ${tonaliteDefaut}`)
      : ''
  );
  const isSyncedFromCantador = Boolean(cantadorToadaId || cantadorValidated || tonaliteChanteeOrigine || tonaliteDefaut);

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
            placeholder="Ex: 85"
            className="theme-input text-xs font-bold py-1 bg-white"
          />
        </div>

        {/* TONALITÉ DE LA TROUPE (GAMME) — Verrouillée en lecture seule depuis Cantador / Sequenciador */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark flex items-center justify-between gap-1">
            <span>TONALITÉ DE LA TROUPE (GAMME)</span>
            <span className="text-[8.5px] text-amber-800 font-mono">Lecture seule (Cantador)</span>
          </label>
          <input
            type="text"
            readOnly
            disabled
            value={computedDisplay}
            placeholder="🔒 À définir à l'oreille dans Cantador ou Sequenciador"
            title={
              isSyncedFromCantador
                ? "Tonalité de la troupe synchronisée et verrouillée par Cantador (modifiable uniquement en écoutant dans Cantador ou Sequenciador)"
                : "La tonalité de la troupe se choisit à l'oreille dans Cantador ou Sequenciador"
            }
            className="theme-input text-xs font-bold py-1 bg-stone-100/90 text-cordel-wood border-cordel-wood/40 cursor-not-allowed select-none"
          />
        </div>
      </div>
    </div>
  );
}
