import React from 'react';
import CordelCard from './CordelCard';
import EventReportSection from './event-details/EventReportSection';

export default function ReunionViewModal({ event, user, profileData, onClose }) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto varal-scrollbar bg-[var(--cordel-bg)] text-[var(--cordel-text)] rounded-xl shadow-2xl animate-scale-up border-2 border-cordel-master-dark">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b-2 border-cordel-master-dark bg-[var(--cordel-bg)]">
          <h2 className="text-2xl font-bold font-cactus tracking-wider text-cordel-master-dark">
            {event.title || event.titre || 'Réunion'} - {new Date(event.date).toLocaleDateString('fr-FR')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 transition-colors hover:bg-black/10 rounded-full text-cordel-rouge"
            aria-label="Fermer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-2 md:p-4">
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
