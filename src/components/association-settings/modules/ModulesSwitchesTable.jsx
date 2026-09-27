import React from 'react';
import CordelCard from '../../CordelCard';
import { DEFAULT_ENABLED_MODULES, DEFAULT_ECOSYSTEM_ACCESS } from '../../../hooks/useAssociationSettings';

const MODULES_CONFIG = [
  { key: 'gouvernance', icon: '🏛️', title: 'Gouvernance & Conseil d\'Administration', desc: 'Réunions de CA, bilans AG et registre des statuts' },
  { key: 'diffusion', icon: '🎷', title: 'Diffusion & Pipeline Prestations', desc: 'Prestations, démarchage et opportunités de concerts' },
  { key: 'tresorerie', icon: '🪙', title: 'Trésorerie & Finances', desc: 'Cotisations, dépenses, notes de frais kilométriques' },
  { key: 'logistique', icon: '📦', title: 'Logistique & Instruments', desc: 'Inventaire matériel, état du parc, convois' },
  { key: 'commandes', icon: '🛒', title: 'Boutique & Commandes', desc: 'Commandes groupées de consommables pour la troupe' },
  { key: 'vestiaire', icon: '👗', title: 'Vestiaire & Costumerie', desc: 'Suivi des costumes, mensurations et pièces textiles' },
  { key: 'covoiturage', icon: '🚗', title: 'Covoiturage Événements', desc: 'Organisation des trajets partagés sur l\'agenda' },
  { key: 'studioSocial', icon: '📢', title: 'Studio Social & Médias', desc: 'Photothèque, diffusion externe et Varal' },
  { key: 'reunions', icon: '📝', title: 'Gestion des Réunions', desc: 'Ordres du jour, PV et comptes-rendus' },
  { key: 'forum', icon: '💬', title: 'Porte-voix (Discussions)', desc: 'Messagerie communautaire et canaux de discussion' },
  { key: 'mestre', icon: '🥁', title: 'Espace Mestre & Direction Artistique', desc: 'Plan de scène, orientation et casting' },
  { key: 'defisEnLigne', icon: '🏆', title: 'Roda Quiz & Défis', desc: 'Défis Rythme et Culture en direct' }
];

/**
 * Tableau unifié des interrupteurs d'activation des modules SaaS et fonctionnalités transversales.
 */
export default function ModulesSwitchesTable({ formData = {}, handleChange, saving }) {
  const enabledModules = formData.enabledModules || DEFAULT_ENABLED_MODULES;
  const ecosystemAccess = formData.ecosystemAccess || DEFAULT_ECOSYSTEM_ACCESS;

  const handleToggleModule = (key, isChecked) => {
    handleChange('enabledModules', { ...enabledModules, [key]: isChecked });
  };

  const handleToggleEcosystem = (key, isChecked) => {
    handleChange('ecosystemAccess', { ...ecosystemAccess, [key]: isChecked });
  };

  const handleActivateAll = () => {
    const all = {};
    MODULES_CONFIG.forEach(m => { all[m.key] = true; });
    handleChange('enabledModules', all);
  };

  const handleDeactivateAll = () => {
    const all = {};
    MODULES_CONFIG.forEach(m => { all[m.key] = false; });
    handleChange('enabledModules', all);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20 text-left">
        <div>
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
            🧩 Pôles Métiers & Modules SaaS
          </h3>
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold mt-0.5">
            Activez uniquement les pôles pertinents pour adapter l'application à la taille de votre structure.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleActivateAll}
            disabled={saving}
            className="text-[9px] font-black uppercase text-emerald-800 hover:underline cursor-pointer"
          >
            ✓ Tout activer
          </button>
          <span className="text-stone-300">|</span>
          <button
            type="button"
            onClick={handleDeactivateAll}
            disabled={saving}
            className="text-[9px] font-black uppercase text-stone-600 hover:underline cursor-pointer"
          >
            ✕ Tout désactiver
          </button>
        </div>
      </div>

      {/* Grille des pôles métiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-left mb-4">
        {MODULES_CONFIG.map(m => {
          const isActive = enabledModules[m.key] !== false;
          return (
            <div 
              key={m.key} 
              className={`p-2.5 rounded border transition-all flex items-center justify-between ${
                isActive ? 'bg-white border-encre-noire/30 shadow-2xs' : 'bg-stone-100 border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 pr-2">
                <span className="text-base">{m.icon}</span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-encre-noire leading-tight">{m.title}</span>
                  <span className="text-[8.5px] text-stone-500 font-medium leading-tight mt-0.5">{m.desc}</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => handleToggleModule(m.key, e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)] shrink-0"
              />
            </div>
          );
        })}
      </div>

      {/* Options transversales (Statut en ligne, Répertoire adhérents, Progression) */}
      <div className="pt-3 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-2 text-left">
        <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
          ⚡ Fonctionnalités Transversales & Visibilité
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
          {/* Statut en ligne */}
          <label className="flex items-center justify-between p-2 rounded bg-white border border-stone-200 cursor-pointer">
            <span className="font-bold text-stone-700">🟢 Pastilles de statut en ligne</span>
            <input
              type="checkbox"
              checked={formData.activerPresenceEnLigne !== false}
              onChange={(e) => handleChange('activerPresenceEnLigne', e.target.checked)}
              disabled={saving}
            />
          </label>

          {/* Répertoire ouvert aux adhérents */}
          <label className="flex items-center justify-between p-2 rounded bg-white border border-stone-200 cursor-pointer">
            <span className="font-bold text-stone-700">📜 Répertoire ouvert aux membres</span>
            <input
              type="checkbox"
              checked={formData.features?.repertoireEleves || false}
              onChange={(e) => {
                const currentFeatures = formData.features || {};
                handleChange('features', { ...currentFeatures, repertoireEleves: e.target.checked });
              }}
              disabled={saving}
            />
          </label>

          {/* Auto-évaluation */}
          <label className="flex items-center justify-between p-2 rounded bg-white border border-stone-200 cursor-pointer">
            <span className="font-bold text-stone-700">📈 Auto-évaluation individuelle</span>
            <input
              type="checkbox"
              checked={formData.enableIndividualProgression || false}
              onChange={(e) => handleChange('enableIndividualProgression', e.target.checked)}
              disabled={saving}
            />
          </label>
        </div>
      </div>
    </CordelCard>
  );
}
