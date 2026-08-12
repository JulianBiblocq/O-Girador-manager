import React from 'react';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';

const INSTRUMENT_TYPES = ['Alfaia', 'Caixa', 'Agbê', 'Gonguê', 'Mineiro', 'Apito', 'Timbal', 'Autre'];
const ETAT_OPTIONS = ['Neuf', 'Bon', 'À réparer'];

/**
 * Modale de création et de modification d'un matériel dans l'inventaire.
 *
 * @param {Object} props Propriétés du composant
 * @param {boolean} props.isOpen État d'ouverture de la modale
 * @param {Function} props.onClose Callback de fermeture
 * @param {Object} props.formData Données du formulaire
 * @param {Function} props.setFormData Setter du formulaire
 * @param {boolean} props.saving État de sauvegarde en cours
 * @param {string|null} props.editingId ID de l'élément en cours d'édition (null si création)
 * @param {Array} props.usersList Liste des membres pour l'emprunteur et assignations
 * @param {Function} props.onSave Callback de sauvegarde du formulaire
 * @param {Function} props.t Fonction de traduction
 */
export default function InventoryFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  saving,
  editingId,
  usersList,
  onSave,
  t
}) {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignationToggle = (userId) => {
    setFormData(prev => {
      const copy = [...prev.assignations];
      const index = copy.indexOf(userId);
      if (index > -1) {
        copy.splice(index, 1);
      } else {
        copy.push(userId);
      }
      return { ...prev, assignations: copy };
    });
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-cordel-bg border-4 border-encre-noire shadow-2xl overflow-hidden text-left">
        {/* 1. En-tête de modale (Fixe) */}
        <div className="flex-shrink-0 p-3.5 bg-cordel-wood text-white border-b-2 border-encre-noire flex items-center justify-between">
          <h3 className="font-black text-base uppercase tracking-wider">
            {editingId ? "✏️ Éditer le matériel" : "➕ Ajouter un matériel"}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-black/20 rounded transition-colors text-white cursor-pointer"
            title="Fermer (Échap)"
          >
            <XiloClose className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={onSave} className="flex flex-col flex-1 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Nom du matériel */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-encre-noire uppercase">Nom du matériel *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="ex: Alfaia 18, Caixa 12"
                className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
              />
            </div>

            {/* Type et Numéro de série */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-encre-noire uppercase">Type d'instrument *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
                >
                  {INSTRUMENT_TYPES.map(tOption => (
                    <option key={tOption} value={tOption}>{tOption}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-encre-noire uppercase">Numéro de série / Code</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="ex: ALF-004"
                  className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold font-mono text-encre-noire focus:outline-none"
                />
              </div>
            </div>

            {/* État et Emplacement */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-encre-noire uppercase">État</label>
                <select
                  name="etat"
                  value={formData.etat}
                  onChange={handleChange}
                  className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
                >
                  {ETAT_OPTIONS.map(eOption => (
                    <option key={eOption} value={eOption}>{eOption}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-encre-noire uppercase">Emplacement habituel</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="ex: Local asso, Étagère A"
                  className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
                />
              </div>
            </div>

            {/* Étui */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              <input
                type="checkbox"
                name="etuiFourni"
                checked={formData.etuiFourni || false}
                onChange={(e) => setFormData(prev => ({ ...prev, etuiFourni: e.target.checked }))}
                id="etuiFourniModalInput"
                className="w-4 h-4 text-cordel-wood rounded cursor-pointer"
              />
              <label htmlFor="etuiFourniModalInput" className="text-xs font-black text-encre-noire uppercase cursor-pointer select-none">
                Étui / Housse fourni(e)
              </label>
            </div>

            {/* Membres assignés à ce matériel */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-xs font-black text-encre-noire uppercase">
                Assignation à des membres de l'association
              </label>
              <div className="max-h-32 overflow-y-auto border border-encre-noire rounded-[4px] p-2 bg-white flex flex-col gap-1">
                {usersList.length === 0 ? (
                  <span className="text-[11px] text-stone-500 italic">Aucun membre dans le groupe.</span>
                ) : (
                  usersList.map(u => {
                    const isAssigned = (formData.assignations || []).includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2 p-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                          isAssigned ? 'bg-cordel-master-light/50 text-cordel-wood' : 'hover:bg-stone-100 text-encre-noire'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleAssignationToggle(u.id)}
                          className="w-4 h-4 text-cordel-wood rounded cursor-pointer"
                        />
                        <span>{u.prenom} {u.nom}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Statut d'emprunt et Emprunteur actuel */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-dashed border-cordel-master-dark/20">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black text-encre-noire uppercase">Statut d'emprunt</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
                >
                  <option value="En stock">En stock</option>
                  <option value="Emprunté">Emprunté</option>
                </select>
              </div>

              {formData.status === 'Emprunté' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black text-encre-noire uppercase">Emprunté par</label>
                  <select
                    name="borrowedBy"
                    value={formData.borrowedBy || ''}
                    onChange={handleChange}
                    className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
                  >
                    <option value="">Sélectionner un membre...</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 3. Pied de modale : Actions (Fixe en bas) */}
          <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/20 flex items-center justify-end gap-2 bg-cordel-bg">
            <CordelButton variant="default" onClick={onClose} type="button" className="px-3 py-1.5 text-xs">
              Annuler
            </CordelButton>
            <CordelButton variant="vert" type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-black">
              {saving ? "Sauvegarde..." : "Enregistrer"}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
