import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from './useTranslation';

/**
 * Hook de dictée vocale (Speech-to-Text) basé sur la Web Speech API native du navigateur.
 * Fonctionnalité 100% native, sans clé API ni coût d'infrastructure.
 * Compatible avec Chrome (Desktop & Android), Edge, Safari (iOS 14.5+ et macOS).
 * S'adapte automatiquement à la langue active de l'application (français 'fr-FR' ou portugais 'pt-BR').
 */
export function useSpeechToText({ onTranscript, lang: propLang } = {}) {
  const { locale } = useTranslation() || {};
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const recognitionRef = useRef(null);

  // Détermination de la locale de reconnaissance (français ou portugais brésilien)
  const effectiveLang = propLang || (locale === 'pt' ? 'pt-BR' : 'fr-FR');

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;
    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  // Arrêt manuel de l'écoute
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorer si la reconnaissance est déjà arrêtée
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Démarrage de l'écoute vocale
  const startListening = useCallback(() => {
    setErrorMessage(null);

    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      setErrorMessage("La reconnaissance vocale n'est pas disponible sur ce navigateur.");
      return;
    }

    // Bascule marche/arrêt si déjà actif
    if (isListening && recognitionRef.current) {
      stopListening();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = effectiveLang;
      recognition.continuous = false; // Capture une phrase ou réplique naturelle
      recognition.interimResults = false; // Uniquement le texte final validé
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcriptText = event.results[lastResultIndex][0]?.transcript;
        if (transcriptText && onTranscript) {
          onTranscript(transcriptText);
        }
      };

      recognition.onerror = (event) => {
        console.warn("SpeechToText - Erreur :", event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage("Accès microphone refusé. Veuillez l'autoriser dans votre navigateur.");
        } else if (event.error === 'no-speech') {
          // Aucun son détecté, arrêt transparent
        } else {
          setErrorMessage(`Erreur de dictée vocale (${event.error})`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("SpeechToText - Exception au lancement :", err);
      setIsListening(false);
      setErrorMessage("Impossible d'activer le microphone.");
    }
  }, [effectiveLang, isListening, onTranscript, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Nettoyage au démontage du composant hôte
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorer
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    errorMessage,
    clearError: () => setErrorMessage(null),
    startListening,
    stopListening,
    toggleListening
  };
}
