import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';

/**
 * Tiroir replié par défaut pour la Direction Artistique et Mestria.
 */
export default function MestriaAccordion({ directionArtistique = [], afficherMestriaPV = false, handleChange, saving }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    const newMestre = { id: `mestre_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, role: '', nom: '' };
    handleChange('directionArtistique', [...directionArtistique, newMestre]);
  };

  const handleUpdate = (id, field, value) => {
    const updated = directionArtistique.map(item => item.id === id ? { ...item, [field]: value } : item);
    handleChange('directionArtistique', updated);
  };

  const handleRemove = (id) => {
    const updated = directionArtistique.filter(item => item.id !== id);
    handleChange('directionArtistique', updated);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= directionArtistique.length) return;
    const updated = [...directionArtistique];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    handleChange('directionArtistique', updated);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-sm">🥁</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            Direction Artistique ({directionArtistique.length}) {isOpen ? '▲' : '▾'}
          </span>
          <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
            (Mestres, Directeurs musicaux...)
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
        >
          {isOpen ? 'Fermer' : 'Gérer'}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-2.5 text-left animate-fade-in bg-white/40">
          {directionArtistique.length === 0 ? (
            <div className="p-3 border border-dashed border-cordel-master-dark/20 rounded bg-white/60 text-[10px] text-cordel-master-dark/60 font-semibold italic text-center">
              Aucun Mestre ou Directeur Artistique renseigné.
            </div>
          ) : (
            directionArtistique.map((mestre, idx) => (
              <div key={mestre.id || idx} className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded">
                <div className="flex flex-col sm:flex-row flex-1 gap-2">
                  <input
                    type="text"
                    value={mestre.role || ''}
                    onChange={(e) => handleUpdate(mestre.id, 'role', e.target.value)}
                    placeholder="Fonction (ex: Mestre)"
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1 px-2 bg-white flex-1"
                  />
                  <input
                    type="text"
                    value={mestre.nom || ''}
                    onChange={(e) => handleUpdate(mestre.id, 'nom', e.target.value)}
                    placeholder="Prénom & Nom du Mestre"
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1 px-2 bg-white flex-1"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={saving || idx === 0}
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={saving || idx === directionArtistique.length - 1}
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(mestre.id)}
                    disabled={saving}
                    className="w-6 h-6 rounded bg-[var(--theme-primary)] text-white text-xs font-bold flex items-center justify-center hover:bg-[var(--theme-primary)]/80 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="pt-1">
            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={handleAdd}
              disabled={saving}
              className="py-1 px-3 text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              ➕ Ajouter un membre de la Direction Artistique
            </CordelButton>
          </div>

          <div className="mt-2 pt-2 border-t border-dashed border-stone-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={afficherMestriaPV || false}
                onChange={(e) => handleChange('afficherMestriaPV', e.target.checked)}
                disabled={saving}
                className="w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-stone-800">
                Afficher la Direction Artistique sur les Procès-Verbaux (PV)
              </span>
            </label>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
