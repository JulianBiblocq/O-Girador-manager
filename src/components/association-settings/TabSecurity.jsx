import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import PermissionsGuideBox from '../PermissionsGuideBox';
import { formatTagGender, getTagId } from '../../utils/tagUtils';

const PERMISSION_POLES = [
  {
    id: 'secretariat',
    label: '📋 Secrétariat',
    desc: 'Gestion statutaire, annuaire, réunions, registre des dates et Varal administratif',
    tabs: [
      { id: 'export-annu', label: 'Annuaire', desc: 'Accès à la liste des adhérents et export CSV/Excel' },
      { id: 'studio-events', label: 'Registre des dates', desc: 'Tableau d\'édition rapide et globale des événements' },
      { id: 'reunion-manager', label: 'Réunions', desc: 'Ordres du jour et procès-verbaux de réunion' },
      { id: 'varal-secretariat', label: 'Varal Secrétariat', desc: 'Documents administratifs et comptes-rendus officiels' },
      { id: 'mestre-forum-channels', label: 'Porte-voix (Salons)', desc: 'Modération et configuration des salons du forum' },
      { id: 'activity-reports', label: 'Rapports d\'activité', desc: 'Rédaction et archivage des bilans statutaires' },
      { id: 'secretariat-reports', label: 'Rapports & Bilan AG', desc: 'Consolidation multi-pôles des indicateurs de la saison pour l\'Assemblée Générale' },
      { id: 'secretariat-documents', label: 'Ressources & Liens', desc: 'Gestion des chartes, droit à l\'image, aptitudes médicales et espaces cloud partagés' },
      { id: 'secretariat-lieux', label: 'Lieux, Types & Relances', desc: 'Répertoire des salles habituelles, types d\'événements et règles de relance automatique' }
    ]
  },
  {
    id: 'diffusion',
    label: '🎷 Diffusion',
    desc: 'Suivi des prestations, opportunités de concerts et pipeline CRM',
    tabs: [
      { id: 'gigs-pipeline', label: 'Suivi des Prestations', desc: 'Gestion de l\'entonnoir des prestations (demandes, devis, options, factures)' }
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
    desc: 'Inventaire du matériel opérationnel, pupitres, kits et commandes',
    tabs: [
      { id: 'inventory', label: 'Instruments', desc: 'Gestion du parc d\'instruments et état du matériel' },
      { id: 'logistics-pupitres', label: 'Pupitres', desc: 'Familles de pupitres, catalogue d\'instruments et attributions de couleurs' },
      { id: 'logistics-kits', label: 'Accessoires & Kits', desc: 'Gestion des kits d\'accessoires et matériels par pupitre' },
      { id: 'logistics-carpool', label: 'Covoiturage & Convois', desc: 'Point de départ convoi, barème km et règles de transport' },
      { id: 'orders', label: 'Commandes', desc: 'Suivi des achats et commandes de matériel' }
    ]
  },
  {
    id: 'lutherie',
    label: '🪚 Lutherie & Atelier',
    desc: 'Artisanat, modèles d\'instruments, établi, pièces détachées et outillage',
    tabs: [
      { id: 'inventory-projects', label: 'Établi & chantiers', desc: 'Suivi des chantiers de fabrication et réparations lourdes' },
      { id: 'instrument-models', label: 'Modèles d\'instruments', desc: 'Fiches techniques, nomenclatures et gabarits de fabrication' },
      { id: 'inventory-parts', label: 'Pièces détachées', desc: 'Gestion des stocks de fûts, cercles, peaux et accastillage' },
      { id: 'inventory-supplies', label: 'Matières premières', desc: 'Suivi des cordes, tirants, vernis et consommables' },
      { id: 'workshop-tools', label: 'Outillage', desc: 'Inventaire des outils et machines de l\'atelier' },
      { id: 'varal-lutherie', label: 'Varal Lutherie', desc: 'Tutoriels et plans de fabrication artisanale' },
      { 
        id: 'canValidateWorkshopSteps', 
        label: "Validation d'atelier & Fiche suiveuse", 
        desc: "Autorise à valider les étapes d'usinage et à demander des retouches sur l'établi",
        labelKey: 'permCanValidateWorkshopSteps',
        descKey: 'permCanValidateWorkshopStepsDesc'
      }
    ]
  },
  {
    id: 'costumerie',
    label: '🧵 Costumerie',
    desc: 'Artisanat textile, confection des tenues, patrons, tissus et mensurations',
    tabs: [
      { id: 'wardrobe-projects', label: 'Établi de confection', desc: 'Suivi des projets et chantiers couture en cours' },
      { id: 'wardrobe-models', label: 'Modèles & Patrons', desc: 'Gestion des modèles de costumes et pièces requises' },
      { id: 'wardrobe-pieces', label: 'Vestiaire physique', desc: 'Stock unitaire des tenues, état et prêts aux membres' },
      { id: 'wardrobe-supplies', label: 'Tissus & Mercerie', desc: 'Gestion des rouleaux de tissus, fils, boutons et consommables' },
      { id: 'wardrobe-tools', label: 'Machines & Outils', desc: 'Inventaire des machines à coudre, surjeteuses et outils' },
      { id: 'wardrobe-sizes', label: 'Tailles & Mensurations', desc: 'Tableau des tailles et mensurations des danseurs et musiciens' },
      { id: 'varal-costumerie', label: 'Varal Costumerie', desc: 'Patrons de coupe et fiches techniques de couture' }
    ]
  },
  {
    id: 'studio',
    label: 'Studio',
    desc: 'Communication externe, réseaux sociaux, newsletter et Varal photos',
    tabs: [
      { id: 'studio-social', label: 'Studio social', desc: 'Gestion et publication sur les réseaux sociaux' },
      { id: 'newsletter', label: 'Newsletter', desc: 'Création et envoi de newsletters' },
      { id: 'studio-communication', label: 'Communication & Brevo', desc: 'Clés Brevo API, DNS, newsletter et export des inscrits (CSV)' },
      { id: 'varal-photos', label: 'Varal Photos', desc: 'Dépôts et albums photos partagés des prestations' }
    ]
  },
  {
    id: 'pedagogie',
    label: '📚 Pédagogie',
    desc: 'Transmission musicale, parcours et Varal pédagogique',
    tabs: [
      { id: 'varal-manager', label: 'Varal Pédagogique', desc: 'Toadas, fiches de culture et tutoriels vidéo' },
      { id: 'mestre-pedagogy-qcm', label: 'QCM & Quiz', desc: 'Gestion des questionnaires et seuils de validation' },
      { id: 'mestre-pedagogy-dashboard', label: 'Suivi & Analyse', desc: 'Visualisation de la progression et aisance des adhérents' }
    ]
  },
  {
    id: 'mestre',
    label: '🥁 Mestria',
    desc: 'Direction artistique, plan de scène et séquenceur',
    tabs: [
      { id: 'mestre-categories', label: 'Catégories de pratique', desc: 'Gestion des sections et niveaux de pratique de la troupe' },
      { id: 'mestre-orientation', label: 'Casting', desc: 'Gestion des affectations d\'instruments et vœux d\'évolution' },
      { id: 'mestre-events', label: 'Événements', desc: 'Vue mestre détaillée des événements et présences' },
      { id: 'mestre-stage-layout', label: 'Plan de Scène', desc: 'Création et disposition visuelle du placement scénique' },
      { id: 'mestre-sequenceur', label: 'Séquenceur', desc: 'Édition des séquences musicales et structures rhythm' },
      { id: 'mestre-mot-mestre', label: 'Annonces', desc: 'Publication des communications officielles du Mestre' }
    ]
  },
  {
    id: 'vitrine',
    label: '🌐 Vitrine Publique',
    desc: 'Autorisations de prévisualisation en mode brouillon et d\'administration de la vitrine',
    tabs: [
      { id: 'vitrine-preview', label: 'Vitrine — Prévisualisation (Mode Brouillon)', desc: 'Permet d\'accéder à la vitrine lorsque isPublished est à false (mode en construction)' },
      { id: 'vitrine-edit', label: 'Vitrine — Édition & Configuration', desc: 'Permet d\'accéder au pôle d\'administration de la Vitrine (textes, formules, images, SEO, etc.)' }
    ]
  },
  {
    id: 'config',
    label: '⚙️ Configuration',
    desc: 'Paramètres institutionnels de l\'association, identité, sécurité, modules et profils',
    tabs: [
      { id: 'config-identity', label: 'Identité légale', desc: 'SIRET, RNA, siège social et signatures officielles' },
      { id: 'config-security', label: 'Badges & Permissions', desc: 'Matrice RBAC des rôles et permissions' },
      { id: 'config-layout', label: 'Apparence', desc: 'Logo, identité visuelle et thème de base' },
      { id: 'config-profile', label: 'Inscription & Profils', desc: 'Champs dynamiques requis pour les profils adhérents' },
      { id: 'config-modules', label: 'Modules & Fonctionnalités', desc: 'Activation et désactivation des grands pôles métiers' }
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

  // État local des accordéons de pôles
  const [openPoles, setOpenPoles] = useState({
    secretariat: true,
    tresorerie: false,
    logistique: false,
    lutherie: false,
    studio: false,
    pedagogie: false,
    mestre: false,
    vitrine: false
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

  // Basculer badge permission for a specific tab (or legacy pole)
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

  // Basculer all badges for a specific tab
  const handleToggleAllTabBadges = (tabId, selectAll) => {
    const allTagIds = tagsDisponibles.map(t => getTagId(t));
    const updatedTags = selectAll ? allTagIds : [];
    handleChange('permissionsMatrice', {
      ...permissionsMatrice,
      [tabId]: updatedTags
    });
  };

  // Fonction utilitaire pour afficher badge checkboxes for a target (tabId or poleId)
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
                                  📑 {tab.labelKey && t ? (t(`poles.${tab.labelKey}`) || tab.label) : tab.label}
                                </span>
                                {(tab.descKey || tab.desc) && (
                                  <span className="text-[8.5px] text-cordel-master-dark/65 block font-medium">
                                    {tab.descKey && t ? (t(`poles.${tab.descKey}`) || tab.desc) : tab.desc}
                                  </span>
                                )}
                              </div>

                              {/* Quick vérifier/uncheck tab buttons */}
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
