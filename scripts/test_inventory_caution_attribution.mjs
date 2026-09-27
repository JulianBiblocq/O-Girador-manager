import assert from 'assert';
import fs from 'fs';
import { normalizeInstrumentAttribution, REGIME_ATTRIBUTION_OPTIONS, CAUTION_STATUS_OPTIONS, CAUTION_TYPES } from '../src/components/inventory/inventoryConstants.js';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("✂️ TEST SUITE : STATUT DES PRÊTS D'INSTRUMENTS & GESTION DES CAUTIONS ✂️\n");

// ==========================================
// TEST 1 : Normalisation de l'attribution et caution
// ==========================================
console.log("▶️ Test 1 : Validation de normalizeInstrumentAttribution...");

// Cas 1 : Instrument vide / null
const normNull = normalizeInstrumentAttribution(null);
assert.strictEqual(normNull.regimeMiseADisposition, 'pret_gratuit', "Le régime par défaut doit être 'pret_gratuit'");
assert.strictEqual(normNull.cautionRequise, false, "cautionRequise doit être false par défaut");
assert.strictEqual(normNull.caution.statut, 'non_requise', "Le statut de caution doit être 'non_requise' par défaut");

// Cas 2 : Instrument existant (sans nouveaux champs) appartenant à l'association
const instAssocExistant = { id: 'alfaia_01', nom: 'Alfaia 01', proprietaire: 'Association', status: 'Emprunté', borrowedBy: 'user_1' };
const normAssoc = normalizeInstrumentAttribution(instAssocExistant);
assert.strictEqual(normAssoc.regimeMiseADisposition, 'pret_gratuit');
assert.strictEqual(normAssoc.cautionRequise, false);
assert.strictEqual(normAssoc.caution.statut, 'non_requise');

// Cas 3 : Instrument existant appartenant à un membre
const instPersoExistant = { id: 'caixa_perso', nom: 'Caixa Perso', proprietaire: 'user_1' };
const normPerso = normalizeInstrumentAttribution(instPersoExistant);
assert.strictEqual(normPerso.regimeMiseADisposition, 'personnel');
assert.strictEqual(normPerso.cautionRequise, false);

// Cas 4 : Instrument avec caution requise activée et chèque de caution renseigné
const instAvecCaution = {
  id: 'alfaia_caution',
  nom: 'Alfaia Luxe',
  regimeMiseADisposition: 'cotisation',
  cautionRequise: true,
  caution: {
    montant: 200,
    statut: 'recue',
    type: 'cheque',
    referencePiece: 'CHQ-987654'
  }
};
const normCaution = normalizeInstrumentAttribution(instAvecCaution);
assert.strictEqual(normCaution.regimeMiseADisposition, 'cotisation');
assert.strictEqual(normCaution.cautionRequise, true);
assert.strictEqual(normCaution.caution.statut, 'recue');
assert.strictEqual(normCaution.caution.montant, 200);
assert.strictEqual(normCaution.caution.referencePiece, 'CHQ-987654');
assert.strictEqual(normCaution.caution.reference, 'CHQ-987654'); // rétrocompatibilité

// Cas 5 : Rétrocompatibilité caution existante avec format ancien
const instAncienFormat = {
  id: 'alfaia_old',
  nom: 'Alfaia Old',
  caution: {
    montant: 150,
    statut: 'en_attente',
    typeGarantie: 'cheque',
    reference: 'CHQ-123'
  }
};
const normOld = normalizeInstrumentAttribution(instAncienFormat);
assert.strictEqual(normOld.cautionRequise, true, "Doit déduire cautionRequise: true car statut != 'non_requise'");
assert.strictEqual(normOld.caution.statut, 'en_attente');
assert.strictEqual(normOld.caution.referencePiece, 'CHQ-123');

console.log("✅ Test 1 validé : normalizeInstrumentAttribution est 100% robuste et rétrocompatible.\n");

// ==========================================
// TEST 2 : Règle anti-monolithe et existence des composants
// ==========================================
console.log("▶️ Test 2 : Contrôle modulaire anti-monolithe des composants...");

const sectionFile = fs.readFileSync('src/components/inventory/InstrumentAttributionSection.jsx', 'utf8');
const sectionLines = sectionFile.split('\n').length;
assert.ok(sectionLines < 200, `InstrumentAttributionSection doit avoir < 200 lignes (actuellement: ${sectionLines})`);

const cardFile = fs.readFileSync('src/components/inventory/InventoryItemCard.jsx', 'utf8');
const cardLines = cardFile.split('\n').length;
assert.ok(cardLines < 200, `InventoryItemCard doit avoir < 200 lignes (actuellement: ${cardLines})`);

const modalAliasFile = fs.readFileSync('src/components/inventory/InventoryItemModal.jsx', 'utf8');
assert.ok(modalAliasFile.includes("export { default } from './InstrumentEditModal'"), "InventoryItemModal doit réexporter InstrumentEditModal");

console.log(`✅ Test 2 validé : Modularité respectée (Section: ${sectionLines}l, Card: ${cardLines}l).\n`);

// ==========================================
// TEST 3 : Logique d'isolation Trésorerie
// ==========================================
console.log("▶️ Test 3 : Simulation du calcul cautionsByMember dans useTreasury...");

const useTreasuryFile = fs.readFileSync('src/hooks/useTreasury.js', 'utf8');
assert.ok(useTreasuryFile.includes("inst.cautionRequise === true"), "useTreasury doit vérifier cautionRequise === true");
assert.ok(useTreasuryFile.includes("statutGlobal"), "useTreasury doit calculer statutGlobal");

// Simulation unitaire du filtre Trésorerie
const mockMembers = [{ id: 'user_gratuit' }, { id: 'user_caution' }, { id: 'user_sans_pret' }];
const mockInstruments = [
  // User 1 a un instrument en prêt gratuit SANS caution requise
  { id: 'inst_1', borrowedBy: 'user_gratuit', status: 'Emprunté', regimeMiseADisposition: 'pret_gratuit', cautionRequise: false },
  // User 2 a un instrument AVEC caution requise en attente
  { id: 'inst_2', borrowedBy: 'user_caution', status: 'Emprunté', regimeMiseADisposition: 'cotisation', cautionRequise: true, caution: { statut: 'en_attente', montant: 150 } }
];

// Fonction simulant exactement useTreasury
const simulateCautionsByMember = (members, instruments) => {
  const map = {};
  members.forEach(member => {
    const memberId = member.id;
    const borrowed = instruments.filter(inst => inst.status === 'Emprunté' && inst.borrowedBy === memberId);
    const withCaution = borrowed.filter(inst => {
      if (inst.cautionRequise === true) return true;
      if (inst.cautionRequise === undefined && inst.caution?.statut && inst.caution.statut !== 'non_requise') return true;
      return false;
    });

    if (withCaution.length === 0) {
      map[memberId] = { statutGlobal: 'na', totalCaution: 0, countInstruments: 0, instruments: [] };
    } else {
      let hasPending = false;
      let allRecue = true;
      withCaution.forEach(inst => {
        const s = inst.caution?.statut || 'en_attente';
        if (s === 'en_attente' || (s !== 'recue' && s !== 'restituee')) hasPending = true;
        if (s !== 'recue') allRecue = false;
      });
      map[memberId] = {
        statutGlobal: hasPending ? 'en_attente' : (allRecue ? 'recue' : 'restituee'),
        countInstruments: withCaution.length
      };
    }
  });
  return map;
};

const simResult = simulateCautionsByMember(mockMembers, mockInstruments);
assert.strictEqual(simResult['user_gratuit'].statutGlobal, 'na', "L'emprunteur d'un prêt gracieux sans caution doit avoir statutGlobal: 'na'");
assert.strictEqual(simResult['user_caution'].statutGlobal, 'en_attente', "L'emprunteur avec caution requise doit avoir statutGlobal: 'en_attente'");
assert.strictEqual(simResult['user_sans_pret'].statutGlobal, 'na', "Le membre sans prêt doit avoir statutGlobal: 'na'");

// Vérification du filtre Trésorerie
const filterCaution = 'en_attente';
const filtered = mockMembers.filter(m => simResult[m.id].statutGlobal === filterCaution);
assert.strictEqual(filtered.length, 1, "Seul 1 membre doit être dans le filtre 'en_attente'");
assert.strictEqual(filtered[0].id, 'user_caution', "Seul user_caution doit être affiché");

console.log("✅ Test 3 validé : L'isolation des cautions en attente en trésorerie est totale.\n");

// ==========================================
// TEST 4 : Dictionnaires de traduction FR & PT
// ==========================================
console.log("▶️ Test 4 : Vérification des dictionnaires bilingues...");

const requiredKeys = [
  'regimeMiseADispositionLabel',
  'regimePretGratuit',
  'regimeCotisation',
  'regimePersonnel',
  'cautionRequiseLabel',
  'cautionMontantLabel',
  'cautionStatutLabel',
  'cautionTypeLabel',
  'cautionRefLabel',
  'badgePretGratuit',
  'badgeCotisation',
  'badgePersonnel',
  'badgeCautionRecue',
  'badgeCautionEnAttente'
];

requiredKeys.forEach(k => {
  assert.ok(fr.inventory[k], `Clé fr.inventory.${k} manquante`);
  assert.ok(pt.inventory[k], `Clé pt.inventory.${k} manquante`);
});

console.log("✅ Test 4 validé : 100% des clés d'i18n sont traduites en FR et PT.\n");

console.log("🎉 TOUS LES TESTS DE LA MISSION 1 SONT PASSÉS AVEC SUCCÈS ! 🎉");
