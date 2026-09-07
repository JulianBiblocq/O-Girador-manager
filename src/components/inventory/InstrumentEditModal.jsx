import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import XiloAvatar from '../XiloAvatar';
import { INSTRUMENT_TYPES, ETAT_OPTIONS } from './inventoryConstants';

/**
 * Modale / Formulaire complet d'ajout et d'édition d'un instrument,
 * incluant le kit d'accessoires, les assignations et la nomenclature.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen Indique si le formulaire est visible
 * @param {Function} props.onClose Callback de fermeture
 * @param {string|null} props.editingId Identifiant de l'instrument en cours d'édition (ou null en ajout)
 * @param {Object} props.formData État du formulaire
 * @param {Function} props.setFormData Setter d'état du formulaire
 * @param {Function} props.onInputChange Gestionnaire de changement des inputs standards
 * @param {Function} props.onAssignationToggle Gestionnaire de bascule d'assignation d'un membre
 * @param {Function} props.onSave Callback de soumission du formulaire
 * @param {Function} props.onDelete Callback de suppression (en mode édition)
 * @param {boolean} props.saving État de chargement / sauvegarde en cours
 * @param {Array} props.usersList Liste des membres du groupe
 * @param {Array} props.instrumentModels Modèles de fabrication du catalogue lutherie
 * @param {Array} props.inventoryParts Pièces détachées de l'inventaire
 * @param {Array} props.logisticsKits Kits logistiques configurés
 * @param {Array} props.supplies Matières premières / fournitures pour le contrôle des stocks
 * @param {Function} props.t Fonction de traduction
 */
export default function InstrumentEditModal({
  isOpen = false,
  onClose,
  editingId = null,
  formData = {},
  setFormData,
  onInputChange,
  onAssignationToggle,
  onSave,
  onDelete,
  saving = false,
  usersList = [],
  instrumentModels = [],
  inventoryParts = [],
  logisticsKits = [],
  supplies = [],
  t
}) {
  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSave) onSave(e);
  };

  const activeKit = (logisticsKits || []).find((k) => k.pupitre === formData.type);
  const kitAccessories = activeKit?.accessories || [];
  const checkedKitItems = formData.kitChecklist || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl my-auto select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 relative max-h-[90vh] overflow-y-auto">
          {/* Bouton Fermeture Rapide */}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="absolute top-3 right-3 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded-md shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center disabled:opacity-50"
            title="Fermer le formulaire"
          >
            <XiloClose size={10} />
          </button>

          {/* Titre Cordel */}
          <h3 className="panel-title text-sm font-bold text-cordel-wood mb-4">
            {editingId 
              ? (t && t('inventory.editTitle')) || "Modifier l'instrument" 
              : (t && t('inventory.addTitle')) || "Ajouter un nouvel instrument"}
          </h3>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3.5 text-left">
            {/* Nom / Numéro d'inventaire */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {(t && t('inventory.instNameLabel')) || "Nom / Numéro d'inventaire"}
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom || ''}
                onChange={onInputChange}
                required
                placeholder={(t && t('inventory.instNamePlaceholder')) || "ex: Alfaia #01, Caixa 12\"..."}
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5"
              />
            </div>

            {/* Type / Famille et Modèle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-3">
                {/* Type de pupitre */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {(t && t('inventory.instTypeLabel')) || "Famille / Pupitre"}
                  </label>
                  <select
                    name="type"
                    value={formData.type || 'Alfaia'}
                    onChange={onInputChange}
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  >
                    {INSTRUMENT_TYPES.map((tOpt) => (
                      <option key={tOpt} value={tOpt}>{tOpt}</option>
                    ))}
                  </select>
                </div>

                {/* Modèle d'Instrument (Fabrication / Lutherie) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Modèle d'Instrument (Fabrication)
                  </label>
                  <select
                    name="modelId"
                    value={formData.modelId || ''}
                    onChange={onInputChange}
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  >
                    <option value="">-- Aucun modèle spécifique --</option>
                    {instrumentModels.map((m) => (
                      <option key={m.id} value={m.id}>{m.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* État physique */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    État physique
                  </label>
                  <select
                    name="etat"
                    value={formData.etat || 'Bon'}
                    onChange={onInputChange}
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  >
                    {ETAT_OPTIONS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Kit Accessoires Dynamique */}
            <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-cordel-master-dark/15">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark mb-1 flex items-center justify-between">
                <span>Kit / Accessoires associés</span>
                {kitAccessories.length > 0 && (
                  <span className="text-[9px] bg-cordel-master-dark/10 px-1 rounded text-cordel-master-dark font-bold">
                    {checkedKitItems.filter((accId) => 
                      kitAccessories.some((k) => (typeof k === 'string' ? k === accId : k.supplyId === accId))
                    ).length}/{kitAccessories.length}
                  </span>
                )}
              </label>

              <div className="flex flex-col gap-1.5 p-2 bg-cordel-bg-light/50 border border-encre-noire/10 rounded">
                {kitAccessories.length === 0 ? (
                  <span className="text-[9px] text-stone-500 italic mt-1">
                    Aucun kit d'accessoires configuré pour ce pupitre.
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {kitAccessories.map((acc) => {
                      const supplyId = typeof acc === 'string' ? acc : acc.supplyId;
                      const fallbackName = typeof acc === 'string' ? acc : acc.name;
                      const isChecked = checkedKitItems.includes(supplyId);
                      const supplyInfo = supplies.find((s) => s.id === supplyId);
                      const supplyName = supplyInfo ? supplyInfo.nom : fallbackName;
                      const stockCount = supplyInfo ? supplyInfo.quantiteStock : '?';

                      return (
                        <label
                          key={supplyId}
                          className={`flex items-center gap-1.5 p-1 px-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                            isChecked
                              ? 'bg-cordel-master-light/20 border-cordel-master-dark/30 text-cordel-wood shadow-xs'
                              : 'bg-white dark:bg-stone-800 border-encre-noire/15 text-encre-noire/70 hover:bg-stone-50'
                          }`}
                          title={supplyInfo ? `Stock disponible : ${stockCount}` : ''}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newChecked = e.target.checked
                                ? [...checkedKitItems, supplyId]
                                : checkedKitItems.filter((id) => id !== supplyId);
                              if (setFormData) {
                                setFormData((prev) => ({ ...prev, kitChecklist: newChecked }));
                              }
                            }}
                            disabled={saving}
                            className="w-3.5 h-3.5 text-cordel-wood rounded cursor-pointer"
                          />
                          <span>{supplyName}</span>
                          {!isChecked && supplyInfo && (
                            <span className={`text-[8px] opacity-70 ${stockCount <= 0 ? 'text-red-600 font-black' : ''}`}>
                              ({stockCount})
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Propriétaire */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Propriétaire
              </label>
              <select
                name="proprietaire"
                value={formData.proprietaire || 'Association'}
                onChange={onInputChange}
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="Association">🏢 Association</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>Personnel : {u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>

            {/* Localisation Physique */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Localisation Physique
              </label>
              <select
                name="localisationPhysique"
                value={formData.localisationPhysique || 'Local'}
                onChange={onInputChange}
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="Local">📍 Local de l'association</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>Chez : {u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>

            {/* Statut de l'instrument */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Statut de l'instrument
              </label>
              <select
                name="status"
                value={formData.status || 'En stock'}
                onChange={onInputChange}
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="En stock">En stock</option>
                <option value="Emprunté">Emprunté</option>
                <option value="En réparation">En réparation</option>
              </select>
            </div>

            {/* Emprunteur (si statut === 'Emprunté') */}
            {formData.status === 'Emprunté' && (
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Membre emprunteur
                </label>
                <select
                  name="borrowedBy"
                  value={formData.borrowedBy || ''}
                  onChange={onInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  <option value="">-- Non spécifié --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Assignations (Membres désignés) */}
            <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-2">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Assignations (Membres réguliers désignés)
              </label>
              <div className="max-h-28 overflow-y-auto border border-dashed border-encre-noire/25 rounded p-2 flex flex-wrap gap-1.5 bg-[#fdfaf2] dark:bg-[#201d1a]">
                {usersList.length === 0 ? (
                  <span className="text-[10px] opacity-60 font-semibold">Aucun membre disponible</span>
                ) : (
                  usersList.map((u) => {
                    const isAssigned = (formData.assignations || []).includes(u.id);
                    const fullName = `${u.prenom} ${u.nom}`;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        disabled={saving}
                        onClick={() => onAssignationToggle && onAssignationToggle(u.id)}
                        className={`text-[9px] px-2 py-0.5 border rounded-[3px_5px_2px_4px] transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                          isAssigned
                            ? 'bg-cordel-wood text-cordel-bg-light border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                            : 'bg-transparent text-encre-noire border-dashed border-encre-noire/30'
                        }`}
                      >
                        {isAssigned && "🪢 "}
                        <XiloAvatar src={u.photoURL} name={fullName} size={14} />
                        <span>{fullName}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Nomenclature (Pièces détachées assignées) */}
            <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-2">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Nomenclature (Pièces détachées assignées à l'instrument)
              </label>
              <div className="max-h-32 overflow-y-auto border border-dashed border-encre-noire/25 rounded p-2 flex flex-col gap-1.5 bg-[#fdfaf2] dark:bg-[#201d1a]">
                {(() => {
                  const availableParts = (inventoryParts || []).filter(
                    (p) => p.status === 'En stock' || (formData.nomenclature || []).includes(p.id)
                  );
                  if (availableParts.length === 0) {
                    return <span className="text-[10px] opacity-60 font-semibold">Aucune pièce disponible en stock.</span>;
                  }
                  return availableParts.map((part) => {
                    const isSelected = (formData.nomenclature || []).includes(part.id);
                    return (
                      <label
                        key={part.id}
                        className={`flex items-center justify-between gap-2 p-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                          isSelected
                            ? 'bg-cordel-wood/10 border-cordel-wood text-cordel-wood'
                            : 'bg-transparent border-transparent hover:bg-black/5 text-encre-noire'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const nom = formData.nomenclature || [];
                              const newNom = e.target.checked
                                ? [...nom, part.id]
                                : nom.filter((id) => id !== part.id);
                              if (setFormData) {
                                setFormData((prev) => ({ ...prev, nomenclature: newNom }));
                              }
                            }}
                            disabled={saving}
                            className="w-3.5 h-3.5 text-cordel-wood rounded cursor-pointer"
                          />
                          <span>{part.nom}</span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-white/50 dark:bg-stone-800/50 border border-encre-noire/20 rounded text-[8px] uppercase tracking-wider opacity-80">
                          {part.typePiece}
                        </span>
                      </label>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Pied du formulaire : Boutons d'action */}
            <div className="flex justify-between items-center mt-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
              {editingId ? (
                <button
                  type="button"
                  onClick={() => onDelete && onDelete(editingId)}
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
                  onClick={onClose}
                  className="text-xs px-3 py-1.5"
                >
                  Annuler
                </CordelButton>
                <CordelButton
                  type="submit"
                  variant="ocre"
                  useExtremeBorder={true}
                  disabled={saving || !formData.nom?.trim()}
                  className="text-xs px-4 py-1.5 font-bold"
                >
                  {saving ? "..." : "Enregistrer"}
                </CordelButton>
              </div>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
