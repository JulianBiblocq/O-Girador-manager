import React from 'react';
import OrganizadorStamp from './OrganizadorStamp';

/**
 * Bloc Titre de marque de l'en-tête : "O GIRADOR" surmontant le tampon "ORGANIZADOR".
 * Utilisé à la fois sur le bandeau universel Desktop et sur le haut de page mobile.
 * Applique le filtre d'usure linogravure / xylogravure (.lino-distressed).
 */
export default function HeaderBrandTitle({ className = '', titleSize = 'text-2xl lg:text-3xl' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <h1 className={`panel-title ${titleSize} font-extrabold tracking-wider text-cordel-wood lino-distressed leading-none drop-shadow-[0.5px_0.5px_0px_rgba(24,23,22,0.15)]`}>
        O GIRADOR
      </h1>
      <div className="mt-1 flex items-center justify-center">
        <OrganizadorStamp />
      </div>
    </div>
  );
}
