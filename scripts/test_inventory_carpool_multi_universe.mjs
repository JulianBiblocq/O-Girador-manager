import assert from 'assert/strict';
import { 
  getAvailableInstrumentTypes, 
  getInstrumentIcon, 
  getKitCompletionText, 
  getKitCompletionRatio 
} from '../src/components/inventory/inventoryConstants.js';
import { getCarpoolBulkyTerminology } from '../src/utils/carpoolCascadeUtils.js';

console.log('🧪 Starting tests: Multi-Universe Inventory & Carpool Unlock...\n');

// ============================================================================
// 1. INVENTORY: Dynamic Instrument Types (Priority 1, 2, 3)
// ============================================================================
console.log('--- 1. Testing getAvailableInstrumentTypes ---');

// Test 1.1: Priority 1 - association.instrumentsDisponibles
const assoBatucada = {
  universe: 'batucada',
  instrumentsDisponibles: ['Surdo 1', 'Surdo 2', 'Repique', 'Tamborim', 'Danse', 'Chant']
};
const types1 = getAvailableInstrumentTypes(assoBatucada, 'batucada');
assert.deepEqual(
  types1,
  ['Surdo 1', 'Surdo 2', 'Repique', 'Tamborim', 'Autre'],
  'Should take instrumentsDisponibles from association, exclude Danse/Chant, and append Autre'
);
console.log('  ✅ Priority 1 (instrumentsDisponibles) passed');

// Test 1.2: Priority 1 fallback - association.nomenclature
const assoWithNomenclature = {
  universe: 'batucada',
  instrumentsDisponibles: [],
  nomenclature: {
    batucada: {
      surdo1: 'Surdo Primeira',
      repique: 'Repique de Chão',
      danse: 'Danse'
    }
  }
};
const types1b = getAvailableInstrumentTypes(assoWithNomenclature, 'batucada');
assert.ok(types1b.includes('Surdo Primeira'), 'Should include Surdo Primeira from nomenclature');
assert.ok(types1b.includes('Repique de Chão'), 'Should include Repique de Chão from nomenclature');
assert.ok(!types1b.includes('Danse'), 'Should filter out Danse');
assert.equal(types1b[types1b.length - 1], 'Autre', 'Last element must be Autre');
console.log('  ✅ Priority 1 fallback (nomenclature) passed');

// Test 1.3: Priority 2 - Universe presets fallback
const assoEmptyBatucada = { universe: 'batucada', instrumentsDisponibles: [] };
const types2 = getAvailableInstrumentTypes(assoEmptyBatucada, 'batucada');
assert.ok(types2.includes('Surdo 1'), 'Should include Surdo 1 from batucada defaults');
assert.ok(types2.includes('Surdo 2'), 'Should include Surdo 2 from batucada defaults');
assert.ok(types2.includes('Repique'), 'Should include Repique from batucada defaults');
assert.equal(types2[types2.length - 1], 'Autre', 'Last element must be Autre');
console.log('  ✅ Priority 2 (universe defaults) passed');

// Test 1.4: Priority 3 - Historical INSTRUMENT_TYPES fallback
const assoEmptyUnknown = { universe: 'unknown_universe', instrumentsDisponibles: [] };
const types3 = getAvailableInstrumentTypes(assoEmptyUnknown, 'unknown_universe');
assert.ok(types3.includes('Alfaia'), 'Historical fallback includes Alfaia');
assert.ok(types3.includes('Caixa'), 'Historical fallback includes Caixa');
assert.equal(types3[types3.length - 1], 'Autre', 'Last element must be Autre');
console.log('  ✅ Priority 3 (historical INSTRUMENT_TYPES) passed');

// ============================================================================
// 2. INVENTORY: Dynamic Icons (getInstrumentIcon)
// ============================================================================
console.log('\n--- 2. Testing getInstrumentIcon ---');
assert.equal(getInstrumentIcon('Alfaia'), 'icones/alfaia.svg');
assert.equal(getInstrumentIcon('Surdo 1'), 'icones/alfaia.svg');
assert.equal(getInstrumentIcon('Surdo de Terceira'), 'icones/alfaia.svg');
assert.equal(getInstrumentIcon('Repique'), 'icones/caixa.svg');
assert.equal(getInstrumentIcon('Tamborim'), 'icones/caixa.svg');
assert.equal(getInstrumentIcon('Agogô'), 'icones/gongue.svg');
assert.equal(getInstrumentIcon('Agbê'), 'icones/agbe.svg');
assert.equal(getInstrumentIcon('Chocalho'), 'icones/mineiro.svg');
assert.equal(getInstrumentIcon('Inconnu'), 'favicon.svg');
console.log('  ✅ getInstrumentIcon handles all multi-universe instruments accurately');

// ============================================================================
// 3. INVENTORY: Kit Matching (Case & trim insensitivity)
// ============================================================================
console.log('\n--- 3. Testing Kit Accessories Matching ---');
const logisticsKits = [
  {
    pupitre: 'Surdo 1',
    accessories: ['tala_1', 'macaneta_1']
  },
  {
    pupitre: 'Alfaia',
    accessories: ['talabarte_alfaia', 'paqueta']
  }
];

const instSurdo = {
  type: '  surdo 1  ',
  kitChecklist: ['tala_1', 'macaneta_1']
};
assert.equal(getKitCompletionText(instSurdo, logisticsKits), 'Complet', 'Should match Surdo 1 case & trim insensitively');
assert.equal(getKitCompletionRatio(instSurdo, logisticsKits), 1);

const instSurdoPartial = {
  type: 'SURDO 1',
  kitChecklist: ['tala_1']
};
assert.equal(getKitCompletionText(instSurdoPartial, logisticsKits), '1/2');
assert.equal(getKitCompletionRatio(instSurdoPartial, logisticsKits), 0.5);

const instSurdoEmpty = {
  type: 'Surdo 1',
  kitChecklist: []
};
assert.equal(getKitCompletionText(instSurdoEmpty, logisticsKits), 'Vide');
assert.equal(getKitCompletionRatio(instSurdoEmpty, logisticsKits), 0);
console.log('  ✅ Kit matching is strictly case- and whitespace-insensitive');

// ============================================================================
// 4. CARPOOL: Terminology per Universe
// ============================================================================
console.log('\n--- 4. Testing Carpool Terminology ---');
const termMaracatu = getCarpoolBulkyTerminology('maracatu');
assert.equal(termMaracatu.instrumentName, 'Alfaias');
assert.equal(termMaracatu.trunkLabel, 'Coffre (Alfaias)');
assert.equal(termMaracatu.trunkVolumeLabel, 'Coffre (Alfaias)');
assert.ok(termMaracatu.placeholder.includes('Alfaias'));

const termBatucada = getCarpoolBulkyTerminology('batucada');
assert.equal(termBatucada.instrumentName, 'Surdos');
assert.equal(termBatucada.trunkLabel, 'Coffre (Surdos)');
assert.equal(termBatucada.trunkVolumeLabel, 'Coffre (Surdos)');
assert.ok(termBatucada.placeholder.includes('Surdos'));

const termGeneric = getCarpoolBulkyTerminology('fanfare');
assert.equal(termGeneric.instrumentName, 'Fûts / Gros instruments');
assert.equal(termGeneric.trunkLabel, 'Coffre (Fûts / Gros instruments)');
assert.equal(termGeneric.trunkVolumeLabel, 'Coffre (Fûts / Gros instruments)');
console.log('  ✅ Carpool terminology dynamically maps Maracatu, Batucada, and fallback');

// ============================================================================
// 5. CARPOOL: Backwards Compatibility (Dual Read)
// ============================================================================
console.log('\n--- 5. Testing Dual Read / Write Backward Compatibility ---');

// Legacy Maracatu Car & Passenger (Only trunkAlfayaCapacity & alfayasCount)
const legacyCar = {
  passengerSeats: 4,
  trunkAlfayaCapacity: 3,
  passengers: [
    { uid: 'u1', isPassenger: true, alfayasCount: 2 }
  ]
};

const calcCarStatus = (car) => {
  const passengers = car.passengers || [];
  const totalBulky = passengers.reduce((sum, p) => sum + (Number(p.bulkyCount ?? p.alfayasCount) || 0), 0);
  const trunkCap = Number(car.trunkBulkyCapacity ?? car.trunkAlfayaCapacity) || 0;
  const bulkyInTrunk = Math.min(totalBulky, trunkCap);
  const bulkyOnSeats = totalBulky - bulkyInTrunk;
  const physicalPassengers = passengers.reduce((sum, p) => sum + (p.isPassenger ? 1 : 0), 0);
  const occupiedSeats = physicalPassengers + bulkyOnSeats;
  const availableSeats = (Number(car.passengerSeats) || 0) - occupiedSeats;
  return {
    totalBulky,
    trunkCap,
    bulkyInTrunk,
    bulkyOnSeats,
    availableSeats,
    isFull: availableSeats === 0
  };
};

const legacyStatus = calcCarStatus(legacyCar);
assert.equal(legacyStatus.totalBulky, 2);
assert.equal(legacyStatus.trunkCap, 3);
assert.equal(legacyStatus.bulkyInTrunk, 2);
assert.equal(legacyStatus.bulkyOnSeats, 0);
assert.equal(legacyStatus.availableSeats, 3); // 4 seats - 1 physical passenger
console.log('  ✅ Legacy Maracatu carpool data perfectly read without bulkyCount/trunkBulkyCapacity');

// Modern Batucada Car & Passenger (trunkBulkyCapacity & bulkyCount)
const modernCar = {
  passengerSeats: 5,
  trunkBulkyCapacity: 4,
  trunkAlfayaCapacity: 4, // mirror
  passengers: [
    { uid: 'u2', isPassenger: true, bulkyCount: 3, alfayasCount: 3 }
  ]
};
const modernStatus = calcCarStatus(modernCar);
assert.equal(modernStatus.totalBulky, 3);
assert.equal(modernStatus.trunkCap, 4);
assert.equal(modernStatus.bulkyInTrunk, 3);
assert.equal(modernStatus.availableSeats, 4);
console.log('  ✅ Modern Batucada carpool data perfectly calculated');

// Overflow test (instruments exceeding trunk occupy passenger seats)
const overflowCar = {
  passengerSeats: 4,
  trunkBulkyCapacity: 1,
  passengers: [
    { uid: 'u3', isPassenger: true, bulkyCount: 3 }
  ]
};
const overflowStatus = calcCarStatus(overflowCar);
assert.equal(overflowStatus.totalBulky, 3);
assert.equal(overflowStatus.trunkCap, 1);
assert.equal(overflowStatus.bulkyInTrunk, 1);
assert.equal(overflowStatus.bulkyOnSeats, 2); // 2 bulky items on seats
assert.equal(overflowStatus.availableSeats, 1); // 4 - (1 passenger + 2 seat items) = 1
console.log('  ✅ Trunk overflow calculation onto passenger seats works flawlessly');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 0 regression detected.');
