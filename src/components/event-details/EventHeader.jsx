import React, { useState, useRef, useEffect } from 'react';
import CordelButton from '../CordelButton';

/**
 * En-tête synthétique compact et barre d'actions pour la fiche détaillée d'un événement.
 * Intègre un bandeau d'informations clés, l'action principale contextuelle
 * et un menu déroulant secondaire « ••• » avec détection de click-away.
 *
 * @param {Object} props Propriétés du composant
 */
export default function EventHeader({
  event,
  isAuthorized,
  rawIsAuthorized,
  isEditingEvent,
  setIsEditingEvent,
  isMemberViewSimulation,
  setIsMemberViewSimulation,
  onClose,
  onPrev,
  onNext,
  onNavigateToView,
  handleDeleteEvent,
  setIsSendContractModalOpen,
  handlePreparePublication,
  handleAddToGoogleCalendar,
  handleDownloadIcs,
  setShowQrCodeModal,
  setShowMediaQrCodeModal,
  lienGoogleFormRecoltePhotos,
  userDiscipline,
  t
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Détection de clic à l'extérieur pour fermer le menu déroulant « ••• »
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Formatage de la date en français
  const formatDateFr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  };

  const formatTimeFr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formattedDate = formatDateFr(event.date);
  const formattedTime = formatTimeFr(event.date);
  const hasDateFin = Boolean(event.dateFin);
  const formattedDateFin = hasDateFin ? formatDateFr(event.dateFin) : '';
  const formattedTimeFin = hasDateFin ? formatTimeFr(event.dateFin) : '';

  const mapsUrl = event.lieu 
    ? (event.latitude && event.longitude 
        ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.lieu)}`)
    : null;

  return (
    <div className="flex flex-col gap-3 text-left relative select-none">
      {/* 1. Barre supérieure de navigation : Bouton Retour & Flèches Précédent/Suivant */}
      <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-1.5">
          <CordelButton variant="default" onClick={onClose} className="px-3 py-1 text-xs font-black">
            ← {t('common.back') || "Retour"}
          </CordelButton>
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-2.5 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-neutral-100 cursor-pointer"
              title="Événement précédent"
            >
              ◀
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-2.5 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] hover:bg-neutral-100 cursor-pointer"
              title="Événement suivant"
            >
              ▶
            </button>
          )}
        </div>

        {/* 2. Actions de l'en-tête (Action Principale + Menu Déroulant « ••• ») */}
        {!isEditingEvent && (
          <div className="flex items-center gap-2">
            {/* Action principale contextuelle */}
            {isAuthorized ? (
              <button
                type="button"
                onClick={() => setIsEditingEvent(true)}
                className="text-[10px] font-black uppercase bg-cordel-bg hover:bg-cordel-hover border border-encre-noire px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1"
                title="Modifier l'événement"
              >
                ✏️ <span>Modifier</span>
              </button>
            ) : null}

            {/* Menu Déroulant Secondaire « ••• » */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`
                  p-1.5 px-2.5 rounded border border-encre-noire font-black text-xs cursor-pointer shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-colors
                  ${isMenuOpen ? 'bg-cordel-wood text-white' : 'bg-cordel-bg-light hover:bg-cordel-bg text-encre-noire'}
                `}
                title="Options et actions secondaires"
              >
                •••
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-cordel-bg border-2 border-encre-noire rounded-[6px_10px_8px_12px] shadow-[3px_3px_0px_0px_#181716] py-1 z-50 flex flex-col text-left overflow-hidden">
                  {/* Export Calendrier */}
                  <div className="px-3 py-1 text-[9px] uppercase font-bold tracking-wider text-cordel-wood border-b border-dashed border-encre-noire/15 opacity-80">
                    Ajouter au calendrier
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToGoogleCalendar();
                      setIsMenuOpen(false);
                    }}
                    className="px-3 py-2 text-[11px] font-bold text-encre-noire hover:bg-cordel-hover cursor-pointer flex items-center gap-2"
                  >
                    <span>🔵</span> Google Agenda
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadIcs();
                      setIsMenuOpen(false);
                    }}
                    className="px-3 py-2 text-[11px] font-bold text-encre-noire hover:bg-cordel-hover cursor-pointer flex items-center gap-2 border-b border-dashed border-encre-noire/15"
                  >
                    <span>🍏</span> Apple / Outlook (.ics)
                  </button>

                  {/* Médias & QR Codes */}
                  {event.lienDepotMedias && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMediaQrCodeModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="px-3 py-2 text-[11px] font-bold text-encre-noire hover:bg-cordel-hover cursor-pointer flex items-center gap-2"
                    >
                      <span>📸</span> QR Code Dépôt Médias
                    </button>
                  )}

                  {lienGoogleFormRecoltePhotos && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowQrCodeModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="px-3 py-2 text-[11px] font-bold text-encre-noire hover:bg-cordel-hover cursor-pointer flex items-center gap-2"
                    >
                      <span>📷</span> QR Code Récolte Photos
                    </button>
                  )}

                  {/* Outils Administration */}
                  {rawIsAuthorized && (
                    <>
                      <div className="px-3 py-1 text-[9px] uppercase font-bold tracking-wider text-cordel-wood border-t border-b border-dashed border-encre-noire/15 opacity-80 mt-1">
                        Administration
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMemberViewSimulation(!isMemberViewSimulation);
                          setIsMenuOpen(false);
                        }}
                        className="px-3 py-2 text-[11px] font-bold text-encre-noire hover:bg-cordel-hover cursor-pointer flex items-center gap-2"
                      >
                        <span>👁️</span> {isMemberViewSimulation ? 'Quitter la vue adhérent' : 'Aperçu Vue Adhérent'}
                      </button>

                      {setIsSendContractModalOpen && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSendContractModalOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className="px-3 py-2 text-[11px] font-bold text-encre-noire hover:bg-cordel-hover cursor-pointer flex items-center gap-2"
                        >
                          <span>📝</span> Envoyer un contrat (Brevo)
                        </button>
                      )}

                      {handlePreparePublication && (
                        <button
                          type="button"
                          onClick={() => {
                            handlePreparePublication();
                            setIsMenuOpen(false);
                          }}
                          className="px-3 py-2 text-[11px] font-bold text-encre-noire hover:bg-cordel-hover cursor-pointer flex items-center gap-2"
                        >
                          <span>📢</span> Préparer la publication
                        </button>
                      )}

                      <div className="border-t border-dashed border-encre-noire/15 my-0.5" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleDeleteEvent();
                        }}
                        className="px-3 py-2 text-[11px] font-black text-red-700 hover:bg-red-50 cursor-pointer flex items-center gap-2"
                      >
                        <span>🗑️</span> Supprimer l'événement
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bouton Annuler si en mode édition */}
        {isAuthorized && isEditingEvent && (
          <button
            type="button"
            onClick={() => setIsEditingEvent(false)}
            className="text-[10px] font-black uppercase bg-neutral-200 border border-encre-noire px-3 py-1.5 rounded cursor-pointer"
          >
            Annuler l'édition
          </button>
        )}
      </div>

      {/* 3. Bandeau Visuel Synthétique de l'Événement */}
      <div className="relative overflow-hidden bg-cordel-bg p-3.5 rounded-[8px_12px_9px_11px] border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716]">
        {/* Tampon de statut en biais (Annulé / À confirmer / Validé) */}
        {event.status === 'annule' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
            <span 
              style={{ transform: 'rotate(-12deg)' }}
              className="text-red-600 border-[3.5px] border-red-600 px-6 py-1.5 rounded-lg font-black text-xl tracking-widest uppercase opacity-85 bg-white/10 backdrop-blur-[1px]"
            >
              ANNULÉ
            </span>
          </div>
        )}
        {event.status === 'a_confirmer' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
            <span 
              style={{ transform: 'rotate(-12deg)' }}
              className="text-orange-600 border-[3.5px] border-orange-600 px-6 py-1.5 rounded-lg font-black text-xl tracking-widest uppercase opacity-85 bg-white/10 backdrop-blur-[1px]"
            >
              À CONFIRMER
            </span>
          </div>
        )}

        {/* Ligne 1 : Badges de Type & Disciplines */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-cordel-wood text-white rounded-[3px_5px] border border-encre-noire/30 shadow-xs">
              {(() => {
                switch (event.type) {
                  case 'prestation': return t('widgetAgenda.typePrestation') || 'Prestation';
                  case 'repetition': return t('widgetAgenda.typeRepetition') || 'Répétition';
                  case 'atelier': return t('widgetAgenda.typeAtelier') || 'Atelier';
                  case 'stage': return t('widgetAgenda.typeStage') || 'Stage';
                  case 'reunion': return t('widgetAgenda.typeReunion') || 'Réunion';
                  default: return event.type || 'Événement';
                }
              })()}
            </span>

            {event.includesPercussion && (
              <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-orange-200">
                <img src="/icones/alfaia.svg" alt="Percu" className="w-3 h-3 object-contain inline-block" />
                <span>Percussion</span>
              </span>
            )}

            {event.includesDance && (
              <span className="inline-flex items-center gap-1 bg-pink-100 dark:bg-pink-950/40 text-pink-800 dark:text-pink-300 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-pink-200">
                💃 <span>Danse</span>
              </span>
            )}
          </div>

          {event.isPublic && (
            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
              🌍 Public
            </span>
          )}
        </div>

        {/* Titre principal */}
        <h2 className="text-lg md:text-xl font-black text-encre-noire leading-snug mb-1">
          {event.titre}
        </h2>

        {/* Date, Horaires & Lieu */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-encre-noire/85 pt-1">
          <span className="flex items-center gap-1">
            <span>📅</span>
            <span>
              {hasDateFin 
                ? `Du ${formattedDate} ${formattedTime ? `à ${formattedTime}` : ''} au ${formattedDateFin} ${formattedTimeFin ? `à ${formattedTimeFin}` : ''}`
                : `${formattedDate} ${formattedTime ? `à ${formattedTime}` : ''}`}
            </span>
          </span>

          {event.lieu && (
            <span className="flex items-center gap-1">
              <span>📍</span>
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cordel-wood hover:underline font-bold"
                  title="Ouvrir dans Google Maps"
                >
                  {event.lieu} ↗
                </a>
              ) : (
                <span>{event.lieu}</span>
              )}
            </span>
          )}

          {event.horairesPassages && (
            <span className="flex items-center gap-1 text-cordel-wood font-bold">
              <span>⏱️ Passages :</span>
              <span>{event.horairesPassages}</span>
            </span>
          )}
        </div>

        {/* Tenues requises (Boutons vers le vestiaire) */}
        {(event.dressCodePercussion || event.dressCodeDanse || event.tenueRequise) && (
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-dashed border-cordel-master-dark/15 text-[11px]">
            <span className="font-bold text-cordel-wood uppercase text-[9px] tracking-wider">
              👗 Tenue(s) :
            </span>

            {/* Percussion */}
            {(event.dressCodePercussion || (userDiscipline !== 'danse' && event.tenueRequise && !event.dressCodeDanse)) && (
              <button
                type="button"
                onClick={() => onNavigateToView && onNavigateToView('vestiaire')}
                className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 hover:brightness-105 cursor-pointer"
                title="Consulter mon vestiaire"
              >
                <span>🥁 {event.dressCodePercussion || event.tenueRequise}</span>
                <span className="text-[8px] opacity-75">🎒 →</span>
              </button>
            )}

            {/* Danse */}
            {(event.dressCodeDanse || (userDiscipline !== 'percussion' && event.tenueRequise && !event.dressCodePercussion)) && (
              <button
                type="button"
                onClick={() => onNavigateToView && onNavigateToView('vestiaire')}
                className="inline-flex items-center gap-1 text-[10px] font-bold bg-pink-100 text-pink-900 px-2 py-0.5 rounded border border-pink-300 hover:brightness-105 cursor-pointer"
                title="Consulter mon vestiaire"
              >
                <span>💃 {event.dressCodeDanse || event.tenueRequise}</span>
                <span className="text-[8px] opacity-75">🎒 →</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
