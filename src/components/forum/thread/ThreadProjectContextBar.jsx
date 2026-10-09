import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import DocumentViewerModal from '../../documents/DocumentViewerModal';

/**
 * Barre d'accès rapide contextuelle (Tour de Contrôle & Livret Varal).
 * Affichée sous l'en-tête du fil de discussion dans le Porte-Voix lorsqu'il est
 * rattaché à une commission ou un projet d'événement.
 *
 * @param {Object} props
 * @param {Object} props.thread - Données du sujet de discussion
 * @param {Function} props.onNavigateToView - Callback de navigation transversale
 * @param {Function} props.onClose - Fermeture de la vue fil lors d'une navigation
 */
export default function ThreadProjectContextBar({ thread, onNavigateToView, onClose }) {
  const eventId = thread?.eventId || null;
  const commissionId = thread?.commissionId || thread?.commissionSourceId || null;

  const [varalDoc, setVaralDoc] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(Boolean(commissionId || eventId));
  const [showViewerModal, setShowViewerModal] = useState(false);

  // Écoute en temps réel de l'existence du livret Cordel au Varal
  useEffect(() => {
    if (!commissionId && !eventId) {
      setVaralDoc(null);
      setLoadingDoc(false);
      return;
    }

    const docsCol = collection(db, 'documents');
    let q;
    if (commissionId) {
      q = query(docsCol, where('commissionSourceId', '==', commissionId));
    } else {
      q = query(docsCol, where('categorie', '==', `projet_${eventId}`));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const firstDoc = snapshot.docs[0];
          setVaralDoc({ id: firstDoc.id, ...firstDoc.data() });
        } else {
          setVaralDoc(null);
        }
        setLoadingDoc(false);
      },
      (err) => {
        console.warn('ThreadProjectContextBar - Erreur recherche livret Varal:', err);
        setLoadingDoc(false);
      }
    );

    return () => unsubscribe();
  }, [commissionId, eventId]);

  // Si le fil n'est rattaché ni à un événement ni à une commission, ne rien afficher (Règle zéro bloc vide)
  if (!eventId && !commissionId) {
    return null;
  }

  // Navigation vers la Tour de Contrôle de l'événement
  const handleOpenTourDeControle = () => {
    if (!eventId) return;
    if (typeof onNavigateToView === 'function') {
      onNavigateToView('agenda', { eventId, openHub: true });
    } else {
      const url = new URL(window.location);
      url.searchParams.set('eventId', eventId);
      url.searchParams.set('openHub', 'true');
      window.history.pushState({ ...window.history.state, eventId, openHub: true }, '', url.toString());
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Bascule globale vers la corde projet du Varal
  const handleNavigateToVaral = () => {
    if (!eventId) return;
    const ropeId = `projet_${eventId}`;
    if (typeof onNavigateToView === 'function') {
      onNavigateToView('varal', { categoryKey: ropeId });
    } else {
      const url = new URL(window.location);
      url.searchParams.set('varalCat', ropeId);
      window.history.pushState({ ...window.history.state, varalCat: ropeId }, '', url.toString());
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <>
      <div className="shrink-0 z-10 bg-[#FAF5E6] dark:bg-[#1E1B16] border-b border-dashed border-cordel-master-dark/25 px-3 py-1.5 flex items-center justify-between gap-2 text-xs select-none shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-cordel-master-dark/80 truncate">
            {thread?.channelName || (eventId ? `Projet : ${eventId}` : 'Commission')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Bouton Tour de Contrôle */}
          {eventId && (
            <button
              type="button"
              onClick={handleOpenTourDeControle}
              className="px-2.5 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase rounded border border-cordel-master-dark/40 bg-white hover:bg-cordel-bg text-encre-noire transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:translate-y-px"
              title="Ouvrir la Tour de Contrôle de l'événement"
            >
              <span>🎪</span>
              <span>Tour de Contrôle</span>
            </button>
          )}

          {/* Bouton Livret Varal */}
          {varalDoc ? (
            <button
              type="button"
              onClick={() => setShowViewerModal(true)}
              className="px-2.5 py-1 text-[10px] sm:text-[11px] font-extrabold uppercase rounded border border-[var(--color-cordel-vert,#2d6a4f)] bg-emerald-50 dark:bg-emerald-950/40 text-[var(--color-cordel-vert,#2d6a4f)] hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:translate-y-px"
              title="Consulter le livret Cordel officiel publié au Varal"
            >
              <span>📜</span>
              <span>Livret Varal</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={true}
              onClick={handleNavigateToVaral}
              className="px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase rounded border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed flex items-center gap-1 opacity-70"
              title={loadingDoc ? 'Recherche du livret...' : 'Aucun livret publié au Varal pour le moment'}
            >
              <span>📜</span>
              <span>Livret Varal</span>
              <span className="text-[9px] lowercase italic font-normal">
                {loadingDoc ? '(...) ' : '(non publié)'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Lecteur modal direct du livret Cordel si ouvert in-situ */}
      {showViewerModal && varalDoc && (
        <DocumentViewerModal
          document={varalDoc}
          onClose={() => setShowViewerModal(false)}
        />
      )}
    </>
  );
}
