import React, { useState } from 'react';
import { doc, updateDoc, writeBatch, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Composant Modulaire : EventWardrobeSummaryCard
 * Tableau de bord et cockpit post-événement pour le pilotage et la réconciliation du vestiaire.
 * Affiche le bilan des déclarations de tenues (bac asso, lavage domicile, retouches),
 * permet la relance push individuelle avec mémoire anti-spam,
 * et l'action groupée de bascule des pièces du bac en « Au sale » dans l'inventaire réel.
 *
 * @param {Object} props.event - Document de l'événement
 * @param {Object} props.user - Utilisateur connecté
 * @param {Object} props.profileData - Profil de l'utilisateur connecté
 * @param {boolean} props.isAuthorized - Habilitation gestion/mestre/costumerie
 */
export default function EventWardrobeSummaryCard({
  event,
  user,
  profileData,
  isAuthorized
}) {
  const [sendingReminderUserId, setSendingReminderUserId] = useState(null);
  const [remindedUserIds, setRemindedUserIds] = useState([]);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  if (!event || !isAuthorized) return null;

  const inscriptions = Array.isArray(event.inscriptions) ? event.inscriptions : [];
  const presentInscriptions = inscriptions.filter((ins) => ins.status === 'present');

  // Si aucun participant présent, on ne bloque pas mais on l'indique
  const totalPresents = presentInscriptions.length;

  // Calcul des compteurs par statut de tenue
  const renduInscriptions = presentInscriptions.filter((ins) => ins.costumeStatus === 'rendu');
  const lavageInscriptions = presentInscriptions.filter((ins) => ins.costumeStatus === 'lavage');
  const retoucheInscriptions = presentInscriptions.filter((ins) => ins.costumeStatus === 'retouche');
  const pendingInscriptions = presentInscriptions.filter(
    (ins) => !ins.costumeStatus && !ins.costumeDeclaration
  );

  const totalDeclared = totalPresents - pendingInscriptions.length;
  const declarationRate = totalPresents > 0 ? Math.round((totalDeclared / totalPresents) * 100) : 0;

  // Date du jour pour le verrouillage anti-spam (fuseau Europe/Paris ou local)
  const todayDateStr = new Date().toISOString().split('T')[0];

  /**
   * Vérifie si un membre a déjà été relancé aujourd'hui ou il y a moins de 24h
   */
  const isMemberRemindedToday = (ins) => {
    if (!ins) return false;
    if (ins.userId && remindedUserIds.includes(ins.userId)) return true;
    if (!ins.lastCostumeReminderSentAt) return false;
    if (ins.lastCostumeReminderSentAt.startsWith(todayDateStr)) return true;
    const diffHours = (Date.now() - new Date(ins.lastCostumeReminderSentAt).getTime()) / (1000 * 3600);
    return diffHours < 24;
  };

  /**
   * Envoi d'une relance Push individuelle vers un membre n'ayant pas encore déclaré
   * et enregistrement atomique de l'horodatage lastCostumeReminderSentAt sur son inscription.
   */
  const handleSendSingleReminder = async (targetIns) => {
    if (!targetIns.userId || sendingReminderUserId) return;
    setSendingReminderUserId(targetIns.userId);
    setFeedbackMessage(null);

    try {
      const eventName = event.titre || event.nom || "Événement";
      const deepLinkUrl = `/mon-vestiaire?eventId=${event.id}`;
      const effectiveGroupId = event.groupId || profileData?.groupId;

      // 1. Dépôt de la notification dans la file d'attente push
      await addDoc(collection(db, 'notifications_queue'), {
        groupId: effectiveGroupId,
        recipientId: targetIns.userId,
        title: `🎭 Tenue : ${eventName}`,
        body: "Pense à indiquer si ton costume est au bac ou à laver !",
        eventId: event.id,
        url: deepLinkUrl,
        createdAt: new Date().toISOString()
      });

      // 2. Mémorisation de la relance sur l'inscription (anti-spam partagé dans Firestore)
      const nowIso = new Date().toISOString();
      const updatedInscriptions = inscriptions.map((ins) => {
        if (ins.userId === targetIns.userId) {
          return {
            ...ins,
            lastCostumeReminderSentAt: nowIso
          };
        }
        return ins;
      });

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { inscriptions: updatedInscriptions });

      // 3. Mise à jour optimiste locale immédiate
      setRemindedUserIds((prev) => [...prev, targetIns.userId]);

      setFeedbackMessage({
        type: 'success',
        text: `Relance Push envoyée avec succès à ${targetIns.userName || 'ce membre'} !`
      });
    } catch (err) {
      console.error("EventWardrobeSummaryCard - Erreur relance push :", err);
      setFeedbackMessage({
        type: 'error',
        text: "Erreur lors de l'envoi de la notification de relance."
      });
    } finally {
      setSendingReminderUserId(null);
    }
  };

  /**
   * Action groupée : bascule les tenues du bac asso en « Au sale / À laver »
   * et propage la mise à jour vers la collection wardrobeInventory et wardrobe-pieces dans un writeBatch.
   */
  const handleBatchMarkAsLaundry = async () => {
    if (batchUpdating || renduInscriptions.length === 0) return;
    setBatchUpdating(true);
    setFeedbackMessage(null);

    try {
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();
      const effectiveGroupId = event.groupId || profileData?.groupId;

      // 1. Marquage de l'événement et des inscriptions concernées
      const updatedInscriptions = inscriptions.map((ins) => {
        if (ins.costumeStatus === 'rendu') {
          return {
            ...ins,
            costumeBacStatut: 'au_sale',
            costumeBacTraiteAt: nowIso
          };
        }
        return ins;
      });

      const eventRef = doc(db, 'events', event.id);
      batch.update(eventRef, {
        costumesBacTraites: true,
        costumesBacStatus: 'au_sale',
        costumesBacDate: nowIso,
        inscriptions: updatedInscriptions
      });

      // 2. Recherche et mise à jour des pièces physiques réelles (wardrobeInventory & wardrobe-pieces)
      const renduUserIds = new Set(renduInscriptions.map((i) => i.userId).filter(Boolean));
      if (renduUserIds.size > 0 && effectiveGroupId) {
        const collectionsToUpdate = ['wardrobeInventory', 'wardrobe-pieces'];

        for (const collName of collectionsToUpdate) {
          try {
            const invQuery = query(
              collection(db, collName),
              where('groupId', '==', effectiveGroupId)
            );
            const invSnap = await getDocs(invQuery);

            invSnap.forEach((pieceDoc) => {
              const pieceData = pieceDoc.data();
              const pieceOwnerId = pieceData.emprunteurId || pieceData.assignedTo || pieceData.userId;
              // Si la pièce est attribuée à un membre ayant déposé sa tenue au bac
              if (pieceOwnerId && renduUserIds.has(pieceOwnerId)) {
                batch.update(pieceDoc.ref, {
                  statut: 'au_sale',
                  localisationPhysique: 'local',
                  derniereSortieEventId: event.id,
                  updatedAt: nowIso
                });
              }
            });
          } catch (collErr) {
            // Ignorer silencieusement si l'une des collections n'est pas déployée
            console.warn(`EventWardrobeSummaryCard - Recherche ${collName} :`, collErr?.message || collErr);
          }
        }
      }

      await batch.commit();

      setFeedbackMessage({
        type: 'success',
        text: `Les ${renduInscriptions.length} tenues du bac ont bien été basculées en « Au sale / À laver » !`
      });
    } catch (err) {
      console.error("EventWardrobeSummaryCard - Erreur action groupée bac au sale :", err);
      setFeedbackMessage({
        type: 'error',
        text: "Erreur lors de la mise à jour des tenues en lavage."
      });
    } finally {
      setBatchUpdating(false);
    }
  };

  const isBacAlreadyProcessed = Boolean(event.costumesBacTraites);

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 select-none">
      {/* En-tête Bilan Vestiaire */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-cordel-master-dark/25 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎭</span>
            <h4 className="text-xs font-heading font-black tracking-wider text-cordel-wood uppercase">
              Bilan du Vestiaire Post-Prestation
            </h4>
          </div>
          <p className="text-[10px] text-cordel-master-dark font-medium mt-0.5">
            Réconciliation des tenues de scène et suivi des retours au local.
          </p>
        </div>

        {/* Jauge globale de conformité */}
        <div className="flex items-center gap-2 shrink-0 bg-cordel-bg-light/90 px-3 py-1.5 rounded border border-cordel-master-dark/20">
          <span className="text-[10px] font-black uppercase text-cordel-master-dark">
            Déclarations :
          </span>
          <span className="text-xs font-black text-cordel-wood">
            {totalDeclared} / {totalPresents}
          </span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
            declarationRate === 100 
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-400' 
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}>
            {declarationRate}%
          </span>
        </div>
      </div>

      {/* Message de notification / feedback */}
      {feedbackMessage && (
        <div className={`mt-3 p-2 rounded text-[11px] font-bold border ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
            : 'bg-red-50 text-red-900 border-red-400'
        }`}>
          {feedbackMessage.type === 'success' ? '✅' : '⚠️'} {feedbackMessage.text}
        </div>
      )}

      {/* Grille des 3 statuts de retour */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3.5">
        {/* Statut 1 : Au bac asso */}
        <div className="p-3 rounded-[6px_10px_8px_12px] bg-emerald-50/80 border-2 border-[#2d6a4f] flex flex-col shadow-[1.5px_1.5px_0px_0px_#2d6a4f]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[var(--color-cordel-vert)] flex items-center gap-1.5 uppercase">
              <span>📦</span> Au bac asso
            </span>
            <span className="text-base font-black text-[var(--color-cordel-vert)]">
              {renduInscriptions.length}
            </span>
          </div>
          <p className="text-[9.5px] text-cordel-master-dark/80 font-semibold mt-1">
            Déposées au local dans la malle commune après la sortie.
          </p>
        </div>

        {/* Statut 2 : En lavage maison */}
        <div className="p-3 rounded-[6px_10px_8px_12px] bg-amber-50/80 border-2 border-[#c05621] flex flex-col shadow-[1.5px_1.5px_0px_0px_#c05621]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[var(--color-cordel-ocre)] flex items-center gap-1.5 uppercase">
              <span>🧺</span> Lavage maison
            </span>
            <span className="text-base font-black text-[var(--color-cordel-ocre)]">
              {lavageInscriptions.length}
            </span>
          </div>
          <p className="text-[9.5px] text-cordel-master-dark/80 font-semibold mt-1">
            Emportées par les membres pour entretien à domicile.
          </p>
        </div>

        {/* Statut 3 : Retouche nécessaire */}
        <div className="p-3 rounded-[6px_10px_8px_12px] bg-red-50/80 border-2 border-[var(--theme-primary)] flex flex-col shadow-[1.5px_1.5px_0px_0px_#8b2a1a]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[var(--theme-primary)] flex items-center gap-1.5 uppercase">
              <span>🧵</span> À retoucher
            </span>
            <span className="text-base font-black text-[var(--theme-primary)]">
              {retoucheInscriptions.length}
            </span>
          </div>
          <p className="text-[9.5px] text-cordel-master-dark/80 font-semibold mt-1">
            Signalées avec une réparation ou un accroc à traiter.
          </p>
        </div>
      </div>

      {/* Signalements particuliers (Retouches & Détériorations) */}
      {retoucheInscriptions.length > 0 && (
        <div className="mb-4 p-3 bg-red-50/90 border border-dashed border-[var(--theme-primary)]/40 rounded-[6px_10px_8px_12px]">
          <h5 className="text-[10px] font-black uppercase text-[var(--theme-primary)] flex items-center gap-1.5 tracking-wider mb-2">
            <span>⚠️</span> Signalements pour l'Atelier Couture ({retoucheInscriptions.length}) :
          </h5>
          <div className="space-y-1.5">
            {retoucheInscriptions.map((ins, idx) => (
              <div 
                key={ins.userId || idx} 
                className="text-xs font-medium text-encre-noire bg-white/80 p-2 rounded border border-red-200"
              >
                <strong className="text-cordel-wood font-black">
                  {ins.userName || 'Membre'} :
                </strong>{' '}
                <span className="italic font-semibold text-neutral-800">
                  "{ins.costumeRetoucheNote || 'Retouche demandée sans détail précisé.'}"
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Membres n'ayant pas encore déclaré */}
      <div className="mb-4 border-t border-dashed border-cordel-master-dark/20 pt-3">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-[10.5px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>⏳</span> Membres en attente de déclaration ({pendingInscriptions.length}) :
          </h5>
          {pendingInscriptions.length === 0 && (
            <span className="text-[9.5px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              🎉 Toutes les déclarations ont été reçues !
            </span>
          )}
        </div>

        {pendingInscriptions.length > 0 && (
          <div className="flex flex-col divide-y divide-cordel-master-dark/15 border border-dashed border-cordel-master-dark/25 rounded-[6px_10px_8px_12px] bg-white/60 overflow-hidden">
            {pendingInscriptions.map((ins) => {
              const isSending = sendingReminderUserId === ins.userId;
              const alreadySentToday = isMemberRemindedToday(ins);

              return (
                <div 
                  key={ins.userId} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 px-3 gap-2 hover:bg-amber-50/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👤</span>
                    <span className="text-xs font-bold text-encre-noire">
                      {ins.userName || 'Membre participant'}
                    </span>
                    {(ins.instrumentChoisi || ins.instrument) && (
                      <span className="text-[9px] font-extrabold uppercase bg-cordel-bg-light text-cordel-master-dark px-1.5 py-0.2 rounded border border-cordel-master-dark/20">
                        {ins.instrumentChoisi || ins.instrument}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {alreadySentToday ? (
                      <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded">
                        Déjà relancé aujourd'hui ✅
                      </span>
                    ) : (
                      <CordelButton
                        type="button"
                        variant="ocre"
                        disabled={isSending || batchUpdating}
                        onClick={() => handleSendSingleReminder(ins)}
                        className="text-[9.5px] py-1 px-2.5 font-black uppercase tracking-wider flex items-center gap-1 shadow-xs"
                      >
                        {isSending ? "Envoi..." : "🔔 Relancer par Push"}
                      </CordelButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action groupée sur les tenues du bac */}
      {renduInscriptions.length > 0 && (
        <div className="pt-3 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cordel-bg-light/50 p-3 rounded-[6px_10px_8px_12px]">
          <div>
            <span className="text-xs font-black text-encre-noire flex items-center gap-1.5">
              <span>🧺</span> Action groupée de gestion du bac :
            </span>
            <p className="text-[10px] text-cordel-master-dark font-medium mt-0.5">
              Bascule simultanément les {renduInscriptions.length} tenues déposées au bac en statut « Au sale / À laver » dans l'inventaire physique.
            </p>
          </div>

          <div className="shrink-0">
            {isBacAlreadyProcessed ? (
              <span className="text-[10.5px] font-black uppercase text-emerald-900 bg-emerald-100 border border-emerald-400 px-3 py-1.5 rounded flex items-center gap-1.5">
                ✅ Bac traité ({event.costumesBacDate ? new Date(event.costumesBacDate).toLocaleDateString('fr-FR') : 'Au sale'})
              </span>
            ) : (
              <CordelButton
                type="button"
                variant="vert"
                useExtremeBorder={true}
                disabled={batchUpdating}
                onClick={handleBatchMarkAsLaundry}
                className="text-xs py-2 px-3.5 font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                {batchUpdating ? "Traitement..." : `🧺 Basculer les ${renduInscriptions.length} tenues en « Au sale »`}
              </CordelButton>
            )}
          </div>
        </div>
      )}
    </CordelCard>
  );
}
