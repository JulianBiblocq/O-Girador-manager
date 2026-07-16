import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default function Login({ branding }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erreur d'authentification Google :", error);
      alert("Impossible de se connecter : " + error.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setAuthLoading(true);
    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        alert("Compte créé avec succès ! Veuillez renseigner votre profil.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      }
    } catch (error) {
      console.error("Erreur d'authentification par email :", error);
      alert("Erreur d'authentification : " + error.message);
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
    <div style={brandingStyle} className="min-h-screen flex flex-col w-full">
      <LayoutShell>
        <div className="flex-1 flex flex-col justify-center items-center py-12">
          <CordelCard variant="default" useExtremeBorder={true} className="w-full text-center py-8">
            {/* Handcrafted circular print logo container */}
            <div className="w-24 h-24 mx-auto mb-6 bg-cordel-wood rounded-full flex items-center justify-center border-4 border-encre-noire shadow-[4px_4px_0px_0px_#181716] overflow-hidden">
              {branding?.logoUrl ? (
                <img 
                  src={branding.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-cover p-2 bg-white" 
                />
              ) : (
                <span className="text-4xl text-cordel-bg-light select-none">🥁</span>
              )}
            </div>

            <h2 className="panel-title text-2xl font-bold tracking-wider text-cordel-wood mb-2">
              O Girador
            </h2>
            <p className="text-xs uppercase font-extrabold tracking-widest text-cordel-master-dark/65 mb-6">
              Porte d'Entrée
            </p>

            <p className="text-sm leading-relaxed mb-8 text-cordel-master-dark/80 px-2">
              Accédez à la console d'administration et de gestion pour votre groupe de maracatu.
            </p>

            <CordelButton 
              variant="ocre" 
              useExtremeBorder={true} 
              onClick={handleLogin} 
              disabled={authLoading}
              className="w-full py-3"
            >
              Se connecter avec Google
            </CordelButton>

            {/* Divider */}
            <div className="flex items-center gap-2 my-6 opacity-40">
              <div className="flex-1 border-t border-dashed border-encre-noire"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cordel-master-dark">ou par email</span>
              <div className="flex-1 border-t border-dashed border-encre-noire"></div>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                  Adresse Email
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

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                  Mot de passe
                </label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authLoading}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  placeholder="******"
                />
              </div>

              <CordelButton 
                variant="default" 
                useExtremeBorder={true} 
                disabled={authLoading || !email.trim() || !password.trim()}
                className="w-full py-2.5 mt-2 font-bold uppercase text-xs tracking-wider"
              >
                {authLoading ? "Chargement..." : (isSignUpMode ? "Créer un compte" : "Se connecter")}
              </CordelButton>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUpMode(!isSignUpMode)}
                  className="text-[10px] font-bold text-cordel-wood hover:underline cursor-pointer"
                >
                  {isSignUpMode ? "Déjà un compte ? Se connecter" : "Nouveau ? Créer un compte"}
                </button>
              </div>
            </form>
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
