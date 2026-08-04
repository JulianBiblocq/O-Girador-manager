import React from 'react';
import CreateThreadForm from '../CreateThreadForm';
import { XiloClose } from '../XiloIcons';

/**
 * Modale de création d'un nouveau sujet dans le forum.
 *
 * @param {Object} props Propriétés du composant
 * @param {boolean} props.isOpen État d'ouverture
 * @param {Function} props.onClose Callback de fermeture
 * @param {string} props.groupId Identifiant du groupe
 * @param {Object} props.user Utilisateur connecté
 * @param {Object} props.profileData Profil de l'utilisateur
 * @param {Array} props.channels Liste des salons disponibles
 * @param {string} props.activeChannelId Salon actif lors du clic
 * @param {Function} props.onThreadCreated Callback déclenché après publication
 * @param {Function} props.t Fonction de traduction
 */
export default function NewThreadModal({
  isOpen,
  onClose,
  groupId,
  user,
  profileData,
  channels,
  activeChannelId,
  onThreadCreated,
  t
}) {
  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none outline-none"
    >
      <div className="bg-cordel-bg border-4 border-encre-noire rounded-[8px_12px_10px_14px] shadow-[6px_6px_0px_0px_#181716] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 1. En-tête de modale (Fixe) */}
        <div className="flex-shrink-0 flex items-center justify-between p-3.5 bg-cordel-wood text-white border-b-2 border-encre-noire">
          <h3 className="font-black text-base uppercase tracking-wider">
            ✍️ Lancer une nouvelle discussion
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white cursor-pointer"
          >
            <XiloClose size={18} />
          </button>
        </div>

        {/* Formulaire de création (Body défilable + Footer fixe) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <CreateThreadForm
            groupId={groupId}
            user={user}
            profileData={profileData}
            channels={channels}
            activeChannelId={activeChannelId}
            onCancel={onClose}
            onSuccess={() => {
              if (onThreadCreated) onThreadCreated();
              onClose();
            }}
            inModal={true}
          />
        </div>
      </div>
    </div>
  );
}
