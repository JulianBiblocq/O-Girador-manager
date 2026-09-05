import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import CordelCard from '../../CordelCard';
import EventBudgetSection from '../EventBudgetSection';
import ReunionAgendaManager from '../../ReunionAgendaManager';
import EventReportSection from '../EventReportSection';

/**
 * Onglet 4 : Gestion, Budget & Bilan (TabAdmin)
 * Accessible exclusivement aux administrateurs, mestres et personnes habilitées trésorerie/gestion.
 * Regroupe le contrôle du statut de l'événement, la visibilité publique vitrine,
 * le bilan financier/devis et l'ordre du jour/PV pour les réunions.
 *
 * @param {Object} props Propriétés du composant
 */
export default function TabAdmin({
  event,
  user,
  profileData,
  isAuthorized,
  hasFinanceAccess,
  handleUpdateEventStatus,
  onNavigateToView,
  setIsSendContractModalOpen,
  handlePreparePublication,
  currentConfig
}) {
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [updatingField, setUpdatingField] = useState(null);

  const handleToggleEventField = async (fieldName, currentValue) => {
    if (!event.id || updatingField) return;
    setUpdatingField(fieldName);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { [fieldName]: !currentValue });
    } catch (err) {
      console.error(`TabAdmin - Erreur mise à jour ${fieldName} :`, err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setUpdatingField(null);
    }
  };


  const handleTogglePublic = async () => {
    if (!event.id || updatingPublic) return;
    setUpdatingPublic(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { isPublic: !event.isPublic });
    } catch (err) {
      console.error("TabAdmin - Erreur mise à jour visibilité publique :", err);
      alert("Erreur lors de la mise à jour de la visibilité publique.");
    } finally {
      setUpdatingPublic(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 1. Statut de l'événement & Raccourcis Rapides Gestion */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 flex items-center gap-1.5">
          <span>⚙️</span>
          <span>Pilotage & Statut de l'événement</span>
        </h4>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-cordel-bg-light rounded-[6px] border border-dashed border-cordel-master-dark/20 mb-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase text-cordel-wood">Statut actuel</span>
            <span className="text-xs font-black uppercase mt-0.5">
              {event.status === 'annule' ? (
                <span className="text-red-600">❌ Annulé</span>
              ) : event.status === 'a_confirmer' ? (
                <span className="text-orange-600">📙 À confirmer</span>
              ) : (
                <span className="text-green-700">✅ Validé / Maintenu</span>
              )}
            </span>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleUpdateEventStatus('confirme')}
              disabled={!event.status || event.status === 'confirme'}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded transition-all cursor-pointer select-none ${
                (!event.status || event.status === 'confirme')
                  ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                  : 'bg-green-100 text-green-800 border border-green-700 hover:bg-green-200 active:translate-x-[0.5px] active:translate-y-[0.5px] shadow-[1.5px_1.5px_0px_0px_#181716]'
              }`}
            >
              Maintenir
            </button>
            <button
              type="button"
              onClick={() => handleUpdateEventStatus('a_confirmer')}
              disabled={event.status === 'a_confirmer'}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded transition-all cursor-pointer select-none ${
                event.status === 'a_confirmer'
                  ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                  : 'bg-orange-100 text-orange-800 border border-orange-700 hover:bg-orange-200 active:translate-x-[0.5px] active:translate-y-[0.5px] shadow-[1.5px_1.5px_0px_0px_#181716]'
              }`}
            >
              À confirmer
            </button>
            <button
              type="button"
              onClick={() => handleUpdateEventStatus('annule')}
              disabled={event.status === 'annule'}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded transition-all cursor-pointer select-none ${
                event.status === 'annule'
                  ? 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
                  : 'bg-red-100 text-red-800 border border-red-700 hover:bg-red-200 active:translate-x-[0.5px] active:translate-y-[0.5px] shadow-[1.5px_1.5px_0px_0px_#181716]'
              }`}
            >
              Annuler
            </button>
          </div>
        </div>

        {/* Option Visibilité Publique Vitrine */}
        <div className="flex items-center justify-between p-3 bg-white/70 dark:bg-black/20 rounded-[6px] border border-encre-noire/15 select-none">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-encre-noire flex items-center gap-1.5">
              <span>🌍</span>
              <span>Visibilité sur le site public vitrine</span>
            </span>
            <span className="text-[10px] text-encre-noire/70">
              {event.isPublic 
                ? "Cet événement est actuellement visible de tous sur le site vitrine." 
                : "Cet événement est interne et réservé aux membres de la troupe."}
            </span>
          </div>
          <button
            type="button"
            onClick={handleTogglePublic}
            disabled={updatingPublic}
            className={`text-[10px] font-black uppercase px-3 py-1.5 rounded border transition-all cursor-pointer ${
              event.isPublic
                ? 'bg-green-100 text-green-800 border-green-400 hover:bg-green-200'
                : 'bg-neutral-200 text-neutral-700 border-neutral-300 hover:bg-neutral-300'
            }`}
          >
            {event.isPublic ? "Public (Activé)" : "Interne (Désactivé)"}
          </button>
        </div>


        {/* Barrette d'Interrupteurs Rapides (Pilotage Express) */}
        <div className="mt-3 pt-3 border-t border-dashed border-cordel-master-dark/15">
          <span className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood block mb-2">
            Interrupteurs & Modules de l'événement
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 select-none">
            {/* 1. Percussion */}
            <button
              type="button"
              disabled={updatingField === 'includesPercussion'}
              onClick={() => handleToggleEventField('includesPercussion', event.includesPercussion !== false)}
              className={`flex items-center justify-between p-2 rounded text-xs font-bold uppercase border transition-all cursor-pointer ${
                event.includesPercussion !== false
                  ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-xs'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300'
              }`}
            >
              <span className="flex items-center gap-1.5">🥁 Percussion</span>
              <span className="text-[10px] font-black">{event.includesPercussion !== false ? 'ON' : 'OFF'}</span>
            </button>

            {/* 2. Danse */}
            <button
              type="button"
              disabled={updatingField === 'includesDance'}
              onClick={() => handleToggleEventField('includesDance', event.includesDance !== false)}
              className={`flex items-center justify-between p-2 rounded text-xs font-bold uppercase border transition-all cursor-pointer ${
                event.includesDance !== false
                  ? 'bg-pink-100 text-pink-900 border-pink-400 shadow-xs'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300'
              }`}
            >
              <span className="flex items-center gap-1.5">💃 Danse</span>
              <span className="text-[10px] font-black">{event.includesDance !== false ? 'ON' : 'OFF'}</span>
            </button>

            {/* 3. Covoiturage */}
            <button
              type="button"
              disabled={updatingField === 'enableCarpool'}
              onClick={() => handleToggleEventField('enableCarpool', event.enableCarpool !== false)}
              className={`flex items-center justify-between p-2 rounded text-xs font-bold uppercase border transition-all cursor-pointer ${
                event.enableCarpool !== false
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 shadow-xs'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300'
              }`}
            >
              <span className="flex items-center gap-1.5">🚗 Covoiturage</span>
              <span className="text-[10px] font-black">{event.enableCarpool !== false ? 'ON' : 'OFF'}</span>
            </button>

            {/* 4. Inscriptions */}
            <button
              type="button"
              disabled={updatingField === 'enableInscriptions'}
              onClick={() => handleToggleEventField('enableInscriptions', event.enableInscriptions !== false)}
              className={`flex items-center justify-between p-2 rounded text-xs font-bold uppercase border transition-all cursor-pointer ${
                event.enableInscriptions !== false
                  ? 'bg-blue-100 text-blue-900 border-blue-400 shadow-xs'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300'
              }`}
            >
              <span className="flex items-center gap-1.5">📝 Inscriptions</span>
              <span className="text-[10px] font-black">{event.enableInscriptions !== false ? 'ON' : 'OFF'}</span>
            </button>

            {/* 5. Validation admin */}
            <button
              type="button"
              disabled={updatingField === 'requiresValidation'}
              onClick={() => handleToggleEventField('requiresValidation', Boolean(event.requiresValidation))}
              className={`flex items-center justify-between p-2 rounded text-xs font-bold uppercase border transition-all cursor-pointer ${
                Boolean(event.requiresValidation)
                  ? 'bg-purple-100 text-purple-900 border-purple-400 shadow-xs'
                  : 'bg-neutral-100 text-neutral-400 border-neutral-300'
              }`}
            >
              <span className="flex items-center gap-1.5">🔒 Validation</span>
              <span className="text-[10px] font-black">{Boolean(event.requiresValidation) ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Actions Rapides Diffusion & Contrat */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dashed border-cordel-master-dark/15">
          {setIsSendContractModalOpen && (
            <button
              type="button"
              onClick={() => setIsSendContractModalOpen(true)}
              className="text-[10px] font-black uppercase bg-cordel-vert text-white border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] hover:brightness-105 cursor-pointer flex items-center gap-1"
            >
              📝 Envoyer un contrat (Brevo)
            </button>
          )}

          {handlePreparePublication && (
            <button
              type="button"
              onClick={handlePreparePublication}
              className="text-[10px] font-black uppercase bg-cordel-ocre text-black border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] hover:brightness-95 cursor-pointer flex items-center gap-1"
            >
              📢 Préparer la publication
            </button>
          )}
        </div>
      </CordelCard>

      {/* 2. Trésorerie & Bilan Financier de l'Événement */}
      {(isAuthorized || hasFinanceAccess) && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 flex items-center gap-1.5">
            <span>💰</span>
            <span>Bilan financier prévisionnel & facturation</span>
          </h4>
          <EventBudgetSection
            event={event}
            groupId={profileData?.groupId}
            onCreateQuote={() => onNavigateToView && onNavigateToView('treasury')}
          />
        </CordelCard>
      )}

      {/* 3. Spécifique Réunion : Ordre du Jour & PV de Séance */}
      {event.type === 'reunion' && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 flex items-center gap-1.5">
            <span>📝</span>
            <span>Ordre du jour & Procès-verbal de réunion</span>
          </h4>
          <ReunionAgendaManager 
            event={event}
            user={user}
            profileData={profileData}
          />
          <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20">
            <EventReportSection 
              event={event}
              user={user}
              profileData={profileData}
            />
          </div>
        </CordelCard>
      )}
    </div>
  );
}
