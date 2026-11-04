import React from 'react';
import CordelCard from '../CordelCard';
import { XiloClose, XiloBox } from '../XiloIcons';
import { useTranslation } from '../LanguageContext';

/**
 * Liste compacte des demandes d'articles déjà enregistrées par l'adhérent
 * pour la campagne de commande groupée en cours.
 */
export default function WidgetUserOrderRequestsList({
  userRequests = [],
  catalog = [],
  getArticleLabel,
  onDeleteRequest
}) {
  const { t } = useTranslation();

  if (!Array.isArray(userRequests) || userRequests.length === 0) {
    return null;
  }

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="py-3 px-4">
      <h5 className="text-[9px] font-extrabold tracking-wider text-cordel-wood uppercase border-b border-dashed border-cordel-master-dark/15 pb-1 mb-2 flex items-center gap-1">
        <XiloBox size={12} /> {t('widgetCommandes.myRequests') || 'Ma commande'}
      </h5>
      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
        {userRequests.map((req) => {
          const artObj = catalog.find((item) => item.nom === req.article);
          return (
            <div
              key={req.id}
              className="text-xs flex justify-between items-center py-1 border-b border-dashed border-encre-noire/5 last:border-0 last:pb-0 gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {artObj && artObj.imageUrl && (
                  <div className="w-8 h-8 rounded border border-encre-noire/15 overflow-hidden bg-white shrink-0 shadow-[1px_1px_0px_0px_rgba(26,26,26,0.1)] flex items-center justify-center">
                    <img src={artObj.imageUrl} alt={req.article} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-extrabold text-encre-noire flex items-center gap-1.5 flex-wrap">
                    {req.quantite} {t('widgetCommandes.unit') || 'u'} {getArticleLabel(req.article)}
                    {req.isPersonalOrder ? (
                      <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] px-1 py-0.5 border-dashed">
                        {t('widgetCommandes.personalBadge') || 'Personnel'}
                      </span>
                    ) : (
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] px-1 py-0.5 border-dashed">
                        {t('widgetCommandes.suggestionBadge') || 'Suggestion'}
                      </span>
                    )}
                    {req.status === 'validated' ? (
                      <span className="theme-stamp-badge border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 text-[7px] px-1 py-0.5 border-dashed">
                        {t('ordersManager.statusValidated') || 'Validé'}
                      </span>
                    ) : (
                      <span className="theme-stamp-badge theme-stamp-badge-wood opacity-75 text-[7px] px-1 py-0.5 border-dashed">
                        {t('ordersManager.statusPending') || 'En attente'}
                      </span>
                    )}
                  </span>
                  {req.notes && (
                    <p className="text-[9px] text-cordel-master-dark/70 font-semibold truncate">
                      {t('widgetCommandes.notesLabel') || 'Note'} : {req.notes}
                    </p>
                  )}
                  {req.suggestion && (
                    <p className="text-[9px] text-cordel-wood font-extrabold truncate">
                      💡 Suggestion : {req.suggestion}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteRequest(req.id)}
                className="p-1 border border-dashed border-red-400 hover:border-red-600 text-red-500 rounded cursor-pointer shrink-0 ml-2 flex items-center justify-center"
                title="Retirer"
              >
                <XiloClose size={8} />
              </button>
            </div>
          );
        })}
      </div>
    </CordelCard>
  );
}

