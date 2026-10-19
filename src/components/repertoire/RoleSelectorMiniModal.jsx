import React from 'react';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';

/**
 * Micro-sélecteur de pupitre Cordel pour l'entraînement interactif « Jouer avec ».
 * Permet à un membre sans instrument renseigné de choisir rapidement son pupitre de jeu.
 */
export default function RoleSelectorMiniModal({
  isOpen,
  onClose,
  onSelectRole
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const PUPITRES = [
    { id: 'marcante', label: 'Alfaia Marcante', icon: '🥁' },
    { id: 'meiao', label: 'Alfaia Meião', icon: '🥁' },
    { id: 'repique', label: 'Alfaia Repique', icon: '🥁' },
    { id: 'caixa', label: 'Caixa', icon: '🪘' },
    { id: 'tarol', label: 'Tarol', icon: '🪘' },
    { id: 'gongue', label: 'Gonguê', icon: '🔔' },
    { id: 'agbe', label: 'Agbê', icon: '✨' },
    { id: 'timbal', label: 'Timbal', icon: '🪘' }
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-sm p-4 text-left relative bg-cordel-bg shadow-xl flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2">
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🎯</span>
            <span>{t('repertoire.selectPupitreTitle') || "Choisissez votre pupitre"}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-cordel-wood text-white font-black text-xs flex items-center justify-center cursor-pointer hover:brightness-110"
          >
            ✕
          </button>
        </div>

        <p className="text-[10px] text-stone-600 font-semibold leading-relaxed">
          {t('repertoire.selectPupitreSubtitle') || "Sélectionnez votre instrument pour lancer la session « Jouer avec » avec votre piste en sourdine :"}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-1">
          {PUPITRES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelectRole(p.id);
                onClose();
              }}
              className="p-2 rounded-[4px_6px_3px_5px] border border-encre-noire/30 bg-white hover:bg-amber-100 text-encre-noire text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs transition-all active:scale-95"
            >
              <span>{p.icon}</span>
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </CordelCard>
    </div>
  );
}
