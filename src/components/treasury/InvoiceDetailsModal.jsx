import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { downloadInvoicePDF } from '../../utils/invoicePdfGenerator';

export default function InvoiceDetailsModal({
  isOpen,
  onClose,
  invoice,
  associationSettings,
  onMarkAsPaid,
  onConvertDevisToInvoice,
  onEdit,
  saving = false
}) {
  if (!isOpen || !invoice) return null;

  const isDevis = invoice.type === 'devis';
  const isPaid = invoice.statut === 'paye' || Boolean(invoice.paidTransactionId);
  const client = invoice.client || {};
  const lignes = Array.isArray(invoice.lignes) ? invoice.lignes : [];

  const handleDownloadPDF = async () => {
    try {
      await downloadInvoicePDF(invoice, associationSettings);
    } catch (err) {
      console.error("Erreur lors de la génération du PDF :", err);
      alert("Une erreur s'est produite lors de la génération du fichier PDF.");
    }
  };

  const handleConfirmPay = async () => {
    if (isPaid) return;
    const confirmText = `Confirmez-vous l'encaissement de la facture ${invoice.numero} (${invoice.montantTTC || invoice.montantHT} €) ?\n\nCela va automatiquement inscrire une recette en Trésorerie.`;
    if (window.confirm(confirmText)) {
      try {
        await onMarkAsPaid(invoice);
        alert(`Facture ${invoice.numero} marquée comme payée et enregistrée en Trésorerie !`);
        onClose();
      } catch (err) {
        alert(err.message || "Erreur lors de l'enregistrement de l'encaissement.");
      }
    }
  };

  const handleConvertDevis = async () => {
    const confirmText = `Voulez-vous convertir le devis ${invoice.numero} en Facture officielle ?\n\nUn nouveau numéro de facture (FAC-2026-XXX) va lui être attribué.`;
    if (window.confirm(confirmText)) {
      try {
        const newFacNum = await onConvertDevisToInvoice(invoice);
        alert(`Le devis ${invoice.numero} a été transformé avec succès en Facture N° ${newFacNum} !`);
        onClose();
      } catch (err) {
        alert(err.message || "Erreur lors de la transformation du devis.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-2xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto text-left"
      >
        {/* Header Modale */}
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isDevis ? '📋' : '📄'}</span>
            <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood">
              {isDevis ? 'Détails du Devis' : 'Détails de la Facture'} : {invoice.numero}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Badge Statut */}
        <div className="flex items-center justify-between bg-stone-50 p-3 rounded border border-stone-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600">Statut actuel :</span>
            {isPaid ? (
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                ✅ Payé / Encaissé
              </span>
            ) : invoice.statut === 'envoye' ? (
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded bg-blue-100 text-blue-800 border border-blue-300">
                📤 Envoyé au client
              </span>
            ) : invoice.statut === 'en_attente' ? (
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded bg-amber-100 text-amber-800 border border-amber-300">
                ⏳ En attente de règlement
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded bg-stone-200 text-stone-700 border border-stone-300">
                📝 Brouillon
              </span>
            )}
          </div>

          <span className="text-xs font-mono font-bold text-stone-500">
            Émission : {invoice.dateEmission || 'N/A'}
          </span>
        </div>

        {/* Bloc Client */}
        <div className="flex flex-col gap-1 p-3 bg-[#fdfaf2] border border-encre-noire/15 rounded">
          <span className="text-[10px] font-bold uppercase text-stone-500">Destinataire :</span>
          <h4 className="text-sm font-extrabold text-cordel-wood">{client.nom || 'Client non spécifié'}</h4>
          {client.adresse && <p className="text-xs text-stone-600">{client.adresse}</p>}
          {client.email && <p className="text-xs text-stone-600">✉️ {client.email}</p>}
          {client.siret && <p className="text-xs font-mono text-stone-500">SIRET : {client.siret}</p>}
        </div>

        {/* Tableau des Lignes de Facturation */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase text-stone-500">Lignes de prestations :</span>
          <div className="flex flex-col gap-1 border border-stone-200 rounded overflow-hidden">
            <div className="grid grid-cols-12 gap-2 bg-stone-100 p-2 text-[9px] font-extrabold uppercase text-stone-600 border-b">
              <div className="col-span-7">Description</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-3 text-right">Prix Unit. HT</div>
            </div>

            {lignes.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 p-2 text-xs border-b last:border-0 bg-white">
                <div className="col-span-7 font-medium text-stone-800">{line.description}</div>
                <div className="col-span-2 text-center font-bold">{line.quantite || 1}</div>
                <div className="col-span-3 text-right font-mono font-semibold">
                  {((line.prixUnitaire || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totalisation */}
        <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-300 rounded font-bold">
          <span className="text-xs text-stone-700">Total Net à Payer (TTC) :</span>
          <span className="text-lg font-black text-cordel-wood font-mono">
            {(invoice.montantTTC || invoice.montantHT || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </span>
        </div>

        {/* Actions de bas de modale */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-4 py-2 text-xs font-bold uppercase bg-stone-800 hover:bg-black text-white rounded shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>📥 Imprimer / Télécharger en PDF</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {!isPaid && onEdit && (
              <button
                type="button"
                onClick={() => { onClose(); onEdit(invoice); }}
                className="px-3 py-2 text-xs font-bold uppercase bg-amber-800 hover:bg-amber-900 text-white rounded shadow-sm cursor-pointer"
              >
                ✏️ Modifier
              </button>
            )}

            {isDevis && onConvertDevisToInvoice && (
              <button
                type="button"
                onClick={handleConvertDevis}
                disabled={saving}
                className="px-3.5 py-2 text-xs font-extrabold uppercase bg-blue-800 hover:bg-blue-900 text-white rounded shadow-sm cursor-pointer flex items-center gap-1"
              >
                📄 Transformer en Facture
              </button>
            )}

            {!isDevis && !isPaid && (
              <button
                type="button"
                onClick={handleConfirmPay}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold uppercase bg-emerald-800 hover:bg-emerald-900 text-white rounded shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>💰 Marquer comme payée & Enregistrer en Trésorerie</span>
              </button>
            )}

            <CordelButton type="button" variant="default" onClick={onClose} className="text-xs">
              Fermer
            </CordelButton>
          </div>
        </div>
      </CordelCard>
    </div>
  );
}
