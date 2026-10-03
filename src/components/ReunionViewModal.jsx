import React from 'react';
import EventReportSection from './event-details/EventReportSection';

export default function ReunionViewModal({ event, user, profileData, onClose }) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
      />
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90dvh] bg-[var(--cordel-bg)] text-[var(--cordel-text)] rounded-xl shadow-2xl animate-scale-up border-2 border-cordel-master-dark overflow-hidden mt-2 sm:mt-0">
        {/* Étage 1 : En-tête fixe */}
        <div className="shrink-0 flex items-start justify-between gap-3 p-4 border-b-2 border-cordel-master-dark bg-[var(--cordel-bg)]">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-xl md:text-2xl font-bold font-heading tracking-wider text-cordel-master-dark break-words">
              {event.title || event.titre || 'Réunion'} - {new Date(event.date).toLocaleDateString('fr-FR')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-cordel-rouge hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title="Fermer"
            aria-label="Fermer"
          >
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        {/* Étage 2 : Corps scrollable sécurisé */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain varal-scrollbar p-2 md:p-4 pb-safe">
          <EventReportSection 
            event={event} 
            user={user} 
            profileData={profileData} 
            associationSettings={{ nom: "O Girador" }} 
          />
        </div>
      </div>
    </div>
  );
}
