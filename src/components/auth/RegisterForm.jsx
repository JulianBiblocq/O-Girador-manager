import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * Formulaire d'inscription universel par Email & Mot de passe avec confirmation
 * Fonctionne de façon autonome et fluide sur Firefox, Safari, Chrome et navigateurs in-app (WhatsApp, etc.)
 * sans dépendre d'aucune popup tierce susceptible d'être bloquée.
 *
 * @param {Object} props
 * @param {Function} props.onSuccess Callback appelé en cas de succès d'inscription
 * @param {Function} [props.onSwitchToLogin] Callback pour basculer vers le mode connexion
 */
export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getFriendlyErrorMessage = (error) => {
    switch (error?.code) {
      case 'auth/email-already-in-use':
        return t('login.errorEmailAlreadyInUse') || "Cette adresse e-mail est déjà utilisée. Si vous avez déjà un compte, connectez-vous directement.";
      case 'auth/invalid-email':
        return t('login.errorInvalidEmail') || "Adresse e-mail invalide. Veuillez vérifier votre saisie.";
      case 'auth/weak-password':
        return t('login.errorWeakPassword') || "Le mot de passe doit comporter au moins 6 caractères.";
      case 'auth/operation-not-allowed':
        return "L'inscription par e-mail n'est pas activée sur ce serveur.";
      default:
        return error?.message || "Une erreur est survenue lors de la création de votre compte.";
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Veuillez renseigner votre e-mail et votre mot de passe.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas. Veuillez vérifier.");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("RegisterForm - Erreur création de compte :", err);
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isMismatch = Boolean(confirmPassword && password !== confirmPassword);

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-3 text-left w-full">
      {/* Champ E-mail */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
          {t('login.email') || "Adresse e-mail"} <span className="text-red-600">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMessage) setErrorMessage('');
          }}
          disabled={loading}
          className="theme-input text-xs font-bold py-2 px-3 bg-cordel-bg-light"
          placeholder="nom@exemple.com"
          autoComplete="email"
        />
      </div>

      {/* Champ Mot de passe */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
            {t('login.password') || "Mot de passe"} <span className="text-red-600">*</span>
          </label>
          <span className="text-[9px] font-bold text-stone-500">
            (min. 6 caractères)
          </span>
        </div>
        <div className="relative flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={loading}
            className="theme-input text-xs font-bold py-2 pr-10 pl-3 bg-cordel-bg-light w-full"
            placeholder="Au moins 6 caractères"
            autoComplete="new-password"
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

      {/* Champ Confirmation du mot de passe */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
          Confirmer le mot de passe <span className="text-red-600">*</span>
        </label>
        <input
          type={showPassword ? "text" : "password"}
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errorMessage) setErrorMessage('');
          }}
          disabled={loading}
          className={`theme-input text-xs font-bold py-2 px-3 bg-cordel-bg-light w-full ${
            isMismatch ? 'border-red-500 ring-1 ring-red-400' : ''
          }`}
          placeholder="Retapez votre mot de passe"
          autoComplete="new-password"
        />
        {isMismatch && (
          <span className="text-[9px] font-bold text-red-600">
            ⚠️ Les mots de passe ne correspondent pas
          </span>
        )}
      </div>

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-300 text-xs font-bold text-red-800 dark:text-red-300">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Bouton de création */}
      <CordelButton
        type="submit"
        variant="vert"
        useExtremeBorder={true}
        disabled={loading || !email.trim() || !password.trim() || isMismatch}
        className="w-full py-3 mt-1 font-black uppercase text-xs tracking-wider shadow-sm"
      >
        {loading ? "Création en cours..." : "✍️ CRÉER MON COMPTE & CONTINUER"}
      </CordelButton>

      <p className="text-[10px] text-center text-cordel-master-dark/70 font-medium">
        📋 Dès la création de votre compte, vous pourrez choisir votre discipline (Danse ou Percussion) et exprimer vos souhaits.
      </p>

      {onSwitchToLogin && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[11px] font-bold text-cordel-wood hover:underline cursor-pointer"
          >
            Déjà inscrit ? Connectez-vous ici →
          </button>
        </div>
      )}
    </form>
  );
}
