import React, { useState } from 'react';
import CordelButton from '../CordelButton';

/**
 * Éditeur et visualiseur des Signes du Mestre et conventions chronologiques
 * (sinaisDoMestre) pour un morceau du répertoire.
 *
 * Permet d'aspirer automatiquement les signes depuis un Preset du Séquenceur,
 * tout en conservant la pleine liberté pour le Mestre d'ajouter, modifier ou
 * retirer des conventions par mesure.
 *
 * @param {Array} sinais - Liste des signes et conventions chronologiques
 * @param {Function} onChange - Callback de mise à jour du tableau
 * @param {boolean} disabled - Désactivation du formulaire en cours d'envoi
 */
export default function RepertoireSinaisDoMestreEditor({ sinais = [], onChange, disabled = false }) {
  const [mesureInput, setMesureInput] = useState('');
  const [nomInput, setNomInput] = useState('');
  const [inputError, setInputError] = useState(null);

  // Tri chronologique des signes par numéro de mesure
  const sortedSinais = [...(Array.isArray(sinais) ? sinais : [])].sort((a, b) => {
    const ma = typeof a === 'object' && a !== null ? (a.mesure ?? a.bar ?? a.barIndex ?? 0) : 0;
    const mb = typeof b === 'object' && b !== null ? (b.mesure ?? b.bar ?? b.barIndex ?? 0) : 0;
    return Number(ma) - Number(mb);
  });

  // Ajout manuel d'un signe
  const handleAdd = (e) => {
    if (e) e.preventDefault();
    if (!nomInput.trim()) {
      setInputError("Veuillez saisir le nom ou l'action du signe (ex: Virada 1, Appel départ...).");
      return;
    }

    const mesureNum = parseInt(mesureInput, 10);
    const validMesure = isNaN(mesureNum) || mesureNum < 1 ? 1 : mesureNum;

    const newSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mesure: validMesure,
      bar: validMesure,
      nom: nomInput.trim(),
      name: nomInput.trim()
    };

    onChange([...sinais, newSignal]);
    setNomInput('');
    setMesureInput('');
    setInputError(null);
  };

  // Suppression d'un signe
  const handleRemove = (indexToRemove) => {
    const targetItem = sortedSinais[indexToRemove];
    const updated = (sinais || []).filter((item) => {
      if (item.id && targetItem.id) {
        return item.id !== targetItem.id;
      }
      return item !== targetItem;
    });
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-[6px_10px_7px_9px] border border-dashed border-cordel-wood/30 bg-[#fdfaf2] text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🖐️</span>
          <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
            Signes &amp; Conventions par Mesure ({sortedSinais.length})
          </label>
        </div>
        {sortedSinais.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={disabled}
            className="text-[9px] text-stone-500 hover:text-stone-700 font-bold uppercase underline cursor-pointer"
          >
            Tout effacer
          </button>
        )}
      </div>

      <p className="text-[10px] text-encre-noire/70 font-semibold italic leading-tight">
        Conventions chronologiques du Mestre pour ce morceau (ex: départ, appels de virada, break, coupure).
        Aspirées automatiquement depuis le Séquenceur ou saisies manuellement.
      </p>

      {/* Liste des badges chronologiques */}
      {sortedSinais.length === 0 ? (
        <div className="py-2.5 px-3 text-center text-[10px] text-encre-noire/50 italic border border-dashed border-encre-noire/15 rounded bg-white/60">
          Aucun signe chronologique. Sélectionnez un Preset du Séquenceur ci-dessus ou ajoutez-en manuellement ci-dessous.
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white/70 rounded border border-encre-noire/15 max-h-48 overflow-y-auto">
          {sortedSinais.map((sig, idx) => {
            const m = typeof sig === 'object' && sig !== null ? (sig.mesure ?? sig.bar ?? sig.barIndex ?? (idx + 1)) : (idx + 1);
            const nom = typeof sig === 'object' && sig !== null ? (sig.nom || sig.name || sig.signe || sig.label || 'Signe') : String(sig);

            return (
              <span
                key={sig.id || idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9.5px] font-black rounded-[4px_6px_3px_5px] bg-[#fbf7ee] text-encre-noire border border-encre-noire/25 shadow-2xs group"
              >
                <span className="text-cordel-wood font-extrabold">Mesure {m} :</span>
                <span className="text-encre-noire">{nom}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  disabled={disabled}
                  className="text-stone-400 hover:text-red-700 font-bold ml-0.5 cursor-pointer leading-none text-xs"
                  title="Supprimer ce signe"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Formulaire d'ajout manuel rapide */}
      <div className="flex flex-col gap-1 pt-1.5 border-t border-dashed border-cordel-master-dark/15 mt-0.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark/70">
          Ajouter manuellement une convention :
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            placeholder="Mesure (ex: 1)"
            value={mesureInput}
            onChange={(e) => {
              setMesureInput(e.target.value);
              setInputError(null);
            }}
            disabled={disabled}
            className="w-24 text-[10px] font-bold p-1.5 bg-cordel-bg-light border border-encre-noire/30 rounded"
          />
          <input
            type="text"
            placeholder="Action ou Signe (ex: Appel départ, Virada 1, Break...)"
            value={nomInput}
            onChange={(e) => {
              setNomInput(e.target.value);
              setInputError(null);
            }}
            disabled={disabled}
            className="flex-1 text-[10px] font-semibold p-1.5 bg-cordel-bg-light border border-encre-noire/30 rounded"
          />
          <CordelButton
            type="button"
            variant="default"
            useExtremeBorder={false}
            onClick={handleAdd}
            disabled={disabled || !nomInput.trim()}
            className="py-1 px-3 text-[10px] uppercase font-black tracking-wider whitespace-nowrap bg-stone-100 hover:bg-stone-200 border border-encre-noire/30"
          >
            + Ajouter
          </CordelButton>
        </div>
        {inputError && (
          <span className="text-[9px] text-red-700 font-bold mt-0.5">
            ⚠️ {inputError}
          </span>
        )}
      </div>
    </div>
  );
}
