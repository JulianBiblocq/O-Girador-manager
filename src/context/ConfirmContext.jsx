import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ConfirmContext = createContext(null);

/**
 * ConfirmProvider - Fournisseur de contexte global pour les boîtes de confirmation et alertes modales.
 * Permet à n'importe quel composant ou hook de déclencher une confirmation ou alerte asynchrone via useConfirm().
 */
export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Oui, confirmer',
    cancelText: 'Annuler',
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
          confirmText: 'Oui, supprimer',
          cancelText: 'Annuler',
          variant: 'danger',
          isAlert: false,
          resolve
        });
      } else {
        setModalState({
          isOpen: true,
          title: options.title || (options.variant === 'warning' ? 'Avertissement' : options.variant === 'success' ? 'Succès' : 'Confirmation'),
          message: options.message || options.prompt || '',
          confirmText: options.confirmText || options.confirmLabel || (options.variant === 'warning' ? 'Confirmer' : options.variant === 'success' ? 'OK' : 'Oui, supprimer'),
          cancelText: options.cancelText || options.cancelLabel || 'Annuler',
          variant: options.variant || 'danger',
          isAlert: Boolean(options.isAlert),
          resolve
        });
      }
    });
  }, []);

  const alertModal = useCallback((options) => {
    return new Promise((resolve) => {
      if (typeof options === 'string') {
        const lower = options.toLowerCase();
        const isSuccess = lower.includes('succès') || lower.includes('réussi') || lower.includes('mis à jour') || lower.includes('validé') || lower.includes('enregistré') || lower.includes('créé');
        const isError = lower.includes('erreur') || lower.includes('impossible') || lower.includes('invalide') || lower.includes('échec');
        
        setModalState({
          isOpen: true,
          title: isSuccess ? 'Succès' : isError ? 'Erreur' : 'Information',
          message: options,
          confirmText: 'OK',
          cancelText: '',
          variant: isSuccess ? 'success' : isError ? 'danger' : 'info',
          isAlert: true,
          resolve
        });
      } else {
        setModalState({
          isOpen: true,
          title: options.title || (options.variant === 'success' ? 'Succès' : options.variant === 'danger' ? 'Erreur' : 'Information'),
          message: options.message || '',
          confirmText: options.confirmText || 'OK',
          cancelText: '',
          variant: options.variant || 'info',
          isAlert: true,
          resolve
        });
      }
    });
  }, []);

  // Surcharge globale de window.alert pour convertir toutes les alertes navigateur en modales Cordel
  useEffect(() => {
    window.alert = (msg) => {
      alertModal(msg);
    };
  }, [alertModal]);

  const handleConfirm = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [modalState]);

  const handleCancel = useCallback(() => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [modalState]);

  return (
    <ConfirmContext.Provider value={{ confirm, alert: alertModal }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        isAlert={modalState.isAlert}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

/**
 * Hook useConfirm - permet de déclencher des modales de confirmation et d'alerte Cordel.
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm doit être utilisé à l'intérieur d'un ConfirmProvider");
  }
  return context;
}
