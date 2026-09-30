import React from 'react';
import XiloAvatar from '../XiloAvatar';
import {
  formatBirthdayShort,
  isDefaultMemberBadge,
  resolveMemberInstrumentSubtitle,
  resolveMemberLevel,
  resolvePedagogicalRoles
} from './trombinoscopeUtils';

/**
 * Vignette timbre ultra-dense pour la planche du Trombinoscope (Mosaïque dense).
 * Format timbre xylographique optimisé pour afficher jusqu'à 8 membres par ligne sur grand écran
 * et 3 membres de front sur smartphone. Hauteur 100% harmonisée avec alignement rigoureux.
 */
function MemberStampCard({
  member, isOnline = false, isCurrentUser = false, pupitreColor = '#181716', onClick, onEditPhoto, t = (key) => key
}) {
  const { prenom = '', nom = '', surnom = '', photoURL = null, role = 'membre', isDependent = false, isGhost = false, primaryInstrumentName = '' } = member;

  const fullName = `${prenom} ${nom}`.trim() || 'Membre';
  const initialName = `${prenom} ${nom ? `${nom[0].toUpperCase()}.` : ''}`.trim();

  // Pupitre / instrument officiel unifié sous la photo
  const instrumentSubtitle = resolveMemberInstrumentSubtitle(member);
  const memberLevel = resolveMemberLevel(member);

  // Confidentialité stricte de l'anniversaire : consentement explicite requis
  const isBirthdateConsent = Boolean(member.afficherDateNaissance ?? member.publierDateNaissance);
  const formattedBirthday = (isBirthdateConsent && member.dateNaissance)
    ? formatBirthdayShort(member.dateNaissance)
    : null;

  // Distinctions visuelles sous forme de micro-tampons d'encre
  const { isMestreBatucada, isMestreDanse, pedagogicalTitle } = resolvePedagogicalRoles(member);
  const memberTags = Array.isArray(member.tags) ? member.tags : [];
  const isBureauOrCA = ['bureau', 'ca', 'admin', 'super-admin', 'president', 'tresorier', 'secretaire'].includes(role) ||
    memberTags.some((tg) => /bureau|ca|president|président|tresorier|trésorier/i.test(String(tg).replace(/\./g, '')));

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
      className={`group relative h-full flex flex-col justify-between rounded-md border-2 border-[var(--color-cordel-encre,#181716)] bg-[var(--color-cordel-kraft-sombre,#e2d6b5)] shadow-[2px_2px_0px_0px_#181716] overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 select-none ${
        isGhost ? 'opacity-65 hover:opacity-100 grayscale-[0.25] hover:grayscale-0' : ''
      }`}
      title={`${fullName}${surnom ? ` ("${surnom}")` : ''} - Cliquer pour ouvrir la fiche`}
    >
      {/* 1. Zone Photo (Aspect Square dense verrouillé) */}
      {/* aspect-square w-full overflow-hidden bg-neutral-900 */}
      <div className="aspect-square w-full shrink-0 overflow-hidden bg-neutral-900 relative flex items-center justify-center">
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
          {isMestreBatucada && (
            <span className="text-[10px] leading-none px-1 py-0.5 rounded bg-amber-400 text-stone-900 border border-stone-900 shadow-xs font-black rotate-[6deg]" title={pedagogicalTitle || "Mestre"}>👑</span>
          )}
          {isMestreDanse && (
            <span className="text-[10px] leading-none px-1 py-0.5 rounded bg-amber-400 text-stone-900 border border-stone-900 shadow-xs font-black rotate-[6deg]" title={pedagogicalTitle || "Mestra de danse"}>💃👑</span>
          )}
          {!isMestreBatucada && !isMestreDanse && isBureauOrCA && (
            <span className="text-[10px] leading-none px-1 py-0.5 rounded bg-blue-100 text-blue-900 border border-stone-900 shadow-xs font-black rotate-[-4deg]" title="Bureau / CA">🏛️</span>
          )}
          {member.isLeadSinger && (
            <span className="text-[10px] leading-none px-1 py-0.5 rounded bg-amber-100 text-amber-900 border border-stone-900 shadow-xs font-black rotate-[-3deg]" title="Soliste / Chanteur référent">🎤</span>
          )}
          {isDependent && (
            <span className="text-[10px] leading-none px-1 py-0.5 rounded bg-pink-100 text-pink-900 border border-stone-900 shadow-xs font-black rotate-[3deg]" title="Enfant">👶</span>
          )}
        </div>

        {/* Badge Secours / Polyvalence en bas à gauche de la photo */}
        {isGhost && (
          <span className="absolute bottom-1 left-1 z-20 text-[7.5px] font-black uppercase tracking-wider bg-amber-100/95 text-amber-950 border border-amber-600/50 px-1 py-0.2 rounded shadow-xs" title={`Polyvalence (Principal : ${primaryInstrumentName || 'Autre'})`}>
            👻 Secours
          </span>
        )}

        {/* Bouton direct pour changer sa propre photo (Utilisateur connecté) */}
        {isCurrentUser && onEditPhoto && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEditPhoto(photoURL); }}
            className="absolute bottom-1 right-1 z-25 w-5 h-5 rounded-full bg-encre-noire text-white border border-white/60 flex items-center justify-center text-[9px] hover:scale-110 active:scale-95 shadow-xs"
            title={t('trombinoscope.editPhotoFilter') || 'Modifier ma photo'}
          >
            📸
          </button>
        )}
      </div>

      {/* 2. Cartouche texte inférieur avec hauteur flex unifiée et alignement strict */}
      <div className="flex-1 flex flex-col justify-between p-2 sm:p-2.5 text-center bg-[var(--color-cordel-fond,#f4ecd8)] border-t border-[var(--color-cordel-encre,#181716)]">
        {/* Bloc Identité (Haut) */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          <span className="text-[11px] sm:text-xs font-black truncate max-w-full text-[var(--color-cordel-encre,#181716)] leading-tight" title={fullName}>
            {initialName}
          </span>
          {surnom && (
            <span className="text-[8.5px] italic truncate max-w-full text-[var(--color-cordel-marron,#8b2a1a)] font-serif leading-none">
              "{surnom}"
            </span>
          )}
          {instrumentSubtitle && (
            <span className="text-[8px] uppercase tracking-wider truncate max-w-full text-stone-600 dark:text-stone-300 font-bold leading-none" title={instrumentSubtitle}>
              {instrumentSubtitle}
            </span>
          )}
        </div>

        {/* Bloc Statuts & Extras (Bas) calé avec min-height pour absorber les variations */}
        <div className="flex flex-col items-center justify-end gap-0.5 w-full mt-auto pt-1 min-h-[38px] sm:min-h-[42px]">
          {memberLevel && (
            <span className={`text-[7.5px] font-black uppercase px-1 py-0.2 rounded leading-none truncate max-w-[95px] mx-auto border ${memberLevel === 'La référence' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-400'}`} title={`Niveau : ${memberLevel}`}>
              {memberLevel === 'La référence' ? '🏆 ' : '🌱 '}{memberLevel}
            </span>
          )}

          {formattedBirthday && (
            <span className="text-[7.5px] sm:text-[8px] font-bold text-stone-600 dark:text-stone-300 leading-none truncate flex items-center justify-center gap-0.5" title={`Anniversaire : ${formattedBirthday}`}>
              <span>🎂</span> {formattedBirthday}
            </span>
          )}

          {Array.isArray(member.secondaryBadges) && member.secondaryBadges.length > 0 && (
            <div className="flex flex-wrap justify-center items-center gap-0.5 mt-0.5">
              {member.secondaryBadges
                .filter((badge) => !isDefaultMemberBadge(badge))
                .slice(0, 3)
                .map((badge, idx) => (
                  <span key={idx} className="text-[7.5px] font-black uppercase px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-stone-700 dark:text-stone-300 border border-stone-400/40 leading-none truncate max-w-[85px]" title={badge}>
                    {badge}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Liseré inférieur subtil aux couleurs du pupitre */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: pupitreColor || 'var(--color-cordel-encre,#181716)' }} />
    </div>
  );
}

const arePropsEqual = (p, n) => (
  p.member.id === n.member.id && p.isOnline === n.isOnline && p.isCurrentUser === n.isCurrentUser &&
  p.pupitreColor === n.pupitreColor && p.member.photoURL === n.member.photoURL &&
  p.member.prenom === n.member.prenom && p.member.nom === n.member.nom && p.member.surnom === n.member.surnom &&
  p.member.role === n.member.role && p.member.instrument === n.member.instrument &&
  p.member.instrumentPrincipal === n.member.instrumentPrincipal &&
  p.member.primaryPupitreId === n.member.primaryPupitreId &&
  p.member.niveau === n.member.niveau && p.member.level === n.member.level &&
  p.member.isLeadSinger === n.member.isLeadSinger && p.member.isDependent === n.member.isDependent &&
  p.member.dateNaissance === n.member.dateNaissance &&
  p.member.afficherDateNaissance === n.member.afficherDateNaissance &&
  JSON.stringify(p.member.tags) === JSON.stringify(n.member.tags) &&
  JSON.stringify(p.member.secondaryBadges) === JSON.stringify(n.member.secondaryBadges)
);

export default React.memo(MemberStampCard, arePropsEqual);
