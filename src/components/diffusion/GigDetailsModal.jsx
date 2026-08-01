import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { GIG_STATUSES } from './GigFormModal';
import { downloadContractPDF } from '../../utils/contractPdfGenerator';
import GigSendContractModal from './GigSendContractModal';

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
  const [toastMessage, setToastMessage] = useState(null);

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
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce dossier ?")) {
      try {
        await onDeleteGig(gig.id, gig.eventName);
        onClose();
      } catch (err) {
        alert(err.message || "Erreur lors de la suppression du dossier.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-2xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-left relative"
      >
        {/* Notification Toast interactive */}
        {toastMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-cordel-wood text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-amber-300 animate-bounce flex items-center gap-2">
            <span>ℹ️</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header Modale */}
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
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
          >
            ✕
          </button>
        </div>

        {/* Badge Étape / Statut */}
        <div className="flex items-center justify-between bg-stone-50 p-3 rounded border border-stone-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600">Étape actuelle :</span>
            <span className={`px-3 py-1 text-xs font-extrabold uppercase rounded border ${currentStatusObj.color}`}>
              {currentStatusObj.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-stone-500">Changer l'étape :</span>
            <select
              value={gig.status}
              onChange={(e) => onStatusChange(gig.id, e.target.value)}
              disabled={saving}
              className="text-xs font-bold px-2 py-1 border border-stone-300 rounded bg-white cursor-pointer"
            >
              {GIG_STATUSES.map(st => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Synthèse des Informations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#fdfaf2] border border-encre-noire/15 rounded">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase text-stone-500">Organisateur :</span>
            <span className="text-xs font-extrabold text-stone-900">{gig.organizer || 'Non renseigné'}</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase text-stone-500">Date & Lieu :</span>
            <span className="text-xs font-bold text-stone-900">
              📅 {gig.date || 'Date non fixée'} — 📍 {gig.location || 'Lieu non défini'}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase text-stone-500">Contact Organisateur :</span>
            <span className="text-xs text-stone-700">
              {gig.contactEmail ? `✉️ ${gig.contactEmail}` : ''} {gig.contactPhone ? ` | 📞 ${gig.contactPhone}` : ''}
              {!gig.contactEmail && !gig.contactPhone && 'Aucun contact enregistré'}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase text-stone-500">Montant Estimé / Budget :</span>
            <span className="text-sm font-black text-cordel-wood font-mono">
              {(parseFloat(gig.amount) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </span>
          </div>
        </div>

        {/* Notes & Prochaine relance */}
        <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-1 p-3 bg-stone-50 border border-stone-200 rounded">
            <span className="text-[10px] font-bold uppercase text-stone-500">Historique & Notes du dossier :</span>
            <p className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
              {gig.notes || 'Aucune note ou historique consigné pour ce dossier.'}
            </p>
          </div>
        </div>

        {/* Boutons d'Actions du Workflow Entonnoir */}
        <div className="flex flex-col gap-2 pt-2 border-t border-dashed">
          <span className="text-[10px] font-extrabold uppercase text-cordel-wood tracking-wider">
            ⚡ Workflow de l'entonnoir Diffusion :
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleOpenQuote}
              className="px-2.5 py-2 text-[10px] font-extrabold uppercase rounded bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 shadow-xs flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Préparer et émettre un devis PDF croisant les données du dossier et de l'événement"
            >
              <span className="text-base">📜</span>
              <span>Générer Devis</span>
            </button>

            <button
              type="button"
              onClick={handleCreateOption}
              disabled={saving}
              className="px-2.5 py-2 text-[10px] font-extrabold uppercase rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-xs flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title="Créer automatiquement l'événement [OPTION] dans l'Agenda principal"
            >
              <span className="text-base">📅</span>
              <span>Poser Option Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSendContractModalOpen(true)}
              className="px-2.5 py-2 text-[10px] font-extrabold uppercase rounded bg-purple-600 hover:bg-purple-700 text-white border border-purple-800 shadow-xs flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Préparer et transmettre le contrat de prestation signé par e-mail au client via l'API Brevo"
            >
              <span className="text-base">📧</span>
              <span>Envoyer Contrat</span>
            </button>

            <button
              type="button"
              onClick={() => downloadContractPDF(gig, associationSettings)}
              className="px-2.5 py-2 text-[10px] font-extrabold uppercase rounded bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 shadow-xs flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Générer et télécharger le contrat de prestation 100% dynamique aux couleurs et infos de l'association"
            >
              <span className="text-base">📥</span>
              <span>Contrat PDF</span>
            </button>

            <button
              type="button"
              onClick={() => triggerWorkflowToast('Facturation Trésorerie')}
              className="px-2.5 py-2 text-[10px] font-extrabold uppercase rounded bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 shadow-xs flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <span className="text-base">💳</span>
              <span>Facturer</span>
            </button>
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
      </CordelCard>

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
    </div>
  );
}
