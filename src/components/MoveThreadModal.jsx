import React, { useState } from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';

export default function MoveThreadModal({ thread, channels = [], onConfirm, onClose, isSubmitting }) {
  const { t } = useTranslation();
  const [selectedChannelId, setSelectedChannelId] = useState(thread?.channelId || channels[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState(thread?.categorie || 'Général');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-md">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
          <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
            <div>
              <span className="text-[8px] font-black uppercase text-cordel-wood tracking-widest block">
                🚚 Modération Porte-voix
              </span>
              <h3 className="font-cactus font-black text-base text-encre-noire tracking-wider uppercase mt-0.5">
                Déplacer la discussion
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="text-xs bg-cordel-bg-light p-2.5 rounded border border-cordel-master-dark/15 font-bold">
            <span className="opacity-60 block text-[9px] uppercase font-black">Sujet concerné :</span>
            <span className="text-encre-noire font-extrabold">"{thread?.titre}"</span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
              <CordelButton
                type="button"
                variant="default"
                onClick={onClose}
                disabled={isSubmitting}
                className="py-2 px-4 text-xs font-bold uppercase"
              >
                Annuler
              </CordelButton>
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={isSubmitting || !selectedChannelId}
                className="py-2 px-4 text-xs font-black uppercase tracking-wider"
              >
                {isSubmitting ? "Déplacement..." : "Déplacer le sujet"}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
