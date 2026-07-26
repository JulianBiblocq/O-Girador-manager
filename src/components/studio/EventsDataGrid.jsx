import React from 'react';
import EventToggleSwitch from './EventToggleSwitch';

/**
 * Helper to extract formatted date (DD/MM/YYYY)
 */
const formatDate = (rawDate) => {
  if (!rawDate) return '-';
  const cleanStr = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return cleanStr;
};

/**
 * Helper to extract time (HH:mm)
 */
const formatTime = (rawTime, rawDate) => {
  if (rawTime) return rawTime.substring(0, 5);
  if (rawDate && rawDate.includes('T')) {
    const timePart = rawDate.split('T')[1];
    if (timePart) return timePart.substring(0, 5);
  }
  return '-';
};

/**
 * Helper to format level text nicely
 */
const formatLevelText = (val, defaultFallback = 'Tous') => {
  if (!val) return defaultFallback;
  const lower = val.toLowerCase();
  if (lower === 'confirme' || lower === 'confirmé') return '🏆 Confirmé';
  if (lower === 'debutant' || lower === 'débutant') return '🌱 Débutant';
  if (lower === 'tous') return '👥 Tous';
  if (lower === 'aucun') return 'Aucun';
  return val;
};

/**
 * EventsDataGrid - Data Grid displaying events in the exact 14 columns requested
 * with interactive inline switches for quick database updates.
 */
export default function EventsDataGrid({
  events = [],
  onToggleField,
  updatingEventId = null,
  updatingField = null
}) {
  return (
    <div className="w-full overflow-x-auto border-2 border-encre-noire rounded-[6px_4px_5px_3px] shadow-[2px_2px_0px_0px_#181716] bg-white dark:bg-black/30">
      <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-cordel-wood/10 dark:bg-white/10 border-b-2 border-encre-noire text-[10px] uppercase tracking-wider text-cordel-master-dark dark:text-cordel-parchemin font-black select-none">
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[150px]">1. Titre</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[90px]">2. Type</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[180px]">3. Description</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[95px]">4. Date</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[85px]">5. Heure début</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[85px]">6. Heure fin</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[130px]">7. Lieu simple</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[100px]">8. Date limite</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[100px]">9. Niveau perc</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[100px]">10. Niveau danse</th>
            <th className="p-3 border-r border-encre-noire/15 whitespace-nowrap min-w-[100px]">11. Tenue</th>
            <th className="p-3 border-r border-encre-noire/15 text-center whitespace-nowrap min-w-[95px]">12. Inclut perc</th>
            <th className="p-3 border-r border-encre-noire/15 text-center whitespace-nowrap min-w-[95px]">13. Inclut danse</th>
            <th className="p-3 text-center whitespace-nowrap min-w-[125px]">14. Soumis à validation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-encre-noire/10 font-medium">
          {events.length === 0 ? (
            <tr>
              <td colSpan="14" className="p-8 text-center text-cordel-master-dark/60 font-bold italic">
                Aucun événement disponible.
              </td>
            </tr>
          ) : (
            events.map((event, idx) => {
              const isUpdatingRow = updatingEventId === event.id;

              return (
                <tr
                  key={event.id || idx}
                  className="hover:bg-cordel-wood/5 dark:hover:bg-white/5 transition-colors"
                >
                  {/* 1. Titre */}
                  <td className="p-2.5 border-r border-encre-noire/10 font-bold text-encre-noire dark:text-white">
                    {event.titre || '-'}
                  </td>

                  {/* 2. Type */}
                  <td className="p-2.5 border-r border-encre-noire/10">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cordel-bg dark:bg-white/10 text-cordel-wood dark:text-cordel-parchemin border border-encre-noire/20 select-none">
                      {event.type || '-'}
                    </span>
                  </td>

                  {/* 3. Description */}
                  <td className="p-2.5 border-r border-encre-noire/10 max-w-[200px] truncate text-encre-noire/80 dark:text-white/80" title={event.description}>
                    {event.description || '-'}
                  </td>

                  {/* 4. Date */}
                  <td className="p-2.5 border-r border-encre-noire/10 font-semibold whitespace-nowrap">
                    {formatDate(event.date)}
                  </td>

                  {/* 5. Heure début */}
                  <td className="p-2.5 border-r border-encre-noire/10 font-semibold whitespace-nowrap text-center">
                    {formatTime(event.heureDebut, event.date)}
                  </td>

                  {/* 6. Heure fin */}
                  <td className="p-2.5 border-r border-encre-noire/10 font-semibold whitespace-nowrap text-center">
                    {formatTime(event.heureFin, event.dateFin)}
                  </td>

                  {/* 7. Lieu simple */}
                  <td className="p-2.5 border-r border-encre-noire/10 max-w-[150px] truncate" title={event.lieuSimple || event.lieu}>
                    {event.lieuSimple || event.lieu || '-'}
                  </td>

                  {/* 8. Date limite */}
                  <td className="p-2.5 border-r border-encre-noire/10 whitespace-nowrap text-amber-900 dark:text-amber-300 font-semibold">
                    {formatDate(event.dateLimiteInscription || event.dateLimite)}
                  </td>

                  {/* 9. Niveau perc */}
                  <td className="p-2.5 border-r border-encre-noire/10 whitespace-nowrap">
                    {formatLevelText(event.niveauRequis || event.niveauPercussion, 'Tous')}
                  </td>

                  {/* 10. Niveau danse */}
                  <td className="p-2.5 border-r border-encre-noire/10 whitespace-nowrap">
                    {formatLevelText(event.niveauDanseRequis || event.niveauDanse, 'Aucun')}
                  </td>

                  {/* 11. Tenue */}
                  <td className="p-2.5 border-r border-encre-noire/10 whitespace-nowrap">
                    {event.tenueRequise || event.tenue || '-'}
                  </td>

                  {/* 12. Inclut perc (Interactive Toggle) */}
                  <td className="p-2.5 border-r border-encre-noire/10 text-center select-none">
                    <div className="flex items-center justify-center gap-1.5">
                      <EventToggleSwitch
                        checked={Boolean(event.includesPercussion)}
                        onChange={() => onToggleField(event.id, 'includesPercussion', Boolean(event.includesPercussion))}
                        disabled={isUpdatingRow && updatingField === 'includesPercussion'}
                        activeColor="bg-amber-600 dark:bg-amber-500"
                        label={`Toggle Percussion pour ${event.titre}`}
                      />
                      <img src="/icones/alfaia.svg" alt="Percussion" className="w-3.5 h-3.5 object-contain dark:invert shrink-0 opacity-80" />
                    </div>
                  </td>

                  {/* 13. Inclut danse (Interactive Toggle) */}
                  <td className="p-2.5 border-r border-encre-noire/10 text-center select-none">
                    <div className="flex items-center justify-center gap-1.5">
                      <EventToggleSwitch
                        checked={Boolean(event.includesDance)}
                        onChange={() => onToggleField(event.id, 'includesDance', Boolean(event.includesDance))}
                        disabled={isUpdatingRow && updatingField === 'includesDance'}
                        activeColor="bg-pink-600 dark:bg-pink-500"
                        label={`Toggle Danse pour ${event.titre}`}
                      />
                      <span className="text-xs shrink-0">💃</span>
                    </div>
                  </td>

                  {/* 14. Soumis à validation (Interactive Toggle) */}
                  <td className="p-2.5 text-center select-none">
                    <div className="flex items-center justify-center gap-1.5">
                      <EventToggleSwitch
                        checked={Boolean(event.requiresValidation)}
                        onChange={() => onToggleField(event.id, 'requiresValidation', Boolean(event.requiresValidation))}
                        disabled={isUpdatingRow && updatingField === 'requiresValidation'}
                        activeColor="bg-emerald-600 dark:bg-emerald-500"
                        label={`Toggle Validation pour ${event.titre}`}
                      />
                      <span className="text-xs shrink-0">🔒</span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
