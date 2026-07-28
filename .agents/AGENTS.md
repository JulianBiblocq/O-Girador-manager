# Project Rules - O-Girador-manager

These are the core architectural and design system rules for the O-Girador-manager project.

## 1. Règle Anti-Monolithe (Modularité absolue)
- **Principe de Responsabilité Unique** : Ne créez jamais de gros fichiers monolithiques. Divisez le code en sous-composants réutilisables ou hooks personnalisés dès que la logique ou la taille du fichier grandit.
- **Organisation** : Placez les composants réutilisables sous `src/components/` et les hooks sous `src/hooks/`.

## 2. Architecture Multi-Thèmes (Thème Isolable)
- **Zéro style inline thématique** : Ne codez jamais de styles de présentation thématiques (couleurs, bordures asymétriques, ombres, polices) directement en dur dans le JSX.
- **Variables CSS Sémantiques** : Toutes les propriétés visuelles doivent reposer sur des variables CSS déclarées globalement.
  - Exemple : utilisez `border-[var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--theme-border-color)]` et `rounded-[var(--theme-border-radius)]` ou des classes utilitaires mappées sur des variables sémantiques.
- **Isolation du thème** : Le design actuel "Cordel" (police Cactus, fonds de papier, cordes de suspension, bordures asymétriques) doit être remplaçable par un futur thème (ex. "Capoeira") en changeant uniquement les définitions dans la feuille de styles CSS (ex. `src/index.css`), sans avoir à modifier le code structurel des composants React.

## 3. Francisation Absolue de la Base de Code (Commentaires)
- **Langue obligatoire des commentaires** : L'intégralité des annotations, commentaires explicatifs, marqueurs (ex. `// TODO:`) et docstrings dans les fichiers du projet (composants React, hooks, utilitaires, configuration) doit être rédigée exclusivement en français.
- **Directive pour l'IA** : Tout nouveau code généré, modifié ou commenté par l'IA doit comporter des commentaires 100% en français.

