import React from 'react';

/**
 * Icône « + » franche au style Cordel (trait épais, extrémités carrées).
 * Hérite de la couleur du texte (`currentColor`) pour suivre les thèmes.
 *
 * @param {Object} props
 * @param {number} [props.size=18] - Taille en pixels
 * @param {string} [props.className=''] - Classes complémentaires (ex: rotation à l'ouverture)
 */
export default function CordelPlusIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="square"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}
