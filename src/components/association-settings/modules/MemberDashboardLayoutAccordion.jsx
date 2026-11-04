import React, { useState } from 'react';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';
import TerracottaMegaphoneIcon from '../../TerracottaMegaphoneIcon';

const WIDGET_LABELS = {
  annonces: { labelKey: "settings.modules.memberDashboardLayoutAccordion.leMegaphoneAnnoncesOfficielles", label: "Le Mégaphone (Annonces officielles)", icon: <TerracottaMegaphoneIcon size={14} /> },
  videoALaUne: { labelKey: "settings.modules.memberDashboardLayoutAccordion.videoALaUneYoutube", label: "🎬 Vidéo à la une (YouTube)", icon: "🎬" },
  motMestre: { labelKey: "settings.modules.memberDashboardLayoutAccordion.leMotDuMestre", label: "📝 Le Mot du Mestre", icon: "📝" },
  agenda: { labelKey: "settings.modules.memberDashboardLayoutAccordion.datesAVenirAgenda", label: "📅 Dates à Venir (Agenda)", icon: "📅" },
  commandes: { labelKey: "settings.modules.memberDashboardLayoutAccordion.achatsDeMaterielCommandes", label: "📦 Achats de Matériel (Commandes)", icon: "📦" },
  forum: { labelKey: "settings.modules.memberDashboardLayoutAccordion.lePorteVoixDiscussions", label: "💬 Le Porte-Voix (Discussions)", icon: "💬" },
  documents: { labelKey: "settings.modules.memberDashboardLayoutAccordion.varalDeDocuments", label: "📂 Varal de Documents", icon: "📂" },
  tresorerie: { labelKey: "settings.modules.memberDashboardLayoutAccordion.adhesionCotisation", label: "🪙 Adhésion & Cotisation", icon: "🪙" }
};

const DEFAULT_ORDER = ["annonces", "videoALaUne", "motMestre", "agenda", "commandes", "forum", "documents", "tresorerie"];

/**
 * Accordéon compact pour l'ordonnancement des blocs de la vue accueil membre et des anniversaires.
 */
export default function MemberDashboardLayoutAccordion({ formData = {}, handleChange, saving }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentOrder = Array.isArray(formData.layoutEleves) && formData.layoutEleves.length > 0
    ? formData.layoutEleves
    : DEFAULT_ORDER;

  const birthdayPosition = formData.birthdayWidgetPosition || 'bottom';

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const updated = [...currentOrder];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    handleChange('layoutEleves', updated);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 w-full cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-left flex-1 min-w-0 break-words">
          <span className="text-sm shrink-0">🪢</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood break-words">
            {t('settings.modules.memberDashboardLayoutAccordion.dispositionDesBlocsDeL') || "Disposition des Blocs de l'Accueil Adhérent"} {isOpen ? '▲' : '▾'}
          </span>
          <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
            {t('settings.modules.memberDashboardLayoutAccordion.ordreDAffichageDuTableau') || "(Ordre d'affichage du tableau de bord & anniversaires)"}
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {isOpen ? (t('settings.modules.memberDashboardLayoutAccordion.fermer') || 'Fermer') : (t('settings.modules.memberDashboardLayoutAccordion.reorganiser') || 'Réorganiser')}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3.5 text-left animate-fade-in bg-white/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white rounded border border-stone-200">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base shrink-0">🎂</span>
              <div className="flex-1 min-w-0 break-words">
                <span className="text-xs font-bold text-encre-noire block">{t('settings.modules.memberDashboardLayoutAccordion.emplacementDuBlocAnniversaires') || 'Emplacement du Bloc Anniversaires'}</span>
                <span className="text-[9px] text-stone-500 font-medium">{t('settings.modules.memberDashboardLayoutAccordion.affichageDesAnniversairesDeLa') || 'Affichage des anniversaires de la semaine des adhérents'}</span>
              </div>
            </div>
            <select
              value={birthdayPosition}
              onChange={(e) => handleChange('birthdayWidgetPosition', e.target.value)}
              disabled={saving}
              className="theme-input text-xs font-bold py-1 bg-stone-50 cursor-pointer shrink-0"
            >
              <option value="bottom">{t('settings.modules.memberDashboardLayoutAccordion.enBasDuTableauDe') || 'En bas du tableau de bord'}</option>
              <option value="top">{t('settings.modules.memberDashboardLayoutAccordion.enHautSousLeMegaphone') || 'En haut (sous le mégaphone)'}</option>
              <option value="hidden">{t('settings.modules.memberDashboardLayoutAccordion.desactiveMasque') || 'Désactivé (Masqué)'}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
              {t('settings.modules.memberDashboardLayoutAccordion.ordreDApparitionDesCartes') || "Ordre d'apparition des cartes sur l'Accueil"}
            </span>
            <div className="flex flex-col gap-1.5">
              {currentOrder.map((widgetKey, idx) => {
                const meta = WIDGET_LABELS[widgetKey] || { label: widgetKey, icon: '📌' };
                return (
                  <div key={widgetKey} className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-stone-200 text-xs font-bold shadow-2xs w-full">
                    <span className="text-stone-800 flex items-center gap-2 flex-1 min-w-0 break-words">
                      <span className="text-[9px] font-black text-stone-400 font-mono w-4 shrink-0">{idx + 1}.</span>
                      {React.isValidElement(meta.icon) && <span className="shrink-0 flex items-center">{meta.icon}</span>}
                      <span className="break-words">{meta.labelKey ? (t(meta.labelKey) || meta.label) : meta.label}</span>
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button" onClick={() => handleMove(idx, -1)} disabled={saving || idx === 0}
                        className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-black disabled:opacity-30 cursor-pointer"
                        title={t('settings.modules.memberDashboardLayoutAccordion.monter') || "Monter"}
                      >↑</button>
                      <button
                        type="button" onClick={() => handleMove(idx, 1)} disabled={saving || idx === currentOrder.length - 1}
                        className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-black disabled:opacity-30 cursor-pointer"
                        title={t('settings.modules.memberDashboardLayoutAccordion.descendre') || "Descendre"}
                      >↓</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
