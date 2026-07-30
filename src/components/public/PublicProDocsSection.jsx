import React from 'react';

/**
 * Composant de l'Espace Pro & Organisateurs sur la Vitrine Publique.
 * Affiche une section visuellement distincte avec un rendu conditionnel des 4 boutons de téléchargement
 * (Dossier de Présentation, Fiche Technique, Plan de Scène, Kit Presse).
 *
 * @param {Object} props
 * @param {Object} props.publicTheme - Configuration dynamique de la vitrine contenant les URLs de documents.
 */
export default function PublicProDocsSection({ publicTheme }) {
  if (!publicTheme) return null;

  // Récupération des URLs des 4 documents Espace Pro avec rétro-compatibilité
  const dossierPresentationUrl = publicTheme.dossierPresentationUrl || publicTheme.dossierProPdfUrl || '';
  const ficheTechniqueUrl = publicTheme.ficheTechniqueUrl || '';
  const planSceneUrl = publicTheme.planSceneUrl || '';
  const kitPresseUrl = publicTheme.kitPresseUrl || '';

  // Vérification si au moins un document est disponible pour affichage de la section
  const hasAnyDoc = Boolean(dossierPresentationUrl || ficheTechniqueUrl || planSceneUrl || kitPresseUrl);

  if (!hasAnyDoc) {
    return null;
  }

  // Configuration des boutons de téléchargement avec libellés exacts demandés
  const buttonsConfig = [
    {
      url: dossierPresentationUrl,
      label: '📥 Télécharger le Dossier de Présentation',
      title: 'Télécharger le dossier de présentation complet (PDF)'
    },
    {
      url: ficheTechniqueUrl,
      label: '📥 Télécharger la Fiche Technique',
      title: 'Télécharger la fiche technique (PDF)'
    },
    {
      url: planSceneUrl,
      label: '📥 Télécharger le Plan de Scène',
      title: 'Télécharger le plan de scène (PDF/Image)'
    },
    {
      url: kitPresseUrl,
      label: '📥 Télécharger le Kit Presse (Texte & Photos)',
      title: 'Télécharger le kit presse complet (ZIP/PDF)'
    }
  ];

  return (
    <div className="bg-stone-50/90 rounded-2xl border-2 border-stone-200/90 p-6 sm:p-8 shadow-sm flex flex-col gap-6 w-full">
      {/* En-tête de la sous-section Espace Pro */}
      <div className="flex flex-col gap-1 border-b border-stone-200 pb-3">
        <h4 
          className="text-lg sm:text-xl font-extrabold uppercase tracking-tight flex items-center gap-2"
          style={{ 
            fontFamily: 'var(--public-font-heading, sans-serif)',
            color: 'var(--public-primary, #D32F2F)'
          }}
        >
          <span>📂 Espace Pro & Organisateurs</span>
        </h4>
        <p 
          className="text-xs sm:text-sm text-stone-600 font-medium"
          style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
        >
          Téléchargez les documents officiels et éléments de presse pour votre événement.
        </p>
      </div>

      {/* Grille des boutons de téléchargement conditionnels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {buttonsConfig.map((btn, index) => {
          if (!btn.url) return null;

          return (
            <a
              key={index}
              href={btn.url}
              target="_blank"
              rel="noopener noreferrer"
              title={btn.title}
              className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl border-2 border-stone-800 text-stone-900 bg-white hover:bg-stone-100 transition-all text-center flex items-center justify-center gap-2 shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
              style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
            >
              <span>{btn.label}</span>
              <span className="text-stone-400 font-normal">↗</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
