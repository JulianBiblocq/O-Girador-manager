/**
 * Bandeau de secours ultra-visible en haut de l'écran Onboarding (Nouveau Profil).
 * Permet à un membre existant projeté par erreur sur l'écran d'inscription (ex. nouvel appareil,
 * cache vierge ou mauvais compte Google/e-mail) de :
 * 1. Forcer le rechargement serveur de son profil (`getDocFromServer(doc(db, 'users', user.uid))`)
 * 2. Se déconnecter proprement (`signOut(auth)`) pour revenir sur `Login.jsx` en mode « Se connecter »
 */

import React, { useState } from 'react';
import { doc, getDocFromServer, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { reconcilePreExistingMember } from '../../services/memberService';

export default function OnboardingExistingMemberRescueBanner({
  user,
  groupId,
  onProfileRecovered,
  onSignOut
}) {
  const [reloading, setReloading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Relance la lecture serveur du profil Firestore (et la réconciliation par e-mail)
  const handleReloadProfile = async () => {
    if (!user?.uid || reloading) return;
    setReloading(true);
    setFeedbackMsg('');

    try {
      const userRef = doc(db, 'users', user.uid);
      let snap = null;
      try {
        snap = await getDocFromServer(userRef);
      } catch {
        snap = await getDoc(userRef);
      }

      if (snap && snap.exists()) {
        const data = { uid: snap.id, id: snap.id, ...snap.data() };
        if (onProfileRecovered) {
          onProfileRecovered(data);
        }
        return;
      }

      // Tentative de réconciliation par adresse e-mail si une fiche existe sous un autre ID
      if (user.email) {
        const reconciled = await reconcilePreExistingMember(user, groupId);
        if (reconciled) {
          if (onProfileRecovered) {
            onProfileRecovered(reconciled);
          }
          return;
        }
      }

      setFeedbackMsg(
        `Aucun profil existant trouvé pour ${user.email || 'ce compte'}. Si vous utilisiez une autre adresse ou un QR Code, cliquez sur « Changer de compte / Se reconnecter ».`
      );
    } catch (err) {
      console.warn('OnboardingRescueBanner - Erreur rechargement serveur :', err);
      setFeedbackMsg(
        'Impossible de joindre le serveur pour le moment. Vérifiez votre connexion ou réessayez.'
      );
    } finally {
      setReloading(false);
    }
  };

  // Déconnecte proprement la session et renvoie sur Login.jsx en mode « Se connecter »
  const handleSwitchAccount = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        await signOut(auth);
      }
      if (typeof window !== 'undefined') {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.pathname = '/login';
        cleanUrl.searchParams.delete('mode');
        cleanUrl.searchParams.delete('signup');
        cleanUrl.searchParams.delete('inscription');
        window.history.pushState({}, '', cleanUrl.pathname + cleanUrl.search);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (err) {
      console.error('OnboardingRescueBanner - Erreur déconnexion :', err);
      setSigningOut(false);
    }
  };

  return (
    <div className="mb-6 p-3.5 bg-[var(--cordel-paper,#fef3c7)] border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,8px)] shadow-[3px_3px_0px_0px_var(--theme-shadow-color,#181716)] text-left">
      <p className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-rouge,#8b2a1a)] mb-1 flex items-center gap-1.5">
        <span>🔑</span>
        <span>Vous avez déjà un compte sur un autre appareil ?</span>
      </p>
      {user?.email && (
        <p className="text-[11px] font-bold text-[var(--cordel-text,#181716)]/80 mb-2.5">
          Session actuelle : <span className="underline">{user.email}</span>
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleReloadProfile}
          disabled={reloading || signingOut}
          className="flex-1 py-2 px-3 bg-[var(--color-cordel-vert,#2d6a4f)] text-white font-black text-[11px] uppercase tracking-wider rounded border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <span>🔄</span>
          <span>{reloading ? 'Vérification...' : 'Recharger mon profil'}</span>
        </button>
        <button
          type="button"
          onClick={handleSwitchAccount}
          disabled={reloading || signingOut}
          className="flex-1 py-2 px-3 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white font-black text-[11px] uppercase tracking-wider rounded border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <span>🚪</span>
          <span>{signingOut ? 'Déconnexion...' : 'Changer de compte / Se reconnecter'}</span>
        </button>
      </div>
      {feedbackMsg && (
        <p className="mt-2.5 p-2 rounded bg-[var(--cordel-bg,#f4ecd8)] border border-[var(--color-cordel-ocre,#c05621)] text-[10.5px] font-bold text-[var(--color-cordel-rouge,#8b2a1a)] leading-snug">
          ⚠️ {feedbackMsg}
        </p>
      )}
    </div>
  );
}

