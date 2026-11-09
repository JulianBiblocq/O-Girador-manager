/**
 * Sous-composants modulaires d'en-tête et d'actions permanentes pour l'écran Login.jsx :
 * 1. Bascule permanente ultra-visible « 🔑 Se connecter (Déjà membre) » / « ✍️ Créer mon compte »
 * 2. Bouton « 🌐 Continuer avec Google » avec secours WebView (redirection directe ou copie de lien)
 * 3. Bouton permanent « 📱 Se connecter avec un QR Code (depuis mon téléphone) »
 */

import React, { useState } from 'react';
import CordelButton from '../CordelButton';

/**
 * Onglets segmentés permanents affichés en haut de la carte de connexion.
 */
export function LoginModeToggleTabs({
  isSignUpMode,
  isQrLoginMode,
  onSelectSignIn,
  onSelectSignUp
}) {
  return (
    <div className="flex w-full mb-5 border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] rounded-[var(--theme-border-radius,8px)] p-1 bg-[var(--cordel-paper,#fef3c7)]/60 shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)]">
      <button
        type="button"
        onClick={onSelectSignIn}
        className={`flex-1 py-2.5 px-2 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
          !isSignUpMode && !isQrLoginMode
            ? 'bg-[var(--color-cordel-rouge,#8b2a1a)] text-white shadow-[1px_1px_0px_0px_var(--theme-shadow-color,#181716)]'
            : 'text-[var(--color-cordel-rouge,#8b2a1a)]/85 hover:text-[var(--color-cordel-rouge,#8b2a1a)] hover:bg-[var(--cordel-paper,#fef3c7)]'
        }`}
      >
        <span>🔑</span>
        <span>Se connecter (Déjà membre)</span>
      </button>
      <button
        type="button"
        onClick={onSelectSignUp}
        className={`flex-1 py-2.5 px-2 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
          isSignUpMode && !isQrLoginMode
            ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-[1px_1px_0px_0px_var(--theme-shadow-color,#181716)]'
            : 'text-[var(--color-cordel-rouge,#8b2a1a)]/85 hover:text-[var(--color-cordel-rouge,#8b2a1a)] hover:bg-[var(--cordel-paper,#fef3c7)]'
        }`}
      >
        <span>✍️</span>
        <span>Créer mon compte</span>
      </button>
    </div>
  );
}

/**
 * Bouton « Continuer avec Google » + encart de secours WebView (redirection ou copie du lien pour Chrome/Safari).
 */
export function LoginGoogleSection({
  isSignUpMode,
  authLoading,
  googleNotice,
  onGooglePopupLogin,
  onGoogleRedirectLogin
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLoginUrl = async () => {
    try {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('mode');
      cleanUrl.searchParams.delete('signup');
      cleanUrl.searchParams.delete('inscription');
      await navigator.clipboard.writeText(cleanUrl.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // Ignorer si le presse-papiers est restreint
    }
  };

  return (
    <div className="w-full">
      <CordelButton
        type="button"
        variant="ocre"
        useExtremeBorder={true}
        onClick={onGooglePopupLogin}
        disabled={authLoading}
        className="w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
      >
        <span>🌐</span>
        <span>{isSignUpMode ? 'Continuer avec Google (Inscription)' : 'Continuer avec Google'}</span>
      </CordelButton>

      {googleNotice && (
        <div
          className={`p-3 my-2.5 rounded-[var(--theme-border-radius,6px)] text-left text-xs border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] animate-fadeIn ${
            googleNotice.type === 'warning'
              ? 'bg-[var(--cordel-paper,#fef2f2)] border-[var(--color-cordel-rouge,#8b2a1a)] text-[var(--cordel-text,#181716)]'
              : 'bg-[var(--cordel-paper,#fef3c7)] border-[var(--color-cordel-ocre,#c05621)] text-[var(--cordel-text,#181716)]'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-base select-none">{googleNotice.type === 'warning' ? '🚫' : '💡'}</span>
            <div className="space-y-1.5 w-full">
              <p className="font-extrabold text-[11px] uppercase tracking-wide">
                {googleNotice.title}
              </p>
              <p className="text-[10.5px] leading-relaxed opacity-90">
                {googleNotice.message}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {onGoogleRedirectLogin && (
                  <button
                    type="button"
                    onClick={onGoogleRedirectLogin}
                    disabled={authLoading}
                    className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded border border-[var(--theme-border-color,#181716)] bg-[var(--color-cordel-ocre,#c05621)] text-white cursor-pointer"
                  >
                    🔄 Tenter la redirection Google
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyLoginUrl}
                  className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded border border-[var(--theme-border-color,#181716)] bg-[var(--cordel-bg,#f4ecd8)] text-[var(--cordel-text,#181716)] cursor-pointer"
                >
                  {copiedLink ? '✅ Lien copié pour Chrome/Safari !' : '📋 Copier le lien pour Chrome / Safari'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bouton ultra-visible d'accès à la connexion par QR Code depuis un autre appareil.
 */
export function LoginQrCodeActionButton({ onOpenQrLogin }) {
  return (
    <div className="w-full mt-3 pt-3 border-t border-dashed border-[var(--theme-border-color,#181716)]/25">
      <button
        type="button"
        onClick={onOpenQrLogin}
        className="w-full py-2.5 px-3 bg-[var(--cordel-paper,#fef3c7)] hover:bg-[var(--cordel-bg,#f4ecd8)] text-[var(--cordel-text,#181716)] font-black text-[11px] uppercase tracking-wider rounded-[var(--theme-border-radius,6px)] border-[var(--theme-border-width,2px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border-color,#181716)] shadow-[2px_2px_0px_0px_var(--theme-shadow-color,#181716)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <span>📱</span>
        <span>Se connecter avec un QR Code (depuis mon téléphone)</span>
      </button>
    </div>
  );
}

