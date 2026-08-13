import React, { useState, useMemo } from 'react';
import EventsDataGridRow from './EventsDataGridRow';

/**
 * EventsDataGrid - Data Grid displaying events in 15 columns
 * with a sticky "Titre" column, full inline editing, and dynamic column sorting.
 */
export default function EventsDataGrid({
  events = [],
  onUpdateField,
  onToggleField,
  updatingEventId = null,
  updatingField = null,
  lieuxImportants = [],
  defaultLocationsByEventType = {}
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Gérer header click to cycle sorting direction
  const handleHeaderClick = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Dynamic sorting function for all event fields
  const sortedEvents = useMemo(() => {
    const list = [...events];
    if (!sortConfig.key) return list;

    return list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortConfig.key) {
        case 'titre':
          valA = a.titre || '';
          valB = b.titre || '';
          break;
        case 'type':
          valA = a.type || '';
          valB = b.type || '';
          break;
        case 'description':
          valA = a.description || '';
          valB = b.description || '';
          break;
        case 'date':
          valA = a.date || '';
          valB = b.date || '';
          break;
        case 'heureDebut':
          valA = a.heureDebut || (a.date && a.date.includes('T') ? a.date.split('T')[1] : '') || '';
          valB = b.heureDebut || (b.date && b.date.includes('T') ? b.date.split('T')[1] : '') || '';
          break;
        case 'heureFin':
          valA = a.heureFin || (a.dateFin && a.dateFin.includes('T') ? a.dateFin.split('T')[1] : '') || '';
          valB = b.heureFin || (b.dateFin && b.dateFin.includes('T') ? b.dateFin.split('T')[1] : '') || '';
          break;
        case 'lieuSimple':
          valA = a.lieuSimple || a.lieu || '';
          valB = b.lieuSimple || b.lieu || '';
          break;
        case 'dateLimiteInscription':
          valA = a.dateLimiteInscription || a.dateLimite || '';
          valB = b.dateLimiteInscription || b.dateLimite || '';
          break;
        case 'niveauRequis':
          valA = a.niveauRequis || a.niveauPercussion || '';
          valB = b.niveauRequis || b.niveauPercussion || '';
          break;
        case 'niveauDanseRequis':
          valA = a.niveauDanseRequis || a.niveauDanse || '';
          valB = b.niveauDanseRequis || b.niveauDanse || '';
          break;
        case 'tenueRequise':
          valA = a.tenueRequise || a.tenue || '';
          valB = b.tenueRequise || b.tenue || '';
          break;
        case 'includesPercussion':
          valA = Boolean(a.includesPercussion) ? 1 : 0;
          valB = Boolean(b.includesPercussion) ? 1 : 0;
          break;
        case 'includesDance':
          valA = Boolean(a.includesDance) ? 1 : 0;
          valB = Boolean(b.includesDance) ? 1 : 0;
          break;
        case 'requiresValidation':
          valA = Boolean(a.requiresValidation) ? 1 : 0;
          valB = Boolean(b.requiresValidation) ? 1 : 0;
          break;
        case 'enableInscriptions':
          valA = a.enableInscriptions !== false ? 1 : 0;
          valB = b.enableInscriptions !== false ? 1 : 0;
          break;
        default:
          valA = a[sortConfig.key] || '';
          valB = b[sortConfig.key] || '';
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [events, sortConfig]);

  // Fonction utilitaire pour afficher sorting chevrons
  const renderSortChevron = (key) => {
    if (sortConfig.key !== key) {
      return <span className="opacity-30 text-[9px] ml-1 font-bold select-none">↕️</span>;
    }
    return (
      <span className="text-[10px] ml-1 font-black text-[var(--cordel-wood)] select-none">
        {sortConfig.direction === 'asc' ? '🔼' : '🔽'}
      </span>
    );
  };

  return (
    <div className="w-full max-h-[calc(100vh-260px)] overflow-x-auto overflow-y-auto border-2 border-[var(--encre-noire)] rounded-[6px_4px_5px_3px] shadow-[2px_2px_0px_0px_#181716] bg-[var(--cordel-card-bg)] relative">
      <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
        <thead className="bg-[var(--cordel-master-light-color)] border-b-2 border-[var(--encre-noire)] text-[10px] uppercase tracking-wider text-[var(--cordel-wood)] font-black select-none">
          <tr>
            {/* Top-Left Corner Cell: Sticky top-0 left-0 with z-30 */}
            <th 
              onClick={() => handleHeaderClick('titre')}
              className="p-3 border-r-2 border-[var(--encre-noire)]/30 whitespace-nowrap min-w-[180px] sticky top-0 left-0 z-30 bg-[var(--cordel-master-light-color)] shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.2)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Titre"
            >
              <div className="flex items-center gap-1">
                <span>1. Titre</span>
                {renderSortChevron('titre')}
              </div>
            </th>

            {/* Sticky Header Cells: Sticky top-0 with z-20 */}
            <th 
              onClick={() => handleHeaderClick('type')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[110px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Type"
            >
              <div className="flex items-center gap-1">
                <span>2. Type</span>
                {renderSortChevron('type')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('description')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[180px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Description"
            >
              <div className="flex items-center gap-1">
                <span>3. Description</span>
                {renderSortChevron('description')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('date')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[130px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Date"
            >
              <div className="flex items-center gap-1">
                <span>4. Date</span>
                {renderSortChevron('date')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('heureDebut')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[95px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Heure début"
            >
              <div className="flex items-center gap-1">
                <span>5. Heure début</span>
                {renderSortChevron('heureDebut')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('heureFin')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[95px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Heure fin"
            >
              <div className="flex items-center gap-1">
                <span>6. Heure fin</span>
                {renderSortChevron('heureFin')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('lieuSimple')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[150px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Lieu simple"
            >
              <div className="flex items-center gap-1">
                <span>7. Lieu simple</span>
                {renderSortChevron('lieuSimple')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('dateLimiteInscription')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[130px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Date limite"
            >
              <div className="flex items-center gap-1">
                <span>8. Date limite</span>
                {renderSortChevron('dateLimiteInscription')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('niveauRequis')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[120px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Niveau perc"
            >
              <div className="flex items-center gap-1">
                <span>9. Niveau perc</span>
                {renderSortChevron('niveauRequis')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('niveauDanseRequis')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[120px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Niveau danse"
            >
              <div className="flex items-center gap-1">
                <span>10. Niveau danse</span>
                {renderSortChevron('niveauDanseRequis')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('tenueRequise')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[120px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Tenue"
            >
              <div className="flex items-center gap-1">
                <span>11. Tenue</span>
                {renderSortChevron('tenueRequise')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('includesPercussion')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[95px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Inclut perc"
            >
              <div className="flex items-center justify-center gap-1">
                <span>12. Inclut perc</span>
                {renderSortChevron('includesPercussion')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('includesDance')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[95px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Inclut danse"
            >
              <div className="flex items-center justify-center gap-1">
                <span>13. Inclut danse</span>
                {renderSortChevron('includesDance')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('requiresValidation')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[125px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Soumis à validation"
            >
              <div className="flex items-center justify-center gap-1">
                <span>14. Validation</span>
                {renderSortChevron('requiresValidation')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('enableInscriptions')}
              className="p-3 text-center whitespace-nowrap min-w-[125px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title="Cliquer pour trier par Inscriptions requises"
            >
              <div className="flex items-center justify-center gap-1">
                <span>15. Inscriptions</span>
                {renderSortChevron('enableInscriptions')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--encre-noire)]/10 font-medium">
          {sortedEvents.length === 0 ? (
            <tr>
              <td colSpan="15" className="p-8 text-center text-[var(--cordel-text)]/60 font-bold italic">
                Aucun événement disponible.
              </td>
            </tr>
          ) : (
            sortedEvents.map((event, idx) => (
              <EventsDataGridRow
                key={event.id || idx}
                event={event}
                onUpdateField={onUpdateField}
                onToggleField={onToggleField}
                updatingEventId={updatingEventId}
                updatingField={updatingField}
                lieuxImportants={lieuxImportants}
                defaultLocationsByEventType={defaultLocationsByEventType}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

