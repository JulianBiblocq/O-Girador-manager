import React, { useState, useMemo } from 'react';
import { useCollectiveKits } from '../../hooks/useCollectiveKits';

const TYPE_ICONS = { maquillage: '💄', secours: '🩹', outils_live: '🔧', autre: '🧰' };

/**
 * Sélecteur modulaire des malles et caisses collectives régie pour un événement.
 * Remplace les interrupteurs figés par un sélecteur dynamique branché sur les malles du pôle Logistique.
 */
export default function EventLogisticsKitsSelector({
  formData = {},
  setFormData,
  groupId,
  disabled = false
}) {
  const { kits, loading } = useCollectiveKits(groupId);
  const [newSpecificMalle, setNewSpecificMalle] = useState('');

  // Initialisation et rétro-compatibilité avec les anciens drapeaux logistiqueDepart
  const activeMalles = useMemo(() => {
    if (Array.isArray(formData.logistiqueMalles)) {
      return formData.logistiqueMalles;
    }
    const legacy = [];
    if (formData.logistiqueDepart?.maquillageRequis) legacy.push('Mallette Maquillage');
    if (formData.logistiqueDepart?.trousseSecoursBouchons) legacy.push('Trousse de secours & Bouchons');
    if (formData.logistiqueDepart?.reserveBaguettes) legacy.push('Réserve de mailloches & baguettes');
    if (Array.isArray(formData.mallesSpecifiques)) legacy.push(...formData.mallesSpecifiques);
    return legacy;
  }, [formData.logistiqueMalles, formData.logistiqueDepart, formData.mallesSpecifiques]);

  const specificMalles = useMemo(() => {
    if (Array.isArray(formData.mallesSpecifiques)) {
      return formData.mallesSpecifiques;
    }
    return [];
  }, [formData.mallesSpecifiques]);

  const updateSelection = (newActiveList, newSpecificList) => {
    const isMakeup = newActiveList.some(m => m.toLowerCase().includes('maquillage'));
    const isAid = newActiveList.some(m => m.toLowerCase().includes('secours') || m.toLowerCase().includes('pharmacie') || m.toLowerCase().includes('bouchon'));
    const isSticks = newActiveList.some(m => m.toLowerCase().includes('baguette') || m.toLowerCase().includes('mailloche'));

    setFormData(prev => ({
      ...prev,
      logistiqueMalles: newActiveList,
      mallesSpecifiques: newSpecificList,
      logistiqueDepart: {
        ...(prev.logistiqueDepart || {}),
        maquillageRequis: isMakeup,
        trousseSecoursBouchons: isAid,
        reserveBaguettes: isSticks
      }
    }));
  };

  const toggleMalle = (malleName) => {
    if (disabled) return;
    const exists = activeMalles.includes(malleName);
    const updated = exists ? activeMalles.filter(m => m !== malleName) : [...activeMalles, malleName];
    updateSelection(updated, specificMalles);
  };

  const handleAddSpecificMalle = (e) => {
    if (e) e.preventDefault();
    const trimmed = newSpecificMalle.trim();
    if (!trimmed || activeMalles.includes(trimmed)) return;
    const updatedSpecific = [...specificMalles, trimmed];
    const updatedActive = [...activeMalles, trimmed];
    updateSelection(updatedActive, updatedSpecific);
    setNewSpecificMalle('');
  };

  const handleRemoveSpecificMalle = (malleToRemove) => {
    if (disabled) return;
    const updatedSpecific = specificMalles.filter(m => m !== malleToRemove);
    const updatedActive = activeMalles.filter(m => m !== malleToRemove);
    updateSelection(updatedActive, updatedSpecific);
  };

  return (
    <div className="p-3 bg-white/80 dark:bg-stone-800/80 rounded border border-encre-noire/15 flex flex-col gap-2.5 text-xs text-left">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <span>🧰</span>
          <span>Malles Régie &amp; Checklist Logistique Sortie</span>
        </span>
        <span className="text-[9px] text-neutral-500 font-semibold">
          {activeMalles.length} sélectionnée{activeMalles.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste des Malles du pôle Logistique */}
      {loading ? (
        <span className="text-[10px] italic text-neutral-500">Chargement des malles...</span>
      ) : kits.length === 0 ? (
        <p className="text-[10px] italic text-neutral-500">
          Aucune malle collective régie configurée dans le pôle Logistique.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {kits.map((kit) => {
            const isChecked = activeMalles.includes(kit.nom) || activeMalles.includes(kit.id);
            const icon = TYPE_ICONS[kit.type] || '🧰';
            return (
              <label
                key={kit.id}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-950 dark:text-amber-200 font-bold shadow-xs'
                    : 'bg-white/60 dark:bg-stone-900/40 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleMalle(kit.nom)}
                  disabled={disabled}
                  className="rounded text-cordel-wood accent-cordel-wood cursor-pointer"
                />
                <span className="text-base shrink-0">{icon}</span>
                <span className="truncate text-xs">{kit.nom}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Malles / Consignes ponctuelles saisies librement */}
      {specificMalles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-dashed border-encre-noire/10">
          {specificMalles.map((spec) => (
            <span
              key={spec}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-stone-100 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-[10px] font-bold text-stone-800 dark:text-stone-200"
            >
              <span>🧰</span>
              <span>{spec}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveSpecificMalle(spec)}
                  className="text-red-600 hover:text-red-800 font-bold ml-1 cursor-pointer"
                  title="Retirer cette consigne"
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Ajout d'une consigne / malle ponctuelle libre */}
      <div className="pt-2 border-t border-dashed border-encre-noire/15 flex gap-2 items-center">
        <input
          type="text"
          placeholder="+ Ajouter une malle / consigne ponctuelle (ex: Banderole troupe, Sac flyers...)"
          value={newSpecificMalle}
          onChange={(e) => setNewSpecificMalle(e.target.value)}
          disabled={disabled}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecificMalle(); } }}
          className="theme-input text-xs py-1 px-2 flex-1 rounded bg-white dark:bg-stone-900"
        />
        <button
          type="button"
          onClick={handleAddSpecificMalle}
          disabled={disabled || !newSpecificMalle.trim()}
          className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded bg-cordel-wood text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shrink-0"
        >
          ＋ Ajouter
        </button>
      </div>
    </div>
  );
}
