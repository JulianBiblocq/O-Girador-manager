import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const data = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/audit_mestre_results.json'), 'utf8'));

let md = `# Audit Statique Exhaustif i18n — Pôle Mestria (Direction Artistique)

> **Mode : LECTURE SEULE STRICTE**  
> Aucun fichier source, aucun dictionnaire de locale, aucun schéma ni règle Firebase n'ont été modifiés.  
> Analyse automatisée réalisée par inspection de l'AST Babel sur l'intégralité des composants du Pôle Mestria.

---

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

  md += `## 🎭 ${sub.name} (Catégorie : \`${sub.category}\` ➔ \`mestre.${sub.category}.*\`)\n\n`;
  md += `**Volume détecté :** ${sub.totalStrings} chaînes brutes réparties sur ${sub.dirtyFiles.length} composant(s) nécessitant une intervention (${sub.cleanFiles.length} composant(s) 100% conforme(s)).\n\n`;

  // Fichiers propres
  if (sub.cleanFiles.length > 0) {
    md += `### ✅ Composants 100 % conformes (0 chaîne en dur) :\n`;
    for (const cf of sub.cleanFiles) {
      md += `- \`${cf}\`\n`;
    }
    md += `\n`;
  }

  // Fichiers à traiter
  if (sub.dirtyFiles.length > 0) {
    md += `### ⚠️ Composants contenant des textes bruts :\n\n`;

    for (const df of sub.dirtyFiles) {
      md += `#### 📄 \`${df.file}\` (${df.count} chaînes brutes)\n\n`;
      md += `| Ligne | Contexte | Texte brut détecté | Clé suggérée |\n`;
      md += `| :---: | :--- | :--- | :--- |\n`;

      for (const it of df.items) {
        const escapedText = it.text
          .replace(/\|/g, '\\|')
          .replace(/\n/g, ' ')
          .substring(0, 100);
        md += `| L${it.line} | ${it.context} | \`${escapedText}\` | \`${it.suggestedKey}\` |\n`;
      }
      md += `\n---\n\n`;
    }
  }
}

// Synthèse chiffrée globale
md += `## 📊 Récapitulatif Chiffré Global — Pôle Mestria

| Sous-Module Mestria | Catégorie / Préfixe | Fichiers Inspectés | Fichiers 100% Conformes | Fichiers avec textes bruts | Total Chaînes Brutes |
| :--- | :---: | :---: | :---: | :---: | :---: |
`;

for (const s of subSummaries) {
  md += `| **${s.name}** | \`mestre.${s.category}\` | ${s.totalFiles} | ${s.cleanCount} | ${s.dirtyCount} | **${s.total}** |\n`;
}

md += `| **TOTAL PÔLE MESTRIA** | — | **${subSummaries.reduce((acc, s) => acc + s.totalFiles, 0)}** | **${subSummaries.reduce((acc, s) => acc + s.cleanCount, 0)}** | **${subSummaries.reduce((acc, s) => acc + s.dirtyCount, 0)}** | **${grandTotal}** |\n\n`;

md += `### 🎯 Synthèse des composants 100% conformes vs à traiter

- **Composants 100 % conformes (${allCleanFiles.length} fichier(s)) :**
`;

if (allCleanFiles.length === 0) {
  md += `  *(Aucun fichier entièrement vierge de texte brut dans le périmètre initial analysé)*\n`;
} else {
  for (const cf of allCleanFiles) {
    md += `  - \`${cf}\`\n`;
  }
}

md += `
- **Composants à internationaliser (${allDirtyFiles.length} fichiers, ${grandTotal} chaînes brutes au total) :**
`;

for (const df of allDirtyFiles) {
  md += `  - \`${df.file}\` (${df.count} chaînes brutes)\n`;
}

const reportPath = path.join(rootDir, 'AUDIT_MESTRIA_I18N.md');
fs.writeFileSync(reportPath, md, 'utf8');
console.log(`✅ Rapport Markdown généré avec succès : AUDIT_MESTRIA_I18N.md (${grandTotal} chaînes brutes réparties sur ${allDirtyFiles.length} fichiers)`);
