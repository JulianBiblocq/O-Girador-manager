import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloMegaphone, XiloClose } from './XiloIcons';
import { useTranslation } from './LanguageContext';

export default function WidgetAnnonces({ groupId, profileData, role, isSystemAdmin, user }) {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [tagsDisponibles, setTagsDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showBanner, setShowBanner] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  // Check notification permission state on mount or when user changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && messaging && user?.uid) {
      setShowBanner(Notification.permission !== 'granted');
    }
  }, [user?.uid]);

  const handleEnableNotifications = async () => {
    if (!messaging || !user?.uid) {
      alert("Les notifications Push ne sont pas prises en charge par ce navigateur ou vous n'êtes pas connecté.");
      return;
    }
    setIsSubscribingPush(true);
    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await new Promise((resolve) => {
          const p = Notification.requestPermission(resolve);
          if (p && typeof p.then === 'function') {
            p.then(resolve);
          }
        });
      }

      if (permission === 'granted') {
        let registration = undefined;
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            registration = await navigator.serviceWorker.ready;
          } catch (swErr) {
            console.warn("Could not get ready service worker:", swErr);
          }
        }
        const token = await getToken(messaging, { 
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
          serviceWorkerRegistration: registration
        });
        if (token) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token)
          });
          alert("Notifications activées avec succès !");
          setShowBanner(false);
        } else {
          console.warn("FCM Token not generated.");
          alert("Impossible de générer le jeton de notification.");
        }
      } else if (permission === 'denied') {
        alert("La permission d'envoi de notifications a été refusée. Veuillez l'activer dans les paramètres de votre navigateur.");
      }
    } catch (err) {
      console.error("Error enabling notifications:", err);
      alert("Erreur lors de l'activation des notifications.");
    } finally {
      setIsSubscribingPush(false);
    }
  };

  // Form states
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [cibles, setCibles] = useState(['Tous']);
  const [publishOnApp, setPublishOnApp] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [sendPushNotification, setSendPushNotification] = useState(false);

  const isAdmin = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // Real-time synchronization of announcements
  useEffect(() => {
    if (!groupId) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // Sort by dateCreation desc locally
      fetched.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
      setAnnouncements(fetched);
      setLoading(false);
    }, (error) => {
      console.error("WidgetAnnonces - Erreur onSnapshot announcements :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Load tags available in the association document
  useEffect(() => {
    if (!groupId) return;

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTagsDisponibles(docSnap.data().tagsDisponibles || []);
      }
    }, (error) => {
      console.error("WidgetAnnonces - Erreur onSnapshot association tags :", error);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleCibleToggle = (target) => {
    if (target === 'Tous') {
      setCibles(['Tous']);
    } else {
      setCibles(prev => {
        let copy = prev.filter(c => c !== 'Tous');
        const idx = copy.indexOf(target);
        if (idx > -1) {
          copy.splice(idx, 1);
        } else {
          copy.push(target);
        }
        if (copy.length === 0) {
          copy = ['Tous'];
        }
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId || !titre.trim() || !message.trim()) return;

    setSaving(true);
    try {
      const payload = {
        groupId,
        titre: titre.trim(),
        message: message.trim(),
        auteurNom: `${profileData?.prenom || 'Admin'} ${profileData?.nom || ''}`,
        dateCreation: new Date().toISOString(),
        cibles,
        publishOnApp,
        sendViaEmail,
        sendPushNotification
      };

      await addDoc(collection(db, 'announcements'), payload);
      
      // Reset form
      setTitre('');
      setMessage('');
      setCibles(['Tous']);
      setPublishOnApp(true);
      setSendViaEmail(false);
      setSendPushNotification(false);
      setIsAdding(false);
    } catch (err) {
      console.error("WidgetAnnonces - Erreur de sauvegarde :", err);
      alert("Erreur lors de la publication de l'annonce.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (annId, annTitre) => {
    const confirmDelete = window.confirm(`${t('widgetAnnonces.deleteConfirm') || "Voulez-vous supprimer l'annonce"} "${annTitre}" ?`);
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'announcements', annId));
    } catch (err) {
      console.error("WidgetAnnonces - Erreur de suppression :", err);
    }
  };

  // Local JS filtering: Visible based on target rules
  const userTags = profileData?.tags || [];
  const userRole = role || profileData?.role || 'membre';
  const visibleAnnouncements = announcements.filter(ann => {
    // If not publishOnApp, hide it from App dashboard
    if (ann.publishOnApp === false) return false;

    if (!Array.isArray(ann.cibles) || ann.cibles.length === 0) return true;
    if (ann.cibles.includes('Tous')) return true;

    // Check if target is admin and current user is admin
    if (ann.cibles.includes('role:admin') && (userRole === 'mestre' || userRole === 'super-admin' || isSystemAdmin === true)) {
      return true;
    }

    return ann.cibles.some(t => userTags.includes(t));
  });

  if (!loading && !isAdmin && visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header bar */}
      <div className="flex justify-between items-center pl-1 pr-1 select-none">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left flex items-center gap-1.5">
          <XiloMegaphone size={16} className="text-cordel-wood" /> {t('widgetAnnonces.title')}
        </h3>
        {!loading && isAdmin && !isAdding && (
          <CordelButton 
            variant="default" 
            onClick={() => setIsAdding(true)} 
            className="text-[10px] px-2 py-1 uppercase tracking-widest font-black"
          >
            {t('widgetAnnonces.announceBtn')}
          </CordelButton>
        )}
      </div>

      {/* PUSH notifications incentive banner */}
      {showBanner && messaging && (
        <CordelCard 
          variant="ocre" 
          useExtremeBorder={true} 
          className="p-3 text-left border-dashed flex flex-col gap-2 bg-[#fdfaf2] dark:bg-black/10"
        >
          <div className="flex gap-2 items-start">
            <span className="text-lg shrink-0">📢</span>
            <div className="flex-1">
              <h4 className="font-extrabold text-[11px] text-encre-noire uppercase tracking-wider">
                {t('widgetAnnonces.bannerTitle')}
              </h4>
              <p className="text-[10px] font-semibold leading-relaxed text-encre-noire/80 mt-0.5">
                {t('widgetAnnonces.bannerText')}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={isSubscribingPush}
              onClick={handleEnableNotifications}
              className="text-[9px] font-black uppercase bg-cordel-wood text-cordel-bg-light border border-encre-noire px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer whitespace-nowrap"
            >
              {isSubscribingPush ? "..." : t('widgetAnnonces.bannerBtn')}
            </button>
          </div>
        </CordelCard>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-6">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      )}

      {/* Inline Form View (Visible to admins when isAdding is true) */}
      {!loading && isAdding && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 relative text-left">
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            disabled={saving}
            className="absolute top-3 right-3 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center disabled:opacity-50"
          >
            <XiloClose size={10} />
          </button>

          <h4 className="panel-title text-sm font-bold text-cordel-wood mb-4">
            {t('widgetAnnonces.publishTitle')}
          </h4>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Titre */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAnnonces.annTitleLabel')}
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                disabled={saving}
                placeholder={t('widgetAnnonces.annTitlePlaceholder')}
                className="theme-input text-xs font-bold py-1.5"
              />
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAnnonces.annMsgLabel')}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={saving}
                rows="3"
                placeholder={t('widgetAnnonces.annMsgPlaceholder')}
                className="theme-input text-xs font-semibold py-1.5 resize-none w-full"
              />
            </div>

            {/* Cibles checklist */}
            <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-cordel-master-dark/15">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAnnonces.targetsLabel')}
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 border border-dashed border-encre-noire/25 rounded bg-[#fdfaf2] dark:bg-[#201d1a] max-h-24 overflow-y-auto">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCibleToggle('Tous')}
                  className={`text-[9px] px-2 py-0.5 border rounded-[3px_5px_2px_4px] transition-all cursor-pointer font-bold ${
                    cibles.includes('Tous') 
                      ? 'bg-cordel-wood text-cordel-bg-light border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]' 
                      : 'bg-transparent text-encre-noire border-dashed border-encre-noire/30'
                  }`}
                >
                  <span className="inline-flex items-center gap-1"><XiloMegaphone size={10} /> {t('widgetAnnonces.targetAll')}</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleCibleToggle('role:admin')}
                  className={`text-[9px] px-2 py-0.5 border rounded-[3px_5px_2px_4px] transition-all cursor-pointer font-bold ${
                    cibles.includes('role:admin') 
                      ? 'bg-cordel-wood text-cordel-bg-light border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]' 
                      : 'bg-transparent text-encre-noire border-dashed border-encre-noire/30'
                  }`}
                >
                  👑 {t('widgetAnnonces.targetAdmins')}
                </button>

                {tagsDisponibles.map((tag) => {
                  const isActive = cibles.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      disabled={saving}
                      onClick={() => handleCibleToggle(tag)}
                      className={`text-[9px] px-2 py-0.5 border rounded-[3px_5px_2px_4px] transition-all cursor-pointer font-bold ${
                        isActive 
                          ? 'bg-cordel-wood text-cordel-bg-light border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]' 
                          : 'bg-transparent text-encre-noire border-dashed border-encre-noire/30'
                      }`}
                    >
                      🏷️ {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Canaux de diffusion */}
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-dashed border-cordel-master-dark/15 text-left">
              <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAnnonces.channelsLabel')}
              </label>
              <div className="flex flex-col gap-1.5 pl-1 select-none">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishOnApp}
                    onChange={(e) => setPublishOnApp(e.target.checked)}
                    disabled={saving}
                    className="accent-cordel-wood scale-105"
                  />
                  <span>{t('widgetAnnonces.channelApp')}</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendViaEmail}
                    onChange={(e) => setSendViaEmail(e.target.checked)}
                    disabled={saving}
                    className="accent-cordel-wood scale-105"
                  />
                  <span>{t('widgetAnnonces.channelEmail')}</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendPushNotification}
                    onChange={(e) => setSendPushNotification(e.target.checked)}
                    disabled={saving}
                    className="accent-cordel-wood scale-105"
                  />
                  <span className="inline-flex items-center gap-1.5"><XiloMegaphone size={12} /> Envoyer une notification aux membres</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
              <CordelButton
                type="button"
                variant="default"
                disabled={saving}
                onClick={() => setIsAdding(false)}
                className="text-xs px-3 py-1.5"
              >
                {t('common.cancel')}
              </CordelButton>
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={saving || !titre.trim() || !message.trim()}
                className="text-xs px-4 py-1.5 font-bold"
              >
                {saving ? "..." : t('widgetAnnonces.publishBtn')}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      )}

      {/* Announcements list view (Visible when not loading and not adding) */}
      {!loading && !isAdding && (
        visibleAnnouncements.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-4 text-center bg-cordel-bg opacity-75 select-none">
            <p className="text-[10px] italic font-semibold">{t('widgetAnnonces.noAnnouncements')}</p>
          </CordelCard>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleAnnouncements.map((ann) => {
              const dateObj = new Date(ann.dateCreation);
              const formattedDate = isNaN(dateObj.getTime())
                ? ''
                : dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

              const isCibleTous = ann.cibles && ann.cibles.includes('Tous');

              return (
                <CordelCard 
                  key={ann.id}
                  variant={isCibleTous ? "ocre" : "default"}
                  useExtremeBorder={true}
                  className="py-3 px-4 relative overflow-hidden bg-cordel-bg text-left border-l-4 border-l-cordel-wood"
                >
                  <div className="flex justify-between items-start gap-4 pr-6">
                    <div className="flex-1 min-w-0">
                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-bold text-cordel-master-dark/70 select-none">
                        <span className="inline-flex items-center gap-0.5"><XiloMegaphone size={10} /> {t('widgetAnnonces.roleLabel')}</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span>Par {ann.auteurNom}</span>
                      </div>

                      {/* Title */}
                      <h4 className="font-extrabold text-sm text-encre-noire mt-1">
                        {ann.titre}
                      </h4>
                    </div>

                    {/* Stamp Targets badge */}
                    <div className="flex flex-wrap gap-1 select-none">
                      {ann.cibles && ann.cibles.map(c => (
                        <span 
                          key={c}
                          className={`theme-stamp-badge ${isCibleTous ? 'theme-stamp-badge-wood' : 'theme-stamp-badge-dark'} text-[6px] rotate-[-1deg] px-1 py-0`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Message body */}
                  <p className="text-xs font-semibold leading-relaxed mt-2 text-encre-noire/90 whitespace-pre-wrap">
                    {ann.message}
                  </p>

                  {/* Delete trigger (visible only for admin) */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(ann.id, ann.titre)}
                      className="absolute top-2 right-2 p-1 border border-dashed border-red-400 hover:border-red-600 text-red-500 hover:text-red-700 bg-transparent rounded cursor-pointer flex items-center justify-center shrink-0"
                      title={t('widgetAnnonces.deleteTitle') || "Supprimer l'annonce"}
                    >
                      <XiloClose size={8} />
                    </button>
                  )}
                </CordelCard>
              );
            })}
          </div>
        )
      )}

    </div>
  );
}
