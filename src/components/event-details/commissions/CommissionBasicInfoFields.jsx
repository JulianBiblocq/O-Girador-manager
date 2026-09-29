import React from 'react';

const ICON_SUGGESTIONS = ['📋', '👗', '🎸', '🍽️', '🎪', '📢', '🛠️', '🚗', '🎨', '📸'];

/**
 * Sous-composant pour les informations de base d'une commission (Titre, Icône, Référents, Description)
 */
export default function CommissionBasicInfoFields({
  formData,
  setFormData,
  allUsers = []
}) {
  const handleToggleReferent = (userId) => {
    const current = [...(formData.referentsIds || [])];
    if (current.includes(userId)) {
      setFormData((prev) => ({ ...prev, referentsIds: current.filter((id) => id !== userId) }));
    } else if (current.length < 2) {
      setFormData((prev) => ({ ...prev, referentsIds: [...current, userId] }));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Titre & Icône */}
      <div className="flex gap-2">
        <div className="flex flex-col gap-1">
          <label className="font-bold text-stone-700">Icône</label>
          <input
            type="text"
            maxLength={2}
            value={formData.icone}
            onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
            className="w-10 h-8 text-center text-base rounded border border-encre-noire/30 bg-white"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="font-bold text-stone-700">Intitulé de la commission *</label>
          <input
            type="text"
            required
            placeholder="Ex : Costumes & Tenues, Restauration..."
            value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            className="h-8 px-2.5 rounded border border-encre-noire/30 bg-white font-bold"
          />
        </div>
      </div>

      {/* Suggestions d'icônes */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] text-stone-500 mr-1">Suggestions :</span>
        {ICON_SUGGESTIONS.map((ico) => (
          <button
            key={ico}
            type="button"
            onClick={() => setFormData({ ...formData, icone: ico })}
            className={`w-6 h-6 rounded flex items-center justify-center border text-xs ${
              formData.icone === ico ? 'bg-amber-200 border-encre-noire' : 'bg-white border-stone-200'
            }`}
          >
            {ico}
          </button>
        ))}
      </div>

      {/* Binôme Référent (max 2) */}
      <div className="flex flex-col gap-1">
        <label className="font-bold text-stone-700">
          Binôme référent ({formData.referentsIds?.length || 0}/2)
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded border border-encre-noire/20 bg-white">
          {allUsers.map((u) => {
            const isSelected = (formData.referentsIds || []).includes(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => handleToggleReferent(u.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                  isSelected
                    ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {u.prenom || u.name || 'Adhérent'} {u.nom || ''} {isSelected && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="font-bold text-stone-700">Résumé de la mission</label>
        <textarea
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Objectifs et responsabilités..."
          className="p-2 rounded border border-encre-noire/30 bg-white text-xs"
        />
      </div>
    </div>
  );
}
