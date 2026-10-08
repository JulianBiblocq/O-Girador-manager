import React, { useState } from 'react';
import { syncCommissionToVaral } from '../../../utils/commissionVaralAdapter';

/**
 * Bouton d'action et indicateur d'état de synchronisation Varal pour une commission (Bloc 2).
 * Propose une variante 'compact' (pour CommissionCard) et 'full' (pour CommissionEditModal).
 *
 * @param {Object} props
 * @param {Object} props.event Données de l'événement
 * @param {Object} props.commission Données de la commission
 * @param {Object} [props.usersMap={}] Dictionnaire des utilisateurs
 * @param {string} [props.groupId] Identifiant du groupe
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

  const derniereSynchroStr = commission.derniereSynchroVaral || commission.varalDerniereSynchro;
  const isPublished = Boolean(commission.varalDocId || derniereSynchroStr);
  const derniereSynchro = derniereSynchroStr ? new Date(derniereSynchroStr) : null;
  const derniereModif = commission.derniereModif ? new Date(commission.derniereModif) : null;

  // Calcul du statut de synchronisation : À jour si synchro >= dernière modification
  const isUpToDate = isPublished && (!derniereModif || !derniereSynchro || derniereSynchro.getTime() >= derniereModif.getTime());

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
    let buttonLabel = '📜 Publier au Varal';
    let buttonStyle = 'bg-cordel-bg hover:bg-stone-200 text-encre-noire border-encre-noire';

    if (isPublished) {
      if (isUpToDate) {
        buttonLabel = '✅ À jour au Varal';
        buttonStyle = 'bg-emerald-50 hover:bg-emerald-100 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]/60';
      } else {
        buttonLabel = '🔄 Synchroniser au Varal';
        buttonStyle = 'bg-amber-50 hover:bg-amber-100 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]/60';
      }
    }

    return (
      <div className="flex items-center gap-1.5 text-[9.5px]">
        {/* Pastille d'alerte si modifié après la synchronisation */}
        {isPublished && !isUpToDate && (
          <span
            className="w-2 h-2 rounded-full bg-[var(--color-cordel-rouge)] animate-pulse shrink-0"
            title="Modifications intervenues depuis la dernière synchronisation"
          />
        )}

        {/* Bouton d'action compact Cordel 3 états */}
        <button
          type="button"
          disabled={isSyncing}
          onClick={handleSync}
          className={`px-2 py-1 rounded border font-black cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs active:translate-y-0.5 transition-all ${buttonStyle}`}
          title={isPublished ? (isUpToDate ? 'Livret synchronisé avec le Varal' : 'Changements à synchroniser') : 'Publier ce livret sur la corde du projet'}
        >
          <span>{isSyncing ? '⏳' : buttonLabel.slice(0, 2)}</span>
          <span>{isSyncing ? 'Synchronisation...' : buttonLabel.slice(2).trim()}</span>
        </button>

        {feedback && (
          <span className={`text-[9px] font-bold ${feedback.type === 'error' ? 'text-[var(--color-cordel-rouge)]' : 'text-[var(--color-cordel-vert)]'}`}>
            {feedback.message}
          </span>
        )}
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
              className={`px-2 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 ${
                isUpToDate
                  ? 'bg-emerald-100 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]'
                  : 'bg-amber-100 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]'
              }`}
            >
              <span>{isUpToDate ? '✅' : '⚠️'}</span>
              <span>{isUpToDate ? 'À jour au Varal' : 'Modifié (non synchronisé)'}</span>
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
          <span>{isSyncing ? '⏳' : isPublished ? '🔄' : '📜'}</span>
          <span>{isPublished ? '🔄 Synchroniser au Varal' : '📜 Publier au Varal'}</span>
        </button>
      </div>
    </div>
  );
}
