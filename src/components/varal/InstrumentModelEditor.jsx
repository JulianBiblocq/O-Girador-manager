import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import PartEditor from './PartEditor';

const INSTRUMENT_TYPES = ['Alfaia', 'Caixa', 'Agbê', 'Gonguê', 'Mineiro', 'Apito', 'Timbal', 'Maintenance', 'Costume', 'Autre'];

export default function InstrumentModelEditor({ model, existingModels, varalCategories, tools = [], supplies = [], onSave, onCancel }) {
  const allTypes = useMemo(() => {
    const types = new Set(INSTRUMENT_TYPES);
    (existingModels || []).forEach(m => {
      if (m.type) types.add(m.type);
    });
    return Array.from(types).sort();
  }, [existingModels]);

  const defaultType = model?.type || 'Alfaia';
  const initialIsCustom = !!model?.type && !allTypes.includes(model.type);

  const [formData, setFormData] = useState({
    nom: model?.nom || '',
    type: defaultType,
    categoryId: model?.categoryId || 'TutosFabrication',
    description: model?.description || '',
    parts: model?.parts || []
  });

  const [isCustomType, setIsCustomType] = useState(initialIsCustom);

  const [editingPart, setEditingPart] = useState(null);

  // Compute aggregated materials and tools
  const aggregatedData = useMemo(() => {
    const allMats = new Set();
    const allOutils = new Set();
    formData.parts.forEach(p => {
      (p.materiels || []).forEach(m => allMats.add(m));
      (p.outils || []).forEach(o => allOutils.add(o));
    });
    return {
      materiels: Array.from(allMats),
      outils: Array.from(allOutils)
    };
  }, [formData.parts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelectChange = (e) => {
    const value = e.target.value;
    if (value === '---custom---') {
      setIsCustomType(true);
      setFormData(prev => ({ ...prev, type: '' }));
    } else {
      setIsCustomType(false);
      setFormData(prev => ({ ...prev, type: value }));
    }
  };

  const handleSavePart = (partData) => {
    setFormData(prev => {
      const parts = [...prev.parts];
      const index = parts.findIndex(p => p.id === partData.id);
      if (index >= 0) {
        parts[index] = partData;
      } else {
        parts.push(partData);
      }
      return { ...prev, parts };
    });
    setEditingPart(null);
  };

  const handleDeletePart = (partId) => {
    if (window.confirm("Supprimer cette pièce de la nomenclature ?")) {
      setFormData(prev => ({ ...prev, parts: prev.parts.filter(p => p.id !== partId) }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) return;
    onSave(formData);
  };

  if (editingPart) {
    return (
      <PartEditor 
        part={editingPart.id === 'new' ? null : editingPart} 
        existingTools={tools}
        existingSupplies={supplies}
        onSave={handleSavePart} 
        onCancel={() => setEditingPart(null)} 
      />
    );
  }

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-5 bg-[#faf8f5] relative">
      <button 
        type="button" 
        onClick={onCancel}
        className="absolute top-3 right-3 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded-md shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center"
      >
        <XiloClose size={10} />
      </button>

      <h3 className="text-sm font-bold text-cordel-wood mb-4">
        {model ? `Éditer le Modèle : ${model.nom}` : "Nouveau Modèle d'Instrument"}
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Nom du modèle</label>
            <input 
              type="text" 
              name="nom" 
              value={formData.nom} 
              onChange={handleChange} 
              className="theme-input text-xs font-bold py-2"
              placeholder="Ex: Alfaia 18 pouces"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Famille / Catégorie</label>
            {!isCustomType ? (
              <select
                name="type"
                value={formData.type}
                onChange={handleTypeSelectChange}
                className="theme-input text-xs font-bold py-2 bg-white cursor-pointer"
              >
                {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="---custom---">+ Nouvelle catégorie...</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange} 
                  className="theme-input text-xs font-bold py-2 flex-1"
                  placeholder="Nom de la nouvelle catégorie..."
                  autoFocus
                />
                <button 
                  type="button" 
                  onClick={() => {
                    setIsCustomType(false);
                    setFormData(prev => ({ ...prev, type: allTypes[0] || 'Alfaia' }));
                  }}
                  className="text-[10px] text-cordel-master-dark underline cursor-pointer hover:text-black"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Corde à linge (Varal)</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="theme-input text-xs font-bold py-2 bg-white cursor-pointer"
            >
              {(varalCategories || []).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
            <span className="text-[9px] text-cordel-master-dark opacity-75">
              Choisissez sur quelle ligne afficher ce modèle.
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Description / Chapeau</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="theme-input text-xs py-2 h-16 resize-none"
              placeholder="Une courte introduction sur cet instrument..."
            />
          </div>
        </div>

        {/* Vue compilée du matériel et outils */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2 p-3 bg-cordel-master-dark/5 rounded border border-dashed border-cordel-master-dark/20">
          <div>
            <h5 className="text-[10px] font-bold text-cordel-wood uppercase mb-1">Résumé Matériaux requis</h5>
            <div className="flex flex-wrap gap-1">
              {aggregatedData.materiels.length === 0 ? <span className="text-[9px] opacity-60">Aucun matériel défini</span> : aggregatedData.materiels.map((m, i) => (
                <span key={i} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-cordel-master-dark/20">{m}</span>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-[10px] font-bold text-cordel-wood uppercase mb-1">Résumé Outils requis</h5>
            <div className="flex flex-wrap gap-1">
              {aggregatedData.outils.length === 0 ? <span className="text-[9px] opacity-60">Aucun outil défini</span> : aggregatedData.outils.map((o, i) => (
                <span key={i} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-cordel-master-dark/20">{o}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des pièces */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/30 pb-2">
            <label className="text-[10px] uppercase font-bold text-cordel-master-dark">Nomenclature (Pièces à fabriquer)</label>
            <button 
              type="button" 
              onClick={() => setEditingPart({ id: 'new' })}
              className="text-[10px] bg-cordel-wood text-white px-3 py-1 rounded font-bold shadow hover:brightness-110"
            >
              + Ajouter une pièce
            </button>
          </div>
          
          {formData.parts.length === 0 && (
            <div className="text-center py-6 border border-dashed border-stone-300 rounded bg-white/50">
              <span className="text-[10px] text-stone-500 italic">Aucune pièce définie. Ajoutez les éléments qui composent cet instrument.</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {formData.parts.map(part => (
              <div key={part.id} className="flex justify-between items-center p-2 bg-white border border-encre-noire/15 rounded shadow-sm">
                <div>
                  <h6 className="text-xs font-bold text-encre-noire">{part.nom}</h6>
                  <p className="text-[9px] text-stone-500 mt-0.5">
                    {part.materiels?.length || 0} matériaux • {part.outils?.length || 0} outils • {part.chapitres?.length || 0} chapitres
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingPart(part)}
                    className="text-[10px] font-bold text-cordel-wood hover:underline"
                  >
                    Éditer
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDeletePart(part.id)}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20">
          <CordelButton type="button" variant="default" onClick={onCancel}>Annuler</CordelButton>
          <CordelButton type="submit" variant="vert" useExtremeBorder={true}>💾 Enregistrer le Modèle</CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
