import React, { useState, useMemo } from 'react';
import { signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloCaixa } from './XiloIcons';
import QrCodeLogin from './auth/QrCodeLogin';
import useGroupContext, { setStoredGroupId } from '../hooks/useGroupContext';
import { canonicalizeGroupId } from '../utils/tenantUtils';
import GroupSelectorStep from './auth/GroupSelectorStep';
import RegisterForm from './auth/RegisterForm';
import { InAppBrowserHelpBanner, AuthAssistanceBannerCard } from './auth/LoginAssistanceBanners';
import { LoginModeToggleTabs, LoginGoogleSection, LoginQrCodeActionButton } from './auth/LoginModeHeaderAndActions';
import { formatFirebaseAuthError } from '../utils/authErrorUtils';

const syncAuthLocale = (authInstance, lang) => {
  if (authInstance) {
    authInstance.languageCode = lang || 'fr';
  }
};

export default function Login({ branding, onSuccess }) {
  const { t, locale } = useTranslation();
  const { groupId: _groupId, needsGroupSelection, setManualGroupId } = useGroupContext();

  // 1. Persistance immédiate du groupId dès l'arrivée sur Login.jsx
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const rawGroup = params.get('groupe') || params.get('group') || params.get('assoc') || params.get('tenant');
      if (rawGroup && rawGroup.trim()) {
        const canonical = canonicalizeGroupId(rawGroup.trim());
        setStoredGroupId(canonical);
        localStorage.setItem('selected_group_id', canonical);
        localStorage.setItem('girador_group_id', canonical);
        if (setManualGroupId) setManualGroupId(canonical);
      }
    } catch (err) {
      console.warn("Login - Erreur capture groupId :", err);
    }
  }, [setManualGroupId]);

  // Détection du mode initial : toujours « Se connecter » par défaut (même avec ?groupe= ou ?tenant=),
  // sauf si l'URL demande explicitement l'inscription (?mode=signup ou ?signup=1).
  const searchParams = useMemo(() => {
    return typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  }, []);

  const initialSignUpMode = useMemo(() => {
    const mode = searchParams.get('mode');
    const signup = searchParams.get('signup');
    const inscription = searchParams.get('inscription');
    return (
      mode === 'signup' ||
      mode === 'register' ||
      signup === '1' ||
      signup === 'true' ||
      inscription === '1' ||
      inscription === 'true'
    );
  }, [searchParams]);

  // Détection des navigateurs intégrés d'applications (WhatsApp, Facebook, Instagram, Gmail, etc.)
  const isInAppBrowser = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const inAppRegex = /(WhatsApp|FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger|Snapchat|Pinterest)/i;
    return (
      inAppRegex.test(ua) ||
      /GSA\/|Gmail/i.test(ua) ||
      (/Android/i.test(ua) && /wv/i.test(ua)) ||
      (/iPhone|iPod|iPad/i.test(ua) && !/Safari/i.test(ua))
    );
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(initialSignUpMode);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [isQrLoginMode, setIsQrLoginMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [inAppDismissed, setInAppDismissed] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(null);
  const [authAssistanceBanner, setAuthAssistanceBanner] = useState(null);
  const [resetConfirmationEmail, setResetConfirmationEmail] = useState(null);

  const handleSwitchToLogin = (targetEmail, assistanceData = null) => {
    if (targetEmail) {
      setEmail(targetEmail);
    }
    setIsSignUpMode(false);
    setGoogleNotice(null);
    setResetConfirmationEmail(null);
    if (assistanceData) {
      setAuthAssistanceBanner(assistanceData);
    }
  };

  const handleInstantPasswordReset = async (targetEmail) => {
    const cleanEmail = (targetEmail || email).trim().toLowerCase();
    if (!cleanEmail) return;

    setAuthLoading(true);
    try {
      syncAuthLocale(auth, locale);
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetConfirmationEmail(cleanEmail);
    } catch (err) {
      console.error("Login - Erreur réinitialisation rapide :", err);
      alert(getAuthErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickAccountActivation = async (targetEmail, targetPassword) => {
    const cleanEmail = (targetEmail || email).trim().toLowerCase();
    const currentPassword = targetPassword || password;

    if (!cleanEmail) return;
    if (!currentPassword || currentPassword.length < 6) {
      setIsSignUpMode(true);
      setAuthAssistanceBanner(null);
      return;
    }

    setAuthLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, currentPassword);
      console.info("Login - Activation rapide réussie pour :", cleanEmail);
      if (onSuccess) onSuccess();
    } catch (createErr) {
      console.warn("Login - Erreur activation rapide :", createErr);
      if (createErr.code === 'auth/email-already-in-use') {
        setAuthAssistanceBanner({
          type: 'confirmed_account_wrong_password',
          email: cleanEmail,
          isGoogleCandidate: cleanEmail.endsWith('@gmail.com') || cleanEmail.endsWith('@googlemail.com')
        });
      } else if (createErr.code === 'auth/weak-password') {
        setIsSignUpMode(true);
        setAuthAssistanceBanner(null);
      } else {
        alert(getAuthErrorMessage(createErr));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const getAuthErrorMessage = (error) => formatFirebaseAuthError(error, t, isSignUpMode);

  const handleGoogleRedirectLogin = async () => {
    setAuthLoading(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.warn("Login - Erreur signInWithRedirect Google :", err);
      setAuthLoading(false);
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
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/unauthorized-domain' ||
        error.code === 'auth/operation-not-supported-in-this-environment' ||
        error.code === 'auth/internal-error'
      ) {
        console.warn("Connexion Google : popup bloquée par le navigateur ou restriction in-app.");
        setGoogleNotice({
          type: 'warning',
          title: "Fenêtre Google bloquée ou restreinte",
          message: "Votre navigateur ou application de messagerie restreint l'ouverture des fenêtres Google. Vous pouvez ouvrir cette page dans Safari ou Chrome (via l'icône de partage ↗ ou les •••), ou utiliser directement le formulaire e-mail / mot de passe ci-dessous sans quitter votre écran."
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
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return;

    setAuthLoading(true);
    setAuthAssistanceBanner(null);
    setResetConfirmationEmail(null);

    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.warn("Erreur d'authentification par e-mail :", error?.code, error?.message);

      const isNotFoundOrInvalid = 
        error?.code === 'auth/user-not-found' || 
        error?.code === 'auth/invalid-credential' || 
        error?.code === 'auth/wrong-password';

      if (!isSignUpMode && isNotFoundOrInvalid) {
        setAuthAssistanceBanner({
          type: 'invalid_credentials_or_new_user',
          code: error.code,
          email: cleanEmail,
          password: password,
          isGoogleCandidate: cleanEmail.endsWith('@gmail.com') || cleanEmail.endsWith('@googlemail.com')
        });
      } else {
        alert(getAuthErrorMessage(error));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setAuthLoading(true);
    setResetSent(false);
    try {
      auth.languageCode = locale || 'fr';
      await sendPasswordResetEmail(auth, cleanEmail);
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
            <p className="text-xs uppercase font-extrabold tracking-widest text-cordel-master-dark/65 mb-4">
              {t('login.gateway')}
            </p>

            {/* Bascule permanente ultra-visible en haut de la carte : Se connecter (Déjà membre) / Créer mon compte */}
            <LoginModeToggleTabs
              isSignUpMode={isSignUpMode}
              isQrLoginMode={isQrLoginMode}
              onSelectSignIn={() => {
                setIsSignUpMode(false);
                setIsQrLoginMode(false);
                setIsResetPasswordMode(false);
                setGoogleNotice(null);
                setAuthAssistanceBanner(null);
                setResetConfirmationEmail(null);
              }}
              onSelectSignUp={() => {
                setIsSignUpMode(true);
                setIsQrLoginMode(false);
                setIsResetPasswordMode(false);
                setGoogleNotice(null);
                setAuthAssistanceBanner(null);
                setResetConfirmationEmail(null);
              }}
            />

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
                <QrCodeLogin onSuccess={onSuccess} />
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
                {/* Bandeau d'aide In-App Browser (WhatsApp, Instagram, Gmail, etc.) */}
                {isInAppBrowser && !inAppDismissed && (
                  <InAppBrowserHelpBanner onDismiss={() => setInAppDismissed(true)} />
                )}

                <p className="text-xs leading-relaxed mb-4 text-cordel-master-dark/80 px-1 text-center">
                  {isSignUpMode 
                    ? "Inscrivez-vous pour rejoindre l'association et compléter votre fiche d'adhérent."
                    : (t('login.welcomeDesc') || "Connectez-vous pour accéder à votre espace membre.")}
                </p>

                {/* Si aucun groupe n'est détecté en mode inscription, afficher l'étape bienveillante */}
                {isSignUpMode && needsGroupSelection ? (
                  <>
                    <GroupSelectorStep onSelectGroup={(g) => setManualGroupId(g)} />
                    <LoginQrCodeActionButton onOpenQrLogin={() => setIsQrLoginMode(true)} />
                  </>
                ) : (
                  <>
                    {/* Connexion / Inscription Google */}
                    <LoginGoogleSection
                      isSignUpMode={isSignUpMode}
                      authLoading={authLoading}
                      googleNotice={googleNotice}
                      onGooglePopupLogin={handleLogin}
                      onGoogleRedirectLogin={handleGoogleRedirectLogin}
                    />

                    {/* Divider */}
                    <div className="flex items-center gap-2 my-4 opacity-40">
                      <div className="flex-1 border-t border-dashed border-encre-noire"></div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-cordel-master-dark">
                        {t('login.orEmail') || "Ou avec votre e-mail"}
                      </span>
                      <div className="flex-1 border-t border-dashed border-encre-noire"></div>
                    </div>

                    {isSignUpMode ? (
                      /* Formulaire d'inscription garanti : Email + Mot de passe + Confirmation */
                      <>
                        <RegisterForm
                          onSuccess={onSuccess}
                          onSwitchToLogin={handleSwitchToLogin}
                          initialEmail={email}
                          onEmailChange={(val) => setEmail(val)}
                        />
                        <LoginQrCodeActionButton
                          onOpenQrLogin={() => {
                            setIsSignUpMode(false);
                            setIsQrLoginMode(true);
                          }}
                        />
                      </>
                    ) : (
                      /* Formulaire de connexion classique */
                      <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 text-left">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                            {t('login.email')} <span className="text-red-600">*</span>
                          </label>
                          <input 
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (authAssistanceBanner) setAuthAssistanceBanner(null);
                            }}
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
                          </div>
                          <div className="relative flex items-center">
                            <input 
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (authAssistanceBanner) setAuthAssistanceBanner(null);
                              }}
                              disabled={authLoading}
                              className="theme-input text-xs font-bold py-1.5 pr-10 bg-cordel-bg-light w-full"
                              placeholder="******"
                              autoComplete="current-password"
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

                        {/* Encart d'assistance intelligente zéro-friction */}
                        <AuthAssistanceBannerCard
                          banner={authAssistanceBanner}
                          password={password}
                          authLoading={authLoading}
                          resetConfirmationEmail={resetConfirmationEmail}
                          onClose={() => setAuthAssistanceBanner(null)}
                          onQuickActivation={handleQuickAccountActivation}
                          onInstantReset={handleInstantPasswordReset}
                          onGoogleLogin={handleLogin}
                        />

                        <CordelButton 
                          variant="default" 
                          useExtremeBorder={true} 
                          disabled={authLoading || !email.trim() || !password.trim()}
                          className="w-full py-3 mt-2 font-black uppercase text-xs tracking-wider shadow-sm"
                        >
                          {authLoading 
                            ? (t('common.loading') || "Chargement...") 
                            : (t('login.loginBtn') || "🔑 SE CONNECTER")}
                        </CordelButton>

                        {/* Accès permanent en 1 clic à la connexion par QR Code */}
                        <LoginQrCodeActionButton onOpenQrLogin={() => setIsQrLoginMode(true)} />
                      </form>
                    )}
                  </>
                )}
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

