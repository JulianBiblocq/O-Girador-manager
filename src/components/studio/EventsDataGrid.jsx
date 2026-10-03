import React, { useState, useMemo } from 'react';
import EventsDataGridRow from './EventsDataGridRow';
import { useTranslation } from '../LanguageContext';

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
  const { t } = useTranslation();
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
        case 'enableCarpool':
          valA = a.enableCarpool !== false ? 1 : 0;
          valB = b.enableCarpool !== false ? 1 : 0;
          break;
        case 'isPublic':
          valA = Boolean(a.isPublic) ? 1 : 0;
          valB = Boolean(b.isPublic) ? 1 : 0;
          break;
        case 'morceaux':
          valA = (a.linkedPatterns || []).length;
          valB = (b.linkedPatterns || []).length;
          break;
        case 'scene':
          valA = a.isStageLayoutPublished ? 2 : (a.stageLayout ? 1 : 0);
          valB = b.isStageLayoutPublished ? 2 : (b.stageLayout ? 1 : 0);
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

  const renderSortChevron = (key) => {
    if (sortConfig.key !== key) return <span className="opacity-20 text-[9px]">↕</span>;
    return <span className="text-cordel-wood font-black text-[10px]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="w-full overflow-x-auto border-2 border-[var(--encre-noire)] rounded-[6px_10px_7px_9px] shadow-[4px_4px_0px_0px_#181716] bg-[var(--cordel-bg-light)]">
      <table className="w-full text-left text-xs border-collapse select-none">
        <thead className="border-b-2 border-[var(--encre-noire)] text-[10px] uppercase font-black tracking-wider text-[var(--cordel-wood)]">
          <tr>
            <th 
              onClick={() => handleHeaderClick('titre')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[200px] sticky left-0 top-0 z-30 bg-[var(--cordel-bg-light)] shadow-[2px_0px_0px_0px_rgba(24,23,22,0.1)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParTitre')}
            >
              <div className="flex items-center gap-1">
                <span>{t('secretariat.thColTitle')}</span>
                {renderSortChevron('titre')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('type')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[130px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParType')}
            >
              <div className="flex items-center gap-1">
                <span>{t('secretariat.thColType')}</span>
                {renderSortChevron('type')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('description')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[180px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParDescription')}
            >
              <div className="flex items-center gap-1">
                <span>{t('secretariat.thColDescription')}</span>
                {renderSortChevron('description')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('date')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[130px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParDate')}
            >
              <div className="flex items-center gap-1">
                <span>{t('secretariat.thColDate')}</span>
                {renderSortChevron('date')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('heureDebut')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[95px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParHeure')}
            >
              <div className="flex items-center gap-1">
                <span>{t('secretariat.thColStartTime')}</span>
                {renderSortChevron('heureDebut')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('heureFin')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[95px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParHeureAlt')}
            >
              <div className="flex items-center gap-1">
                <span>{t('secretariat.thColEndTime')}</span>
                {renderSortChevron('heureFin')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('lieuSimple')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[150px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParLieu')}
            >
              <div className="flex items-center gap-1">
                <span>{t('secretariat.thColSimpleLocation')}</span>
                {renderSortChevron('lieuSimple')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('dateLimiteInscription')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[130px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParDateAlt')}
            >
              <div className="flex items-center gap-1">
                <span>{t('secretariat.thColDeadline')}</span>
                {renderSortChevron('dateLimiteInscription')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('niveauRequis')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[120px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParNiveau')}
            >
              <div className="flex items-center gap-1">
                <span>{t('studio.photos.niveauPerc')}</span>
                {renderSortChevron('niveauRequis')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('niveauDanseRequis')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[120px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParNiveauAlt')}
            >
              <div className="flex items-center gap-1">
                <span>{t('studio.photos.niveauDanse')}</span>
                {renderSortChevron('niveauDanseRequis')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('tenueRequise')}
              className="p-3 border-r border-[var(--encre-noire)]/15 whitespace-nowrap min-w-[120px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParTenue')}
            >
              <div className="flex items-center gap-1">
                <span>{t('studio.photos.tenue')}</span>
                {renderSortChevron('tenueRequise')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('includesPercussion')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[95px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParInclut')}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{t('studio.photos.percAlt')}</span>
                {renderSortChevron('includesPercussion')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('includesDance')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[95px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParInclutAlt')}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{t('studio.photos.danse')}</span>
                {renderSortChevron('includesDance')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('requiresValidation')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[125px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParSoumis')}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{t('studio.photos.validation')}</span>
                {renderSortChevron('requiresValidation')}
              </div>
            </th>

            <th 
              onClick={() => handleHeaderClick('enableInscriptions')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[125px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParInscriptions')}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{t('studio.photos.inscriptions')}</span>
                {renderSortChevron('enableInscriptions')}
              </div>
            </th>

            {/* 16. Covoiturage (Toggle interactif) */}
            <th 
              onClick={() => handleHeaderClick('enableCarpool')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[105px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParCovoiturage')}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{t('studio.photos.covoit')}</span>
                {renderSortChevron('enableCarpool')}
              </div>
            </th>

            {/* 17. Public / Vitrine (Toggle interactif) */}
            <th 
              onClick={() => handleHeaderClick('isPublic')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[100px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParVisibilite')}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{t('studio.photos.public')}</span>
                {renderSortChevron('isPublic')}
              </div>
            </th>

            {/* 18. Morceaux / Setlist (Indicateur) */}
            <th 
              onClick={() => handleHeaderClick('morceaux')}
              className="p-3 border-r border-[var(--encre-noire)]/15 text-center whitespace-nowrap min-w-[110px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParNombre')}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{t('studio.photos.morceaux')}</span>
                {renderSortChevron('morceaux')}
              </div>
            </th>

            {/* 19. Plan de Scène (Indicateur) */}
            <th 
              onClick={() => handleHeaderClick('scene')}
              className="p-3 text-center whitespace-nowrap min-w-[110px] sticky top-0 z-20 bg-[var(--cordel-master-light-color)] cursor-pointer hover:bg-black/5 transition-colors"
              title={t('studio.photos.cliquerPourTrierParStatut')}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{t('studio.photos.scene')}</span>
                {renderSortChevron('scene')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--encre-noire)]/10 font-medium">
          {sortedEvents.length === 0 ? (
            <tr>
              <td colSpan="19" className="p-8 text-center text-[var(--cordel-text)]/60 font-bold italic">
                {t('studio.photos.aucunEvenementDisponible')}
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

