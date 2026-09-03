import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import useConfirm from '../../hooks/useConfirm';

export default function WorkshopToolsListView({ tools, loading, addTool, updateTool, deleteTool, domaine }) {
  const { confirm } = useConfirm();
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResident, setFilterResident] = useState('all'); // 'all', 'resident', 'mobile'
  
  const [formData, setFormData] = useState({
    nom: '',
    isResident: true,
    emplacement: '',
    etat: 'bon'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.nom) {
      await addTool({ ...formData, domaine });
      setIsAdding(false);
      setFormData({ nom: '', isResident: true, emplacement: '', etat: 'bon' });
    }
  };

  const handleDelete = async (id, nom) => {
    if (await confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) {
      await deleteTool(id);
    }
  };

  const toggleResident = async (tool) => {
    await updateTool(tool.id, { isResident: !tool.isResident });
  };

  const changeState = async (id, newState) => {
    await updateTool(id, { etat: newState });
  };

  // Filtrage
  const displayedTools = tools.filter(tool => {
    const matchSearch = tool.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchResident = filterResident === 'all' 
      ? true 
      : (filterResident === 'resident' ? tool.isResident : !tool.isResident);
    return matchSearch && matchResident;
  });

  if (loading) {
    return <div className="p-4 text-center text-cordel-master-dark">Chargement de l'outillage...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* En-tête et contrôles */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-cordel-bg border-2 border-encre-noire p-3 shadow-[3px_3px_0px_0px_#181716] rounded gap-3">
        <h3 className="text-sm font-extrabold tracking-wider text-cordel-wood uppercase">
          🛠️ Matériel & Outillage ({tools.length})
        </h3>
        
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="text" 
            placeholder="Rechercher un outil..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="theme-input text-xs w-40"
          />
          <select 
            value={filterResident} 
            onChange={(e) => setFilterResident(e.target.value)}
            className="theme-input text-xs bg-white"
          >
            <option value="all">Tous</option>
            <option value="resident">Résidents locaux</option>
            <option value="mobile">Mobiles</option>
          </select>
          <CordelButton variant="default" onClick={() => setIsAdding(!isAdding)} className="text-xs font-bold px-3 py-1.5">
            {isAdding ? "Annuler" : "+ Ajouter outil"}
          </CordelButton>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {isAdding && (
        <CordelCard className="p-4 bg-cordel-bg-light border-dashed border-cordel-master-dark/30">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-encre-noire uppercase mb-2">Nouvel outil</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Nom *</label>
                <input required name="nom" value={formData.nom} onChange={handleChange} className="theme-input text-xs" placeholder="Ex: Perceuse à colonne" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Emplacement</label>
                <input name="emplacement" value={formData.emplacement} onChange={handleChange} className="theme-input text-xs" placeholder="Ex: Établi principal" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">État initial</label>
                <select name="etat" value={formData.etat} onChange={handleChange} className="theme-input text-xs">
                  <option value="neuf">Neuf</option>
                  <option value="bon">Bon</option>
                  <option value="a_reparer">À réparer</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input type="checkbox" id="isResidentCheck" name="isResident" checked={formData.isResident} onChange={handleChange} className="w-4 h-4" />
                <label htmlFor="isResidentCheck" className="text-[10px] font-bold text-cordel-master-dark uppercase cursor-pointer">
                  Résident au local (non mobile)
                </label>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <CordelButton type="submit" variant="vert" className="px-6 py-2 text-xs">
                💾 Enregistrer
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      )}

      {/* Liste des outils */}
      {displayedTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedTools.map(tool => (
            <div key={tool.id} className="flex flex-col gap-2 p-3 bg-white border-2 border-encre-noire rounded shadow-[2px_2px_0px_0px_#181716] relative">
              <div className="flex justify-between items-start pr-6">
                <h4 className="font-bold text-sm text-encre-noire">{tool.nom}</h4>
                <button 
                  onClick={() => handleDelete(tool.id, tool.nom)}
                  className="absolute top-2 right-2 p-1 text-cordel-rouge/50 hover:text-cordel-rouge transition-colors"
                >
                  <XiloClose size={14} />
                </button>
              </div>
              
              <div className="text-[10px] text-cordel-master-dark mb-1">
                📍 {tool.emplacement || 'Emplacement non défini'}
              </div>

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-dashed border-encre-noire/20">
                {/* Toggle IsResident */}
                <button 
                  onClick={() => toggleResident(tool)}
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors ${
                    tool.isResident 
                      ? 'bg-cordel-vert/20 text-cordel-vert border border-cordel-vert/30'
                      : 'bg-cordel-ocre/20 text-cordel-ocre border border-cordel-ocre/30'
                  }`}
                >
                  {tool.isResident ? '🏠 Résident local' : '🚗 Mobile'}
                </button>

                {/* Sélecteur d'état */}
                <select
                  value={tool.etat || 'bon'}
                  onChange={(e) => changeState(tool.id, e.target.value)}
                  className={`text-[9px] font-bold uppercase py-1 px-1.5 rounded border cursor-pointer ${
                    tool.etat === 'a_reparer'
                      ? 'bg-cordel-rouge/10 text-cordel-rouge border-cordel-rouge/30'
                      : tool.etat === 'neuf'
                        ? 'bg-cordel-vert/10 text-cordel-vert border-cordel-vert/30'
                        : 'bg-cordel-bg text-cordel-wood border-encre-noire/20'
                  }`}
                >
                  <option value="neuf">Neuf</option>
                  <option value="bon">Bon</option>
                  <option value="a_reparer">À réparer</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 text-sm text-cordel-master-dark border-2 border-dashed border-cordel-master-dark/30 rounded bg-cordel-bg-light">
          Aucun outil ne correspond à votre recherche.
        </div>
      )}
    </div>
  );
}
