import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { stripForbiddenMegaphones } from '../../utils/sanitizeIcons';

/**
 * Modale de création d'un salon ou sous-dossier du Porte-Voix (< 140 lignes).
 */
export default function CreateChannelModal({
  isOpen,
  onClose,
  onSubmit,
  newChannelName,
  setNewChannelName,
  newChannelParentId,
  setNewChannelParentId,
  channels = [],
  savingChannel = false,
  t,
  translate
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-md bg-cordel-bg p-6 relative select-none">
        <h3 className="font-extrabold text-sm text-encre-noire uppercase tracking-wider mb-4 border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-2">
          📂 {translate('forum.createChannelTitle', 'Créer un Salon ou Sous-dossier')}
        </h3>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-black uppercase text-cordel-master-dark mb-1">
              {translate('forum.channelNameLabel', 'Nom du salon ou du dossier')} *
            </label>
            <input
              type="text"
              required
              value={newChannelName}
              onChange={(e) => setNewChannelName(stripForbiddenMegaphones(e.target.value))}
              placeholder={translate('forum.channelNamePlaceholder', 'ex: Toadas, Percussions, Commission Fêtes...')}
              className="w-full p-2.5 text-xs font-bold bg-white border-2 border-encre-noire rounded focus:outline-none focus:ring-2 focus:ring-cordel-wood"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-cordel-master-dark mb-1">
              {translate('forum.channelParentLabel', 'Emplacement (Parent)')}
            </label>
            <select
              value={newChannelParentId}
              onChange={(e) => setNewChannelParentId(e.target.value)}
              className="w-full p-2.5 text-xs font-bold bg-white border-2 border-encre-noire rounded focus:outline-none focus:ring-2 focus:ring-cordel-wood cursor-pointer"
            >
              <option value="">📁 {translate('forum.channelRootOption', 'Racine (Nouvelle catégorie principale)')}</option>
              {channels.filter((c) => !c.parentId).map((ch) => (
                <option key={ch.id} value={ch.id}>
                  📂 {translate('forum.channelSubfolderPrefix', 'Sous-dossier de :')} {stripForbiddenMegaphones(ch.name).trim() || ch.name}
                </option>
              ))}
            </select>
            <p className="text-[9px] italic opacity-60 mt-1">
              {newChannelParentId
                ? translate('forum.channelSubfolderHint', 'Le salon apparaîtra comme un sous-dossier dans la catégorie choisie.')
                : translate('forum.channelRootHint', 'Le salon sera créé comme une nouvelle rubrique principale.')}
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-dashed border-cordel-master-dark/20">
            <CordelButton type="button" variant="default" onClick={onClose} className="px-3 py-1.5 text-xs font-bold">
              {t('common.cancel')}
            </CordelButton>
            <CordelButton type="submit" variant="ocre" disabled={savingChannel || !newChannelName.trim()} className="px-4 py-1.5 text-xs font-black uppercase">
              {savingChannel ? t('forum.creatingMsg') : translate('forum.createChannelSubmit', 'Créer le salon')}
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
