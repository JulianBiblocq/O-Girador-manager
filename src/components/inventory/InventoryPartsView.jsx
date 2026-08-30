import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose, XiloChisel } from '../XiloIcons';

const PART_TYPES = ['Fût', 'Cerclage', 'Peau', 'Corde', 'Couronne', 'Autre'];
const ETAT_OPTIONS = ['Neuf', 'Bon', 'Usé', 'À réparer', 'Au rebut'];
const STATUS_OPTIONS = ['En stock', 'Assemblé'];

export default function InventoryPartsView({
  inventoryParts,
  instrumentModels = [],
  isPartFormOpen,
  setIsPartFormOpen,
  editingPartId,
  partFormData,
  handlePartInputChange,
  handleOpenPartAdd,
  handleOpenPartEdit,
  handleSavePart,
  handleDeletePart,
  saving,
  t
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParts = inventoryParts.filter(part => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      (part.nom && part.nom.toLowerCase().includes(lowerQuery)) ||
      (part.typePiece && part.typePiece.toLowerCase().includes(lowerQuery))
    );
  });

  const selectedModel = instrumentModels.find(m => m.id === partFormData.modelId);

  return (
    <div className="flex flex-col gap-4 text-left">
      {isPartFormOpen ? (
        <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 relative">
          <button
            type="button"
            onClick={() => setIsPartFormOpen(false)}
            disabled={saving}
            className="absolute top-3 right-3 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded-md shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            <XiloClose size={10} />
          </button>

          <h3 className="panel-title text-sm font-bold text-cordel-wood mb-4">
            {editingPartId ? "Modifier une pièce" : "Ajouter une pièce détachée"}
          </h3>

          <form onSubmit={handleSavePart} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Nom / Référence de la pièce
              </label>
              <input
                type="text"
                name="nom"
                value={partFormData.nom}
                onChange={handlePartInputChange}
                required
                placeholder="Ex: Fût Alfaia 18 pouces"
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Modèle d'instrument (Ref)
                </label>
                <select
                  name="modelId"
                  value={partFormData.modelId || ''}
                  onChange={handlePartInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  <option value="">-- Indépendant --</option>
                  {instrumentModels.map(m => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Pièce du modèle
                </label>
                <select
                  name="partId"
                  value={partFormData.partId || ''}
                  onChange={(e) => {
                     handlePartInputChange(e);
                     // Auto-fill part name and type if empty or generic
                     const partObj = selectedModel?.parts?.find(p => p.id === e.target.value);
                     if (partObj) {
                       if (!partFormData.nom || partFormData.nom.includes("Pièce")) {
                         handlePartInputChange({ target: { name: 'nom', value: `${partObj.nom} - ${selectedModel.nom}` } });
                       }
                     }
                  }}
                  disabled={saving || !selectedModel}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  <option value="">-- Sélectionnez une pièce --</option>
                  {selectedModel?.parts?.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Catégorie (Type)
                </label>
                <select
                  name="typePiece"
                  value={partFormData.typePiece}
                  onChange={handlePartInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  {PART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  État
                </label>
                <select
                  name="etat"
                  value={partFormData.etat}
                  onChange={handlePartInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  {ETAT_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Statut
              </label>
              <select
                name="status"
                value={partFormData.status}
                onChange={handlePartInputChange}
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex justify-between items-center mt-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
              {editingPartId ? (
                <button
                  type="button"
                  onClick={() => handleDeletePart(editingPartId)}
                  disabled={saving}
                  className="text-[9px] font-black uppercase tracking-wider bg-cordel-wood text-cordel-bg-light px-3 py-1.5 border border-encre-noire rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  🗑️ Retirer
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <CordelButton
                  type="button"
                  variant="default"
                  disabled={saving}
                  onClick={() => setIsPartFormOpen(false)}
                  className="text-xs px-3 py-1.5"
                >
                  Annuler
                </CordelButton>
                <CordelButton
                  type="submit"
                  variant="ocre"
                  useExtremeBorder={true}
                  disabled={saving || !partFormData.nom.trim()}
                  className="text-xs px-4 py-1.5 font-bold"
                >
                  {saving ? "..." : "Enregistrer"}
                </CordelButton>
              </div>
            </div>
          </form>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-cordel-bg border-2 border-encre-noire p-2 rounded-[5px_4px_6px_3px] shadow-[2px_2px_0px_0px_#181716]">
            <input
              type="text"
              placeholder="Rechercher une pièce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="theme-input text-xs py-1.5 px-3 w-64 border-none shadow-none bg-transparent"
            />
            <CordelButton
              variant="ocre"
              onClick={handleOpenPartAdd}
              className="text-xs px-3 py-1.5 font-bold"
            >
              + Ajouter Pièce
            </CordelButton>
          </div>

          <div className="w-full max-h-[calc(100vh-280px)] overflow-x-auto overflow-y-auto border-2 border-encre-noire rounded-[6px_4px_5px_3px] shadow-[2px_2px_0px_0px_#181716] bg-cordel-card-bg relative">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead className="bg-cordel-bg-light border-b-2 border-encre-noire text-[10px] uppercase tracking-wider text-cordel-wood font-black select-none sticky top-0 z-20">
                <tr>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 left-0 bg-cordel-bg-light z-30">Nom / Réf</th>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 z-20">Type</th>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 z-20">État</th>
                  <th className="p-3 border-r border-encre-noire/15 sticky top-0 z-20">Statut</th>
                  <th className="p-3 text-right sticky top-0 z-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-xs opacity-60 font-bold italic">
                      Aucune pièce détachée trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map(part => (
                    <tr key={part.id} className="border-b border-dashed border-encre-noire/20 hover:bg-black/5 transition-colors">
                      <td className="p-2 border-r border-encre-noire/10 font-bold sticky left-0 bg-cordel-card-bg z-10 shadow-[1px_0_0_0_rgba(24,23,22,0.1)]">
                        {part.nom}
                        {part.modelId && (
                          <div className="text-[9px] text-cordel-master-dark opacity-80 mt-0.5">
                            Modèle : {instrumentModels.find(m => m.id === part.modelId)?.nom || 'Inconnu'}
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r border-encre-noire/10">
                        {part.typePiece}
                      </td>
                      <td className="p-2 border-r border-encre-noire/10">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          part.etat === 'Neuf' ? 'bg-cordel-vert/10 text-cordel-vert border-cordel-vert/30' :
                          part.etat === 'Bon' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                          part.etat === 'Usé' ? 'bg-cordel-ocre/10 text-cordel-ocre border-cordel-ocre/30' :
                          'bg-cordel-rouge/10 text-cordel-rouge border-cordel-rouge/30'
                        }`}>
                          {part.etat}
                        </span>
                      </td>
                      <td className="p-2 border-r border-encre-noire/10">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          part.status === 'En stock' ? 'bg-green-100 text-green-800 border-green-300' :
                          'bg-gray-100 text-gray-600 border-gray-300'
                        }`}>
                          {part.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenPartEdit(part)}
                            className="p-1.5 border border-encre-noire bg-cordel-bg-light hover:bg-cordel-hover text-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                          >
                            <XiloChisel size={10} />
                          </button>
                          <button
                            onClick={() => handleDeletePart(part.id)}
                            className="p-1.5 border border-red-700 bg-red-50 hover:bg-red-100 text-red-700 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer text-[10px]"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
