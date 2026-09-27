import React from 'react';

/**
 * Grille de correspondance associant un lieu par défaut à chaque type d'événement.
 */
export default function DefaultLocationsByEventTypeGrid({ defaultLocations = {}, lieuxImportants = [], onChange }) {
  const EVENT_TYPES = [
    { key: 'repetition', label: '🥁 Répétitions' },
    { key: 'prestation', label: '🎭 Prestations' },
    { key: 'stage', label: '🎓 Stages' },
    { key: 'reunion', label: '🤝 Réunions & AG' }
  ];

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-2">
      <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
        🎯 Lieux par Défaut selon le Type d'Événement
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
        {EVENT_TYPES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border border-stone-200">
            <span className="font-bold text-stone-700">{label}</span>
            <select
              value={defaultLocations[key] || ''}
              onChange={(e) => {
                const updated = { ...defaultLocations, [key]: e.target.value };
                onChange(updated);
              }}
              className="theme-input text-[10px] font-bold py-0.5 bg-stone-50 max-w-[160px] truncate"
            >
              <option value="">🚫 Manuel</option>
              {lieuxImportants.map(l => (
                <option key={l.id} value={l.id}>{l.nom}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
