import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

/**
 * Bloc d'édition de la Newsletter, de l'exportation des abonnés et de l'API Brevo.
 */
export default function NewsletterBrevoBlock({
  publicTheme = {},
  handleChange,
  groupId,
  saving
}) {
  const vitrineTexts = publicTheme.vitrineTexts || {};
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [exportingNewsletter, setExportingNewsletter] = useState(false);
  const [newsletterStatusMsg, setNewsletterStatusMsg] = useState('');
  const [showBrevoKey, setShowBrevoKey] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSubscribersCount = async () => {
      try {
        const subscribersRef = collection(db, 'newsletter_subscribers');
        const q = groupId ? query(subscribersRef, where('groupId', '==', groupId)) : subscribersRef;
        const snapshot = await getDocs(q);
        if (isMounted) setSubscriberCount(snapshot.size);
      } catch (err) {
        console.error("Erreur lors du comptage des abonnés newsletter:", err);
      }
    };
    fetchSubscribersCount();
    return () => { isMounted = false; };
  }, [groupId]);

  const handleThemeChange = (field, value) => {
    handleChange('publicTheme', {
      ...publicTheme,
      [field]: value
    });
  };

  const handleTextChange = (fieldKey, value) => {
    const updatedTexts = {
      ...(publicTheme.vitrineTexts || {}),
      [fieldKey]: value
    };
    handleChange('publicTheme', {
      ...publicTheme,
      vitrineTexts: updatedTexts
    });
  };

  const handleExportNewsletterCSV = async () => {
    setExportingNewsletter(true);
    setNewsletterStatusMsg('');

    try {
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const q = groupId ? query(subscribersRef, where('groupId', '==', groupId)) : subscribersRef;
      const snapshot = await getDocs(q);
      const subscribers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      if (subscribers.length === 0) {
        setNewsletterStatusMsg("⚠️ Aucun abonné pour le moment.");
        return;
      }

      subscribers.sort((a, b) => new Date(b.dateInscription || 0) - new Date(a.dateInscription || 0));
      const headers = ["E-mail", "Date d'inscription", "Source"];
      const rows = subscribers.map(sub => [
        `"${(sub.email || '').replace(/"/g, '""')}"`,
        `"${sub.dateInscription ? new Date(sub.dateInscription).toLocaleString('fr-FR') : (sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleString('fr-FR') : '')}"`,
        `"${(sub.source || 'vitrine').replace(/"/g, '""')}"`
      ].join(';'));

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

      setNewsletterStatusMsg(`✓ ${subscribers.length} abonné(s) exporté(s) !`);
    } catch (err) {
      console.error("Erreur lors de l'exportation CSV des abonnés:", err);
      setNewsletterStatusMsg("❌ Erreur lors de l'exportation.");
    } finally {
      setExportingNewsletter(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Paramètres de la section Newsletter */}
      <div className="flex flex-col gap-3 p-3 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-cordel-vert,#2d6a4f)]">
            📬 Formulaire Newsletter
          </span>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="afficherNewsletter"
              checked={publicTheme.afficherNewsletter !== false}
              onChange={(e) => handleThemeChange('afficherNewsletter', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
            />
            <label htmlFor="afficherNewsletter" className="text-[11px] font-bold text-encre-noire cursor-pointer select-none">
              Afficher sur la vitrine
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">Titre Newsletter</label>
            <input
              type="text"
              value={vitrineTexts.titreNewsletter || ''}
              onChange={(e) => handleTextChange('titreNewsletter', e.target.value)}
              disabled={saving}
              placeholder="Restez Informé !"
              className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">Badge / Sur-titre</label>
            <input
              type="text"
              value={vitrineTexts.badgeNewsletter || ''}
              onChange={(e) => handleTextChange('badgeNewsletter', e.target.value)}
              disabled={saving}
              placeholder="Infolettre & Actus"
              className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-stone-700">Phrase d'accroche Newsletter</label>
          <textarea
            rows={2}
            value={vitrineTexts.accrocheNewsletter || ''}
            onChange={(e) => handleTextChange('accrocheNewsletter', e.target.value)}
            disabled={saving}
            placeholder="Inscrivez-vous pour recevoir nos dates de concerts !"
            className="text-xs font-medium px-2.5 py-1.5 border border-stone-300 rounded bg-white resize-none"
          />
        </div>

        {/* Abonnés & Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-dashed border-stone-300">
          <span className="text-[11px] text-stone-600 font-medium">
            Abonnés : <strong>{subscriberCount !== null ? `${subscriberCount} inscrit(s)` : '...'}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportNewsletterCSV}
              disabled={exportingNewsletter}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-[var(--color-cordel-vert,#2d6a4f)] rounded hover:brightness-110 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {exportingNewsletter ? "..." : "📥 Exporter CSV"}
            </button>
            {newsletterStatusMsg && (
              <span className="text-[10px] font-bold text-emerald-800">{newsletterStatusMsg}</span>
            )}
          </div>
        </div>
      </div>

      {/* Synchronisation API Brevo */}
      <div className="p-3 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
            ⚡ Synchronisation Brevo (API)
          </span>
          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
            publicTheme.brevoApiKey ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            {publicTheme.brevoApiKey ? '✓ Connecté' : '⚪ Optionnel'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-stone-700">Clé API Brevo v3</label>
              <button
                type="button"
                onClick={() => setShowBrevoKey(!showBrevoKey)}
                className="text-[9px] text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                {showBrevoKey ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            <input
              type={showBrevoKey ? 'text' : 'password'}
              value={publicTheme.brevoApiKey || ''}
              onChange={(e) => handleThemeChange('brevoApiKey', e.target.value)}
              disabled={saving}
              placeholder="xkeysib-..."
              className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">ID Liste Brevo</label>
            <input
              type="text"
              value={publicTheme.brevoListId || ''}
              onChange={(e) => handleThemeChange('brevoListId', e.target.value)}
              disabled={saving}
              placeholder="Ex: 2 ou 5"
              className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
