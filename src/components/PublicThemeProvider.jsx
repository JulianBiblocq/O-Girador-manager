import React, { createContext, useContext } from 'react';
import { usePublicTheme } from '../hooks/usePublicTheme';

// Contexte pour distribuer les réglages du thème public dans le sous-arbre React
const PublicThemeContext = createContext({
  publicTheme: null,
  loading: false,
  error: null
});

/**
 * Hook d'accès au contexte du thème public.
 */
export function usePublicThemeContext() {
  return useContext(PublicThemeContext);
}

/**
 * Composant Provider enveloppant les routes ou composants du site public.
 * Il active le moteur d'injection CSS & Google Fonts et diffuse le contexte du thème.
 * 
 * @param {Object} props
 * @param {string} props.groupId - ID de l'association.
 * @param {Object} [props.themeOverride] - Thème personnalisé optionnel.
 * @param {React.ReactNode} props.children - Les composants enfants du site public.
 * @param {string} [props.className] - Classes CSS additionnelles pour le conteneur.
 */
export default function PublicThemeProvider({ groupId, themeOverride, children, className = '' }) {
  const { publicTheme, loading, error } = usePublicTheme(groupId, themeOverride);

  return (
    <PublicThemeContext.Provider value={{ publicTheme, loading, error }}>
      <div 
        data-public-theme="true"
        className={`public-site-container w-full min-h-screen transition-colors duration-300 ${className}`}
        style={{
          fontFamily: 'var(--public-font-body, sans-serif)'
        }}
      >
        {children}
      </div>
    </PublicThemeContext.Provider>
  );
}

/**
 * Widget de démonstration et de validation du Moteur de Thème Public.
 * Permet de vérifier visuellement dans le navigateur que les variables CSS
 * --public-primary, --public-secondary, --public-font-heading et --public-font-body
 * s'appliquent correctement et se mettent à jour dynamiquement dans le DOM.
 */
export function PublicThemeDemoWidget() {
  const { publicTheme, loading } = usePublicThemeContext();

  if (loading) {
    return (
      <div className="p-6 text-center text-xs uppercase font-bold tracking-widest opacity-60">
        ⏳ Chargement du thème public...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto my-6 rounded-xl border border-gray-200 bg-white shadow-lg flex flex-col gap-6 text-left">
      {/* En-tête de démonstration */}
      <div className="border-b pb-4">
        <span 
          className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded text-white inline-block mb-2"
          style={{ backgroundColor: 'var(--public-secondary)' }}
        >
          Démonstration du Moteur Vitrine
        </span>
        <h1 
          className="text-3xl font-extrabold"
          style={{ 
            fontFamily: 'var(--public-font-heading)',
            color: 'var(--public-primary)'
          }}
        >
          Site Public de l'Association
        </h1>
      </div>

      {/* Corps du texte de démonstration */}
      <p 
        className="text-base leading-relaxed text-gray-700"
        style={{ fontFamily: 'var(--public-font-body)' }}
      >
        Ceci est une page de test du moteur de thème dynamique en mode marque blanche.
        Le titre ci-dessus utilise la police <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{publicTheme?.headingFont}</code> et la couleur primaire <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{publicTheme?.primaryColor}</code>.
        Ce texte utilise la police <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{publicTheme?.bodyFont}</code>.
      </p>

      {/* Boutons interactifs avec variables CSS */}
      <div className="flex flex-wrap gap-4 pt-2">
        <button
          type="button"
          className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-white rounded-lg shadow transition-transform active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'var(--public-primary)',
            fontFamily: 'var(--public-font-heading)'
          }}
        >
          Bouton Primaire
        </button>

        <button
          type="button"
          className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-white rounded-lg shadow transition-transform active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'var(--public-secondary)',
            fontFamily: 'var(--public-font-heading)'
          }}
        >
          Bouton Secondaire
        </button>
      </div>

      {/* Inspecteur des variables CSS du DOM */}
      <div className="mt-4 p-4 rounded bg-gray-900 text-green-400 font-mono text-xs flex flex-col gap-1">
        <div className="text-gray-400 font-bold mb-1">// Inspecteur des variables CSS dans le DOM :</div>
        <div>--public-primary: {publicTheme?.primaryColor};</div>
        <div>--public-secondary: {publicTheme?.secondaryColor};</div>
        <div>--public-font-heading: '{publicTheme?.headingFont}', sans-serif;</div>
        <div>--public-font-body: '{publicTheme?.bodyFont}', sans-serif;</div>
      </div>
    </div>
  );
}
