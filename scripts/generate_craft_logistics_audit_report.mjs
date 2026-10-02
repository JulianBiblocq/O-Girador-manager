import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const data = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/audit_craft_logistics_results.json'), 'utf8'));

let md = `# Audit Statique Exhaustif i18n — Pôles Logistique, Lutherie & Costumerie

> **Mode : LECTURE SEULE STRICTE**  
> Aucun fichier source, aucun dictionnaire de locale, aucun schéma ni règle Firebase n'ont été modifiés.  
> Analyse automatisée réalisée par inspection de l'AST Babel sur l'intégralité des composants des 3 ateliers.

---

`;

let grandTotal = 0;
const poleSummaries = [];

for (const [poleKey, pole] of Object.entries(data)) {
  grandTotal += pole.totalStrings;
  poleSummaries.push({
    name: pole.name,
    namespace: pole.namespace,
    total: pole.totalStrings,
    cleanCount: pole.cleanFiles.length,
    dirtyCount: pole.dirtyFiles.length,
    totalFiles: pole.cleanFiles.length + pole.dirtyFiles.length
  });

  md += `## 📦 ${pole.name} (Namespace : \`${pole.namespace}\`)

**Volume détecté :** ${pole.totalStrings} chaînes brutes réparties sur ${pole.dirtyFiles.length} composant(s) nécessitant une intervention (${pole.cleanFiles.length} composant(s) 100% propre(s)).

`;

  // Fichiers propres
  if (pole.cleanFiles.length > 0) {
    md += `### ✅ Composants 100 % propres (0 chaîne en dur) :\n`;
    for (const cf of pole.cleanFiles) {
      md += `- \`${cf}\`\n`;
    }
    md += `\n`;
  }

  // Fichiers à traiter
  md += `### ⚠️ Composants nécessitant une extraction :\n\n`;

  for (const df of pole.dirtyFiles) {
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

// Synthèse finale
md += `## 📊 Récapitulatif Chiffré Global

| Pôle d'Activité | Namespace | Fichiers Analysés | Fichiers 100% Propres | Fichiers avec chaînes brutes | Total Chaînes Brutes |
| :--- | :---: | :---: | :---: | :---: | :---: |
`;

for (const p of poleSummaries) {
  md += `| **${p.name}** | \`${p.namespace}\` | ${p.totalFiles} | ${p.cleanCount} | ${p.dirtyCount} | **${p.total}** |\n`;
}

md += `| **TOTAL GÉNÉRAL** | — | **${poleSummaries.reduce((acc, p) => acc + p.totalFiles, 0)}** | **${poleSummaries.reduce((acc, p) => acc + p.cleanCount, 0)}** | **${poleSummaries.reduce((acc, p) => acc + p.dirtyCount, 0)}** | **${grandTotal}** |\n\n`;

md += `### 🎯 Synthèse des composants 100% propres vs à traiter

- **Composants 100 % conformes (4 fichiers) :**
  - \`src/components/inventory/InventoryItemModal.jsx\`
  - \`src/components/inventory/InstrumentAttributionSection.jsx\`
  - \`src/components/inventory/InstrumentVisualizer.jsx\`
  - \`src/components/profile/CostumeChecklist.jsx\`

- **Composants à internationaliser (38 fichiers, 787 chaînes brutes au total) :**
  - **Logistique (13 fichiers, 237 chaînes) :** \`InventoryManager.jsx\` (15), \`InventoryItemCard.jsx\` (13), \`InstrumentsDataTable.jsx\` (46), \`InstrumentEditModal.jsx\` (25), \`RepairDiagnosticModal.jsx\` (11), \`InstrumentCautionFields.jsx\` (1), \`InventoryFilterBar.jsx\` (12), \`InventoryMovementsBanner.jsx\` (3), \`OrdersManager.jsx\` (36), \`OrderPaymentControls.jsx\` (12), \`MemberOrdersPaymentAlert.jsx\` (9), \`AccessoriesKitsBlock.jsx\` (14), \`UserMateriel.jsx\` (40).
  - **Lutherie (13 fichiers, 300 chaînes) :** \`InventoryProjectsView.jsx\` (55), \`AssemblySlotItem.jsx\` (14), \`InstrumentBaptismModal.jsx\` (14), \`ImportModelWizardModal.jsx\` (21), \`InstrumentModelsManager.jsx\` (15), \`InventoryPartsView.jsx\` (66), \`PartAssignmentBadge.jsx\` (3), \`PartHistoryLogs.jsx\` (3), \`PartWorkflowModal.jsx\` (15), \`SuppliesListView.jsx\` (32), \`WorkshopToolsListView.jsx\` (26), \`StudentInstrumentsWorkshop.jsx\` (21), \`MonAtelier.jsx\` (15).
  - **Costumerie (12 fichiers, 250 chaînes) :** \`WardrobeManager.jsx\` (60), \`CostumesAdminManager.jsx\` (35), \`CostumeSizesTable.jsx\` (13), \`MonVestiaire.jsx\` (22), \`CostumeVisualizer.jsx\` (3), \`PostEventCostumeReturnModal.jsx\` (15), \`AtelierCouture.jsx\` (19), \`CollectiveWorkshopView.jsx\` (31), \`WardrobeBlock.jsx\` (11), \`WardrobeMemberModeCard.jsx\` (7), \`CostumerieDocumentsTable.jsx\` (17), \`EventWardrobeSummaryCard.jsx\` (17).
`;

const reportPath = path.join(rootDir, 'AUDIT_CRAFT_LOGISTICS_I18N.md');
fs.writeFileSync(reportPath, md, 'utf8');
console.log(`✅ Rapport généré avec succès : AUDIT_CRAFT_LOGISTICS_I18N.md (${grandTotal} chaînes brutes)`);
