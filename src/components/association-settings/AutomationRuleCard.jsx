import React from 'react';

/**
 * Carte individuelle d'une règle d'automatisation dans TabAutomations.
 * Extrait de TabAutomations.jsx (Règle du Boy Scout, < 140 lignes).
 */
export default function AutomationRuleCard({
  rule: r,
  toggleRuleActive,
  handleEdit,
  handleDelete,
  t
}) {
  return (
    <div
      className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
        r.isActive
          ? 'bg-white/80 dark:bg-black/20 border-cordel-master-dark/25'
          : 'bg-neutral-100/60 opacity-60 border-dashed border-neutral-300'
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-xs text-cordel-wood">
            {r.titre}
          </span>

          {r.pointDeReference === 'on_report_published' ? (
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {t('settings.communication.tabAutomations.publicationVaral') || '📜 Publication Varal'}
            </span>
          ) : r.pointDeReference === 'on_registration_deadline_summary' ? (
            <span className="bg-amber-100 text-amber-950 border border-amber-500 text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              📊 Bilan clôture inscriptions
            </span>
          ) : r.pointDeReference === 'after_event' ? (
            <span className="bg-purple-100 text-purple-900 border border-purple-400 text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {t('settings.communication.tabAutomations.postEvenementJ')}{r.joursApres || r.joursAvant || 1})
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {t('settings.communication.tabAutomations.preEvenementJ')}{r.joursAvant || 0})
            </span>
          )}

          <span className="bg-amber-100/70 text-amber-900 border border-amber-300 text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase">
            🎭 {r.typeEvenementCible === 'tous' ? t('settings.communication.tabAutomations.tousEvenements') : r.typeEvenementCible}
          </span>

          {r.pointDeReference === 'on_registration_deadline_summary' ? (
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase">
              🏷️ {(Array.isArray(r.targetTags) && r.targetTags.length > 0 ? r.targetTags : ['Mestre', 'CA', 'Bureau']).join(', ')}
            </span>
          ) : (
            <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase">
              🎯 {r.publicCible === 'tous' ? t('settings.communication.tabAutomations.toutLeMonde') : r.publicCible === 'present_only' ? t('settings.communication.tabAutomations.confirmesPresents') : r.publicCible === 'inscrits' ? t('settings.communication.tabAutomations.inscrits') : r.publicCible === 'percussion' ? t('settings.communication.tabAutomations.percussion') : r.publicCible === 'danse' ? t('settings.communication.tabAutomations.danse') : t('settings.communication.tabAutomations.publicConcerne')}
            </span>
          )}
        </div>

        <p className="text-[11px] font-bold text-encre-noire/80 mt-0.5">
          {t('settings.communication.tabAutomations.declenchement')}
          {r.pointDeReference === 'eventConfirmed' ? (
            <span className="font-extrabold ml-1">{t('settings.communication.tabAutomations.immediatALaConfirmation')}</span>
          ) : r.pointDeReference === 'eventCancelled' ? (
            <span className="font-extrabold ml-1">{t('settings.communication.tabAutomations.immediatALAnnulation')}</span>
          ) : r.pointDeReference === 'reportValidation' ? (
            <span className="font-extrabold ml-1">{t('settings.communication.tabAutomations.immediatALaSoumissionDu')}</span>
          ) : r.pointDeReference === 'on_report_published' ? (
            <span className="font-extrabold text-emerald-800 ml-1">{t('settings.communication.tabAutomations.immediatALaPublicationAuVaral') || 'À la publication au Varal'}</span>
          ) : r.pointDeReference === 'on_registration_deadline_summary' ? (
            <span className="font-extrabold text-amber-900 ml-1">📊 À la clôture des inscriptions (Bilan pour l'encadrement)</span>
          ) : r.pointDeReference === 'after_event' ? (
            <>
              <span className="underline decoration-amber-500 font-extrabold mx-1">{r.joursApres || r.joursAvant || 1} {t('settings.communication.tabAutomations.jourS')}</span>
              {t('settings.communication.tabAutomations.apresLaDateDeFin')}
            </>
          ) : (
            <>
              <span className="underline decoration-amber-500 font-extrabold mx-1">{r.joursAvant} {t('settings.communication.tabAutomations.jourS')}</span>
              {r.pointDeReference === 'registrationDeadline' ? t('settings.communication.tabAutomations.avantLaDateLimiteD') : t('settings.communication.tabAutomations.avantLaDateDeL')}
            </>
          )}
        </p>

        <p className="text-[10px] font-semibold text-cordel-master-dark opacity-75 italic truncate">
          💬 "{r.messageNotification}"
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
        <div className="flex items-center gap-1.5 bg-cordel-bg-light/90 py-1 px-2 rounded border border-cordel-master-dark/20 shadow-xs">
          <button
            type="button"
            role="switch"
            aria-checked={r.isActive}
            onClick={() => toggleRuleActive(r.id, r.isActive)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-encre-noire transition-colors duration-200 ease-in-out focus:outline-none ${
              r.isActive ? 'bg-[var(--color-cordel-vert)]' : 'bg-neutral-300'
            }`}
            title={r.isActive ? 'Désactiver la règle immédiatement' : 'Activer la règle immédiatement'}
          >
            <span
              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                r.isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-[8.5px] font-black uppercase tracking-wider select-none">
            {r.isActive ? <span className="text-[var(--color-cordel-vert)]">{t('settings.communication.tabAutomations.on')}</span> : <span className="text-neutral-500">{t('settings.communication.tabAutomations.off')}</span>}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleEdit(r)}
          className="text-[9.5px] font-extrabold uppercase bg-cordel-bg text-encre-noire border border-encre-noire px-2.5 py-1 rounded hover:bg-neutral-200 cursor-pointer"
        >
          {t('settings.communication.tabAutomations.editer')}
        </button>

        <button
          type="button"
          onClick={() => handleDelete(r)}
          className="text-[9.5px] font-extrabold uppercase bg-red-100 text-red-800 border border-red-400 px-2 py-1 rounded hover:bg-red-200 cursor-pointer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

