import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * Modale de scan QR Code pour smartphone.
 * Utilise la caméra du smartphone via html5-qrcode pour scanner le sessionId d'un PC,
 * puis appelle la Cloud Function Firebase approveQrSession pour valider la connexion.
 */
export default function QRScannerModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const html5QrcodeRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    let scannerInstance = null;

    const startScanner = async () => {
      setErrorMessage('');
      setSuccessMessage('');
      setLoading(false);

      try {
        // Attendre que l'élément DOM soit prêt
        await new Promise((resolve) => setTimeout(resolve, 300));
        const element = document.getElementById('qr-reader-container');
        if (!element) return;

        scannerInstance = new Html5Qrcode('qr-reader-container');
        html5QrcodeRef.current = scannerInstance;
        isScanningRef.current = true;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        // Démarrage de la caméra arrière ("environment")
        await scannerInstance.start(
          { facingMode: 'environment' },
          config,
          onScanSuccess,
          onScanFailure
        );
      } catch (err) {
        console.error("Erreur d'initialisation du scanner caméra :", err);
        setErrorMessage("Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur.");
      }
    };

    startScanner();

    // Nettoyage lors de la fermeture de la modale
    return () => {
      if (html5QrcodeRef.current && isScanningRef.current) {
        isScanningRef.current = false;
        html5QrcodeRef.current
          .stop()
          .catch((err) => console.warn("Erreur lors de l'arrêt du scanner :", err));
      }
    };
  }, [isOpen]);

  // Callback en cas de succès du décodage du QR Code
  const onScanSuccess = async (decodedText) => {
    if (!isScanningRef.current) return;
    isScanningRef.current = false;

    // Arrêt immédiat de la vidéo pour éviter les scans multiples
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.warn("Erreur arrêt scanner :", err);
      }
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Appel de la Cloud Function HTTPS Callable approveQrSession
      const approveFn = httpsCallable(functions, 'approveQrSession');
      const result = await approveFn({ sessionId: decodedText.trim() });

      if (result.data && result.data.success) {
        setSuccessMessage("PC connecté avec succès !");
        // Fermeture automatique après 1.5 seconde
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(result.data?.message || "La session n'a pas pu être validée.");
      }
    } catch (err) {
      console.error("Erreur lors de l'approbation de la session QR :", err);
      setErrorMessage(err.message || "Erreur de validation de la session. Code invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  // Callback facultatif d'échec de lecture à chaque frame (ignoré pour éviter les logs excessifs)
  const onScanFailure = (error) => {
    // Ne rien faire à chaque frame sans code
  };

  // Recommencer le scan en cas d'erreur
  const handleRestartScan = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(false);
    if (html5QrcodeRef.current) {
      isScanningRef.current = true;
      html5QrcodeRef.current
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          onScanFailure
        )
        .catch((err) => {
          console.error("Erreur redémarrage scanner :", err);
          setErrorMessage("Erreur lors du redémarrage de la caméra.");
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none outline-none animate-fade-in"
    >
      <div className="relative bg-cordel-bg max-w-sm w-full max-h-[90vh] flex flex-col rounded-lg border-4 border-encre-noire shadow-2xl overflow-hidden text-center">
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex items-center justify-between bg-cordel-bg">
          <h3 className="font-extrabold text-base uppercase tracking-wider text-cordel-wood">
            📸 Connecter un PC
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* 2. Body (Défilable verticalement) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center space-y-3">
          <p className="text-xs text-cordel-master-dark/80 font-medium">
            Pointez votre caméra vers le QR Code affiché sur l'écran de votre PC.
          </p>

          {/* Message de succès (Toast Vert Validation) */}
          {successMessage && (
            <div className="w-full bg-[#2d6a4f] text-white p-3 rounded-md border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] font-bold text-xs uppercase tracking-wider animate-bounce">
              ✅ {successMessage}
            </div>
          )}

          {/* Message d'erreur */}
          {errorMessage && (
            <div className="w-full bg-[#8b2a1a] text-white p-3 rounded-md border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] font-bold text-xs text-left">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Conteneur de chargement / attente */}
          {loading && (
            <div className="flex flex-col items-center gap-2 my-6">
              <div className="animate-spin text-3xl">⏳</div>
              <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                Validation de la connexion PC...
              </span>
            </div>
          )}

          {/* Vue vidéo Caméra pour le scan */}
          <div 
            className={`w-full overflow-hidden rounded-lg border-2 border-encre-noire bg-black relative min-h-[240px] ${
              (loading || successMessage) ? 'hidden' : 'block'
            }`}
          >
            <div id="qr-reader-container" className="w-full h-full"></div>
          </div>
        </div>

        {/* 3. Footer (Fixe en bas) */}
        <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/20 flex gap-2 w-full bg-cordel-bg">
          {errorMessage && !loading && (
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleRestartScan}
              className="flex-1 py-2 text-xs font-bold uppercase tracking-wider"
            >
              🔄 Réessayer
            </CordelButton>
          )}

          <CordelButton
            variant="default"
            useExtremeBorder={true}
            onClick={onClose}
            className="flex-1 py-2 text-xs font-bold uppercase tracking-wider !bg-[#8b2a1a] !text-white"
          >
            ✕ Fermer
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
