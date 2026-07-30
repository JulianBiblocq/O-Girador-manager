import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import PermissionsGuideBox from '../PermissionsGuideBox';
import { formatTagGender, getTagId } from '../../utils/tagUtils';

const PERMISSION_POLES = [
  {
    id: 'troupe',
    label: '👥 Troupe',
    desc: 'Accès aux membres, exports et gestion des badges',
    tabs: [
      { id: 'export-annu', label: 'Annuaire', desc: 'Accès à la liste des membres et à la génération des exports CSV/Excel' },
      { id: 'tag-manager', label: 'Badges', desc: 'Gestion de l\'ordre et des intitulés des badges/rôles' },
      { id: 'instruments', label: 'Pupitres', desc: 'Association des instruments aux pupitres de la troupe' }
    ]
  },
  {
    id: 'tresorerie',
    label: '🪙 Trésorerie',
    desc: 'Gestion financière, cotisations et frais kilométriques',
    tabs: [
      { id: 'dashboard-finance', label: 'Synthèse', desc: 'Aperçu global de la trésorerie et synthèses' },
      { id: 'cotisations', label: 'Cotisations', desc: 'Suivi et enregistrement des adhésions et cotisations' },
      { id: 'events-finances', label: 'Événements', desc: 'Suivi financier dédié aux prestations et événements' },
      { id: 'operations-diverses', label: 'Opérations', desc: 'Saisie des recettes et dépenses courantes hors événements' },
      { id: 'frais-km', label: 'Frais', desc: 'Validation et remboursement des indemnités kilométriques' },
      { id: 'reports-exports', label: 'Exports', desc: 'Génération du grand livre et exports comptables' }
    ]
  },
  {
    id: 'logistique',
    label: '📦 Logistique',
    desc: 'Inventaire du matériel et des commandes',
    tabs: [
      { id: 'inventory', label: 'Instruments', desc: 'Gestion du parc d\'instruments et état du matériel' },
      { id: 'orders-manager', label: 'Commandes', desc: 'Suivi des achats et commandes de matériel' }
    ]
  },
  {
    id: 'vestiaire',
    label: '👗 Vestiaire',
    desc: 'Gestion des costumes, stock et mensurations',
    tabs: [
      { id: 'wardrobe-inventory', label: 'Costumes', desc: 'Gestion du catalogue et du stock des costumes' },
      { id: 'wardrobe-couture', label: 'Atelier Couture', desc: 'Suivi de confection, réparations et tutoriels couture' },
      { id: 'wardrobe-sizes', label: 'Mensurations', desc: 'Consultation des tailles et mensurations des membres' }
    ]
  },
  {
    id: 'studio',
    label: 'Studio',
    desc: 'Communication, réunions, Varal et comptes-rendus',
    tabs: [
      { id: 'agenda', label: '📅 Agenda & Événements', desc: 'Droits de création, modification et suppression des événements' },
      { id: 'studio-events', label: 'Événements', desc: 'Tableau d\'édition rapide et globale des événements' },
      { id: 'studio-social', label: 'Studio social', desc: 'Gestion et publication sur les réseaux sociaux' },
      { id: 'reunion-manager', label: 'Réunions', desc: 'Ordres du jour et compte-rendus de réunion' },
      { id: 'varal-manager', label: 'Varal', desc: 'Gestion des dossiers et documents à afficher sur le Varal' },
      { id: 'activity-reports', label: 'Rapports', desc: 'Rédaction et archivage des bilans d\'activité' },
      { id: 'mestre-forum-channels', label: 'Porte-voix', desc: 'Modération et configuration des salons du forum' }
    ]
  },
  {
    id: 'mestre',
    label: '🥁 Mestria',
    desc: 'Direction artistique, plan de scène et séquenceur',
    tabs: [
      { id: 'mestre-orientation', label: 'Casting', desc: 'Gestion des affectations d\'instruments et vœux d\'évolution' },
      { id: 'mestre-events', label: 'Événements', desc: 'Vue mestre détaillée des événements et présences' },
      { id: 'mestre-stage-layout', label: 'Plan de Scène', desc: 'Création et disposition visuelle du placement scénique' },
      { id: 'mestre-sequenceur', label: 'Séquenceur', desc: 'Édition des séquences musicales et structures rhythm' },
      { id: 'mestre-workshops', label: 'Ateliers', desc: 'Organisation des ateliers de transmission' },
      { id: 'mestre-mot-mestre', label: 'Annonces', desc: 'Publication des communications officielles du Mestre' }
    ]
  },
  {
    id: 'config',
    label: '⚙️ Configuration',
    desc: 'Paramètres généraux de l\'association, identité, sécurité, modules et mise en page',
    tabs: [
      { id: 'config-identity', label: 'Identité', desc: 'Nom, logo, réseaux et slogan de l\'association' },
      { id: 'config-communication', label: 'Communication & Newsletter', desc: 'Clés Brevo API et export des inscrits newsletter (CSV)' },
      { id: 'config-profile', label: 'Organisation', desc: 'Structure et champs de profil des adhérents' },
      { id: 'config-security', label: 'Sécurité & Badges', desc: 'Matrice des rôles, permissions et déverrouillage' },
      { id: 'config-modules', label: 'Modules & Fonctionnalités', desc: 'Activation/Désactivation des modules' },
      { id: 'config-logistics', label: 'Logistique & Adresses', desc: 'Gestion des adresses et lieux habituels' },
      { id: 'config-documents', label: 'Documents & Modèles', desc: 'Gestion des documents administratifs et modèles' },
      { id: 'config-agenda', label: 'Agenda & Calendrier', desc: 'Paramètres du calendrier et synchronisation' },
      { id: 'config-lieux', label: 'Lieux & Salles', desc: 'Gestion du répertoire des lieux et salles habituels' },
      { id: 'config-layout', label: 'Apparence & Thème', desc: 'Personnalisation du style visuel et thème Cordel' }
    ]
  }
];

export default function TabSecurity({
  formData,
  handleChange,
  saving,
  t
}) {
  const { permissionsMatrice = {}, tagsDisponibles = [] } = formData;

  // Accordion state: open poles
  const [openPoles, setOpenPoles] = useState({
    troupe: true,
    tresorerie: false,
    logistique: false,
    vestiaire: false,
    studio: false,
    mestre: false
  });

  const togglePoleAccordion = (poleId) => {
    setOpenPoles(prev => ({
      ...prev,
      [poleId]: !prev[poleId]
    }));
  };

  const expandAll = () => {
    const allOpen = {};
    PERMISSION_POLES.forEach(p => { allOpen[p.id] = true; });
    setOpenPoles(allOpen);
  };

  const collapseAll = () => {
    const allClosed = {};
    PERMISSION_POLES.forEach(p => { allClosed[p.id] = false; });
    setOpenPoles(allClosed);
  };

  // Toggle badge permission for a specific tab (or legacy pole)
  const handleTogglePermission = (targetId, tagId, checked) => {
    const currentTags = permissionsMatrice[targetId] || [];
    const updatedTags = checked
      ? [...new Set([...currentTags, tagId])]
      : currentTags.filter(t => t !== tagId);

    handleChange('permissionsMatrice', {
      ...permissionsMatrice,
      [targetId]: updatedTags
    });
  };

  // Toggle all badges for a specific tab
  const handleToggleAllTabBadges = (tabId, selectAll) => {
    const allTagIds = tagsDisponibles.map(t => getTagId(t));
    const updatedTags = selectAll ? allTagIds : [];
    handleChange('permissionsMatrice', {
      ...permissionsMatrice,
      [tabId]: updatedTags
    });
  };

  // Helper to render badge checkboxes for a target (tabId or poleId)
  const renderTagCheckboxes = (targetId) => {
    const assignedTags = permissionsMatrice[targetId] || [];

    return tagsDisponibles.map(tag => {
      const tagId = getTagId(tag);
      const isChecked = assignedTags.includes(tagId) || (typeof tag === 'string' && assignedTags.includes(tag));
      const formattedLabel = formatTagGender(tag, null, formData?.majoriteFeminine, tagsDisponibles);

      return (
        <label key={tagId} className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold select-none hover:opacity-85">
          <input 
            type="checkbox"
            checked={isChecked}
            onChange={(e) => handleTogglePermission(targetId, tagId, e.target.checked)}
            disabled={saving}
            className="rounded cursor-pointer w-3.5 h-3.5 accent-[var(--cordel-wood)]"
          />
          <span className={`theme-stamp-badge theme-stamp-badge-wood text-[8.5px] py-0.5 normal-case tracking-normal ${isChecked ? 'bg-cordel-wood text-white border-encre-noire' : 'opacity-70'}`}>
            {formattedLabel}
          </span>
        </label>
      );
    });
  };

  // Count assigned tabs in a pole
  const countAssignedTabsInPole = (pole) => {
    let count = 0;
    pole.tabs.forEach(tab => {
      const tabAssigned = permissionsMatrice[tab.id] || permissionsMatrice[pole.id] || [];
      if (Array.isArray(tabAssigned) && tabAssigned.length > 0) {
        count++;
      }
    });
    return count;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Permanent Explanatory Guide Box */}
      <PermissionsGuideBox defaultOpen={true} />

      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood text-left flex items-center gap-2">
          <span>🪢</span> Matrice des Permissions (Par Onglet)
        </h3>

        {/* Accordion Global Controls */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood hover:underline cursor-pointer select-none"
          >
            📂 Tout ouvrir
          </button>
          <span className="text-[9px] opacity-40">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood hover:underline cursor-pointer select-none"
          >
            📁 Tout fermer
          </button>
        </div>
      </div>

      <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed mb-4 text-left">
        Attribuez l'accès aux onglets spécifiques pour chaque badge/rôle. Un membre verra uniquement les onglets correspondant aux badges attribués à son profil.
      </p>

      {tagsDisponibles.length === 0 ? (
        <div className="text-[10px] italic text-red-700 bg-red-100/20 p-3 border border-dashed border-red-700/20 rounded text-left">
          ⚠️ Aucune étiquette/badge n'est configuré pour cette association. Veuillez d'abord créer des badges dans le Gestionnaire de Badges.
        </div>
      ) : (
        <div className="flex flex-col gap-3 text-left">
          {PERMISSION_POLES.map((pole) => {
            const isOpen = !!openPoles[pole.id];
            const activeTabsCount = countAssignedTabsInPole(pole);

            return (
              <div 
                key={pole.id}
                className="border-2 border-encre-noire rounded-[6px_10px_6px_8px] overflow-hidden bg-cordel-bg-light shadow-[2px_2px_0px_0px_#181716] transition-all"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => togglePoleAccordion(pole.id)}
                  className="w-full px-3 py-2.5 bg-cordel-master-light/20 hover:bg-cordel-master-light/35 flex items-center justify-between cursor-pointer border-b border-encre-noire/15 select-none text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-encre-noire">{pole.label}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cordel-wood/15 text-cordel-wood border border-cordel-wood/30">
                      {activeTabsCount} / {pole.tabs.length} onglet(s) restreint(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cordel-wood">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="p-3 bg-white/50 dark:bg-black/10 flex flex-col gap-3">
                    <p className="text-[9.5px] italic text-cordel-master-dark/60 font-medium">
                      {pole.desc}
                    </p>

                    <div className="flex flex-col gap-2.5 mt-1">
                      {pole.tabs.map((tab) => {
                        const tabAssignedCount = (permissionsMatrice[tab.id] || []).length;

                        return (
                          <div 
                            key={tab.id}
                            className="p-2.5 border border-dashed border-cordel-master-dark/20 rounded bg-cordel-bg/40 flex flex-col gap-2"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[10.5px] font-extrabold text-encre-noire">
                                  📑 {tab.label}
                                </span>
                                {tab.desc && (
                                  <span className="text-[8.5px] text-cordel-master-dark/65 block font-medium">
                                    {tab.desc}
                                  </span>
                                )}
                              </div>

                              {/* Quick check/uncheck tab buttons */}
                              <div className="flex gap-1.5 text-[8px] font-extrabold">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAllTabBadges(tab.id, true)}
                                  className="px-1.5 py-0.5 rounded bg-cordel-wood/10 text-cordel-wood border border-cordel-wood/20 hover:bg-cordel-wood/20 cursor-pointer"
                                  title="Cocher tous les badges pour cet onglet"
                                >
                                  Tous
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAllTabBadges(tab.id, false)}
                                  className="px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700 border border-neutral-300 hover:bg-neutral-300 cursor-pointer"
                                  title="Décocher tous les badges pour cet onglet"
                                >
                                  Aucun
                                </button>
                              </div>
                            </div>

                            {/* Badge checkboxes list */}
                            <div className="flex flex-wrap gap-2 pt-1 border-t border-dashed border-cordel-master-dark/10">
                              {renderTagCheckboxes(tab.id)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CordelCard>
    </div>
  );
}
