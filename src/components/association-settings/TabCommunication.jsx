import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import CordelCard from '../CordelCard';
import EmailConfigSection from './email/EmailConfigSection';
import BrevoIntegrationBlock from './blocks/BrevoIntegrationBlock';

/**
 * Composant d'administration dédié au pôle Studio pour la gestion de la Communication
 * (Configuration de l'expéditeur & des e-mails SaaS, Export CSV des abonnés newsletter & Synchronisation Brevo).
 */
export default function TabCommunication({ formData, handleChange, groupId, saving, t }) {
  // État local pour le comptage, l'exportation et la synchronisation des abonnés newsletter
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [syncedBrevoCount, setSyncedBrevoCount] = useState(null);
  const [exportingNewsletter, setExportingNewsletter] = useState(false);
  const [syncingBrevo, setSyncingBrevo] = useState(false);
  const [newsletterStatusMsg, setNewsletterStatusMsg] = useState('');

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

  // Exportation de la liste des abonnés au formater CSV (compatible Excel & Google Sheets)
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
    </div>
  );
}
