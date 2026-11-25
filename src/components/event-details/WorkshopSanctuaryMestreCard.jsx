import React, { useState, useMemo } from 'react';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import useConfirm from '../../hooks/useConfirm';
import {
  normalizeWorkshopPolicy,
  partitionWorkshopParticipants,
  resolveEventTargetPupitres
} from '../../utils/workshopSanctuaryUtils';
import { sanctuarizeConfirmedWorkshopEvent } from '../../utils/workshopSanctuaryNotifications';

/**
 * Encart Mestre de rattrapage et de sanctuarisation sur un atelier déjà confirmé ayant un pupitre attribué.
 * Permet de ne conserver en `Présent` que les titulaires du pupitre cible et de relancer les hors-pupitre.
 */
export default function WorkshopSanctuaryMestreCard({
  event,
  allUsers = [],
  pupitresList = [],
  linkedInstruments = [],
  defaultPolicy = 'reconfirm',
  onCompleted,
  onlyWhenDirty = false
}) {
  const { confirm } = useConfirm();
  const [selectedPolicy, setSelectedPolicy] = useState(() =>
    normalizeWorkshopPolicy(event?.workshopPollOtherPupitresPolicy || defaultPolicy)
  );
  const [processing, setProcessing] = useState(false);

  const targetPupitres = useMemo(
    () => resolveEventTargetPupitres(event, pupitresList, linkedInstruments),
    [event, pupitresList, linkedInstruments]
  );

  const allUsersMap = useMemo(() => {
    const m = {};
    (allUsers || []).forEach((u) => {
      const uid = u?.id || u?.uid;
      if (uid) m[uid] = { ...u, id: uid, name: `${u.prenom || ''} ${u.nom || ''}`.trim() || u.displayName || 'Membre' };
    });
    return m;
  }, [allUsers]);

  const preview = useMemo(() => {
    if (targetPupitres.length === 0) return null;
    return partitionWorkshopParticipants({
      event, targetPupitres, policy: selectedPolicy, allUsersMap, pupitresList, linkedInstruments, mode: 'catchup'
    });
  }, [event, targetPupitres, selectedPolicy, allUsersMap, pupitresList, linkedInstruments]);

  if (!event?.id || event?.status === 'sondage' || event?.isPoll || targetPupitres.length === 0 || !preview) {
    return null;
  }

  const unconfirmedHorsPupitreCount = (event.inscriptions || []).filter(
    (ins) => ins?.status === 'present' && !ins?.reconfirmedAt &&
      !preview.titulairesPresent.some((t) => t.userId === ins.userId)
  ).length;

  if (onlyWhenDirty && unconfirmedHorsPupitreCount === 0) return null;

  const formatShortDate = (dateStr) => {
    if (!dateStr) return 'cette date';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const handleSanctuarize = async () => {
    if (processing) return;
    const pupitreLabel = targetPupitres.join(' & ');
    const titulairesCount = preview.titulairesPresent.length;
    const otherCount = selectedPolicy === 'strict' ? preview.removedStrictUsers.length : preview.reconfirmRecipients.length;
    const detailLine = selectedPolicy === 'strict'
      ? `• ${otherCount} membre(s) d'autres pupitres seront retiré(s) du créneau (mode strict).`
      : `• ${otherCount} membre(s) d'autres pupitres passeront en « À re-confirmer » et recevront une notification.`;

    const isOk = await confirm({
      title: `🔄 Sanctuariser le pupitre ${pupitreLabel} ?`,
      message: `Récapitulatif pour l'atelier du ${formatShortDate(event.date || event.dateDebut)} :\n\n• ${titulairesCount} titulaire(s) du pupitre ${pupitreLabel} restent en « Présent ».\n${detailLine}`,
      confirmText: 'Oui, sanctuariser et relancer',
      cancelText: 'Annuler',
      variant: 'vert'
    });
    if (!isOk) return;

    setProcessing(true);
    try {
      const res = await sanctuarizeConfirmedWorkshopEvent({
        db, event, policy: selectedPolicy, allUsersMap, pupitresList, linkedInstruments,
        formattedDate: formatShortDate(event.date || event.dateDebut)
      });
      if (onCompleted) {
        onCompleted(`Pupitre ${pupitreLabel} sanctuarisé (${res.titulairesPresent.length} présent(s), ${res.notifiedCount} relancé(s)) !`);
      }
    } catch (err) {
      console.error('WorkshopSanctuaryMestreCard - Erreur sanctuarisation :', err);
      alert("Erreur lors de la sanctuarisation de l'atelier.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 bg-cordel-bg-light border-dashed select-none">
      <div className="flex flex-col gap-2.5 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            🥁 Atelier pupitre {targetPupitres.join(' & ')} — Gestion des hors-pupitre
          </span>
          {unconfirmedHorsPupitreCount > 0 && (
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[9px] font-black uppercase">
              {unconfirmedHorsPupitreCount} hors-pupitre inscrit(s) via sondage
            </span>
          )}
        </div>

        <select
          value={selectedPolicy}
          onChange={(e) => setSelectedPolicy(normalizeWorkshopPolicy(e.target.value))}
          disabled={processing}
          className="theme-input text-[11px] font-bold py-1.5 px-2 bg-cordel-bg"
        >
          <option value="reconfirm">Titulaires confirmés, autres pupitres sur re-confirmation (avec notification)</option>
          <option value="strict">Strictement réservé au pupitre retenu (retrait des autres pupitres)</option>
        </select>

        <button
          type="button"
          disabled={processing}
          onClick={handleSanctuarize}
          className="w-full sm:w-auto px-3.5 py-2 text-[11px] font-black uppercase tracking-wider rounded border-2 border-encre-noire bg-[var(--color-cordel-vert)] text-white shadow-[2px_2px_0px_0px_#181716] hover:brightness-105 active:translate-y-0.5 cursor-pointer disabled:opacity-50 transition-all text-center"
        >
          {processing ? 'Sanctuarisation en cours...' : '🔄 Sanctuariser le pupitre cible & relancer les hors-pupitre'}
        </button>
      </div>
    </CordelCard>
  );
}
