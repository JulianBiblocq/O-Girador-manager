import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Écran d'information sobre affiché aux membres archivés ou suspendus.
 * Bloque l'accès aux fonctionnalités privées et à l'espace membre,
 * tout en fournissant les instructions et le bouton de déconnexion.
 */
export default function ArchivedAccountScreen({ profileData, branding, onSignOut }) {
  const logoSrc = branding?.logoUrl || '/og-girador-frame.svg';

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-cordel-bg text-encre-noire force-light-theme select-none">
      <div className="max-w-md w-full flex flex-col gap-5 text-center items-center">
        {/* Logo de l'association ou de l'application */}
        {logoSrc && (
          <img
            src={logoSrc}
            alt="Logo Association"
            className="max-w-xs max-h-28 object-contain w-auto h-auto mb-1 select-none"
          />
        )}

        <CordelCard variant="default" useExtremeBorder={true} className="p-6 sm:p-8 flex flex-col gap-5 items-center w-full shadow-[4px_4px_0px_0px_#181716]">
          {/* Badge d'archive sobre style Cordel */}
          <div className="w-16 h-16 rounded-full bg-[var(--color-cordel-rouge)]/10 border-2 border-dashed border-[var(--color-cordel-rouge)]/40 flex items-center justify-center text-3xl shadow-xs">
            🗄️
          </div>

          <div className="flex flex-col gap-1.5 text-center">
            <h2 className="font-black text-lg sm:text-xl uppercase tracking-wider text-cordel-wood">
              Compte actuellement archivé
            </h2>
            {profileData?.prenom && (
              <p className="text-xs font-bold text-cordel-master-dark">
                {profileData.prenom} {profileData.nom}
              </p>
            )}
          </div>

          {/* Message officiel */}
          <div className="p-4 bg-stone-100/90 dark:bg-stone-900/30 border-2 border-dashed border-cordel-master-dark/20 rounded-[6px_10px_8px_12px] text-xs text-cordel-master-dark font-medium leading-relaxed text-left w-full">
            <p>
              Ton accès à l'espace membre de l'association est suspendu pour la saison en cours. Si tu souhaites réintégrer la troupe ou s'il s'agit d'une erreur, contacte directement le bureau ou le Mestre.
            </p>
          </div>

          {/* Bouton de déconnexion */}
          <div className="w-full pt-2">
            <CordelButton
              variant="rouge"
              useExtremeBorder={true}
              onClick={onSignOut}
              className="w-full py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#181716]"
            >
              🚪 Se déconnecter
            </CordelButton>
          </div>
        </CordelCard>

        <p className="text-[10px] text-cordel-master-dark/60 font-semibold uppercase tracking-widest">
          O Girador Manager • Espace Membre
        </p>
      </div>
    </div>
  );
}
