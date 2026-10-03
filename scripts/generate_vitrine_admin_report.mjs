import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const resultsPath = path.join(rootDir, 'scripts/audit_vitrine_admin_results.json');
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

let md = `# Audit Statique Exhaustif i18n — Back-Office du Pôle Vitrine

> **Statut : LECTURE SEULE STRICTE**  
> Aucun fichier source JSX, aucun dictionnaire de locale (\`fr.js\` / \`pt.js\`), aucun schéma Firestore ni règle Firebase n'ont été modifiés.  
> Analyse automatisée réalisée par inspection de l'AST Babel (\`@babel/parser\` & \`@babel/traverse\`) sur l'intégralité des composants d'administration et d'édition de la Vitrine.

---

## 🎯 Contexte & Périmètre de l'Audit

L'objectif de cet audit est de recenser l'exhaustivité des chaînes textuelles codées en dur, attributs textuels (\`placeholder\`, \`title\`, \`subtitle\`, \`aria-label\`, \`alt\`), options de sélection, messages runtime et structures par défaut du **Back-Office du Pôle Vitrine** dans Organizad'Or.

### 🚫 Périmètre formellement exclu
Conformément aux directives de gouvernance :
- **Composants du site public destiné aux visiteurs externes** (\`PublicHome.jsx\`, \`PublicShowcase.jsx\`, \`PublicEventDetails.jsx\`, \`PublicBookingModal.jsx\`, \`PublicMaintenancePage.jsx\`, etc.) : ces composants restent en français avec traduction automatique assurée par le navigateur du visiteur.
- **Règles Firebase et schémas Firestore** : autorité réservée au projet maître Orchestrad'Or.

---

## 📊 Synthèse Chiffrée Globale

`;

let grandTotal = 0;
const subSummaries = [];
const allCleanFiles = [];
const allDirtyFiles = [];

for (const [subKey, sub] of Object.entries(data)) {
  grandTotal += sub.totalStrings;
  allCleanFiles.push(...sub.cleanFiles);
  allDirtyFiles.push(...sub.dirtyFiles);

  subSummaries.push({
    name: sub.name,
    category: sub.category,
    total: sub.totalStrings,
    cleanCount: sub.cleanFiles.length,
    dirtyCount: sub.dirtyFiles.length,
    totalFiles: sub.cleanFiles.length + sub.dirtyFiles.length
  });
}

const totalFilesInspected = subSummaries.reduce((acc, s) => acc + s.totalFiles, 0);
const totalCleanCount = subSummaries.reduce((acc, s) => acc + s.cleanCount, 0);
const totalDirtyCount = subSummaries.reduce((acc, s) => acc + s.dirtyCount, 0);

md += `| Sous-Module Back-Office Vitrine | Catégorie / Namespace | Fichiers Inspectés | Fichiers 100% Conformes | Fichiers avec textes bruts | Total Chaînes Détectées |
| :--- | :---: | :---: | :---: | :---: | :---: |
`;

for (const s of subSummaries) {
  md += `| **${s.name}** | \`vitrine.admin.${s.category}.*\` | ${s.totalFiles} | ${s.cleanCount} | ${s.dirtyCount} | **${s.total}** |\n`;
}

md += `| **TOTAL BACK-OFFICE VITRINE** | — | **${totalFilesInspected}** | **${totalCleanCount}** | **${totalDirtyCount}** | **${grandTotal}** |\n\n`;

md += `### 📈 Indicateurs Clés

- **Taux de conformité actuel :** ${((totalCleanCount / totalFilesInspected) * 100).toFixed(1)}% des fichiers sont déjà 100% traduits ou exempts de textes en dur.
- **Total général des chaînes à internationaliser :** **${grandTotal} chaînes** réparties sur **${totalDirtyCount} fichiers**.
- **Namespace centralisé cible :** \`vitrine.admin.*\` structuré par sous-domaine fonctionnel.

---

## 📁 Répartition des Fichiers

### ✅ Composants 100 % Conformes (0 chaîne en dur) : ${allCleanFiles.length} fichier(s)

| Fichier | Rôle architectural | Motif de conformité |
| :--- | :--- | :--- |
| \`src/components/association-settings/TabPublicContent.jsx\` | Hub d'aiguillage des accordéons éditoriaux | Composant routeur pur sans aucun libellé JSX propre |
| \`src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx\` | Accordéon Réseaux Sociaux & Newsletter | Entièrement internationalisé via les clés \`studio.newsletter.*\` |
| \`src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx\` | Configuration Newsletter & Synchronisation API Brevo | Entièrement internationalisé via les clés \`studio.newsletter.*\` |

### ⚠️ Composants contenant des textes bruts : ${allDirtyFiles.length} fichier(s) (${grandTotal} chaînes)

| Fichier | Onglet / Accordéon | Chaînes brutes |
| :--- | :--- | :---: |
| \`src/components/association-settings/TabPublicGeneral.jsx\` | Statut Général, Domaines & SEO | 36 |
| \`src/components/association-settings/blocks/LegalInfoBlock.jsx\` | Structure Juridique & Mentions Légales | 26 |
| \`src/components/association-settings/TabPublicTheme.jsx\` | Apparence Visuelle & Charte Graphique | 35 |
| \`src/components/association-settings/vitrine/HeroHeaderAccordion.jsx\` | En-tête & Accroche Hero | 23 |
| \`src/components/association-settings/vitrine/PresentationVieAccordion.jsx\` | Présentation "Qui sommes-nous" & Quotidien | 14 |
| \`src/components/association-settings/vitrine/FormulesRecrutementAccordion.jsx\` | Formules & Campagne de Recrutement | 10 |
| \`src/components/association-settings/FormulesManager.jsx\` | Gestionnaire CRUD des Formules d'Adhésion | 64 |
| \`src/components/association-settings/vitrine/ProDocsAccordion.jsx\` | Documents Espace Pro (Accordéon) | 2 |
| \`src/components/association-settings/TabPublicProDocs.jsx\` | Documents Espace Pro & Fiches Techniques | 18 |
| \`src/components/association-settings/vitrine/GallerySouvenirsAccordion.jsx\` | Galerie & Souvenirs (Accordéon) | 2 |
| \`src/components/association-settings/TabPublicGallery.jsx\` | Photothèque & Gestionnaire Visuels | 24 |
| \`src/components/association-settings/vitrine/SocialLinksBlock.jsx\` | Liens Réseaux Sociaux & Streaming | 10 |

---

## 🔍 Inventaire Exhaustif par Sous-Module

`;

for (const [subKey, sub] of Object.entries(data)) {
  md += `### 🔹 ${sub.name}\n`;
  md += `**Namespace suggéré :** \`vitrine.admin.${sub.category}.*\`  \n`;
  md += `**Volume :** ${sub.totalStrings} chaînes réparties sur ${sub.dirtyFiles.length} fichier(s) à traiter.\n\n`;

  if (sub.cleanFiles.length > 0) {
    md += `*Fichiers 100% conformes dans cette section :*\n`;
    for (const cf of sub.cleanFiles) {
      md += `- ✅ \`${cf}\`\n`;
    }
    md += `\n`;
  }

  if (sub.dirtyFiles.length > 0) {
    for (const df of sub.dirtyFiles) {
      md += `#### 📄 \`${df.file}\` (${df.count} chaînes détectées)\n\n`;
      md += `| Ligne | Contexte | Texte brut détecté | Clé suggérée sous \`vitrine.admin.*\` |\n`;
      md += `| :---: | :--- | :--- | :--- |\n`;

      for (const it of df.items) {
        const escapedText = it.text
          .replace(/\|/g, '\\|')
          .replace(/\r?\n/g, ' ')
          .substring(0, 110);
        md += `| L${it.line} | ${it.context} | \`${escapedText}\` | \`${it.suggestedKey}\` |\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n\n`;
}

md += `## 🏗️ Recommandations d'Architecture pour l'Injection i18n

### 1. Structure du Namespace \`vitrine.admin.*\`

Pour garantir une harmonie totale avec les conventions déjà appliquées sur les pôles Mestria, Studio, Trésorerie et Secrétariat, l'arbre de traduction doit respecter le découpage suivant dans \`src/locales/fr.js\` et \`src/locales/pt.js\` :

\`\`\`javascript
vitrine: {
  admin: {
    general: {
      tabPublicGeneral: { /* 36 clés */ },
      legalInfoBlock: { /* 26 clés */ }
    },
    theme: {
      tabPublicTheme: { /* 35 clés */ }
    },
    content: {
      heroHeaderAccordion: { /* 23 clés */ },
      presentationVieAccordion: { /* 14 clés */ }
    },
    recruitment: {
      formulesRecrutementAccordion: { /* 10 clés */ },
      formulesManager: { /* 64 clés */ }
    },
    proDocs: {
      proDocsAccordion: { /* 2 clés */ },
      tabPublicProDocs: { /* 18 clés */ }
    },
    gallery: {
      gallerySouvenirsAccordion: { /* 2 clés */ },
      tabPublicGallery: { /* 24 clés */ }
    },
    socialNewsletter: {
      socialLinksBlock: { /* 10 clés */ }
    }
  }
}
\`\`\`

### 2. Typologie des Chaînes à Traiter

1. **Titres et En-têtes (38 chaînes) :**
   - Titres d'accordéons Cordel (\`title\`, \`subtitle\`).
   - En-têtes de cartes et sections (\`h3\`, \`h4\`, \`legend\`).
2. **Labels de formulaires et indications (92 chaînes) :**
   - Noms de champs (\`label\`), consignes de saisie et textes d'aide.
   - Textes d'options des menus déroulants Google Fonts.
3. **Attributs interactifs (48 chaînes) :**
   - \`placeholder\` des inputs et textareas.
   - Infobulles \`title\` sur boutons d'action.
   - \`aria-label\` d'accessibilité.
4. **Textes conditionnels et badges d'état (31 chaînes) :**
   - Bascule \`🌐 EN LIGNE (PUBLIÉ)\` vs \`🚧 MODE BROUILLON (MASQUÉ)\`.
   - Boutons d'action conditionnels \`🔒 Passer en Mode Brouillon\` / \`🌍 Publier le Site Maintenant\`.
   - États d'upload et confirmations dynamiques.
5. **Modèles de configuration par défaut (45 chaînes) :**
   - Cartes modèles d'adhésion dans \`FormulesManager\` (\`DEFAULT_FORMULES\`).
   - Métadonnées des 4 documents Espace Pro (\`docsConfig\`).
   - Libellés des réseaux sociaux dans \`SocialLinksBlock\` (\`NETWORKS\`).
6. **Messages runtime (10 chaînes) :**
   - Setters d'erreur de téléversement (\`setUploadError\`).
   - Progression de compression et upload d'images (\`setUploadProgress\`).

### 3. Prochaines Étapes Opérationnelles (Hors Lecture Seule)

Lors de la future phase d'injection :
1. **Création du dictionnaire bilingue :** Générer les traductions FR et PT-BR complètes pour les 264 clés recensées dans \`scripts/audit_vitrine_admin_results.json\`.
2. **Injection des clés dans les dictionnaires :** Insérer les entrées sous \`vitrine.admin.*\` dans \`src/locales/fr.js\` et \`src/locales/pt.js\`.
3. **Remplacement chirurgical dans les 12 composants :**
   - Import de \`useTranslation\` (\`const { t } = useTranslation();\`).
   - Remplacement systématique des nœuds textuels et attributs par \`t('vitrine.admin...')\`.
   - Préservation stricte des styles CSS Cordel, bordures asymétriques et comportements Firebase.
4. **Validation automatisée :** Exécution du script d'audit pour vérifier l'obtention d'un score de 100% de fichiers propres (0 chaîne résiduelle).
`;

const reportPath = path.join(rootDir, 'AUDIT_VITRINE_ADMIN_I18N.md');
fs.writeFileSync(reportPath, md, 'utf8');
console.log(`✅ Rapport Markdown généré avec succès : AUDIT_VITRINE_ADMIN_I18N.md (${grandTotal} chaînes réparties sur ${allDirtyFiles.length} fichiers dirty et ${allCleanFiles.length} fichiers propres)`);
