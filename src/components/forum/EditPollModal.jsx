import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';

/**
 * EditPollModal.jsx
 * Modale Cordel pour modifier un sondage existant.
 * Protège les votes existants, alerte si suppression d'une option avec suffrages,
 * et permet de clôturer ou rouvrir le scrutin.
 */
export default function EditPollModal({ isOpen, poll, onClose, onSave, loading = false }) {
  const { confirm } = useConfirm();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [isClosed, setIsClosed] = useState(false);
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(false);

  useEffect(() => {
    if (poll) {
      setQuestion(poll.question || '');
      setOptions(
        Array.isArray(poll.options)
          ? poll.options.map(opt => ({
              id: opt.id || `opt_${Date.now()}_${Math.random()}`,
              text: opt.text || opt.label || '',
              votes: Array.isArray(opt.votes) ? [...opt.votes] : []
            }))
          : []
      );
      setIsClosed(Boolean(poll.isClosed));
      setAllowMultipleChoices(Boolean(poll.allowMultipleChoices || poll.allowMultiple));
    }
  }, [poll]);

  if (!isOpen || !poll) return null;

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions(prev => [...prev, { id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, text: '', votes: [] }]);
    }
  };

  const handleRemoveOption = async (indexToRemove) => {
    if (options.length <= 2) {
      alert("Un sondage doit comporter au moins 2 options.");
      return;
    }
    const opt = options[indexToRemove];
    const voteCount = Array.isArray(opt.votes) ? opt.votes.length : 0;
    if (voteCount > 0) {
      const ok = await confirm({
        title: "Supprimer l'option",
        message: `${voteCount} membre(s) ont déjà voté pour cette option. Sa suppression annulera leurs votes. Confirmer ?`,
        confirmText: "Oui, supprimer",
        cancelText: "Annuler",
        variant: "warning"
      });
      if (!ok) return;
    }
    setOptions(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOptionTextChange = (idx, value) => {
    setOptions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], text: value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const validOpts = options.filter(o => (o.text || '').trim() !== '');
    if (validOpts.length < 2) {
      alert("Veuillez conserver au moins 2 choix de réponse valides.");
      return;
    }
    const success = await onSave({
      pollId: poll.id,
      question: question.trim(),
      options: validOpts.map(o => ({ ...o, text: o.text.trim(), label: o.text.trim() })),
      isClosed,
      allowMultipleChoices
    });
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-lg bg-cordel-bg p-4 sm:p-5 relative border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20 shrink-0">
          <h3 className="font-extrabold text-sm sm:text-base text-encre-noire uppercase tracking-wider flex items-center gap-2">
            <span>✏️</span><span>Modifier le Sondage</span>
          </h3>
          <button type="button" onClick={onClose} disabled={loading} className="text-stone-500 hover:text-cordel-rouge font-black text-sm p-1 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left overflow-y-auto flex-1 pr-1">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">Question du sondage *</label>
            <input type="text" required value={question} onChange={(e) => setQuestion(e.target.value)} disabled={loading} className="theme-input w-full text-xs font-bold" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">Choix de réponses (les suffrages existants sont préservés)</label>
            {options.map((opt, idx) => {
              const voteCount = Array.isArray(opt.votes) ? opt.votes.length : 0;
              return (
                <div key={opt.id || idx} className="flex gap-2 items-center">
                  <input type="text" required value={opt.text} onChange={(e) => handleOptionTextChange(idx, e.target.value)} placeholder={`Choix ${idx + 1}...`} disabled={loading} className="theme-input text-xs flex-1 font-semibold py-1.5" />
                  {voteCount > 0 && (
                    <span className="text-[9px] font-black text-cordel-wood bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-300/40 shrink-0">
                      {voteCount} vote{voteCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {options.length > 2 && (
                    <button type="button" onClick={() => handleRemoveOption(idx)} disabled={loading} className="text-cordel-rouge hover:text-white text-xs font-black px-2 py-1 rounded bg-cordel-rouge/10 hover:bg-cordel-rouge border border-cordel-rouge/30 cursor-pointer" title="Supprimer">
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            {options.length < 10 && (
              <button type="button" onClick={handleAddOption} disabled={loading} className="text-[10px] font-black uppercase text-cordel-wood hover:underline mt-0.5 self-start cursor-pointer flex items-center gap-1">
                <span>➕</span><span>Ajouter un nouveau choix</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
            <div className="flex items-center justify-between p-2 rounded bg-stone-100 dark:bg-stone-800/40 border border-cordel-master-dark/20">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-encre-noire">Statut du scrutin</span>
                <span className="text-[9px] text-cordel-master-dark/70">{isClosed ? "Votes bloqués." : "Vote ouvert à tous."}</span>
              </div>
              <button type="button" onClick={() => setIsClosed(!isClosed)} className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded border cursor-pointer ${isClosed ? 'bg-[var(--color-cordel-vert)] text-white' : 'bg-[var(--color-cordel-rouge)] text-white'}`}>
                {isClosed ? "🔓 Rouvrir" : "🔒 Clôturer"}
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={allowMultipleChoices} onChange={(e) => setAllowMultipleChoices(e.target.checked)} disabled={loading} className="w-3.5 h-3.5 border border-encre-noire rounded accent-cordel-wood cursor-pointer" />
              <span className="text-[11px] font-bold text-encre-noire">Autoriser les choix multiples</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15 shrink-0">
            <CordelButton type="button" variant="default" onClick={onClose} disabled={loading} className="px-3 py-1.5 text-xs font-bold">Annuler</CordelButton>
            <CordelButton type="submit" variant="ocre" disabled={loading || !question.trim()} className="px-4 py-1.5 text-xs font-black uppercase">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
