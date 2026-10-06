/**
 * Composant de boîte de dialogue de saisie (Prompt) style Cordel / Xilo.
 * Remplace de manière asynchrone et élégante le window.prompt natif du navigateur.
 * Conforme à la charte Cordel (papier kraft, bordures franches asymétriques, encre noire, typographie heading).
 */

import React, { useState, useEffect, useRef } from 'react';
import CordelButton from '../CordelButton';
import { XiloChat, XiloQuill, XiloShield, XiloClose } from '../XiloIcons';

/**
 * CordelPromptModal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen Indique si la modale est visible
 * @param {string} props.title Titre en en-tête
 * @param {string} props.message Message explicatif / consigne
 * @param {string} [props.defaultValue=''] Valeur initiale dans le champ
 * @param {string} [props.placeholder=''] Texte indicatif
 * @param {string} [props.confirmLabel='Valider'] Texte du bouton de validation
 * @param {string} [props.cancelLabel='Annuler'] Texte du bouton d'annulation
 * @param {'vert'|'ocre'|'danger'|'info'|'default'} [props.variant='vert'] Variante sémantique de couleur
 * @param {boolean} [props.multiline=false] Si true, affiche un textarea au lieu d'un input
 * @param {string} [props.inputType='text'] Type HTML du champ (text, url, email...)
 * @param {string} [props.badge] Libellé du badge supérieur (ex. "💬 Message privé")
 * @param {Function} props.onConfirm Callback déclenché avec la valeur saisie
 * @param {Function} props.onCancel Callback déclenché à l'annulation (renvoie null)
 */
export default function CordelPromptModal({
  isOpen,
  title = 'Saisie requise',
  message = '',
  defaultValue = '',
  placeholder = '',
  confirmLabel = 'Valider',
  cancelLabel = 'Annuler',
  variant = 'vert',
  multiline = false,
  inputType = 'text',
  badge = '',
  onConfirm,
  onCancel
}) {
  const [inputValue, setInputValue] = useState(defaultValue || '');
  const inputRef = useRef(null);

  // Synchronisation de la valeur initiale et focus automatique à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue || '');
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (defaultValue && !multiline && typeof inputRef.current.select === 'function') {
            inputRef.current.select();
          }
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultValue, multiline]);

  // Raccourcis clavier globaux : Échap pour annuler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isVert = variant === 'vert' || variant === 'success';

  // Détection du type de contenu pour l'icône et l'intitulé
  const lowerMsg = (message + ' ' + title).toLowerCase();
  const isChat = lowerMsg.includes('message') || lowerMsg.includes('écrire') || lowerMsg.includes('discussion');

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onConfirm?.(inputValue);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cordel-prompt-title"
    >
      {/* Carte centrale Cordel avec texture kraft et bordures franches */}
      <div className="relative z-10 bg-cordel-bg dark:bg-[#1a1918] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] rounded-[8px_12px_7px_10px] p-4 sm:p-5 max-w-md w-full text-left overflow-hidden flex flex-col gap-3.5 max-h-[90vh]">
        {/* Formulaire englobant pour prise en charge native de la touche Entrée */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 m-0 p-0">
          
          {/* En-tête avec icône gravée Xilo et titre */}
          <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/20 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <span
                className={`p-2 rounded border shadow-xs shrink-0 ${
                  isDanger
                    ? 'bg-[var(--color-cordel-rouge)]/15 text-[var(--color-cordel-rouge)] dark:text-red-400 border-[var(--color-cordel-rouge)]/30'
                    : isWarning
                    ? 'bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] dark:text-amber-400 border-[var(--color-cordel-ocre)]/30'
                    : isVert
                    ? 'bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] dark:text-emerald-400 border-[var(--color-cordel-vert)]/30'
                    : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                }`}
              >
                {isDanger ? (
                  <XiloShield size={22} />
                ) : isChat ? (
                  <XiloChat size={22} />
                ) : (
                  <XiloQuill size={22} />
                )}
              </span>

              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-cordel-wood opacity-85">
                  {badge || (isChat ? '💬 Message privé' : isDanger ? '⚠️ Attention' : isWarning ? '📋 Ajustement' : '✏️ Saisie Cordel')}
                </span>
                <h3
                  id="cordel-prompt-title"
                  className="font-heading font-black text-base uppercase tracking-wider text-encre-noire dark:text-cordel-bg"
                >
                  {title}
                </h3>
              </div>
            </div>

            {/* Bouton de fermeture d'angle */}
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-cordel-master-dark/60 hover:text-cordel-master-dark transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
              title="Fermer (Échap)"
              aria-label="Fermer"
            >
              <XiloClose size={18} />
            </button>
          </div>

          {/* Consigne / Message explicatif */}
          {message && (
            <div className="bg-white/70 dark:bg-black/30 p-3 rounded border border-cordel-master-dark/15 shrink-0">
              <p className="text-xs font-semibold text-encre-noire dark:text-cordel-bg leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
          )}

          {/* Champ de saisie Cordel (multiline ou single line) */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {multiline ? (
              <textarea
                ref={inputRef}
                rows={4}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full p-3 text-xs sm:text-sm font-medium rounded-[4px_6px_5px_6px] border-2 border-encre-noire bg-white dark:bg-black/40 text-encre-noire dark:text-cordel-bg placeholder-stone-400 focus:outline-hidden focus:border-[var(--color-cordel-vert)] focus:ring-1 focus:ring-[var(--color-cordel-vert)] shadow-inner resize-y transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            ) : (
              <input
                ref={inputRef}
                type={inputType}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full p-2.5 text-xs sm:text-sm font-medium rounded-[4px_6px_5px_6px] border-2 border-encre-noire bg-white dark:bg-black/40 text-encre-noire dark:text-cordel-bg placeholder-stone-400 focus:outline-hidden focus:border-[var(--color-cordel-vert)] focus:ring-1 focus:ring-[var(--color-cordel-vert)] shadow-inner transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            )}

            {multiline && (
              <span className="text-[10px] text-cordel-master-dark/60 italic text-right">
                Astuce : Ctrl + Entrée pour valider
              </span>
            )}
          </div>

          {/* Boutons d'action Cordel */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/20 shrink-0">
            <CordelButton
              variant="default"
              type="button"
              onClick={onCancel}
              className="text-xs px-4 py-2 opacity-90 hover:opacity-100"
            >
              {cancelLabel}
            </CordelButton>

            <button
              type="submit"
              className={`text-xs font-black uppercase tracking-wider px-5 py-2 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all border border-encre-noire cursor-pointer ${
                isDanger
                  ? 'bg-[var(--color-cordel-rouge)] hover:brightness-110 text-white'
                  : isWarning
                  ? 'bg-[var(--color-cordel-ocre)] hover:brightness-110 text-white'
                  : 'bg-[var(--color-cordel-vert)] hover:brightness-110 text-white'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
