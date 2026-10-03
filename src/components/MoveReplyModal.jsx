import React, { useState } from 'react';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import useModalEscape from '../hooks/useModalEscape';

export default function MoveReplyModal({
  reply,
  replyIndex,
  currentThreadId,
  availableThreads = [],
  channels = [],
  onMoveToExisting,
  onExtractToNew,
  onClose,
  isSubmitting
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'

  // Fermeture accessible avec touche Échap
  useModalEscape(true, onClose, isSubmitting);

  // Existing thread mode state
  const otherThreads = availableThreads.filter(t => t.id !== currentThreadId);
  const [targetThreadId, setTargetThreadId] = useState(otherThreads[0]?.id || '');

  // New thread mode state
  const [newTitle, setNewTitle] = useState('');
  const [newChannelId, setNewChannelId] = useState(channels[0]?.id || '');
  const [newCategory, setNewCategory] = useState('Général');

  const categories = [
    { value: 'Général', label: t('forum.Général') || 'Général' },
    { value: 'Costumes', label: t('forum.Costumes') || 'Costumes' },
    { value: 'Covoiturage', label: t('forum.Covoiturage') || 'Covoiturage' },
    { value: 'Autre', label: t('forum.Autre') || 'Autre' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'existing') {
      if (!targetThreadId) return;
      onMoveToExisting(targetThreadId);
    } else {
      if (!newTitle.trim() || !newChannelId) return;
      onExtractToNew(newTitle.trim(), newChannelId, newCategory);
    }
  };

  return (
    <div
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none outline-none"
    >
      <div className="relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-lg bg-[var(--theme-bg)] border-2 border-cordel-master-dark/40 shadow-2xl overflow-hidden mt-2 sm:mt-0">
        {/* 1. Header (Fixe) */}
        <div className="shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex items-start justify-between gap-3 bg-[var(--theme-bg)]">
          <div className="flex-1 min-w-0 pr-2">
            <span className="text-[8px] font-black uppercase text-cordel-wood tracking-widest block">
              ➡️ Modération Porte-voix
            </span>
            <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase mt-0.5 break-words">
              Déplacer le message
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
            {/* Snippet of the message to move */}
            <div className="text-xs bg-cordel-bg-light p-2.5 rounded border border-cordel-master-dark/15 font-bold">
              <div className="flex justify-between items-center text-[9px] uppercase font-black opacity-60 mb-1">
                <span>Auteur : {reply?.auteurNom || 'Inconnu'}</span>
                <span>Date : {reply?.dateCreation ? new Date(reply.dateCreation).toLocaleDateString() : ''}</span>
              </div>
              <p className="text-encre-noire text-[11px] line-clamp-3 italic opacity-90">
                "{reply?.message?.replace(/<[^>]*>?/gm, '')}"
              </p>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2 bg-white/40 p-1.5 rounded border border-cordel-master-dark/15">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`py-1.5 px-2 text-[10px] font-black rounded uppercase transition-all cursor-pointer ${
                  mode === 'existing'
                    ? 'theme-bg-ocre text-encre-noire border border-encre-noire shadow-sm'
                    : 'text-cordel-master-dark hover:bg-white/50'
                }`}
              >
                📋 Sujet existant
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`py-1.5 px-2 text-[10px] font-black rounded uppercase transition-all cursor-pointer ${
                  mode === 'new'
                    ? 'theme-bg-ocre text-encre-noire border border-encre-noire shadow-sm'
                    : 'text-cordel-master-dark hover:bg-white/50'
                }`}
              >
                ✨ Nouveau sujet
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                  Discussion destination *
                </label>
                {otherThreads.length === 0 ? (
                  <p className="text-xs italic text-red-600 font-bold p-2 bg-red-50 border rounded">
                    Aucune autre discussion disponible dans cette catégorie pour déplacer le message.
                  </p>
                ) : (
                  <select
                    value={targetThreadId}
                    onChange={(e) => setTargetThreadId(e.target.value)}
                    required
                    className="theme-input text-xs font-bold bg-white"
                  >
                    {otherThreads.map((th) => (
                      <option key={th.id} value={th.id}>
                        {th.titre} ({th.reponses ? th.reponses.length : 0} rép.)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                    Titre du nouveau sujet *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Titre du sujet extrait..."
                    required
                    className="theme-input text-xs font-bold w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                      Salon / Canal *
                    </label>
                    <select
                      value={newChannelId}
                      onChange={(e) => setNewChannelId(e.target.value)}
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

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                      Catégorie
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
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
              </>
            )}
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
              disabled={isSubmitting || (mode === 'existing' ? !targetThreadId : !newTitle.trim())}
              className="py-2 px-4 text-xs font-black uppercase tracking-wider shrink-0"
            >
              {isSubmitting ? "Traitement..." : mode === 'existing' ? "Déplacer vers ce sujet" : "Créer le nouveau sujet"}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
