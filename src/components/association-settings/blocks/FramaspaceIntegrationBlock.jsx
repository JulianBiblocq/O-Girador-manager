import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../LanguageContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';

/**
 * Composant : FramaspaceIntegrationBlock
 * 
 * Bloc modulaire d'administration pour la configuration et le test des identifiants
 * techniques Framaspace (Nextcloud WebDAV & OCS Share API).
 * 
 * Stocke les clés de manière sécurisée dans :
 * associations/{groupId}/private_settings/credentials
 * 
 * @param {string} groupId Identifiant de l'association
 * @param {Object} formData Données du formulaire parent (si utilisé dans useAssociationSettings)
 * @param {Function} handleChange Callback de mise à jour parent
 * @param {boolean} saving Indicateur de sauvegarde parente
 * @param {boolean} isStandalone Si vrai, gère de manière autonome la lecture et l'écriture Firestore
 */
export default function FramaspaceIntegrationBlock({
  groupId,
  formData = {},
  handleChange,
  saving = false,
  isStandalone = false
}) {
  const { t } = useTranslation();
  // États locaux pour le mode autonome (ex: intégré dans StudioCloudHeader)
  const [localUrl, setLocalUrl] = useState(formData.framaspaceUrl || '');
  const [localUsername, setLocalUsername] = useState(formData.framaspaceUsername || '');
  const [localPassword, setLocalPassword] = useState(formData.framaspaceAppPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingCreds, setLoadingCreds] = useState(isStandalone);
  const [localSaving, setLocalSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // États du test de connexion
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

  // Synchronisation des valeurs selon le mode (autonome ou formulaire parent)
  const effectiveUrl = isStandalone ? localUrl : (formData.framaspaceUrl || '');
  const effectiveUsername = isStandalone ? localUsername : (formData.framaspaceUsername || '');
  const effectivePassword = isStandalone ? localPassword : (formData.framaspaceAppPassword || '');

  const updateField = (field, value) => {
    if (isStandalone) {
      if (field === 'framaspaceUrl') setLocalUrl(value);
      if (field === 'framaspaceUsername') setLocalUsername(value);
      if (field === 'framaspaceAppPassword') setLocalPassword(value);
    }
    if (handleChange) {
      handleChange(field, value);
    }
  };

  // Chargement autonome des identifiants depuis Firestore si isStandalone
  useEffect(() => {
    if (!isStandalone || !groupId) return;

    let isMounted = true;
    const fetchCreds = async () => {
      try {
        const credsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
        const snap = await getDoc(credsRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          if (data.framaspaceUrl) setLocalUrl(data.framaspaceUrl);
          if (data.framaspaceUsername) setLocalUsername(data.framaspaceUsername);
          if (data.framaspaceAppPassword) setLocalPassword(data.framaspaceAppPassword);
        } else if (isMounted) {
          // Tenter de récupérer l'URL racine du cloud depuis le document association
          const assocSnap = await getDoc(doc(db, 'associations', groupId));
          if (assocSnap.exists()) {
            const a = assocSnap.data();
            if (a.cloudRootUrl || a.framaspaceUrl) {
              setLocalUrl(a.cloudRootUrl || a.framaspaceUrl);
            }
          }
        }
      } catch (err) {
        console.error("FramaspaceIntegrationBlock - Erreur chargement credentials :", err);
      } finally {
        if (isMounted) setLoadingCreds(false);
      }
    };

    fetchCreds();
    return () => { isMounted = false; };
  }, [isStandalone, groupId]);

  // Sauvegarde autonome dans Firestore
  const handleSaveStandalone = async (e) => {
    if (e) e.preventDefault();
    if (!groupId) return;

    setLocalSaving(true);
    setSaveSuccess(false);
    try {
      const cleanUrl = localUrl.trim().replace(/\/+$/, '');
      const cleanUser = localUsername.trim();
      const cleanPass = localPassword.trim();

      const credsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
      await setDoc(credsRef, {
        framaspaceUrl: cleanUrl,
        framaspaceUsername: cleanUser,
        framaspaceAppPassword: cleanPass
      }, { merge: true });

      // Synchroniser également le champ cloudRootUrl de l'association pour la navigation rapide
      if (cleanUrl) {
        const assocRef = doc(db, 'associations', groupId);
        await updateDoc(assocRef, {
          cloudRootUrl: cleanUrl
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("FramaspaceIntegrationBlock - Erreur enregistrement :", err);
      alert("Erreur lors de l'enregistrement des identifiants : " + (err.message || err));
    } finally {
      setLocalSaving(false);
    }
  };

  // Exécution du test de connexion WebDAV / OCS via Cloud Function
  const handleTestConnection = async () => {
    if (!effectiveUrl || !effectiveUsername || !effectivePassword) {
      setTestResult({
        success: false,
        message: t('settings.modules.framaspaceIntegrationBlock.veuillezRenseignerLUrlDe') || "Veuillez renseigner l'URL de l'instance, l'identifiant et le mot de passe d'application avant de tester."
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const testFn = httpsCallable(functions, 'testFramaspaceConnection');
      const response = await testFn({
        framaspaceUrl: effectiveUrl.trim(),
        framaspaceUsername: effectiveUsername.trim(),
        framaspaceAppPassword: effectivePassword.trim(),
        groupId
      });

      const resData = response?.data || {};

      if (resData.success) {
        setTestResult({
          success: true,
          httpStatus: resData.httpStatus,
          message: resData.message || "✓ Connexion réussie ! WebDAV et authentification validés."
        });
      } else {
        setTestResult({
          success: false,
          httpStatus: resData.httpStatus,
          message: resData.message || "Échec de la connexion à Framaspace."
        });
      }
    } catch (err) {
      // Journalisation complète et détaillée de l'objet d'erreur
      console.error("FramaspaceIntegrationBlock - Erreur complète test connexion :", {
        code: err?.code,
        message: err?.message,
        details: err?.details,
        customData: err?.customData,
        name: err?.name,
        raw: err
      });

      let errorMsg = err?.message || "Erreur de connexion.";
      if (err?.code === 'not-found' || err?.code === 'functions/not-found') {
        errorMsg = "La fonction Cloud 'testFramaspaceConnection' n'est pas encore déployée sur Firebase (code: not-found). Veuillez exécuter le déploiement des fonctions.";
      } else if (err?.code === 'unauthenticated') {
        errorMsg = "Session expirée ou utilisateur non authentifié dans l'application.";
      } else if (err?.code === 'permission-denied') {
        errorMsg = "Droits insuffisants pour tester la connexion (administrateur requis).";
      } else if (err?.code === 'unavailable') {
        errorMsg = "Service Cloud Functions temporairement indisponible ou problème de connectivité réseau.";
      }

      setTestResult({
        success: false,
        code: err?.code,
        details: err?.details,
        message: errorMsg
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-encre-noire shadow-xs text-left select-none">
      
      {/* En-tête du bloc */}
      <div className="border-b border-dashed border-cordel-master-dark/20 pb-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">☁️</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood">
              {t('studio.communication.automatisationFramaspaceNextcloud')}
            </h4>
            <p className="text-[10px] text-encre-noire/70 font-semibold">
              {t('studio.communication.generationAutomatiqueDesDossiersWebdav')}
            </p>
          </div>
        </div>

        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-900 border-emerald-300">
          {t('studio.communication.webdavOcsApi')}
        </span>
      </div>

      {/* Note d'information et guide de configuration */}
      <div className="p-3 bg-amber-50/70 border border-amber-900/20 rounded-[4px_6px_3px_5px] text-xs text-encre-noire leading-relaxed flex flex-col gap-1.5">
        <p className="text-[11px] font-medium">
          💡 <strong>{t('studio.communication.fonctionnement')}</strong> {t('studio.communication.aLaCreationDUne')}
        </p>
        <p className="text-[10px] text-cordel-master-dark/70 font-semibold italic">
          {t('studio.communication.generezUnMotDePasse')} <em>{t('studio.communication.parametresPersonnelsSecuriteDispositifsEt')}</em>.
        </p>
      </div>

      {/* Formulaire des 3 champs d'identifiants */}
      {loadingCreds ? (
        <div className="py-6 text-center text-xs font-bold text-cordel-master-dark">
          {t('studio.communication.chargementDesIdentifiantsSecurises')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          
          {/* Champ 1 : URL Framaspace */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-black uppercase tracking-wider text-cordel-master-dark">
              {t('studio.communication.urlDeLInstanceNextcloud')}
            </label>
            <input
              type="url"
              value={effectiveUrl}
              onChange={(e) => updateField('framaspaceUrl', e.target.value)}
              disabled={saving || localSaving}
              placeholder="https://mon-instance.framaspace.org"
              className="text-xs px-3 py-2 border border-cordel-master-dark/30 rounded bg-cordel-bg-light font-bold text-encre-noire focus:outline-none focus:border-cordel-wood"
              required
            />
            <span className="text-[9px] text-encre-noire/60">{t('studio.communication.exHttpsOGiradorFramaspace')}</span>
          </div>

          {/* Champ 2 : Nom d'utilisateur */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-black uppercase tracking-wider text-cordel-master-dark">
              {t('studio.communication.compteUtilisateurBot')}
            </label>
            <input
              type="text"
              value={effectiveUsername}
              onChange={(e) => updateField('framaspaceUsername', e.target.value)}
              disabled={saving || localSaving}
              placeholder="julian.bzh@gmail.com ou bot-cloud"
              className="text-xs px-3 py-2 border border-cordel-master-dark/30 rounded bg-cordel-bg-light font-bold text-encre-noire focus:outline-none focus:border-cordel-wood"
              required
            />
            <span className="text-[9px] text-encre-noire/60">{t('studio.communication.identifiantOuEMailDe')}</span>
          </div>

          {/* Champ 3 : Mot de passe d'application */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-black uppercase tracking-wider text-cordel-master-dark">
                {t('studio.communication.motDePasseDApplication')}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[9.5px] text-cordel-wood hover:underline font-bold cursor-pointer"
              >
                {showPassword ? t('studio.communication.framaspaceIntegrationBlock_masquer') : t('studio.communication.framaspaceIntegrationBlock_afficher')}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={effectivePassword}
              onChange={(e) => updateField('framaspaceAppPassword', e.target.value)}
              disabled={saving || localSaving}
              placeholder={t('studio.communication.3kdmyExeaiEdpw7Ca3bkZtcpc')}
              className="text-xs px-3 py-2 border border-cordel-master-dark/30 rounded bg-cordel-bg-light font-mono font-bold text-encre-noire focus:outline-none focus:border-cordel-wood"
              required
            />
            <span className="text-[9px] text-encre-noire/60">{t('studio.communication.tokenGenereDansParametresSecurite')}</span>
          </div>
        </div>
      )}

      {/* Résultat du test de connexion */}
      {testResult && (
        <div className={`p-3 rounded border text-xs font-bold leading-relaxed flex flex-col gap-1 animate-fade-in ${
          testResult.success 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-400' 
            : 'bg-red-50 text-red-900 border-red-400'
        }`}>
          <div className="flex items-center gap-2">
            <span>{testResult.success ? '✅' : '❌'}</span>
            <span>{testResult.message}</span>
          </div>
          {testResult.httpStatus && (
            <div className="text-[10px] font-mono text-stone-600 pl-6">
              {t('studio.communication.statutHttpNextcloud')} <strong className="text-encre-noire">{testResult.httpStatus}</strong>
            </div>
          )}
          {testResult.code && (
            <div className="text-[10px] font-mono text-red-700 pl-6">
              {t('studio.communication.codeDErreurSysteme')} <strong>{testResult.code}</strong>
            </div>
          )}
          {testResult.details && (
            <div className="text-[10px] font-mono text-red-700 pl-6 break-all">
              {t('studio.communication.detailsTechniques')} {typeof testResult.details === 'object' ? JSON.stringify(testResult.details) : String(testResult.details)}
            </div>
          )}
        </div>
      )}

      {/* Actions : Tester et Enregistrer */}
      <div className="pt-2 border-t border-dashed border-cordel-master-dark/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CordelButton
            type="button"
            variant="default"
            disabled={testing || !effectiveUrl || !effectiveUsername || !effectivePassword}
            onClick={handleTestConnection}
            className="text-xs px-3.5 py-1.5 font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>{testing ? t('studio.communication.testEnCours') : t('studio.communication.testerLaConnexion')}</span>
          </CordelButton>

          {isStandalone && (
            <CordelButton
              type="button"
              variant="vert"
              disabled={localSaving || !localUrl.trim()}
              onClick={handleSaveStandalone}
              className="text-xs px-4 py-1.5 font-black uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>{localSaving ? t('studio.communication.enregistrement') : saveSuccess ? t('common.saved', { defaultValue: '✓ Enregistré !' }) : t('studio.communication.enregistrer')}</span>
            </CordelButton>
          )}
        </div>

        <span className="text-[10px] text-cordel-master-dark/70 font-medium italic">
          {t('studio.communication.identifiantsChiffresEtCloisonnesPar')}
        </span>
      </div>

    </CordelCard>
  );
}
