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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="bg-cordel-bg border-4 border-encre-noire rounded-[8px_12px_10px_14px] shadow-[6px_6px_0px_0px_#181716] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête de modale */}
        <div className="flex items-center justify-between p-3.5 bg-cordel-wood text-white border-b-2 border-encre-noire">
          <h3 className="font-black text-base uppercase tracking-wider">
            {editingId ? "✏️ Éditer le matériel" : "➕ Ajouter un matériel"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white cursor-pointer"
          >
            <XiloClose size={18} />
          </button>
        </div>

        {/* Corps du formulaire */}
        <form onSubmit={onSave} className="p-4 flex flex-col gap-3.5 overflow-y-auto text-left">
          {/* Nom du matériel */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-encre-noire uppercase">Nom / Référence *</label>
            <input
              type="text"
              name="nom"
              required
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: Alfaia N°3 (Marquage Rouge)"
              className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:ring-2 focus:ring-cordel-master-dark focus:outline-none"
            />
          </div>

          {/* Type & État */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-encre-noire uppercase">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
              >
                {INSTRUMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-encre-noire uppercase">État</label>
              <select
                name="etat"
                value={formData.etat}
                onChange={handleChange}
                className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
              >
                {ETAT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Propriétaire & Localisation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-encre-noire uppercase">Propriétaire</label>
              <input
                type="text"
                name="proprietaire"
                value={formData.proprietaire}
                onChange={handleChange}
                placeholder="Association ou Nom du membre"
                className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-encre-noire uppercase">Localisation</label>
              <input
                type="text"
                name="localisationPhysique"
                value={formData.localisationPhysique}
                onChange={handleChange}
                placeholder="Ex: Local, Chez Julien..."
                className="p-2 bg-white border border-encre-noire rounded-[4px] text-xs font-bold text-encre-noire focus:outline-none"
              />
            </div>
          </div>

          {/* Statut d'emprunt & Emprunteur */}
          <div className="grid grid-cols-2 gap-3 p-2.5 bg-cordel-bg-light border border-dashed border-cordel-master-dark/20 rounded-[6px]">
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

          {/* Pied de modale : Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20 mt-2">
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
