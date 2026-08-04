import React from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';

/**
 * Étape 3 : Sélection des événements passés, saisie des bilans et sélection des photos (2 à 4 photos max).
 *
 * @param {Array} pastEvents - Événements passés récents
 * @param {Array} selectedPastIds - IDs des événements passés cochés
 * @param {Function} togglePastEvent - Callback pour cocher/décocher un événement passé
 * @param {Object} pastEventBilans - Mapping id -> bilan textuel
 * @param {Function} setPastBilan - Callback de mise à jour du bilan d'un événement
 * @param {Array} availablePhotos - URLs de toutes les photos disponibles
 * @param {Array} selectedPhotos - URLs des photos actuellement sélectionnées
 * @param {Function} togglePhotoSelection - Callback de sélection de photo
 * @param {Function} onPrev - Callback retour étape 2
 * @param {Function} onNext - Callback passage étape 4
 */
export default function Step3RetourImages({
  pastEvents,
  selectedPastIds,
  togglePastEvent,
  pastEventBilans,
  setPastBilan,
  availablePhotos,
  selectedPhotos,
  togglePhotoSelection,
  onPrev,
  onNext
}) {
  const photoCount = selectedPhotos.length;
  const isPhotoCountValid = photoCount >= 2 && photoCount <= 4;

  return (
    <CordelCard className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-2">
          <span>🖼️</span> Étape 3 - Retour en images
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Sélectionnez les événements passés récents, complétez le bilan/remerciements et choisissez entre 2 et 4 photos pour illustrer la newsletter.
        </p>
      </div>

      {/* Section 1 : Événements passés & bilans */}
      <div>
        <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-3 flex items-center gap-2">
          <span>📝</span> Événements passés récents & Bilans
        </h3>

        {pastEvents.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-[var(--theme-border-radius,6px)] bg-stone-50 dark:bg-stone-800/50 text-xs text-stone-500">
            Aucun événement passé récent à afficher.
          </div>
        ) : (
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {pastEvents.map((evt) => {
              const isSelected = selectedPastIds.includes(evt.id);
              const title = evt.title || evt.titre || evt.nom || 'Sans titre';
              const date = evt.date || evt.startDate || '';

              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-[var(--theme-border-radius,6px)] border transition-all ${
                    isSelected
                      ? 'border-[#2d6a4f] bg-[#2d6a4f]/5'
                      : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'
                  }`}
                >
                  <div
                    onClick={() => togglePastEvent(evt.id)}
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-5 h-5 accent-[#2d6a4f] rounded cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {title}
                      </span>
                      {date && (
                        <span className="ml-2 text-xs font-semibold text-stone-500">
                          ({date})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Zone de saisie du bilan/remerciements si sélectionné */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Bilan / Remerciements pour cet événement :
                      </label>
                      <textarea
                        rows={2}
                        value={pastEventBilans[evt.id] || ''}
                        onChange={(e) => setPastBilan(evt.id, e.target.value)}
                        placeholder="Ex : Superbe ambiance malgré la pluie ! Merci à toutes l'équipe..."
                        className="w-full text-xs p-2.5 rounded-[var(--theme-border-radius,4px)] border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2 : Sélection des photos (2 à 4 photos max) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <span>📷</span> Grille de sélection des photos
          </h3>

          {/* Indicateur avec couleur sémantique */}
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              isPhotoCountValid
                ? 'bg-[#2d6a4f]/15 text-[#2d6a4f] dark:text-emerald-400'
                : 'bg-[#c05621]/15 text-[#c05621] dark:text-amber-400'
            }`}
          >
            {photoCount} / 4 photos sélectionnées (2 à 4 requis)
          </span>
        </div>

        {availablePhotos.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-[var(--theme-border-radius,6px)] bg-stone-50 dark:bg-stone-800/50 text-xs text-stone-500">
            Aucune photo enregistrée dans le système pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto p-1">
            {availablePhotos.map((url, idx) => {
              const isSelected = selectedPhotos.includes(url);
              const isDisabled = !isSelected && photoCount >= 4;

              return (
                <div
                  key={idx}
                  onClick={() => !isDisabled && togglePhotoSelection(url)}
                  className={`relative aspect-square rounded-[var(--theme-border-radius,6px)] overflow-hidden border-2 transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-[#2d6a4f] ring-2 ring-[#2d6a4f]/50 scale-[0.98]'
                      : isDisabled
                      ? 'border-stone-200 dark:border-stone-800 opacity-40 cursor-not-allowed'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-400'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Photo souvenir ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Badge de sélection */}
                  <div
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all ${
                      isSelected
                        ? 'bg-[#2d6a4f] text-white scale-110'
                        : 'bg-black/50 text-white opacity-70 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected ? '✓' : '+'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Message d'avertissement sémantique Ocre si nombre invalide */}
        {!isPhotoCountValid && (
          <p className="mt-2 text-xs font-semibold text-[#c05621] dark:text-amber-400 flex items-center gap-1">
            <span>⚠️</span> Veuillez sélectionner entre 2 et 4 photos pour finaliser la mise en page de la newsletter.
          </p>
        )}
      </div>

      {/* Navigation entre étapes */}
      <div className="mt-8 flex justify-between items-center pt-4 border-t border-stone-200 dark:border-stone-700">
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
          Suivant : Récapitulatif ➔
        </CordelButton>
      </div>
    </CordelCard>
  );
}
