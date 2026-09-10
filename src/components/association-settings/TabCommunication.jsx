import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EmailConfigSection from './email/EmailConfigSection';
import BrevoIntegrationBlock from './blocks/BrevoIntegrationBlock';
import FramaspaceIntegrationBlock from './blocks/FramaspaceIntegrationBlock';
import { extractYouTubeVideoId } from '../common/LiteYouTubeEmbed';

/**
 * Composant d'administration dédié au pôle Studio pour la gestion de la Communication
 * (Configuration de l'expéditeur & des e-mails SaaS, Export CSV des abonnés newsletter, Synchronisation Brevo & Vidéo à la une).
 */
export default function TabCommunication({ formData, handleChange, groupId, saving, t }) {
  // État local pour le comptage, l'exportation et la synchronisation des abonnés newsletter
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [syncedBrevoCount, setSyncedBrevoCount] = useState(null);
  const [exportingNewsletter, setExportingNewsletter] = useState(false);
  const [syncingBrevo, setSyncingBrevo] = useState(false);
  const [newsletterStatusMsg, setNewsletterStatusMsg] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);
  const [savingVideoMsg, setSavingVideoMsg] = useState('');

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
      setSavingVideoMsg('✓ Vidéo enregistrée et synchronisée avec l\'Accueil !');
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
        setNewsletterStatusMsg("⚠️ Aucun abonné à la newsletter enregistré pour le moment.");
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
      setNewsletterStatusMsg("❌ Erreur lors de la génération du fichier CSV.");
    } finally {
      setExportingNewsletter(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none">
      {/* Section 1 : Configuration de l'expéditeur et des e-mails SaaS */}
      <EmailConfigSection
        formData={formData}
        handleChange={handleChange}
        saving={saving}
      />

      {/* Section 2 : Vidéo à la une (Dashboard & Accueil) */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-encre-noire shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎬</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood">
                Vidéo à la une (Accueil & Dashboard)
              </h4>
              <p className="text-[10px] text-cordel-master-dark/70 font-semibold mt-0.5">
                Mettez en avant une captation, un tutoriel ou un débrief vidéo directement auprès des adhérents sur l'Accueil.
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
              {formData?.videoALaUne?.active ? 'Affichée sur l\'Accueil' : 'Masquée'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Champ Titre descriptif */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-cordel-master-dark mb-1">
              Titre descriptif ou consigne
            </label>
            <input
              type="text"
              name="videoALaUne.titre"
              value={formData?.videoALaUne?.titre || ''}
              onChange={(e) => handleChange('videoALaUne.titre', e.target.value)}
              placeholder="ex: Débrief du concert d'Erdeven, Tutoriel Toada..."
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood shadow-inner"
            />
          </div>

          {/* Champ Lien YouTube */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-cordel-master-dark mb-1">
              Lien de la vidéo YouTube *
            </label>
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
                Formats acceptés : liens classiques (youtube.com/watch?v=...), partages courts (youtu.be/...), Shorts ou Embeds.
              </p>
            );
          }
          const videoId = extractYouTubeVideoId(currentUrl);
          if (videoId) {
            return (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs font-bold">
                <span>✓</span>
                <span>ID YouTube validé : <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{videoId}</code></span>
                <span className="text-[10px] opacity-75 ml-auto">Miniature 16:9 prête</span>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-300 rounded text-[var(--color-cordel-ocre,#c05621)] text-xs font-bold">
              <span>⚠️</span>
              <span>Lien non reconnu. Assurez-vous d'avoir collé un lien YouTube valide.</span>
            </div>
          );
        })()}

        {/* Bouton de sauvegarde dédié à la vidéo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
          <span className="text-[10px] text-cordel-master-dark/75 font-semibold">
            {savingVideoMsg || "Sauvegarde immédiate sans impacter la configuration e-mail/Brevo."}
          </span>
          <CordelButton
            type="button"
            variant="vert"
            useExtremeBorder={true}
            onClick={handleSaveVideoDirectly}
            disabled={savingVideo || saving}
            className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 shadow-[1.5px_1.5px_0px_0px_#181716] self-start sm:self-auto"
          >
            {savingVideo ? "Enregistrement..." : "💾 Enregistrer la vidéo"}
          </CordelButton>
        </div>
      </CordelCard>

      {/* En-tête de la section Communication & Newsletter */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 bg-cordel-bg">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-xl">📢</span>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood">
            Communication & Diffusion Newsletter
          </h3>
        </div>
        <p className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 leading-relaxed">
          Gérez l'exportation des adresses électroniques récoltées via la vitrine publique et configurez la synchronisation automatique avec votre compte Brevo (Sendinblue).
        </p>
      </CordelCard>

      {/* Carte 1 : Abonnés Newsletter & Synchronisation Brevo */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-[var(--color-cordel-vert,#2d6a4f)]/30 shadow-xs">
        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-cordel-vert,#2d6a4f)] border-b border-dashed border-cordel-master-dark/20 pb-2 flex flex-wrap items-center justify-between gap-2">
          <span>📬 Adhérents et Visiteurs Inscrits à la Newsletter</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-700 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              {subscriberCount !== null ? `${subscriberCount} abonné(s)` : 'Chargement...'}
            </span>
            {syncedBrevoCount !== null && (
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                subscriberCount > 0 && syncedBrevoCount === subscriberCount
                  ? 'bg-emerald-50 text-[var(--color-cordel-vert,#2d6a4f)] border-emerald-300'
                  : 'bg-amber-50 text-[var(--color-cordel-ocre,#c05621)] border-amber-300'
              }`}>
                ⚡ {syncedBrevoCount}/{subscriberCount || 0} dans Brevo
              </span>
            )}
          </div>
        </h4>

        <p className="text-xs text-stone-600 leading-relaxed">
          Les adresses e-mails saisies par vos membres et visiteurs depuis la vitrine sont stockées en toute sécurité et synchronisées en temps réel vers Brevo. Vous pouvez également déclencher une synchronisation manuelle ou exporter le listing complet au format CSV.
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
              <span>{exportingNewsletter ? "Génération du CSV..." : "Exporter CSV"}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncBrevo}
              disabled={syncingBrevo || subscriberCount === 0}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
              title="Synchroniser immédiatement tous les contacts avec la liste Brevo configurée"
            >
              <span className={syncingBrevo ? "animate-spin" : ""}>🔄</span>
              <span>{syncingBrevo ? "Synchronisation Brevo..." : "Synchroniser avec Brevo"}</span>
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
    </div>
  );
}
