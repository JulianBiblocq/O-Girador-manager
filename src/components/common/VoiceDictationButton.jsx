import { useEffect } from 'react';
import { useSpeechToText } from '../../hooks/useSpeechToText';

/**
 * Bouton réutilisable de dictée vocale (Speech-to-Text) au style Cordel.
 * Détecte la parole de l'utilisateur et renvoie le texte transcrit via `onTranscript`.
 */
export default function VoiceDictationButton({
  onTranscript,
  className = '',
  size = 'md',
  disabled = false,
  title = 'Dicter le texte à la voix'
}) {
  const {
    isListening,
    isSupported,
    errorMessage,
    clearError,
    toggleListening
  } = useSpeechToText({ onTranscript });

  // Effacement automatique du message d'erreur après 4 secondes
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => clearError(), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, clearError]);

  if (!isSupported) {
    return null; // Invisible si le navigateur ne dispose pas de la Web Speech API
  }

  const isSmall = size === 'sm';

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`${
          isSmall ? 'w-7 h-7 text-xs' : 'w-9 h-[38px] text-sm'
        } flex items-center justify-center rounded border-2 transition-all cursor-pointer shrink-0 select-none ${
          isListening
            ? 'bg-[var(--color-cordel-rouge,#8b2a1a)] text-white border-encre-noire animate-pulse shadow-md ring-2 ring-red-400'
            : 'bg-cordel-bg hover:bg-white text-encre-noire border-encre-noire/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={isListening ? "Écoute en cours... Cliquez pour stopper" : title}
        aria-label={isListening ? "Arrêter la dictée vocale" : "Démarrer la dictée vocale"}
      >
        {isListening ? (
          <span className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        ) : (
          <span>🎙️</span>
        )}
      </button>

      {/* Info-bulle d'erreur contextuelle */}
      {errorMessage && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 px-2 py-1 bg-stone-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap border border-white/20 animate-fade-in">
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
}
