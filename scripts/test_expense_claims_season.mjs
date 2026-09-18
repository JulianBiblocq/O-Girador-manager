import assert from 'node:assert';
import { getSeasonFromDate, getCurrentSeason, isPastSeason, getSeasonOptions } from '../src/utils/seasonUtils.js';

console.log("🧪 Test de la gestion des saisons et notes de frais...");

// 1. Test du pivot du 1er septembre
// Août 2026 (mois 7 en JS, ou '2026-08-31') -> Saison 2025-2026
assert.strictEqual(getSeasonFromDate('2026-08-31'), '2025-2026', "31 août 2026 doit appartenir à 2025-2026");
assert.strictEqual(getSeasonFromDate(new Date(2026, 7, 31)), '2025-2026', "Objet Date 31/08/2026 doit appartenir à 2025-2026");

// Septembre 2026 (mois 8 en JS, ou '2026-09-01') -> Saison 2026-2027
assert.strictEqual(getSeasonFromDate('2026-09-01'), '2026-2027', "1er septembre 2026 doit appartenir à 2026-2027");
assert.strictEqual(getSeasonFromDate(new Date(2026, 8, 1)), '2026-2027', "Objet Date 01/09/2026 doit appartenir à 2026-2027");

// Janvier 2027 -> Saison 2026-2027
assert.strictEqual(getSeasonFromDate('2027-01-15'), '2026-2027', "15 janvier 2027 doit appartenir à 2026-2027");

// Décembre 2026 -> Saison 2026-2027
assert.strictEqual(getSeasonFromDate('2026-12-25'), '2026-2027', "25 décembre 2026 doit appartenir à 2026-2027");

// Août 2027 -> Saison 2026-2027
assert.strictEqual(getSeasonFromDate('2027-08-31'), '2026-2027', "31 août 2027 doit appartenir à 2026-2027");

// Septembre 2027 -> Saison 2027-2028
assert.strictEqual(getSeasonFromDate('2027-09-01'), '2027-2028', "1er septembre 2027 doit appartenir à 2027-2028");

console.log("✅ getSeasonFromDate : tous les cas limites validés.");

// 2. Test de isPastSeason
assert.strictEqual(isPastSeason('2025-2026', '2026-2027'), true, "2025-2026 est passée par rapport à 2026-2027");
assert.strictEqual(isPastSeason('2026-2027', '2026-2027'), false, "2026-2027 n'est pas passée par rapport à 2026-2027");
assert.strictEqual(isPastSeason('2027-2028', '2026-2027'), false, "2027-2028 est future");

console.log("✅ isPastSeason validé.");

// 3. Test de getSeasonOptions
const options = getSeasonOptions('2026-2027', ['2023-2024', '2025-2026', '2026-2027']);
assert(options.includes('2026-2027'), "Doit inclure la saison courante");
assert(options.includes('2025-2026'), "Doit inclure 2025-2026");
assert(options.includes('2024-2025'), "Doit inclure 2024-2025");
assert(options.includes('2023-2024'), "Doit inclure 2023-2024");
assert.strictEqual(options[0], '2026-2027', "Doit être trié antéchronologiquement");

console.log("✅ getSeasonOptions validé.");
console.log("🎉 Tous les tests unitaires de saison sont passés avec succès !");
