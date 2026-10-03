import React, { useState } from 'react';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import useModalEscape from '../hooks/useModalEscape';

export default function MoveThreadModal({ thread, channels = [], onConfirm, onClose, isSubmitting }) {
  const { t } = useTranslation();
  const [selectedChannelId, setSelectedChannelId] = useState(thread?.channelId || channels[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState(thread?.categorie || 'Général');

  // Fermeture accessible avec touche Échap
  useModalEscape(true, onClose, isSubmitting);

  const categories = [
    { value: 'Général', label: t('forum.Général') || 'Général' },
    { value: 'Costumes', label: t('forum.Costumes') || 'Costumes' },
    { value: 'Covoiturage', label: t('forum.Covoiturage') || 'Covoiturage' },
    { value: 'Autre', label: t('forum.Autre') || 'Autre' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedChannelId) return;
    onConfirm(selectedChannelId, selectedCategory);
  };

  return (
    <div
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none outline-none"
    >
      <div className="relative w-full max-w-md max-h-[90dvh] flex flex-col rounded-lg bg-[var(--theme-bg)] border-2 border-cordel-master-dark/40 shadow-2xl overflow-hidden mt-2 sm:mt-0">
        {/* 1. Header (Fixe) */}
        <div className="shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex items-start justify-between gap-3 bg-[var(--theme-bg)]">
          <div className="flex-1 min-w-0 pr-2">
            <span className="text-[8px] font-black uppercase text-cordel-wood tracking-widest block">
              🚚 Modération Porte-voix
            </span>
            <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase mt-0.5 break-words">
              Déplacer la discussion
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-cordel-wood hover:text-red-600 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title="Fermer"
            aria-label="Fermer"
          >
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 text-left">
            <div className="text-xs bg-cordel-bg-light p-2.5 rounded border border-cordel-master-dark/15 font-bold">
              <span className="opacity-60 block text-[9px] uppercase font-black">Sujet concerné :</span>
              <span className="text-encre-noire font-extrabold">"{thread?.titre}"</span>
            </div>

            {/* Target Channel */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                Nouveau Salon (Canal) *
              </label>
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                required
                className="theme-input text-xs font-bold bg-white"
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.parentId ? '  └─ ' : '📂 '} {ch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Category Tag */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                Catégorie du sujet
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="theme-input text-xs font-bold bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Footer (Fixe en bas) */}
          <div className="shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 flex justify-end gap-2 bg-[var(--theme-bg)] pb-[max(env(safe-area-inset-bottom),1rem)]">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 text-xs font-bold uppercase shrink-0"
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="vert"
              useExtremeBorder={true}
              disabled={isSubmitting || !selectedChannelId}
              className="py-2 px-4 text-xs font-black uppercase tracking-wider shrink-0"
            >
              {isSubmitting ? "Déplacement..." : "Déplacer le sujet"}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
