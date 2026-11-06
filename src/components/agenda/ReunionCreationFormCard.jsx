import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import LocationSelector from '../LocationSelector';
import ReunionPollSlotsEditor from './ReunionPollSlotsEditor';
import ReunionPrivacySelector from './ReunionPrivacySelector';
import { useTranslation } from '../LanguageContext';

/**
 * Formulaire compact de création de réunion à date fixe ou sondage multi-créneaux.
 * Optimisé pour tenir sur un écran Desktop sans défilement vertical (Jour + Heure début + Heure fin sur 3 colonnes).
 */
export default function ReunionCreationFormCard({
  creationMode,
  setCreationMode,
  title,
  setTitle,
  audience,
  setAudience,
  targetGroup = 'all',
  setTargetGroup,
  reunionPrivacyMode = 'public',
  setReunionPrivacyMode,
  hideAgendaFromNonTarget = false,
  setHideAgendaFromNonTarget,
  tagsDisponibles = [],
  lieu,
  setLieu,
  setLieuId,
  lieuxImportants,
  date,
  setDate,
  time,
  setTime,
  timeEnd,
  setTimeEnd,
  pollSlots,
  handleAddPollSlot,
  handleRemovePollSlot,
  handlePollSlotChange,
  pollRestrictionType,
  setPollRestrictionType,
  pollTarget,
  setPollTarget,
  pointsOrdreDuJour,
  setPointsOrdreDuJour,
  newPointTitle,
  setNewPointTitle,
  handleAddAgendaPoint,
  lienDocument,
  setLienDocument,
  sendPushNotification,
  setSendPushNotification,
  isSubmitting,
  onOpenImportModal,
  onSubmit
}) {
  const { t } = useTranslation();

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 sm:p-4 flex flex-col gap-2.5 bg-cordel-bg">
      {/* En-tête + Sélecteur Date Fixe vs Sondage sur la même zone compacte */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-encre-noire/15 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
          ➕ {t('governance.formCreateMeetingTitle')}
        </h3>
        <div className="flex gap-1 p-0.5 bg-white/60 rounded border border-cordel-master-dark/20">
          <button
            type="button"
            onClick={() => setCreationMode('date')}
            className={`px-2 py-1 text-[9px] font-extrabold uppercase rounded transition-all cursor-pointer ${
              creationMode === 'date' ? 'bg-cordel-wood text-white shadow-2xs' : 'text-cordel-master-dark opacity-75 hover:opacity-100'
            }`}
          >
            📅 {t('governance.tabFixedDate')}
          </button>
          <button
            type="button"
            onClick={() => setCreationMode('poll')}
            className={`px-2 py-1 text-[9px] font-extrabold uppercase rounded transition-all cursor-pointer ${
              creationMode === 'poll' ? 'bg-cordel-wood text-white shadow-2xs' : 'text-cordel-master-dark opacity-75 hover:opacity-100'
            }`}
          >
            📊 {t('governance.tabMultiDatePoll')}
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2.5 text-xs">
        {/* Titre de la réunion */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('common.title') || "Titre de la réunion"} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={t('governance.placeholderMeetingTitle')}
            className="theme-input bg-white w-full py-1 text-xs font-bold"
          />
        </div>

        {/* Sélecteur Participants & Confidentialité avec pré-sélection automatique */}
        <ReunionPrivacySelector
          targetGroup={targetGroup || (audience === 'ca' ? 'ca' : 'all')}
          reunionPrivacyMode={reunionPrivacyMode}
          hideAgendaFromNonTarget={hideAgendaFromNonTarget}
          tagsDisponibles={tagsDisponibles}
          disabled={isSubmitting}
          onChange={(updates) => {
            if (setTargetGroup) setTargetGroup(updates.targetGroup);
            if (setReunionPrivacyMode) setReunionPrivacyMode(updates.reunionPrivacyMode);
            if (setHideAgendaFromNonTarget) setHideAgendaFromNonTarget(Boolean(updates.hideAgendaFromNonTarget));
            if (setAudience) setAudience(updates.audience || 'publique');
            if (setPollRestrictionType && updates.pollRestrictionType !== undefined) {
              setPollRestrictionType(updates.pollRestrictionType);
            }
            if (setPollTarget && updates.pollTarget !== undefined) {
              setPollTarget(updates.pollTarget);
            }
          }}
        />

        {/* Lieu de la réunion */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('governance.meetingLocationLabel')}
          </label>
          <LocationSelector
            value={lieu}
            lieuxImportants={lieuxImportants}
            onChange={(val, foundPreset) => {
              setLieu(val);
              setLieuId(foundPreset ? foundPreset.id : null);
            }}
            placeholder={t('governance.locationPlaceholder')}
          />
        </div>

        {/* Mode Date Fixe : Jour + Heure début + Heure fin sur une seule ligne à 3 colonnes */}
        {creationMode === 'date' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark truncate">
                {t('governance.fieldDayRequired')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="theme-input bg-white w-full py-1 text-xs"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark truncate">
                {t('governance.startTime')} *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="theme-input bg-white w-full py-1 text-xs"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark truncate">
                {t('governance.endTime')}
              </label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="theme-input bg-white w-full py-1 text-xs"
              />
            </div>
          </div>
        ) : (
          <ReunionPollSlotsEditor
            pollSlots={pollSlots}
            onAddSlot={handleAddPollSlot}
            onRemoveSlot={handleRemovePollSlot}
            onSlotChange={handlePollSlotChange}
            pollRestrictionType={pollRestrictionType}
            setPollRestrictionType={setPollRestrictionType}
            pollTarget={pollTarget}
            setPollTarget={setPollTarget}
          />
        )}

        {/* Section Rédactrice de l'Ordre du Jour */}
        <div className="border-t border-dashed border-cordel-master-dark/20 pt-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="text-[9.5px] uppercase font-black text-cordel-wood">
              📋 {t('governance.agendaSectionTitle')}
            </label>
            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={onOpenImportModal}
              className="text-[8.5px] font-extrabold uppercase px-2 py-0.5"
            >
              📥 {t('governance.btnImportTemplate')}
            </CordelButton>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={newPointTitle}
              onChange={(e) => setNewPointTitle(e.target.value)}
              placeholder={t('governance.agendaPointPlaceholder')}
              className="theme-input text-xs flex-1 bg-white py-1"
            />
            <button
              type="button"
              onClick={handleAddAgendaPoint}
              title={t('governance.btnAddAgendaPoint')}
              className="text-xs font-extrabold px-2.5 py-1 bg-cordel-wood text-white rounded hover:brightness-95 cursor-pointer"
            >
              ＋
            </button>
          </div>

          {pointsOrdreDuJour.length > 0 && (
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto bg-white/70 p-1.5 rounded border border-cordel-master-dark/15">
              {pointsOrdreDuJour.map((pt, idx) => (
                <div key={pt.id || idx} className="flex justify-between items-center text-[11px] pl-1.5 border-l-2 border-cordel-wood font-medium">
                  <span>{idx + 1}. {pt.titre}</span>
                  <button
                    type="button"
                    onClick={() => setPointsOrdreDuJour(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-600 font-bold px-1 text-[10px] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            type="url"
            value={lienDocument}
            onChange={(e) => setLienDocument(e.target.value)}
            placeholder={t('governance.optionalDocLink')}
            className="theme-input text-[11px] w-full py-1 bg-white"
          />
        </div>

        {/* Alerte Push + Validation */}
        <div className="flex flex-col gap-2 pt-1.5 border-t border-dashed border-cordel-master-dark/15">
          <label className="flex items-center gap-2 text-[11px] font-bold text-cordel-wood cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendPushNotification}
              onChange={(e) => setSendPushNotification(e.target.checked)}
              disabled={isSubmitting}
              className="w-3.5 h-3.5 rounded accent-cordel-wood cursor-pointer"
            />
            <span>🔔 Envoyer une notification Push aux membres</span>
          </label>

          <CordelButton
            variant="ocre"
            type="submit"
            disabled={isSubmitting}
            useExtremeBorder={true}
            className="text-xs py-2 font-extrabold uppercase tracking-wider w-full"
          >
            {isSubmitting ? "Création en cours..." : (creationMode === 'poll' ? "🚀 Lancer le Sondage" : `📅 ${t('governance.btnScheduleMeeting')}`)}
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}

