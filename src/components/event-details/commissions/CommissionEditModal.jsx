import React, { useState } from 'react';
import CommissionBasicInfoFields from './CommissionBasicInfoFields';
import CommissionJalonsSection from './CommissionJalonsSection';
import CommissionBudgetSection from './CommissionBudgetSection';
import CommissionBenevolesSection from './CommissionBenevolesSection';
import CommissionMaterielSection from './CommissionMaterielSection';
import CommissionVaralAction from './CommissionVaralAction';
import { MODULES_COMMISSION_DISPONIBLES } from './commissionUtils';

/**
 * Modale d'édition modulaire d'une commission (Bloc 1 & 2)
 * Configuration générale, tiroirs de modules et action de synchro Varal.
 */
export default function CommissionEditModal({
  commission = null,
  event = null,
  groupId = null,
  allUsers = [],
  usersMap = {},
  canArbitrate = false,
  isOpen,
  onClose,
  onSave
}) {
  const isEditing = Boolean(commission?.id);

  const [formData, setFormData] = useState(() => ({
    titre: commission?.titre || '',
    icone: commission?.icone || '📋',
    description: commission?.description || '',
    referentsIds: commission?.referentsIds || [],
    membresIds: commission?.membresIds || [],
    modulesActifs: commission?.modulesActifs || ['jalons'],
    jalons: commission?.jalons || [],
    budget: commission?.budget || { demande: 0, alloue: 0, statusArbitrage: 'en_etude', motifRefus: '', devis: [] },
    creneauxBenevoles: commission?.creneauxBenevoles || [],
    besoinsMateriel: commission?.besoinsMateriel || []
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  const toggleModule = (moduleId) => {
    const active = formData.modulesActifs.includes(moduleId);
    const updated = active
      ? formData.modulesActifs.filter((m) => m !== moduleId)
      : [...formData.modulesActifs, moduleId];
    setFormData((prev) => ({ ...prev, modulesActifs: updated }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) return;

    try {
      setIsSaving(true);
      await onSave(formData);
      setToastMessage('✅ Commission enregistrée avec succès !');
      setTimeout(() => {
        setToastMessage('');
        onClose();
      }, 700);
    } catch (err) {
      console.error('Erreur enregistrement commission:', err);
      setToastMessage('❌ Erreur lors de l’enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl bg-cordel-bg-light border-2 border-encre-noire rounded-[8px_12px_7px_10px] shadow-[4px_4px_0px_0px_#181716] flex flex-col max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="px-4 py-3 border-b-2 border-encre-noire bg-cordel-bg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{formData.icone}</span>
            <h3 className="text-sm font-black uppercase text-encre-noire">
              {isEditing ? `Édition : ${formData.titre}` : 'Créer une nouvelle commission'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-stone-500 hover:text-black font-black text-sm">✕</button>
        </div>

        {/* Formulaire défilant */}
        <form onSubmit={handleSave} className="p-4 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {toastMessage && (
            <div className="p-2 rounded bg-cordel-bg border border-encre-noire font-black text-center text-xs">
              {toastMessage}
            </div>
          )}

          <CommissionBasicInfoFields
            formData={formData}
            setFormData={setFormData}
            allUsers={allUsers}
          />

          {/* Tiroirs d'activation des modules */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-encre-noire/10">
            <label className="font-bold uppercase text-[10px] text-stone-600">Modules actifs à la carte :</label>
            <div className="flex flex-wrap gap-2">
              {MODULES_COMMISSION_DISPONIBLES.filter((m) => m.id !== 'fiches').map((m) => {
                const isActive = formData.modulesActifs.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    className={`px-2.5 py-1 rounded font-bold border flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire shadow-xs'
                        : 'bg-stone-100 text-stone-600 border-stone-300'
                    }`}
                  >
                    <span>{m.icone}</span>
                    <span>{m.label}</span>
                    <span>{isActive ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sous-sections actives */}
          {formData.modulesActifs.includes('jalons') && (
            <CommissionJalonsSection
              jalons={formData.jalons}
              onChangeJalons={(next) => setFormData({ ...formData, jalons: next })}
              usersMap={usersMap}
            />
          )}

          {formData.modulesActifs.includes('budget') && (
            <CommissionBudgetSection
              budget={formData.budget}
              onChangeBudget={(next) => setFormData({ ...formData, budget: next })}
              canArbitrate={canArbitrate}
            />
          )}

          {formData.modulesActifs.includes('benevoles') && (
            <CommissionBenevolesSection
              creneaux={formData.creneauxBenevoles}
              onChangeCreneaux={(next) => setFormData({ ...formData, creneauxBenevoles: next })}
              usersMap={usersMap}
            />
          )}

          {formData.modulesActifs.includes('materiel') && (
            <CommissionMaterielSection
              besoins={formData.besoinsMateriel}
              onChangeBesoins={(next) => setFormData({ ...formData, besoinsMateriel: next })}
            />
          )}

          {/* Bloc de publication et synchronisation au Varal */}
          {isEditing && event && (
            <div className="pt-1">
              <CommissionVaralAction
                event={event}
                commission={commission}
                usersMap={usersMap}
                groupId={groupId}
                variant="full"
              />
            </div>
          )}

          {/* Pied de formulaire */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-encre-noire/20">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-stone-300 font-bold bg-white text-stone-700 hover:bg-stone-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.titre.trim()}
              className="px-4 py-1.5 font-black rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 disabled:opacity-40 shadow-xs"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer la commission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
