import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import DependentFormModal from './DependentFormModal';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';
import useConfirm from '../../hooks/useConfirm';

/**
 * Gestionnaire des comptes enfants / dépendants rattachés au profil parent.
 * Si aucun enfant n'est rattaché (0), le bloc est replié par défaut sur une seule ligne.
 */
export default function FamilyMembersManager({
  user,
  profileData,
  instrumentsDisponibles = [],
  t = (k, fb) => fb || k
}) {
  const { confirm } = useConfirm();
  const {
    dependents,
    loading,
    error,
    addDependent,
    updateDependent,
    deleteDependent
  } = useFamilyMembers(user, profileData?.groupId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDependent, setEditingDependent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isExpandedWhenEmpty, setIsExpandedWhenEmpty] = useState(false);

  const handleOpenAddModal = (e) => {
    if (e) e.stopPropagation();
    setEditingDependent(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (dep) => {
    setEditingDependent(dep);
    setModalOpen(true);
  };

  const handleSaveDependent = async (data) => {
    setSaving(true);
    try {
      if (data.id) {
        await updateDependent(data.id, data);
      } else {
        await addDependent(data);
      }
      setModalOpen(false);
      setEditingDependent(null);
    } catch (err) {
      console.error('Erreur enregistrement enfant :', err);
      alert(err.message || "Erreur lors de l'enregistrement du profil rattaché.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDependent = async (dep) => {
    const name = `${dep.prenom} ${dep.nom}`;
    const isOk = await confirm({
      title: 'Supprimer le profil rattaché',
      message: `Voulez-vous vraiment supprimer le profil rattaché de "${name}" ?`,
      confirmText: 'Oui, supprimer',
      cancelText: 'Annuler',
      variant: 'danger'
    });
    if (!isOk) return;
    try {
      await deleteDependent(dep.id);
    } catch (err) {
      console.error('Erreur suppression enfant :', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const isOpen = dependents.length > 0 || isExpandedWhenEmpty;

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-3 flex flex-col gap-3 text-left">
      {/* Barre compacte en 1 ligne (repliée par défaut si 0 enfant) */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsExpandedWhenEmpty((prev) => !prev)}
          className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer select-none"
        >
          <span className="font-black text-[11px] sm:text-xs uppercase tracking-wider text-cordel-wood truncate">
            👨‍👩‍👧 {t('userProfile.familySectionTitle', t('userProfile.familyHeading', 'Ma Famille / Dépendants'))} ({dependents.length})
          </span>
          <span className="text-xs font-black text-cordel-wood shrink-0">{isOpen ? '▴' : '▾'}</span>
        </button>

        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={true}
          onClick={handleOpenAddModal}
          className="text-[10px] py-1 px-2.5 whitespace-nowrap font-black uppercase shrink-0"
        >
          {t('userProfile.btnAddChild')}
        </CordelButton>
      </div>

      {/* Contenu déplié */}
      {isOpen && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/20">
          <p className="text-[11px] text-cordel-master-dark/70">{t('userProfile.familySubtitle')}</p>

          {loading ? (
            <div className="py-3 text-center text-xs text-cordel-master-dark/60 animate-pulse">
              {t('common.loading', 'Chargement...')}
            </div>
          ) : error ? (
            <div className="text-xs text-red-600 font-bold py-2">
              {t('userProfile.errorMsg', 'Erreur de chargement des dépendants.')}
            </div>
          ) : dependents.length === 0 ? (
            <div className="py-3 text-center text-xs italic text-cordel-master-dark/60 border border-dashed border-cordel-master-dark/20 rounded p-3 bg-cordel-bg-light/40">
              {t('userProfile.emptyFamilyNotice')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dependents.map((dep) => {
                const childName = `${dep.prenom || ''} ${dep.nom || ''}`.trim();
                const insts =
                  dep.instrumentsJoues && dep.instrumentsJoues.length > 0
                    ? dep.instrumentsJoues.join(', ')
                    : dep.instrument || 'Aucun';

                return (
                  <div
                    key={dep.id}
                    className="p-2.5 bg-cordel-bg-light/80 border-2 border-encre-noire/30 rounded-[6px_10px_7px_9px] shadow-sm flex items-center justify-between gap-2.5 relative hover:border-encre-noire transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <XiloAvatar src={dep.photoURL} name={childName} size={44} />
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-encre-noire truncate">{childName}</span>
                          <span className="bg-amber-200 text-amber-900 border border-amber-400 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                            👶 Enfant
                          </span>
                        </div>
                        {dep.dateNaissance && (
                          <span className="text-[10px] text-cordel-master-dark/70">🎂 {dep.dateNaissance}</span>
                        )}
                        <span className="text-[10px] text-cordel-wood font-bold truncate">🎵 {insts}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(dep)}
                        className="p-1 text-xs text-cordel-wood hover:bg-black/5 rounded transition-all"
                        title="Modifier ce profil rattaché"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDependent(dep)}
                        className="p-1 text-xs text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Supprimer ce profil rattaché"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <DependentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveDependent}
        initialData={editingDependent}
        instrumentsDisponibles={instrumentsDisponibles}
        saving={saving}
        t={t}
      />
    </CordelCard>
  );
}
