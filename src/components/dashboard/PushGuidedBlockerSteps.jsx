/**
 * Sous-composant d'étapes visuelles guidées affiché directement dans `PushActivationModal`
 * lorsque l'appareil présente un blocage environnemental (WhatsApp, iOS hors écran d'accueil, ou permission refusée).
 */

import React, { useState } from 'react';

export default function PushGuidedBlockerSteps({ env }) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopySetupLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('setup-push', '1');
      await navigator.clipboard.writeText(url.toString());
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch { /* Ignorer */ }
  };

  if (env?.isInAppBrowser) {
    return (
      <div className="space-y-2.5 text-left">
        <div className="p-2.5 bg-[var(--color-cordel-ocre,#c05621)]/15 border border-[var(--color-cordel-ocre,#c05621)] rounded-[var(--theme-border-radius,6px)] text-xs font-bold">
          💬 Tu as ouvert ce lien dans le navigateur interne de <strong>WhatsApp / réseau social</strong>, qui bloque les notifications.
        </div>
        <div className="p-3 bg-[var(--cordel-bg,#f4ecd8)] border border-[var(--theme-border-color,#181716)]/25 rounded-[var(--theme-border-radius,6px)] space-y-1.5 text-xs">
          <p className="font-black uppercase text-[11px] text-[var(--color-cordel-rouge,#8b2a1a)]">
            Étape 1 — Toucher le menu en haut à droite
          </p>
          <p className="font-medium">
            Touche les trois points <strong>⋮</strong> (Android) ou la boussole <strong>🧭</strong> (iPhone) tout en haut ou en bas à droite de ton écran.
          </p>
        </div>
        <div className="p-3 bg-[var(--cordel-bg,#f4ecd8)] border border-[var(--theme-border-color,#181716)]/25 rounded-[var(--theme-border-radius,6px)] space-y-1.5 text-xs">
          <p className="font-black uppercase text-[11px] text-[var(--color-cordel-rouge,#8b2a1a)]">
            Étape 2 — Ouvrir dans Chrome ou Safari
          </p>
          <p className="font-medium">
            Choisis <strong>« Ouvrir dans Chrome »</strong> ou <strong>« Ouvrir dans Safari »</strong>, puis touche le bouton d&apos;activation.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopySetupLink}
          className="w-full py-2 px-3 text-[11px] font-black uppercase bg-[var(--cordel-paper,#fffdf8)] border border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,6px)] cursor-pointer"
        >
          {copiedUrl ? '✅ Lien copié ! Colle-le dans Chrome ou Safari' : '📋 Copier le lien pour Chrome / Safari'}
        </button>
      </div>
    );
  }

  if (env?.isIosNotStandalone) {
    return (
      <div className="space-y-2.5 text-left">
        <div className="p-2.5 bg-[var(--color-cordel-ocre,#c05621)]/15 border border-[var(--color-cordel-ocre,#c05621)] rounded-[var(--theme-border-radius,6px)] text-xs font-bold">
          🍎 Sur <strong>iPhone / iPad</strong>, Apple exige que l&apos;application soit sur ton écran d&apos;accueil pour recevoir les alertes.
        </div>
        <div className="p-3 bg-[var(--cordel-bg,#f4ecd8)] border border-[var(--theme-border-color,#181716)]/25 rounded-[var(--theme-border-radius,6px)] space-y-1.5 text-xs">
          <p className="font-black uppercase text-[11px] text-[var(--color-cordel-rouge,#8b2a1a)]">
            Étape 1 — Toucher le bouton Partager [↑]
          </p>
          <p className="font-medium">
            Dans Safari, touche l&apos;icône <strong>Partager [↑]</strong> en bas de l&apos;écran, puis choisis <strong>« Sur l&apos;écran d&apos;accueil ➕ »</strong> et valide sur <strong>Ajouter</strong>.
          </p>
        </div>
        <div className="p-3 bg-[var(--cordel-bg,#f4ecd8)] border border-[var(--theme-border-color,#181716)]/25 rounded-[var(--theme-border-radius,6px)] space-y-1.5 text-xs">
          <p className="font-black uppercase text-[11px] text-[var(--color-cordel-rouge,#8b2a1a)]">
            Étape 2 — Ouvrir l&apos;application depuis ton écran d&apos;accueil
          </p>
          <p className="font-medium">
            Retourne sur ton écran d&apos;accueil, ouvre la nouvelle icône <strong>Organizador</strong> et touche <strong>« Activer les notifications »</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 text-left">
      <div className="p-2.5 bg-[var(--color-cordel-rouge,#8b2a1a)]/15 border border-[var(--color-cordel-rouge,#8b2a1a)] rounded-[var(--theme-border-radius,6px)] text-xs font-bold">
        🚫 Les notifications sont actuellement <strong>bloquées</strong> dans les réglages de ton navigateur.
      </div>
      <div className="p-3 bg-[var(--cordel-bg,#f4ecd8)] border border-[var(--theme-border-color,#181716)]/25 rounded-[var(--theme-border-radius,6px)] space-y-1.5 text-xs">
        <p className="font-black uppercase text-[11px] text-[var(--color-cordel-rouge,#8b2a1a)]">
          Comment autoriser en 2 clics :
        </p>
        <p className="font-medium">
          1. Touche l&apos;icône <strong>🔒 cadenas</strong> (ou l&apos;icône de réglages) juste à gauche de l&apos;adresse web <code>organizador.o-girador.com</code>.<br />
          2. Passe <strong>Notifications</strong> sur <strong>« Autoriser »</strong>, puis recharge la page.
        </p>
      </div>
    </div>
  );
}

