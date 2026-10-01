import React from 'react';

/**
 * Sous-composant MessageReadReceipt
 * Affiche l'indicateur visuel d'acheminement et de lecture des messages envoyés par l'utilisateur connecté :
 * - Coche simple (✓) : Message envoyé et distribué (teinte neutre/estompée).
 * - Double coche illuminée (✓✓) : Message lu par l'ensemble des destinataires (accent ocre/ambre lumineux).
 *
 * Conçu pour un alignement compact (12-14px) immédiatement à côté de l'heure dans la bulle d'envoi.
 *
 * @param {Object} props
 * @param {'sent'|'read'} [props.status='sent'] - Statut calculé du message
 * @param {string} [props.className=''] - Classes Tailwind optionnelles
 * @param {string} [props.title] - Infobulle personnalisée au survol
 */
export default function MessageReadReceipt({
  status = 'sent',
  className = '',
  title
}) {
  const isRead = status === 'read';

  if (isRead) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 align-middle ml-0.5 select-none text-amber-300 drop-shadow-[0_0_2px_rgba(252,211,77,0.7)] ${className}`}
        title={title || 'Lu par tous les destinataires'}
        aria-label="Lu"
      >
        <svg
          viewBox="0 0 18 16"
          className="w-3.5 h-3.5 stroke-current"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Première coche (arrière-plan légèrement décalé vers la gauche) */}
          <path
            d="M2 8.5L5.5 12L11.5 4.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Deuxième coche (chevauchée décalée vers la droite) */}
          <path
            d="M7 8.5L10.5 12L16.5 4.5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // Statut distribué / envoyé (coche simple neutre)
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ml-0.5 select-none text-cordel-bg-light/60 dark:text-stone-300/60 ${className}`}
      title={title || 'Message envoyé et distribué'}
      aria-label="Envoyé"
    >
      <svg
        viewBox="0 0 16 16"
        className="w-3.5 h-3.5 stroke-current"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 8.5L6.5 12L13.5 4.5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
