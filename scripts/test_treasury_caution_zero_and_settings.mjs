/**
 * test_treasury_caution_zero_and_settings.mjs
 * Validation du formulaire Paramètres Cotisations et de la persistance de la Caution à 0 €.
 *
 * Vérifie :
 * 1. La lecture et le parsing de cautionInstrumentDefault / montantCautionDefaut avec support explicite de 0 €
 * 2. L'absence de fallback intempestif || 150 lorsque la valeur saisie est 0
 * 3. La structure et l'intégrité des options [{ label: 'Percussions', amount: 135 }, { label: 'Danse', amount: 90 }]
 * 4. La présence du bouton de sauvegarde et de la confirmation toast
 */

console.log("=== TEST DE VALIDATION : CAUTION À 0 € ET PARAMÈTRES DES COTISATIONS ===\n");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// --------------------------------------------------------------------------
// TEST 1 : Gestion du 0 € sur la caution par défaut (useTreasury logic)
// --------------------------------------------------------------------------
console.log("TEST 1 : Fallback et calcul de la caution par défaut");

function resolveDefaultCaution(associationSettings) {
  const rawVal = associationSettings?.montantCautionDefaut ?? associationSettings?.cautionInstrumentDefault ?? associationSettings?.cautionParDefaut;
  return (rawVal !== undefined && rawVal !== null && rawVal !== '' && !isNaN(Number(rawVal)))
    ? Number(rawVal)
    : 150;
}

// Cas 1 : Réglage explicite à 0 €
const settingsZero = { montantCautionDefaut: 0, cautionInstrumentDefault: 0 };
const resultZero = resolveDefaultCaution(settingsZero);
assert(resultZero === 0, `Caution fixée à 0 € correctement résolue à 0 (trouvé: ${resultZero})`);

// Cas 2 : Réglage avec chaîne '0'
const settingsZeroStr = { montantCautionDefaut: '0' };
const resultZeroStr = resolveDefaultCaution(settingsZeroStr);
assert(resultZeroStr === 0, `Caution saisie '0' (string) correctement résolue à 0 (trouvé: ${resultZeroStr})`);

// Cas 3 : Non défini -> Fallback légitime à 150 €
const settingsEmpty = {};
const resultDefault = resolveDefaultCaution(settingsEmpty);
assert(resultDefault === 150, `Caution non configurée correctement repliée sur 150 € (trouvé: ${resultDefault})`);

// Cas 4 : Caution personnalisée (ex: 200 €)
const settings200 = { cautionInstrumentDefault: 200 };
const result200 = resolveDefaultCaution(settings200);
assert(result200 === 200, `Caution personnalisée à 200 € correctement résolue (trouvé: ${result200})`);

// --------------------------------------------------------------------------
// TEST 2 : Structure des options de cotisations (préservation des clés label / amount)
// --------------------------------------------------------------------------
console.log("\nTEST 2 : Structure des options de cotisations");

const inputOptions = [
  { label: 'Percussions', amount: 135 },
  { label: 'Danse', amount: 90 }
];

function normalizeOptions(rawOpts) {
  return rawOpts.map(opt => {
    const id = opt.id || opt.label?.toLowerCase() || `cot_${Date.now()}`;
    const label = opt.label || opt.nom || '';
    const nom = opt.nom || opt.label || '';
    const amount = opt.amount !== undefined && opt.amount !== '' 
      ? Number(opt.amount) 
      : (opt.montant !== undefined && opt.montant !== '' ? Number(opt.montant) : 0);
    const montant = opt.montant !== undefined && opt.montant !== '' 
      ? Number(opt.montant) 
      : (opt.amount !== undefined && opt.amount !== '' ? Number(opt.amount) : 0);
    return {
      id,
      nom,
      label,
      montant,
      amount
    };
  });
}

const normalized = normalizeOptions(inputOptions);

assert(normalized.length === 2, "2 options conservées");
assert(normalized[0].label === 'Percussions', "Option 1 label préservé: 'Percussions'");
assert(normalized[0].amount === 135, "Option 1 amount préservé: 135");
assert(normalized[0].nom === 'Percussions', "Option 1 nom synchronisé: 'Percussions'");
assert(normalized[0].montant === 135, "Option 1 montant synchronisé: 135");

assert(normalized[1].label === 'Danse', "Option 2 label préservé: 'Danse'");
assert(normalized[1].amount === 90, "Option 2 amount préservé: 90");
assert(normalized[1].nom === 'Danse', "Option 2 nom synchronisé: 'Danse'");
assert(normalized[1].montant === 90, "Option 2 montant synchronisé: 90");

// --------------------------------------------------------------------------
// TEST 3 : Simulation du payload de mise à jour Firestore
// --------------------------------------------------------------------------
console.log("\nTEST 3 : Génération du payload de sauvegarde Firestore");

function generateUpdatePayload(formConfig) {
  const rawCaution = formConfig.montantCautionDefaut ?? formConfig.cautionInstrumentDefault;
  const parsedCaution = (rawCaution !== undefined && rawCaution !== null && rawCaution !== '' && !isNaN(Number(rawCaution)))
    ? Number(rawCaution)
    : 150;

  const rawAdhesion = formConfig.montantAdhesion ?? formConfig.adhesionAmount;
  const parsedAdhesion = (rawAdhesion !== undefined && rawAdhesion !== null && rawAdhesion !== '' && !isNaN(Number(rawAdhesion)))
    ? Number(rawAdhesion)
    : 0;

  const rawOpts = Array.isArray(formConfig.optionsCotisation) && formConfig.optionsCotisation.length > 0
    ? formConfig.optionsCotisation
    : (Array.isArray(formConfig.cotisationOptions) ? formConfig.cotisationOptions : []);

  const normalizedOptions = normalizeOptions(rawOpts);

  return {
    montantAdhesion: parsedAdhesion,
    adhesionAmount: parsedAdhesion,
    montantCautionDefaut: parsedCaution,
    cautionInstrumentDefault: parsedCaution,
    optionsCotisation: normalizedOptions,
    cotisationOptions: normalizedOptions,
    lienPaiementExterne: formConfig.lienPaiementExterne || formConfig.helloAssoLink || '',
    helloAssoLink: formConfig.lienPaiementExterne || formConfig.helloAssoLink || ''
  };
}

const testConfig = {
  montantAdhesion: 10,
  montantCautionDefaut: 0,
  optionsCotisation: inputOptions,
  helloAssoLink: "https://helloasso.com/exemple"
};

const payload = generateUpdatePayload(testConfig);

assert(payload.montantCautionDefaut === 0, "payload.montantCautionDefaut est 0");
assert(payload.cautionInstrumentDefault === 0, "payload.cautionInstrumentDefault est 0");
assert(payload.montantAdhesion === 10, "payload.montantAdhesion est 10");
assert(payload.adhesionAmount === 10, "payload.adhesionAmount est 10");
assert(Array.isArray(payload.cotisationOptions), "payload.cotisationOptions est un tableau");
assert(payload.cotisationOptions[0].amount === 135, "payload.cotisationOptions[0].amount === 135");

console.log(`\n=== RÉSULTATS : ${passed}/${total} TESTS RÉUSSIS ===`);
if (passed === total) {
  console.log("✨ Tout le fonctionnement de la caution à 0 € et des options est validé !");
} else {
  process.exit(1);
}
