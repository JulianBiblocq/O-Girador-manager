import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Sous-composant EventReportVoteSection
 * Gère l'encart de vote d'approbation par le collège des validateurs désignés,
 * l'état des votes et les actions d'administration lors de la phase 'attente_relecture'.
 */
export default function EventReportVoteSection({
  event,
  isUserValidator,
  isUserPresent,
  isAdmin,
  isSaving,
  userVote,
  comment,
  setComment,
  showVoters,
  setShowVoters,
  approvals,
  totalValidators,
  approvedCount,
  rejectedCount,
  pendingCount,
  validatorsApproved,
  validatorsRejected,
  validatorsPending,
  formatDate,
  onVote,
  onResetMyVote,
  onRevertToDraft,
  onPublishDefinitive
}) {
  return (
    <div className="flex flex-col gap-3">
      {isUserValidator ? (
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 border-2 border-cordel-wood bg-cordel-bg-light shadow-md">
          <h4 className="text-xs font-extrabold uppercase text-cordel-wood tracking-wider mb-2.5 flex items-center gap-1.5">
            🗳️ Approbation du Compte-Rendu (Validateur désigné)
          </h4>

          {event.autoValidateAfter7Days && event.compteRenduAutoValidateAt && (
            <div className="mb-2.5 p-1.5 rounded bg-amber-50 text-[10px] text-amber-900 border border-amber-300 font-semibold flex items-center gap-1.5">
              <span>⏳</span>
              <span>Validation automatique prévue le <strong>{formatDate(event.compteRenduAutoValidateAt)}</strong> (sauf demande de modification).</span>
            </div>
          )}

          {userVote ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-semibold leading-relaxed text-encre-noire">
                Vous avez voté :{' '}
                {userVote.approved ? (
                  <span className="text-green-700 font-extrabold">✅ APPROUVÉ</span>
                ) : (
                  <span className="text-red-700 font-extrabold">❌ MODIFICATION DEMANDÉE</span>
                )}
                {userVote.commentaire && (
                  <span className="block mt-1 pl-3 border-l-2 border-dashed border-red-500 italic text-[11px] opacity-75">
                    &quot;{userVote.commentaire}&quot;
                  </span>
                )}
              </p>
              <div className="flex">
                <button type="button" onClick={onResetMyVote} className="text-[9px] font-black uppercase tracking-wider text-blue-700 hover:underline bg-transparent border-0 cursor-pointer">
                  ✏️ Modifier mon vote
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] leading-relaxed opacity-85">
                En tant que validateur désigné, veuillez confirmer si ce compte-rendu reflète fidèlement la réunion ou demander des modifications.
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold tracking-wider opacity-65">Commentaire facultatif (requis si demande de modif)</label>
                <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajoutez des précisions..." className="theme-input text-xs w-full py-1.5 bg-white" />
              </div>
              <div className="flex gap-2">
                <CordelButton variant="vert" onClick={() => onVote(true)} className="text-xs py-2 px-3 flex-1 font-bold">✅ Approuver</CordelButton>
                <CordelButton
                  variant="rouge"
                  onClick={() => {
                    if (!comment.trim()) { alert('Veuillez saisir un commentaire expliquant la modification demandée.'); return; }
                    onVote(false, comment);
                  }}
                  className="text-xs py-2 px-3 flex-1 font-bold"
                >
                  ❌ Demander une modification
                </CordelButton>
              </div>
            </div>
          )}
        </CordelCard>
      ) : isUserPresent ? (
        <div className="p-4 bg-amber-50/80 border border-dashed border-amber-400 rounded text-amber-900 text-xs font-medium flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⏳</span>
            <div>
              <p className="font-bold text-amber-950">En cours de relecture par les validateurs désignés ({approvedCount}/{totalValidators} validations).</p>
              <p className="text-[10.5px] opacity-80 mt-0.5">Vous étiez présent à cette réunion. La validation de ce compte-rendu a été confiée aux relecteurs désignés avant publication officielle.</p>
            </div>
          </div>
          <span className="theme-stamp-badge text-[8px] font-black uppercase tracking-wider bg-white/70 text-amber-800 border-amber-300">👀 Relecture restreinte</span>
        </div>
      ) : (
        <div className="p-3 bg-neutral-100 text-neutral-600 rounded text-center text-[10px] italic">
          🔒 Le vote d&apos;approbation est réservé aux validateurs désignés pour cette réunion.
        </div>
      )}

      <div className="theme-inner-panel p-3.5 rounded-[4px_6px_3px_5px] flex flex-col gap-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="text-[8px] uppercase font-black tracking-wider text-cordel-master-dark opacity-65">
            État des votes ({approvedCount + rejectedCount} / {totalValidators} validateur{totalValidators > 1 ? 's' : ''} désigné{totalValidators > 1 ? 's' : ''})
          </span>
          {event.compteRenduValidationMode && (
            <span className="text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-300">
              Collège : {event.compteRenduValidationMode === 'present_by_tags' ? '🏷️ Par badge' : event.compteRenduValidationMode === 'custom_users' ? '👤 Nominatif' : '👥 Tous les présents'}
            </span>
          )}
        </div>

        <div className="flex gap-4 text-xs font-semibold flex-wrap">
          <div className="text-green-700">✅ {approvedCount} Approbation{approvedCount > 1 ? 's' : ''}</div>
          <div className="text-red-700">❌ {rejectedCount} Demande{rejectedCount > 1 ? 's' : ''} de modification</div>
          <div className="text-neutral-500">⏳ {pendingCount} En attente</div>
        </div>

        <div className="mt-1">
          <button type="button" onClick={() => setShowVoters(!showVoters)} className="text-[10px] text-[var(--color-cordel-ocre)] font-extrabold hover:underline uppercase tracking-wider bg-transparent border-0 cursor-pointer">
            👥 {showVoters ? 'Masquer le détail des validateurs' : 'Voir le détail des validateurs désignés'}
          </button>
        </div>

        {showVoters && (
          <div className="mt-1 mb-2 flex flex-col gap-3 p-3 bg-white/40 border border-dashed border-cordel-master-dark/15 rounded text-[10px]">
            {validatorsApproved.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-[var(--color-cordel-vert)]">✅ Ont approuvé :</span>
                <div className="flex flex-wrap gap-1">{validatorsApproved.map((val) => <span key={val.uid} className="px-1.5 py-0.5 bg-[var(--color-cordel-vert)]/10 text-[var(--color-cordel-vert)] rounded font-semibold">{val.displayName}</span>)}</div>
              </div>
            )}
            {validatorsRejected.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-[var(--color-cordel-rouge)]">❌ Ont demandé une modification :</span>
                <div className="flex flex-wrap gap-1">{validatorsRejected.map((val) => <span key={val.uid} className="px-1.5 py-0.5 bg-[var(--theme-primary)]/10 text-[var(--color-cordel-rouge)] rounded font-semibold">{val.displayName}</span>)}</div>
              </div>
            )}
            {validatorsPending.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-[var(--color-cordel-ocre)]">⏳ En attente de vote :</span>
                <div className="flex flex-wrap gap-1">{validatorsPending.map((val) => <span key={val.uid} className="px-1.5 py-0.5 bg-[var(--color-cordel-ocre)]/10 text-[var(--color-cordel-ocre)] rounded font-semibold">{val.displayName}</span>)}</div>
              </div>
            )}
          </div>
        )}

        {Object.keys(approvals).some((uid) => approvals[uid]?.commentaire) && (
          <div className="mt-2 border-t border-dashed border-encre-noire/10 pt-2 flex flex-col gap-1.5">
            <span className="text-[8px] uppercase font-bold tracking-wider text-cordel-wood">Modifications demandées :</span>
            {Object.keys(approvals).map((uid) => {
              const vote = approvals[uid];
              if (!vote?.commentaire) return null;
              return (
                <div key={uid} className="text-[10px] leading-relaxed bg-red-50 text-red-800 p-2 rounded border border-red-200">
                  <span className="font-bold">👤 {vote.userName || 'Membre'} :</span> &quot;{vote.commentaire}&quot;
                </div>
              );
            })}
          </div>
        )}

        {isAdmin && (
          <div className="flex justify-between items-center border-t border-dashed border-encre-noire/10 pt-3 mt-1 flex-wrap gap-2">
            <CordelButton variant="rouge" onClick={onRevertToDraft} disabled={isSaving} className="text-xs py-1.5 px-3 font-bold">✏️ Repasser en brouillon</CordelButton>
            <CordelButton variant="vert" useExtremeBorder={true} onClick={onPublishDefinitive} disabled={isSaving} className="text-xs py-1.5 px-4 font-extrabold uppercase tracking-wider">
              {isSaving ? '⏳ Validation...' : '⚡ Forcer la validation définitive (Override)'}
            </CordelButton>
          </div>
        )}
      </div>
    </div>
  );
}
