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
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90dvh] bg-[var(--cordel-bg)] text-[var(--cordel-text)] rounded-xl shadow-2xl animate-scale-up border-2 border-cordel-master-dark overflow-hidden">
        {/* Étage 1 : En-tête fixe */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b-2 border-cordel-master-dark bg-[var(--cordel-bg)]">
          <h2 className="text-xl md:text-2xl font-bold font-heading tracking-wider text-cordel-master-dark truncate mr-2">
            {event.title || event.titre || 'Réunion'} - {new Date(event.date).toLocaleDateString('fr-FR')}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 p-2 transition-colors hover:bg-black/10 rounded-full text-cordel-rouge"
            aria-label="Fermer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
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
