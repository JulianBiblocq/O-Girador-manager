import React, { useState, useEffect } from 'react';
import { useTranslation } from '../LanguageContext';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloMegaphone } from '../XiloIcons';
import FramaspaceIntegrationBlock from './blocks/FramaspaceIntegrationBlock';
import BrevoIntegrationBlock from './blocks/BrevoIntegrationBlock';
import YouTubePlaylistsBlock from './blocks/YouTubePlaylistsBlock';
import YouTubeVideoPickerModal from '../common/YouTubeVideoPickerModal';
import { extractYouTubeVideoId } from '../common/LiteYouTubeEmbed';

/**
 * Composant d'administration dédié au pôle Studio pour la gestion de la Communication
 * (Configuration de l'expéditeur & des e-mails SaaS, Export CSV des abonnés newsletter, Synchronisation Brevo & Vidéo à la une).
 */
export default function TabCommunication({ formData, handleChange, groupId, saving, t: propT }) {
  const { t: hookT } = useTranslation();
  const t = typeof propT === 'function' ? propT : hookT;
  // État local pour le comptage, l'exportation et la synchronisation des abonnés newsletter
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [syncedBrevoCount, setSyncedBrevoCount] = useState(null);
  const [exportingNewsletter, setExportingNewsletter] = useState(false);
  const [syncingBrevo, setSyncingBrevo] = useState(false);
  const [newsletterStatusMsg, setNewsletterStatusMsg] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);
  const [savingVideoMsg, setSavingVideoMsg] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Remplissage automatique lors du choix d'une vidéo via la modale
  const handleSelectVideoForUne = ({ title, url }) => {
    handleChange('videoALaUne.url', url);
    if (!formData?.videoALaUne?.titre?.trim() && title) {
      handleChange('videoALaUne.titre', title);
    }
  };

  // Sauvegarde atomique dédiée pour la vidéo à la une
  const handleSaveVideoDirectly = async () => {
    if (!groupId) return;
    setSavingVideo(true);
    setSavingVideoMsg('');
    try {
      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, {
        videoALaUne: {
          url: (formData?.videoALaUne?.url || '').trim(),
          titre: (formData?.videoALaUne?.titre || '').trim(),
          active: Boolean(formData?.videoALaUne?.active)
        }
      }, { merge: true });
      setSavingVideoMsg(t('studio.communication.videoEnregistreeEtSynchroniseeAvec'));
      setTimeout(() => setSavingVideoMsg(''), 4000);
    } catch (err) {
      console.error("Erreur sauvegarde vidéo :", err);
      setSavingVideoMsg('❌ Erreur : ' + (err.message || err));
    } finally {
      setSavingVideo(false);
    }
  };


  // Récupération dynamique du nombre d'inscrits à la newsletter et du statut de synchronisation Brevo
  const refreshSubscribersStats = async () => {
    try {
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const q = groupId ? query(subscribersRef, where('groupId', '==', groupId)) : subscribersRef;
      const snapshot = await getDocs(q);
      setSubscriberCount(snapshot.size);
      const synced = snapshot.docs.filter(docSnap => docSnap.data().brevoStatus === 'synced').length;
      setSyncedBrevoCount(synced);
    } catch (err) {
      console.error("Erreur lors de la lecture du nombre d'abonnés newsletter :", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchSubscribers = async () => {
      try {
        const subscribersRef = collection(db, 'newsletter_subscribers');
        const q = groupId ? query(subscribersRef, where('groupId', '==', groupId)) : subscribersRef;
        const snapshot = await getDocs(q);
        if (isMounted) {
          setSubscriberCount(snapshot.size);
          const synced = snapshot.docs.filter(docSnap => docSnap.data().brevoStatus === 'synced').length;
          setSyncedBrevoCount(synced);
        }
      } catch (err) {
        console.error("Erreur lors de la lecture du nombre d'abonnés newsletter :", err);
      }
    };

    fetchSubscribers();
    return () => { isMounted = false; };
  }, [groupId]);

  // Synchronisation manuelle des abonnés avec l'API Brevo via Cloud Function
  const handleSyncBrevo = async () => {
    setSyncingBrevo(true);
    setNewsletterStatusMsg('');

    try {
      let syncedResult = null;
      try {
        // Tentative d'appel de la Cloud Function distante
        const syncFn = httpsCallable(functions, 'syncNewsletterSubscribersToBrevo');
        const res = await syncFn({ groupId });
        syncedResult = res?.data;
      } catch (callErr) {
        console.warn("Appel Cloud Function distant indisponible, utilisation du middleware local :", callErr);
        // Fallback simulateur de développement local
        const localRes = await fetch('/api/newsletter/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId, count: subscriberCount || 0 })
        });
        if (localRes.ok) {
          syncedResult = await localRes.json();
        } else {
          throw callErr;
        }
      }

      await refreshSubscribersStats();
      setNewsletterStatusMsg(syncedResult?.message || `✓ Synchronisation Brevo effectuée avec succès.`);
    } catch (err) {
      console.error("Erreur lors de la synchronisation Brevo :", err);
      const errMsg = err?.message || "Erreur lors de la synchronisation avec Brevo.";
      setNewsletterStatusMsg(`❌ ${errMsg}`);
    } finally {
      setSyncingBrevo(false);
    }
  };

  // Exportation de la liste des abonnés au format CSV (compatible Excel & Google Sheets)
  const handleExportNewsletterCSV = async () => {
    setExportingNewsletter(true);
    setNewsletterStatusMsg('');

    try {
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const q = groupId ? query(subscribersRef, where('groupId', '==', groupId)) : subscribersRef;
      const snapshot = await getDocs(q);

      const subscribers = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

      if (subscribers.length === 0) {
        setNewsletterStatusMsg(t('studio.communication.aucunAbonneALaNewsletter'));
        return;
      }

      // Tri décroissant par date d'inscription
      subscribers.sort((a, b) => new Date(b.dateInscription || 0) - new Date(a.dateInscription || 0));

      const headers = ["E-mail", "Date d'inscription", "Source"];
      const rows = subscribers.map(sub => [
        `"${(sub.email || '').replace(/"/g, '""')}"`,
        `"${sub.dateInscription ? new Date(sub.dateInscription).toLocaleString('fr-FR') : (sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleString('fr-FR') : '')}"`,
        `"${(sub.source || 'vitrine').replace(/"/g, '""')}"`
      ].join(';'));

      // Formatage CSV avec séparateur point-virgule et encodage UTF-8 avec BOM (\uFEFF)
      const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];

      link.setAttribute('href', url);
      link.setAttribute('download', `Abonnes_Newsletter_${groupId || 'Vitrine'}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNewsletterStatusMsg(`✓ ${subscribers.length} abonné(s) exporté(s) avec succès !`);
    } catch (err) {
      console.error("Erreur lors de l'exportation CSV des abonnés newsletter :", err);
      setNewsletterStatusMsg(t('studio.communication.erreurLorsDeLaGeneration'));
    } finally {
      setExportingNewsletter(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none">
      {/* Section 1 : Encart informatif du service d'envoi (Lecture seule) */}
      {(() => {
        const isBrevoConfigured = Boolean(formData?.brevoApiKey?.trim());
        const expediteurEmail = formData?.emailOfficiel || formData?.emailExpediteur || formData?.emailContact || formData?.email || "Non configuré";

        return (
          <CordelCard variant="default" className="p-4 bg-[#fdfaf2] dark:bg-[#201d1a] border-2 border-encre-noire shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✉️</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood">
                    {t('studio.communication.serviceDEnvoiEMails')}
                  </h4>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    isBrevoConfigured 
                      ? 'bg-emerald-50 text-[var(--color-cordel-vert)] border-emerald-300' 
                      : 'bg-amber-50 text-[var(--color-cordel-ocre)] border-amber-300'
                  }`}>
                    {isBrevoConfigured ? t('studio.communication.serviceDEnvoiConfigure') : t('studio.communication.envoiDesactiveApiNonRenseignee')}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 font-semibold mt-0.5">
                  {t('studio.communication.expediteurOfficiel')} <strong className="text-encre-noire dark:text-white font-bold">{expediteurEmail}</strong>
                </p>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 italic max-w-xs leading-tight sm:text-right">
              {t('studio.communication.laGestionDeLaCle')} <strong>{t('studio.communication.configurationCommunicationEMailsAutomatisations')}</strong>.
            </p>
          </CordelCard>
        );
      })()}

      {/* Section 2 : Vidéo à la une (Dashboard & Accueil) */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-encre-noire shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎬</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood">
                {t('studio.communication.videoALaUneAccueil')}
              </h4>
              <p className="text-[10px] text-cordel-master-dark/70 font-semibold mt-0.5">
                {t('studio.communication.mettezEnAvantUneCaptation')}
              </p>
            </div>
          </div>

          {/* Toggle Activer / Masquer */}
          <label className="inline-flex items-center gap-2 cursor-pointer self-start sm:self-center shrink-0">
            <input
              type="checkbox"
              checked={Boolean(formData?.videoALaUne?.active)}
              onChange={(e) => handleChange('videoALaUne.active', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-cordel-vert,#2d6a4f)] relative"></div>
            <span className="text-xs font-bold text-encre-noire select-none">
              {formData?.videoALaUne?.active ? t('studio.communication.afficheeSurLAccueil') : t('studio.communication.masquee')}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Champ Titre descriptif */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-cordel-master-dark mb-1">
              {t('studio.communication.titreDescriptifOuConsigne')}
            </label>
            <input
              type="text"
              name="videoALaUne.titre"
              value={formData?.videoALaUne?.titre || ''}
              onChange={(e) => handleChange('videoALaUne.titre', e.target.value)}
              placeholder={t('studio.communication.exDebriefDuConcertD')}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood shadow-inner"
            />
          </div>

          {/* Champ Lien YouTube */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-cordel-master-dark">
                {t('studio.communication.lienDeLaVideoYoutube')}
              </label>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-[var(--color-cordel-ocre,#c05621)] text-white rounded hover:brightness-110 cursor-pointer flex items-center gap-1 shadow-2xs"
                title={t('studio.communication.choisirParmiLesPlaylistsYoutube')}
              >
                <span>{t('studio.communication.choisirParmiNosVideos')}</span>
              </button>
            </div>
            <input
              type="text"
              name="videoALaUne.url"
              value={formData?.videoALaUne?.url || ''}
              onChange={(e) => handleChange('videoALaUne.url', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood shadow-inner"
            />
          </div>
        </div>

        {/* Validation et aperçu en direct de l'URL */}
        {(() => {
          const currentUrl = formData?.videoALaUne?.url?.trim();
          if (!currentUrl) {
            return (
              <p className="text-[10px] text-stone-500 italic">
                {t('studio.communication.formatsAcceptesLiensClassiquesYoutube')}
              </p>
            );
          }
          const videoId = extractYouTubeVideoId(currentUrl);
          if (videoId) {
            return (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs font-bold">
                <span>✓</span>
                <span>{t('studio.communication.idYoutubeValide')} <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{videoId}</code></span>
                <span className="text-[10px] opacity-75 ml-auto">{t('studio.communication.miniature169Prete')}</span>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-300 rounded text-[var(--color-cordel-ocre,#c05621)] text-xs font-bold">
              <span>⚠️</span>
              <span>{t('studio.communication.lienNonReconnuAssurezVous')}</span>
            </div>
          );
        })()}

        {/* Bouton de sauvegarde dédié à la vidéo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
          <span className="text-[10px] text-cordel-master-dark/75 font-semibold">
            {savingVideoMsg || t('studio.communication.sauvegardeImmediateSansImpacterLa')}
          </span>
          <CordelButton
            type="button"
            variant="vert"
            useExtremeBorder={true}
            onClick={handleSaveVideoDirectly}
            disabled={savingVideo || saving}
            className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 shadow-[1.5px_1.5px_0px_0px_#181716] self-start sm:self-auto"
          >
            {savingVideo ? t('studio.communication.enregistrement') : t('studio.communication.enregistrerLaVideo')}
          </CordelButton>
        </div>
      </CordelCard>

      {/* SECTION : Playlists YouTube de l'association */}
      <YouTubePlaylistsBlock
        formData={formData}
        handleChange={handleChange}
        disabled={saving}
      />

      {/* En-tête de la section Communication & Newsletter */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 bg-cordel-bg">
        <div className="flex items-center gap-2.5 mb-2">
          <XiloMegaphone size={20} className="text-cordel-wood" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood">
            {t('studio.communication.communicationDiffusionNewsletter')}
          </h3>
        </div>
        <p className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 leading-relaxed">
          {t('studio.communication.gerezLExportationDesAdresses')}
        </p>
      </CordelCard>

      {/* Carte 1 : Abonnés Newsletter & Synchronisation Brevo */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-[var(--color-cordel-vert,#2d6a4f)]/30 shadow-xs">
        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-cordel-vert,#2d6a4f)] border-b border-dashed border-cordel-master-dark/20 pb-2 flex flex-wrap items-center justify-between gap-2">
          <span>{t('studio.communication.adherentsEtVisiteursInscritsA')}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-700 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              {subscriberCount !== null ? t('studio.newsletter.badgeSubscribersCountShort', { count: subscriberCount }) : t('studio.communication.chargement')}
            </span>
            {syncedBrevoCount !== null && (
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                subscriberCount > 0 && syncedBrevoCount === subscriberCount
                  ? 'bg-emerald-50 text-[var(--color-cordel-vert,#2d6a4f)] border-emerald-300'
                  : 'bg-amber-50 text-[var(--color-cordel-ocre,#c05621)] border-amber-300'
              }`}>
                ⚡ {syncedBrevoCount}/{subscriberCount || 0} {t('studio.communication.dansBrevo')}
              </span>
            )}
          </div>
        </h4>

        <p className="text-xs text-stone-600 leading-relaxed">
          {t('studio.communication.lesAdressesEMailsSaisies')}
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportNewsletterCSV}
              disabled={exportingNewsletter}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[var(--color-cordel-vert,#2d6a4f)] rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>📥</span>
              <span>{exportingNewsletter ? t('studio.communication.generationDuCsv') : t('studio.communication.exporterCsv')}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncBrevo}
              disabled={syncingBrevo || subscriberCount === 0}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
              title={t('studio.communication.synchroniserImmediatementTousLesContacts')}
            >
              <span className={syncingBrevo ? "animate-spin" : ""}>🔄</span>
              <span>{syncingBrevo ? t('studio.communication.synchronisationBrevo') : t('studio.communication.synchroniserAvecBrevo')}</span>
            </button>
          </div>

          {newsletterStatusMsg && (
            <span className={`text-xs font-bold ${
              newsletterStatusMsg.includes('❌') 
                ? 'text-[var(--color-cordel-rouge,#8b2a1a)]' 
                : newsletterStatusMsg.includes('⚠️') 
                  ? 'text-[var(--color-cordel-ocre,#c05621)]' 
                  : 'text-[var(--color-cordel-vert,#2d6a4f)]'
            }`}>
              {newsletterStatusMsg}
            </span>
          )}
        </div>
      </CordelCard>

      {/* Carte 2 : Integration API Brevo (Bloc Modulaire) */}
      <BrevoIntegrationBlock formData={formData} handleChange={handleChange} saving={saving} />

      {/* Carte 3 : Intégration API Framaspace / Nextcloud (Dépôt public & Varal photos) */}
      <FramaspaceIntegrationBlock
        groupId={formData?.groupId || groupId}
        formData={formData}
        handleChange={handleChange}
        saving={saving}
        isStandalone={false}
      />

      {/* Modale de sélection vidéo contextuelle */}
      <YouTubeVideoPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectVideo={handleSelectVideoForUne}
        playlists={formData?.youtubePlaylists}
        groupId={formData?.groupId || groupId}
      />
    </div>
  );
}
