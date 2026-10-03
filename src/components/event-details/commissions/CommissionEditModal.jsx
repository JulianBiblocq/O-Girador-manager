import React, { useState } from 'react';
import useConfirm from '../../../hooks/useConfirm';
import useModalEscape from '../../../hooks/useModalEscape';
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
  onSave,
  onDelete
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
  const confirm = useConfirm();

  // Fermeture accessible avec touche Échap
  useModalEscape(isOpen, onClose, isSaving);

  if (!isOpen) return null;

  const toggleModule = (modId) => {
    const active = formData.modulesActifs.includes(modId);
    setFormData((prev) => ({
      ...prev,
      modulesActifs: active ? prev.modulesActifs.filter((m) => m !== modId) : [...prev.modulesActifs, modId]
    }));
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Supprimer la commission ?",
      message: "Cette action est irréversible. Les jalons associés seront également effacés.",
      confirmLabel: "Supprimer", cancelLabel: "Annuler", variant: "danger"
    });
    if (!ok) return;

    try {
      setIsSaving(true);
      if (onDelete) await onDelete(commission.id);
      onClose();
    } catch (err) {
      console.error('Erreur suppression commission:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) return;

    try {
      setIsSaving(true);
      await onSave(formData);
      setToastMessage('✅ Commission enregistrée avec succès !');
      setTimeout(() => { setToastMessage(''); onClose(); }, 700);
    } catch (err) {
      console.error('Erreur enregistrement commission:', err);
      setToastMessage('❌ Erreur lors de l’enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl bg-cordel-bg-light border-2 border-encre-noire rounded-[8px_12px_7px_10px] shadow-[4px_4px_0px_0px_#181716] flex flex-col max-h-[90dvh] overflow-hidden">
        {/* En-tête */}
        <div className="shrink-0 px-4 py-3 border-b-2 border-encre-noire bg-cordel-bg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{formData.icone}</span>
            <h3 className="text-sm font-black uppercase text-encre-noire">
              {isEditing ? `Édition : ${formData.titre}` : 'Créer une nouvelle commission'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-stone-500 hover:text-black font-black text-sm shrink-0 cursor-pointer">✕</button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Corps défilant */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 flex flex-col gap-4 text-xs">
          {toastMessage && (
            <div className="p-2 rounded bg-cordel-bg border border-encre-noire font-black text-center text-xs">
              {toastMessage}
            </div>
          )}

          <CommissionBasicInfoFields formData={formData} setFormData={setFormData} allUsers={allUsers} />

          {/* Tiroirs d'activation des modules */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-encre-noire/10">
            <label className="font-bold uppercase text-[10px] text-stone-600">Modules actifs à la carte :</label>
            <div className="flex flex-wrap gap-2">
              {MODULES_COMMISSION_DISPONIBLES.filter((m) => m.id !== 'fiches').map((m) => {
                const isActive = formData.modulesActifs.includes(m.id);
                return (
                  <button
                    key={m.id} type="button" onClick={() => toggleModule(m.id)}
                    className={`px-2.5 py-1 rounded font-bold border flex items-center gap-1.5 ${
                      isActive ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire shadow-xs' : 'bg-stone-100 text-stone-600 border-stone-300'
                    }`}
                  >
                    <span>{m.icone}</span><span>{m.label}</span><span>{isActive ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sous-sections actives */}
          {formData.modulesActifs.includes('jalons') && (
            <CommissionJalonsSection jalons={formData.jalons} onChangeJalons={(next) => setFormData({ ...formData, jalons: next })} usersMap={usersMap} />
          )}

          {formData.modulesActifs.includes('budget') && (
            <CommissionBudgetSection budget={formData.budget} onChangeBudget={(next) => setFormData({ ...formData, budget: next })} canArbitrate={canArbitrate} />
          )}

          {formData.modulesActifs.includes('benevoles') && (
            <CommissionBenevolesSection creneaux={formData.creneauxBenevoles} onChangeCreneaux={(next) => setFormData({ ...formData, creneauxBenevoles: next })} usersMap={usersMap} />
          )}

          {formData.modulesActifs.includes('materiel') && (
            <CommissionMaterielSection besoins={formData.besoinsMateriel} onChangeBesoins={(next) => setFormData({ ...formData, besoinsMateriel: next })} />
          )}

          {/* Bloc de publication et synchronisation au Varal */}
          {isEditing && event && (
            <div className="pt-1">
              <CommissionVaralAction event={event} commission={commission} usersMap={usersMap} groupId={groupId} variant="full" />
            </div>
          )}
          </div>

          {/* Pied de formulaire fixe */}
          <div className="shrink-0 p-4 border-t-2 border-dashed border-encre-noire/20 bg-[var(--theme-bg)] flex items-center justify-between gap-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button" onClick={handleDelete} disabled={isSaving}
                  className="px-2.5 py-1.5 rounded font-black text-xs text-[var(--color-cordel-rouge)] hover:bg-rose-50 border border-transparent hover:border-[var(--color-cordel-rouge)]/30 transition-colors cursor-pointer shrink-0"
                >
                  🗑️ Supprimer la commission
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border border-stone-300 font-bold bg-white text-stone-700 hover:bg-stone-50 cursor-pointer shrink-0">Annuler</button>
              <button type="submit" disabled={isSaving || !formData.titre.trim()} className="px-4 py-1.5 font-black rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 disabled:opacity-40 shadow-xs cursor-pointer shrink-0">
                {isSaving ? 'Enregistrement...' : 'Enregistrer la commission'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
