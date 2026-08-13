import React, { useState, useRef, useEffect } from 'react';
import CordelButton from '../CordelButton';

/**
 * Barre d'actions rapides pour un événement (Inscriptions, Export Calendrier et Administration).
 *
 * @param {Object} props Propriétés du composant
 * @param {Object} props.event Données de l'événement
 * @param {boolean} props.isAdmin Détermine si l'utilisateur courant est administrateur
 * @param {Function} props.onToggleEdit Action de bascule du mode édition
 * @param {Function} props.onDelete Action de suppression de l'événement
 * @param {Function} props.t Fonction de traduction
 */
export default function EventQuickActionsBar({ event, isAdmin, onToggleEdit, onDelete, lienQrCodePublic, onOpenQrCodeModal, t }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Génération du lien d'ajout Google Calendar
  const getGoogleCalendarUrl = () => {
    if (!event.date) return '#';
    const startDate = new Date(event.date);
    const endDate = event.dateFin ? new Date(event.dateFin) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const formatTime = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const dates = `${formatTime(startDate)}/${formatTime(endDate)}`;
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.lieu || '');
    const title = encodeURIComponent(event.titre || 'Événement');

    return `https://calendar.google.com/calendar/afficher?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  // Téléchargement du fichier iCal / ICS
  const handleDownloadICS = () => {
    if (!event.date) return;
    const startDate = new Date(event.date);
    const endDate = event.dateFin ? new Date(event.dateFin) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const formatTime = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//O Girador//NONSGML Event//FR',
      'BEGIN:VEVENT',
      `SUMMARY:${event.titre || 'Événement'}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.lieu || ''}`,
      `DTSTART:${formatTime(startDate)}`,
      `DTEND:${formatTime(endDate)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${(event.titre || 'evenement').toLowerCase().replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-cordel-bg-light border-2 border-dashed border-cordel-master-dark/20 rounded-[6px] select-none">
      <div className="flex flex-wrap items-center gap-2">
        {/* Menu déroulant d'ajout au calendrier */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="p-1.5 px-3 bg-cordel-bg hover:bg-neutral-200 text-encre-noire border border-encre-noire rounded-[4px] shadow-[1px_1px_0px_0px_#181716] font-bold text-xs flex items-center gap-1.5 cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px]"
          >
            <span>📅</span>
            <span>Ajouter au calendrier</span>
            <span className="text-[10px]">▼</span>
          </button>

          {isMenuOpen && (
            <div className="absolute left-0 mt-1 w-48 bg-white border-2 border-encre-noire rounded-[6px] shadow-[2px_2px_0px_0px_#181716] z-50 overflow-hidden flex flex-col">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="p-2.5 px-3 text-xs font-bold text-encre-noire hover:bg-cordel-bg border-b border-dashed border-cordel-master-dark/20 flex items-center gap-2"
              >
                <span>🌐</span> Google Calendar
              </a>
              <button
                type="button"
                onClick={() => {
                  handleDownloadICS();
                  setIsMenuOpen(false);
                }}
                className="p-2.5 px-3 text-xs font-bold text-encre-noire hover:bg-cordel-bg flex items-center gap-2 text-left cursor-pointer"
              >
                <span>📲</span> Fichier iCal / Outlook (.ics)
              </button>
            </div>
          )}
        </div>

        {/* Bouton QR Code Public Récolte Photos (si configuré) */}
        {lienQrCodePublic && (
          <button
            type="button"
            onClick={onOpenQrCodeModal}
            className="p-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white border border-encre-noire rounded-[4px] shadow-[1px_1px_0px_0px_#181716] font-black text-xs flex items-center gap-1.5 cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] transition-colors"
            title="Afficher le QR Code pour faire scanner les spectateurs et récolter leurs photos et vidéos"
          >
            <span>📷</span>
            <span>QR Code Récolte Photos</span>
          </button>
        )}
      </div>

      {/* Actions Administrateur */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          <CordelButton
            variant="default"
            onClick={onToggleEdit}
            className="px-3 py-1 text-xs font-bold"
          >
            ✏️ {t('common.edit') || "Éditer"}
          </CordelButton>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 px-2 bg-red-100 hover:bg-red-200 text-red-800 border border-red-400 rounded-[4px] text-xs font-bold shadow-xs cursor-pointer"
              title="Supprimer l'événement"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
}
