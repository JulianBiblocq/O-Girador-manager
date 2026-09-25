import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import AssociationBankDetailsBox from '../treasury/AssociationBankDetailsBox';
import { notifyMembersByTag } from '../../utils/inAppNotificationService';

// Bloc d'alerte et suivi des paiements de commandes de matériel adhérent
export default function MemberOrdersPaymentAlert({ groupId, currentUser, profileData }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [declaringPaymentId, setDeclaringPaymentId] = useState(null);

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

  const pendingPaymentRequests = requests.filter((r) => r.statutPaiement === 'en_attente');
  const paidRequests = requests.filter((r) => r.statutPaiement === 'paye');
  if (pendingPaymentRequests.length === 0 && paidRequests.length === 0) return null;

  const memberName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || currentUser?.displayName || 'Membre';

  const formatDateDisplay = (d) => {
    if (!d) return '';
    const date = typeof d === 'object' && typeof d.toDate === 'function' ? d.toDate() : new Date(d);
    return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('fr-FR');
  };

  const handleDeclarePayment = async (req) => {
    setDeclaringPaymentId(req.id);
    try {
      await updateDoc(doc(db, 'campaignRequests', req.id), {
        virementDeclare: true,
        dateVirementDeclare: new Date().toISOString()
      });
      notifyMembersByTag({
        groupId,
        tags: ['Trésorier', 'tresorier'],
        title: "📦 Commande réglée",
        message: `${memberName} a effectué son virement`,
        targetUrl: "/app/treasury?tab=commandes",
        icon: "📦"
      }).catch((err) => console.warn("MemberOrdersPaymentAlert - Notif ignorée :", err));
    } catch (err) {
      console.error("MemberOrdersPaymentAlert - Erreur virement :", err);
      alert("Erreur lors de la déclaration du virement.");
    } finally {
      setDeclaringPaymentId(null);
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
                  <AssociationBankDetailsBox groupId={groupId} defaultOpen={true} customVirementLabel={virementLabel} />
                </div>
              )}

              {/* Action : Déclaration du virement */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed border-amber-600/20">
                {req.virementDeclare ? (
                  <span className="text-[10px] font-black text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    <span>✓</span> Virement déclaré — En attente de pointage trésorier
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={declaringPaymentId === req.id}
                    onClick={() => handleDeclarePayment(req)}
                    className="px-3 py-1.5 text-[9.5px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert,#2d6a4f)] text-white rounded border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] hover:brightness-105 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>💳</span> {declaringPaymentId === req.id ? 'Transmission...' : "J'ai effectué mon virement"}
                  </button>
                )}
              </div>
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
