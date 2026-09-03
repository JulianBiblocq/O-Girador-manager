import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';

export default function PartEditor({ part, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: part?.id || `part_${Date.now()}`,
    nom: part?.nom || '',
    quantiteRequise: part?.quantiteRequise || 1,
    materiels: part?.materiels || [],
    outils: part?.outils || [],
    chapitres: part?.chapitres || []
  });

  const [newMat, setNewMat] = useState('');
  const [newOutil, setNewOutil] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gestion des listes simples
  const addMat = () => {
    if (newMat.trim()) {
      setFormData(prev => ({ ...prev, materiels: [...prev.materiels, newMat.trim()] }));
      setNewMat('');
    }
  };
  const addOutil = () => {
    if (newOutil.trim()) {
      setFormData(prev => ({ ...prev, outils: [...prev.outils, newOutil.trim()] }));
      setNewOutil('');
    }
  };
  const removeMat = (index) => {
    setFormData(prev => ({ ...prev, materiels: prev.materiels.filter((_, i) => i !== index) }));
  };
  const removeOutil = (index) => {
    setFormData(prev => ({ ...prev, outils: prev.outils.filter((_, i) => i !== index) }));
  };

  // Gestion des chapitres
  const addChapitre = () => {
    setFormData(prev => ({
      ...prev,
      chapitres: [...prev.chapitres, { id: `chap_${Date.now()}`, titre: '', texte: '', photoUrl: '', materiaux: [], outils: [] }]
    }));
  };
  
  const toggleChapitreMat = (chapIdx, mat) => {
    const newChaps = [...formData.chapitres];
    const chap = newChaps[chapIdx];
    const mats = chap.materiaux || [];
    if (mats.includes(mat)) {
      chap.materiaux = mats.filter(m => m !== mat);
    } else {
      chap.materiaux = [...mats, mat];
    }
    setFormData(prev => ({ ...prev, chapitres: newChaps }));
  };

  const toggleChapitreOutil = (chapIdx, outil) => {
    const newChaps = [...formData.chapitres];
    const chap = newChaps[chapIdx];
    const outs = chap.outils || [];
    if (outs.includes(outil)) {
      chap.outils = outs.filter(o => o !== outil);
    } else {
      chap.outils = [...outs, outil];
    }
    setFormData(prev => ({ ...prev, chapitres: newChaps }));
  };
  const updateChapitre = (index, field, value) => {
    const newChaps = [...formData.chapitres];
    newChaps[index][field] = value;
    setFormData(prev => ({ ...prev, chapitres: newChaps }));
  };
  const removeChapitre = (index) => {
    setFormData(prev => ({ ...prev, chapitres: prev.chapitres.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) return;
    onSave(formData);
  };

  return (
    <CordelCard variant="default" className="p-4 bg-[#fdfaf2] border-cordel-wood shadow-lg relative">
      <button 
        type="button" 
        onClick={onCancel}
        className="absolute top-2 right-2 p-1 text-cordel-wood hover:bg-black/5 rounded"
      >
        <XiloClose size={14} />
      </button>

      <h4 className="text-sm font-bold text-cordel-wood mb-4">
        {part ? `Éditer la pièce : ${part.nom}` : "Nouvelle pièce (Nomenclature)"}
      </h4>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Nom de la pièce</label>
            <input 
              type="text" 
              name="nom" 
              value={formData.nom} 
              onChange={handleChange} 
              className="theme-input text-xs py-1.5"
              placeholder="Ex: Cerclage 18 pouces"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Quantité requise (Nomenclature)</label>
            <input 
              type="number"
              name="quantiteRequise"
              min="1"
              value={formData.quantiteRequise}
              onChange={handleChange}
              className="theme-input text-xs py-1.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Matériel */}
          <div className="flex flex-col gap-2 p-2 border border-dashed border-cordel-master-dark/30 rounded">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Matériaux requis</label>
            <div className="flex gap-1">
              <input 
                type="text" 
                value={newMat} 
                onChange={e => setNewMat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMat())}
                className="theme-input text-xs py-1 flex-1"
                placeholder="Ex: Bois de frêne 2m"
              />
              <button type="button" onClick={addMat} className="bg-cordel-wood text-white px-2 rounded font-bold">+</button>
            </div>
            <ul className="flex flex-wrap gap-1 mt-1">
              {formData.materiels.map((m, i) => (
                <li key={i} className="text-[9px] bg-white border border-cordel-master-dark/20 px-2 py-0.5 rounded flex items-center gap-1">
                  {m} <button type="button" onClick={() => removeMat(i)} className="text-red-500 font-bold ml-1">x</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Outils */}
          <div className="flex flex-col gap-2 p-2 border border-dashed border-cordel-master-dark/30 rounded">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Outils nécessaires</label>
            <div className="flex gap-1">
              <input 
                type="text" 
                value={newOutil} 
                onChange={e => setNewOutil(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOutil())}
                className="theme-input text-xs py-1 flex-1"
                placeholder="Ex: Scie sauteuse"
              />
              <button type="button" onClick={addOutil} className="bg-cordel-wood text-white px-2 rounded font-bold">+</button>
            </div>
            <ul className="flex flex-wrap gap-1 mt-1">
              {formData.outils.map((o, i) => (
                <li key={i} className="text-[9px] bg-white border border-cordel-master-dark/20 px-2 py-0.5 rounded flex items-center gap-1">
                  {o} <button type="button" onClick={() => removeOutil(i)} className="text-red-500 font-bold ml-1">x</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Chapitres (Tutoriel) */}
        <div className="flex flex-col gap-2 p-2 border border-dashed border-cordel-master-dark/30 rounded mt-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Tutoriel de fabrication (Étapes)</label>
            <button type="button" onClick={addChapitre} className="text-[10px] bg-cordel-master-dark/10 hover:bg-cordel-master-dark/20 px-2 py-1 rounded font-bold">+ Ajouter une étape</button>
          </div>
          
          {formData.chapitres.length === 0 && (
            <p className="text-[10px] italic text-stone-500 text-center py-2">Aucune étape de fabrication ajoutée.</p>
          )}

          {formData.chapitres.map((chap, idx) => (
            <div key={chap.id} className="relative flex flex-col gap-2 p-2 bg-white/50 border border-encre-noire/10 rounded mb-2">
              <button type="button" onClick={() => removeChapitre(idx)} className="absolute top-1 right-1 text-red-500 font-bold hover:bg-red-50 px-1 rounded">X</button>
              
              <input 
                type="text" 
                value={chap.titre} 
                onChange={e => updateChapitre(idx, 'titre', e.target.value)}
                className="theme-input text-[11px] font-bold py-1 w-11/12 bg-transparent border-b border-dashed border-cordel-master-dark/30"
                placeholder={`Étape ${idx + 1} : Titre`}
              />
              <textarea 
                value={chap.texte} 
                onChange={e => updateChapitre(idx, 'texte', e.target.value)}
                className="theme-input text-[10px] py-1 min-h-[60px]"
                placeholder="Description des instructions..."
              />
              <input 
                type="url" 
                value={chap.photoUrl} 
                onChange={e => updateChapitre(idx, 'photoUrl', e.target.value)}
                className="theme-input text-[9px] py-1 text-blue-600"
                placeholder="URL d'une image (optionnel)"
              />
              
              {/* Assignation Outils/Matériaux */}
              {(formData.materiels.length > 0 || formData.outils.length > 0) && (
                <div className="flex flex-col gap-1 mt-2 p-2 bg-black/5 rounded">
                  <span className="text-[9px] uppercase font-bold text-cordel-master-dark mb-1">Assigner Outils & Matériaux à cette étape</span>
                  <div className="flex flex-wrap gap-1">
                    {formData.materiels.map(mat => {
                      const isSelected = (chap.materiaux || []).includes(mat);
                      return (
                        <button
                          key={mat}
                          type="button"
                          onClick={() => toggleChapitreMat(idx, mat)}
                          className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                            isSelected 
                              ? 'bg-cordel-wood text-white border-cordel-wood font-bold' 
                              : 'bg-white text-encre-noire border-encre-noire/20'
                          }`}
                        >
                          {mat}
                        </button>
                      );
                    })}
                    {formData.outils.map(outil => {
                      const isSelected = (chap.outils || []).includes(outil);
                      return (
                        <button
                          key={outil}
                          type="button"
                          onClick={() => toggleChapitreOutil(idx, outil)}
                          className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                            isSelected 
                              ? 'bg-cordel-wood text-white border-cordel-wood font-bold' 
                              : 'bg-white text-encre-noire border-encre-noire/20'
                          }`}
                        >
                          🛠 {outil}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <CordelButton type="button" variant="default" onClick={onCancel}>Annuler</CordelButton>
          <CordelButton type="submit" variant="vert" useExtremeBorder={true}>💾 Valider la pièce</CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
