import { useEffect, useRef } from 'react';

const modalStack = [];
let ignoreNextPop = false;

const globalPopStateHandler = (e) => {
  if (ignoreNextPop) {
    ignoreNextPop = false;
    return;
  }
  if (modalStack.length > 0) {
    const topModal = modalStack.pop();
    topModal.popped = true;
    topModal.onClose();
  }
};

/**
 * Hook to intercept the hardware back button (or browser back button)
 * When isOpen is true, a fake state is pushed to the browser history.
 * If the user presses the back button, the state is popped and onClose is called.
 * If the component is closed manually (e.g. by a close button), the hook
 * cleans up the history state by calling window.history.back().
 * 
 * @param {boolean} isOpen - whether the modal/sub-view is currently open
 * @param {function} onClose - function to call when the back button is pressed
 */
export default function useHardwareBack(isOpen, onClose) {
  const modalObj = useRef({ onClose, popped: false });

  // Always keep the latest onClose reference
  useEffect(() => {
    modalObj.current.onClose = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      modalObj.current.popped = false;
      const lockId = Date.now() + Math.random();
      
      // Push a fake state to absorb the back button press
      // We copy the existing state so App.jsx doesn't break if it reads event.state
      window.history.pushState({ ...window.history.state, modalLockId: lockId }, '');
      
      modalStack.push(modalObj.current);

      if (modalStack.length === 1) { // First modal
        window.addEventListener('popstate', globalPopStateHandler);
      }

      return () => {
        const idx = modalStack.indexOf(modalObj.current);
        if (idx !== -1) {
          modalStack.splice(idx, 1);
        }
        
        // If modal was closed via UI, we need to clean up the history stack
        if (!modalObj.current.popped && window.history.state?.modalLockId === lockId) {
          ignoreNextPop = true;
          window.history.back();
        }

        if (modalStack.length === 0) {
          window.removeEventListener('popstate', globalPopStateHandler);
        }
      };
    }
  }, [isOpen]);
}
