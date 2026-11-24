/**
 * Contexte global pour les modales de confirmation, d'alerte et de saisie Cordel.
 * Remplace de manière asynchrone window.confirm, window.alert et window.prompt.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import CordelConfirmModal from '../components/common/CordelConfirmModal';
import CordelPromptModal from '../components/common/CordelPromptModal';
import { useTranslation } from '../components/LanguageContext';

export const ConfirmModalContext = createContext(null);
export const ConfirmContext = ConfirmModalContext;

export function ConfirmModalProvider({ children }) {
  const { t } = useTranslation();

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    cancelLabel: '',
    variant: 'danger',
    isAlert: false,
    resolve: null
  });

  const [promptState, setPromptState] = useState({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    placeholder: '',
    confirmLabel: '',
    cancelLabel: '',
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
          title: t('cordelModal.deleteConfirmTitle', 'Confirmation de suppression'),
          message: options,
          confirmLabel: t('common.yesDelete', 'Oui, supprimer'),
          cancelLabel: t('common.cancel', 'Annuler'),
          variant: 'danger',
          isAlert: false,
          resolve
        });
      } else {
        const opts = options || {};
        const variant = opts.variant || opts.confirmVariant || 'danger';
        const defaultTitle =
          variant === 'warning'
            ? t('cordelModal.warningTitle', 'Avertissement')
            : variant === 'success'
              ? t('common.success', 'Succès')
              : variant === 'info'
                ? t('cordelModal.infoTitle', 'Information')
                : t('cordelModal.confirmTitle', 'Confirmation');

        const defaultConfirm =
          variant === 'warning'
            ? t('common.confirm', 'Confirmer')
            : variant === 'success'
              ? t('cordelModal.ok', 'OK')
              : variant === 'danger'
                ? t('common.delete', 'Supprimer')
                : t('common.confirm', 'Confirmer');

        setModalState({
          isOpen: true,
          title: opts.title || defaultTitle,
          message: opts.message || opts.prompt || '',
          confirmLabel: opts.confirmLabel || opts.confirmText || defaultConfirm,
          cancelLabel: opts.cancelLabel || opts.cancelText || t('common.cancel', 'Annuler'),
          variant,
          isAlert: Boolean(opts.isAlert),
          resolve
        });
      }
    });
  }, [t]);

  const alertModal = useCallback((options) => {
    return new Promise((resolve) => {
      if (typeof options === 'string') {
        const lower = options.toLowerCase();
        const isSuccess = /succès|réussi|mis à jour|validé|enregistré|créé|sucesso|salvo|atualizado|validado|criado/.test(lower);
        const isError = /erreur|impossible|invalide|échec|erro|impossível|inválido|falha/.test(lower);

        setModalState({
          isOpen: true,
          title: isSuccess ? t('common.success', 'Succès') : isError ? t('common.error', 'Erreur') : t('cordelModal.infoTitle', 'Information'),
          message: options,
          confirmLabel: t('cordelModal.ok', 'OK'),
          cancelLabel: '',
          variant: isSuccess ? 'success' : isError ? 'danger' : 'info',
          isAlert: true,
          resolve
        });
      } else {
        const opts = options || {};
        setModalState({
          isOpen: true,
          title: opts.title || (opts.variant === 'success' ? t('common.success', 'Succès') : opts.variant === 'danger' ? t('common.error', 'Erreur') : t('cordelModal.infoTitle', 'Information')),
          message: opts.message || '',
          confirmLabel: opts.confirmLabel || opts.confirmText || t('cordelModal.ok', 'OK'),
          cancelLabel: '',
          variant: opts.variant || 'info',
          isAlert: true,
          resolve
        });
      }
    });
  }, [t]);

  const promptModal = useCallback((options, defaultVal = '') => {
    return new Promise((resolve) => {
      if (typeof options === 'string') {
        const lower = options.toLowerCase();
        const isMsg = lower.includes('message') || lower.includes('mensagem');
        const isLink = lower.includes('lien') || lower.includes('url') || lower.includes('link');
        const isRefus = /rejet|motif|refus|rejei|motivo|recus/.test(lower);

        setPromptState({
          isOpen: true,
          title: isMsg ? t('cordelModal.privateMessageTitle', 'Message privé') : isLink ? t('cordelModal.insertLinkTitle', 'Insérer un lien') : isRefus ? t('cordelModal.revisionReasonTitle', 'Motif de révision') : t('cordelModal.promptCordelTitle', 'Saisie Cordel'),
          message: options,
          defaultValue: defaultVal || '',
          placeholder: isMsg ? t('cordelModal.writeMessagePlaceholder', 'Écrivez votre message ici...') : isLink ? 'https://...' : '',
          confirmLabel: isMsg ? t('common.send', 'Envoyer') : isRefus ? t('common.confirm', 'Confirmer') : t('cordelModal.validate', 'Valider'),
          cancelLabel: t('common.cancel', 'Annuler'),
          variant: isRefus ? 'danger' : 'vert',
          multiline: isMsg || isRefus,
          inputType: isLink ? 'url' : 'text',
          badge: isMsg ? t('cordelModal.badgePrivateMsg', '💬 Message privé') : isLink ? t('cordelModal.badgeWebLink', '🔗 Lien web') : isRefus ? t('cordelModal.badgeReasonRequired', '⚠️ Motif requis') : t('cordelModal.badgeInputShort', '✏️ Saisie'),
          resolve
        });
      } else {
        const opts = options || {};
        setPromptState({
          isOpen: true,
          title: opts.title || t('cordelModal.promptRequiredTitle', 'Saisie requise'),
          message: opts.message || opts.prompt || '',
          defaultValue: opts.defaultValue || defaultVal || '',
          placeholder: opts.placeholder || '',
          confirmLabel: opts.confirmLabel || opts.confirmText || t('cordelModal.validate', 'Valider'),
          cancelLabel: opts.cancelLabel || opts.cancelText || t('common.cancel', 'Annuler'),
          variant: opts.variant || 'vert',
          multiline: Boolean(opts.multiline),
          inputType: opts.inputType || 'text',
          badge: opts.badge || '',
          resolve
        });
      }
    });
  }, [t]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (msg) => {
        alertModal(msg);
      };
      window.prompt = (msg, def) => {
        return promptModal(msg, def);
      };
    }
  }, [alertModal, promptModal]);

  const handleConfirm = useCallback(() => {
    if (modalState.resolve) modalState.resolve(true);
    setModalState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [modalState]);

  const handleCancel = useCallback(() => {
    if (modalState.resolve) modalState.resolve(false);
    setModalState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [modalState]);

  const handleConfirmPrompt = useCallback((value) => {
    if (promptState.resolve) promptState.resolve(value);
    setPromptState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [promptState]);

  const handleCancelPrompt = useCallback(() => {
    if (promptState.resolve) promptState.resolve(null);
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

export const ConfirmProvider = ConfirmModalProvider;

function buildConfirmCallable(context) {
  const confirmFn = (options) => {
    if (context?.confirm) return context.confirm(options);
    const msg = typeof options === 'string' ? options : (options?.message || options?.prompt || options?.title || '?');
    const fallbackConfirm = typeof window !== 'undefined' ? window['confirm'] : null;
    return Promise.resolve(fallbackConfirm ? fallbackConfirm(msg) : true);
  };

  const fallbackAlert = (options) => {
    const msg = typeof options === 'string' ? options : (options?.message || '');
    const nativeAlert = typeof window !== 'undefined' ? window['alert'] : null;
    if (nativeAlert) nativeAlert(msg);
    return Promise.resolve(true);
  };

  const fallbackPrompt = (options, defaultVal) => {
    const msg = typeof options === 'string' ? options : (options?.message || options?.title || '');
    const def = typeof options === 'object' ? (options?.defaultValue || defaultVal) : defaultVal;
    const nativePrompt = typeof window !== 'undefined' ? window['prompt'] : null;
    return Promise.resolve(nativePrompt ? nativePrompt(msg, def) : null);
  };

  confirmFn.confirm = confirmFn;
  confirmFn.alert = context ? context.alert : fallbackAlert; // confirmFn.alert = context.alert
  confirmFn.prompt = context ? context.prompt : fallbackPrompt;
  return confirmFn;
}

export function useConfirm() {
  const context = useContext(ConfirmModalContext);
  return useMemo(() => buildConfirmCallable(context), [context]);
}

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
