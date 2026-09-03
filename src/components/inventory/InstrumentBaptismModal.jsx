import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function InstrumentBaptismModal({ project, model, onClose, onValidate }) {
  const [formData, setFormData] = useState({
    nom: `${model.nom} - ${project.nom}`,
    kitAccessoires: '',
    localisationPhysique: 'Local',
    proprietaire: 'Association'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      alert("Le nom ou numéro d'inventaire est requis.");
      return;
    }
    onValidate(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md">
        <CordelCard variant="default" className="p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/20 pb-2">
            <div>
              <h3 className="text-sm font-black text-cordel-wood uppercase flex items-center gap-2">
                <span>🥁</span> Baptême de l'Instrument
              </h3>
              <p className="text-[10px] text-stone-600 font-medium">
                Finalisez l'assemblage et intégrez l'instrument au parc officiel.
              </p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-lg">×</button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">Modèle (Lecture seule)</label>
              <input
                type="text"
                value={model.nom}
                readOnly
                className="theme-input bg-stone-100 text-stone-500 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">Nom / N° d'inventaire *</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="theme-input"
                placeholder="ex. Alfaia #6 — La Roazhon"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">Localisation Physique</label>
              <input
                type="text"
                name="localisationPhysique"
                value={formData.localisationPhysique}
                onChange={handleChange}
                className="theme-input"
                placeholder="ex. Local, Camion, chez un membre..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">Propriétaire</label>
              <input
                type="text"
                name="proprietaire"
                value={formData.proprietaire}
                onChange={handleChange}
                className="theme-input"
                placeholder="Association ou nom d'un membre"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire">Kit d'accessoires initial</label>
              <textarea
                name="kitAccessoires"
                value={formData.kitAccessoires}
                onChange={handleChange}
                className="theme-input h-16 resize-none"
                placeholder="Sangle, housse, mailloches..."
              />
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
              <CordelButton variant="secondary" type="button" onClick={onClose}>
                Annuler
              </CordelButton>
              <CordelButton variant="vert" type="submit">
                Créer l'instrument
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
