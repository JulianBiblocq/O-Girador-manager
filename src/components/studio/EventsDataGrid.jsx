import React from 'react';
import EventsDataGridRow from './EventsDataGridRow';

/**
 * EventsDataGrid - Data Grid displaying events in 14 columns
 * with a sticky "Titre" column and full inline editing capability.
 */
export default function EventsDataGrid({
  events = [],
  onUpdateField,
  onToggleField,
  updatingEventId = null,
  updatingField = null
}) {
  return (
    <div className="w-full overflow-x-auto border-2 border-[var(--encre-noire)] rounded-[6px_4px_5px_3px] shadow-[2px_2px_0px_0px_#181716] bg-[var(--cordel-card-bg)]">
      <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
        <thead>
          <tr className="bg-[var(--cordel-master-light-color)] border-b-2 border-[var(--encre-noire)] text-[10px] uppercase tracking-wider text-[var(--cordel-wood)] font-black select-none">
            <th className="p-3 border-r-2 border-[var(--encre-noire)]/30 whitespace-nowrap min-w-[180px] sticky left-0 z-20 bg-[var(--cordel-card-bg)] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
              1. Titre
            </th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[110px]">2. Type</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[180px]">3. Description</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[130px]">4. Date</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[95px]">5. Heure début</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[95px]">6. Heure fin</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[150px]">7. Lieu simple</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[130px]">8. Date limite</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[120px]">9. Niveau perc</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[120px]">10. Niveau danse</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[120px]">11. Tenue</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[95px]">12. Inclut perc</th>
            <th className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[95px]">13. Inclut danse</th>
            <th className="p-3 text-center whitespace-nowrap min-w-[125px]">14. Soumis à validation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--encre-noire)]/10 font-medium">
          {events.length === 0 ? (
            <tr>
              <td colSpan="14" className="p-8 text-center text-[var(--cordel-text)]/60 font-bold italic">
                Aucun événement disponible.
              </td>
            </tr>
          ) : (
            events.map((event, idx) => (
              <EventsDataGridRow
                key={event.id || idx}
                event={event}
                onUpdateField={onUpdateField}
                onToggleField={onToggleField}
                updatingEventId={updatingEventId}
                updatingField={updatingField}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
