import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import { calculateCarpoolGauge } from '../../hooks/useEventCarpool';
import CarpoolAdminRefundPanel from './CarpoolAdminRefundPanel';
import CarCard from './CarCard';
import CarpoolSearchersQueue from './CarpoolSearchersQueue';
import CarpoolProposerForm from './CarpoolProposerForm';
import CarDiscussionModal from './CarDiscussionModal';
import { useTranslation } from '../LanguageContext';
import { getCarpoolBulkyTerminology } from '../../utils/carpoolCascadeUtils';

/**
 * Section principale de covoiturage pour un événement.
 * Intègre la jauge proportionnelle, les cartes de véhicules, le retour direct et le fil d'équipage.
 *
 * @param {Object} props
 */
export default function EventCarpoolSection({
  event, user, profileData: _profileData, isAuthorized,
  universeId,
  enableCarpoolReimbursement, indemniteKilometrique, convoiDrivers, individualDrivers: _individualDrivers,
  submittingCovoit, joiningVoitureId, setJoiningVoitureId, joinForm, setJoinForm,
  demandeRemboursementKm, handleToggleRemboursement, handleRetirerVoiture, handleQuitterVoiture,
  handleConfirmJoin, handleChercherPlace, handleAnnulerCherchePlace,
  showProposerForm, setShowProposerForm, voitureForm, setVoitureForm,
  handleProposerVoiture, reimbursementRule, handleAssignPassenger, handleRemovePassenger, handleSendCarMessage
}) {
  const { t } = useTranslation();
  const [discussionVoitureId, setDiscussionVoitureId] = useState(null);
  const [doitRentrerDirectSearch, setDoitRentrerDirectSearch] = useState(false);

  const currentUniverse = (universeId || event?.universeId || event?.universe || _profileData?.universe || 'maracatu').toLowerCase().trim();
  const terminology = getCarpoolBulkyTerminology(currentUniverse);

  const voituresList = event.covoiturage?.voitures || [];
  const gauge = calculateCarpoolGauge(event, voituresList);
  const isUserChauffeurAnyCar = voituresList.some(v => v.chauffeurId === user?.uid);
  const isProposerDisabled = !isUserChauffeurAnyCar && !isAuthorized && gauge.isCapacitySufficient;
  const activeDiscussionVoiture = voituresList.find(v => v.id === discussionVoitureId);

  return (
    <>
      {/* 🚗 Frais de déplacement / Convoi (uniquement pour les administrateurs) */}
      {isAuthorized && (
        <CarpoolAdminRefundPanel
          enableCarpoolReimbursement={enableCarpoolReimbursement}
          distanceKm={event.distanceAllerRetourKm || 0}
          indemniteKm={indemniteKilometrique}
          convoiDrivers={convoiDrivers}
        />
      )}

      {/* 🚗 Convoi & Covoiturage */}
      {event.enableCarpool !== false && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
            🚗 {t('agenda.carpoolSectionTitle') || "Offres de covoiturage pour ce trajet"} ({t('agenda.departure') || "Départ"} du local)
          </h4>

          {/* 📊 Bandeau Jauge Convoi (Demande vs Offre) */}
          <div className="mb-4 p-2.5 rounded theme-inner-panel flex flex-col sm:flex-row items-center justify-between gap-2 text-xs border border-dashed border-cordel-master-dark/20 text-left">
            <div className="flex items-center gap-2">
              <span className="text-base">📊</span>
              <div>
                <span className="font-bold text-encre-noire block">
                  {gauge.offreTransport > 1 
                    ? t('agenda.convoyGaugePlural', { offered: gauge.offreTransport, requested: gauge.demandeTransport })
                    : t('agenda.convoyGauge', { offered: gauge.offreTransport, requested: gauge.demandeTransport })
                    || `Jauge convoi : ${gauge.offreTransport} place${gauge.offreTransport > 1 ? 's' : ''} offerte${gauge.offreTransport > 1 ? 's' : ''} / ${gauge.demandeTransport} demandée${gauge.demandeTransport > 1 ? 's' : ''}`
                  }
                </span>
                <span className="text-[10px] text-encre-noire/70">
                  {gauge.isCapacitySufficient
                    ? "Capacité suffisante pour les besoins actuels"
                    : gauge.demandeTransport > gauge.offreTransport
                      ? (t('agenda.convoyNeedSeats', { count: gauge.demandeTransport - gauge.offreTransport }) || `Besoin d'au moins ${gauge.demandeTransport - gauge.offreTransport} place(s) supplémentaire(s)`)
                      : "Véhicules prêts"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                gauge.isCapacitySufficient
                  ? "bg-green-100 border-green-400 text-green-800"
                  : "bg-amber-100 border-amber-400 text-amber-800"
              }`}>
                {gauge.isCapacitySufficient ? "✅ Équilibré" : `⏳ ${t('agenda.badgeSeatsSearched') || "Places recherchées"}`}
              </span>
            </div>
          </div>

          {/* Grille des véhicules */}
          <div className="flex flex-col gap-3">
            {voituresList.length === 0 ? (
              <p className="text-[11px] italic opacity-60 text-left">{t('agenda.carpoolNoOffers') || "Aucune proposition de covoiturage pour le moment."}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {voituresList.map((voiture) => (
                  <CarCard
                    key={voiture.id}
                    voiture={voiture}
                    event={event}
                    user={user}
                    isAuthorized={isAuthorized}
                    enableCarpoolReimbursement={enableCarpoolReimbursement}
                    reimbursementRule={reimbursementRule}
                    submittingCovoit={submittingCovoit}
                    joiningVoitureId={joiningVoitureId}
                    setJoiningVoitureId={setJoiningVoitureId}
                    joinForm={joinForm}
                    setJoinForm={setJoinForm}
                    demandeRemboursementKm={demandeRemboursementKm}
                    handleToggleRemboursement={handleToggleRemboursement}
                    handleRetirerVoiture={handleRetirerVoiture}
                    handleQuitterVoiture={handleQuitterVoiture}
                    handleConfirmJoin={handleConfirmJoin}
                    handleAssignPassenger={handleAssignPassenger}
                    handleRemovePassenger={handleRemovePassenger}
                    onOpenDiscussion={(v) => setDiscussionVoitureId(v.id)}
                    universeId={currentUniverse}
                    terminology={terminology}
                  />
                ))}
              </div>
            )}
          </div>

          {/* File d'attente "Membres en recherche de place" */}
          <CarpoolSearchersQueue
            searchers={event.covoiturage?.recherchePlace || []}
            currentUser={user}
            submittingCovoit={submittingCovoit}
            doitRentrerDirectSearch={doitRentrerDirectSearch}
            setDoitRentrerDirectSearch={setDoitRentrerDirectSearch}
            handleChercherPlace={handleChercherPlace}
            handleAnnulerCherchePlace={handleAnnulerCherchePlace}
          />

          {/* Formulaire "Proposer mon véhicule" */}
          <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15 text-left flex flex-col gap-2">
            {!showProposerForm ? (
              <>
                <button
                  type="button"
                  disabled={isProposerDisabled}
                  onClick={() => !isProposerDisabled && setShowProposerForm(true)}
                  className={`theme-btn px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-xs w-full text-center transition-all ${
                    isProposerDisabled
                      ? 'bg-neutral-200 text-neutral-500 border border-neutral-300 opacity-60 cursor-not-allowed shadow-none'
                      : 'theme-bg-ocre text-encre-noire hover:brightness-105 cursor-pointer'
                  }`}
                  title={isProposerDisabled ? "Capacité de convoi suffisante pour les inscrits actuels." : (t('agenda.carpoolProposeVehicle') || "Proposer mon véhicule")}
                >
                  🚗 {t('agenda.carpoolProposeVehicle') || "Je propose mon véhicule"}
                </button>
                {isProposerDisabled && (
                  <p className="text-[10px] italic font-bold text-amber-900 bg-amber-50 border border-dashed border-amber-300 p-2 rounded text-center">
                    ℹ️ Capacité suffisante ({gauge.offreTransport} places offertes pour {gauge.demandeTransport} demandées). Veuillez compléter les véhicules existants avant d'en ouvrir un nouveau.
                  </p>
                )}
              </>
            ) : (
              <CarpoolProposerForm
                voitureForm={voitureForm}
                setVoitureForm={setVoitureForm}
                submittingCovoit={submittingCovoit}
                handleProposerVoiture={handleProposerVoiture}
                onCancel={() => setShowProposerForm(false)}
                universeId={currentUniverse}
                terminology={terminology}
              />
            )}
          </div>
        </CordelCard>
      )}

      {/* Modale de discussion d'équipage */}
      {Boolean(activeDiscussionVoiture) && (
        <CarDiscussionModal
          isOpen={Boolean(activeDiscussionVoiture)}
          onClose={() => setDiscussionVoitureId(null)}
          voiture={activeDiscussionVoiture}
          eventName={event.titre || event.title}
          currentUser={user}
          onSendMessage={handleSendCarMessage}
        />
      )}
    </>
  );
}
