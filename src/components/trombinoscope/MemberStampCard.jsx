import React, { useMemo } from 'react';
import XiloAvatar from '../XiloAvatar';

/**
 * Vignette timbre ultra-dense pour la planche du Trombinoscope (Mosaïque dense).
 * Format timbre xylographique optimisé pour afficher jusqu'à 8 membres par ligne sur grand écran
 * et 3 membres de front sur smartphone.
 *
 * @param {Object} props
 * @param {Object} props.member Données du membre
 * @param {boolean} props.isOnline Statut de présence en ligne
 * @param {boolean} props.isCurrentUser Indique si c'est l'utilisateur connecté
 * @param {string} props.pupitreColor Couleur d'accentuation du pupitre
 * @param {Function} props.onClick Clic pour ouvrir la modale détaillée
 * @param {Function} [props.onEditPhoto] Modification directe de photo de profil
 * @param {Function} [props.t] Fonction de traduction
 */
function MemberStampCard({
  member,
  isOnline = false,
  isCurrentUser = false,
  pupitreColor = '#181716',
  onClick,
  onEditPhoto,
  t = (key) => key
}) {
  const {
    id,
    prenom = '',
    nom = '',
    surnom = '',
    photoURL = null,
    role = 'membre',
    isDependent = false,
    isGhost = false,
    primaryInstrumentName = ''
  } = member;

  const fullName = `${prenom} ${nom}`.trim() || 'Membre';
  const initialName = `${prenom} ${nom ? `${nom[0].toUpperCase()}.` : ''}`.trim();

  // Distinctions visuelles sous forme de micro-tampons d'encre
  const isMestre = role === 'mestre';
  const isBureauOrCA = role === 'bureau' || role === 'ca' || role === 'admin' || role === 'super-admin';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick && onClick(member)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(member);
        }
      }}
      className={`group relative flex flex-col rounded-md border-2 border-[var(--color-cordel-encre,#181716)] bg-[var(--color-cordel-kraft-sombre,#e2d6b5)] shadow-[2px_2px_0px_0px_#181716] overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 select-none ${
        isGhost ? 'opacity-65 hover:opacity-100 grayscale-[0.25] hover:grayscale-0' : ''
      }`}
      title={`${fullName}${surnom ? ` ("${surnom}")` : ''} - Cliquer pour ouvrir la fiche`}
    >
      {/* 1. Zone Photo (Aspect Square dense) */}
      <div className="aspect-square w-full overflow-hidden bg-neutral-900 relative flex items-center justify-center">
        <XiloAvatar
          src={photoURL}
          name={fullName}
          size="100%"
          className="w-full h-full rounded-none border-none shadow-none"
        />

        {/* Pastille de présence en ligne (Haut Gauche) */}
        {isOnline && (
          <span
            className="absolute top-1 left-1 z-20 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full shadow-xs flex items-center justify-center"
            title={t('trombinoscope.onlineNow') || 'Actuellement en ligne'}
          >
            <span className="w-1 h-1 bg-white rounded-full animate-ping" />
          </span>
        )}

        {/* Micro-tampons inclinés pour les distinctions (Haut Droite) */}
        <div className="absolute top-1 right-1 z-20 flex items-center gap-0.5">
          {isMestre && (
            <span
              className="text-[10px] leading-none px-1 py-0.5 rounded bg-amber-400 text-stone-900 border border-stone-900 shadow-xs font-black rotate-[6deg]"
              title="Mestre"
            >
              👑
            </span>
          )}
          {!isMestre && isBureauOrCA && (
            <span
              className="text-[10px] leading-none px-1 py-0.5 rounded bg-blue-100 text-blue-900 border border-stone-900 shadow-xs font-black rotate-[-4deg]"
              title="Bureau / CA"
            >
              🏛️
            </span>
          )}
          {isDependent && (
            <span
              className="text-[10px] leading-none px-1 py-0.5 rounded bg-pink-100 text-pink-900 border border-stone-900 shadow-xs font-black rotate-[3deg]"
              title="Enfant"
            >
              👶
            </span>
          )}
        </div>

        {/* Badge Secours / Polyvalence en bas à gauche de la photo */}
        {isGhost && (
          <span
            className="absolute bottom-1 left-1 z-20 text-[7.5px] font-black uppercase tracking-wider bg-amber-100/95 text-amber-950 border border-amber-600/50 px-1 py-0.2 rounded shadow-xs"
            title={`Polyvalence (Principal : ${primaryInstrumentName || 'Autre'})`}
          >
            👻 Secours
          </span>
        )}

        {/* Bouton direct pour changer sa propre photo (Utilisateur connecté) */}
        {isCurrentUser && onEditPhoto && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditPhoto(photoURL);
            }}
            className="absolute bottom-1 right-1 z-25 w-5 h-5 rounded-full bg-encre-noire text-white border border-white/60 flex items-center justify-center text-[9px] hover:scale-110 active:scale-95 shadow-xs"
            title={t('trombinoscope.editPhotoFilter') || 'Modifier ma photo'}
          >
            📸
          </button>
        )}
      </div>

      {/* 2. Bandeau texte inférieur ultra-compact */}
      <div className="p-1 sm:p-1.5 text-center bg-[var(--color-cordel-fond,#f4ecd8)] border-t border-[var(--color-cordel-encre,#181716)] flex flex-col justify-center min-h-[34px] overflow-hidden">
        <span
          className="text-[11px] sm:text-xs font-black truncate text-[var(--color-cordel-encre,#181716)] leading-tight"
          title={fullName}
        >
          {initialName}
        </span>
        {surnom ? (
          <span className="text-[9px] italic truncate text-[var(--color-cordel-marron,#8b2a1a)] font-serif leading-none mt-0.5">
            "{surnom}"
          </span>
        ) : (
          <span className="text-[8px] uppercase tracking-wider truncate text-stone-500 font-bold leading-none mt-0.5">
            {role !== 'membre' ? role : (member.instrument || '')}
          </span>
        )}
      </div>

      {/* 3. Liseré inférieur subtil aux couleurs du pupitre */}
      <div
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: pupitreColor || 'var(--color-cordel-encre,#181716)' }}
      />
    </div>
  );
}

export default React.memo(MemberStampCard, (prev, next) => {
  return (
    prev.member.id === next.member.id &&
    prev.isOnline === next.isOnline &&
    prev.isCurrentUser === next.isCurrentUser &&
    prev.pupitreColor === next.pupitreColor &&
    prev.member.photoURL === next.member.photoURL &&
    prev.member.prenom === next.member.prenom &&
    prev.member.nom === next.member.nom &&
    prev.member.surnom === next.member.surnom &&
    prev.member.role === next.member.role &&
    prev.member.instrument === next.member.instrument &&
    prev.member.isGhost === next.member.isGhost &&
    prev.member.isDependent === next.member.isDependent
  );
});
