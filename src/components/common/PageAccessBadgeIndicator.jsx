import React from 'react';
import { formatTagGender } from '../../utils/tagUtils';
import { useTranslation } from '../LanguageContext';

export default function PageAccessBadgeIndicator({ 
  currentTab, 
  currentPole, 
  permissionsMatrice, 
  userTags = [], 
  isSystemAdminOrMestre = false,
  tagsDisponibles = []
}) {
  const { t } = useTranslation();

  // 1. Les adhérents sans aucune étiquette et sans rôle Admin/Mestre ne voient pas cet indicateur
  if (!isSystemAdminOrMestre && (!userTags || userTags.length === 0)) {
    return null;
  }

  // 2. Les onglets toujours ouverts/publics
  const publicTabs = ['profil', 'agenda', 'materiel', 'vestiaire', 'trombinoscope', 'forum', 'dashboard', 'varal'];
  if (publicTabs.includes(currentTab) || currentPole === 'accueil' || currentPole === 'mon-espace') {
    return null;
  }

  if (!permissionsMatrice || typeof permissionsMatrice !== 'object') {
    return null; // Pas de configuration explicite, on n'affiche rien pour préserver la clarté
  }

  // 3. Extraction des tags autorisés pour la page (priorité onglet, puis pôle)
  let authorizedTagIds = permissionsMatrice[currentTab];
  if (!authorizedTagIds || !Array.isArray(authorizedTagIds) || authorizedTagIds.length === 0) {
    authorizedTagIds = permissionsMatrice[currentPole];
  }

  // Si aucune restriction n'est configurée pour cette page, elle est ouverte (ou par défaut selon les rôles hardcodés)
  if (!authorizedTagIds || !Array.isArray(authorizedTagIds) || authorizedTagIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap text-xs mb-3 mt-1 px-1 select-none animate-fade-in w-full">
      <span className="flex items-center gap-1.5 text-stone-500 font-black uppercase tracking-wider text-[9px] mr-1" title="Cet onglet est restreint aux membres possédant une de ces étiquettes.">
        🔓 Réservé :
      </span>
      {authorizedTagIds.map(tagId => {
        // Résolution du libellé selon le tagId, au neutre/homme par défaut
        const label = formatTagGender(tagId, 'homme', false, tagsDisponibles);
        
        // Vérifie si l'utilisateur possède cette étiquette exacte (directement ou héritée)
        const hasTag = userTags.some(ut => {
           const utId = typeof ut === 'string' ? ut : (ut.id || ut.nomM || ut.nomF || '');
           return utId.toLowerCase() === tagId.toLowerCase();
        });

        // Surbrillance conditionnelle
        const baseClasses = "px-2 py-0.5 rounded-[3px_5px_4px_3px] text-[9px] font-black uppercase tracking-wider border transition-opacity flex items-center";
        const opacityClass = hasTag 
          ? 'opacity-100 bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]' 
          : 'opacity-45 bg-cordel-bg text-encre-noire border-encre-noire/40 shadow-none';
        
        return (
          <span 
            key={tagId} 
            className={`${baseClasses} ${opacityClass}`}
            title={hasTag ? "Vous avez accès via cette étiquette" : "Accessible via cette étiquette"}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
