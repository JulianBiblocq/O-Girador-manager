import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
import { useTranslation } from '../LanguageContext';
import { batchMigrateUserCategories, DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';
import { db } from '../../firebase';

/**
 * Composant de gestion des Catégories de Pratique (Niveaux / Sections de la troupe)
 * Dédié au Pôle Mestria (Direction Pédagogique et Artistique).
 */
export default function MestreCustomCategories({ groupId, onBack }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  // Chargement des données de l'association
  const {
    formData,
    handleChange,
    saving,
    loading,
    toastMessage,
    handleSave
  } = useAssociationSettings(groupId, true, onBack, t);

  // État du formulaire d'ajout d'une nouvelle catégorie
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8b2a1a');
  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);

  // Palette prédéfinie aux teintes Cordel pour un choix rapide
  const CORDEL_COLOR_PRESETS = [
    { label: 'Terre cuite', color: '#8b2a1a' },
    { label: 'Vert Cordel', color: '#2d6a4f' },
    { label: 'Ocre ambré', color: '#c05621' },
    { label: 'Jaune paille', color: '#d99f4d' },
    { label: 'Bleu nuit', color: '#1e3a8a' },
    { label: 'Violet profond', color: '#581c87' },
    { label: 'Sauge', color: '#52796f' },
    { label: 'Ardoise', color: '#475569' }
  ];

  // Normalisation de la liste des catégories
  const rawCategories = Array.isArray(formData.customCategories) && formData.customCategories.length > 0
    ? formData.customCategories
    : DEFAULT_CUSTOM_CATEGORIES;

  const categories = rawCategories.map((cat, idx) => {
    if (typeof cat === 'string') {
      return { id: `cat_${idx}_${cat.toLowerCase()}`, name: cat, color: idx === 0 ? '#2d6a4f' : '#8b2a1a' };
    }
    return cat;
  });

  // Ajout d'une nouvelle catégorie
  const handleAddCategory = () => {
    const trimmedName = newCatName.trim();
    if (!trimmedName) return;

    const exists = categories.some(
      (c) => (c.name || '').toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      alert("Cette catégorie de pratique existe déjà !");
      return;
    }

    const newCategory = {
      id: `cat_${Date.now()}`,
      name: trimmedName,
      color: newCatColor || '#8b2a1a'
    };

    handleChange('customCategories', [...categories, newCategory]);
    setNewCatName('');
    setNewCatColor('#8b2a1a');
  };

  // Suppression d'une catégorie
  const handleRemoveCategory = async (catId, catName) => {
    const isOk = await confirm({
      title: `Supprimer la catégorie « ${catName} »`,
      message: "Êtes-vous sûr de vouloir supprimer cette catégorie de pratique ? Les membres qui ont déjà cette catégorie assignée la conserveront dans leur historique, mais elle ne sera plus proposée pour les nouvelles inscriptions ou filtrages.",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });

    if (isOk) {
      const updated = categories.filter((c) => c.id !== catId);
      handleChange('customCategories', updated);
    }
  };

  // Synchronisation des membres existants
  const handleBatchSyncMembers = async () => {
    const isConfirmed = await confirm({
      title: "Synchroniser les profils membres",
      message: "Cette opération va mettre à jour dans la base de données les anciens profils membres (débutant / confirmé) pour leur attribuer les libellés officiels de vos catégories de pratique actuelles. Continuer ?",
      confirmText: "Oui, synchroniser",
      cancelText: "Annuler",
      variant: "warning"
    });

    if (!isConfirmed) return;

    setMigrating(true);
    setMigrationStatus(null);
    try {
      const catNames = categories.map(c => c.name);
      await batchMigrateUserCategories(db, groupId, catNames);
      setMigrationStatus("Synchronisation des membres terminée avec succès !");
    } catch (err) {
      console.error("Erreur synchronisation membres :", err);
      setMigrationStatus("Erreur lors de la synchronisation des membres.");
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin text-4xl select-none">⏳</div>
        <p className="font-semibold text-xs uppercase tracking-widest text-cordel-master-dark opacity-60">
          Chargement des catégories de pratique...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left select-none max-w-4xl mx-auto w-full">
      {/* En-tête avec fil d'ariane et bouton retour */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-dashed border-cordel-master-dark/30">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-cordel-master-dark uppercase tracking-wider mb-1">
            <span>Mestria</span>
            <span>›</span>
            <span className="text-[#2d6a4f] dark:text-emerald-400">Catégories de pratique</span>
          </div>
          <h2 className="text-xl font-black text-cordel-wood uppercase flex items-center gap-2">
            <span>🏷️</span> Catégories & Niveaux de Pratique
          </h2>
          <p className="text-xs text-cordel-master-dark/75 mt-0.5">
            Configurez les sections, niveaux ou groupes de pratique (ex : Débutants, Avancés, Danse, Percussion, Équipe Pro...).
            Ces catégories servent à cibler les convocations d'agenda et à orienter le casting.
          </p>
        </div>

        {onBack && (
          <CordelButton
            type="button"
            onClick={onBack}
            className="text-xs font-bold"
          >
            ⬅️ Retour
          </CordelButton>
        )}
      </div>

      {/* Formulaire d'ajout d'une catégorie */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-2">
          ➕ Ajouter une nouvelle catégorie
        </h3>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="mestreNewCatName" className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Intitulé de la section ou du niveau
              </label>
              <input
                id="mestreNewCatName"
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="Ex: Section Danse Avancée, Percussion Pro, Débutants 1ère année..."
                className="theme-input text-xs font-bold py-2 bg-cordel-bg-light w-full"
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Couleur de badge
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-9 h-9 p-0 border-0 rounded cursor-pointer bg-transparent"
                  disabled={saving}
                />
                <span className="text-[11px] font-mono font-bold text-cordel-master-dark/80">
                  {newCatColor}
                </span>
              </div>
            </div>
          </div>

          {/* Pastilles rapides de couleurs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[9px] uppercase font-bold text-cordel-master-dark/60 mr-1">
              Palette Cordel :
            </span>
            {CORDEL_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.color}
                type="button"
                onClick={() => setNewCatColor(preset.color)}
                className="w-5 h-5 rounded-full border border-encre-noire/40 transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: preset.color }}
                title={preset.label}
              />
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-dashed border-cordel-master-dark/15">
            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={handleAddCategory}
              disabled={saving || !newCatName.trim()}
              className="py-1.5 text-xs px-4 uppercase tracking-widest font-black"
            >
              + Ajouter la catégorie
            </CordelButton>
          </div>
        </div>
      </CordelCard>

      {/* Liste des catégories configurées */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
            📋 Catégories configurées ({categories.length})
          </h3>
          <span className="text-[10px] font-semibold text-cordel-master-dark/70">
            Utilisées dans l'agenda, les castings et les filtres trombinoscope
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-cordel-master-dark/20 rounded bg-cordel-bg-light/40">
            <p className="text-xs italic text-cordel-master-dark/70">
              Aucune catégorie de pratique enregistrée pour l'instant.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-[4px_6px_3px_5px] border border-cordel-master-dark/30 shadow-sm bg-cordel-bg-light"
                style={{ borderLeftColor: cat.color || '#8b2a1a', borderLeftWidth: '4px' }}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#8b2a1a' }}
                  />
                  <span className="text-xs font-extrabold text-encre-noire truncate">
                    {cat.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat.id, cat.name)}
                  disabled={saving}
                  className="text-xs text-[#8b2a1a] hover:bg-red-100 dark:hover:bg-red-950/40 p-1 rounded font-bold cursor-pointer transition-colors shrink-0"
                  title="Supprimer cette catégorie"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action de synchronisation batch des anciens membres */}
        <div className="mt-4 pt-3 border-t border-dashed border-cordel-master-dark/15 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] text-cordel-master-dark/70 max-w-md">
            <span>🔄 Mettre à jour rétroactivement les anciens profils membres qui utilisent encore les intitulés par défaut.</span>
            {migrationStatus && (
              <p className="font-bold text-[#2d6a4f] mt-1">{migrationStatus}</p>
            )}
          </div>
          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            onClick={handleBatchSyncMembers}
            disabled={migrating || saving || categories.length === 0}
            className="text-[10px] uppercase font-bold py-1 px-3"
          >
            {migrating ? "Synchronisation..." : "🔄 Synchroniser les profils membres"}
          </CordelButton>
        </div>
      </CordelCard>

      {/* Barre d'action d'enregistrement */}
      <div className="flex justify-end pt-2 border-t border-dashed border-cordel-master-dark/20">
        <CordelButton
          type="button"
          variant="vert"
          useExtremeBorder={true}
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]"
        >
          {saving ? "Enregistrement..." : "💾 Enregistrer les Catégories"}
        </CordelButton>
      </div>

      {/* Notification toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-900 text-white font-black text-xs px-6 py-3 rounded-lg shadow-[3px_3px_0px_0px_#181716] border-2 border-encre-noire flex items-center gap-2.5 select-none animate-fade-in">
          <span className="text-base">✅</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
