/**
 * Modale Cordel d'inscription tardive (Demande de place après date limite).
 * Permet à un membre de solliciter une place de dernière minute avec un mot explicatif
 * et un choix de pupitre, pour validation par l'équipe régie / Mestre.
 *
 * Conforme à la charte graphique Cordel et à la règle anti-monolithe.
 */

import React, { useState, useEffect } from 'react';
import CordelButton from '../CordelButton';

/**
 * @param {boolean} isOpen Indique si la modale est visible
 * @param {Function} onClose Callback de fermeture / annulation
 * @param {Function} onConfirm Callback déclenché à la soumission ({ message, instrumentChoisi })
 * @param {string} [eventName] Intitulé de l'événement concerné
 * @param {Array<string>} [instrumentsDisponibles=[]] Liste des pupitres / instruments
 * @param {string} [defaultInstrument=''] Instrument pré-sélectionné
 * @param {boolean} [includesPercussion=true] Indique si l'événement comporte des percussions
 * @param {boolean} [submitting=false] Indique si l'envoi est en cours
 */
export default function LateRegistrationModal({
  isOpen,
  onClose,
  onConfirm,
  eventName = '',
  instrumentsDisponibles = [],
  defaultInstrument = '',
  includesPercussion = true,
  submitting = false
}) {
  const [message, setMessage] = useState('');
  const [instrument, setInstrument] = useState(defaultInstrument || 'Autre');

  // Réinitialisation des états à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setInstrument(defaultInstrument || instrumentsDisponibles[0] || 'Autre');
    }
  }, [isOpen, defaultInstrument, instrumentsDisponibles]);

  // Fermeture sur la touche Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    await onConfirm({
      message: message.trim(),
      instrumentChoisi: includesPercussion ? instrument : null
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="late-reg-modal-title"
    >
      <div className="relative z-10 bg-cordel-bg dark:bg-[#1a1918] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] rounded-[8px_12px_7px_10px] p-5 max-w-lg w-full text-left overflow-hidden flex flex-col gap-4 max-h-[90vh]">
        {/* En-tête avec titre et bouton fermer */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/20 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded border flex items-center justify-center text-base shrink-0 bg-[#2d6a4f]/15 text-[#2d6a4f] border-[#2d6a4f]/30 shadow-xs">
              🎟️
            </span>
            <div className="flex flex-col">
              <h3 id="late-reg-modal-title" className="text-sm font-black uppercase tracking-wider text-cordel-wood">
                Demande de place de dernière minute
              </h3>
              {eventName && (
                <span className="text-[11px] font-bold text-cordel-master-dark/80 truncate max-w-[280px]">
                  {eventName}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-stone-500 hover:text-encre-noire p-1 text-sm font-black cursor-pointer transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Message d'information bienveillant */}
        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/20 border-2 border-dashed border-[#2d6a4f]/30 rounded-[6px_8px_6px_8px] text-xs leading-relaxed text-encre-noire">
          <p className="font-medium">
            Les inscriptions sont closes et les pupitres sont en cours de calage.
            Tu peux faire une demande pour voir s'il reste une place disponible ou s'il y a eu un désistement.
          </p>
        </div>

        {/* Formulaire de demande */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Sélection de l'instrument si percussions */}
          {includesPercussion && instrumentsDisponibles.length > 0 && (
            <div className="flex flex-col gap-1">
              <label htmlFor="late-reg-instrument" className="text-[11px] font-black uppercase tracking-wide text-cordel-wood">
                Pupitre / Instrument souhaité :
              </label>
              <select
                id="late-reg-instrument"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                disabled={submitting}
                className="w-full text-xs font-bold p-2 bg-cordel-bg-light border-2 border-encre-noire/40 rounded-[4px_6px_5px_4px] text-encre-noire"
              >
                {instrumentsDisponibles.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message libre pour l'organisation */}
          <div className="flex flex-col gap-1">
            <label htmlFor="late-reg-message" className="text-[11px] font-black uppercase tracking-wide text-cordel-wood">
              Ton message pour l'organisation (disponibilité, instrument, transport...) :
            </label>
            <textarea
              id="late-reg-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={submitting}
              placeholder="Ex : Je suis finalement disponible, j'ai mon alfaia et je peux covoiturer si besoin..."
              className="w-full text-xs font-semibold p-2.5 rounded-[4px_6px_5px_4px] bg-cordel-bg-light border-2 border-encre-noire/40 focus:border-encre-noire outline-none resize-none leading-relaxed text-encre-noire"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/15 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-bold text-encre-noire/75 hover:text-encre-noire hover:bg-black/5 rounded cursor-pointer transition-colors"
            >
              Fermer
            </button>
            <CordelButton
              type="submit"
              variant="vert"
              useExtremeBorder={true}
              disabled={submitting}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider"
            >
              {submitting ? "Envoi..." : "Envoyer ma demande de place"}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
