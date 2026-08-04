import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Écran d'attente affiché aux membres nouvellement inscrits dont le compte (isNew === true)
 * n'a pas encore été validé par un administrateur / le bureau de l'association.
 */
export default function PendingValidationScreen({ profileData, branding, onSignOut }) {
  const logoSrc = branding?.logoUrl || '/Pictures/logo-samambaia.png';

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-cordel-bg text-encre-noire force-light-theme">
      <div className="max-w-md w-full flex flex-col gap-5 text-center items-center">
        {/* Logo de l'association */}
        {logoSrc && (
          <img
            src={logoSrc}
            alt="Logo Association"
            className="max-w-xs max-h-32 object-contain w-auto h-auto mb-2 select-none"
          />
        )}

        <CordelCard variant="default" useExtremeBorder={true} className="p-6 flex flex-col gap-4 items-center">
          {/* Badge d'attente Ocre ambré */}
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 border-2 border-dashed border-amber-600/40 flex items-center justify-center text-3xl mb-1 shadow-xs">
            ⏳
          </div>

          <h2 className="font-black text-base sm:text-lg uppercase tracking-wider text-cordel-wood">
            Compte en attente de validation par le bureau
          </h2>

          <p className="text-xs text-cordel-master-dark font-medium leading-relaxed">
            Bonjour <strong className="text-encre-noire">{profileData?.prenom} {profileData?.nom}</strong>, votre profil a été enregistré avec succès !
          </p>

          <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/20 border-2 border-dashed border-amber-600/30 rounded text-xs text-amber-900 dark:text-amber-300 font-bold leading-relaxed text-left">
            <span>ℹ️</span> Votre demande d'inscription est en cours d'examen par l'équipe d'administration de l'association. 
            Vous aurez accès à l'ensemble de l'Espace Membre dès que votre compte aura été validé.
          </div>

          {/* Boutons d'action : Vérifier / Se Déconnecter */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-3">
            <CordelButton
              variant="vert"
              useExtremeBorder={true}
              onClick={handleReload}
              className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              🔄 Vérifier mon statut
            </CordelButton>

            <CordelButton
              variant="rouge"
              useExtremeBorder={true}
              onClick={onSignOut}
              className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              🚪 Se déconnecter
            </CordelButton>
          </div>
        </CordelCard>

        <p className="text-[10px] text-cordel-master-dark/60 font-semibold uppercase tracking-widest">
          O Girador Manager • Secrétariat & Administration
        </p>
      </div>
    </div>
  );
}
