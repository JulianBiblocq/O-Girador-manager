import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';
import { canonicalizeGroupId } from '../../../utils/tenantUtils';
import { useTranslation } from '../../LanguageContext';

/**
 * En-tête compact présentant l'abonnement SaaS et le bouton d'invitation au groupe.
 */
export default function SubscriptionInvitationHeader({ formData = {}, groupId, onReopenOnboarding }) {
  const { t } = useTranslation();
  const [portalLoading, setPortalLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

        <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 flex flex-col justify-between gap-2">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-1">{t('settings.identity.subscriptionInvitationHeader.invitationAuGroupe')}</h3>
            <p className="text-[10px] text-stone-600 leading-snug">{t('settings.identity.subscriptionInvitationHeader.partagezCeLienDInscription')}</p>
          </div>
          <CordelButton
            type="button"
            variant={copySuccess ? 'vert' : 'default'}
            useExtremeBorder={true}
            onClick={handleCopyInvitationLink}
            className="py-1 px-3 text-[9.5px] font-black uppercase tracking-wider w-full cursor-pointer"
          >
            {copySuccess ? t('settings.identity.subscriptionInvitationHeader.lienCopie') : t('settings.identity.subscriptionInvitationHeader.copierLeLienDInvitation')}
          </CordelButton>
        </CordelCard>
      </div>
    </div>
  );
}
