import React, { useState } from 'react';
import { syncCommissionToVaral } from '../../../utils/commissionVaralAdapter';

/**
 * Bouton d'action et indicateur d'état de synchronisation Varal pour une commission (Bloc 2).
 * Propose une variante 'compact' (pour CommissionCard) et 'full' (pour CommissionEditModal).
 *
 * @param {Object} props
 * @param {Object} props.event Données de l'événement
 * @param {Object} props.commission Données de la commission
 * @param {Object} props.usersMap Dictionnaire des utilisateurs
 * @param {string} props.groupId Identifiant du groupe
 * @param {'compact'|'full'} [props.variant='full'] Variante d'affichage
 * @param {Function} [props.onSyncSuccess] Callback après synchronisation réussie
 */
export default function CommissionVaralAction({
  event,
  commission,
  usersMap = {},
  groupId,
  variant = 'full',
  onSyncSuccess
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!commission || !event) return null;

  const isPublished = Boolean(commission.varalDocId);
  const derniereSynchro = commission.varalDerniereSynchro ? new Date(commission.varalDerniereSynchro) : null;
  const derniereModif = commission.derniereModif ? new Date(commission.derniereModif) : null;

  // Calcul du statut de synchronisation
  const isUpToDate = isPublished && (!derniereModif || !derniereSynchro || derniereSynchro >= derniereModif);

  const handleSync = async (e) => {
    if (e) e.stopPropagation();
    try {
      setIsSyncing(true);
      setFeedback(null);
      const effectiveGroupId = groupId || event.groupId;
      const res = await syncCommissionToVaral({
        event,
        commission,
        usersMap,
        groupId: effectiveGroupId
      });

      setFeedback({
        type: 'success',
        message: res.isNew ? 'Publié au Varal !' : 'Varal synchronisé !'
      });

      if (onSyncSuccess) onSyncSuccess(res);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Erreur synchronisation Varal commission :', err);
      setFeedback({
        type: 'error',
        message: 'Erreur de publication'
      });
      setTimeout(() => setFeedback(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Variante Compacte (pour CommissionCard)
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 text-[9.5px]">
        {/* Badge d'état */}
        {isPublished ? (
          <span
            className={`px-1.5 py-0.5 rounded font-bold border truncate max-w-[120px] ${
              isUpToDate
                ? 'bg-emerald-50 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]/40'
                : 'bg-amber-50 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]/40'
            }`}
            title={isUpToDate ? 'Livret Varal à jour' : 'Modifications non publiées'}
          >
            {isUpToDate ? '✅ Varal à jour' : '⚠️ Modifs à publier'}
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded font-bold border border-stone-300 bg-stone-100 text-stone-500">
            📜 Non publié
          </span>
        )}

        {/* Bouton synchro miniature */}
        <button
          type="button"
          disabled={isSyncing}
          onClick={handleSync}
          className="p-1 rounded border border-encre-noire bg-cordel-bg hover:bg-stone-200 text-encre-noire font-bold cursor-pointer disabled:opacity-50"
          title={isPublished ? 'Mettre à jour le livret Varal' : 'Publier le livret au Varal'}
        >
          {isSyncing ? '⏳' : '📜'}
        </button>
      </div>
    );
  }

  // 2. Variante Complète (pour CommissionEditModal)
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-cordel-bg/60 border border-encre-noire/20 rounded-md">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-black text-xs text-encre-noire flex items-center gap-1">
            <span>📜</span> Livret Cordel (Varal)
          </span>
          {isPublished ? (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                isUpToDate
                  ? 'bg-emerald-100 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]'
                  : 'bg-amber-100 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]'
              }`}
            >
              {isUpToDate ? '✅ À jour au Varal' : '⚠️ Modifications non publiées'}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-300">
              Non publié
            </span>
          )}
        </div>
        <p className="text-[10px] text-stone-600">
          {isPublished && derniereSynchro
            ? `Dernière synchro : ${derniereSynchro.toLocaleDateString('fr-FR')} à ${derniereSynchro.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
            : "Rend ce chantier consultable par toute la troupe sur la corde de l'événement."}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        {feedback && (
          <span className={`text-[10px] font-bold ${feedback.type === 'error' ? 'text-[var(--color-cordel-rouge)]' : 'text-[var(--color-cordel-vert)]'}`}>
            {feedback.message}
          </span>
        )}
        <button
          type="button"
          disabled={isSyncing}
          onClick={handleSync}
          className="px-3 py-1.5 rounded font-black text-xs border border-encre-noire bg-cordel-bg hover:bg-stone-200 text-encre-noire shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <span>{isSyncing ? '⏳' : '📜'}</span>
          <span>{isPublished ? 'Synchroniser au Varal' : 'Publier au Varal'}</span>
        </button>
      </div>
    </div>
  );
}
