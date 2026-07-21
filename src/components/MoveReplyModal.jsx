import React, { useState } from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
          <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
            <div>
              <span className="text-[8px] font-black uppercase text-cordel-wood tracking-widest block">
                ➡️ Modération Porte-voix
              </span>
              <h3 className="font-cactus font-black text-base text-encre-noire tracking-wider uppercase mt-0.5">
                Déplacer le message
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                disabled={isSubmitting || (mode === 'existing' ? !targetThreadId : !newTitle.trim())}
                className="py-2 px-4 text-xs font-black uppercase tracking-wider"
              >
                {isSubmitting ? "Traitement..." : mode === 'existing' ? "Déplacer vers ce sujet" : "Créer le nouveau sujet"}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
