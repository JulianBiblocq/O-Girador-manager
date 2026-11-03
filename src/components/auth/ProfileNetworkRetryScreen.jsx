/**
 * Utilitaires de garde du profil adhérent et écran léger d'attente réseau.
 * Empêche toute bascule accidentelle vers l'Onboarding lors d'une micro-coupure
 * ou d'une latence réseau mobile (> 3,5s).
 */

import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { canonicalizeGroupId } from '../../utils/tenantUtils';

/**
 * Vérifie dans localStorage si cet UID possède déjà un profil complet connu sur l'appareil.
 */
export function hasKnownCompletedProfile(uid) {
  if (!uid || typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(`girador_known_profile_${uid}`) === '1';
  } catch {
    return false;
  }
}

/**
 * Mémorise dans localStorage le fait que l'utilisateur dispose d'un profil complet.
 */
export function markKnownCompletedProfile(uid) {
  if (!uid || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`girador_known_profile_${uid}`, '1');
  } catch {}
}

/**
 * Évalue de manière souple si un profil existant est considéré comme complet.
 */
export function checkIsProfileComplete(profileData, isPrivilegedUser = false, uid = null) {
  if (isPrivilegedUser) return true;
  const targetUid = uid || profileData?.uid || profileData?.id;
  if (targetUid && hasKnownCompletedProfile(targetUid)) return true;
  if (!profileData) return false;

  const hasName = Boolean(
    (profileData.prenom || profileData.firstName) &&
    (profileData.nom || profileData.lastName)
  );
  const hasActivityOrRole = Boolean(
    profileData.instrument ||
    profileData.instrumentPrincipal ||
    (Array.isArray(profileData.instrumentsJoues) && profileData.instrumentsJoues.length > 0) ||
    profileData.pratiqueDanse === true ||
    profileData.role
  );

  return (
    profileData.onboardingCompleted === true ||
    profileData.isNew === false ||
    Boolean(profileData.telephone && (profileData.adresseRue || profileData.adresse)) ||
    (hasName && hasActivityOrRole)
  );
}

/**
 * Écran léger d'attente réseau affiché si Firestore met plus de 3,5s à répondre
 * alors que l'existence du profil n'est pas encore formellement démentie.
 */
export default function ProfileNetworkRetryScreen({
  user,
  onRetry,
  onProfileRecovered,
  onSignOut
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(false);

  const handleManualRetry = async () => {
    if (!user?.uid || retrying) return;
    setRetrying(true);
    setRetryError(false);
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        const canonicalGroup = canonicalizeGroupId(data.groupId);
        markKnownCompletedProfile(user.uid);
        if (onProfileRecovered) {
          onProfileRecovered({
            uid: snap.id,
            id: snap.id,
            ...data,
            groupId: canonicalGroup || data.groupId || null
          });
        }
        return;
      }
      if (onRetry) onRetry();
    } catch (err) {
      console.warn('ProfileNetworkRetryScreen - Réseau toujours lent ou indisponible :', err);
      setRetryError(true);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-[var(--cordel-bg)] text-[var(--cordel-text)]">
      <div className="max-w-sm w-full p-6 bg-[var(--cordel-paper,#fffdf8)] border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,8px)] shadow-[4px_4px_0px_0px_var(--theme-shadow-color,#181716)] text-center space-y-4">
        <div className="text-3xl select-none animate-pulse">📡</div>
        <h2 className="text-sm font-black uppercase tracking-wider">
          Connexion en cours au serveur...
        </h2>
        <p className="text-xs font-medium opacity-80 leading-relaxed">
          La récupération de votre profil prend un peu plus de temps que prévu (réseau mobile lent ou micro-coupure).
        </p>
        {retryError && (
          <p className="text-[11px] font-bold text-[var(--color-cordel-ocre,#c05621)]">
            Le serveur ne répond pas encore. Vérifiez votre réception réseau puis réessayez.
          </p>
        )}
        <div className="pt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleManualRetry}
            disabled={retrying}
            className="w-full py-2.5 px-4 bg-[var(--color-cordel-vert,#2d6a4f)] text-white font-black text-xs uppercase tracking-wider border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,6px)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] active:translate-y-0.5 cursor-pointer disabled:opacity-60"
          >
            {retrying ? '⏳ Nouvelle tentative...' : '🔄 Réessayer'}
          </button>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-[11px] font-bold opacity-60 hover:opacity-100 underline cursor-pointer py-1"
            >
              Changer de compte
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
