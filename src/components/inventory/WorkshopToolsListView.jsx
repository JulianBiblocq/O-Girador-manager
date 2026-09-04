import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import useConfirm from '../../hooks/useConfirm';

export default function WorkshopToolsListView({ tools, loading, addTool, updateTool, deleteTool, domaine, models = [], membersList = [] }) {
  const { confirm } = useConfirm();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResident, setFilterResident] = useState('all'); // 'all', 'resident', 'mobile'
  
  // Extraction de tous les outils référencés dans les modèles et tutoriels du Varal
  const tutorialTools = useMemo(() => {
    const set = new Set();
    (models || []).forEach(m => {
      (m.parts || []).forEach(p => {
        (p.outils || []).forEach(o => o?.trim() && set.add(o.trim()));
        (p.chapitres || []).forEach(c => {
          (c.outils || []).forEach(o => o?.trim() && set.add(o.trim()));
        });
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [models]);

  // Suggestions d'emplacements types (locaux et ateliers membres)
  const suggestedLocations = useMemo(() => {
    const locs = ['Local associatif', 'Armoire lutherie', 'Établi principal'];
    (membersList || []).forEach(mem => {
      const name = mem.prenom || mem.nom_complet || mem.nom;
      if (name) locs.push(`Atelier de ${name}`);
    });
    return locs;
  }, [membersList]);

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

  const handleEdit = (tool) => {
    setFormData({
      nom: tool.nom || '',
      isResident: typeof tool.isResident !== 'undefined' ? tool.isResident : true,
      emplacement: tool.emplacement || '',
      etat: tool.etat || 'bon'
    });
    setEditingId(tool.id);
    setIsAdding(true);
  };

  const handleToggleAdd = () => {
    if (isAdding) {
      setIsAdding(false);
      setEditingId(null);
      setFormData({ nom: '', isResident: true, emplacement: '', etat: 'bon' });
    } else {
      setIsAdding(true);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.nom) {
      setSubmitting(true);
      let ok;
      if (editingId) {
        ok = await updateTool(editingId, { ...formData, domaine: domaine || 'lutherie' });
      } else {
        ok = await addTool({ ...formData, domaine: domaine || 'lutherie' });
      }
      setSubmitting(false);
      if (!ok) {
        alert("Erreur lors de l'enregistrement de l'outil. Veuillez vérifier vos droits d'accès.");
        return;
      }
      setIsAdding(false);
      setEditingId(null);
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
          <CordelButton variant="default" onClick={handleToggleAdd} className="text-xs font-bold px-3 py-1.5">
            {isAdding ? "Annuler" : editingId ? "Mode Édition..." : "+ Ajouter outil"}
          </CordelButton>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {isAdding && (
        <CordelCard className="p-4 bg-cordel-bg-light border-dashed border-cordel-master-dark/30">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-encre-noire uppercase mb-1">
              {editingId ? "Modifier l'outil" : "Nouvel outil"}
            </h4>

            {/* Suggestions rapides depuis les tutoriels du Varal */}
            {!editingId && tutorialTools.length > 0 && (
              <div className="bg-white/90 p-2.5 rounded border border-amber-300 flex flex-col gap-1.5 text-left">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1">
                  <span>💡</span> Outils requis par les tutoriels du Varal :
                </span>
                <div className="flex flex-wrap gap-1">
                  {tutorialTools.map(t => {
                    const alreadyInStock = tools.some(existing => existing.nom.toLowerCase().trim() === t.toLowerCase().trim());
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, nom: t }))}
                        className={`text-[9px] px-2 py-0.5 rounded border font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          alreadyInStock
                            ? 'bg-stone-100 text-stone-500 border-stone-300'
                            : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                        }`}
                        title={alreadyInStock ? 'Déjà répertorié au stock' : 'Cliquer pour sélectionner cet outil du tutoriel'}
                      >
                        <span>{alreadyInStock ? '✓' : '+'}</span> {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Nom de l'outil *</label>
                <input 
                  required 
                  name="nom" 
                  list="tutorial-tools-datalist"
                  value={formData.nom} 
                  onChange={handleChange} 
                  className="theme-input text-xs" 
                  placeholder="Ex: Scie fine, Ciseau à bois" 
                />
                <datalist id="tutorial-tools-datalist">
                  {tutorialTools.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Emplacement / Gardien</label>
                <input 
                  name="emplacement" 
                  list="locations-datalist"
                  value={formData.emplacement} 
                  onChange={handleChange} 
                  className="theme-input text-xs" 
                  placeholder="Ex: Atelier de Dorian, Local..." 
                />
                <datalist id="locations-datalist">
                  {suggestedLocations.map(l => <option key={l} value={l} />)}
                </datalist>
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
                <input type="checkbox" id="isResidentCheck" name="isResident" checked={formData.isResident} onChange={handleChange} className="w-4 h-4 cursor-pointer" />
                <label htmlFor="isResidentCheck" className="text-[10px] font-bold text-cordel-master-dark uppercase cursor-pointer">
                  Résident au local (non mobile)
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <CordelButton type="submit" variant="vert" disabled={submitting} className="px-6 py-2 text-xs font-black uppercase">
                {submitting ? "Enregistrement..." : editingId ? "💾 Mettre à jour" : "💾 Enregistrer l'outil"}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      )}

      {/* Liste des outils */}
      {displayedTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedTools.map(tool => {
            const isFromTutorial = tutorialTools.some(t => t.toLowerCase().trim() === tool.nom.toLowerCase().trim());
            return (
              <div key={tool.id} className="flex flex-col gap-2 p-3 bg-white border-2 border-encre-noire rounded shadow-[2px_2px_0px_0px_#181716] relative text-left">
                <div className="flex justify-between items-start pr-12 gap-1">
                  <div className="flex flex-col">
                    <h4 className="font-bold text-sm text-encre-noire">{tool.nom}</h4>
                    {isFromTutorial && (
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded w-fit mt-0.5">
                        📖 Requis en tutoriel
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button 
                      onClick={() => handleEdit(tool)}
                      className="p-1 text-cordel-wood/50 hover:text-cordel-wood transition-colors cursor-pointer text-[10px] font-bold uppercase"
                      title="Éditer"
                    >
                      Éditer
                    </button>
                    <button 
                      onClick={() => handleDelete(tool.id, tool.nom)}
                      className="p-1 text-cordel-rouge/50 hover:text-cordel-rouge transition-colors cursor-pointer"
                      title="Supprimer cet outil"
                    >
                      <XiloClose size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="text-[10.5px] font-bold text-stone-800 bg-stone-50 px-2 py-1 rounded border border-stone-200 mt-1 flex items-center justify-between">
                  <span>📍 {tool.emplacement || 'Emplacement non défini'}</span>
                  {!tool.isResident && tool.emplacement && (
                    <span className="text-[8px] uppercase tracking-wider bg-amber-100 text-amber-900 px-1 rounded font-black">
                      À emmener
                    </span>
                  )}
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
          );
        })}
        </div>
      ) : (
        <div className="text-center p-6 text-sm text-cordel-master-dark border-2 border-dashed border-cordel-master-dark/30 rounded bg-cordel-bg-light">
          Aucun outil ne correspond à votre recherche.
        </div>
      )}
    </div>
  );
}
