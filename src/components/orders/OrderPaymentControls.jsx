import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { createInAppNotification } from '../../utils/inAppNotificationService';

/**
 * Contrôles financiers pour une commande de matériel nominative dans OrdersManager.
 * 
 * Permet au gestionnaire / trésorier de :
 * 1. Saisir ou modifier le montant facturé (avec parsing robuste virgule/point).
 * 2. Notifier l'adhérent par push FCM (passage en statut 'en_attente').
 * 3. Valider le règlement (passage en statut 'paye' + écriture automatique en recette
 *    dans 'transactions' avec traçabilité requestId).
 */
export default function OrderPaymentControls({ request, groupId }) {
  const initialAmount = request.montantFacture !== undefined
    ? String(request.montantFacture)
    : (request.prix ? String(request.prix * (request.quantite || 1)) : '');

  const [montantInput, setMontantInput] = useState(initialAmount);
  const [processing, setProcessing] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  const currentStatus = request.statutPaiement || 'non_facture';
  const isPaid = currentStatus === 'paye';

  // Sécurité #2 : Parsing robuste avec remplacement virgule par point
  const parseMontant = (val) => {
    return parseFloat(String(val).replace(',', '.'));
  };

  const handleNotifyMember = async () => {
    const cleanMontant = parseMontant(montantInput);
    if (isNaN(cleanMontant) || cleanMontant <= 0) {
      alert("Veuillez saisir un montant facturé valide supérieur à 0 €.");
      return;
    }

    setProcessing(true);
    setSuccessNotice('');
    try {
      const nowIso = new Date().toISOString();
      const requestRef = doc(db, 'campaignRequests', request.id);

      // 1. Mise à jour de la demande
      await updateDoc(requestRef, {
        montantFacture: cleanMontant,
        statutPaiement: 'en_attente',
        notifiedAt: nowIso
      });

      // 2. Notification Push FCM dans notifications_queue
      if (request.userId) {
        const effectiveGroupId = request.groupId || groupId;
        try {
          await addDoc(collection(db, 'notifications_queue'), {
            groupId: effectiveGroupId,
            recipientId: request.userId,
            userId: request.userId,
            title: "📦 Commande groupée : paiement attendu",
            body: `Votre commande pour ${request.quantite}x ${request.article} est prête à être réglée : ${cleanMontant.toFixed(2)} €. Retrouvez l'IBAN de l'association dans votre profil.`,
            url: '/app/profil',
            type: 'order_payment_pending',
            createdAt: nowIso
          });
        } catch (pushErr) {
          console.warn("OrderPaymentControls - Erreur push FCM :", pushErr);
        }

        // Notification in-app interne
        try {
          await createInAppNotification({
            userId: request.userId,
            groupId: effectiveGroupId,
            type: 'expense_status',
            titre: "📦 Commande groupée : paiement attendu",
            message: `Votre commande pour ${request.quantite}x ${request.article} est prête à être réglée : ${cleanMontant.toFixed(2)} €. Retrouvez l'IBAN de l'association dans votre profil.`,
            targetUrl: '/app/profil'
          });
        } catch (notifErr) {
          console.warn("OrderPaymentControls - Erreur notification in-app :", notifErr);
        }
      }

      setSuccessNotice("Adhérent notifié !");
      setTimeout(() => setSuccessNotice(''), 3000);
    } catch (err) {
      console.error("OrderPaymentControls - Erreur notification :", err);
      alert("Erreur lors de la notification : " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsPaid = async () => {
    // Sécurité #3 : Idempotence stricte
    if (isPaid || processing) return;

    const cleanMontant = parseMontant(montantInput || request.montantFacture);
    if (isNaN(cleanMontant) || cleanMontant <= 0) {
      alert("Veuillez saisir un montant facturé valide supérieur à 0 € avant d'enregistrer le paiement.");
      return;
    }

    const confirmPayment = window.confirm(
      `Confirmez-vous la réception du paiement de ${cleanMontant.toFixed(2)} € pour la commande de ${request.userName || 'Membre'} ?\n\nUne écriture comptable de recette sera automatiquement créée.`
    );
    if (!confirmPayment) return;

    setProcessing(true);
    setSuccessNotice('');
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const effectiveGroupId = request.groupId || groupId;
      const requestRef = doc(db, 'campaignRequests', request.id);

      // 1. Mise à jour statut dans campaignRequests
      await updateDoc(requestRef, {
        montantFacture: cleanMontant,
        statutPaiement: 'paye',
        datePaiement: nowIso
      });

      // 2. Insertion automatique en recette dans collection racine transactions
      await addDoc(collection(db, 'transactions'), {
        groupId: effectiveGroupId,
        date: Timestamp.fromDate(now),
        type: 'recette',
        categorie: 'Commandes groupées',
        libelle: `Règlement commande ${request.article || 'Matériel'} - ${request.userName || 'Membre'}`,
        montant: cleanMontant,
        requestId: request.id, // Traçabilité comptable garantie
        campaignId: request.campaignId || null
      });

      // 3. Notification push FCM de confirmation au membre
      if (request.userId) {
        try {
          await addDoc(collection(db, 'notifications_queue'), {
            groupId: effectiveGroupId,
            recipientId: request.userId,
            userId: request.userId,
            title: "✅ Paiement commande validé",
            body: `Votre règlement de ${cleanMontant.toFixed(2)} € pour ${request.article} a bien été enregistré. Merci !`,
            url: '/app/profil',
            type: 'order_paid',
            createdAt: nowIso
          });
        } catch (pushErr) {
          console.warn("OrderPaymentControls - Erreur push confirmation :", pushErr);
        }

        // Notification in-app interne
        try {
          await createInAppNotification({
            userId: request.userId,
            groupId: effectiveGroupId,
            type: 'expense_status',
            titre: "✅ Paiement commande validé",
            message: `Votre règlement de ${cleanMontant.toFixed(2)} € pour ${request.article} a bien été enregistré. Merci !`,
            targetUrl: '/app/profil'
          });
        } catch (notifErr) {
          console.warn("OrderPaymentControls - Erreur in-app confirmation :", notifErr);
        }
      }

      setSuccessNotice("Paiement validé & comptabilisé !");
      setTimeout(() => setSuccessNotice(''), 3000);
    } catch (err) {
      console.error("OrderPaymentControls - Erreur enregistrement paiement :", err);
      alert("Erreur lors de l'enregistrement du paiement : " + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded bg-white/70 dark:bg-black/30 border border-cordel-master-dark/15 text-xs text-left w-full mt-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[9px] uppercase font-black tracking-wider text-cordel-wood flex items-center gap-1">
          🪙 Facturation & Virement :
        </span>

        {/* Badge statut paiement */}
        {isPaid ? (
          <span className="theme-stamp-badge font-black uppercase text-[8px] px-2 py-0.5 bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border border-[var(--color-cordel-vert)]/40 rounded">
            🟢 Réglé
          </span>
        ) : currentStatus === 'en_attente' ? (
          <span className="theme-stamp-badge font-black uppercase text-[8px] px-2 py-0.5 bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border border-[var(--color-cordel-ocre)]/40 rounded animate-pulse">
            🟠 Virement attendu
          </span>
        ) : (
          <span className="theme-stamp-badge font-black uppercase text-[8px] px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-400/30 rounded">
            ⚪ Non facturé
          </span>
        )}
      </div>

      {/* Saisie montant et boutons d'action */}
      <div className="flex flex-wrap items-center gap-2 mt-0.5">
        <div className="flex items-center gap-1">
          <label className="text-[8.5px] uppercase font-extrabold text-cordel-master-dark/70">
            Montant :
          </label>
          <div className="relative w-24">
            <input
              type="text"
              value={montantInput}
              onChange={(e) => setMontantInput(e.target.value)}
              disabled={isPaid || processing}
              placeholder="0.00"
              className="theme-input text-xs font-bold py-0.5 px-1.5 pr-4 w-full bg-cordel-bg-light rounded text-right"
            />
            <span className="absolute right-1 top-0.5 text-[10px] font-bold opacity-60">€</span>
          </div>
        </div>

        {/* Actions si non payé */}
        {!isPaid && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleNotifyMember}
              disabled={processing || !montantInput}
              className="px-2 py-1 text-[8.5px] font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded border border-amber-900 shadow-[1px_1px_0px_0px_#181716] cursor-pointer disabled:opacity-50 select-none"
              title="Fixer le montant et envoyer un push FCM à l'adhérent"
            >
              🔔 Notifier ({currentStatus === 'en_attente' ? 'Rappeler' : 'Demander'})
            </button>

            <button
              type="button"
              onClick={handleMarkAsPaid}
              disabled={processing || isPaid || !montantInput}
              className="px-2 py-1 text-[8.5px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert)] hover:opacity-90 text-white rounded border border-green-950 shadow-[1px_1px_0px_0px_#181716] cursor-pointer disabled:opacity-50 select-none"
              title="Valider la réception du virement et insérer la recette comptable"
            >
              ✓ Marquer comme payé
            </button>
          </div>
        )}

        {isPaid && request.datePaiement && (
          <span className="text-[9px] font-bold text-green-700 dark:text-green-400 italic">
            Payé le {new Date(request.datePaiement).toLocaleDateString('fr-FR')}
          </span>
        )}

        {successNotice && (
          <span className="text-[9px] font-black text-green-700 dark:text-green-400 animate-fadeIn">
            ✓ {successNotice}
          </span>
        )}
      </div>
    </div>
  );
}
