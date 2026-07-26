import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import DependentFormModal from './DependentFormModal';
import { useFamilyMembers } from '../../hooks/useFamilyMembers';

export default function FamilyMembersManager({
  user,
  profileData,
  instrumentsDisponibles = [],
  t = (k, fb) => fb || k
}) {
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

  const handleOpenAddModal = () => {
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
      console.error("Erreur enregistrement enfant :", err);
      alert(err.message || "Erreur lors de l'enregistrement du profil rattaché.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDependent = async (dep) => {
    const name = `${dep.prenom} ${dep.nom}`;
    if (!window.confirm(`Voulez-vous vraiment supprimer le profil rattaché de "${name}" ?`)) {
      return;
    }
    try {
      await deleteDependent(dep.id);
    } catch (err) {
      console.error("Erreur suppression enfant :", err);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4 text-left mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 gap-2">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>👨‍👩‍👧‍👦</span> {t('userProfile.familyHeading', "Ma Famille / Comptes rattachés")}
          </h3>
          <p className="text-[11px] text-cordel-master-dark/70 mt-0.5">
            Gérez ici les profils de vos enfants sans smartphone ni email. Ils figureront dans le Trombinoscope et le Casting.
          </p>
        </div>

        <CordelButton
          type="button"
          variant="ocre"
          onClick={handleOpenAddModal}
          className="text-xs py-1.5 px-3 whitespace-nowrap self-start sm:self-auto font-bold"
        >
          ➕ Ajouter un enfant
        </CordelButton>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-4 text-center text-xs text-cordel-master-dark/60 animate-pulse">
          Chargement des comptes rattachés...
        </div>
      ) : error ? (
        <div className="text-xs text-red-600 font-bold py-2">
          Erreur de chargement des dépendants.
        </div>
      ) : dependents.length === 0 ? (
        <div className="py-4 text-center text-xs italic text-cordel-master-dark/60 border border-dashed border-cordel-master-dark/20 rounded p-4 bg-cordel-bg-light/40">
          Aucun compte enfant rattaché à ce profil. Cliquez sur "Ajouter un enfant" pour en créer un.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dependents.map((dep) => {
            const childName = `${dep.prenom || ''} ${dep.nom || ''}`.trim();
            const insts = dep.instrumentsJoues && dep.instrumentsJoues.length > 0
              ? dep.instrumentsJoues.join(', ')
              : dep.instrument || 'Aucun';

            return (
              <div
                key={dep.id}
                className="p-3 bg-cordel-bg-light/80 border-2 border-encre-noire/30 rounded-[6px_10px_7px_9px] shadow-sm flex items-center justify-between gap-3 relative hover:border-encre-noire transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <XiloAvatar src={dep.photoURL} name={childName} size={48} />
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs text-encre-noire truncate">
                        {childName}
                      </span>
                      <span className="bg-amber-200 text-amber-900 border border-amber-400 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                        👶 Enfant
                      </span>
                    </div>

                    {dep.dateNaissance && (
                      <span className="text-[10px] text-cordel-master-dark/70">
                        🎂 {dep.dateNaissance}
                      </span>
                    )}

                    <span className="text-[10px] text-cordel-wood font-bold truncate">
                      🎵 {insts}
                    </span>

                    <span className="text-[9px] text-cordel-master-dark opacity-80">
                      Niveau: {dep.niveau === 'confirme' ? '🏆 Confirmé' : dep.niveau === 'debutant' ? '🌱 Débutant' : 'Aucun'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(dep)}
                    className="p-1.5 text-xs text-cordel-wood hover:bg-black/5 rounded transition-all"
                    title="Modifier ce profil rattaché"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDependent(dep)}
                    className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-all"
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

      {/* Modal */}
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
