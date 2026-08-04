import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';

/**
 * Étape 4 : Aperçu récapitulatif du JSON assemblé et déclenchement de la génération du brouillon.
 *
 * @param {Object} payloadJSON - Objet JSON standardisé assemblé
 * @param {Function} onSubmit - Callback d'envoi vers /api/newsletter/export
 * @param {boolean} exporting - Indicateur de chargement d'exportation
 * @param {Object|null} exportResult - Résultat d'exportation (succès ou erreur)
 * @param {Function} onPrev - Callback retour à l'étape 3
 */
export default function Step4Recapitulatif({
  payloadJSON,
  onSubmit,
  exporting,
  exportResult,
  onPrev
}) {
  const [copied, setCopied] = useState(false);

  // Copier le JSON dans le presse-papier
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(payloadJSON, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <CordelCard className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
          <span>🎯</span> Étape 4 - Récapitulatif & Validation
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Vérifiez la structure du contenu assemblé avant de générer le brouillon dans le service d'emailing.
        </p>
      </div>

      {/* Message de succès d'exportation */}
      {exportResult && exportResult.success && (
        <div className="p-4 rounded-[var(--theme-border-radius,6px)] bg-[#2d6a4f]/15 border border-[#2d6a4f] text-[#2d6a4f] dark:text-emerald-300 space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>✅</span> Brouillon généré avec succès !
          </div>
          <p className="text-xs text-stone-700 dark:text-stone-300">
            {exportResult.data?.message || 'Le brouillon de votre newsletter a été transmis à votre service d\'emailing.'}
          </p>
          {exportResult.data?.draftId && (
            <p className="text-xs font-mono opacity-80">
              ID Brouillon : {exportResult.data.draftId}
            </p>
          )}
        </div>
      )}

      {/* Message d'erreur d'exportation */}
      {exportResult && !exportResult.success && (
        <div className="p-4 rounded-[var(--theme-border-radius,6px)] bg-[#8b2a1a]/15 border border-[#8b2a1a] text-[#8b2a1a] dark:text-rose-400 space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>❌</span> Échec de génération du brouillon
          </div>
          <p className="text-xs">
            {exportResult.error || 'Une erreur est survenue lors de l\'exportation.'}
          </p>
        </div>
      )}

      {/* Résumé synthétique visuel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Carte : Campagne & Message */}
        <div className="p-4 rounded-[var(--theme-border-radius,6px)] border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Campagne
          </span>
          <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-2">
            {payloadJSON.titre_campagne || 'Sans titre'}
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3">
            {payloadJSON.message_accueil || 'Aucun mot de bienvenue.'}
          </p>
        </div>

        {/* Carte : Prochaines dates */}
        <div className="p-4 rounded-[var(--theme-border-radius,6px)] border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Événements futurs ({payloadJSON.prochaines_dates?.length || 0})
          </span>
          <ul className="text-xs space-y-1 text-stone-700 dark:text-stone-300">
            {payloadJSON.prochaines_dates?.length > 0 ? (
              payloadJSON.prochaines_dates.map((d, i) => (
                <li key={i} className="truncate">
                  • <strong>{d.titre}</strong> ({d.date})
                </li>
              ))
            ) : (
              <li className="text-stone-400 italic">Aucune date sélectionnée</li>
            )}
          </ul>
        </div>

        {/* Carte : Événements passés & Photos */}
        <div className="p-4 rounded-[var(--theme-border-radius,6px)] border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Événements passés ({payloadJSON.evenements_passes?.length || 0})
          </span>
          <p className="text-xs text-stone-700 dark:text-stone-300 mb-2">
            {payloadJSON.evenements_passes?.map(e => e.titre).join(', ') || 'Aucun passé sélectionné'}
          </p>
          <div className="flex items-center gap-1.5 pt-2 border-t border-stone-200 dark:border-stone-700">
            <span className="text-xs text-stone-500 font-semibold">Photos associées :</span>
            <div className="flex -space-x-2">
              {payloadJSON.evenements_passes?.flatMap(e => e.photos || []).slice(0, 4).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt="Aperçu photo"
                  className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-stone-800"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visualiseur du JSON standardisé */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <span>⚙️</span> Payload JSON standardisé
          </h3>
          <button
            type="button"
            onClick={handleCopyJSON}
            className="text-xs font-semibold text-[#2d6a4f] dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            {copied ? '✓ Copié !' : '📋 Copier le JSON'}
          </button>
        </div>

        <pre className="p-4 rounded-[var(--theme-border-radius,6px)] bg-stone-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[320px] border border-stone-800">
          {JSON.stringify(payloadJSON, null, 2)}
        </pre>
      </div>

      {/* Actions de soumission et navigation */}
      <div className="mt-8 flex justify-between items-center pt-4 border-t border-stone-200 dark:border-stone-700">
        <CordelButton
          onClick={onPrev}
          className="border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 px-5 py-2 font-semibold rounded-[var(--theme-border-radius,6px)]"
        >
          ⬅ Précédent
        </CordelButton>

        <CordelButton
          onClick={onSubmit}
          disabled={exporting}
          className="bg-[#2d6a4f] hover:bg-[#23533e] text-white px-7 py-3 font-bold text-base rounded-[var(--theme-border-radius,6px)] flex items-center gap-2 shadow-md transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {exporting ? (
            <>
              <span className="animate-spin">⏳</span> Génération en cours...
            </>
          ) : (
            <>
              <span>🚀</span> Générer le brouillon
            </>
          )}
        </CordelButton>
      </div>
    </CordelCard>
  );
}
