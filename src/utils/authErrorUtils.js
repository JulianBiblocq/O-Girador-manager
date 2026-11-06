/**
 * Traduction des codes d'erreur Firebase Authentication en messages clairs pour l'utilisateur.
 * Extrait de Login.jsx conformément à la Règle du Boy Scout (< 140 lignes).
 */
export function formatFirebaseAuthError(error, t, isSignUpMode = false) {
  if (!error) return null;
  switch (error.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null;
    case 'auth/popup-blocked':
      return (
        t('login.errorPopupBlocked') ||
        "La fenêtre de connexion Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up ou utiliser l'inscription par e-mail ci-dessous."
      );
    case 'auth/operation-not-allowed':
      return (
        t('login.errorOperationNotAllowed') ||
        "L'inscription par e-mail et mot de passe n'est pas activée. Veuillez l'activer dans la console Firebase."
      );
    case 'auth/email-already-in-use':
      return (
        t('login.errorEmailAlreadyInUse') ||
        'Cette adresse e-mail est déjà utilisée. Si vous avez déjà un compte, connectez-vous ou réinitialisez votre mot de passe.'
      );
    case 'auth/invalid-email':
      return t('login.errorInvalidEmail') || 'Adresse e-mail invalide.';
    case 'auth/weak-password':
      return t('login.errorWeakPassword') || 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/user-not-found':
      return (
        t('login.errorUserNotFound') ||
        "Aucun compte ne correspond à cette adresse e-mail. Cliquez sur 'Créer un compte' pour vous inscrire."
      );
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return isSignUpMode
        ? "Impossible de créer le compte. Vérifiez l'adresse e-mail ou essayez un mot de passe d'au moins 6 caractères."
        : t('login.errorInvalidCredential') ||
            "Identifiants incorrects. Si vous êtes nouveau, cliquez sur l'onglet 'Créer un compte'.";
    case 'auth/user-disabled':
      return t('login.errorUserDisabled') || 'Ce compte a été désactivé.';
    default:
      return (t('login.errorDefault') || 'Une erreur est survenue : ') + error.message;
  }
}

