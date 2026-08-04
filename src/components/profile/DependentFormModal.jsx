import React, { useState, useEffect } from 'react';
import CordelButton from '../CordelButton';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';

export default function DependentFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  instrumentsDisponibles = [],
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  saving = false,
  t = (k, fb) => fb || k
}) {
  const isEditing = !!initialData?.id;

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [instrumentsJoues, setInstrumentsJoues] = useState([]);
  const [niveau, setNiveau] = useState('debutant');
  const [niveauDanse, setNiveauDanse] = useState('aucun');
  const [niveauxParInstrument, setNiveauxParInstrument] = useState({});
  const [formError, setFormError] = useState('');

  const niveauxOptions = customCategories && customCategories.length > 0 ? customCategories : ['debutant', 'confirme'];

  useEffect(() => {
    if (initialData) {
      setPrenom(initialData.prenom || '');
      setNom(initialData.nom || '');
      setDateNaissance(initialData.dateNaissance || '');
      setInstrumentsJoues(initialData.instrumentsJoues || (initialData.instrument ? [initialData.instrument] : []));
      setNiveauxParInstrument(initialData.niveauxParInstrument || {});
      setNiveau(initialData.niveau || 'debutant');
      setNiveauDanse(initialData.niveauDanse || 'aucun');
    } else {
      setPrenom('');
      setNom('');
      setDateNaissance('');
      setInstrumentsJoues([]);
      setNiveauxParInstrument({});
      setNiveau('debutant');
      setNiveauDanse('aucun');
    }
    setFormError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleInstrumentToggle = (inst) => {
    setInstrumentsJoues(prev => {
      if (prev.includes(inst)) {
        const next = prev.filter(i => i !== inst);
        setNiveauxParInstrument(nPrev => {
          const { [inst]: removed, ...rest } = nPrev;
          return rest;
        });
        return next;
      } else {
        return [...prev, inst];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim()) {
      setFormError("Le prénom et le nom sont obligatoires.");
      return;
    }

    setFormError('');
    try {
      await onSave({
        id: initialData?.id,
        prenom,
        nom,
        dateNaissance,
        instrumentsJoues,
        instrument: instrumentsJoues[0] || '',
        niveauxParInstrument,
        niveau,
        niveauDanse
      });
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement dépendant :", err);
      setFormError(err.message || "Erreur lors de la sauvegarde.");
    }
  };

  const hasDanse = instrumentsJoues.some(inst => inst.toLowerCase().includes('danse'));

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
      className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none outline-none animate-fade-in"
    >
      <div className="relative bg-cordel-bg max-w-md w-full rounded-lg shadow-xl border-4 border-encre-noire max-h-[90vh] flex flex-col overflow-hidden text-left">
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/30 flex items-center justify-between bg-cordel-bg-light select-none">
          <h3 className="font-black text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>👶</span> {isEditing ? "Modifier le compte enfant" : "Ajouter un membre rattaché (enfant)"}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="text-encre-noire hover:text-cordel-wood text-lg font-bold px-2 py-0.5 cursor-pointer"
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {formError && (
              <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded border border-dashed border-red-400">
                ⚠️ {formError}
              </div>
            )}

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-master-dark block mb-1">
                Prénom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Lucas"
                className="theme-input text-xs w-full py-2 px-3 bg-cordel-bg-light border-encre-noire/30 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-master-dark block mb-1">
                Nom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Dupont"
                className="theme-input text-xs w-full py-2 px-3 bg-cordel-bg-light border-encre-noire/30 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-master-dark block mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="theme-input text-xs w-full py-2 px-3 bg-cordel-bg-light border-encre-noire/30 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-master-dark block mb-1">
                Instrument(s) joué(s)
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-cordel-bg-light/60 border border-encre-noire/20 rounded">
                {instrumentsDisponibles.map((inst) => (
                  <label key={inst} className="flex items-center gap-2 text-xs cursor-pointer select-none py-1 px-1.5 hover:bg-black/5 rounded">
                    <input
                      type="checkbox"
                      checked={instrumentsJoues.includes(inst)}
                      onChange={() => handleInstrumentToggle(inst)}
                      className="rounded text-cordel-wood focus:ring-0 cursor-pointer"
                    />
                    <span>{inst}</span>
                  </label>
                ))}
              </div>
            </div>

            {instrumentsJoues.length > 0 && (
              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-cordel-wood/30 flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-master-dark block mb-1">
                  Niveau par instrument joué
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {instrumentsJoues.map((inst) => (
                    <div key={inst} className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-cordel-wood">{inst}</span>
                      <select
                        value={niveauxParInstrument[inst] || 'debutant'}
                        onChange={(e) => setNiveauxParInstrument(prev => ({ ...prev, [inst]: e.target.value }))}
                        className="theme-input text-[10px] font-bold py-1 px-1.5 w-32 bg-white"
                      >
                        <option value="debutant">Débutant</option>
                        {niveauxOptions.filter(cat => cat.toLowerCase() !== 'debutant').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-master-dark block mb-1">
                  Niveau Percussion
                </label>
                <select
                  value={niveau}
                  onChange={(e) => setNiveau(e.target.value)}
                  className="theme-input text-xs w-full py-2 px-2 bg-cordel-bg-light border-encre-noire/30 font-bold"
                >
                  <option value="aucun">🎵 Aucun</option>
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {hasDanse && (
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-master-dark block mb-1">
                    Niveau Danse
                  </label>
                  <select
                    value={niveauDanse}
                    onChange={(e) => setNiveauDanse(e.target.value)}
                    className="theme-input text-xs w-full py-2 px-2 bg-cordel-bg-light border-encre-noire/30 font-bold"
                  >
                    <option value="aucun">💃 Aucun</option>
                    {customCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 3. Footer buttons (Fixe en bas) */}
          <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/20 flex gap-2 justify-end bg-cordel-bg">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={saving}
              className="text-xs px-4 py-2"
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="ocre"
              disabled={saving}
              className="text-xs px-5 py-2 font-bold uppercase tracking-wider"
            >
              {saving ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Créer le profil"}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
