import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import CordelCard from '../../CordelCard';
import { XiloMegaphone } from '../../XiloIcons';
import EventBudgetSection from '../EventBudgetSection';
import ReunionAgendaManager from '../../ReunionAgendaManager';
import EventReportSection from '../EventReportSection';
import EventWardrobeSummaryCard from '../EventWardrobeSummaryCard';
import { isEventStrictlyPassed } from '../../../utils/dateUtils';
import { useTranslation } from '../../LanguageContext';

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
  currentConfig,
  onOpenQrCodeModal,
  hasQrCode,
  onEdit,
  onDelete,
  onDuplicate,
  t: propT
}) {
  const { t: contextT } = useTranslation();
  const t = typeof propT === 'function' ? propT : contextT;
  const tr = t;
  const [updatingPublic, setUpdatingPublic] = useState(false);
  const [updatingField, setUpdatingField] = useState(null);

  // Calcul fiable du franchissement de l'événement avec reconstitution du timestamp exact
  const isEventPassed = isEventStrictlyPassed(event);

  // L'événement comporte des tenues de scène ou est une sortie/prestation
  const hasCostumes = Boolean(
    event.tenueRequise ||
    event.dressCodePercussion ||
    event.dressCodeDanse ||
    event.costumeId ||
    ['prestation', 'concert', 'sortie'].includes(event.type)
  );

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 gap-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>⚙️</span>
            <span>{tr('agenda.adminSectionTitle') || "Administration avancée de l'événement"}</span>
          </h4>

          {/* Boutons d'action d'en-tête (Modifier, Dupliquer, Supprimer) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-cordel-bg hover:bg-neutral-200 border border-encre-noire transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                title={tr('agenda.adminBtnEdit') || "Modifier l'événement"}
              >
                <span>✏️</span>
                <span>{tr('agenda.adminBtnEdit') || "Modifier l'événement"}</span>
              </button>
            )}
            {onDuplicate && (
              <button
                type="button"
                onClick={onDuplicate}
                className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-800 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                title={tr('agenda.adminBtnDuplicate') || "Dupliquer"}
              >
                <span>📋</span>
                <span>{tr('agenda.adminBtnDuplicate') || "Dupliquer"}</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-red-100 text-red-900 hover:bg-red-200 border border-red-700 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                title={tr('agenda.adminBtnDelete') || "Supprimer"}
              >
                <span>🗑️</span>
                <span>{tr('agenda.adminBtnDelete') || "Supprimer"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-cordel-bg-light rounded-[6px] border border-dashed border-cordel-master-dark/20 mb-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase text-cordel-wood">{tr('agenda.currentStatusLabel') || "Statut actuel"}</span>
            <span className="text-xs font-black uppercase mt-0.5">
              {event.status === 'annule' ? (
                <span className="text-red-600">❌ {tr('agenda.statusCanceled') || "Annulé"}</span>
              ) : event.status === 'a_confirmer' ? (
                <span className="text-orange-600">📙 {tr('agenda.btnToConfirm') || "À confirmer"}</span>
              ) : (
                <span className="text-green-700">✅ {tr('agenda.statusValidatedMaintained') || "Validé / Maintenu"}</span>
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
              {tr('agenda.btnMaintain') || "Maintenir"}
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
              {tr('agenda.btnToConfirm') || "À confirmer"}
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
              {tr('agenda.btnCancelEvent') || "Annuler"}
            </button>
          </div>
        </div>

        {/* Option Visibilité Publique Vitrine */}
        <div className="flex items-center justify-between p-3 bg-white/70 dark:bg-black/20 rounded-[6px] border border-encre-noire/15 select-none">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-encre-noire flex items-center gap-1.5">
              <span>🌍</span>
              <span>{tr('agenda.adminShowPublic') || "Afficher sur le site public vitrine"}</span>
            </span>
            <span className="text-[10px] text-encre-noire/70">
              {event.isPublic 
                ? (tr('agenda.publicVitrineNotice') || "Cet événement est actuellement visible de tous sur le site vitrine.") 
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
            {event.isPublic ? (tr('agenda.publicOnBadge') || `${tr('agenda.public') || "Public"} (ON)`) : `${tr('agenda.private') || "Interne"} (OFF)`}
          </button>
        </div>


        {/* Barrette d'Interrupteurs Rapides (Pilotage Express) */}
        <div className="mt-3 pt-3 border-t border-dashed border-cordel-master-dark/15">
          <span className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood block mb-2">
            {tr('agenda.modulesTogglesTitle') || "Interrupteurs & modules de l'événement"}
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
              <span className="flex items-center gap-1.5">🥁 {t('agenda.modulePercussion')}</span>
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
              <span className="flex items-center gap-1.5">💃 {t('agenda.moduleDanse')}</span>
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
              <span className="flex items-center gap-1.5">🚗 {t('agenda.moduleCarpool')}</span>
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
              <span className="flex items-center gap-1.5">📝 {t('agenda.moduleInscriptions')}</span>
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
              <span className="flex items-center gap-1.5">🔒 {t('agenda.moduleValidation')}</span>
              <span className="text-[10px] font-black">{Boolean(event.requiresValidation) ? 'ON' : 'OFF'}</span>
            </button>

            {/* 6. Boîte à photos / QR Code */}
            {(() => {
              const isTargetPrestation = ['prestation', 'concert', 'spectacle', 'festival'].includes(event.type);
              const isRecolteActive = event.activerRecolteMedias !== undefined 
                ? Boolean(event.activerRecolteMedias) 
                : isTargetPrestation;

              return (
                <button
                  type="button"
                  disabled={updatingField === 'activerRecolteMedias'}
                  onClick={() => handleToggleEventField('activerRecolteMedias', isRecolteActive)}
                  className={`flex items-center justify-between p-2 rounded text-xs font-bold uppercase border transition-all cursor-pointer ${
                    isRecolteActive
                      ? 'bg-amber-100 text-amber-950 border-amber-500 shadow-xs'
                      : 'bg-neutral-100 text-neutral-400 border-neutral-300'
                  }`}
                  title="Activer ou désactiver la boîte à photos et le QR Code pour cet événement"
                >
                  {/* 📸 Boîte Photos */}
                  <span className="flex items-center gap-1.5">📸 {t('agenda.modulePhotos', 'Boîte Photos')}</span>
                  <span className="text-[10px] font-black">{isRecolteActive ? 'ON' : 'OFF'}</span>
                </button>
              );
            })()}
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
              📝 {tr('agenda.btnSendContract') || "Envoyer un contrat"}
            </button>
          )}

          {handlePreparePublication && (
            <button
              type="button"
              onClick={handlePreparePublication}
              className="text-[10px] font-black uppercase bg-cordel-ocre text-black border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] hover:brightness-95 cursor-pointer flex items-center gap-1.5"
            >
              <XiloMegaphone size={13} className="text-cordel-wood shrink-0" />
              <span>{tr('agenda.btnPreparePublication') || "Préparer la publication"}</span>
            </button>
          )}

          {hasQrCode && onOpenQrCodeModal && (
            <button
              type="button"
              onClick={onOpenQrCodeModal}
              className="text-[10px] font-black uppercase bg-amber-200 text-amber-950 border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-amber-300 cursor-pointer flex items-center gap-1"
              title="Afficher et imprimer le QR Code de récolte de photos et vidéos"
            >
              <span>📷</span>
              <span>{tr('agenda.btnQrMediaPoster') || "QR Code médias & affiche"}</span>
            </button>
          )}
        </div>
      </CordelCard>

      {/* 1b. Module Récolte Médias & Dossier Cloud Framaspace */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>📸</span>
            <span>{tr('agenda.adminMediaCloudTitle') || "Récolte photos & service cloud de l'événement"}</span>
          </h4>
          {(() => {
            const isTargetPrestation = ['prestation', 'concert', 'spectacle', 'festival'].includes(event.type);
            const isRecolteActive = event.activerRecolteMedias !== undefined 
              ? Boolean(event.activerRecolteMedias) 
              : isTargetPrestation;

            if (!isRecolteActive) {
              return (
                <span className="theme-stamp-badge theme-stamp-badge-rouge text-[9px] uppercase tracking-wider font-bold">
                  ✕ Récolte Désactivée
                </span>
              );
            }
            if (event.lienDepotMedias) {
              return (
                <span className="theme-stamp-badge theme-stamp-badge-vert text-[9px] uppercase tracking-wider font-black">
                  ✓ {tr('agenda.cloudFolderActive') || "Dossier Cloud actif"}
                </span>
              );
            }
            return (
              <span className="theme-stamp-badge theme-stamp-badge-ocre text-[9px] uppercase tracking-wider font-bold">
                En attente de liaison
              </span>
            );
          })()}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-cordel-bg-light rounded-[6px] border border-dashed border-cordel-master-dark/20">
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-extrabold text-encre-noire flex items-center gap-1.5">
              <span>{event.lienDepotMedias ? '📂' : '📁'}</span>
              <span>{tr('agenda.publicDropFolder') || "Dossier de dépôt public (File drop)"}</span>
            </span>
            <p className="text-[11px] text-encre-noire/70">
              {event.lienDepotMedias 
                ? (tr('agenda.publicDropNotice') || "Ce lien alimente automatiquement le QR-Code et permet aux spectateurs de déposer leurs souvenirs.") 
                : "Aucun dossier Framaspace créé pour le moment. Vous pouvez le déclencher depuis le Studio Photos."}
            </p>
            {event.lienDepotMedias && (
              <span className="text-[10px] font-mono text-cordel-wood break-all">
                {event.lienDepotMedias}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasQrCode && onOpenQrCodeModal && (
              <button
                type="button"
                onClick={onOpenQrCodeModal}
                className="text-[10px] font-black uppercase bg-amber-300 hover:bg-amber-200 text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1"
                title="Afficher et imprimer le QR-Code pour la scène"
              >
                <span>📱</span>
                <span>{tr('agenda.btnQrCard') || "Fiche QR Code"}</span>
              </button>
            )}

            {event.lienDepotMedias && (
              <button
                type="button"
                onClick={() => window.open(event.lienDepotMedias, '_blank', 'noopener,noreferrer')}
                className="text-[10px] font-black uppercase bg-cordel-bg hover:bg-neutral-100 text-encre-noire border border-encre-noire px-2.5 py-1.5 rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1"
                title="Ouvrir le dossier Cloud dans un nouvel onglet"
              >
                <span>↗</span>
                <span>{tr('agenda.btnOpenUrl') || "Ouvrir"}</span>
              </button>
            )}
          </div>
        </div>
      </CordelCard>

      {/* 1b. Cockpit Bilan du Vestiaire Post-Événement */}
      {isEventPassed && hasCostumes && (
        <EventWardrobeSummaryCard
          event={event}
          user={user}
          profileData={profileData}
          isAuthorized={isAuthorized}
        />
      )}

      {/* 2. Trésorerie & Bilan Financier de l'Événement */}
      {(isAuthorized || hasFinanceAccess) && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-1.5 mb-3 flex items-center gap-1.5">
            <span>💰</span>
            <span>{tr('agenda.forecastBudgetTitle') || "Bilan financier prévisionnel & coûts du déplacement"}</span>
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
