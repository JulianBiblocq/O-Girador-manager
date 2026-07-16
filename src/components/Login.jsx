import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erreur d'authentification Google :", error);
      alert("Impossible de se connecter : " + error.message);
    }
  };

  return (
    <LayoutShell>
      <div className="flex-1 flex flex-col justify-center items-center py-12">
        <CordelCard variant="default" useExtremeBorder={true} className="w-full text-center py-8">
          {/* Handcrafted circular print logo container */}
          <div className="w-24 h-24 mx-auto mb-6 bg-cordel-wood rounded-full flex items-center justify-center border-4 border-encre-noire shadow-[4px_4px_0px_0px_#181716]">
            <span className="text-4xl text-cordel-bg-light select-none">🥁</span>
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
            className="w-full py-3"
          >
            Se connecter avec Google
          </CordelButton>
        </CordelCard>
      </div>

      {/* Decorative footer stamp */}
      <div className="text-center opacity-40 mt-4">
        <span className="border-2 border-encre-noire px-3 py-1 font-bold text-xs uppercase tracking-widest rounded-[4px_8px_3px_6px]">
          Cordel Securo
        </span>
      </div>
    </LayoutShell>
  );
}
