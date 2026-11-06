import React from 'react';
import CordelAccordion from '../CordelAccordion';
import EventBudgetEditor from '../event-details/EventBudgetEditor';
import EventDeadlineModeField from './EventDeadlineModeField';
import EventVolunteerShiftsEditor from './EventVolunteerShiftsEditor';
import EventPollFormSection from './EventPollFormSection';

/**
 * Étage 3 du formulaire d'événement : Tiroir des options avancées
 * (Date limite d'inscription, horaires de passages, lien externe, budget prévisionnel,
 * créneaux bénévoles et sondage multi-dates).
 * Extrait de EventFormFields.jsx conformément à la Règle du Boy Scout (< 140 lignes).
 */
export default function EventFormAdvancedDrawer({
  formData,
  setFormData,
  handleChange,
  saving = false,
  isEdit = false,
  createConfig = {},
  pupitresList = [],
  eventTypeConfigs = {},
  isAdvancedOpen = false,
  setIsAdvancedOpen,
  translate,
  tr
}) {
  return (
    <CordelAccordion
      title={tr('agenda.advancedOptionsTitle')}
      subtitle={
        tr('agenda.advancedOptionsDesc') ||
        'Date limite, créneaux bénévoles, budget prévisionnel et sondage de dates'
      }
      icon="⚙️"
      isOpen={isAdvancedOpen}
      onToggle={setIsAdvancedOpen}
    >
      <div className="flex flex-col gap-4 pt-1">
        {/* Date limite d'inscription (Aucune / Délai relatif J-N / Date fixe) */}
        <EventDeadlineModeField
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          saving={saving}
          tr={tr}
        />

        {/* Horaires de passages (prestation) */}
        {formData.type === 'prestation' && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {tr('agenda.detailedSchedule')}
            </label>
            <input
              type="text"
              name="horairesPassages"
              value={formData.horairesPassages || ''}
              onChange={handleChange}
              disabled={saving}
              placeholder={tr('agenda.schedulePlaceholder')}
              className="theme-input w-full text-xs"
            />
          </div>
        )}

        {/* Lien externe / social */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('widgetAgenda.socialLinkLabel', 'Lien externe / Réseaux sociaux')}
          </label>
          <input
            type="url"
            name="lienSocial"
            value={formData.lienSocial || ''}
            onChange={handleChange}
            disabled={saving}
            placeholder="https://facebook.com/events/..."
            className="theme-input w-full text-xs"
          />
        </div>

        {/* Finances / Budget Prévisionnel */}
        {createConfig.agendaEnableFinance !== false && (
          <div className="border-t border-dashed border-cordel-master-dark/15 pt-3 flex flex-col gap-2">
            <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
              💰 {tr('agenda.budgetTitle')}
            </h5>
            <EventBudgetEditor
              budgetDepenses={formData.budgetDepenses || []}
              onChangeDepenses={(updated) => setFormData((prev) => ({ ...prev, budgetDepenses: updated }))}
              disabled={saving}
            />
          </div>
        )}

        {/* Créneaux Bénévoles */}
        {createConfig.agendaEnableVolunteerShifts !== false && (
          <EventVolunteerShiftsEditor
            formData={formData}
            setFormData={setFormData}
            saving={saving}
            tr={tr}
          />
        )}

        {/* Sondage multi-dates (Création uniquement) */}
        {!isEdit && (
          <EventPollFormSection
            formData={formData}
            setFormData={setFormData}
            pupitresList={pupitresList}
            eventTypeConfigs={eventTypeConfigs}
            tr={tr}
          />
        )}
      </div>
    </CordelAccordion>
  );
}

