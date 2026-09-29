import assert from 'node:assert';
import {
  calculateCommissionProgress,
  calculateGlobalCommissionStats,
  prepareCommissionData,
  NEXT_JALON_STATUS
} from '../src/components/event-details/commissions/commissionUtils.js';

console.log('--- Test Moteur Commissions & Chantiers (Bloc 1) ---');

// 1. Test calculateCommissionProgress
{
  const commEmpty = { jalons: [] };
  assert.strictEqual(calculateCommissionProgress(commEmpty), 0, 'Une commission sans jalons doit avoir 0%');

  const commPartial = {
    jalons: [
      { id: 'j1', status: 'fait' },
      { id: 'j2', status: 'en_cours' },
      { id: 'j3', status: 'a_faire' }
    ]
  };
  assert.strictEqual(calculateCommissionProgress(commPartial), 33, '1 fait sur 3 doit donner 33%');

  const commFull = {
    jalons: [
      { id: 'j1', status: 'fait' },
      { id: 'j2', status: 'fait' }
    ]
  };
  assert.strictEqual(calculateCommissionProgress(commFull), 100, '2 faits sur 2 doit donner 100%');
  console.log('✓ calculateCommissionProgress validé');
}

// 2. Test calculateGlobalCommissionStats
{
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const mockCommissions = [
    {
      id: 'c1',
      titre: 'Costumes & Tenues',
      jalons: [
        { id: 'j1', status: 'fait', deadline: yesterday },
        { id: 'j2', status: 'en_cours', deadline: yesterday } // en retard !
      ],
      budget: { statusArbitrage: 'en_attente', demande: 500 }
    },
    {
      id: 'c2',
      titre: 'Logistique & Buvette',
      jalons: [
        { id: 'j3', status: 'a_faire', deadline: tomorrow },
        { id: 'j4', status: 'fait', deadline: tomorrow }
      ],
      budget: { statusArbitrage: 'valide', demande: 200, alloue: 200 }
    }
  ];

  const stats = calculateGlobalCommissionStats(mockCommissions);

  assert.strictEqual(stats.totalJalons, 4, 'Total jalons doit être 4');
  assert.strictEqual(stats.completedJalons, 2, 'Jalons terminés doit être 2');
  assert.strictEqual(stats.globalProgress, 50, 'Progression globale doit être 50%');
  assert.strictEqual(stats.pendingArbitrationsCount, 1, 'Il doit y avoir 1 arbitrage en attente');
  assert.strictEqual(stats.overdueAlertsCount, 1, 'Il doit y avoir 1 alerte date dépassée');
  assert.strictEqual(stats.overdueJalons.length, 1, 'Le jalon en retard doit être capturé');
  assert.strictEqual(stats.pendingBudgetCommissions.length, 1, 'La commission c1 doit être en pending budget');

  console.log('✓ calculateGlobalCommissionStats validé');
}

// 3. Test cycle des statuts de jalons
{
  assert.strictEqual(NEXT_JALON_STATUS.a_faire, 'en_cours');
  assert.strictEqual(NEXT_JALON_STATUS.en_cours, 'fait');
  assert.strictEqual(NEXT_JALON_STATUS.fait, 'a_faire');
  console.log('✓ Cycle NEXT_JALON_STATUS validé');
}

// 4. Test prepareCommissionData
{
  const prep = prepareCommissionData({
    titre: 'Commission Test',
    icone: '🎸'
  });

  assert.strictEqual(prep.titre, 'Commission Test');
  assert.strictEqual(prep.icone, '🎸');
  assert.ok(Array.isArray(prep.referentsIds));
  assert.ok(Array.isArray(prep.modulesActifs));
  assert.ok(prep.modulesActifs.includes('jalons'));
  assert.strictEqual(prep.budget.statusArbitrage, 'en_etude');
  assert.ok(prep.dateCreation);
  assert.ok(prep.derniereModif);

  console.log('✓ prepareCommissionData validé');
}

console.log('TOUS LES TESTS DU MOTEUR COMMISSIONS ONT RÉUSSI ! 🎉');
