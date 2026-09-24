import React, { useState, useMemo } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloCaixa } from './XiloIcons';
import QrCodeLogin from './auth/QrCodeLogin';

export default function Login({ branding, onSuccess }) {
  const { t, locale } = useTranslation();

  // Détection du mode initial : si l'utilisateur arrive via un lien d'invitation (groupe ou mode=signup),
  // on active directement le mode Création de compte pour éviter la confusion avec la connexion.
  const searchParams = useMemo(() => {
    return typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  }, []);

  const isInviteLink = useMemo(() => {
    const mode = searchParams.get('mode');
    const signup = searchParams.get('signup');
    const inscription = searchParams.get('inscription');
    const hasGroup = Boolean(searchParams.get('groupe') || searchParams.get('assoc') || searchParams.get('tenant'));
    return mode === 'signup' || signup === 'true' || inscription === 'true' || hasGroup;
  }, [searchParams]);

  // Détection des navigateurs intégrés d'applications (Gmail, Yahoo, Mail iOS, Facebook, etc.)
  const isInAppBrowser = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    return (
      /FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger|Snapchat|Pinterest/i.test(ua) ||
      /GSA\/|Gmail/i.test(ua) ||
      (/Android/i.test(ua) && /wv/i.test(ua)) ||
      (/iPhone|iPod|iPad/i.test(ua) && !/Safari/i.test(ua))
    );
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(isInviteLink);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [isQrLoginMode, setIsQrLoginMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [inAppDismissed, setInAppDismissed] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(null);

  const getAuthErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        // Fermeture ou annulation normale de la fenêtre par l'utilisateur : pas d'alerte bloquante
        return null;
      case 'auth/popup-blocked':
        return t('login.errorPopupBlocked') || "La fenêtre de connexion Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up ou utiliser l'inscription par e-mail ci-dessous.";
      case 'auth/operation-not-allowed':
        return t('login.errorOperationNotAllowed') || "L'inscription par e-mail et mot de passe n'est pas activée. Veuillez l'activer dans la console Firebase.";
      case 'auth/email-already-in-use':
        return t('login.errorEmailAlreadyInUse') || "Cette adresse e-mail est déjà utilisée. Si vous avez déjà un compte, connectez-vous ou réinitialisez votre mot de passe.";
      case 'auth/invalid-email':
        return t('login.errorInvalidEmail') || "Adresse e-mail invalide.";
      case 'auth/weak-password':
        return t('login.errorWeakPassword') || "Le mot de passe doit comporter au moins 6 caractères.";
      case 'auth/user-not-found':
        return t('login.errorUserNotFound') || "Aucun compte ne correspond à cette adresse e-mail. Cliquez sur 'Créer un compte' pour vous inscrire.";
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return isSignUpMode 
          ? "Impossible de créer le compte. Vérifiez l'adresse e-mail ou essayez un mot de passe d'au moins 6 caractères."
          : (t('login.errorInvalidCredential') || "Identifiants incorrects. Si vous êtes nouveau, cliquez sur l'onglet 'Créer un compte'.");
      case 'auth/user-disabled':
        return t('login.errorUserDisabled') || "Ce compte a été désactivé.";
      default:
        return (t('login.errorDefault') || "Une erreur est survenue : ") + error.message;
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    setGoogleNotice(null);
    try {
      // Connect purely via popup to bypass sessionStorage partitioning on modern mobile browsers/PWAs
      await signInWithPopup(auth, googleProvider);
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.info("Connexion Google : fenêtre refermée ou annulée.");
        setGoogleNotice({
          type: 'info',
          title: t('login.popupClosedTitle') || "Fenêtre Google fermée",
          message: t('login.popupClosedDesc') || "L'authentification Google a été interrompue ou fermée. Vous pouvez réessayer ou créer votre compte avec votre adresse e-mail ci-dessous."
        });
        return;
      }
      if (error.code === 'auth/popup-blocked') {
        console.warn("Connexion Google : popup bloquée par le navigateur.");
        setGoogleNotice({
          type: 'warning',
          title: t('login.popupBlockedTitle') || "Fenêtre bloquée par votre navigateur",
          message: t('login.popupBlockedDesc') || "Votre navigateur a bloqué l'ouverture de la fenêtre Google. Vous pouvez autoriser les pop-ups pour ce site, ou utiliser l'inscription par e-mail ci-dessous."
        });
        return;
      }
      console.error("Erreur de connexion :", error);
      const msg = getAuthErrorMessage(error);
      if (msg) alert(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setAuthLoading(true);
    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erreur d'authentification par email :", error);
      alert(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAuthLoading(true);
    setResetSent(false);
    try {
      auth.languageCode = locale || 'fr';
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (error) {
      console.error("Erreur de réinitialisation du mot de passe :", error);
      alert(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const brandingStyle = branding?.colors ? {
    '--cordel-bg': branding.colors.background,
    '--cordel-bg-light-color': branding.colors.background,
    '--color-cordel-bg-light': branding.colors.background,

    '--cordel-text': branding.colors.text,
    '--color-encre-noire': branding.colors.text,
    '--encre-noire': branding.colors.text,
    '--cordel-border': branding.colors.text,

    '--color-cordel-ocre': branding.colors.primary,
    '--cordel-ocre': branding.colors.primary,
    '--cordel-wood': branding.colors.primary,

    '--color-cordel-vert': branding.colors.secondary,
    '--cordel-vert': branding.colors.secondary
  } : {};

  return (
    <div style={brandingStyle} className="min-h-screen flex flex-col w-full force-light-theme">
      <LayoutShell forceLight={true}>
        <div className="flex-1 flex flex-col justify-center items-center py-12">
          <CordelCard variant="default" useExtremeBorder={true} className="w-full text-center py-8">
            {/* Handcrafted circular print logo container */}
            <div className="w-24 h-24 mx-auto mb-6 bg-cordel-wood rounded-full flex items-center justify-center border-4 border-encre-noire shadow-[4px_4px_0px_0px_#181716] overflow-hidden">
              {branding?.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-2 bg-white" 
                />
              ) : (
                <XiloCaixa size={48} className="text-cordel-bg-light" />
              )}
            </div>

            <h2 className="panel-title text-2xl font-bold tracking-wider text-cordel-wood mb-2">
              {isResetPasswordMode ? t('login.resetPasswordTitle') : t('login.title')}
            </h2>
            <p className="text-xs uppercase font-extrabold tracking-widest text-cordel-master-dark/65 mb-6">
              {t('login.gateway')}
            </p>

            {isResetPasswordMode ? (
              <div className="flex flex-col gap-4 text-left">
                <p className="text-sm leading-relaxed text-cordel-master-dark/80 px-2 text-center">
                  {t('login.resetPasswordDesc')}
                </p>

                {resetSent ? (
                  <div className="p-3 bg-cordel-bg-light border-2 border-encre-noire rounded text-xs font-bold text-cordel-wood text-center my-2 shadow-[2px_2px_0px_0px_#181716]">
                    ✓ {t('login.resetEmailSent')}
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                        {t('login.email')}
                      </label>
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={authLoading}
                        className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                        placeholder="nom@exemple.com"
                      />
                    </div>

                    <CordelButton 
                      variant="ocre" 
                      useExtremeBorder={true} 
                      disabled={authLoading || !email.trim()}
                      className="w-full py-2.5 mt-2 font-bold uppercase text-xs tracking-wider"
                    >
                      {authLoading ? t('common.loading') : t('login.sendResetLink')}
                    </CordelButton>
                  </form>
                )}

                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPasswordMode(false);
                      setResetSent(false);
                    }}
                    className="text-[10px] font-bold text-cordel-wood hover:underline cursor-pointer"
                  >
                    ← {t('login.backToLogin')}
                  </button>
                </div>
              </div>
            ) : isQrLoginMode ? (
              <div className="flex flex-col items-center">
                <QrCodeLogin />
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setIsQrLoginMode(false)}
                    className="text-[10px] font-bold text-cordel-wood hover:underline cursor-pointer"
                  >
                    ← {t('login.backToLogin') || "Retour à la connexion classique"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Bandeau d'aide In-App Browser (Gmail, Yahoo, Mail iOS, etc.) */}
                {isInAppBrowser && !inAppDismissed && (
                  <div className="p-3 mb-5 bg-amber-50/90 border-2 border-amber-600/50 rounded-[6px_8px_5px_7px] text-left text-xs text-amber-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] relative animate-fadeIn">
                    <button 
                      type="button" 
                      onClick={() => setInAppDismissed(true)} 
                      className="absolute top-1.5 right-2 text-stone-500 hover:text-stone-800 text-sm font-bold cursor-pointer"
                      aria-label="Fermer cette notification"
                    >
                      ✕
                    </button>
                    <div className="flex items-start gap-2.5 pr-4">
                      <span className="text-lg select-none">💡</span>
                      <div className="space-y-1">
                        <p className="font-extrabold text-[11px] uppercase tracking-wide">
                          Ouverture depuis votre application de messagerie
                        </p>
                        <p className="text-[10px] leading-relaxed text-amber-950/80">
                          Si la connexion Google bloque ou si l'affichage est tronqué, appuyez sur les <strong>•••</strong> ou l'icône de partage <strong>↗</strong> de votre écran pour choisir <em>« Ouvrir dans Chrome / Safari »</em>.
                        </p>
                        <p className="text-[10px] font-bold text-amber-800">
                          ✨ Astuce : La création de compte par e-mail et mot de passe ci-dessous fonctionne directement ici sans quitter votre écran !
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglets segmentés Cordel : Se connecter / Créer un compte */}
                <div className="flex w-full mb-5 border-2 border-encre-noire rounded-[8px_5px_9px_6px] p-1 bg-amber-100/40 shadow-[2px_2px_0px_0px_#181716]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(false);
                      setGoogleNotice(null);
                    }}
                    className={`flex-1 py-2 px-2 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      !isSignUpMode
                        ? 'bg-cordel-wood text-white shadow-[1px_1px_0px_0px_#181716]'
                        : 'text-cordel-wood/80 hover:text-cordel-wood hover:bg-amber-100/50'
                    }`}
                  >
                    <span>🔑</span>
                    <span>{t('login.tabSignIn') || "Se connecter"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(true);
                      setGoogleNotice(null);
                    }}
                    className={`flex-1 py-2 px-2 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSignUpMode
                        ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-[1px_1px_0px_0px_#181716]'
                        : 'text-cordel-wood/80 hover:text-cordel-wood hover:bg-amber-100/50'
                    }`}
                  >
                    <span>✍️</span>
                    <span>{t('login.tabSignUp') || "Créer un compte"}</span>
                  </button>
                </div>

                <p className="text-xs leading-relaxed mb-4 text-cordel-master-dark/80 px-1 text-center">
                  {isSignUpMode 
                    ? "Inscrivez-vous pour rejoindre l'association et compléter votre fiche d'adhérent."
                    : (t('login.welcomeDesc') || "Connectez-vous pour accéder à votre espace membre.")}
                </p>

                {/* Connexion Google */}
                <CordelButton 
                  variant="ocre" 
                  useExtremeBorder={true} 
                  onClick={handleLogin} 
                  disabled={authLoading}
                  className="w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>🌐</span>
                  <span>{isSignUpMode ? "S'inscrire avec Google" : (t('login.loginGoogle') || "Se connecter avec Google")}</span>
                </CordelButton>

                {/* Information douce en cas de fenêtre Google fermée ou bloquée */}
                {googleNotice && (
                  <div className={`p-3 my-2.5 rounded-[6px_8px_5px_7px] text-left text-xs border-2 shadow-2xs animate-fadeIn ${
                    googleNotice.type === 'warning'
                      ? 'bg-red-50/95 border-red-400 text-red-900'
                      : 'bg-amber-50/95 border-amber-400 text-amber-900'
                  }`}>
                    <div className="flex items-start gap-2">
                      <span className="text-base select-none">{googleNotice.type === 'warning' ? '🚫' : '💡'}</span>
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-[11px] uppercase tracking-wide">
                          {googleNotice.title}
                        </p>
                        <p className="text-[10px] leading-relaxed opacity-90">
                          {googleNotice.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-2 my-4 opacity-40">
                  <div className="flex-1 border-t border-dashed border-encre-noire"></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-cordel-master-dark">
                    {t('login.orEmail') || "Ou avec votre e-mail"}
                  </span>
                  <div className="flex-1 border-t border-dashed border-encre-noire"></div>
                </div>

                {/* Formulaire Email + Mot de passe */}
                <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 text-left">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                      {t('login.email')} <span className="text-red-600">*</span>
                    </label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={authLoading}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                      placeholder="nom@exemple.com"
                      autoComplete="email"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                        {t('login.password')} <span className="text-red-600">*</span>
                      </label>
                      {!isSignUpMode ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsResetPasswordMode(true);
                            setResetSent(false);
                          }}
                          className="text-[9px] font-bold text-cordel-master-dark/70 hover:text-cordel-wood hover:underline cursor-pointer"
                        >
                          {t('login.forgotPassword') || "Mot de passe oublié ?"}
                        </button>
                      ) : (
                        <span className="text-[8px] font-bold text-stone-500">
                          (min. 6 caractères)
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={authLoading}
                        minLength={isSignUpMode ? 6 : undefined}
                        className="theme-input text-xs font-bold py-1.5 pr-10 bg-cordel-bg-light w-full"
                        placeholder={isSignUpMode ? "Au moins 6 caractères" : "******"}
                        autoComplete={isSignUpMode ? "new-password" : "current-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 text-stone-600 hover:text-black p-1 cursor-pointer select-none text-sm transition-transform active:scale-90"
                        title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        aria-label="Afficher ou masquer le mot de passe"
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <CordelButton 
                    variant={isSignUpMode ? "vert" : "default"} 
                    useExtremeBorder={true} 
                    disabled={authLoading || !email.trim() || !password.trim()}
                    className="w-full py-3 mt-2 font-black uppercase text-xs tracking-wider shadow-sm"
                  >
                    {authLoading 
                      ? (t('common.loading') || "Chargement...") 
                      : (isSignUpMode ? "✍️ CRÉER MON COMPTE & CONTINUER" : (t('login.loginBtn') || "🔑 SE CONNECTER"))}
                  </CordelButton>

                  {isSignUpMode && (
                    <p className="text-[10px] text-center text-stone-600 font-medium mt-1">
                      📋 Dès la création de votre compte, vous pourrez choisir votre discipline (Danse ou Percussion) et compléter votre fiche.
                    </p>
                  )}

                  {/* Switch Login Method Tab - QR Code */}
                  <div className="flex justify-center mt-3 pt-3 border-t border-dashed border-cordel-master-dark/20">
                    <button
                      type="button"
                      onClick={() => setIsQrLoginMode(true)}
                      className="text-[10px] font-bold text-cordel-master-dark/70 hover:text-cordel-wood hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      <span>📱</span>
                      <span>Se connecter avec un QR Code</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </CordelCard>
        </div>

        {/* Decorative footer stamp */}
        <div className="text-center opacity-40 mt-4">
          <span className="border-2 border-encre-noire px-3 py-1 font-bold text-xs uppercase tracking-widest rounded-[4px_8px_3px_6px]">
            Cordel Securo
          </span>
        </div>
      </LayoutShell>
    </div>
  );
}

