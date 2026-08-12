import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import EmailConfigSection from './email/EmailConfigSection';
import BrevoIntegrationBlock from './blocks/BrevoIntegrationBlock';

/**
 * Composant d'administration dédié au pôle Studio pour la gestion de la Communication
 * (Configuration de l'expéditeur & des e-mails SaaS, Export CSV des abonnés newsletter & Synchronisation Brevo).
 */
export default function TabCommunication({ formData, handleChange, groupId, saving, t }) {
  // État local pour le comptage et l'exportation des abonnés newsletter
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [exportingNewsletter, setExportingNewsletter] = useState(false);
  const [newsletterStatusMsg, setNewsletterStatusMsg] = useState('');

  // Récupération dynamique du nombre d'inscrits à la newsletter
  useEffect(() => {
    let isMounted = true;
    const fetchSubscribersCount = async () => {
      try {
        const subscribersRef = collection(db, 'newsletter_subscribers');
        const q = groupId ? query(subscribersRef, where('groupId', '==', groupId)) : subscribersRef;
        const snapshot = await getDocs(q);
        if (isMounted) {
          setSubscriberCount(snapshot.size);
        }
      } catch (err) {
        console.error("Erreur lors de la lecture du nombre d'abonnés newsletter :", err);
      }
    };

    fetchSubscribersCount();
    return () => { isMounted = false; };
  }, [groupId]);

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

      {/* Carte 1 : Abonnés Newsletter & Export CSV */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-[var(--color-cordel-vert,#2d6a4f)]/30 shadow-xs">
        <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-cordel-vert,#2d6a4f)] border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
          <span>📬 Adhérents et Visiteurs Inscrits à la Newsletter</span>
          <span className="text-[10px] text-stone-700 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
            {subscriberCount !== null ? `${subscriberCount} abonné(s)` : 'Chargement...'}
          </span>
        </h4>

        <p className="text-xs text-stone-600 leading-relaxed">
          Les adresses e-mails saisies par vos membres et visiteurs depuis la vitrine sont stockées en toute sécurité. Vous pouvez télécharger la liste complète au format CSV pour l'importer dans vos campagnes.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportNewsletterCSV}
            disabled={exportingNewsletter}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[var(--color-cordel-vert,#2d6a4f)] rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <span>📥</span>
            <span>{exportingNewsletter ? "Génération du CSV..." : "Exporter les abonnés Newsletter (CSV)"}</span>
          </button>

          {newsletterStatusMsg && (
            <span className={`text-xs font-bold ${newsletterStatusMsg.includes('❌') || newsletterStatusMsg.includes('⚠️') ? 'text-amber-800' : 'text-emerald-800'}`}>
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
