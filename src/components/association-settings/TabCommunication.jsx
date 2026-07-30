import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';

/**
 * Composant d'administration dédié au pôle Studio pour la gestion de la Communication
 * (Export CSV de la liste des abonnés newsletter & Configuration de la synchronisation API Brevo).
 */
export default function TabCommunication({ formData, handleChange, groupId, saving, t }) {
  const publicTheme = formData.publicTheme || {};

  // État local pour le comptage et l'exportation des abonnés newsletter
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [exportingNewsletter, setExportingNewsletter] = useState(false);
  const [newsletterStatusMsg, setNewsletterStatusMsg] = useState('');
  const [showBrevoKey, setShowBrevoKey] = useState(false);

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

  // Mise à jour de la configuration Brevo dans publicTheme
  const handleBrevoFieldChange = (field, value) => {
    const updatedTheme = {
      ...publicTheme,
      [field]: value
    };
    handleChange('publicTheme', updatedTheme);
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none">
      {/* En-tête de la section Communication */}
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

      {/* Carte 2 : Integration API Brevo */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-stone-200 shadow-xs">
        <h4 className="text-xs font-black uppercase tracking-widest text-stone-800 border-b border-dashed border-stone-200 pb-2 flex items-center justify-between">
          <span>⚡ Synchronisation Automatique Brevo (API)</span>
          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
            publicTheme.brevoApiKey ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            {publicTheme.brevoApiKey ? '✓ Clé API activée' : '⚠️ Non configuré'}
          </span>
        </h4>

        <p className="text-xs text-stone-600 leading-relaxed">
          Connectez votre compte Brevo (ex-Sendinblue) pour pousser automatiquement chaque nouvel e-mail inscrit depuis la vitrine vers votre liste de contacts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Champ Clé API Brevo v3 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center justify-between">
              <span>🔑 Clé API Brevo v3</span>
              <button
                type="button"
                onClick={() => setShowBrevoKey(!showBrevoKey)}
                className="text-[10px] font-normal text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                {showBrevoKey ? '🙈 Masquer' : '👁️ Afficher'}
              </button>
            </label>
            <input
              type={showBrevoKey ? 'text' : 'password'}
              value={publicTheme.brevoApiKey || ''}
              onChange={(e) => handleBrevoFieldChange('brevoApiKey', e.target.value)}
              disabled={saving}
              placeholder="xkeysib-..."
              className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-800"
            />
          </div>

          {/* Champ ID de Liste Brevo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <span>📋 ID de la Liste Brevo (Optionnel)</span>
            </label>
            <input
              type="text"
              value={publicTheme.brevoListId || ''}
              onChange={(e) => handleBrevoFieldChange('brevoListId', e.target.value)}
              disabled={saving}
              placeholder="Ex: 2 ou 5"
              className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-800"
            />
          </div>
        </div>

        <span className="text-[10px] text-stone-500 font-medium italic">
          💡 La clé API se récupère sur votre espace d'administration Brevo sous <strong>Paramètres &gt; Clés API</strong>.
        </span>
      </CordelCard>
    </div>
  );
}
