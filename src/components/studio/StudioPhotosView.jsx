import React, { useState } from 'react';
import StudioCloudHeader from './StudioCloudHeader';
import StudioEventsMediaTable from './StudioEventsMediaTable';
import WidgetDocuments from '../WidgetDocuments';
import { useTranslation } from '../LanguageContext';

/**
 * Composant : StudioPhotosView
 * 
 * Vue principale du Pôle Studio pour l'onglet 'varal-photos'.
 * Fait la passerelle entre l'infrastructure Cloud de l'association (Framaspace, Drive, Dropbox),
 * la régie de récolte des clichés d'événements (QR-Codes & File drops),
 * et la visualisation des livrets photos suspendus à la corde du Varal.
 * 
 * @param {string} groupId Identifiant de l'association
 * @param {Object} user Utilisateur authentifié
 * @param {Object} profileData Données de profil utilisateur
 * @param {string} role Rôle de l'utilisateur
 * @param {boolean} isSystemAdmin Indique si super-admin
 * @param {Array} userTags Tags de l'utilisateur
 * @param {boolean} canWrite Droits d'écriture dans le pôle studio
 * @param {Function} onNavigateToView Callback de navigation
 * @param {Function} onBack Callback de retour
 */
export default function StudioPhotosView({
  groupId,
  user,
  profileData,
  role,
  isSystemAdmin,
  userTags,
  canWrite = true,
  onNavigateToView,
  onBack
}) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState('recolte'); // 'recolte' | 'varal'

  return (
    <div className="w-full flex flex-col gap-5 text-left select-none max-w-5xl mx-auto animate-fade-in">
      
      {/* 1. En-tête : Passerelle Cloud racine de l'association */}
      <StudioCloudHeader groupId={groupId} canWrite={canWrite} />

      {/* 2. Commutateur Cordel des sous-vues */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/30 pb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('recolte')}
            className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'recolte'
                ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-[2px_2px_0px_0px_#181716] translate-x-[0.5px] translate-y-[0.5px]'
                : 'bg-cordel-card-bg text-encre-noire/75 border-encre-noire/40 hover:border-encre-noire hover:text-encre-noire'
            }`}
          >
            <span>📸</span>
            <span>{t('studioPhotos.tabRecolte') || "Récolte & Albums Prestations"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('varal')}
            className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'varal'
                ? 'bg-amber-300 text-encre-noire border-encre-noire shadow-[2px_2px_0px_0px_#181716] translate-x-[0.5px] translate-y-[0.5px]'
                : 'bg-cordel-card-bg text-encre-noire/75 border-encre-noire/40 hover:border-encre-noire hover:text-encre-noire'
            }`}
          >
            <span>🪢</span>
            <span>{t('studioPhotos.tabVaral') || "Varal Photos (Livrets)"}</span>
          </button>
        </div>

        {/* Note contextuelle */}
        <span className="text-[10.5px] text-encre-noire/60 font-medium italic">
          {activeSubTab === 'recolte'
            ? "Associez les dossiers partagés et imprimez les QR-Codes de chaque date."
            : "Consultez les albums officiels sous forme de livrets Cordel suspendus."}
        </span>
      </div>

      {/* 3. Contenu de la sous-vue active */}
      {activeSubTab === 'recolte' ? (
        <StudioEventsMediaTable groupId={groupId} canWrite={canWrite} />
      ) : (
        <div data-tour="studio-varal-photos-rope" className="w-full">
          <WidgetDocuments
            role={role || profileData?.role}
            isSystemAdmin={isSystemAdmin || profileData?.isSystemAdmin}
            groupId={groupId}
            user={user}
            profileData={profileData}
            poleId="studio"
            userTags={userTags}
            canWrite={canWrite}
            onNavigateToView={onNavigateToView}
          />
        </div>
      )}
    </div>
  );
}
