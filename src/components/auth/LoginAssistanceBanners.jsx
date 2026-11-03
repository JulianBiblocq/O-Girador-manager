/**
 * Bandeaux d'assistance contextuelle pour la page de connexion (Login.jsx).
 * Regroupe le bandeau d'aide WebView (WhatsApp, Instagram, Gmail) et l'encart
 * d'assistance intelligente zéro-friction (mot de passe oublié / première visite).
 */

import React from 'react';

/**
 * Bandeau affiché lorsque la page est ouverte dans un navigateur intégré (WhatsApp, Instagram, etc.).
 * Rappelle aux membres existants de se connecter ou d'ouvrir dans Chrome/Safari pour retrouver leur session.
 */
export function InAppBrowserHelpBanner({ onDismiss }) {
  return (
    <div className="p-3 mb-5 bg-[var(--cordel-paper,#fef3c7)] border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--color-cordel-ocre,#c05621)] rounded-[var(--theme-border-radius,6px)] text-left text-xs text-[var(--cordel-text,#181716)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] relative animate-fadeIn">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-1.5 right-2 opacity-60 hover:opacity-100 text-sm font-bold cursor-pointer"
        aria-label="Fermer cette notification"
      >
        ✕
      </button>
      <div className="flex items-start gap-2.5 pr-4">
        <span className="text-lg select-none">💡</span>
        <div className="space-y-1">
          <p className="font-extrabold text-[11px] uppercase tracking-wide">
            Ouverture depuis une messagerie (WhatsApp / Mail)
          </p>
          <p className="text-[10.5px] font-bold leading-relaxed text-[var(--color-cordel-ocre,#c05621)]">
            💡 Déjà membre ? Connecte-toi ci-dessous ou ouvre cette page dans Chrome / Safari (menu ⋮ en haut à droite) pour retrouver ta session habituelle.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Encart d'assistance intelligente en cas d'erreur d'identifiants ou d'adresse déjà enregistrée.
 */
export function AuthAssistanceBannerCard({
  banner,
  password,
  authLoading,
  resetConfirmationEmail,
  onClose,
  onQuickActivation,
  onInstantReset,
  onGoogleLogin
}) {
  if (!banner) return null;

  return (
    <div className="p-3 my-1 bg-[var(--cordel-paper,#fef3c7)] border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,6px)] text-left text-xs shadow-[3px_3px_0px_0px_var(--theme-shadow-color,#181716)] relative animate-fadeIn">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-1.5 right-2 opacity-60 hover:opacity-100 font-black text-sm cursor-pointer select-none"
        title="Fermer cette notification"
        aria-label="Fermer"
      >
        ✕
      </button>

      <div className="flex items-start gap-2.5 pr-4">
        <span className="text-xl select-none">
          {banner.type === 'confirmed_account_wrong_password' ? '🔑' : '💡'}
        </span>
        <div className="space-y-1.5 w-full">
          <p className="font-black text-[11px] uppercase tracking-wide text-[var(--color-cordel-rouge,#8b2a1a)]">
            {banner.type === 'email_already_exists'
              ? 'Votre adresse e-mail est déjà enregistrée !'
              : banner.type === 'confirmed_account_wrong_password'
              ? 'Ce compte existe déjà avec cette adresse'
              : 'Identifiants non reconnus pour cet e-mail'}
          </p>

          <p className="text-[11px] leading-relaxed font-medium opacity-90">
            {banner.type === 'email_already_exists' ? (
              <>
                Votre adresse e-mail est déjà enregistrée ! Si vous aviez utilisé Google, cliquez sur <strong>Continuer avec Google</strong>. Sinon, vérifiez votre mot de passe ou cliquez ci-dessous pour le réinitialiser.
              </>
            ) : banner.type === 'confirmed_account_wrong_password' ? (
              <>
                Votre compte existe bien pour <strong>{banner.email}</strong>, mais le mot de passe saisi ne correspond pas (ou vous vous étiez connecté avec Google).
              </>
            ) : (
              <>
                S'il s'agit de votre première visite (après avoir réglé sur HelloAsso ou pour rejoindre l'association) ou si vous avez oublié votre mot de passe :
              </>
            )}
          </p>

          <div className="flex flex-col gap-2 pt-1.5">
            {banner.type === 'invalid_credentials_or_new_user' && (
              <button
                type="button"
                onClick={() => onQuickActivation(banner.email, password)}
                disabled={authLoading}
                className="w-full py-2 px-2.5 bg-[var(--color-cordel-vert,#2d6a4f)] text-white font-black text-[11px] uppercase tracking-wider rounded border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✨</span>
                <span>C'est ma première visite : activer mon compte avec cet e-mail</span>
              </button>
            )}

            {resetConfirmationEmail === banner.email ? (
              <div className="p-2 bg-[var(--color-cordel-vert,#2d6a4f)]/10 border border-[var(--color-cordel-vert,#2d6a4f)] rounded text-[10px] font-bold text-[var(--color-cordel-vert,#2d6a4f)]">
                ✓ Un e-mail de réinitialisation sécurisé vient d'être envoyé à <strong>{banner.email}</strong>. Cliquez sur le lien reçu pour choisir votre mot de passe, puis revenez vous connecter.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onInstantReset(banner.email)}
                disabled={authLoading}
                className="w-full py-2 px-2.5 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white font-extrabold text-[11px] uppercase tracking-wider rounded border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🔑</span>
                <span>M'envoyer un e-mail de réinitialisation de mot de passe</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={authLoading}
              className="w-full py-2 px-2.5 bg-[var(--cordel-bg,#f4ecd8)] font-extrabold text-[11px] uppercase tracking-wider rounded border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🌐</span>
              <span>Continuer avec Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

