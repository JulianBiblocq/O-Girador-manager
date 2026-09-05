import React, { useState } from 'react';
import { runTransaction, doc, collection, query, where, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { GIG_STATUSES } from './GigFormModal';
import { downloadContractPDF } from '../../utils/contractPdfGenerator';
import GigSendContractModal from './GigSendContractModal';
import GigInvoiceGeneratorModal from './GigInvoiceGeneratorModal';
import GigRelanceEmailModal from './GigRelanceEmailModal';
import useConfirm from '../../hooks/useConfirm';

export default function GigDetailsModal({
  isOpen,
  onClose,
  gig,
  associationSettings = {},
  onStatusChange,
  onDeleteGig,
  onOpenAgendaOptionModal,
  onOpenQuoteGeneratorModal,
  saving = false
}) {
  const [isSendContractModalOpen, setIsSendContractModalOpen] = useState(false);
  const [isInvoiceGeneratorOpen, setIsInvoiceGeneratorOpen] = useState(false);
  const [isRelanceModalOpen, setIsRelanceModalOpen] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const { confirm } = useConfirm();

  if (!isOpen || !gig) return null;

  const currentStatusObj = GIG_STATUSES.find(s => s.id === gig.status) || GIG_STATUSES[0];

  // Action automatisée : Ouverture du générateur de Devis
  const handleOpenQuote = () => {
    onClose();
    if (onOpenQuoteGeneratorModal) {
      onOpenQuoteGeneratorModal(gig);
    }
  };

  // Affichage d'une notification Toast temporaire
  const triggerWorkflowToast = (actionLabel) => {
    setToastMessage(`Fonctionnalité en cours d'intégration : Pôle Diffusion (${actionLabel})`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Action automatisée : Ouverture du formulaire d'Option d'Agenda pré-rempli
  const handleCreateOption = () => {
    onClose();
    if (onOpenAgendaOptionModal) {
      onOpenAgendaOptionModal(gig);
    }
  };

  // Action sécurisée : Supprimer définitivement le dossier
  const handleDeleteConfirm = async () => {
    const isOk = await confirm("Êtes-vous sûr de vouloir supprimer définitivement ce dossier ?");
    if (isOk) {
      try {
        await onDeleteGig(gig.id, gig.eventName);
        onClose();
      } catch (err) {
        alert(err.message || "Erreur lors de la suppression du dossier.");
      }
    }
  };

  // Transaction atomique Firestore : Marquer la facture comme payée et inscrire la recette en Trésorerie
  const handleMarkAsPaid = async () => {
    if (!gig || !gig.id) return;

    if (gig.status === '6_paye') {
      alert("Ce dossier est déjà marqué comme payé.");
      return;
    }

    const hasInvoice = Boolean(gig.invoiceId || gig.invoiceNumber || gig.status === '5_facture_emise');
    if (!hasInvoice) {
      alert("Veuillez d'abord émettre la facture de l'événement avant de valider le paiement.");
      return;
    }

    const amount = parseFloat(gig.amount) || 0;
    const confirmText = `Confirmez-vous la réception du paiement de ${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € pour "${gig.eventName}" ?\n\nCela va automatiquement inscrire une recette en Trésorerie et verrouiller le dossier.`;

    const isOk = await confirm({
      title: "Confirmation de paiement",
      message: confirmText,
      confirmText: "Oui, valider le paiement",
      cancelText: "Annuler",
      variant: "success"
    });
    if (!isOk) return;

    setMarkingPaid(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Recherche / Lecture de la Facture liée
        let invoiceRef = null;
        if (gig.invoiceId) {
          invoiceRef = doc(db, 'invoices', gig.invoiceId);
        } else {
          const invQuery = query(collection(db, 'invoices'), where('gigId', '==', gig.id));
          const invSnap = await getDocs(invQuery);
          if (!invSnap.empty) {
            invoiceRef = invSnap.docs[0].ref;
          }
        }

        if (invoiceRef) {
          const invSnap = await transaction.get(invoiceRef);
          if (invSnap.exists()) {
            transaction.update(invoiceRef, {
              statut: 'paye',
              datePaiement: new Date().toISOString(),
              updatedAt: serverTimestamp()
            });
          }
        }

        // 2. Inscription automatique de la recette dans la collection `transactions` (Trésorerie)
        const newTxRef = doc(collection(db, 'transactions'));
        transaction.set(newTxRef, {
          groupId: gig.groupId || associationSettings.groupId || 'default',
          date: Timestamp.fromDate(new Date()),
          type: 'recette',
          montant: amount,
          categorie: 'Prestations / Factures',
          libelle: `Facture ${gig.invoiceNumber || 'SOLDE'} - ${gig.eventName} (${gig.organizer || 'Client'})`,
          source: 'facturation_gig',
          gigId: gig.id,
          invoiceId: gig.invoiceId || null,
          createdAt: serverTimestamp()
        });

        // 3. Verrouillage du dossier de prestation dans gigs_pipeline
        const gigRef = doc(db, 'gigs_pipeline', gig.id);
        transaction.update(gigRef, {
          status: '6_paye',
          paidTransactionId: newTxRef.id,
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      triggerWorkflowToast(`✅ Paiement validé ! Recette de ${amount} € inscrite en Trésorerie.`);
      if (onStatusChange) onStatusChange(gig.id, '6_paye');
    } catch (err) {
      console.error("GigDetailsModal - Erreur transaction paiement :", err);
      alert("Erreur lors de la validation du paiement : " + (err.message || err));
    } finally {
      setMarkingPaid(false);
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-left">
        {/* Notification Toast interactive */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-cordel-wood text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-amber-300 animate-bounce flex items-center gap-2">
            <span>ℹ️</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Header Modale (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎷</span>
            <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood">
              Dossier Prestation : {gig.eventName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* 2. Corps Défilable de la Modale */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {gig.source === 'vitrine_publique' && (
            <div className="p-2 bg-blue-50 border border-blue-300 rounded text-xs font-bold text-blue-900 flex items-center gap-2">
              <span>🌐</span>
              <span>Demande de booking reçue depuis la Vitrine Publique SaaS</span>
            </div>
          )}

          {gig.nextRelanceDate && (
            <div className="p-2 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-amber-900 flex items-center gap-2">
              <span>⏰</span>
              <span>Prochaine relance enregistrée pour le : {gig.nextRelanceDate}</span>
            </div>
          )}

          {/* Fiche Récapitulative : Logistique & Contrat */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex flex-col gap-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase text-stone-500">🏢 Organisateur / Client :</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-stone-900">{gig.organizer || 'Non renseigné'}</span>
                  {gig.contactId && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                      📎 Contact CRM lié
                    </span>
                  )}
                </div>
                {(gig.contactEmail || gig.contactPhone) && (
                  <span className="text-[11px] text-stone-600 font-mono">
                    {gig.contactEmail && <span>✉️ {gig.contactEmail} </span>}
                    {gig.contactPhone && <span>📞 {gig.contactPhone}</span>}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold uppercase text-stone-500">📍 Date & Lieu :</span>
                <span className="font-bold text-stone-900">
                  📅 {gig.date || 'Date à convenir'} {gig.location ? `— 📍 ${gig.location}` : ''}
                </span>
                <span className="text-xs font-mono font-black text-cordel-wood">
                  💰 Budget / Cachet : {(parseFloat(gig.amount) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </div>

            {/* Horaires logistiques (si renseignés) */}
            {(gig.heureArrivee || gig.heureBalances || gig.heurePassage) && (
              <div className="pt-2 border-t border-stone-200/80 flex items-center gap-2 text-xs flex-wrap">
                <span className="text-[10px] font-extrabold uppercase text-stone-500">⏰ Horaires :</span>
                {gig.heureArrivee && (
                  <span className="px-2 py-0.5 rounded bg-white border border-stone-200 font-mono font-bold text-stone-800 text-[11px]">
                    🚗 Arrivée : {gig.heureArrivee}
                  </span>
                )}
                {gig.heureBalances && (
                  <span className="px-2 py-0.5 rounded bg-white border border-stone-200 font-mono font-bold text-stone-800 text-[11px]">
                    🎛️ Balances : {gig.heureBalances}
                  </span>
                )}
                {gig.heurePassage && (
                  <span className="px-2 py-0.5 rounded bg-white border border-stone-200 font-mono font-bold text-amber-900 bg-amber-50 text-[11px]">
                    🎷 Passage : {gig.heurePassage}
                  </span>
                )}
              </div>
            )}

            {/* Statut Option Agenda liée */}
            {gig.eventId && (
              <div className="pt-1.5 border-t border-stone-200/80 flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold text-[10px] uppercase flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Option posée dans l'Agenda (ID: {gig.eventId})</span>
                </span>
              </div>
            )}
          </div>

          {/* Bloc Suivi & Historique des Échanges */}
          <div className="flex flex-col gap-2 p-3.5 bg-stone-50 border border-stone-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                <span>📜</span>
                <span>Suivi & Historique des Échanges</span>
              </span>

              <button
                type="button"
                onClick={() => setIsRelanceModalOpen(true)}
                className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Relancer l'organisateur par e-mail direct via Brevo"
              >
                <span>🔔</span>
                <span>Envoyer une relance</span>
              </button>
            </div>

            {gig.exchangeHistory && gig.exchangeHistory.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {gig.exchangeHistory.map((item, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-stone-200 text-xs flex justify-between items-center gap-2">
                    <span className="font-semibold text-stone-800">{item.description}</span>
                    <span className="text-[9px] font-mono text-stone-400 shrink-0">
                      {item.date ? new Date(item.date).toLocaleDateString('fr-FR') : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-600 italic">
                Aucun échange formel (relance/devis/contrat/facture) enregistré pour l'instant.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1 p-3 bg-stone-50 border border-stone-200 rounded">
            <span className="text-[10px] font-bold uppercase text-stone-500">Historique & Notes libres du dossier :</span>
            <p className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
              {gig.notes || 'Aucune note consignée pour ce dossier.'}
            </p>
          </div>

          {/* Stepper / Barre de Progression à 5 Étapes Strictes */}
          <div className="w-full bg-stone-50 p-3 rounded-lg border border-stone-200 flex flex-col gap-2">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-cordel-wood">
              Avancement du Workflow de Diffusion (5 Étapes) :
            </span>
            <div className="grid grid-cols-5 gap-1 text-center">
              {/* Étape 1 : Générer devis */}
              <div className={`flex flex-col items-center gap-0.5 p-1.5 rounded border text-[9px] font-extrabold ${
                ['3_devis', '2_option', '4_contrat', '5_facture', '6_paye', '6_valide'].includes(gig.status) || gig.status === '3_devis_envoye'
                  ? 'bg-orange-100 border-orange-400 text-orange-950'
                  : 'bg-white border-stone-300 text-stone-400'
              }`}>
                <span>📜 1. Devis</span>
              </div>

              {/* Étape 2 : Poser option agenda */}
              <div className={`flex flex-col items-center gap-0.5 p-1.5 rounded border text-[9px] font-extrabold ${
                ['2_option', '4_contrat', '5_facture', '6_paye', '6_valide'].includes(gig.status) || gig.status === '2_option_posee'
                  ? 'bg-amber-100 border-amber-400 text-amber-950'
                  : 'bg-white border-stone-300 text-stone-400'
              }`}>
                <span>📅 2. Option</span>
              </div>

              {/* Étape 3 : Envoyer contrat */}
              <div className={`flex flex-col items-center gap-0.5 p-1.5 rounded border text-[9px] font-extrabold ${
                ['4_contrat', '5_facture', '6_paye', '6_valide'].includes(gig.status) || gig.status === '4_contrat_envoye'
                  ? 'bg-purple-100 border-purple-400 text-purple-950'
                  : 'bg-white border-stone-300 text-stone-400'
              }`}>
                <span>📧 3. Contrat</span>
              </div>

              {/* Étape 4 : Générer facture */}
              <div className={`flex flex-col items-center gap-0.5 p-1.5 rounded border text-[9px] font-extrabold ${
                ['5_facture', '6_paye', '6_valide'].includes(gig.status) || gig.status === '5_facture_emise'
                  ? 'bg-blue-100 border-blue-400 text-blue-950'
                  : 'bg-white border-stone-300 text-stone-400'
              }`}>
                <span>🧾 4. Facture</span>
              </div>

              {/* Étape 5 : Marquer payé */}
              <div className={`flex flex-col items-center gap-0.5 p-1.5 rounded border text-[9px] font-extrabold ${
                gig.status === '6_valide' || gig.status === '6_paye'
                  ? 'bg-green-600 border-green-700 text-white'
                  : 'bg-white border-stone-300 text-stone-400'
              }`}>
                <span>✅ 5. Payé</span>
              </div>
            </div>
          </div>

          {/* Boutons d'Actions du Workflow Entonnoir (5 Étapes Strictes) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-dashed">
            <span className="text-[10px] font-extrabold uppercase text-cordel-wood tracking-wider">
              ⚡ Actions du Workflow :
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Étape 1 : Générer devis */}
              <button
                type="button"
                onClick={handleOpenQuote}
                className="px-2 py-2.5 text-[10px] font-extrabold uppercase rounded bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Étape 1 : Préparer et émettre un devis commercial"
              >
                <span className="text-base">📜</span>
                <span>1. Générer devis</span>
              </button>

              {/* Étape 2 : Poser option agenda */}
              <button
                type="button"
                onClick={handleCreateOption}
                disabled={saving}
                className="px-2 py-2.5 text-[10px] font-extrabold uppercase rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                title="Étape 2 : Créer automatiquement l'événement [OPTION] dans l'Agenda principal"
              >
                <span className="text-base">📅</span>
                <span>2. Poser option</span>
              </button>

              {/* Étape 3 : Envoyer contrat (Envoi e-mail Brevo & Téléchargement PDF) */}
              <button
                type="button"
                onClick={() => setIsSendContractModalOpen(true)}
                className="px-2 py-2.5 text-[10px] font-extrabold uppercase rounded bg-purple-600 hover:bg-purple-700 text-white border border-purple-800 shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Étape 3 : Envoyer contrat par e-mail via Brevo (avec accès au téléchargement PDF)"
              >
                <span className="text-base">📧</span>
                <span>3. Envoyer contrat</span>
              </button>

              {/* Étape 4 : Générer facture */}
              <button
                type="button"
                onClick={() => setIsInvoiceGeneratorOpen(true)}
                className="px-2 py-2.5 text-[10px] font-extrabold uppercase rounded bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-900 shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Étape 4 : Émettre la facture officielle et la transmettre au client"
              >
                <span className="text-base">🧾</span>
                <span>4. Générer facture</span>
              </button>

              {/* Étape 5 : Marquer payé */}
              <button
                type="button"
                onClick={handleMarkAsPaid}
                disabled={markingPaid || gig.status === '6_paye' || (!gig.invoiceId && !gig.invoiceNumber && gig.status !== '5_facture_emise')}
                className={`px-2 py-2.5 text-[10px] font-extrabold uppercase rounded border shadow-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  gig.status === '6_paye'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400 opacity-90 cursor-default'
                    : (!gig.invoiceId && !gig.invoiceNumber && gig.status !== '5_facture_emise')
                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 cursor-pointer'
                }`}
                title={
                  gig.status === '6_paye'
                    ? 'Dossier déjà réglé et comptabilisé en Trésorerie'
                    : (!gig.invoiceId && !gig.invoiceNumber && gig.status !== '5_facture_emise')
                    ? 'Veuillez d\'abord générer la facture de l\'événement'
                    : 'Étape 5 : Valider le paiement et inscrire automatiquement la recette en Trésorerie'
                }
              >
                <span className="text-base">{gig.status === '6_paye' ? '🔒' : '✅'}</span>
                <span>{gig.status === '6_paye' ? '5. Payé' : '5. Marquer payé'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pied de Modale & Suppression */}
        <div className="flex items-center justify-between pt-3 border-t border-dashed">
          <CordelButton
            type="button"
            variant="rouge"
            onClick={handleDeleteConfirm}
            disabled={saving}
            className="text-xs font-bold"
          >
            🗑️ Supprimer ce dossier
          </CordelButton>

          <CordelButton type="button" variant="default" onClick={onClose} className="text-xs">
            Fermer
          </CordelButton>
        </div>
      </div>

      {/* Modale d'envoi du Contrat PDF par email via Brevo */}
      <GigSendContractModal
        isOpen={isSendContractModalOpen}
        onClose={() => setIsSendContractModalOpen(false)}
        gig={gig}
        associationSettings={associationSettings}
        onSendSuccess={() => {
          triggerWorkflowToast('✓ Contrat envoyé avec succès !');
          if (onStatusChange) onStatusChange(gig.id, '4_contrat_envoye');
        }}
      />

      {/* Modale de Génération de Facture Officielle & Brevo */}
      <GigInvoiceGeneratorModal
        isOpen={isInvoiceGeneratorOpen}
        onClose={() => setIsInvoiceGeneratorOpen(false)}
        gig={gig}
        associationSettings={associationSettings}
        onSuccess={(invoiceNum) => {
          triggerWorkflowToast(`✓ Facture ${invoiceNum} émise et transmise !`);
          if (onStatusChange) onStatusChange(gig.id, '5_facture_emise');
        }}
      />

      {/* Modale d'envoi de Relance rapide Brevo */}
      <GigRelanceEmailModal
        isOpen={isRelanceModalOpen}
        onClose={() => setIsRelanceModalOpen(false)}
        gig={gig}
        associationSettings={associationSettings}
        onSuccess={() => {
          triggerWorkflowToast('✓ Relance expédiée et date de contact mise à jour !');
        }}
      />
    </div>
  );
}
