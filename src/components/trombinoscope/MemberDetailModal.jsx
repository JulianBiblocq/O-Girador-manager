import React, { useMemo } from 'react';
import XiloAvatar from '../XiloAvatar';
import MemberDetailCardContent from './MemberDetailCardContent';
import { filterUserAssignedTags } from '../../utils/tagUtils';
import {
  getEffectiveMemberTags,
  isDefaultMemberBadge,
  isInstitutionalTag,
  isPedagogicalTag,
  getCanonicalTagKey,
  resolveMemberLevel,
  resolvePedagogicalRoles
} from './trombinoscopeUtils';

/**
 * Modale de consultation détaillée d'un membre (Lightbox Cordel).
 * S'ouvre au clic sur une vignette de la planche de timbres du Trombinoscope.
 * Affiche l'ensemble des données du membre en respectant scrupuleusement
 * les paramètres de confidentialité (téléphone, anniversaire, adresse).
 */
export default function MemberDetailModal({
  member, isOpen, onClose, isOnline = false, isCurrentUser = false,
  fieldsConfig = {}, tagsDisponibles = [], majoriteFeminine = false,
  getPupitreName = (i) => i, onContactUser, onEditPhoto, t = (k) => k, tRole = (r) => r
}) {
  // Tags valides du membre calculés avec expansion automatique et déduplication canonique
  const validTags = useMemo(() => {
    if (!member) return [];
    const effectiveTags = getEffectiveMemberTags(member);
    const assignedFromConfig = filterUserAssignedTags(effectiveTags, tagsDisponibles);
    const seen = new Set();
    const resultList = [];
    const addTag = (tag) => {
      const key = getCanonicalTagKey(tag);
      if (key && !seen.has(key)) { seen.add(key); resultList.push(tag); }
    };
    assignedFromConfig.forEach(addTag);
    (Array.isArray(member.tags) ? member.tags : []).forEach(addTag);
    effectiveTags.forEach((tag) => { if (isInstitutionalTag(tag)) addTag(tag); });
    const { isMestreBatucada, isMestreDanse } = resolvePedagogicalRoles(member);

    return resultList.filter((tag) => {
      const rawTagId = typeof tag === 'object' ? (tag.id || tag.nom || tag.label || '') : String(tag);
      const rawTagLabel = typeof tag === 'object' ? (tag.nom || tag.label || tag.id || '') : String(tag);
      if (!isDefaultMemberBadge(rawTagId) && !isDefaultMemberBadge(rawTagLabel)) {
        if ((isMestreBatucada || isMestreDanse) && (isPedagogicalTag(rawTagId) || isPedagogicalTag(rawTagLabel))) {
          return false;
        }
        return true;
      }
      return false;
    });
  }, [member, tagsDisponibles]);

  if (!isOpen || !member) return null;

  const {
    prenom = '', nom = '', surnom = '', photoURL = null, role = 'membre', genre,
    telephone = '', dateNaissance = '', adresseVille = '', adresseCP = '',
    afficherTelephone, afficherDateNaissance, afficherVille, visibiliteAdresse,
    publierTelephone, publierDateNaissance, niveau = '', niveauDanse = '',
    niveauxParInstrument = {}, instrumentsJoues = [], instrument = '',
    isDependent = false, isGhost = false, primaryInstrumentName = ''
  } = member;

  const fullName = `${prenom} ${nom}`.trim() || 'Membre';

  // Confidentialité stricte des coordonnées
  const isPhoneAllowed = afficherTelephone !== undefined ? (afficherTelephone === true) : (publierTelephone === true);
  const showPhone = fieldsConfig?.telephone?.enabled !== false && Boolean(telephone) && isPhoneAllowed;

  const isBirthdateAllowed = afficherDateNaissance !== undefined ? (afficherDateNaissance === true) : (publierDateNaissance === true);
  const showBirthdate = fieldsConfig?.dateNaissance?.enabled !== false && Boolean(dateNaissance) && isBirthdateAllowed;

  const isAddressAllowed = afficherVille !== undefined ? (afficherVille === true) : (visibiliteAdresse !== 'masquee');
  const showCity = fieldsConfig?.adresse?.enabled !== false && isAddressAllowed;
  const displayCity = showCity ? (adresseVille?.trim() || adresseCP?.trim() || '') : '';

  // Instruments et pupitres
  const allInstruments = instrumentsJoues?.length > 0 ? instrumentsJoues : [instrument].filter(Boolean);
  const percussions = allInstruments.filter((i) => !String(i).toLowerCase().includes('danse'));
  const hasDanse = (niveauDanse && niveauDanse !== 'aucun') || allInstruments.some((i) => String(i).toLowerCase().includes('danse'));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-[var(--color-cordel-papier,#f4ecd8)] border-3 border-encre-noire rounded-[10px_14px_9px_12px] shadow-[6px_6px_0px_0px_#181716] overflow-hidden flex flex-col max-h-[92vh] mt-2 sm:mt-0">
        {/* En-tête */}
        <div className="p-3 bg-cordel-bg border-b-2 border-encre-noire flex items-start justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <span className="text-xs font-black uppercase tracking-wider text-encre-noire flex items-center gap-1.5 break-words">
              <span>🎭</span> {t('trombinoscope.memberCard') || 'Fiche Membre'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-[var(--color-cordel-wood,#8b2a1a)] hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title={t('common.close', 'Fermer')}
            aria-label={t('common.close', 'Fermer')}
          >
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        {/* Corps défilable */}
        <div className="p-4 overflow-y-auto flex flex-col items-center gap-3 text-center text-xs">
          {/* Portrait Xylogravure grand format */}
          <div className="relative group">
            <XiloAvatar src={photoURL} name={fullName} size={96} />
            {isOnline && (
              <span className="absolute bottom-0 right-0 z-20 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-xs" title="En ligne">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </span>
            )}
            {isCurrentUser && onEditPhoto && (
              <button
                type="button"
                onClick={() => { onEditPhoto(photoURL); onClose(); }}
                className="absolute -top-1 -right-1 z-30 w-7 h-7 rounded-full bg-encre-noire text-white border border-white flex items-center justify-center text-xs hover:scale-110 shadow-xs cursor-pointer"
                title="Modifier ma photo"
              >
                📸
              </button>
            )}
          </div>

          {/* Identité */}
          <div className="flex flex-col items-center">
            {isGhost && (
              <span className="bg-amber-100 text-amber-900 border border-dashed border-amber-600 text-[8.5px] font-black px-1.5 py-0.5 rounded uppercase mb-1">
                👻 Polyvalence • Principal : {primaryInstrumentName || 'Autre'}
              </span>
            )}
            <h3 className="text-base font-black text-encre-noire leading-tight">
              {prenom} {nom}
            </h3>
            {surnom && (
              <span className="text-xs italic text-[var(--color-cordel-marron,#8b2a1a)] font-serif mt-0.5">
                "{surnom}"
              </span>
            )}
            {/* Badges de responsabilité et niveau */}
            {(() => {
              const { isMestreBatucada, isMestreDanse, pedagogicalTitle } = resolvePedagogicalRoles(member);
              const translatedRole = role === 'mestre' ? null : tRole(role, genre);
              const isAlreadyInTags = validTags.some((t) => String(typeof t === 'object' ? (t.nom || t.label || t.id) : t).toLowerCase().trim() === String(translatedRole).toLowerCase().trim());
              const showRoleBadge = Boolean(translatedRole) && !isDefaultMemberBadge(role) && !isDefaultMemberBadge(translatedRole) && !isAlreadyInTags;
              const memberLevel = resolveMemberLevel(member);
              const hasPedagogicalBadge = (isMestreBatucada || isMestreDanse) && Boolean(pedagogicalTitle);
              if (!hasPedagogicalBadge && !showRoleBadge && !memberLevel && !isDependent) return null;

              return (
                <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                  {hasPedagogicalBadge && (
                    <span className="theme-stamp-badge bg-amber-400 text-stone-900 border-stone-900 text-[8px] font-black rotate-[-2deg] shadow-xs">
                      {isMestreDanse ? '💃👑 ' : '👑 '}{pedagogicalTitle}
                    </span>
                  )}
                  {showRoleBadge && <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] rotate-[-2deg]">{translatedRole}</span>}
                  {memberLevel && (
                    <span className={`theme-stamp-badge text-[8px] font-black ${
                      memberLevel === 'La référence' ? 'bg-amber-100 text-amber-900 border-amber-600' : 'bg-emerald-100 text-emerald-900 border-emerald-600'
                    }`}>
                      {memberLevel === 'La référence' ? '🏆 ' : '🌱 '}{memberLevel}
                    </span>
                  )}
                  {isDependent && <span className="theme-stamp-badge text-[8px] bg-pink-100 text-pink-900 border border-stone-900">👶 Enfant</span>}
                </div>
              );
            })()}
          </div>

          {/* Contenu détaillé (Musique, Coordonnées, Tags, Action) */}
          <MemberDetailCardContent
            member={member} percussions={percussions} hasDanse={hasDanse} niveauDanse={niveauDanse}
            niveauxParInstrument={niveauxParInstrument} niveau={niveau} getPupitreName={getPupitreName}
            showPhone={showPhone} telephone={telephone} showBirthdate={showBirthdate} dateNaissance={dateNaissance}
            displayCity={displayCity} validTags={validTags} majoriteFeminine={majoriteFeminine}
            tagsDisponibles={tagsDisponibles} isCurrentUser={isCurrentUser} onContactUser={onContactUser}
            onClose={onClose} t={t}
          />
        </div>
      </div>
    </div>
  );
}
