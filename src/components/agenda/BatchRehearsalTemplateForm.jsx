import React from 'react';

/**
 * Sous-composant : Paramétrage du Modèle de répétition (Gabarit réutilisable)
 * Conforme à la règle anti-monolithe (< 200 lignes) et à la charte Cordel.
 */
export default function BatchRehearsalTemplateForm({
  template,
  setTemplate,
  lieuxImportants = [],
  t
}) {
  const handleLieuSelectChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setTemplate(prev => ({
        ...prev,
        lieuId: null
      }));
      return;
    }

    const found = lieuxImportants.find(l => l.id === selectedId);
    if (found) {
      const fullLocationText = found.nom && found.adresse
        ? `${found.nom} - ${found.adresse}`
        : (found.adresse || found.nom);

      setTemplate(prev => ({
        ...prev,
        lieu: fullLocationText,
        lieuId: found.id,
        latitude: found.latitude || null,
        longitude: found.longitude || null
      }));
    }
  };

  return (
    <div className="bg-[#fdfaf2] p-4 rounded-[6px_9px_7px_8px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-3.5 text-left text-encre-noire">
      <div className="flex items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <span className="text-base">📋</span>
        <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
          1. Gabarit du Modèle
        </h4>
      </div>

      {/* Titre */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-wider text-encre-noire/80 mb-1">
          Titre des répétitions
        </label>
        <input
          type="text"
          value={template.titre}
          onChange={(e) => setTemplate(prev => ({ ...prev, titre: e.target.value }))}
          placeholder="Répétition"
          className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-encre-noire rounded shadow-2xs focus:outline-hidden focus:border-cordel-wood"
        />
      </div>

      {/* Horaires (Début & Fin) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-encre-noire/80 mb-1">
            Heure de début
          </label>
          <input
            type="time"
            value={template.heureDebut}
            onChange={(e) => setTemplate(prev => ({ ...prev, heureDebut: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-encre-noire rounded shadow-2xs focus:outline-hidden focus:border-cordel-wood"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-encre-noire/80 mb-1">
            Heure de fin
          </label>
          <input
            type="time"
            value={template.heureFin}
            onChange={(e) => setTemplate(prev => ({ ...prev, heureFin: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-encre-noire rounded shadow-2xs focus:outline-hidden focus:border-cordel-wood"
          />
        </div>
      </div>

      {/* Lieu habituel & Saisie libre */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-black uppercase tracking-wider text-encre-noire/80">
            Lieu de la répétition
          </label>
          {lieuxImportants.length > 0 && (
            <span className="text-[10px] text-cordel-master-dark/60 font-semibold">
              Préréglé selon l'association
            </span>
          )}
        </div>

        {lieuxImportants.length > 0 && (
          <select
            value={template.lieuId || ''}
            onChange={handleLieuSelectChange}
            className="w-full mb-2 px-3 py-1.5 text-xs font-bold bg-white border-2 border-encre-noire rounded shadow-2xs focus:outline-hidden focus:border-cordel-wood cursor-pointer"
          >
            <option value="">-- Choisir un lieu répertorié ou personnalisé --</option>
            {lieuxImportants.map((lieu) => (
              <option key={lieu.id} value={lieu.id}>
                📍 {lieu.nom} {lieu.adresse ? `(${lieu.adresse})` : ''}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          value={template.lieu}
          onChange={(e) => setTemplate(prev => ({ ...prev, lieu: e.target.value, lieuId: null }))}
          placeholder="Ex: Salle municipale, 10 rue des Arts"
          className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-encre-noire rounded shadow-2xs focus:outline-hidden focus:border-cordel-wood"
        />
      </div>

      {/* Interrupteurs & Disciplines incluses */}
      <div className="pt-2 border-t border-dashed border-cordel-master-dark/20 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <label className="flex items-center gap-2 p-2 bg-white border border-encre-noire/30 rounded cursor-pointer hover:bg-amber-50/50 transition-colors shadow-2xs">
          <input
            type="checkbox"
            checked={template.includesPercussion}
            onChange={(e) => setTemplate(prev => ({ ...prev, includesPercussion: e.target.checked }))}
            className="accent-cordel-wood w-4 h-4 cursor-pointer"
          />
          <span className="text-[11px] font-bold">🥁 Percussion</span>
        </label>

        <label className="flex items-center gap-2 p-2 bg-white border border-encre-noire/30 rounded cursor-pointer hover:bg-amber-50/50 transition-colors shadow-2xs">
          <input
            type="checkbox"
            checked={template.includesDance}
            onChange={(e) => setTemplate(prev => ({ ...prev, includesDance: e.target.checked }))}
            className="accent-cordel-wood w-4 h-4 cursor-pointer"
          />
          <span className="text-[11px] font-bold">💃 Danse</span>
        </label>

        <label className="flex items-center gap-2 p-2 bg-white border border-encre-noire/30 rounded cursor-pointer hover:bg-amber-50/50 transition-colors shadow-2xs">
          <input
            type="checkbox"
            checked={template.isPublic}
            onChange={(e) => setTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="accent-cordel-wood w-4 h-4 cursor-pointer"
          />
          <span className="text-[11px] font-bold" title="Visible par le grand public sur la vitrine">
            🌐 Public
          </span>
        </label>

        <label className="flex items-center gap-2 p-2 bg-white border border-encre-noire/30 rounded cursor-pointer hover:bg-amber-50/50 transition-colors shadow-2xs">
          <input
            type="checkbox"
            checked={template.enableCarpool}
            onChange={(e) => setTemplate(prev => ({ ...prev, enableCarpool: e.target.checked }))}
            className="accent-cordel-wood w-4 h-4 cursor-pointer"
          />
          <span className="text-[11px] font-bold">🚗 Covoiturage</span>
        </label>
      </div>
    </div>
  );
}
