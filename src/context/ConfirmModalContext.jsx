/**
 * Contexte global pour les modales de confirmation et d'alerte Cordel.
 * Remplace de manière asynchrone window.confirm et window.alert.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import CordelConfirmModal from '../components/common/CordelConfirmModal';

export const ConfirmModalContext = createContext(null);
export const ConfirmContext = ConfirmModalContext;

/**
 * ConfirmModalProvider
 * Fournisseur de contexte global encapsulant la modale Cordel.
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

  // Surcharge globale sécurisée de window.alert
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (msg) => {
        alertModal(msg);
      };
    }
  }, [alertModal]);

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

  return (
    <ConfirmModalContext.Provider value={{ confirm, alert: alertModal }}>
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
    </ConfirmModalContext.Provider>
  );
}

// Alias ConfirmProvider pour compatibilité immédiate avec l'existant
export const ConfirmProvider = ConfirmModalProvider;

/**
 * Hook useConfirm
 * Supporte à la fois l'appel direct `const confirm = useConfirm(); await confirm(...)`
 * et la déstructuration `const { confirm, alert } = useConfirm();`.
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
  } else {
    confirmFn.alert = (options) => {
      const msg = typeof options === 'string' ? options : (options?.message || '');
      const nativeAlert = typeof window !== 'undefined' ? window['alert'] : null;
      if (nativeAlert) nativeAlert(msg);
      return Promise.resolve(true);
    };
  }

  return confirmFn;
}

export default ConfirmModalContext;
