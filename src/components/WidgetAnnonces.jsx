import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import CordelButton from './CordelButton';
import { XiloMegaphone } from './XiloIcons';
import { useTranslation } from './LanguageContext';
import { showPushActivationConfirmation } from '../utils/pushNotificationHelper';
import { canPublishAnnonces } from '../utils/permissionUtils';
import { resolveEffectiveUserTags } from '../utils/tagUtils';
import { getCachedAnnouncements, setCachedAnnouncements } from '../utils/dashboardCacheUtils';
import { isAnnouncementVisibleForUser, resolveTargetRecipientIds } from '../utils/announcementUtils';
import { dispatchBulkInAppAndPushNotification } from '../utils/inAppNotificationService';
import { useAnnoncesData } from '../hooks/useAnnoncesData';
import AnnonceCardItem from './annonces/AnnonceCardItem';
import AnnonceForm from './annonces/AnnonceForm';
import AnnoncePushBanner from './annonces/AnnoncePushBanner';

/**
 * WidgetAnnonces : Gestionnaire et affichage des pancartes du tableau de bord.
 * Respecte strictement la règle Anti-Monolithe (< 200 lignes) par délégation modulaire.
 */
export default function WidgetAnnonces({
  groupId,
  profileData,
  role,
  isSystemAdmin,
  user,
  onNavigateToView,
  permissionsMatrice,
  canPublish: canPublishProp,
  breakGlassActive = false,
  userTags: userTagsProp
}) {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState(() => getCachedAnnouncements(groupId));
  const { tagsDisponibles, assocPermissionsMatrice, allMembers, loading, handleDeleteAnnouncement } = useAnnoncesData(groupId, t, announcements, setAnnouncements);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  // État synchrone de la bannière push (prévention CLS)
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && user?.uid) {
      return Notification.permission !== 'granted';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && messaging && user?.uid) {
      setShowBanner(Notification.permission !== 'granted');
    }
  }, [user?.uid]);

  const effectiveMatrice = permissionsMatrice || assocPermissionsMatrice;
  const effectiveTags = userTagsProp || resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles);
  const canPublish = canPublishProp !== undefined
    ? canPublishProp
    : canPublishAnnonces(profileData, effectiveMatrice, effectiveTags, breakGlassActive);

  const handleEnableNotifications = async () => {
    if (!messaging || !user?.uid) return alert('Notifications non prises en charge.');
    setIsSubscribingPush(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const reg = navigator.serviceWorker ? await navigator.serviceWorker.ready : undefined;
        const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
        if (token) {
          await updateDoc(doc(db, 'users', user.uid), { fcmTokens: arrayUnion(token) });
          await showPushActivationConfirmation(reg);
          setShowBanner(false);
        }
      }
    } catch (err) {
      console.error('WidgetAnnonces - Erreur push :', err);
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const handleCtaClick = (link) => {
    if (!link) return;
    const trimmed = link.trim();
    if (trimmed.startsWith('http')) return window.open(trimmed, '_blank', 'noopener,noreferrer');
    const cleanRoute = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    const map = { profile: 'profil', materiel: 'inventory', vestiaire: 'wardrobe-inventory' };
    if (onNavigateToView) onNavigateToView(map[cleanRoute] || cleanRoute);
    else window.location.href = trimmed;
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
          await dispatchBulkInAppAndPushNotification({
            recipientIds,
            groupId,
            titre: payload.titre,
            message: payload.message,
            targetUrl: '/app',
            sendPush: true
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

  // Filtrage des pancartes visibles pour l'adhérent connecté
  const userTags = profileData?.tags || [];
  const userRole = role || profileData?.role || 'membre';
  const visibleAnnouncements = useMemo(() => {
    return announcements.filter((ann) => isAnnouncementVisibleForUser({
      announcement: ann,
      userId: user?.uid,
      userTags,
      userRole,
      isSystemAdmin,
      canPublish
    }));
  }, [announcements, user?.uid, userTags, userRole, isSystemAdmin, canPublish]);

  if (!loading && !canPublish && visibleAnnouncements.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center pl-1 pr-1 select-none">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left flex items-center gap-1.5">
          <XiloMegaphone size={16} className="text-cordel-wood" /> {t('widgetAnnonces.title')}
        </h3>
        {!loading && canPublish && !isAdding && (
          <CordelButton variant="default" onClick={() => setIsAdding(true)} className="text-[10px] px-2 py-1 uppercase tracking-widest font-black">
            {t('widgetAnnonces.announceBtn')}
          </CordelButton>
        )}
      </div>

      {showBanner && messaging && (
        <AnnoncePushBanner onEnableNotifications={handleEnableNotifications} isSubscribingPush={isSubscribingPush} t={t} />
      )}

      {loading && announcements.length === 0 && (
        <div className="flex flex-col gap-3 animate-pulse select-none" aria-busy="true">
          <div className="py-3 px-4 rounded border-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg/40 min-h-[140px]" />
        </div>
      )}

      {!loading && isAdding && (
        <AnnonceForm onSubmit={handleSubmitForm} onCancel={() => setIsAdding(false)} saving={saving} tagsDisponibles={tagsDisponibles} allMembers={allMembers} t={t} />
      )}

      {!loading && !isAdding && (
        <div className="flex flex-col gap-3">
          {visibleAnnouncements.map((ann) => (
            <AnnonceCardItem key={ann.id} ann={ann} user={user} profileData={profileData} canPublish={canPublish} handleCtaClick={handleCtaClick} handleDelete={handleDeleteAnnouncement} allMembers={allMembers} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
