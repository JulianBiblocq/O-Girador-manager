/**
 * Test de validation automatisé : Finitions de l'internationalisation du Pôle Trésorerie
 * 
 * Vérifie :
 * 1. Présence et symétrie exacte des clés sous treasury (fr.js & pt.js)
 * 2. Zéro clé orpheline entre les deux dictionnaires
 * 3. Utilisation des clés dans les composants cibles
 * 4. Absence de régressions ou de textes résiduels en dur
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetKeys = [
  'currentBankBalance',
  'operationalBalancePeriod',
  'projectedTreasury',
  'btnDeployConfig',
  'btnCollapseConfig',
  'cautionInstrumentLabel',
  'thCautionInstrument',
  'helloassoPaymentLabel',
  'entriesCount',
  'entriesCountPlural',
  'seasonSelectorLabel',
  'statusApprovedToPay',
  'statusReimbursedBadge',
  'statusRejectedBadge',
  'btnReimburseAction',
  'paidOnDateNotice',
  'rejectedStatusNotice'
];

async function runTest() {
  console.log('--- TEST FINITIONS I18N TRÉSORERIE ---');

  // 1. Charger fr.js et pt.js
  const frUrl = pathToFileURL(path.join(rootDir, 'src', 'locales', 'fr.js')).href;
  const ptUrl = pathToFileURL(path.join(rootDir, 'src', 'locales', 'pt.js')).href;
  const { fr } = await import(frUrl);
  const { pt } = await import(ptUrl);

  let errors = 0;

  // 2. Vérifier les clés cibles
  console.log('\n1. Vérification des 17 clés cibles dans fr.treasury et pt.treasury :');
  for (const key of targetKeys) {
    const frVal = fr.treasury?.[key];
    const ptVal = pt.treasury?.[key];

    if (!frVal) {
      console.error(`  ❌ [FR] Clé manquante ou vide : treasury.${key}`);
      errors++;
    }
    if (!ptVal) {
      console.error(`  ❌ [PT] Clé manquante ou vide : treasury.${key}`);
      errors++;
    }
    if (frVal && ptVal) {
      console.log(`  ✓ treasury.${key} -> FR: "${frVal}" | PT: "${ptVal}"`);
    }
  }

  // 3. Vérifier la parité globale fr / pt
  console.log('\n2. Vérification de la parité globale fr.js <-> pt.js :');
  function collectKeys(obj, prefix = '') {
    const keys = [];
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        keys.push(...collectKeys(v, full));
      } else {
        keys.push(full);
      }
    }
    return keys;
  }

  const frAllKeys = collectKeys(fr);
  const ptAllKeys = collectKeys(pt);
  const frSet = new Set(frAllKeys);
  const ptSet = new Set(ptAllKeys);

  const missingInPt = frAllKeys.filter(k => !ptSet.has(k));
  const missingInFr = ptAllKeys.filter(k => !frSet.has(k));

  console.log(`  Total clés FR : ${frAllKeys.length}`);
  console.log(`  Total clés PT : ${ptAllKeys.length}`);

  if (missingInPt.length > 0) {
    console.error(`  ❌ Clés présentes en FR mais absentes en PT (${missingInPt.length}) :`, missingInPt.slice(0, 10));
    errors++;
  }
  if (missingInFr.length > 0) {
    console.error(`  ❌ Clés présentes en PT mais absentes en FR (${missingInFr.length}) :`, missingInFr.slice(0, 10));
    errors++;
  }
  if (missingInPt.length === 0 && missingInFr.length === 0) {
    console.log('  ✓ Parité stricte 100% atteinte (0 clé orpheline).');
  }

  // 4. Vérifier les composants cibles
  console.log('\n3. Vérification de l\'utilisation dans les composants :');
  const filesToCheck = [
    {
      file: 'src/components/treasury/BankAccountsTracker.jsx',
      expectedCalls: ['treasury.currentBankBalance', 'treasury.operationalBalancePeriod', 'treasury.projectedTreasury']
    },
    {
      file: 'src/components/treasury/TreasuryCotisations.jsx',
      expectedCalls: ['treasury.btnDeployConfig', 'treasury.btnCollapseConfig', 'treasury.cautionInstrumentLabel', 'treasury.thCautionInstrument']
    },
    {
      file: 'src/components/MemberTreasuryRow.jsx',
      expectedCalls: ['treasury.cautionInstrumentLabel']
    },
    {
      file: 'src/components/treasury/TreasuryOperations.jsx',
      expectedCalls: ['treasury.entriesCount', 'treasury.entriesCountPlural', 'treasury.helloassoPaymentLabel', 'treasury.tagCotisations']
    },
    {
      file: 'src/components/ReportsExports.jsx',
      expectedCalls: ['treasury.entriesCount', 'treasury.entriesCountPlural', 'treasury.helloassoPaymentLabel', 'treasury.tagCotisations']
    },
    {
      file: 'src/components/treasury/TreasuryExpenseClaims.jsx',
      expectedCalls: [
        'treasury.seasonSelectorLabel',
        'treasury.statusApprovedToPay',
        'treasury.statusReimbursedBadge',
        'treasury.statusRejectedBadge',
        'treasury.btnReimburseAction',
        'treasury.paidOnDateNotice',
        'treasury.rejectedStatusNotice'
      ],
      forbiddenSubstrings: [
        '🟢 Remboursée',
        '🔵 Validée (à payer)',
        '🔴 Refusée',
        '💸 Rembourser',
        '📅 Saison :'
      ]
    }
  ];

  for (const { file, expectedCalls, forbiddenSubstrings } of filesToCheck) {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) {
      console.error(`  ❌ Fichier introuvable : ${file}`);
      errors++;
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');

    for (const key of expectedCalls) {
      if (!content.includes(key)) {
        console.error(`  ❌ Appel manquant dans ${file} : "${key}"`);
        errors++;
      } else {
        console.log(`  ✓ ${file} inclut "${key}"`);
      }
    }

    if (forbiddenSubstrings) {
      for (const forbidden of forbiddenSubstrings) {
        if (content.includes(forbidden)) {
          console.error(`  ❌ Texte en dur résiduel dans ${file} : "${forbidden}"`);
          errors++;
        }
      }
    }
  }

  if (errors > 0) {
    console.error(`\n❌ ÉCHEC DU TEST : ${errors} erreur(s) détectée(s).`);
    process.exit(1);
  } else {
    console.log('\n✅ TOUS LES CONTRÔLES SONT VALIDES (0 erreur).');
    process.exit(0);
  }
}

runTest().catch(err => {
  console.error("Erreur d'exécution du test :", err);
  process.exit(1);
});
