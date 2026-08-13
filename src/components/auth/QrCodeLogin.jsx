import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, db } from '../../firebase';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * Composant de connexion PC par QR Code (Style WhatsApp Web).
 * Génère un sessionId unique dans Firestore (qr_sessions/{sessionId}),
 * affiche le QR Code et écoute en temps réel les changements jusqu'à approbation
 * par l'application mobile de l'utilisateur.
 */
export default function QrCodeLogin() {
  const { t } = useTranslation();
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('loading'); // 'chargement de' | 'pending' | 'approved' | 'expired' | 'error'
  const [timeLeft, setTimeLeft] = useState(120); // 120 secondes (2 minutes)
  const [errorMessage, setErrorMessage] = useState('');
  const unsubscribeRef = useRef(null);
  const timerRef = useRef(null);

  // Fonction pour initialiser une nouvelle session QR Code
  const generateNewSession = async () => {
    // Nettoyer l'écouteur et le timer existants
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      setStatus('loading');
      setErrorMessage('');
      
      const newSessionId = crypto.randomUUID();
      const expirationTime = Date.now() + 120000; // Expiration dans 2 minutes

      // Création du document de session dans Firestore
      await setDoc(doc(db, 'qr_sessions', newSessionId), {
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: expirationTime
      });

      setSessionId(newSessionId);
      setStatus('pending');
      setTimeLeft(120);

      // Compte à rebours local de 120 secondes
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Écoute en temps réel du document de session
      unsubscribeRef.current = onSnapshot(
        doc(db, 'qr_sessions', newSessionId),
        async (snapshot) => {
          if (!snapshot.exists()) return;

          const data = snapshot.data();

          // Si la session a été approuvée avec un customToken
          if (data.status === 'approved' && data.customToken) {
            setStatus('approved');
            
            // Arrêt du timer et déconnexion de l'écouteur
            if (timerRef.current) clearInterval(timerRef.current);
            if (unsubscribeRef.current) unsubscribeRef.current();

            try {
              // Connexion avec le Custom Token Firebase
              await signInWithCustomToken(auth, data.customToken);

              // Nettoyage du document Firestore de session
              await deleteDoc(doc(db, 'qr_sessions', newSessionId));
            } catch (err) {
              console.error("Erreur lors de la connexion par Custom Token :", err);
              setErrorMessage("Erreur d'authentification par QR Code.");
              setStatus('error');
            }
          }
        },
        (error) => {
          console.error("Erreur écouteur Firestore qr_sessions :", error);
          setErrorMessage("Erreur de communication avec le serveur.");
          setStatus('error');
        }
      );

    } catch (err) {
      console.error("Erreur création session QR Code :", err);
      setErrorMessage("Impossible de générer le QR Code.");
      setStatus('error');
    }
  };

  // Effet au montage du composant : génération initiale de la session
  useEffect(() => {
    generateNewSession();

    // Nettoyage au démontage
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Formatage des secondes en formater MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center select-none animate-fade-in">
      <h3 className="font-extrabold text-sm uppercase tracking-wider text-cordel-wood mb-2">
        {t('qrLogin.title') || "Connexion par QR Code"}
      </h3>
      <p className="text-xs text-cordel-master-dark/80 max-w-xs mb-4 leading-relaxed font-medium">
        {t('qrLogin.instruction') || "Ouvrez l'application sur votre téléphone > Profil > Connecter un PC, puis scannez ce code."}
      </p>

      {/* Zone QR Code */}
      <div className="relative p-4 bg-white border-4 border-encre-noire rounded-lg shadow-[4px_4px_0px_0px_#181716] flex flex-col items-center justify-center min-w-[240px] min-h-[240px]">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="animate-spin text-3xl">⏳</div>
            <span className="text-xs font-bold text-cordel-master-dark uppercase tracking-widest">
              Génération du code...
            </span>
          </div>
        )}

        {status === 'pending' && sessionId && (
          <div className="flex flex-col items-center gap-3">
            <QRCodeSVG 
              value={sessionId} 
              size={200}
              level="H"
              includeMargin={true}
            />
            <div className="flex items-center gap-1.5 text-xs font-bold text-cordel-master-dark bg-cordel-bg-light px-3 py-1 rounded border border-dashed border-encre-noire/30">
              <span>⏱️ Expiration :</span>
              <span className={timeLeft < 30 ? "text-red-700 font-extrabold animate-pulse" : "text-cordel-wood font-extrabold"}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        )}

        {status === 'approved' && (
          <div className="flex flex-col items-center gap-2 py-8 text-emerald-800 dark:text-emerald-300">
            <span className="text-4xl animate-bounce">✅</span>
            <span className="text-xs font-black uppercase tracking-wider">
              Connexion réussie !
            </span>
            <span className="text-[10px] text-cordel-master-dark/70">
              Redirection vers le tableau de bord...
            </span>
          </div>
        )}

        {status === 'expired' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <span className="text-3xl">⌛</span>
            <span className="text-xs font-bold text-cordel-wood uppercase tracking-wider">
              Le QR Code a expiré
            </span>
            <CordelButton 
              variant="ocre" 
              useExtremeBorder={true}
              onClick={generateNewSession}
              className="text-xs py-2 px-4 uppercase font-bold"
            >
              🔄 Générer un nouveau code
            </CordelButton>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <span className="text-3xl">⚠️</span>
            <span className="text-xs font-bold text-red-700 dark:text-red-400">
              {errorMessage || "Une erreur est survenue"}
            </span>
            <CordelButton 
              variant="ocre" 
              useExtremeBorder={true}
              onClick={generateNewSession}
              className="text-xs py-2 px-4 uppercase font-bold"
            >
              🔄 Réessayer
            </CordelButton>
          </div>
        )}
      </div>

      {/* Note d'aide explicative */}
      <div className="mt-4 text-[10px] font-semibold text-cordel-master-dark/60 max-w-xs">
        🔒 Le QR Code est à usage unique et sécurisé. Il expire automatiquement au bout de 2 minutes.
      </div>
    </div>
  );
}
