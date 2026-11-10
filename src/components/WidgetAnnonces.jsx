import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import TerracottaMegaphoneIcon from './annonces/TerracottaMegaphoneIcon';
import { useTranslation } from './LanguageContext';
import { showPushActivationConfirmation, resolveActiveMessagingSwRegistration } from '../utils/pushNotificationHelper';
import { canPublishAnnonces } from '../utils/permissionUtils';
import { resolveEffectiveUserTags } from '../utils/tagUtils';
import { getCachedAnnouncements } from '../utils/dashboardCacheUtils';
import { isAnnouncementVisibleForUser, resolveTargetRecipientIds } from '../utils/announcementUtils';
import { dispatchBulkInAppAndPushNotification } from '../utils/inAppNotificationService';
import { useAnnoncesData } from '../hooks/useAnnoncesData';
import { useAutoSyncPushToken } from '../hooks/useAutoSyncPushToken';
import AnnonceCardItem from './annonces/AnnonceCardItem';
import AnnonceForm from './annonces/AnnonceForm';
import AnnoncePushBanner from './annonces/AnnoncePushBanner';
import { detectPushTutorialDevice, openPushTutorialModal } from './dashboard/PushTutorialModal';
import { triggerMegaphoneCtaNavigation } from '../utils/megaphoneNavigationUtils';

/**
 * WidgetAnnonces : Gestionnaire et affichage des pancartes du tableau de bord.
 * Respecte strictement la règle Anti-Monolithe par délégation modulaire.
 */
export default function WidgetAnnonces({
  groupId, profileData, role, isSystemAdmin, user,
  onNavigateToView, onNotificationNavigate = null, onNavigateToPole = null,
  permissionsMatrice, canPublish: canPublishProp, breakGlassActive = false,
  userTags: userTagsProp, installPromptAvailable = false, onTriggerInstall = null
}) {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements(groupId));
  const { tagsDisponibles, assocPermissionsMatrice, allMembers, loading, handleDeleteAnnouncement } = useAnnoncesData(groupId, t, announcements, setAnnouncements);
  const [isAdding, setIsAdding] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [hasLocalToken, setHasLocalToken] = useState(false);

  // Réception d'un contenu partagé dirigé vers le Mégaphone
  useEffect(() => {
    const consumePendingAnnonce = (payload) => {
      if (!payload) return;
      setInitialFormValues(payload);
      setIsAdding(true);
      if (typeof window !== 'undefined') {
        delete window.__ogPendingAnnonceShare;
      }
    };
    if (typeof window !== 'undefined' && window.__ogPendingAnnonceShare) {
      consumePendingAnnonce(window.__ogPendingAnnonceShare);
    }
    const handleEvent = (e) => consumePendingAnnonce(e.detail);
    window.addEventListener('open-shared-annonce', handleEvent);
    return () => window.removeEventListener('open-shared-annonce', handleEvent);
  }, []);

  const handleTokenSynced = useCallback(() => setHasLocalToken(true), []);
  useAutoSyncPushToken(user, profileData, handleTokenSynced);

  // Afficher la bannière dès que l'adhérent n'a aucun jeton actif en base OU que la permission n'est pas accordée
  const hasFcmTokenInDb = Array.isArray(profileData?.fcmTokens) && profileData.fcmTokens.length > 0;
  const isPermissionGranted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  const showBanner = Boolean(user?.uid) && (!isPermissionGranted || (!hasFcmTokenInDb && !hasLocalToken));

  const effectiveMatrice = permissionsMatrice || assocPermissionsMatrice;
  const effectiveTags = userTagsProp || resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles);
  const canPublish = canPublishProp !== undefined
    ? canPublishProp
    : canPublishAnnonces(profileData, effectiveMatrice, effectiveTags, breakGlassActive);

  const handleEnableNotifications = async () => {
    if (!user?.uid) return;
    const env = detectPushTutorialDevice();
    if (
      env.isInAppBrowser ||
      env.isIosNotStandalone ||
      env.isPermissionDenied ||
      !messaging ||
      typeof window === 'undefined' ||
      !('Notification' in window)
    ) {
      openPushTutorialModal(env.mode);
      return;
    }

    setIsSubscribingPush(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const reg = await resolveActiveMessagingSwRegistration();
        const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
        if (token) {
          await updateDoc(doc(db, 'users', user.uid), { fcmTokens: arrayUnion(token) });
          await showPushActivationConfirmation(reg);
          setHasLocalToken(true);
        } else {
          openPushTutorialModal(env.mode);
        }
      } else {
        openPushTutorialModal(env.mode);
      }
    } catch (err) {
      console.error('WidgetAnnonces - Erreur push :', err);
      openPushTutorialModal(env.mode);
    } finally {
      setIsSubscribingPush(false);
    }
  };

  // Gestionnaire du clic sur le bouton d'action (CTA) d'une annonce
  const handleCtaClick = (link, event = null) => {
    triggerMegaphoneCtaNavigation(
      link,
      { onNotificationNavigate, onNavigateToView, onNavigateToPole },
      event
    );
  };

  const handleSubmitForm = async (formData) => {
    if (!groupId) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        groupId,
        auteurId: user?.uid || null,
        auteurNom: `${profileData?.prenom || 'Admin'} ${profileData?.nom || ''}`.trim() || 'Association',
        dateCreation: new Date().toISOString()
      };
      await addDoc(collection(db, 'announcements'), payload);

      if (formData.sendPushNotification) {
        const recipientIds = resolveTargetRecipientIds({ announcement: payload, allMembers, authorId: user?.uid });
        if (recipientIds.length > 0) {
          const targetUrl = payload.actionLink && payload.actionLink.trim() ? payload.actionLink.trim() : '/app';
          await dispatchBulkInAppAndPushNotification({
            recipientIds, groupId, titre: payload.titre, message: payload.message, targetUrl, sendPush: true
          });
        }
      }
      setIsAdding(false);
    } catch (err) {
      console.error('WidgetAnnonces - Erreur sauvegarde :', err);
      alert("Erreur lors de la publication de l'annonce.");
    } finally {
      setSaving(false);
    }
  };

  const userRole = role || profileData?.role || 'membre';
  const visibleAnnouncements = useMemo(() => {
    const userTags = profileData?.tags || [];
    return announcements.filter((ann) => isAnnouncementVisibleForUser({
      announcement: ann, userId: user?.uid, userTags, userRole, isSystemAdmin, canPublish
    }));
  }, [announcements, user?.uid, profileData?.tags, userRole, isSystemAdmin, canPublish]);

  if (!loading && !canPublish && visibleAnnouncements.length === 0 && !showBanner) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center pl-1 pr-1 select-none">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left flex items-center gap-1.5">
          <TerracottaMegaphoneIcon size={17} /> {t('widgetAnnonces.title')}
        </h3>
        {!loading && canPublish && !isAdding && (
          <CordelButton variant="default" onClick={() => setIsAdding(true)} className="text-[10px] px-2 py-1 uppercase tracking-widest font-black">
            {t('widgetAnnonces.announceBtn')}
          </CordelButton>
        )}
      </div>

      {showBanner && (
        <AnnoncePushBanner
          onEnableNotifications={handleEnableNotifications}
          isSubscribingPush={isSubscribingPush}
          installPromptAvailable={installPromptAvailable}
          onTriggerInstall={onTriggerInstall}
          t={t}
        />
      )}

      {loading && announcements.length === 0 && (
        <div className="flex flex-col gap-3 animate-pulse select-none" aria-busy="true">
          <div className="py-3 px-4 rounded border-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg/40 min-h-[140px]" />
        </div>
      )}

      {!loading && isAdding && (
        <AnnonceForm
          onSubmit={handleSubmitForm}
          onCancel={() => {
            setIsAdding(false);
            setInitialFormValues(null);
          }}
          saving={saving}
          tagsDisponibles={tagsDisponibles}
          allMembers={allMembers}
          initialValues={initialFormValues}
          t={t}
        />
      )}

      {!loading && !isAdding && visibleAnnouncements.length > 0 && (
        <CordelCard
          variant="default"
          useExtremeBorder={true}
          className="!py-1 !px-2.5 sm:!px-3.5 relative overflow-hidden"
        >
          <div className="flex flex-col divide-y divide-dashed divide-[#181716]/20">
            {visibleAnnouncements.map((ann) => (
              <AnnonceCardItem
                key={ann.id}
                ann={ann}
                user={user}
                profileData={profileData}
                canPublish={canPublish}
                handleCtaClick={handleCtaClick}
                handleDelete={handleDeleteAnnouncement}
                allMembers={allMembers}
                t={t}
              />
            ))}
          </div>
        </CordelCard>
      )}
    </div>
  );
}
