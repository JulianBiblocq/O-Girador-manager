import React from 'react';
import CordelCard from '../CordelCard';
import { XiloMandacaru } from '../XiloIcons';

/**
 * Normalise un libellé de rôle ou d'instrument pour détecter les doublons (ex: Mestre / Mestre).
 */
function normalizeBadgeLabel(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * En-tête d'accueil et carte de profil compacte de l'adhérent sur le tableau de bord.
 * Intègre directement les badges de rôle et de pupitre (dédupliqués si identiques) dans la CordelCard.
 */
export default function DashboardProfileHeader({
  user,
  profileData,
  t,
  tRole,
  isPresenceEnabled,
  onNavigateToView
}) {
  const roleLabel = tRole(profileData?.role || 'membre', profileData?.genre);
  const normalizedRole = normalizeBadgeLabel(roleLabel);
  const rawRoleKey = normalizeBadgeLabel(profileData?.role || '');

  const rawInstruments =
    profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 0
      ? profileData.instrumentsJoues
      : [profileData?.instrument].filter(Boolean);

  // Déduplication : n'afficher le badge instrument que s'il diffère du rôle principal (ex: évite 🏆 MESTRE + 🎵 MESTRE)
  const deduplicatedInstruments = rawInstruments.filter((inst) => {
    const normInst = normalizeBadgeLabel(inst);
    return normInst && normInst !== normalizedRole && normInst !== rawRoleKey;
  });

  const isExempted = Boolean(
    profileData?.paymentStatus === 'exempted' ||
    profileData?.paymentStatus === 'exempt' ||
    profileData?.isCotisationExoneree === true ||
    profileData?.cotisationStatus === 'exonere' ||
    (Array.isArray(profileData?.tags) &&
      profileData.tags.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes('exon')))
  );

  return (
    <>
      {/* Message de bienvenue sobre sans ligne de badges isolée */}
      <div className="text-left select-none pb-1 mt-1 border-b border-dashed border-cordel-master-dark/15">
        <h2 className="text-lg font-black text-cordel-wood flex items-center gap-1.5">
          <XiloMandacaru size={20} className="text-cordel-wood shrink-0" />
          <span>
            {t('dashboard.welcome') || 'Axé'}, {profileData?.prenom || tRole('batuqueiro', profileData?.genre)} !
          </span>
        </h2>
      </div>

      {/* Carte d'identité cliquable intégrant les badges de rôle, pupitre et cotisation */}
      <div
        onClick={() => onNavigateToView('profil')}
        className="cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
        title="Modifier mon profil / Paramètres"
      >
        <CordelCard variant="default" useExtremeBorder={true} className="py-3 px-4">
          <div className="flex items-center gap-3 text-left">
            <div className="relative shrink-0">
              {profileData?.photoURL || user?.photoURL ? (
                <img
                  src={profileData?.photoURL || user?.photoURL}
                  alt={`${profileData?.prenom || user?.displayName || ''} ${profileData?.nom || ''}`.trim() || 'Utilisateur'}
                  width={40}
                  height={40}
                  loading="eager"
                  className="w-10 h-10 rounded-[var(--theme-border-radius-sm)] border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] object-cover grayscale contrast-[130%] sepia-[40%] mix-blend-multiply brightness-[95%] select-none pointer-events-none"
                />
              ) : (
                <div className="w-10 h-10 rounded-[var(--theme-border-radius-sm)] border border-encre-noire bg-cordel-bg flex items-center justify-center font-black text-xs text-cordel-wood">
                  {profileData?.prenom ? profileData.prenom[0].toUpperCase() : '🥁'}
                </div>
              )}
              {isPresenceEnabled !== false && (
                <span
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center"
                  title="Vous êtes en ligne"
                >
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-encre-noire truncate flex items-center gap-1.5 flex-wrap">
                <span>
                  {profileData?.prenom} {profileData?.nom}
                </span>
                {profileData?.paymentStatus === 'paid' && (
                  <span className="theme-stamp-badge theme-stamp-badge-wood bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400 border-green-700/35 uppercase text-[7px] font-black tracking-wider px-1.5 py-0.2 shrink-0 scale-90 rotate-[-1deg]">
                    Payé
                  </span>
                )}
                {isExempted && (
                  <span className="theme-stamp-badge theme-stamp-badge-wood bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border-blue-700/35 uppercase text-[7px] font-black tracking-wider px-1.5 py-0.2 shrink-0 scale-90 rotate-[-1deg]">
                    Exonéré
                  </span>
                )}
              </h3>
              <p className="text-[9px] font-semibold text-cordel-master-dark/70 break-all select-all">
                {profileData?.email}
              </p>

              {/* Badges Rôle + Pupitre intégrés et dédupliqués */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="theme-stamp-badge theme-stamp-badge-wood rotate-[-1deg] text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 select-none">
                  🏆 {roleLabel}
                </span>
                {deduplicatedInstruments.map((inst) => (
                  <span
                    key={inst}
                    className="inline-block text-[8.5px] font-black uppercase tracking-wider bg-cordel-bg-light border border-encre-noire px-2 py-0.5 rounded-[var(--theme-border-radius-sm)] shadow-[1px_1px_0px_0px_#181716] select-none"
                  >
                    🎵 {inst}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CordelCard>
      </div>
    </>
  );
}
