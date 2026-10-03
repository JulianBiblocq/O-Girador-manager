import React from 'react';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';

/**
 * Étape 1 : Saisie du titre de la campagne et du mot d'accueil / édito.
 *
 * @param {string} titreCampagne - Titre de la newsletter
 * @param {Function} setTitreCampagne - Callback de mise à jour du titre
 * @param {string} messageAccueil - Texte libre du mot d'accueil
 * @param {Function} setMessageAccueil - Callback de mise à jour du message
 * @param {Function} onNext - Callback pour passer à l'étape suivante
 */
export default function Step1MessageAccueil({
  titreCampagne,
  setTitreCampagne,
  messageAccueil,
  setMessageAccueil,
  onNext
}) {
  const { t } = useTranslation();
  return (
    <CordelCard className="p-6">
      <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
        <span>✉️</span> {t('studio.newsletter.etape1MessageDAccueil')}
      </h2>
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
        {t('studio.newsletter.redigezLeSujetPrincipalDe')}
      </p>

      <div className="space-y-5">
        {/* Champ : Titre de la campagne */}
        <div>
          <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
            {t('studio.newsletter.titreDeLaCampagne')} <span className="text-[var(--theme-primary)]">*</span>
          </label>
          <input
            type="text"
            value={titreCampagne}
            onChange={(e) => setTitreCampagne(e.target.value)}
            placeholder={t('studio.newsletter.exNewsletterRodaDeMaracatu')}
            className="w-full px-3.5 py-2.5 rounded-[var(--theme-border-radius,6px)] border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          />
        </div>

        {/* Champ : {t('studio.newsletter.motDeBienvenueEdito')} */}
        <div>
          <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
            {t('studio.newsletter.motDeBienvenueEdito')}
          </label>
          <textarea
            rows={6}
            value={messageAccueil}
            onChange={(e) => setMessageAccueil(e.target.value)}
            placeholder={t('studio.newsletter.chersAdherentsEtAmiE')}
            className="w-full px-3.5 py-2.5 rounded-[var(--theme-border-radius,6px)] border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          />
        </div>
      </div>

      {/* Bouton de passage à l'étape suivante */}
      <div className="mt-8 flex justify-end">
        <CordelButton
          onClick={onNext}
          disabled={!titreCampagne.trim()}
          className="bg-[var(--color-cordel-vert)] hover:bg-[#23533e] text-white px-6 py-2.5 font-semibold rounded-[var(--theme-border-radius,6px)] flex items-center gap-2"
        >
          {t('studio.newsletter.suivantProchainesDates')}
        </CordelButton>
      </div>
    </CordelCard>
  );
}
