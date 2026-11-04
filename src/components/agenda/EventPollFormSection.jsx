import React from 'react';
import { extractDayPart, extractTimePart, resolveDefaultTimesForForm } from '../../utils/eventScheduleUtils';

const FALLBACK_POLL_PUPITRES = ['Alfaias', 'Caixas', 'Gonguê', 'Agbê', 'Mineiro', 'Timbal', 'Chant', 'Danse'];

/** Sous-composant dédié à la configuration et à l'édition d'un sondage de dates (< 140 lignes) */
export default function EventPollFormSection({ formData = {}, setFormData, pupitresList = [], eventTypeConfigs = {}, isEdit = false, tr }) {
  const translate = (k, fb) => (typeof tr === 'function' && tr(k) !== k ? tr(k) : fb);
  const availablePupitres = Array.isArray(pupitresList) && pupitresList.length > 0 ? pupitresList : FALLBACK_POLL_PUPITRES;
  const isPollActive = Boolean(formData.isPoll || formData.status === 'sondage' || formData.pollGroupId);
  const pollMode = formData.pollMode || 'single_winner';
  const selectedPupitres = Array.isArray(formData.pollTargetPupitres) ? formData.pollTargetPupitres : [];
  const pollDates = Array.isArray(formData.pollDates) && formData.pollDates.length >= 2 ? formData.pollDates : [formData.date || '', ''];

  const padSlots = (dates, ids, count) => {
    const nextDates = [...dates];
    const nextIds = [...ids];
    while (nextDates.length < Math.max(2, count)) { nextDates.push(''); nextIds.push(null); }
    return { pollDates: nextDates, pollOptionIds: nextIds };
  };

  const handleModeChange = (e, nextMode) => {
    e.preventDefault(); e.stopPropagation();
    setFormData((prev) => {
      const curDates = Array.isArray(prev.pollDates) && prev.pollDates.length >= 2 ? prev.pollDates : [prev.date || '', ''];
      const curIds = Array.isArray(prev.pollOptionIds) ? prev.pollOptionIds : curDates.map(() => null);
      const curPupitres = Array.isArray(prev.pollTargetPupitres) ? prev.pollTargetPupitres : [];
      const padded = nextMode === 'pupitre_dispatch' ? padSlots(curDates, curIds, curPupitres.length) : { pollDates: curDates, pollOptionIds: curIds };
      return { ...prev, isPoll: true, pollMode: nextMode, ...padded };
    });
  };

  const handleTogglePupitre = (e, pupitre) => {
    e.preventDefault(); e.stopPropagation();
    setFormData((prev) => {
      const current = Array.isArray(prev.pollTargetPupitres) ? prev.pollTargetPupitres : [];
      const nextPupitres = current.includes(pupitre) ? current.filter((p) => p !== pupitre) : [...current, pupitre];
      const curDates = Array.isArray(prev.pollDates) && prev.pollDates.length >= 2 ? prev.pollDates : [prev.date || '', ''];
      const curIds = Array.isArray(prev.pollOptionIds) ? prev.pollOptionIds : curDates.map(() => null);
      return { ...prev, isPoll: true, pollTargetPupitres: nextPupitres, ...padSlots(curDates, curIds, nextPupitres.length) };
    });
  };

  const handleDateChange = (idx, value) => {
    setFormData((prev) => {
      const curDates = Array.isArray(prev.pollDates) && prev.pollDates.length >= 2 ? [...prev.pollDates] : [prev.date || '', ''];
      const curIds = Array.isArray(prev.pollOptionIds) ? [...prev.pollOptionIds] : curDates.map(() => null);
      let finalVal = value;
      if (value && !curDates[idx] && (!extractTimePart(value) || extractTimePart(value) === '00:00')) {
        const { startTime } = resolveDefaultTimesForForm(prev, eventTypeConfigs);
        const refTime = extractTimePart(curDates[0]) || extractTimePart(prev.date) || startTime;
        finalVal = `${extractDayPart(value)}T${refTime}`;
      }
      curDates[idx] = finalVal;
      return { ...prev, pollDates: curDates, pollOptionIds: curIds, date: idx === 0 ? finalVal : prev.date };
    });
  };

  const handleRemoveDate = (e, idx) => {
    e.preventDefault(); e.stopPropagation();
    setFormData((prev) => {
      const curDates = Array.isArray(prev.pollDates) && prev.pollDates.length >= 2 ? prev.pollDates : [prev.date || '', ''];
      if (curDates.length <= 2) return prev;
      const curIds = Array.isArray(prev.pollOptionIds) ? prev.pollOptionIds : curDates.map(() => null);
      const removedId = curIds[idx] || null;
      const nextDates = curDates.filter((_, i) => i !== idx);
      const nextIds = curIds.filter((_, i) => i !== idx);
      const prevDeleted = Array.isArray(prev.deletedPollOptionIds) ? prev.deletedPollOptionIds : [];
      const nextDeleted = removedId && !prevDeleted.includes(removedId) ? [...prevDeleted, removedId] : prevDeleted;
      return { ...prev, pollDates: nextDates, pollOptionIds: nextIds, deletedPollOptionIds: nextDeleted, date: nextDates[0] || prev.date };
    });
  };

  const handleAddDate = (e) => {
    e.preventDefault(); e.stopPropagation();
    setFormData((prev) => {
      const curDates = Array.isArray(prev.pollDates) && prev.pollDates.length >= 2 ? prev.pollDates : [prev.date || '', ''];
      const curIds = Array.isArray(prev.pollOptionIds) ? prev.pollOptionIds : curDates.map(() => null);
      return { ...prev, isPoll: true, pollDates: [...curDates, ''], pollOptionIds: [...curIds, null] };
    });
  };

  return (
    <div className="p-3 bg-amber-50/80 dark:bg-amber-950/20 border-2 border-dashed border-amber-500/40 rounded flex flex-col gap-2.5 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <div>
            <label className="text-xs font-black uppercase text-cordel-wood cursor-pointer">
              {isEdit ? translate('agenda.pollEditTitle', 'Dates et paramètres du sondage') : translate('agenda.pollCreateTitle', 'Créer un sondage de dates')}
            </label>
            <p className="text-[9px] font-semibold text-encre-noire/70">
              {isEdit ? translate('agenda.pollEditSubtitle', 'Modifier, ajouter ou retirer des créneaux (les votes existants sont préservés)') : translate('agenda.pollCreateSubtitle', 'Proposer plusieurs créneaux au vote des membres')}
            </p>
          </div>
        </div>
        {!isEdit && (
          <input type="checkbox" checked={isPollActive} onChange={(e) => setFormData((prev) => ({ ...prev, isPoll: e.target.checked, pollMode: prev.pollMode || 'single_winner', pollTargetPupitres: Array.isArray(prev.pollTargetPupitres) ? prev.pollTargetPupitres : [], pollDates: prev.pollDates || [prev.date || '', ''], registrationDeadlineMode: e.target.checked && (!prev.registrationDeadlineMode || prev.registrationDeadlineMode === 'none') ? 'relative' : prev.registrationDeadlineMode, registrationDeadlineDaysBefore: prev.registrationDeadlineDaysBefore || 7 }))} className="w-4 h-4 accent-amber-600 cursor-pointer" />
        )}
      </div>

      {isPollActive && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-dashed border-amber-500/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              { id: 'single_winner', label: translate('agenda.pollModeSingleWinner', '📅 Date unique (1 seul créneau retenu)') },
              { id: 'pupitre_dispatch', label: translate('agenda.pollModePupitreDispatch', '🥁 Répartition par pupitre (1 créneau attribué par pupitre)') }
            ].map((opt) => (
              <button key={opt.id} type="button" onClick={(e) => handleModeChange(e, opt.id)} className={`text-[10px] font-black p-2 rounded border text-left cursor-pointer transition-all ${pollMode === opt.id ? 'bg-cordel-wood text-white border-encre-noire shadow-xs' : 'bg-white/80 text-encre-noire border-amber-400/50 hover:bg-white'}`}>{opt.label}</button>
            ))}
          </div>

          {pollMode === 'pupitre_dispatch' && (
            <div className="flex flex-col gap-1.5 p-2 bg-white/70 dark:bg-black/20 rounded border border-amber-400/40">
              <span className="text-[9px] uppercase font-black text-cordel-wood">{translate('agenda.pollTargetPupitresLabel', 'Pupitres à répartir sur les créneaux :')}</span>
              <div className="flex flex-wrap gap-1.5">
                {availablePupitres.map((p) => (
                  <button key={p} type="button" onClick={(e) => handleTogglePupitre(e, p)} className={`text-[9.5px] font-black px-2 py-1 rounded border cursor-pointer transition-all ${selectedPupitres.includes(p) ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire shadow-xs' : 'bg-cordel-bg-light text-encre-noire/75 border-encre-noire/25 hover:bg-amber-100/50'}`}>{selectedPupitres.includes(p) ? '✓ ' : '+ '}{p}</button>
                ))}
              </div>
            </div>
          )}

          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{translate('agenda.pollProposedDatesLabel', 'Créneaux proposés (minimum 2 dates)')}</label>
          {pollDates.map((optDate, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-[10px] font-black text-cordel-wood w-16 shrink-0">Option {idx + 1} :</span>
              <input type="datetime-local" value={optDate} onChange={(e) => handleDateChange(idx, e.target.value)} required={idx < 2} className="theme-input text-xs py-1 flex-1 bg-white" />
              {pollDates.length > 2 && <button type="button" onClick={(e) => handleRemoveDate(e, idx)} title="Supprimer cette date du sondage" className="text-[10px] text-red-600 font-bold px-1.5 py-0.5 hover:bg-red-50 rounded cursor-pointer">✕</button>}
            </div>
          ))}
          <button type="button" onClick={handleAddDate} className="text-[9px] font-black uppercase text-cordel-wood hover:underline text-left mt-0.5 cursor-pointer">+ {translate('agenda.pollAddDateBtn', 'Ajouter une option de date')}</button>
        </div>
      )}
    </div>
  );
}
