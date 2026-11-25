import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../LanguageContext';
import { normalizeVolunteerShift, computeVolunteerCoverage } from '../../../utils/volunteerShiftUtils';

/**
 * Sous-composant du tiroir "Bénévoles Jour J" d'une commission.
 * Saisie aérée sur 3 lignes (Poste + Quota explicite / Date + Début + Fin / Consigne + Bouton).
 */
export default function CommissionBenevolesSection({
  commission = null, event = null, creneaux = [], onChangeCreneaux, usersMap = {}
}) {
  const { t } = useTranslation();
  const [nomTache, setNomTache] = useState('');
  const [dateJour, setDateJour] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [quotaRequis, setQuotaRequis] = useState(2);
  const [consigne, setConsigne] = useState('');

  const eventDateJour = /^\d{4}-\d{2}-\d{2}/.test(String(event?.date || '')) ? String(event.date).slice(0, 10) : '';
  const ssotInscritsMap = event?.covoiturage?.benevolatInscrits || null;

  const normalizedLocal = useMemo(() => (creneaux || []).map((c, idx) => normalizeVolunteerShift(c, {
    index: idx, eventDateJour, commissionId: commission?.id || null, commissionTitre: commission?.titre || '', ssotInscritsMap, usersMap
  })), [creneaux, eventDateJour, commission, ssotInscritsMap, usersMap]);

  const linkedFromEvent = useMemo(() => {
    if (!commission?.id) return [];
    const localIds = new Set(normalizedLocal.map((c) => c.id));
    return (event?.volunteerShifts || [])
      .filter((s) => s?.commissionId === commission.id)
      .map((s, idx) => normalizeVolunteerShift(s, { index: idx, eventDateJour, commissionId: commission.id, commissionTitre: commission.titre || '', ssotInscritsMap, usersMap }))
      .filter((s) => !localIds.has(s.id));
  }, [commission, event, normalizedLocal, eventDateJour, ssotInscritsMap, usersMap]);

  const coverage = useMemo(() => computeVolunteerCoverage([...normalizedLocal, ...linkedFromEvent]), [normalizedLocal, linkedFromEvent]);

  const handleAddCreneau = (e) => {
    e.preventDefault();
    if (!nomTache.trim()) return;
    const cleanQuota = Math.max(0, parseInt(quotaRequis, 10) || 0);
    const horaires = heureDebut && heureFin ? `${heureDebut} - ${heureFin}` : heureDebut;
    const newCreneau = {
      id: `creneau_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nomTache: nomTache.trim(), role: nomTache.trim(), titre: nomTache.trim(),
      dateJour: dateJour || eventDateJour, heureDebut, horaireDebut: heureDebut,
      heureFin, horaireFin: heureFin, horaires,
      quotaRequis: cleanQuota, nbPlaces: cleanQuota, places: cleanQuota,
      consigne: consigne.trim(), commissionId: commission?.id || null, commissionTitre: commission?.titre || '', inscrits: []
    };
    onChangeCreneaux([...creneaux, newCreneau]);
    setNomTache(''); setHeureDebut(''); setHeureFin(''); setQuotaRequis(2); setConsigne('');
  };
  const onEnterAdd = (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); handleAddCreneau(e); } };

  return (
    <div className="flex flex-col gap-3 p-3 bg-[var(--cordel-bg)]/60 rounded-lg border border-[var(--theme-border)]/20 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="font-black uppercase text-[var(--theme-text)] flex items-center gap-1.5">
          <span>🤝</span> Bénévoles Jour J ({coverage.shiftsCount})
        </h4>
        {coverage.totalRequired > 0 && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-black border border-[var(--theme-border)] text-white ${coverage.isComplete ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'}`}>
            {coverage.filledPosts} / {coverage.totalRequired} {t('agenda.volunteerPostsFilled') || 'postes pourvus'}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
        {coverage.shiftsCount === 0 ? (
          <p className="text-[11px] opacity-65 italic p-2 text-center">Aucun créneau de bénévolat créé.</p>
        ) : (
          [...normalizedLocal.map((c) => ({ ...c, isExternalLink: false })), ...linkedFromEvent.map((c) => ({ ...c, isExternalLink: true }))].map((c) => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded border border-[var(--theme-border)]/20 bg-[var(--theme-input-bg)] gap-2">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold">{c.nomTache}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--cordel-bg)] border border-[var(--theme-border)]/25">
                    {c.dateJour && c.dateJour !== eventDateJour ? `${c.dateJour} • ` : ''}{c.horaires || 'Horaire libre'}
                  </span>
                </div>
                {c.consigne && <span className="text-[10px] italic opacity-75 truncate">{c.consigne}</span>}
                <span className="text-[10px] opacity-75 mt-0.5">👥 {c.quotaRequis > 0 ? `${c.inscrits.length} / ${c.quotaRequis} inscrits` : `${c.inscrits.length} inscrit(s)`}</span>
              </div>
              {!c.isExternalLink && <button type="button" onClick={() => onChangeCreneaux(creneaux.filter((raw) => raw.id !== c.id))} className="text-[var(--color-cordel-rouge)] p-1 font-black cursor-pointer" title="Supprimer">✕</button>}
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2.5 pt-2.5 border-t border-[var(--theme-border)]/15">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerTaskLabel') || 'Poste / Mission'} *</label>
            <input type="text" placeholder={t('agenda.volunteerTaskPlaceholder') || 'Ex. : Buvette, Montage, Accueil...'} value={nomTache} onChange={(e) => setNomTache(e.target.value)} onKeyDown={onEnterAdd} className="theme-input px-2.5 py-1.5 text-xs w-full" />
          </div>
          <div className="shrink-0 flex flex-col gap-0.5">
            <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerQuotaLabel') || 'Quota (0 = libre)'}</label>
            <div className="flex items-center gap-1.5">
              <input type="number" min="0" max="99" value={quotaRequis} onChange={(e) => setQuotaRequis(e.target.value)} onKeyDown={onEnterAdd} className="theme-input w-20 pl-2.5 pr-1.5 py-1.5 text-xs font-bold text-left tabular-nums" />
              <span className="text-[10.5px] font-bold opacity-80 whitespace-nowrap">{t('agenda.volunteerQuotaUnitShort') || 'places'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerDateOptional') || 'Date (veille/lend.)'}</label>
            <input type="date" value={dateJour || eventDateJour} onChange={(e) => setDateJour(e.target.value)} onKeyDown={onEnterAdd} className="theme-input px-2 py-1.5 text-xs w-full" />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerStartTime') || 'Début'}</label>
            <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} onKeyDown={onEnterAdd} className="theme-input px-2 py-1.5 text-xs w-full" />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerEndTime') || 'Fin'}</label>
            <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} onKeyDown={onEnterAdd} className="theme-input px-2 py-1.5 text-xs w-full" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <label className="text-[8.5px] uppercase font-bold">{t('agenda.volunteerConsigneLabel') || 'Consigne pratique (optionnel)'}</label>
            <input type="text" placeholder={t('agenda.volunteerConsignePlaceholder') || 'Ex. : Clés auprès du référent bar'} value={consigne} onChange={(e) => setConsigne(e.target.value)} onKeyDown={onEnterAdd} className="theme-input px-2.5 py-1.5 text-xs w-full" />
          </div>
          <button type="button" onClick={handleAddCreneau} disabled={!nomTache.trim()} className="shrink-0 px-3.5 py-1.5 font-black rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white disabled:opacity-40 cursor-pointer">
            ＋ {t('agenda.volunteerAddSlotShort') || 'Créneau'}
          </button>
        </div>
      </div>
    </div>
  );
}
