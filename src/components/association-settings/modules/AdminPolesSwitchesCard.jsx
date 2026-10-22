import React from 'react';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';
import { DEFAULT_ENABLED_MODULES } from '../../../hooks/useAssociationSettings';

const ADMIN_POLES_CONFIG = [
  { key: 'gouvernance', icon: '🏛️', titleKey: 'settings.modules.modulesSwitchesTable.gouvernanceConseilDAdministration', descKey: 'settings.modules.modulesSwitchesTable.reunionsDeCaBilansAg', title: 'Gouvernance & CA', desc: 'Réunions de CA, bilans AG et statuts' },
  { key: 'secretariat', icon: '🗂️', titleKey: 'settings.modules.modulesSwitchesTable.secretariatRegistres', descKey: 'settings.modules.modulesSwitchesTable.secretariatDesc', title: 'Secrétariat & Registres', desc: 'Annuaire, registres des dates et bilans' },
  { key: 'tresorerie', icon: '🪙', titleKey: 'settings.modules.modulesSwitchesTable.tresorerieFinances', descKey: 'settings.modules.modulesSwitchesTable.cotisationsDepensesNotesDeFrais', title: 'Trésorerie & Finances', desc: 'Cotisations, dépenses, notes de frais' },
  { key: 'logistique', icon: '📦', titleKey: 'settings.modules.modulesSwitchesTable.logistiqueInstruments', descKey: 'settings.modules.modulesSwitchesTable.inventaireMaterielEtatDuParc', title: 'Logistique & Matériel', desc: 'Inventaire matériel, état du parc, convois' },
  { key: 'lutherie', icon: '🪵', titleKey: 'settings.modules.modulesSwitchesTable.lutherieMaintenance', descKey: 'settings.modules.modulesSwitchesTable.lutherieDesc', title: 'Lutherie & Maintenance', desc: 'Établi, pièces détachées et outillage' },
  { key: 'costumerie', icon: '👗', titleKey: 'settings.modules.modulesSwitchesTable.costumerieConfection', descKey: 'settings.modules.modulesSwitchesTable.costumerieDesc', title: 'Costumerie & Confection', desc: 'Suivi des costumes, métrages et patrons' },
  { key: 'diffusion', icon: '🎷', titleKey: 'settings.modules.modulesSwitchesTable.diffusionPipelinePrestations', descKey: 'settings.modules.modulesSwitchesTable.prestationsDemarchageEtOpportunitesDe', title: 'Diffusion & Prestations', desc: 'Prestations, démarchage et concerts' },
  { key: 'pedagogie', icon: '🥁', titleKey: 'settings.modules.modulesSwitchesTable.pedagogieMestria', descKey: 'settings.modules.modulesSwitchesTable.pedagogieDesc', title: 'Mestria & Pédagogie', desc: 'Espace Mestre, plan de scène et parcours' },
  { key: 'studioSocial', icon: '📢', titleKey: 'settings.modules.modulesSwitchesTable.studioSocialMedias', descKey: 'settings.modules.modulesSwitchesTable.photothequeDiffusionExterneEtVaral', title: 'Studio Social & Médias', desc: 'Photothèque, diffusion externe et Varal' },
  { key: 'commandes', icon: '🛒', titleKey: 'settings.modules.modulesSwitchesTable.boutiqueCommandes', descKey: 'settings.modules.modulesSwitchesTable.commandesGroupeesDeConsommablesPour', title: 'Boutique & Commandes', desc: 'Commandes groupées pour la troupe' },
  { key: 'covoiturage', icon: '🚗', titleKey: 'settings.modules.modulesSwitchesTable.covoiturageEvenements', descKey: 'settings.modules.modulesSwitchesTable.organisationDesTrajetsPartagesSur', title: 'Covoiturage Événements', desc: 'Trajets partagés sur l\'agenda' },
  { key: 'forum', icon: '💬', titleKey: 'settings.modules.modulesSwitchesTable.porteVoixDiscussions', descKey: 'settings.modules.modulesSwitchesTable.messagerieCommunautaireEtCanauxDe', title: 'Porte-voix (Discussions)', desc: 'Messagerie communautaire et canaux' },
  { key: 'reunions', icon: '📝', titleKey: 'settings.modules.modulesSwitchesTable.gestionDesReunions', descKey: 'settings.modules.modulesSwitchesTable.ordresDuJourPvEt', title: 'Gestion des Réunions', desc: 'Ordres du jour, PV et comptes-rendus' },
  { key: 'defisEnLigne', icon: '🏆', titleKey: 'settings.modules.modulesSwitchesTable.rodaQuizDefis', descKey: 'settings.modules.modulesSwitchesTable.defisRythmeEtCultureEn', title: 'Roda Quiz & Défis', desc: 'Défis Rythme et Culture en direct' }
];

/**
 * Carte 1 : Pôles Métiers & Back-Office de l'Association (Niveau 1 SaaS).
 * Permet d'activer ou désactiver globalement chaque pôle d'administration.
 */
export default function AdminPolesSwitchesCard({ formData = {}, handleChange, saving }) {
  const { t } = useTranslation();
  const enabledModules = formData.enabledModules || DEFAULT_ENABLED_MODULES;

  const handleTogglePole = (key, isChecked) => {
    const next = { ...enabledModules, [key]: isChecked };
    if (key === 'costumerie') next.vestiaire = isChecked;
    if (key === 'pedagogie') next.mestre = isChecked;
    handleChange('enabledModules', next);
  };

  const handleActivateAll = () => {
    const all = { ...enabledModules };
    ADMIN_POLES_CONFIG.forEach(p => { all[p.key] = true; });
    all.vestiaire = true;
    all.mestre = true;
    handleChange('enabledModules', all);
  };

  const handleDeactivateAll = () => {
    const all = { ...enabledModules };
    ADMIN_POLES_CONFIG.forEach(p => { all[p.key] = false; });
    all.vestiaire = false;
    all.mestre = false;
    handleChange('enabledModules', all);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-4">
      {/* En-tête de la carte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20 text-left">
        <div>
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
            {t('settings.modules.modulesSwitchesTable.adminPolesTitle') || '🏛️ Pôles Métiers & Back-Office de l\'Association'}
          </h3>
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold mt-0.5">
            {t('settings.modules.modulesSwitchesTable.adminPolesDesc') || 'Désactiver un pôle masque son menu d\'administration et coupe automatiquement les fonctionnalités associées côté adhérent.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleActivateAll}
            disabled={saving}
            className="text-[9px] font-black uppercase text-emerald-800 hover:underline cursor-pointer"
          >
            {t('settings.modules.modulesSwitchesTable.toutActiver') || '✓ Tout activer'}
          </button>
          <span className="text-stone-300">|</span>
          <button
            type="button"
            onClick={handleDeactivateAll}
            disabled={saving}
            className="text-[9px] font-black uppercase text-stone-600 hover:underline cursor-pointer"
          >
            {t('settings.modules.modulesSwitchesTable.toutDesactiver') || '✕ Tout désactiver'}
          </button>
        </div>
      </div>

      {/* Grille des 14 pôles métiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-left">
        {ADMIN_POLES_CONFIG.map(m => {
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
                  <span className="text-[11px] font-black text-encre-noire leading-tight">
                    {m.titleKey ? (t(m.titleKey) || m.title) : m.title}
                  </span>
                  <span className="text-[8.5px] text-stone-500 font-medium leading-tight mt-0.5">
                    {m.descKey ? (t(m.descKey) || m.desc) : m.desc}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => handleTogglePole(m.key, e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)] shrink-0"
              />
            </div>
          );
        })}
      </div>
    </CordelCard>
  );
}
