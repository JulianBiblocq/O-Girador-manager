import React from 'react';
import CordelCard from '../../CordelCard';
import { useTranslation } from '../../LanguageContext';

/**
 * Modes disponibles pour le fonctionnement du Vestiaire dans l'espace adhérent.
 */
export const WARDROBE_MEMBER_MODES = [
  {
    id: 'personal',
    labelKey: 'settings.modules.wardrobeMemberModeCard.gardeRobePersonnelle',
    badgeKey: 'settings.modules.wardrobeMemberModeCard.individuel',
    label: 'Garde-robe personnelle',
    badge: 'Individuel',
    icon: '👗',
    colorClass: 'border-amber-600 bg-amber-50/40 text-amber-900',
    tagClass: 'theme-stamp-badge-wood',
    descKey: 'settings.modules.wardrobeMemberModeCard.chaqueAdherentPossedeEtEntretient',
    desc: 'Chaque adhérent possède et entretient sa tenue individuelle.',
    detailsKey: 'settings.modules.wardrobeMemberModeCard.mannequinInteractifDHabillageSvg',
    details: 'Mannequin interactif d\'habillage SVG, checklist des pièces possédées et validation autonome des tenues.'
  },
  {
    id: 'collective_workshop',
    labelKey: 'settings.modules.wardrobeMemberModeCard.confectionCollectiveAtelier',
    badgeKey: 'settings.modules.wardrobeMemberModeCard.mutualise',
    label: 'Confection collective & Atelier',
    badge: 'Mutualisé',
    icon: '🧵',
    colorClass: 'border-emerald-700 bg-emerald-50/40 text-emerald-950',
    tagClass: 'bg-emerald-800 text-white',
    descKey: 'settings.modules.wardrobeMemberModeCard.parcDeCostumesAssociatifMutualise',
    desc: 'Parc de costumes associatif mutualisé et prêté le jour des prestations.',
    detailsKey: 'settings.modules.wardrobeMemberModeCard.compteurDeclaratifDesPiecesConfectionnees',
    details: 'Compteur déclaratif des pièces confectionnées pour le stock, rappel du chantier textile en cours et accès direct aux tutoriels & patrons.'
  },
  {
    id: 'disabled',
    labelKey: 'settings.modules.wardrobeMemberModeCard.desactiveMasquePourLesMembres',
    badgeKey: 'settings.modules.wardrobeMemberModeCard.masqueAdherents',
    label: 'Désactivé (Masqué pour les membres)',
    badge: 'Masqué Adhérents',
    icon: '🚫',
    colorClass: 'border-stone-400 bg-stone-100/60 text-stone-800',
    tagClass: 'bg-stone-700 text-white',
    descKey: 'settings.modules.wardrobeMemberModeCard.lOngletVestiaireDisparaitDe',
    desc: 'L\'onglet Vestiaire disparaît de l\'espace membre pour les adhérents simples.',
    detailsKey: 'settings.modules.wardrobeMemberModeCard.lePoleCostumerieWardrobemanagerReste',
    details: 'Le Pôle Costumerie & WardrobeManager reste pleinement accessible aux responsables ayant le badge requis.'
  }
];

/**
 * Composant de paramétrage modulaire du Vestiaire Adhérent pour les administrateurs.
 * Permet de basculer entre 'personal', 'collective_workshop' et 'disabled'.
 */
export default function WardrobeMemberModeCard({ formData = {}, handleChange, saving = false }) {
  const { t } = useTranslation();
  const currentMode = formData.wardrobeMemberMode || 'personal';
  const currentModeObj = WARDROBE_MEMBER_MODES.find(m => m.id === currentMode);

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20">
        <div>
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>👗</span>
            <span>{t('costumerie.modeDuVestiaireAdherent')}</span>
          </h3>
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold mt-0.5">
            {t('costumerie.definissezCommentLesAdherentsInteragissent')}
          </p>
        </div>
        <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-[var(--theme-card-bg)] border border-cordel-master-dark/30 text-cordel-master-dark self-start sm:self-center">
          {t('costumerie.actuel')} {currentModeObj ? (t(currentModeObj.labelKey) || currentModeObj.label) : (t('settings.modules.wardrobeMemberModeCard.personnel') || 'Personnel')}
        </span>
      </div>

      {/* Grille de sélection des 3 modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {WARDROBE_MEMBER_MODES.map((mode) => {
          const isSelected = currentMode === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => !saving && handleChange('wardrobeMemberMode', mode.id)}
              className={`p-3.5 rounded-[var(--theme-border-radius,6px_8px_5px_7px)] border-2 transition-all cursor-pointer flex flex-col justify-between select-none relative ${
                isSelected
                  ? 'border-[var(--color-cordel-wood,#8b2a1a)] bg-[var(--theme-card-bg)] shadow-[3px_3px_0px_0px_#181716] ring-2 ring-[var(--color-cordel-wood,#8b2a1a)]/20'
                  : 'border-cordel-master-dark/25 bg-[var(--theme-card-bg)]/60 hover:bg-[var(--theme-card-bg)] hover:border-cordel-master-dark/50 opacity-80 hover:opacity-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
              }`}
            >
              {/* En-tête de la carte */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xl">{mode.icon}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`theme-stamp-badge text-[8px] uppercase tracking-wider ${mode.tagClass}`}>
                      {mode.badgeKey ? (t(mode.badgeKey) || mode.badge) : mode.badge}
                    </span>
                    <input
                      type="radio"
                      name="wardrobeMemberMode"
                      value={mode.id}
                      checked={isSelected}
                      disabled={saving}
                      onChange={() => handleChange('wardrobeMemberMode', mode.id)}
                      className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-wood,#8b2a1a)]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <h4 className="text-[11px] font-black uppercase text-encre-noire tracking-wide">
                  {mode.labelKey ? (t(mode.labelKey) || mode.label) : mode.label}
                </h4>

                <p className="text-[9.5px] font-semibold text-cordel-master-dark/85 mt-1 leading-snug">
                  {mode.descKey ? (t(mode.descKey) || mode.desc) : mode.desc}
                </p>
              </div>

              {/* Détails complémentaires */}
              <div className="mt-3 pt-2 border-t border-dashed border-cordel-master-dark/15 text-[8.5px] text-cordel-master-dark/70 font-medium leading-relaxed">
                {mode.detailsKey ? (t(mode.detailsKey) || mode.details) : mode.details}
              </div>

              {/* Pastille sélectionné */}
              {isSelected && (
                <div className="mt-2.5 flex items-center gap-1 text-[8.5px] font-black uppercase text-[var(--color-cordel-vert,#2d6a4f)]">
                  <span>✓</span> {t('costumerie.modeActifPourLaTroupe')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CordelCard>
  );
}
