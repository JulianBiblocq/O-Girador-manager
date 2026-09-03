import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import useConfirm from '../../hooks/useConfirm';

export default function SuppliesListView({ supplies, loading, addSupply, updateSupply, deleteSupply, adjustSupplyStock, domaine }) {
  const { confirm } = useConfirm();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    categorie: '',
    quantiteStock: 0,
    unite: 'unités',
    seuilCritique: 0,
    conditionnementAchat: '',
    fournisseur: '',
    referenceFournisseur: '',
    urlFournisseur: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.nom) {
      await addSupply({ ...formData, domaine });
      setIsAdding(false);
      setFormData({
        nom: '', categorie: '', quantiteStock: 0, unite: 'unités',
        seuilCritique: 0, conditionnementAchat: '', fournisseur: '',
        referenceFournisseur: '', urlFournisseur: '', notes: ''
      });
    }
  };

  const handleDelete = async (id, nom) => {
    if (await confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) {
      await deleteSupply(id);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-cordel-master-dark">Chargement des fournitures...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* En-tête et bouton Ajout */}
      <div className="flex justify-between items-center bg-cordel-bg border-2 border-encre-noire p-3 shadow-[3px_3px_0px_0px_#181716] rounded">
        <h3 className="text-sm font-extrabold tracking-wider text-cordel-wood uppercase">
          📦 Stock de Matières Premières ({supplies.length})
        </h3>
        <CordelButton variant="default" onClick={() => setIsAdding(!isAdding)} className="text-xs font-bold px-3 py-1.5">
          {isAdding ? "Annuler" : "+ Ajouter une fourniture"}
        </CordelButton>
      </div>

      {/* Formulaire d'ajout */}
      {isAdding && (
        <CordelCard className="p-4 bg-cordel-bg-light border-dashed border-cordel-master-dark/30">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-encre-noire uppercase mb-2">Nouvelle fourniture</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Nom *</label>
                <input required name="nom" value={formData.nom} onChange={handleChange} className="theme-input text-xs" placeholder="Ex: Corde 8mm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Catégorie</label>
                <input name="categorie" value={formData.categorie} onChange={handleChange} className="theme-input text-xs" placeholder="Ex: Corderie" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Stock initial</label>
                <input type="number" name="quantiteStock" value={formData.quantiteStock} onChange={handleChange} className="theme-input text-xs" min="0" step="0.1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Unité</label>
                <select name="unite" value={formData.unite} onChange={handleChange} className="theme-input text-xs">
                  <option value="unités">Unités</option>
                  <option value="mètres">Mètres</option>
                  <option value="bobines">Bobines</option>
                  <option value="kg">Kg</option>
                  <option value="litres">Litres</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Seuil Critique</label>
                <input type="number" name="seuilCritique" value={formData.seuilCritique} onChange={handleChange} className="theme-input text-xs" min="0" step="0.1" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Format Achat</label>
                <input name="conditionnementAchat" value={formData.conditionnementAchat} onChange={handleChange} className="theme-input text-xs" placeholder="Ex: Rouleau 100m" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Fournisseur</label>
                <input name="fournisseur" value={formData.fournisseur} onChange={handleChange} className="theme-input text-xs" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-cordel-master-dark uppercase">Lien d'achat (URL)</label>
                <input type="url" name="urlFournisseur" value={formData.urlFournisseur} onChange={handleChange} className="theme-input text-xs" />
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

      {/* Tableau des fournitures */}
      {supplies.length > 0 ? (
        <div className="overflow-x-auto border-2 border-encre-noire bg-cordel-bg-light rounded shadow-[3px_3px_0px_0px_#181716]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cordel-bg border-b-2 border-encre-noire text-[10px] font-extrabold uppercase text-cordel-master-dark">
                <th className="p-3 border-r border-encre-noire/20">Article</th>
                <th className="p-3 border-r border-encre-noire/20 text-center">Catégorie</th>
                <th className="p-3 border-r border-encre-noire/20 text-center">Stock</th>
                <th className="p-3 border-r border-encre-noire/20 text-center">Fournisseur</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map(supply => {
                const isCritical = supply.quantiteStock <= supply.seuilCritique;
                return (
                  <tr key={supply.id} className="border-b border-dashed border-encre-noire/20 hover:bg-white/50 transition-colors">
                    <td className="p-3 border-r border-encre-noire/10">
                      <div className="font-bold text-encre-noire text-sm">{supply.nom}</div>
                      {supply.notes && <div className="text-[10px] text-cordel-master-dark italic mt-0.5">{supply.notes}</div>}
                    </td>
                    <td className="p-3 border-r border-encre-noire/10 text-center">
                      <span className="inline-block px-2 py-0.5 bg-cordel-wood/10 text-cordel-wood rounded text-[10px] font-bold">
                        {supply.categorie || '-'}
                      </span>
                    </td>
                    <td className="p-3 border-r border-encre-noire/10">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded border-2 font-black text-sm ${
                          isCritical 
                            ? 'bg-cordel-rouge/10 border-cordel-rouge text-cordel-rouge' 
                            : 'bg-cordel-vert/10 border-cordel-vert text-cordel-vert'
                        }`}>
                          <button onClick={() => adjustSupplyStock(supply.id, -1)} className="hover:opacity-70 active:scale-95 px-1">-</button>
                          <span>{supply.quantiteStock} {supply.unite}</span>
                          <button onClick={() => adjustSupplyStock(supply.id, 1)} className="hover:opacity-70 active:scale-95 px-1">+</button>
                        </div>
                        {isCritical && (
                          <span className="text-[9px] uppercase font-bold text-cordel-rouge">⚠️ Stock Critique</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border-r border-encre-noire/10 text-center">
                      <div className="text-xs font-bold text-encre-noire">{supply.fournisseur || '-'}</div>
                      {supply.conditionnementAchat && <div className="text-[10px] text-cordel-master-dark">{supply.conditionnementAchat}</div>}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-2">
                        {isCritical && (
                          <button 
                            className="w-full px-2 py-1 bg-cordel-ocre text-white rounded text-[10px] font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_#181716] hover:brightness-110 active:translate-y-[1px] active:shadow-none"
                            onClick={() => window.open(supply.urlFournisseur || '#', '_blank')}
                          >
                            🛒 Commander
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(supply.id, supply.nom)}
                          className="p-1.5 bg-cordel-rouge/10 text-cordel-rouge rounded hover:bg-cordel-rouge/20 transition-colors self-center"
                          title="Supprimer"
                        >
                          <XiloClose size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-6 text-sm text-cordel-master-dark border-2 border-dashed border-cordel-master-dark/30 rounded bg-cordel-bg-light">
          Aucune fourniture enregistrée pour le domaine "{domaine}".
        </div>
      )}
    </div>
  );
}
