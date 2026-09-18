import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import AssociationBankDetailsBox from '../treasury/AssociationBankDetailsBox';

/**
 * Bloc d'alerte et suivi des paiements de commandes de matériel côté adhérent.
 * 
 * Affiche en priorité les commandes en attente de règlement avec le montant dû,
 * la consigne de libellé de virement, l'IBAN de l'association, ainsi que l'historique
 * des commandes déjà réglées.
 */
export default function MemberOrdersPaymentAlert({ groupId, currentUser, profileData }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  const userId = currentUser?.uid || profileData?.uid || profileData?.id;

  useEffect(() => {
    if (!groupId || !userId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'campaignRequests'),
      where('groupId', '==', groupId),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setRequests(list);
      setLoading(false);
    }, (err) => {
      console.warn("MemberOrdersPaymentAlert - Erreur chargement requests :", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, userId]);

  if (loading) return null;

  // Filtrer les commandes avec statut de paiement actif
  const pendingPaymentRequests = requests.filter((r) => r.statutPaiement === 'en_attente');
  const paidRequests = requests.filter((r) => r.statutPaiement === 'paye');

  if (pendingPaymentRequests.length === 0 && paidRequests.length === 0) {
    return null;
  }

  const memberName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || 
                     currentUser?.displayName || 
                     'Membre';

  const formatDateDisplay = (dateInput) => {
    if (!dateInput) return '';
    try {
      if (typeof dateInput === 'object' && typeof dateInput.toDate === 'function') {
        return dateInput.toDate().toLocaleDateString('fr-FR');
      }
      return new Date(dateInput).toLocaleDateString('fr-FR');
    } catch {
      return String(dateInput);
    }
  };

  return (
    <div className="flex flex-col gap-3 text-left w-full animate-fadeIn">
      {/* 1. Alertes de paiement en attente */}
      {pendingPaymentRequests.map((req) => {
        const montant = parseFloat(req.montantFacture) || 0;
        const virementLabel = `Commande ${profileData?.nom || profileData?.prenom || 'Membre'} ${req.article}`.trim();
        const isBoxOpen = expandedRequestId === req.id;

        return (
          <CordelCard
            key={req.id}
            variant="default"
            useExtremeBorder={true}
            className="p-4 border-2 border-[var(--color-cordel-ocre)] bg-amber-50/80 dark:bg-amber-950/25 flex flex-col gap-3 shadow-[2.5px_2.5px_0px_0px_#c05621]"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base animate-bounce">📦</span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-ocre)]">
                    Règlement attendu : Commande de matériel
                  </h4>
                  <p className="text-xs font-bold text-encre-noire dark:text-cordel-bg-light mt-0.5 leading-snug">
                    Vous devez régler <strong>{montant.toFixed(2)} €</strong> pour{' '}
                    <span className="text-cordel-wood">{req.quantite}x {req.article}</span>.
                  </p>
                </div>
              </div>

              <span className="theme-stamp-badge font-black uppercase text-[9px] px-2 py-0.5 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-500/40 rounded shrink-0">
                🟠 En attente de virement
              </span>
            </div>

            {/* Bouton déploiement coordonnées et consigne */}
            <div className="flex flex-col gap-2 pt-1 border-t border-dashed border-amber-600/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-cordel-master-dark">
                  💡 Libellé requis : <strong>{virementLabel}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedRequestId(isBoxOpen ? null : req.id)}
                  className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-white dark:bg-black/40 text-cordel-wood border border-cordel-master-dark/30 rounded hover:bg-amber-100/50 cursor-pointer transition-all select-none"
                >
                  {isBoxOpen ? "Masquer le RIB de l'asso ▴" : "Afficher l'IBAN de l'association ▾"}
                </button>
              </div>

              {/* Encart bancaire avec consigne de libellé */}
              {isBoxOpen && (
                <div className="mt-1">
                  <AssociationBankDetailsBox
                    groupId={groupId}
                    defaultOpen={true}
                    customVirementLabel={virementLabel}
                  />
                </div>
              )}
            </div>
          </CordelCard>
        );
      })}

      {/* 2. Historique des commandes réglées */}
      {paidRequests.length > 0 && (
        <CordelCard variant="default" useExtremeBorder={false} className="p-3 bg-white/40 dark:bg-black/10 flex flex-col gap-2">
          <span className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark/70">
            Commandes groupées réglées ({paidRequests.length}) :
          </span>
          <div className="flex flex-col gap-1.5">
            {paidRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between text-xs py-1 border-b border-dashed border-cordel-master-dark/15 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-encre-noire dark:text-cordel-bg-light">
                    {req.quantite}x {req.article}
                  </span>
                  {req.montantFacture && (
                    <span className="text-[11px] font-extrabold text-cordel-wood">
                      ({(parseFloat(req.montantFacture) || 0).toFixed(2)} €)
                    </span>
                  )}
                </div>
                <span className="theme-stamp-badge font-black uppercase text-[8.5px] px-2 py-0.5 bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border border-[var(--color-cordel-vert)]/40 rounded">
                  🟢 Réglé le {formatDateDisplay(req.datePaiement)}
                </span>
              </div>
            ))}
          </div>
        </CordelCard>
      )}
    </div>
  );
}
