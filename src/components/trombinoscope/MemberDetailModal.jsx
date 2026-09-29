import React, { useMemo } from 'react';
import XiloAvatar from '../XiloAvatar';
import MemberDetailCardContent from './MemberDetailCardContent';
import { filterUserAssignedTags } from '../../utils/tagUtils';

/**
 * Modale de consultation détaillée d'un membre (Lightbox Cordel).
 * S'ouvre au clic sur une vignette de la planche de timbres du Trombinoscope.
 * Affiche l'ensemble des données du membre en respectant scrupuleusement
 * les paramètres de confidentialité (téléphone, anniversaire, adresse).
 */
export default function MemberDetailModal({
  member,
  isOpen,
  onClose,
  isOnline = false,
  isCurrentUser = false,
  fieldsConfig = {},
  tagsDisponibles = [],
  majoriteFeminine = false,
  getPupitreName = (i) => i,
  onContactUser,
  onEditPhoto,
  t = (key) => key,
  tRole = (r) => r
}) {
  const memberTags = member?.tags || [];
  // Tags valides du membre calculés inconditionnellement
  const validTags = useMemo(() => filterUserAssignedTags(memberTags, tagsDisponibles), [memberTags, tagsDisponibles]);

  if (!isOpen || !member) return null;

  const {
    prenom = '',
    nom = '',
    surnom = '',
    photoURL = null,
    role = 'membre',
    genre,
    telephone = '',
    dateNaissance = '',
    adresseVille = '',
    adresseCP = '',
    afficherTelephone,
    afficherDateNaissance,
    afficherVille,
    visibiliteAdresse,
    publierTelephone,
    publierDateNaissance,
    niveau = '',
    niveauDanse = '',
    niveauxParInstrument = {},
    instrumentsJoues = [],
    instrument = '',
    isDependent = false,
    isGhost = false,
    primaryInstrumentName = ''
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
      <div className="w-full max-w-sm bg-[var(--color-cordel-papier,#f4ecd8)] border-3 border-encre-noire rounded-[10px_14px_9px_12px] shadow-[6px_6px_0px_0px_#181716] overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="px-3 py-2 bg-cordel-bg border-b-2 border-encre-noire flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-encre-noire flex items-center gap-1.5">
            <span>🎭</span> {t('trombinoscope.memberCard') || 'Fiche Membre'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded border border-encre-noire bg-white flex items-center justify-center font-black text-xs hover:bg-stone-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Corps défilable */}
        <div className="p-4 overflow-y-auto flex flex-col items-center gap-3 text-center text-xs">
          {/* Portrait Xylogravure grand format */}
          <div className="relative group">
            <XiloAvatar src={photoURL} name={fullName} size={96} />
            {isOnline && (
              <span
                className="absolute bottom-0 right-0 z-20 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-xs"
                title="En ligne"
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </span>
            )}
            {isCurrentUser && onEditPhoto && (
              <button
                type="button"
                onClick={() => {
                  onEditPhoto(photoURL);
                  onClose();
                }}
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
            <div className="flex items-center gap-1 mt-1">
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] rotate-[-2deg]">
                {tRole(role, genre)}
              </span>
              {isDependent && (
                <span className="theme-stamp-badge text-[8px] bg-pink-100 text-pink-900 border border-stone-900">
                  👶 Enfant
                </span>
              )}
            </div>
          </div>

          {/* Contenu détaillé (Musique, Coordonnées, Tags, Action) */}
          <MemberDetailCardContent
            member={member}
            percussions={percussions}
            hasDanse={hasDanse}
            niveauDanse={niveauDanse}
            niveauxParInstrument={niveauxParInstrument}
            niveau={niveau}
            getPupitreName={getPupitreName}
            showPhone={showPhone}
            telephone={telephone}
            showBirthdate={showBirthdate}
            dateNaissance={dateNaissance}
            displayCity={displayCity}
            validTags={validTags}
            majoriteFeminine={majoriteFeminine}
            tagsDisponibles={tagsDisponibles}
            isCurrentUser={isCurrentUser}
            onContactUser={onContactUser}
            onClose={onClose}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
