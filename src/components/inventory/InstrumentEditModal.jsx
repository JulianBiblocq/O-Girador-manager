import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import XiloAvatar from '../XiloAvatar';
import { INSTRUMENT_TYPES, ETAT_OPTIONS, getAvailableInstrumentTypes } from './inventoryConstants';
import InstrumentAttributionSection from './InstrumentAttributionSection';
import { useTranslation } from '../LanguageContext';
import useModalEscape from '../../hooks/useModalEscape';

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
 * @param {Array} [props.availableInstrumentTypes] Liste dynamique des types de pupitres/instruments
 * @param {Object} [props.associationData] Données de configuration de l'association
 * @param {string} [props.universeId] Identifiant de l'univers culturel actif
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
  availableInstrumentTypes: propAvailableTypes,
  associationData,
  universeId,
  t: propT
}) {
  const { t: hookT } = useTranslation();
  const t = propT || hookT;

  // Fermeture accessible avec touche Échap
  useModalEscape(isOpen, onClose, saving);

  // Résolution dynamique des types d'instruments (Priorité 1: Asso, Priorité 2: Univers, Priorité 3: INSTRUMENT_TYPES)
  const availableTypes = React.useMemo(() => {
    const list = Array.isArray(propAvailableTypes) && propAvailableTypes.length > 0
      ? [...propAvailableTypes]
      : getAvailableInstrumentTypes(associationData, universeId);
    
    // Si le type actuel de l'instrument n'est pas dans la liste, l'inclure avant 'Autre'
    if (formData.type && !list.some(t => t.toLowerCase() === formData.type.toLowerCase())) {
      const autreIdx = list.indexOf('Autre');
      if (autreIdx !== -1) {
        list.splice(autreIdx, 0, formData.type);
      } else {
        list.push(formData.type);
      }
    }
    return list;
  }, [propAvailableTypes, associationData, universeId, formData.type]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSave) onSave(e);
  };

  const activeKit = (logisticsKits || []).find((k) => 
    (k.pupitre || '').trim().toLowerCase() === (formData.type || '').trim().toLowerCase()
  );
  const kitAccessories = activeKit?.accessories || [];
  const checkedKitItems = formData.kitChecklist || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-lg bg-[var(--theme-bg)] border-2 border-encre-noire shadow-2xl overflow-hidden text-left mt-2 sm:mt-0">
        {/* 1. Header (Fixe) */}
        <div className="shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/30 flex items-start justify-between gap-3 bg-cordel-bg-light">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-bold text-cordel-wood uppercase tracking-wider break-words">
              {editingId 
                ? (t && t('inventory.editTitle')) || "Modifier l'instrument" 
                : (t && t('inventory.addTitle')) || "Ajouter un nouvel instrument"}
            </h3>
          </div>

          {/* Bouton Fermeture Rapide */}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-cordel-wood hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation disabled:opacity-50"
            title={t('logistics.closeFormTitle')}
            aria-label={t('common.close', 'Fermer')}
          >
            <XiloClose size={18} />
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 flex flex-col gap-3.5 text-left">
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
                    value={formData.type || availableTypes[0] || 'Alfaia'}
                    onChange={onInputChange}
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  >
                    {availableTypes.map((tOpt) => (
                      <option key={tOpt} value={tOpt}>{tOpt}</option>
                    ))}
                  </select>
                </div>

                {/* Modèle d'Instrument (Fabrication / Lutherie) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('logistics.instrumentModelFabrication')}
                  </label>
                  <select
                    name="modelId"
                    value={formData.modelId || ''}
                    onChange={onInputChange}
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  >
                    <option value="">{t('logistics.noSpecificModel')}</option>
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
                    {t('logistics.physicalState')}
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
                <span>{t('logistics.kitAssociatedAccessories')}</span>
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
                    {t('logistics.noKitConfiguredForPupitre')}
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
                {t('logistics.fieldProprietaire')}
              </label>
              <select
                name="proprietaire"
                value={formData.proprietaire || 'Association'}
                onChange={onInputChange}
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="Association">{t('logistics.ownerAssociation')}</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>{t('logistics.ownerPersonalPrefix')} {u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>

            {/* Localisation Physique */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('logistics.physicalLocation')}
              </label>
              <select
                name="localisationPhysique"
                value={formData.localisationPhysique || 'Local'}
                onChange={onInputChange}
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="Local">{t('logistics.locationLocalAssoc')}</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>{t('logistics.locationAtMemberPrefixColon')} {u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>

            {/* Statut de l'instrument */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('logistics.instrumentStatusField')}
              </label>
              <select
                name="status"
                value={formData.status || 'En stock'}
                onChange={onInputChange}
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="En stock">{t('logistics.statusInStock')}</option>
                <option value="Emprunté">{t('logistics.statusBorrowed')}</option>
                <option value="En réparation">{t('logistics.statusInRepair')}</option>
              </select>
            </div>

            {/* Emprunteur (si statut === 'Emprunté') */}
            {formData.status === 'Emprunté' && (
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('logistics.borrowingMemberField')}
                </label>
                <select
                  name="borrowedBy"
                  value={formData.borrowedBy || ''}
                  onChange={onInputChange}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                >
                  <option value="">{t('logistics.notSpecified')}</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Régime d'attribution et Gestion du Dépôt de garantie / Caution */}
            <InstrumentAttributionSection
              formData={formData}
              setFormData={setFormData}
              saving={saving}
              t={t}
            />

            {/* Assignations (Membres désignés) */}
            <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-2">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('logistics.assignationsDesignatedMembers')}
              </label>
              <div className="max-h-28 overflow-y-auto border border-dashed border-encre-noire/25 rounded p-2 flex flex-wrap gap-1.5 bg-[#fdfaf2] dark:bg-[#201d1a]">
                {usersList.length === 0 ? (
                  <span className="text-[10px] opacity-60 font-semibold">{t('logistics.noMemberAvailable')}</span>
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
                {t('logistics.nomenclatureAssignedParts')}
              </label>
              <div className="max-h-32 overflow-y-auto border border-dashed border-encre-noire/25 rounded p-2 flex flex-col gap-1.5 bg-[#fdfaf2] dark:bg-[#201d1a]">
                {(() => {
                  const availableParts = (inventoryParts || []).filter(
                    (p) => p.status === 'En stock' || (formData.nomenclature || []).includes(p.id)
                  );
                  if (availableParts.length === 0) {
                    return <span className="text-[10px] opacity-60 font-semibold">{t('logistics.noPartAvailableInStock')}</span>;
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

            {/* Historique des mouvements et prêts de l'instrument */}
            {formData.historiqueMouvements && formData.historiqueMouvements.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-2">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('logistics.movementHistoryPrefix', { count: formData.historiqueMouvements.length })}
                </label>
                <div className="max-h-28 overflow-y-auto border border-dashed border-encre-noire/25 rounded p-2 flex flex-col gap-1.5 bg-[#fdfaf2] dark:bg-[#201d1a]">
                  {formData.historiqueMouvements.slice().reverse().map((mvt, mIdx) => {
                    const fromUser = usersList.find(u => u.id === mvt.fromUserId);
                    const toUser = usersList.find(u => u.id === mvt.toUserId);
                    const dateStr = mvt.date ? new Date(mvt.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                    return (
                      <div key={mIdx} className="text-[9px] flex items-center justify-between gap-1 p-1 bg-white/70 dark:bg-stone-800 rounded border border-encre-noire/10">
                        <span className="font-bold text-cordel-wood">{mvt.action || 'Mouvement'}</span>
                        <span className="text-stone-600 truncate max-w-[200px]">
                          {toUser ? `${toUser.prenom} ${toUser.nom}` : fromUser ? `De ${fromUser.prenom} ${fromUser.nom}` : ''}
                        </span>
                        <span className="text-[8px] text-stone-400 font-mono shrink-0">{dateStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* 3. Pied du formulaire : Boutons d'action (Fixe) */}
          <div className="shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 bg-[var(--theme-bg)] flex justify-between items-center gap-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
            {editingId ? (
              <button
                type="button"
                onClick={() => onDelete && onDelete(editingId)}
                disabled={saving}
                className="text-[9px] font-black uppercase tracking-wider bg-cordel-wood text-cordel-bg-light px-3 py-1.5 border border-encre-noire rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {t('logistics.btnRemove')}
              </button>
            ) : <div />}

            <div className="flex gap-2 shrink-0">
              <CordelButton
                type="button"
                variant="default"
                disabled={saving}
                onClick={onClose}
                className="text-xs px-3 py-1.5 shrink-0"
              >
                {t('logistics.btnCancel')}
              </CordelButton>
              <CordelButton
                type="submit"
                variant="vert"
                useExtremeBorder={true}
                disabled={saving || !formData.nom?.trim()}
                className="text-xs px-4 py-1.5 font-bold shrink-0"
              >
                {saving ? "..." : (t('common.save') || "Enregistrer")}
              </CordelButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
