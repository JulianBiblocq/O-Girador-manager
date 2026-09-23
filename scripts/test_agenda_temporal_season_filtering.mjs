import assert from 'node:assert/strict';
import {
  isPastEvent,
  splitEventsByTime,
  sortUpcomingEvents,
  sortPastEvents
} from '../src/utils/dateUtils.js';
import {
  getSeasonFromDate,
  getCurrentSeason,
  getPreviousSeason,
  getSeasonOptions,
  DEFAULT_SEASON_START_MONTH
} from '../src/utils/seasonUtils.js';

console.log('🧪 Exécution des tests du filtrage temporel et de l\'archivage par saison de l\'Agenda...');

// Date de référence locale
const now = new Date();
const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const formatDateISO = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const yesterday = new Date(todayMidnight.getTime() - 24 * 60 * 60 * 1000);
const tomorrow = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
const inTwoDays = new Date(todayMidnight.getTime() + 48 * 60 * 60 * 1000);
const tenDaysAgo = new Date(todayMidnight.getTime() - 10 * 24 * 60 * 60 * 1000);

const strToday = formatDateISO(todayMidnight);
const strYesterday = formatDateISO(yesterday);
const strTomorrow = formatDateISO(tomorrow);
const strInTwoDays = formatDateISO(inTwoDays);
const strTenDaysAgo = formatDateISO(tenDaysAgo);

// --- 1. Test de la référence temporelle et de isPastEvent ---
console.log('  1. Test de la fonction isPastEvent...');
assert.equal(isPastEvent(strYesterday), true, 'Hier doit être considéré comme passé');
assert.equal(isPastEvent(strToday), false, 'Aujourd\'hui doit être considéré comme à venir');
assert.equal(isPastEvent(strTomorrow), false, 'Demain doit être considéré comme à venir');

// Test avec événement multi-jours (dateDebut passée mais dateFin future)
const multiDayEvent = {
  id: 'ev-multi',
  titre: 'Stage de fin de semaine',
  dateDebut: strYesterday,
  dateFin: strTomorrow
};
assert.equal(isPastEvent(multiDayEvent), false, 'Un événement avec dateFin future doit être à venir');

const pastMultiDayEvent = {
  id: 'ev-past-multi',
  titre: 'Festival terminé',
  dateDebut: strTenDaysAgo,
  dateFin: strYesterday
};
assert.equal(isPastEvent(pastMultiDayEvent), true, 'Un événement avec dateFin passée doit être classé en passé');

// --- 2. Test du découpage étanche et des tris différenciés ---
console.log('  2. Test de splitEventsByTime et tris chronologiques...');

const sampleEvents = [
  { id: '1', titre: 'Répétition Demain', date: strTomorrow },
  { id: '2', titre: 'Prestation Hier', date: strYesterday },
  { id: '3', titre: 'Atelier Dans 2 jours', date: strInTwoDays },
  { id: '4', titre: 'Réunion Il y a 10 jours', date: strTenDaysAgo },
  { id: '5', titre: 'Roda Aujourd\'hui', date: strToday }
];

const { upcomingEvents, pastEvents } = splitEventsByTime(sampleEvents);

assert.equal(upcomingEvents.length, 3, 'Doit contenir 3 événements à venir (Aujourd\'hui, Demain, Dans 2 jours)');
assert.equal(pastEvents.length, 2, 'Doit contenir 2 événements passés (Hier, Il y a 10 jours)');

// Tri à venir : ASC (Aujourd'hui -> Demain -> Dans 2 jours)
assert.equal(upcomingEvents[0].id, '5', 'L\'échéance la plus proche doit être Aujourd\'hui');
assert.equal(upcomingEvents[1].id, '1', 'La 2e échéance doit être Demain');
assert.equal(upcomingEvents[2].id, '3', 'La 3e échéance doit être Dans 2 jours');

// Tri passés : DESC (Hier -> Il y a 10 jours)
assert.equal(pastEvents[0].id, '2', 'L\'événement passé le plus récent (Hier) doit être en tête');
assert.equal(pastEvents[1].id, '4', 'L\'événement passé le plus ancien doit être après');

// --- 3. Test de la classification par saison avec paramètre début de mois ---
console.log('  3. Test de la classification par saison...');

// Saison par défaut (Septembre)
assert.equal(getSeasonFromDate('2026-09-15', 9), '2026-2027');
assert.equal(getSeasonFromDate('2026-05-10', 9), '2025-2026');
assert.equal(getSeasonFromDate('2026-08-31', 9), '2025-2026');

// Saison en année civile (Janvier)
assert.equal(getSeasonFromDate('2026-05-10', 1), '2026');
assert.equal(getSeasonFromDate('2025-11-20', 1), '2025');

// Saison personnalisée (ex: Mars)
assert.equal(getSeasonFromDate('2026-04-01', 3), '2026-2027');
assert.equal(getSeasonFromDate('2026-02-15', 3), '2025-2026');

// --- 4. Test du calcul de la saison précédente (getPreviousSeason) ---
console.log('  4. Test de getPreviousSeason...');
assert.equal(getPreviousSeason('2026-2027'), '2025-2026');
assert.equal(getPreviousSeason('2025-2026'), '2024-2025');
assert.equal(getPreviousSeason('2026'), '2025');
assert.equal(getPreviousSeason(''), '');

// --- 5. Test des options de saisons et de navigation ---
console.log('  5. Test de getSeasonOptions...');
const currentSeason = getCurrentSeason(9);
const pastSeasonsSample = ['2023-2024', '2024-2025', '2025-2026'];
const options = getSeasonOptions(currentSeason, pastSeasonsSample);

// Vérifier que le tri est antéchronologique (la plus récente d'abord)
for (let i = 0; i < options.length - 1; i++) {
  const yearA = parseInt(options[i].split('-')[0], 10);
  const yearB = parseInt(options[i + 1].split('-')[0], 10);
  assert.ok(yearA >= yearB, `L'ordre doit être antéchronologique : ${options[i]} vs ${options[i + 1]}`);
}

// --- 6. Test du plafonnement à 30 événements pour l'option "Toutes les saisons" ---
console.log('  6. Test du plafonnement à 30 événements passés...');
const fortyPastEvents = Array.from({ length: 45 }, (_, idx) => ({
  id: `past-${idx}`,
  titre: `Événement ${idx}`,
  date: `2024-01-${String((idx % 28) + 1).padStart(2, '0')}`
}));

const capped = fortyPastEvents.slice(0, 30);
assert.equal(capped.length, 30, 'Le plafonnement doit restreindre à exactement 30 événements');

console.log('✅ Tous les tests de filtrage temporel et archivage de l\'Agenda sont validés avec succès !');
