import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloMegaphone } from '../XiloIcons';

export default function WidgetValidations({ groupId, user, onOpenEvent }) {
  const [pendingValidations, setPendingValidations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !user?.uid) {
      setLoading(false);
      return;
    }

    const eventsRef = collection(db, 'events');
    const q = query(
      eventsRef,
      where('groupId', '==', groupId),
      where('type', '==', 'reunion'),
      where('compteRenduStatus', '==', 'attente_relecture')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pending = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        
        // 1. L'utilisateur doit être présent à la réunion
        const isPresent = data.inscriptions?.some(ins => ins.userId === user.uid && ins.status === 'present');
        if (!isPresent) return;

        // 2. L'utilisateur ne doit pas avoir déjà voté
        const hasVoted = data.compteRenduApprovals && data.compteRenduApprovals[user.uid];
        
        if (!hasVoted) {
          pending.push({ id: docSnap.id, ...data });
        }
      });
      
      // Tri des réunions par date la plus récente
      pending.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setPendingValidations(pending);
      setLoading(false);
    }, (error) => {
      console.error("WidgetValidations - Erreur de récupération des validations :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, user?.uid]);

  if (loading || pendingValidations.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 mb-4 w-full max-w-full">
      {pendingValidations.map(event => {
        const dateObj = new Date(event.date);
        const formattedDate = isNaN(dateObj.getTime())
          ? ''
          : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        return (
          <CordelCard 
            key={event.id}
            variant="ocre"
            useExtremeBorder={true}
            className="py-3 px-4 relative overflow-hidden bg-cordel-bg text-left border-l-4 border-l-cordel-wood shadow-md"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-cordel-wood uppercase tracking-wider select-none mb-1">
                  <XiloMegaphone size={12} className="text-cordel-wood" />
                  <span>Action requise de votre part</span>
                </div>
                
                <h4 className="font-extrabold text-sm text-encre-noire">
                  {event.titre}
                </h4>
                <p className="text-xs font-semibold leading-relaxed mt-1 text-encre-noire/90">
                  Le compte-rendu de la réunion du {formattedDate} est en attente de votre relecture et validation.
                </p>
              </div>

              <div className="flex flex-col justify-center shrink-0">
                 <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] text-amber-700 border-amber-700 bg-amber-50 rotate-[2deg] px-1 py-0.5 animate-pulse">
                   EN ATTENTE
                 </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-dashed border-cordel-wood/30 flex justify-end select-none">
              <CordelButton
                type="button"
                variant="vert"
                useExtremeBorder={true}
                onClick={() => onOpenEvent && onOpenEvent(event)}
                className="text-xs py-2 px-4 font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:scale-[1.02] transition-transform"
              >
                <span>Relire et Voter</span>
                <span className="text-sm font-bold">→</span>
              </CordelButton>
            </div>
          </CordelCard>
        );
      })}
    </div>
  );
}
