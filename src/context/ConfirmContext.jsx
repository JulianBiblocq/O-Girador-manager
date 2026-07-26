import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ConfirmContext = createContext(null);

/**
 * ConfirmProvider - Fournisseur de contexte global pour les boîtes de confirmation modales.
 * Permet à n'importe quel composant ou hook de déclencher une confirmation asynchrone via useConfirm().
 */
export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Oui, confirmer',
    cancelText: 'Annuler',
    variant: 'danger',
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
          resolve
        });
      } else {
        setModalState({
          isOpen: true,
          title: options.title || (options.variant === 'warning' ? 'Avertissement' : 'Confirmation de suppression'),
          message: options.message || options.prompt || '',
          confirmText: options.confirmText || options.confirmLabel || (options.variant === 'warning' ? 'Confirmer' : 'Oui, supprimer'),
          cancelText: options.cancelText || options.cancelLabel || 'Annuler',
          variant: options.variant || 'danger',
          resolve
        });
      }
    });
  }, []);

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
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

/**
 * Hook useConfirm - permet de déclencher des modales de confirmation.
 * Usage:
 * const { confirm } = useConfirm();
 * const ok = await confirm("Voulez-vous supprimer cet élément ?");
 * if (!ok) return;
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm doit être utilisé à l'intérieur d'un ConfirmProvider");
  }
  return context;
}
