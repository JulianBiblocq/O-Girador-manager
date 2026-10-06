/**
 * Utilitaires d'assainissement et de dédoublonnage des écritures comptables HelloAsso.
 * 
 * Règle métier :
 * Si deux transactions HelloAsso partagent le même groupe, le même montant,
 * le même jour calendaire et le même adhérent / libellé, seule la première est conservée.
 */

/**
 * Extrait la date calendaire au format YYYY-MM-DD d'une transaction.
 * Supporte les Timestamps Firestore, les secondes d'époque et les chaînes ISO.
 *
 * @param {Object} tx Objet transaction
 * @returns {string} Date au format YYYY-MM-DD
 */
export function getTransactionDayKey(tx) {
  if (!tx) return 'unknown-date';

  if (tx.date) {
    if (typeof tx.date.toDate === 'function') {
      try {
        return tx.date.toDate().toISOString().split('T')[0];
      } catch (e) {
        // Fallback
      }
    }
    if (typeof tx.date._seconds === 'number') {
      try {
        return new Date(tx.date._seconds * 1000).toISOString().split('T')[0];
      } catch (e) {
        // Fallback
      }
    }
    if (typeof tx.date === 'string' && tx.date.length >= 10 && !tx.date.includes('[object')) {
      return tx.date.substring(0, 10);
    }
    const d = new Date(tx.date);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  if (tx.createdAt) {
    if (typeof tx.createdAt.toDate === 'function') {
      try {
        return tx.createdAt.toDate().toISOString().split('T')[0];
      } catch (e) {
        // Fallback
      }
    }
    const d = new Date(tx.createdAt);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  return 'unknown-date';
}

/**
 * Détermine si une transaction provient de HelloAsso.
 *
 * @param {Object} tx
 * @returns {boolean}
 */
export function isHelloAssoTransaction(tx) {
  if (!tx) return false;
  if (tx.source === 'helloasso') return true;
  if (tx.helloAssoOrderId || tx.helloAssoPaymentId) return true;
  if (typeof tx.id === 'string' && (tx.id.startsWith('ha_pay_') || tx.id.startsWith('ha_') || tx.id.startsWith('helloasso_'))) return true;
  if (typeof tx.justificatif === 'string' && tx.justificatif.toLowerCase().includes('helloasso')) return true;
  if (typeof tx.libelle === 'string' && tx.libelle.toLowerCase().includes('helloasso')) return true;
  return false;
}

/**
 * Normalise un libellé pour la comparaison sémantique (retire la formule ou les espaces superflus).
 *
 * @param {string} libelle
 * @returns {string}
 */
export function normalizeHelloAssoLibelle(libelle) {
  if (!libelle || typeof libelle !== 'string') return '';
  return libelle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^paiement\s+helloasso\s*-\s*/i, '')
    .replace(/\s*\([^)]*\)\s*$/g, '') // retire (Formule ...)
    .replace(/[\s-]+/g, ' ')
    .trim();
}

/**
 * Analyse une liste de transactions et identifie les doublons HelloAsso.
 * Gère à la fois :
 * 1. Les doublons stricts (même groupe, même montant, même jour, même adhérent)
 * 2. Les doublons par référence externe ou commande HelloAsso (même refExterne / orderId)
 * 3. Les ventilations éclatées (écriture totale présente en parallèle de sous-articles éclatés)
 *
 * @param {Array<Object>} transactions Liste des transactions en mémoire
 * @returns {{ duplicateIds: string[], groups: Array<{ primary: Object, duplicates: Object[] }> }}
 */
export function findDuplicateHelloAssoTransactions(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { duplicateIds: [], groups: [] };
  }

  const helloAssoTxs = transactions.filter(isHelloAssoTransaction);
  const duplicateIdsSet = new Set();
  const groups = [];

  // Passe 1 : Dédoublonnage par identifiant / référence de commande HelloAsso
  const refMap = new Map();
  for (const tx of helloAssoTxs) {
    const isDon = typeof tx.id === 'string' && tx.id.endsWith('_don') || tx.categorie === 'Dons';
    const rawRef = tx.refExterne || tx.helloAssoOrderId || tx.helloAssoPaymentId || (typeof tx.id === 'string' ? tx.id.replace(/^ha_pay_/, '').replace(/^helloasso_/, '').replace(/_don$/, '') : null);
    
    if (rawRef) {
      const refKey = `${(tx.groupId || 'all').toLowerCase()}__${rawRef}__${isDon ? 'don' : 'cotisation'}`;
      if (!refMap.has(refKey)) {
        refMap.set(refKey, []);
      }
      refMap.get(refKey).push(tx);
    }
  }

  refMap.forEach((list) => {
    if (list.length > 1) {
      const sorted = [...list].sort((a, b) => {
        const aIsHaPay = typeof a.id === 'string' && a.id.startsWith('ha_pay_');
        const bIsHaPay = typeof b.id === 'string' && b.id.startsWith('ha_pay_');
        if (aIsHaPay && !bIsHaPay) return -1;
        if (!aIsHaPay && bIsHaPay) return 1;

        const aIsDet = typeof a.id === 'string' && a.id.startsWith('helloasso_');
        const bIsDet = typeof b.id === 'string' && b.id.startsWith('helloasso_');
        if (aIsDet && !bIsDet) return -1;
        if (!aIsDet && bIsDet) return 1;
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return aTime - bTime;
      });

      const primary = sorted[0];
      const duplicates = sorted.slice(1);
      duplicates.forEach(d => {
        if (d.id) duplicateIdsSet.add(d.id);
      });
      groups.push({ primary, duplicates });
    }
  });

  // Passe 2 : Dédoublonnage sémantique (groupe + montant + jour + adhérent/motif)
  const signatureMap = new Map();
  for (const tx of helloAssoTxs) {
    if (duplicateIdsSet.has(tx.id)) continue;

    const day = getTransactionDayKey(tx);
    const amount = Number(tx.montant) || 0;
    const userOrMotif = tx.userId 
      ? `user_${tx.userId}` 
      : `motif_${normalizeHelloAssoLibelle(tx.libelle)}`;
    const groupId = (tx.groupId || 'all').toLowerCase();

    const sigKey = `${groupId}__${amount.toFixed(2)}__${day}__${userOrMotif}`;
    if (!signatureMap.has(sigKey)) {
      signatureMap.set(sigKey, []);
    }
    signatureMap.get(sigKey).push(tx);
  }

  signatureMap.forEach((list) => {
    if (list.length > 1) {
      const sorted = [...list].sort((a, b) => {
        const aIsHaPay = typeof a.id === 'string' && a.id.startsWith('ha_pay_');
        const bIsHaPay = typeof b.id === 'string' && b.id.startsWith('ha_pay_');
        if (aIsHaPay && !bIsHaPay) return -1;
        if (!aIsHaPay && bIsHaPay) return 1;

        const aIsDet = typeof a.id === 'string' && a.id.startsWith('helloasso_');
        const bIsDet = typeof b.id === 'string' && b.id.startsWith('helloasso_');
        if (aIsDet && !bIsDet) return -1;
        if (!aIsDet && bIsDet) return 1;

        const aHasReceipt = Boolean(a.justificatifUrl);
        const bHasReceipt = Boolean(b.justificatifUrl);
        if (aHasReceipt && !bHasReceipt) return -1;
        if (!aHasReceipt && bHasReceipt) return 1;

        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return aTime - bTime;
      });

      const primary = sorted[0];
      const duplicates = sorted.slice(1);

      duplicates.forEach(d => {
        if (d.id) duplicateIdsSet.add(d.id);
      });

      groups.push({
        primary,
        duplicates
      });
    }
  });

  // Passe 3 : Détection des ventilations éclatées (ex: Commande de 100€ présente en même temps que 10€ adhésion + 90€ don)
  const userDayMap = new Map();
  for (const tx of helloAssoTxs) {
    if (duplicateIdsSet.has(tx.id)) continue;
    const day = getTransactionDayKey(tx);
    const userKey = tx.userId || normalizeHelloAssoLibelle(tx.libelle);
    const groupKey = (tx.groupId || 'all').toLowerCase();
    const mapKey = `${groupKey}__${day}__${userKey}`;

    if (!userDayMap.has(mapKey)) {
      userDayMap.set(mapKey, []);
    }
    userDayMap.get(mapKey).push(tx);
  }

  userDayMap.forEach((list) => {
    if (list.length >= 2) {
      // Rechercher s'il y a une écriture qui correspond à la somme des autres
      const totalTx = list.find(t => {
        const amt = Number(t.montant) || 0;
        const others = list.filter(o => o.id !== t.id);
        const sumOthers = others.reduce((acc, curr) => acc + (Number(curr.montant) || 0), 0);
        return Math.abs(amt - sumOthers) < 0.01 && others.length >= 2;
      });

      if (totalTx) {
        // L'écriture totale est conservée comme écriture primaire, les écritures éclatées partielles sont marquées comme doublons
        const splitDuplicates = list.filter(o => o.id !== totalTx.id);
        splitDuplicates.forEach(d => {
          if (d.id) duplicateIdsSet.add(d.id);
        });
        groups.push({
          primary: totalTx,
          duplicates: splitDuplicates
        });
      }
    }
  });

  return { duplicateIds: Array.from(duplicateIdsSet), groups };
}
