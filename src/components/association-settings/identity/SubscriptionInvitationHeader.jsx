import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import HeaderSealLogo from '../../common/HeaderSealLogo';
import InvitationModal from '../../InvitationModal';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';
import { canonicalizeGroupId } from '../../../utils/tenantUtils';
import { uploadCombinedSealToStorage } from '../../../utils/shareUtils';
import { useTranslation } from '../../LanguageContext';

/**
 * En-tête compact présentant l'abonnement SaaS et le bouton d'invitation au groupe avec Sceau Combiné.
 */
export default function SubscriptionInvitationHeader({ formData = {}, groupId, onReopenOnboarding, onSyncCombinedSeal }) {
  const { t } = useTranslation();
  const [portalLoading, setPortalLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [syncingSeal, setSyncingSeal] = useState(false);

  const handleTriggerSyncSeal = async () => {
    setSyncingSeal(true);
    try {
      if (onSyncCombinedSeal) {
        await onSyncCombinedSeal();
      } else {
        await uploadCombinedSealToStorage(groupId, formData);
      }
    } catch (err) {
      console.warn("Erreur synchronisation sceau :", err);
    } finally {
      setSyncingSeal(false);
    }
  };

  const handleOpenStripePortal = async () => {
    setPortalLoading(true);
    try {
      const createPortalSession = httpsCallable(functions, 'createStripePortalSession');
      const result = await createPortalSession({ groupId, returnUrl: window.location.href });
      if (result.data?.url) window.location.href = result.data.url;
    } catch (err) {
      console.error("Erreur portail Stripe :", err);
      alert(t('settings.identity.subscriptionInvitationHeader.impossibleDAccederAuPortail'));
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCopyInvitationLink = async () => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const baseUrl = isLocal ? window.location.origin : 'https://organizador.o-girador.com';
    const canonicalId = canonicalizeGroupId(groupId) || 'Samambaia';
    const invitationUrl = `${baseUrl}/?groupe=${canonicalId}&mode=signup`;
    const shareText = `Rejoins notre groupe sur ${formData.nom || 'notre association'} : ${invitationUrl}`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error("Erreur copie :", err);
      alert("Voici le lien d'invitation : " + invitationUrl);
    }
  };

  const subscription = formData.subscription || { status: 'exempt', plan: 'exempt' };
  const { status: subStatus, plan: subPlan } = subscription;

  return (
    <div className="flex flex-col gap-3">
      {onReopenOnboarding && (
        <CordelCard variant="default" className="p-3 bg-emerald-50/70 border-2 border-[var(--color-cordel-vert,#2d6a4f)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚀</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-vert,#2d6a4f)]">
                {t('settings.identity.subscriptionInvitationHeader.assistantDePremierDemarrageWizard')}
              </h4>
              <p className="text-[10px] text-stone-600 font-medium">
                {t('settings.identity.subscriptionInvitationHeader.refaireLaVisiteGuideeEt')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onReopenOnboarding}
            className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white bg-[var(--color-cordel-vert,#2d6a4f)] rounded-lg hover:brightness-110 cursor-pointer shadow-2xs whitespace-nowrap"
          >
            {t('settings.identity.subscriptionInvitationHeader.relancerLAssistant')}
          </button>
        </CordelCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 flex flex-col justify-between gap-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">{t('settings.identity.subscriptionInvitationHeader.abonnementSaas')}</h3>
              <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${
                subStatus === 'active' || subStatus === 'exempt' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>{subStatus}</span>
            </div>
            <p className="text-[10px] text-stone-600">{t('settings.identity.subscriptionInvitationHeader.plan')} <strong className="text-cordel-wood uppercase font-black">{subPlan}</strong></p>
          </div>
          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            onClick={handleOpenStripePortal}
            disabled={portalLoading}
            className="py-1 px-3 text-[9.5px] font-black uppercase tracking-wider w-full cursor-pointer"
          >
            {portalLoading ? t('settings.identity.subscriptionInvitationHeader.chargement') : t('settings.identity.subscriptionInvitationHeader.facturesCarteBancaire')}
          </CordelButton>
        </CordelCard>

        <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 cursor-pointer" onClick={() => setIsInviteModalOpen(true)} title="Aperçu du macaron et QR Code">
              <HeaderSealLogo
                associationData={formData}
                associationName={formData.nom || ''}
                currentGroupId={groupId}
                logoUrl={formData.branding?.logoUrl || formData.logoUrl}
                combinedLogoUrl={formData.branding?.combinedLogoUrl}
                size={40}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-0.5">{t('settings.identity.subscriptionInvitationHeader.invitationAuGroupe')}</h3>
              <p className="text-[10px] text-stone-600 leading-snug">{t('settings.identity.subscriptionInvitationHeader.partagezCeLienDInscription')}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {formData.branding?.combinedLogoUrl ? (
                  <button
                    type="button"
                    onClick={handleTriggerSyncSeal}
                    disabled={syncingSeal}
                    title="Cliquer pour régénérer le sceau combiné officiel sur Firebase Storage"
                    className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>✓ Sceau WhatsApp actif</span>
                    {syncingSeal && <span className="animate-spin text-[8px]">↻</span>}
                  </button>
                ) : (formData.branding?.logoUrl || formData.logoUrl) ? (
                  <button
                    type="button"
                    onClick={handleTriggerSyncSeal}
                    disabled={syncingSeal}
                    title="Générer et sauvegarder le blason officiel Asso × O Girador"
                    className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors flex items-center gap-1 cursor-pointer animate-pulse"
                  >
                    <span>⚡ Activer le sceau WhatsApp</span>
                    {syncingSeal && <span className="animate-spin text-[8px]">↻</span>}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 w-full">
            <CordelButton
              type="button"
              variant={copySuccess ? 'vert' : 'default'}
              useExtremeBorder={true}
              onClick={handleCopyInvitationLink}
              className="py-1 px-2 text-[9px] font-black uppercase tracking-wider w-full cursor-pointer truncate"
              title={copySuccess ? t('settings.identity.subscriptionInvitationHeader.lienCopie') : t('settings.identity.subscriptionInvitationHeader.copierLeLienDInvitation')}
            >
              {copySuccess ? t('settings.identity.subscriptionInvitationHeader.lienCopie') : t('settings.identity.subscriptionInvitationHeader.copierLeLienDInvitation')}
            </CordelButton>
            <CordelButton
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={() => setIsInviteModalOpen(true)}
              className="py-1 px-2 text-[9px] font-black uppercase tracking-wider w-full cursor-pointer truncate"
            >
              📨 Carte & Sceau
            </CordelButton>
          </div>
        </CordelCard>
      </div>

      {/* Modale d'invitation avec Sceau Combiné officiel O Girador × Asso et QR Code */}
      <InvitationModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        associationData={formData}
        groupId={groupId}
      />
    </div>
  );
}
