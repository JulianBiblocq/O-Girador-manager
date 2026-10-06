/**
 * Contexte global pour les modales de confirmation, d'alerte et de saisie Cordel.
 * Remplace de manière asynchrone window.confirm, window.alert et window.prompt.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import CordelConfirmModal from '../components/common/CordelConfirmModal';
import CordelPromptModal from '../components/common/CordelPromptModal';

export const ConfirmModalContext = createContext(null);
export const ConfirmContext = ConfirmModalContext;

/**
 * ConfirmModalProvider
 * Fournisseur de contexte global encapsulant les modales Cordel.
 */
export function ConfirmModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    variant: 'danger',
    isAlert: false,
    resolve: null
  });

  const [promptState, setPromptState] = useState({
    isOpen: false,
    title: 'Saisie requise',
    message: '',
    defaultValue: '',
    placeholder: '',
    confirmLabel: 'Valider',
    cancelLabel: 'Annuler',
    variant: 'vert',
    multiline: false,
    inputType: 'text',
    badge: '',
    resolve: null
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      if (typeof options === 'string') {
        setModalState({
          isOpen: true,
          title: 'Confirmation de suppression',
          message: options,
          confirmLabel: 'Oui, supprimer',
          cancelLabel: 'Annuler',
          variant: 'danger',
          isAlert: false,
          resolve
        });
      } else {
        const opts = options || {};
        const variant = opts.variant || 'danger';
        const defaultTitle =
          variant === 'warning'
            ? 'Avertissement'
            : variant === 'success'
            ? 'Succès'
            : variant === 'info'
            ? 'Information'
            : 'Confirmation';

        const defaultConfirm =
          variant === 'warning'
            ? 'Confirmer'
            : variant === 'success'
            ? 'OK'
            : variant === 'danger'
            ? 'Supprimer'
            : 'Confirmer';

        setModalState({
          isOpen: true,
          title: opts.title || defaultTitle,
          message: opts.message || opts.prompt || '',
          confirmLabel: opts.confirmLabel || opts.confirmText || defaultConfirm,
          cancelLabel: opts.cancelLabel || opts.cancelText || 'Annuler',
          variant,
          isAlert: Boolean(opts.isAlert),
          resolve
        });
      }
    });
  }, []);

  const alertModal = useCallback((options) => {
    return new Promise((resolve) => {
      if (typeof options === 'string') {
        const lower = options.toLowerCase();
        const isSuccess =
          lower.includes('succès') ||
          lower.includes('réussi') ||
          lower.includes('mis à jour') ||
          lower.includes('validé') ||
          lower.includes('enregistré') ||
          lower.includes('créé');
        const isError =
          lower.includes('erreur') ||
          lower.includes('impossible') ||
          lower.includes('invalide') ||
          lower.includes('échec');

        setModalState({
          isOpen: true,
          title: isSuccess ? 'Succès' : isError ? 'Erreur' : 'Information',
          message: options,
          confirmLabel: 'OK',
          cancelLabel: '',
          variant: isSuccess ? 'success' : isError ? 'danger' : 'info',
          isAlert: true,
          resolve
        });
      } else {
        const opts = options || {};
        setModalState({
          isOpen: true,
          title: opts.title || (opts.variant === 'success' ? 'Succès' : opts.variant === 'danger' ? 'Erreur' : 'Information'),
          message: opts.message || '',
          confirmLabel: opts.confirmLabel || opts.confirmText || 'OK',
          cancelLabel: '',
          variant: opts.variant || 'info',
          isAlert: true,
          resolve
        });
      }
    });
  }, []);

  const promptModal = useCallback((options, defaultVal = '') => {
    return new Promise((resolve) => {
      if (typeof options === 'string') {
        const lower = options.toLowerCase();
        const isMsg = lower.includes('message');
        const isLink = lower.includes('lien') || lower.includes('url');
        const isRefus = lower.includes('rejet') || lower.includes('motif') || lower.includes('refus');

        setPromptState({
          isOpen: true,
          title: isMsg ? 'Message privé' : isLink ? 'Insérer un lien' : isRefus ? 'Motif de révision' : 'Saisie Cordel',
          message: options,
          defaultValue: defaultVal || '',
          placeholder: isMsg ? 'Écrivez votre message ici...' : isLink ? 'https://...' : '',
          confirmLabel: isMsg ? 'Envoyer' : isRefus ? 'Confirmer' : 'Valider',
          cancelLabel: 'Annuler',
          variant: isRefus ? 'danger' : 'vert',
          multiline: isMsg || isRefus,
          inputType: isLink ? 'url' : 'text',
          badge: isMsg ? '💬 Message privé' : isLink ? '🔗 Lien web' : isRefus ? '⚠️ Motif requis' : '✏️ Saisie',
          resolve
        });
      } else {
        const opts = options || {};
        setPromptState({
          isOpen: true,
          title: opts.title || 'Saisie requise',
          message: opts.message || opts.prompt || '',
          defaultValue: opts.defaultValue || defaultVal || '',
          placeholder: opts.placeholder || '',
          confirmLabel: opts.confirmLabel || opts.confirmText || 'Valider',
          cancelLabel: opts.cancelLabel || opts.cancelText || 'Annuler',
          variant: opts.variant || 'vert',
          multiline: Boolean(opts.multiline),
          inputType: opts.inputType || 'text',
          badge: opts.badge || '',
          resolve
        });
      }
    });
  }, []);

  // Surcharges globales sécurisées de window.alert et window.prompt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (msg) => {
        alertModal(msg);
      };
      // Permet aux fonctions asynchrones d'appeler window.prompt tout en bénéficiant de la modale Cordel
      window.prompt = (msg, def) => {
        return promptModal(msg, def);
      };
    }
  }, [alertModal, promptModal]);

  const handleConfirm = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [modalState]);

  const handleCancel = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [modalState]);

  const handleConfirmPrompt = useCallback((value) => {
    if (promptState.resolve) {
      promptState.resolve(value);
    }
    setPromptState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [promptState]);

  const handleCancelPrompt = useCallback(() => {
    if (promptState.resolve) {
      promptState.resolve(null);
    }
    setPromptState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [promptState]);

  return (
    <ConfirmModalContext.Provider value={{ confirm, alert: alertModal, prompt: promptModal }}>
      {children}
      <CordelConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmLabel={modalState.confirmLabel}
        cancelLabel={modalState.cancelLabel}
        variant={modalState.variant}
        isAlert={modalState.isAlert}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <CordelPromptModal
        isOpen={promptState.isOpen}
        title={promptState.title}
        message={promptState.message}
        defaultValue={promptState.defaultValue}
        placeholder={promptState.placeholder}
        confirmLabel={promptState.confirmLabel}
        cancelLabel={promptState.cancelLabel}
        variant={promptState.variant}
        multiline={promptState.multiline}
        inputType={promptState.inputType}
        badge={promptState.badge}
        onConfirm={handleConfirmPrompt}
        onCancel={handleCancelPrompt}
      />
    </ConfirmModalContext.Provider>
  );
}

// Alias ConfirmProvider pour compatibilité immédiate avec l'existant
export const ConfirmProvider = ConfirmModalProvider;

/**
 * Hook useConfirm
 * Supporte à la fois l'appel direct `const confirm = useConfirm(); await confirm(...)`
 * et la déstructuration `const { confirm, alert, prompt } = useConfirm();`.
 * Intègre un repli sécurisé non-bloquant en cas d'appel temporaire hors Provider (HMR).
 */
export function useConfirm() {
  const context = useContext(ConfirmModalContext);

  const confirmFn = (options) => {
    if (context?.confirm) {
      return context.confirm(options);
    }
    // Repli de secours sécurisé si appelé pendant un rechargement HMR ou hors contexte
    const msg = typeof options === 'string' ? options : (options?.message || options?.prompt || options?.title || 'Confirmer ?');
    const fallbackConfirm = typeof window !== 'undefined' ? window['confirm'] : null;
    return Promise.resolve(fallbackConfirm ? fallbackConfirm(msg) : true);
  };

  confirmFn.confirm = confirmFn;
  if (context) {
    confirmFn.alert = context.alert;
    confirmFn.prompt = context.prompt;
  } else {
    confirmFn.alert = (options) => {
      const msg = typeof options === 'string' ? options : (options?.message || '');
      const nativeAlert = typeof window !== 'undefined' ? window['alert'] : null;
      if (nativeAlert) nativeAlert(msg);
      return Promise.resolve(true);
    };
    confirmFn.prompt = (options, defaultVal) => {
      const msg = typeof options === 'string' ? options : (options?.message || options?.title || '');
      const def = typeof options === 'object' ? (options?.defaultValue || defaultVal) : defaultVal;
      const nativePrompt = typeof window !== 'undefined' ? window['prompt'] : null;
      return Promise.resolve(nativePrompt ? nativePrompt(msg, def) : null);
    };
  }

  return confirmFn;
}

/**
 * Hook usePrompt
 * Permet d'ouvrir directement une invite de saisie Cordel.
 */
export function usePrompt() {
  const context = useContext(ConfirmModalContext);
  return context?.prompt || ((options, defaultVal) => {
    const msg = typeof options === 'string' ? options : (options?.message || options?.title || '');
    const def = typeof options === 'object' ? (options?.defaultValue || defaultVal) : defaultVal;
    const nativePrompt = typeof window !== 'undefined' ? window['prompt'] : null;
    return Promise.resolve(nativePrompt ? nativePrompt(msg, def) : null);
  });
}

export default ConfirmModalContext;

