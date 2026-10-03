import React, { useState } from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * Sous-composant formulaire pour ajouter ou modifier une équivalence culturelle.
 *
 * @param {Object} props
 * @param {Object|null} props.initialData Données de l'équivalence à éditer, ou null pour un ajout
 * @param {Function} props.onSubmit Callback déclenché lors de la soumission valide
 * @param {Function} props.onCancel Callback d'annulation
 */
export default function VocabForm({
  initialData = null,
  onSubmit,
  onCancel
}) {
  const { t } = useTranslation();
  const [preferred, setPreferred] = useState(initialData?.preferred || initialData?.recommande || '');
  const [avoid, setAvoid] = useState(initialData?.avoid || initialData?.aEviter || '');
  const [context, setContext] = useState(initialData?.context || initialData?.contexte || '');
  const [activeChip, setActiveChip] = useState(initialData ? initialData.activeChip !== false : true);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanPreferred = preferred.trim();
    const cleanAvoid = avoid.trim();
    const cleanContext = context.trim();

    if (!cleanPreferred) {
      setErrorMessage(t('studio.lexique.veuillezRenseignerLeTermePrivilegie'));
      return;
    }

    onSubmit({
      preferred: cleanPreferred,
      recommande: cleanPreferred,
      avoid: cleanAvoid,
      aEviter: cleanAvoid,
      context: cleanContext,
      contexte: cleanContext,
      activeChip
    });
  };

  return (
    <form onSubmit={handleSubmit} className="my-3 p-3 bg-amber-50/60 dark:bg-neutral-800/60 border border-amber-300 dark:border-amber-700/50 rounded-md">
      <div className="text-xs font-black uppercase text-cordel-wood mb-2">
        {initialData ? t('studio.lexique.modifierLEquivalenceCulturelle') : t('studio.lexique.ajouterUneEquivalenceCulturelle')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-cordel-master-dark mb-1">
            {t('studio.lexique.termePrivilegieRecommande')}
          </label>
          <input
            type="text"
            value={preferred}
            onChange={(e) => setPreferred(e.target.value)}
            placeholder={t('studio.lexique.exBatuque')}
            className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-encre-noire/30 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-cordel-vert)] font-semibold"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-cordel-master-dark mb-1">
            {t('studio.lexique.termeAEviterMoinsPertinent')}
          </label>
          <input
            type="text"
            value={avoid}
            onChange={(e) => setAvoid(e.target.value)}
            placeholder={t('studio.lexique.exBateria')}
            className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-encre-noire/30 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-cordel-vert)]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-cordel-master-dark mb-1">
            {t('studio.lexique.pourquoiContexteExplicatif')}
          </label>
          <textarea
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t('studio.lexique.explicationHistoriqueSignificationDansLa')}
            className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-encre-noire/30 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-cordel-vert)]"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="activeChipToggle"
            checked={activeChip}
            onChange={(e) => setActiveChip(e.target.checked)}
            className="w-4 h-4 rounded text-[var(--color-cordel-vert)] accent-[var(--color-cordel-vert)] cursor-pointer"
          />
          <label htmlFor="activeChipToggle" className="text-xs font-bold text-cordel-master-dark cursor-pointer select-none">
            {t('studio.lexique.activerEnPastilleDInsertion')}
          </label>
        </div>
      </div>

      {errorMessage && (
        <p className="text-[11px] font-bold text-[var(--color-cordel-rouge)] mt-2">
          ⚠️ {errorMessage}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-dashed border-encre-noire/20">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 rounded text-xs font-semibold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 transition-all cursor-pointer"
        >
          {t('studio.lexique.annuler')}
        </button>
        <button
          type="submit"
          className="px-3 py-1 rounded text-xs font-bold text-white bg-[var(--color-cordel-vert)] hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          {t('studio.lexique.enregistrer')}
        </button>
      </div>
    </form>
  );
}
