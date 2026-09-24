import React, { useState, useMemo } from 'react';
import useMestreSignals from '../../hooks/useMestreSignals';
import CordelButton from '../CordelButton';

/**
 * Interface d'édition des Signes du Mestre pour une fiche du répertoire (< 200 lignes).
 * Permet d'afficher les signaux sélectionnés sous forme de puces Cordel
 * (miniature, nom, mesure, suppression directe [ ✕ ]) et d'ajouter de nouveaux
 * gestes depuis la collection mestre_signals via un sélecteur interactif.
 *
 * @param {Array} sinais - Signaux et conventions chronologiques associés
 * @param {Function} onChange - Callback de mise à jour du tableau des signaux
 * @param {string} groupId - Identifiant de l'association
 * @param {boolean} disabled - Désactivation en cours d'envoi
 */
export default function RepertoireSinaisDoMestreEditor({
  sinais = [],
  onChange,
  groupId = null,
  disabled = false
}) {
  const { signals = [], loading: loadingSignals } = useMestreSignals(groupId);
  const signalsMap = useMemo(() => new Map(signals.map((s) => [s.id, s])), [signals]);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedMesure, setSelectedMesure] = useState('1');
  const [searchFilter, setSearchFilter] = useState('');

  // Mode ajout convention manuelle (texte libre)
  const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);
  const [customNom, setCustomNom] = useState('');
  const [customMesure, setCustomMesure] = useState('1');

  // Tri chronologique des signaux par mesure
  const sortedSinais = useMemo(() => {
    return [...(Array.isArray(sinais) ? sinais : [])].sort((a, b) => {
      const ma = typeof a === 'object' && a !== null ? (a.mesure ?? a.bar ?? a.barIndex ?? 0) : 0;
      const mb = typeof b === 'object' && b !== null ? (b.mesure ?? b.bar ?? b.barIndex ?? 0) : 0;
      return Number(ma) - Number(mb);
    });
  }, [sinais]);

  // Suppression directe d'un signal
  const handleRemove = (targetItem) => {
    if (disabled) return;
    const updated = (sinais || []).filter((item) => {
      if (item === targetItem) return false;
      if (typeof item === 'object' && typeof targetItem === 'object' && item !== null && targetItem !== null) {
        if (item.id && targetItem.id && item.id === targetItem.id) return false;
        if (item.signalId && targetItem.signalId && item.signalId === targetItem.signalId && item.mesure === targetItem.mesure) return false;
      }
      return true;
    });
    onChange(updated);
  };

  // Ajout d'un signal depuis la bibliothèque mestre_signals
  const handleAddSignalFromLibrary = (sig) => {
    if (disabled || !sig) return;
    const m = parseInt(selectedMesure, 10);
    const validMesure = isNaN(m) || m < 1 ? 1 : m;

    const newEntry = {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      signalId: sig.id,
      mesure: validMesure,
      bar: validMesure,
      nom: sig.name || sig.nom || 'Geste',
      name: sig.name || sig.nom || 'Geste',
      imageUrl: sig.imageUrl || null,
      consigne: sig.consigne || sig.action || sig.description || ''
    };

    onChange([...(sinais || []), newEntry]);
    // Préparer la mesure suivante pour enchaîner les ajouts facilement
    setSelectedMesure(String(validMesure + 1));
  };

  // Ajout manuel d'une convention textuelle
  const handleAddCustom = (e) => {
    if (e) e.preventDefault();
    if (!customNom.trim()) return;

    const m = parseInt(customMesure, 10);
    const validMesure = isNaN(m) || m < 1 ? 1 : m;

    const newEntry = {
      id: `sig_custom_${Date.now()}`,
      mesure: validMesure,
      bar: validMesure,
      nom: customNom.trim(),
      name: customNom.trim()
    };

    onChange([...(sinais || []), newEntry]);
    setCustomNom('');
    setCustomMesure(String(validMesure + 1));
    setIsCustomInputOpen(false);
  };

  // Filtrage des signaux du catalogue pour le sélecteur
  const filteredCatalogSignals = useMemo(() => {
    if (!searchFilter.trim()) return signals;
    const q = searchFilter.trim().toLowerCase();
    return signals.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.consigne && s.consigne.toLowerCase().includes(q))
    );
  }, [signals, searchFilter]);

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-[6px_10px_7px_9px] border border-dashed border-cordel-wood/30 bg-[#fdfaf2] text-left">
      {/* En-tête : titre & boutons d'action rapide */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">✋</span>
          <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
            Signes du Mestre associés ({sortedSinais.length})
          </label>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsPickerOpen(!isPickerOpen);
              if (isCustomInputOpen) setIsCustomInputOpen(false);
            }}
            disabled={disabled}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-black uppercase rounded-[4px_6px_3px_5px] border transition-all cursor-pointer shadow-2xs select-none ${
              isPickerOpen
                ? 'bg-amber-200 border-amber-500 text-amber-950 font-black'
                : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
            }`}
          >
            <span>{isPickerOpen ? '▲ Fermer sélecteur' : '➕ Ajouter un signe'}</span>
          </button>

          {sortedSinais.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={disabled}
              className="text-[9px] text-stone-500 hover:text-stone-700 font-bold uppercase underline cursor-pointer ml-1 select-none"
            >
              Tout effacer
            </button>
          )}
        </div>
      </div>

      <p className="text-[10px] text-encre-noire/70 font-semibold italic leading-tight">
        Signaux de commandement et conventions par mesure (départ, virada, break, coupure). Suggérés depuis le Séquenceur ou ajoutés à la main.
      </p>

      {/* Liste des puces / badges Cordel des signaux sélectionnés */}
      {sortedSinais.length === 0 ? (
        <div className="py-2.5 px-3 text-center text-[10px] text-encre-noire/50 italic border border-dashed border-encre-noire/15 rounded bg-white/60">
          Aucun signe rattaché pour l'instant. Liez un Preset pour les suggérer automatiquement ou cliquez sur [ ➕ Ajouter un signe ].
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 p-2 bg-white/80 rounded border border-encre-noire/15 max-h-52 overflow-y-auto">
          {sortedSinais.map((sig, idx) => {
            const sid = typeof sig === 'object' && sig !== null ? (sig.signalId || sig.id) : String(sig);
            const match = sid ? signalsMap.get(sid) : null;
            const nom = match?.name || match?.nom || (typeof sig === 'object' ? (sig.nom || sig.name) : sid);
            const imageUrl = match?.imageUrl || (typeof sig === 'object' ? sig.imageUrl : null);
            const m = typeof sig === 'object' && sig !== null ? (sig.mesure ?? sig.bar ?? sig.barIndex) : null;

            return (
              <span
                key={sig.id || `${sid}_${idx}`}
                className="inline-flex items-center gap-1.5 p-1 pr-2 rounded-[4px_6px_3px_5px] bg-[#fbf7ee] text-amber-950 border border-amber-300 shadow-2xs group text-left select-none"
                title={match?.consigne ? `${nom} — ${match.consigne}` : nom}
              >
                {/* Miniature du geste */}
                <div className="w-5 h-5 rounded bg-stone-900 shrink-0 overflow-hidden flex items-center justify-center border border-encre-noire/20">
                  {imageUrl ? (
                    <img src={imageUrl} alt={nom} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px]">✋</span>
                  )}
                </div>

                {/* Mesure & Nom */}
                <div className="flex items-center gap-1">
                  {m && (
                    <span className="text-[9px] font-black text-cordel-wood uppercase">
                      M.{m} :
                    </span>
                  )}
                  <span className="text-[9.5px] font-black text-encre-noire truncate max-w-[120px]">
                    {nom}
                  </span>
                </div>

                {/* Bouton de suppression direct [ ✕ ] */}
                <button
                  type="button"
                  onClick={() => handleRemove(sig)}
                  disabled={disabled}
                  className="w-4 h-4 rounded-full bg-stone-200 hover:bg-red-700 hover:text-white text-stone-600 flex items-center justify-center text-[9px] font-black ml-0.5 cursor-pointer transition-colors"
                  title="Supprimer ce signe"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Sélecteur de signaux depuis la bibliothèque mestre_signals */}
      {isPickerOpen && (
        <div className="flex flex-col gap-2 p-2.5 rounded-[4px_6px_3px_5px] bg-amber-50/90 border border-amber-300 mt-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase text-amber-950 flex items-center gap-1">
              <span>📖</span>
              <span>Bibliothèque des Signes du Mestre ({signals.length})</span>
            </span>

            {/* Réglage de la mesure cible pour le prochain ajout */}
            <div className="flex items-center gap-1.5">
              <label className="text-[9px] font-bold text-amber-900 uppercase">
                Mesure :
              </label>
              <input
                type="number"
                min="1"
                value={selectedMesure}
                onChange={(e) => setSelectedMesure(e.target.value)}
                className="w-14 text-[10px] font-black p-1 bg-white border border-amber-400 rounded text-center"
              />
            </div>
          </div>

          {/* Recherche rapide */}
          <input
            type="text"
            placeholder="Filtrer les gestes (ex: opanijé, luanda, samba...)"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full text-[10px] font-semibold p-1.5 bg-white border border-amber-300 rounded"
          />

          {loadingSignals ? (
            <div className="py-3 text-center text-xs font-bold text-amber-800 animate-pulse">
              Chargement des signaux...
            </div>
          ) : filteredCatalogSignals.length === 0 ? (
            <div className="py-2 text-center text-[10px] text-amber-900/60 italic">
              Aucun signe ne correspond dans la bibliothèque.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white/60 rounded border border-amber-200">
              {filteredCatalogSignals.map((sig) => (
                <button
                  key={sig.id}
                  type="button"
                  onClick={() => handleAddSignalFromLibrary(sig)}
                  className="flex items-center gap-2 p-1.5 rounded bg-white hover:bg-amber-100/70 border border-encre-noire/15 hover:border-amber-400 transition-all text-left cursor-pointer shadow-2xs select-none"
                  title={`Ajouter « ${sig.name} » à la mesure ${selectedMesure}`}
                >
                  <div className="w-7 h-7 rounded bg-stone-900 shrink-0 overflow-hidden flex items-center justify-center border border-encre-noire/20">
                    {sig.imageUrl ? (
                      <img src={sig.imageUrl} alt={sig.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px]">✋</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-black text-encre-noire truncate leading-tight">
                      {sig.name}
                    </span>
                    {sig.consigne && (
                      <span className="text-[8.5px] text-stone-500 truncate leading-none mt-0.5">
                        {sig.consigne}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1 py-0.5 rounded border border-amber-300 shrink-0">
                    + M.{selectedMesure}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Lien pour ajouter une convention textuelle personnalisée */}
          <div className="pt-1 flex items-center justify-between border-t border-dashed border-amber-300/60">
            <button
              type="button"
              onClick={() => setIsCustomInputOpen(!isCustomInputOpen)}
              className="text-[9px] font-bold text-cordel-wood hover:underline cursor-pointer"
            >
              {isCustomInputOpen ? 'Masquer convention libre' : '✏️ Ajouter un appel texte sur mesure (sans geste catalogué)'}
            </button>
          </div>

          {/* Formulaire ajout personnalisé rapide */}
          {isCustomInputOpen && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="1"
                placeholder="Mesure"
                value={customMesure}
                onChange={(e) => setCustomMesure(e.target.value)}
                className="w-16 text-[10px] font-black p-1 bg-white border border-amber-300 rounded text-center"
              />
              <input
                type="text"
                placeholder="Ex: Break solo, Virada 2 temps..."
                value={customNom}
                onChange={(e) => setCustomNom(e.target.value)}
                className="flex-1 text-[10px] font-semibold p-1 bg-white border border-amber-300 rounded"
              />
              <CordelButton
                type="button"
                variant="default"
                useExtremeBorder={false}
                onClick={handleAddCustom}
                disabled={!customNom.trim()}
                className="py-1 px-2 text-[9px] font-black uppercase tracking-wider shrink-0 bg-stone-100"
              >
                Ajouter
              </CordelButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
