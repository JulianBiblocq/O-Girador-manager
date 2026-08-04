import React from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';

/**
 * Étape 2 : Sélection des événements à venir depuis Firestore.
 *
 * @param {Array} upcomingEvents - Liste des événements futurs
 * @param {Array} selectedUpcomingIds - IDs des événements futurs cochés
 * @param {Function} toggleUpcomingEvent - Callback pour cocher/décocher
 * @param {Function} onPrev - Callback pour revenir à l'étape 1
 * @param {Function} onNext - Callback pour passer à l'étape 3
 */
export default function Step2ProchainesDates({
  upcomingEvents,
  selectedUpcomingIds,
  toggleUpcomingEvent,
  onPrev,
  onNext
}) {
  return (
    <CordelCard className="p-6">
      <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
        <span>📅</span> Étape 2 - Prochaines dates
      </h2>
      <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
        Cochez les événements futurs à intégrer dans la newsletter. Le titre, la date, le lieu et la description seront extraits automatiquement.
      </p>

      {upcomingEvents.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-[var(--theme-border-radius,6px)] bg-stone-50 dark:bg-stone-800/50">
          <p className="text-stone-500 dark:text-stone-400 italic">
            Aucun événement à venir trouvé dans le calendrier. Vous pouvez poursuivre sans événement futur.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {upcomingEvents.map((evt) => {
            const isSelected = selectedUpcomingIds.includes(evt.id);
            const title = evt.title || evt.titre || evt.nom || 'Sans titre';
            const date = evt.date || evt.startDate || 'Date non précisée';
            const location = evt.location || evt.lieu || evt.adresse || 'Lieu non renseigné';
            const description = evt.description || evt.details || evt.publicDescription || 'Aucune description.';

            return (
              <div
                key={evt.id}
                onClick={() => toggleUpcomingEvent(evt.id)}
                className={`p-4 rounded-[var(--theme-border-radius,6px)] border cursor-pointer transition-all duration-150 flex items-start gap-4 ${
                  isSelected
                    ? 'border-[#2d6a4f] bg-[#2d6a4f]/10 shadow-sm'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-400'
                }`}
              >
                {/* Case à cocher */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Géré au clic sur le conteneur
                  className="mt-1 w-5 h-5 accent-[#2d6a4f] rounded cursor-pointer shrink-0"
                />

                {/* Métadonnées de l'événement */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                      {title}
                    </h3>
                    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-[#2d6a4f]/15 text-[#2d6a4f] dark:text-emerald-300">
                      📆 {date}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5 flex items-center gap-1">
                    <span>📍</span> {location}
                  </p>

                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                    {description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Résumé du nombre sélectionné */}
      <div className="mt-4 text-xs font-medium text-stone-500 dark:text-stone-400">
        {selectedUpcomingIds.length} événement(s) sélectionné(s) pour les prochaines dates.
      </div>

      {/* Actions de navigation */}
      <div className="mt-8 flex justify-between items-center">
        <CordelButton
          onClick={onPrev}
          className="border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 px-5 py-2 font-semibold rounded-[var(--theme-border-radius,6px)]"
        >
          ⬅ Précédent
        </CordelButton>

        <CordelButton
          onClick={onNext}
          className="bg-[#2d6a4f] hover:bg-[#23533e] text-white px-6 py-2.5 font-semibold rounded-[var(--theme-border-radius,6px)] flex items-center gap-2"
        >
          Suivant : Retour en images ➔
        </CordelButton>
      </div>
    </CordelCard>
  );
}
