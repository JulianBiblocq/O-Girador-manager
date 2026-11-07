import React from 'react';
import MemberStampCard from './MemberStampCard';
import { FIVE_PUPITRES } from './trombinoscopeUtils';

/**
 * Grille modulaire des sections du Trombinoscope :
 * 1. Ligne « Mestre » dédiée en tête
 * 2. Les 5 pupitres SaaS ordonnés (Alfaias, Caixas, Gonguê, Sementes, Danse)
 * 3. Section Renforts & Musiciens extérieurs (si présents)
 * 4. Section En cours d'orientation (si présents)
 */
export default function TrombinoscopeSectionsGrid({
  regularByPupitre,
  renfortsList,
  hasRenforts,
  filterInstrument,
  user,
  canSeePushStatus,
  getColorForInstrument,
  onSelectMember,
  onEditPhoto,
  t
}) {
  const mestreMembers = regularByPupitre.mestre || [];
  const orientationMembers = regularByPupitre['en-orientation'] || [];

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Section dédiée « Mestre » en tête du Trombinoscope */}
      {mestreMembers.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="border-b border-dashed border-cordel-master-dark/20 pb-2 text-left mt-2 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-marron,#8b2a1a)] flex items-center gap-1.5 select-none">
              <span>👑</span>
              <span>Mestre</span>
              <span className="text-[11px] font-bold text-stone-500 font-sans tracking-normal ml-0.5">
                ({mestreMembers.length})
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3 items-stretch">
            {mestreMembers.map((member) => (
              <MemberStampCard
                key={member.id}
                member={member}
                isOnline={member.isOnline === true}
                isCurrentUser={Boolean(user?.uid && member.id === user.uid)}
                canSeePushStatus={canSeePushStatus}
                pupitreColor="var(--color-cordel-marron, #8b2a1a)"
                onClick={onSelectMember}
                onEditPhoto={onEditPhoto}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Les 5 Pupitres SaaS ordonnés */}
      {FIVE_PUPITRES.map((sec) => {
        const sectionMembers = regularByPupitre[sec.id] || [];
        if (sectionMembers.length === 0) return null;

        return (
          <div key={sec.id} className="flex flex-col gap-4">
            <div className="border-b border-dashed border-cordel-master-dark/20 pb-2 text-left mt-2 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-marron,#8b2a1a)] flex items-center gap-1.5 select-none">
                <img
                  src={sec.icon}
                  alt={sec.label}
                  loading="lazy"
                  decoding="async"
                  className="w-4 h-4 object-contain inline-block dark:invert"
                />
                <span>{sec.label}</span>
                <span className="text-[11px] font-bold text-stone-500 font-sans tracking-normal ml-0.5">
                  ({sectionMembers.length})
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3 items-stretch">
              {sectionMembers.map((member) => (
                <MemberStampCard
                  key={member.id}
                  member={member}
                  isOnline={member.isOnline === true}
                  isCurrentUser={Boolean(user?.uid && member.id === user.uid)}
                  canSeePushStatus={canSeePushStatus}
                  pupitreColor={getColorForInstrument(sec.colorKey, 'solid') || '#181716'}
                  onClick={onSelectMember}
                  onEditPhoto={onEditPhoto}
                  t={t}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* 3. Section isolée pour les renforts & musiciens extérieurs */}
      {hasRenforts && renfortsList.length > 0 && (
        <div className="flex flex-col gap-4 mt-2 pt-6 border-t-2 border-dashed border-cordel-master-dark/30">
          <div className="border-b border-dashed border-cordel-master-dark/20 pb-2 text-left flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-marron,#8b2a1a)] flex items-center gap-1.5 select-none">
              <span>🎪 Renforts &amp; Musiciens extérieurs</span>
              <span className="text-[11px] font-bold text-stone-500 font-sans tracking-normal ml-0.5">
                ({renfortsList.length})
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3 items-stretch">
            {renfortsList.map((member) => (
              <MemberStampCard
                key={member.id}
                member={member}
                isOnline={member.isOnline === true}
                isCurrentUser={Boolean(user?.uid && member.id === user.uid)}
                canSeePushStatus={canSeePushStatus}
                pupitreColor={getColorForInstrument(member.instrumentPrincipal || member.instrument || 'Renfort', 'solid') || '#181716'}
                onClick={onSelectMember}
                onEditPhoto={onEditPhoto}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. Section dédiée pour les membres en cours d'orientation */}
      {orientationMembers.length > 0 && (filterInstrument === 'all' || filterInstrument === 'en-orientation') && (
        <div className="flex flex-col gap-4 mt-2 pt-6 border-t-2 border-dashed border-cordel-master-dark/30">
          <div className="border-b border-dashed border-cordel-master-dark/20 pb-2 text-left flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-marron,#8b2a1a)] flex items-center gap-1.5 select-none">
              <span>🌱 En cours d&apos;orientation</span>
              <span className="text-[11px] font-bold text-stone-500 font-sans tracking-normal ml-0.5">
                ({orientationMembers.length})
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3 items-stretch">
            {orientationMembers.map((member) => (
              <MemberStampCard
                key={member.id}
                member={member}
                isOnline={member.isOnline === true}
                isCurrentUser={Boolean(user?.uid && member.id === user.uid)}
                canSeePushStatus={canSeePushStatus}
                pupitreColor="var(--color-cordel-ocre, #c05621)"
                onClick={onSelectMember}
                onEditPhoto={onEditPhoto}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

