/**
 * Utilitaires pour le calcul d'état et les gabarits des mallettes et trousses collectives régie.
 */

/**
 * Calcule l'état de santé opérationnel d'un kit régie.
 *
 * @param {Object} kit - Données du kit
 * @returns {Object} { status: 'ok'|'a_completer'|'a_racheter', toBuyCount, toCompleteCount, label, color }
 */
export function calculateKitStatus(kit) {
  const items = kit?.items || [];
  if (items.length === 0) {
    return { status: 'ok', toBuyCount: 0, toCompleteCount: 0, label: 'Complet', color: 'green' };
  }

  const toBuyItems = items.filter(
    (item) => item.statut === 'a_racheter' || (Number(item.quantiteActuelle) === 0 && Number(item.quantiteCible) > 0)
  );
  const toCompleteItems = items.filter(
    (item) =>
      item.statut === 'a_completer' ||
      (Number(item.quantiteActuelle) < Number(item.quantiteCible) && !toBuyItems.includes(item))
  );

  if (toBuyItems.length > 0) {
    return {
      status: 'a_racheter',
      toBuyCount: toBuyItems.length,
      toCompleteCount: toCompleteItems.length,
      label: `${toBuyItems.length} article(s) à racheter`,
      color: 'red'
    };
  }

  if (toCompleteItems.length > 0) {
    return {
      status: 'a_completer',
      toBuyCount: 0,
      toCompleteCount: toCompleteItems.length,
      label: 'À compléter',
      color: 'orange'
    };
  }

  return { status: 'ok', toBuyCount: 0, toCompleteCount: 0, label: 'Complet', color: 'green' };
}

/**
 * Gabarits des 3 kits régie par défaut pour initialiser une association.
 */
export const DEFAULT_REGIE_KITS = [
  {
    nom: "Mallette Maquillage de Scène",
    type: 'maquillage',
    emplacement: "Armoire Régie - Étagère 1",
    derniereVerification: new Date().toISOString(),
    verifieParNom: "Régisseur",
    notes: "Utilisée lors de chaque sortie scénique et déambulation.",
    items: [
      { id: 'mq-1', nom: "Fards à l'eau (Blanc, Noir, Couleurs)", quantiteCible: 4, quantiteActuelle: 4, statut: 'ok', stockReserveLocal: 2 },
      { id: 'mq-2', nom: "Pinceaux et éponges de pose", quantiteCible: 10, quantiteActuelle: 10, statut: 'ok', stockReserveLocal: 5 },
      { id: 'mq-3', nom: "Paillettes biodégradables", quantiteCible: 3, quantiteActuelle: 3, statut: 'ok', stockReserveLocal: 2 },
      { id: 'mq-4', nom: "Lingettes démaquillantes douces", quantiteCible: 2, quantiteActuelle: 2, statut: 'ok', stockReserveLocal: 3 },
      { id: 'mq-5', nom: "Miroir de poche régie", quantiteCible: 2, quantiteActuelle: 2, statut: 'ok', stockReserveLocal: 1 }
    ]
  },
  {
    nom: "Trousse de Premiers Secours & Bouchons",
    type: 'secours',
    emplacement: "Sacoche Régie Principale",
    derniereVerification: new Date().toISOString(),
    verifieParNom: "Régisseur",
    notes: "Indispensable sur chaque prestation et répétition publique.",
    items: [
      { id: 'sc-1', nom: "Bouchons d'oreilles haute protection", quantiteCible: 30, quantiteActuelle: 30, statut: 'ok', stockReserveLocal: 100 },
      { id: 'sc-2', nom: "Pansements prédécoupés étanches", quantiteCible: 20, quantiteActuelle: 20, statut: 'ok', stockReserveLocal: 30 },
      { id: 'sc-3', nom: "Spray désinfectant sans alcool", quantiteCible: 2, quantiteActuelle: 2, statut: 'ok', stockReserveLocal: 2 },
      { id: 'sc-4', nom: "Sérum physiologique unidoses", quantiteCible: 10, quantiteActuelle: 10, statut: 'ok', stockReserveLocal: 20 },
      { id: 'sc-5', nom: "Couverture de survie", quantiteCible: 2, quantiteActuelle: 2, statut: 'ok', stockReserveLocal: 2 }
    ]
  },
  {
    nom: "Outillage d'Urgence Live",
    type: 'outils_live',
    emplacement: "Caisse Noire Régie",
    derniereVerification: new Date().toISOString(),
    verifieParNom: "Mestre / Régisseur",
    notes: "Outils de secours pour accordage, cordage et petites réparations d'urgence.",
    items: [
      { id: 'ot-1', nom: "Rouleaux de Gaffa noir professionnel", quantiteCible: 2, quantiteActuelle: 2, statut: 'ok', stockReserveLocal: 4 },
      { id: 'ot-2', nom: "Clés d'accordage et de serrage tirants", quantiteCible: 3, quantiteActuelle: 3, statut: 'ok', stockReserveLocal: 2 },
      { id: 'ot-3', nom: "Cordes de rechange alfaias (5m)", quantiteCible: 2, quantiteActuelle: 2, statut: 'ok', stockReserveLocal: 3 },
      { id: 'ot-4', nom: "Pince multiprise & tournevis universel", quantiteCible: 2, quantiteActuelle: 2, statut: 'ok', stockReserveLocal: 1 }
    ]
  }
];
