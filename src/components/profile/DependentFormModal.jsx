import React, { useState, useEffect } from 'react';
import CordelButton from '../CordelButton';

export default function DependentFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  instrumentsDisponibles = [],
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
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setPrenom(initialData.prenom || '');
      setNom(initialData.nom || '');
      setDateNaissance(initialData.dateNaissance || '');
      setInstrumentsJoues(initialData.instrumentsJoues || (initialData.instrument ? [initialData.instrument] : []));
      setNiveau(initialData.niveau || 'debutant');
      setNiveauDanse(initialData.niveauDanse || 'aucun');
    } else {
      setPrenom('');
      setNom('');
      setDateNaissance('');
      setInstrumentsJoues([]);
      setNiveau('debutant');
      setNiveauDanse('aucun');
    }
    setFormError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleInstrumentToggle = (inst) => {
    setInstrumentsJoues(prev => {
      if (prev.includes(inst)) {
        return prev.filter(i => i !== inst);
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cordel-bg max-w-md w-full rounded-lg shadow-xl border-4 border-encre-noire max-h-[90vh] flex flex-col overflow-hidden text-left">
        {/* Header */}
        <div className="p-4 border-b-2 border-dashed border-cordel-master-dark/30 flex items-center justify-between bg-cordel-bg-light select-none">
          <h3 className="font-black text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>👶</span> {isEditing ? "Modifier le compte enfant" : "Ajouter un membre rattaché (enfant)"}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="text-encre-noire hover:text-cordel-wood text-lg font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex flex-col gap-4">
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
              className="theme-input text-xs w-full py-2 px-3 bg-cordel-bg-light border-encre-noire/30"
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
              className="theme-input text-xs w-full py-2 px-3 bg-cordel-bg-light border-encre-noire/30"
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
              className="theme-input text-xs w-full py-2 px-3 bg-cordel-bg-light border-encre-noire/30"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-master-dark block mb-1">
                Niveau Percussion
              </label>
              <select
                value={niveau}
                onChange={(e) => setNiveau(e.target.value)}
                className="theme-input text-xs w-full py-2 px-2 bg-cordel-bg-light border-encre-noire/30"
              >
                <option value="debutant">🌱 Débutant</option>
                <option value="confirme">🏆 Confirmé</option>
                <option value="aucun">🎵 Aucun</option>
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
                  className="theme-input text-xs w-full py-2 px-2 bg-cordel-bg-light border-encre-noire/30"
                >
                  <option value="aucun">💃 Aucun</option>
                  <option value="debutant">🌱 Débutant</option>
                  <option value="confirme">🏆 Confirmé</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-dashed border-cordel-master-dark/20">
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
