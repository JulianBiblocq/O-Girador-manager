import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import TabPublicGallery from './TabPublicGallery';
import TabPublicRecruitment from './TabPublicRecruitment';
import TabPublicProDocs from './TabPublicProDocs';
import TabPublicSectionTexts from './TabPublicSectionTexts';
import RichTextEditor from '../RichTextEditor';

/**
 * Composant d'administration dédié à la gestion des contenus rédactionnels
 * du site vitrine public (Textes, médias, Galerie Photos, Newsletter, Fiche Technique et Contacts).
 */
export default function TabPublicContent({
  formData,
  handleChange,
  heroImageFile,
  setHeroImageFile,
  dossierProPdfFile,
  setDossierProPdfFile,
  dossierPresentationFile,
  setDossierPresentationFile,
  ficheTechniqueFile,
  setFicheTechniqueFile,
  planSceneFile,
  setPlanSceneFile,
  kitPresseFile,
  setKitPresseFile,
  groupId,
  saving,
  t,
  contentSubTab = 'presentation'
}) {
  const publicTheme = formData.publicTheme || {};
  const socialLinks = publicTheme.socialLinks || {};

  // État local pour le module d'exportation de la newsletter & Brevo
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [exportingNewsletter, setExportingNewsletter] = useState(false);
  const [newsletterStatusMsg, setNewsletterStatusMsg] = useState('');
  const [showBrevoKey, setShowBrevoKey] = useState(false);

  // Récupération du nombre d'abonnés à la newsletter
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
        console.error("Erreur lors du comptage des abonnés newsletter:", err);
      }
    };

    fetchSubscribersCount();
    return () => { isMounted = false; };
  }, [groupId]);

  // Exportation des abonnés newsletter au format CSV (compatible Excel, Sheets)
  const handleExportNewsletterCSV = async () => {
    setExportingNewsletter(true);
    setNewsletterStatusMsg('');

    try {
      const subscribersRef = collection(db, 'newsletter_subscribers');
      const q = groupId ? query(subscribersRef, where('groupId', '==', groupId)) : subscribersRef;
      const snapshot = await getDocs(q);

      const subscribers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      if (subscribers.length === 0) {
        setNewsletterStatusMsg("⚠️ Aucun abonné à la newsletter inscrit pour le moment.");
        return;
      }

      // Tri par date d'inscription la plus récente
      subscribers.sort((a, b) => new Date(b.dateInscription || 0) - new Date(a.dateInscription || 0));

      const headers = ["E-mail", "Date d'inscription", "Source"];
      const rows = subscribers.map(sub => [
        `"${(sub.email || '').replace(/"/g, '""')}"`,
        `"${sub.dateInscription ? new Date(sub.dateInscription).toLocaleString('fr-FR') : (sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleString('fr-FR') : '')}"`,
        `"${(sub.source || 'vitrine').replace(/"/g, '""')}"`
      ].join(';'));

      // Formatage du fichier CSV (Séparateur point-virgule et Encodage UTF-8 BOM)
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
      console.error("Erreur lors de l'exportation CSV des abonnés:", err);
      setNewsletterStatusMsg("❌ Erreur lors de la génération du fichier CSV.");
    } finally {
      setExportingNewsletter(false);
    }
  };

  const handleThemeChange = (field, value) => {
    const updatedTheme = {
      ...publicTheme,
      [field]: value
    };
    if (field === 'publicCatchphrase') updatedTheme.heroCatchphrase = value;
    if (field === 'publicDescription') updatedTheme.aboutText = value;
    if (field === 'publicVideoLink') updatedTheme.videoUrl = value;
    handleChange('publicTheme', updatedTheme);
  };

  // Mise à jour spécifique de la carte des liens réseaux sociaux
  const handleSocialLinkChange = (network, value) => {
    const updatedTheme = {
      ...publicTheme,
      socialLinks: {
        ...(publicTheme.socialLinks || {}),
        [network]: value
      }
    };
    handleChange('publicTheme', updatedTheme);
  };

  return (
    <div className="flex flex-col gap-6 text-left">

      {/* Onglet 1: Textes & Médias Vitrine */}
      {contentSubTab === 'presentation' && (
        <>
        <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white">
          <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2">
            🖼️ Titre, Bannière & Textes de Présentation
          </h4>

        {/* Titre Principal du Site / Nom de l'Association */}
        <div className="flex flex-col gap-1.5 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
          <label className="text-xs font-bold uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🏷️ Titre Principal du Site / Nom de l'Association</span>
            <span className="text-[10px] font-normal text-stone-500">(Ex: Samambaia)</span>
          </label>
          <input
            type="text"
            value={formData.nom || ''}
            onChange={(e) => handleChange('nom', e.target.value)}
            disabled={saving}
            placeholder="Ex: Samambaia"
            className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>

        {/* Image de Couverture Hero */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            Image de Couverture Hero (Bannière / Fond)
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {setHeroImageFile && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setHeroImageFile(e.target.files[0]);
                  }
                }}
                disabled={saving}
                className="text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-cordel-bg file:text-encre-noire hover:file:brightness-95 cursor-pointer"
              />
            )}
            {heroImageFile && (
              <span className="text-xs font-bold text-cordel-vert flex items-center gap-1">
                ✓ Nouvelle image sélectionnée ({Math.round(heroImageFile.size / 1024)} Ko)
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-500 font-medium italic">
            💡 Format recommandé : Paysage (ex: 1920x1080px). L'image sera automatiquement optimisée pour le web.
          </span>
          <input
            type="url"
            value={publicTheme.publicHeroImage || ''}
            onChange={(e) => handleThemeChange('publicHeroImage', e.target.value)}
            disabled={saving}
            placeholder="https://exemple.com/image-couverture.jpg (ou téléverser un fichier)"
            className="flex-1 text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />

          {/* Opacité du voile Hero (Overlay) */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-encre-noire/15 mt-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold uppercase tracking-wider text-encre-noire/80">
                🖼️ Voile sur l'image d'accueil (Hero Overlay)
              </label>
              <span className="text-[11px] font-black text-cordel-wood bg-cordel-bg px-2 py-0.5 rounded border border-encre-noire/20">
                {publicTheme.heroOverlayOpacity !== undefined ? publicTheme.heroOverlayOpacity : 25}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={publicTheme.heroOverlayOpacity !== undefined ? publicTheme.heroOverlayOpacity : 25}
                onChange={(e) => handleThemeChange('heroOverlayOpacity', Number(e.target.value))}
                disabled={saving}
                className="flex-1 accent-cordel-wood cursor-pointer"
              />
              <span className="text-[10px] text-stone-500 font-medium">
                {publicTheme.heroOverlayOpacity <= 15 ? 'Éclatant' : publicTheme.heroOverlayOpacity <= 35 ? 'Équilibré' : 'Sombre'}
              </span>
            </div>
          </div>
        </div>

        {/* Phrase d'accroche */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            Phrase d'Accroche (Hero Section)
          </label>
          <input
            type="text"
            value={publicTheme.publicCatchphrase || publicTheme.heroCatchphrase || ''}
            onChange={(e) => handleThemeChange('publicCatchphrase', e.target.value)}
            disabled={saving}
            placeholder="Ex: L'énergie percutante et solaire du Maracatú brésilien !"
            className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>

        {/* Texte "Qui sommes-nous ?" */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            Présentation "Qui sommes-nous ?"
          </label>
          <RichTextEditor
            value={publicTheme.publicDescription || publicTheme.aboutText || ''}
            onChange={(val) => handleThemeChange('publicDescription', val)}
            disabled={saving}
            placeholder="Présentez l'histoire de votre association, vos ateliers, votre univers musical..."
            minHeight="140px"
            showLists={true}
            showImage={false}
            showAlign={true}
          />
        </div>

        {/* Lien Vidéo YouTube / Vimeo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            Lien Vidéo YouTube ou Vimeo (Optionnel)
          </label>
          <input
            type="url"
            value={publicTheme.publicVideoLink || publicTheme.videoUrl || ''}
            onChange={(e) => handleThemeChange('publicVideoLink', e.target.value)}
            disabled={saving}
            placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            className="text-xs font-mono px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>
      </CordelCard>

      {/* Personnalisation dynamique des Titres & Accroches des Sections Vitrine */}
      <TabPublicSectionTexts
        formData={formData}
        handleChange={handleChange}
        saving={saving}
      />
      </>
      )}

      {/* Onglet 2: Espace Organisateur & Fiche Technique */}
      {contentSubTab === 'organisateur' && (
        <>
        <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white border-2 border-cordel-master-dark/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
          <span>🎪 Espace Organisateur & Fiche Technique</span>
          <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
            Dossier de Presse Web
          </span>
        </h4>

        {/* Toggle Activer / Désactiver */}
        <div className="flex items-center gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] select-none">
          <input
            type="checkbox"
            id="enableOrganizerSection"
            checked={publicTheme.enableOrganizerSection !== false}
            onChange={(e) => handleThemeChange('enableOrganizerSection', e.target.checked)}
            disabled={saving}
            className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
          />
          <label htmlFor="enableOrganizerSection" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer flex flex-wrap items-center gap-1.5">
            <span>Afficher la section "Nous Programmer / Fiche Technique" sur la vitrine</span>
          </label>
        </div>

        {/* Formats de Prestations */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center justify-between">
            <span>🥁 Nos Formats de Prestations</span>
            <span className="text-[10px] text-stone-500 font-normal">Personnalisable pour la 1ère carte</span>
          </label>
          <RichTextEditor
            value={publicTheme.publicPerformanceFormats || ''}
            onChange={(val) => handleThemeChange('publicPerformanceFormats', val)}
            disabled={saving}
            placeholder={`Ex: • Festivals & Fêtes de Ville : Défilés de rue déambulatoires, ouvertures de carnivals...\n• Animations Culturelles : Parades populaires...\n• Événements Privés : Prestations sur-mesure.`}
            minHeight="140px"
            showLists={true}
            showImage={false}
            showAlign={true}
          />
        </div>

        {/* Fiche Technique */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            Fiche Technique & Besoins Logistiques
          </label>
          <RichTextEditor
            value={publicTheme.publicTechnicalSheet || ''}
            onChange={(val) => handleThemeChange('publicTechnicalSheet', val)}
            disabled={saving}
            placeholder="Ex: Effectif : 12 à 20 musiciens + 1 Mestre. Besoins : 1 Loge fermée avec point d'eau, parking convoi, 1 repère scénique..."
            minHeight="140px"
            showLists={true}
            showImage={false}
            showAlign={true}
          />
        </div>

        {/* Dossier Pro / Fiche Technique PDF Téléchargeable */}
        <div className="flex flex-col gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20 mt-1">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
              <span>📄 Dossier Pro / Fiche Technique PDF (Téléchargeable)</span>
            </label>
            {publicTheme.dossierProPdfUrl && (
              <a
                href={publicTheme.dossierProPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-800 hover:underline bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>👁️ Consulter le PDF actuel</span> ↗
              </a>
            )}
          </div>
          <p className="text-[10px] text-stone-500 font-medium leading-tight">
            Téléversez un fichier PDF (plan de scène, fiche technique complète, dossier de presse) téléchargeable par les organisateurs sur la vitrine publique.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setDossierProPdfFile(e.target.files[0]);
                }
              }}
              disabled={saving}
              className="flex-1 text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-cordel-bg file:text-encre-noire hover:file:brightness-95 cursor-pointer"
            />
            {dossierProPdfFile && (
              <button
                type="button"
                onClick={() => setDossierProPdfFile(null)}
                className="text-[10px] font-bold text-red-700 hover:underline cursor-pointer"
              >
                ✖ Annuler
              </button>
            )}
          </div>
          {dossierProPdfFile && (
            <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 font-semibold flex items-center gap-2">
              <span>📌 Nouveau PDF prêt à l'envoi : <strong>{dossierProPdfFile.name}</strong> ({(dossierProPdfFile.size / 1024).toFixed(0)} Ko)</span>
            </div>
          )}
          <input
            type="url"
            value={publicTheme.dossierProPdfUrl || ''}
            onChange={(e) => handleThemeChange('dossierProPdfUrl', e.target.value)}
            disabled={saving}
            placeholder="https://exemple.com/dossier-pro.pdf (ou téléverser un fichier PDF ci-dessus)"
            className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
          />
        </div>

        {/* Contacts Programmation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              E-mail de Contact (Programmation)
            </label>
            <input
              type="email"
              value={publicTheme.publicContactEmail || ''}
              onChange={(e) => handleThemeChange('publicContactEmail', e.target.value)}
              disabled={saving}
              placeholder="contact@mon-association.fr"
              className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Téléphone de Contact Public
            </label>
            <input
              type="tel"
              value={publicTheme.publicContactPhone || ''}
              onChange={(e) => handleThemeChange('publicContactPhone', e.target.value)}
              disabled={saving}
              placeholder="06 12 34 56 78"
              className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>
        </div>
      </CordelCard>

      {/* Section des 4 Documents Espace Pro (Organisateurs / Presse) */}
      <TabPublicProDocs
        formData={formData}
        handleChange={handleChange}
        dossierPresentationFile={dossierPresentationFile}
        setDossierPresentationFile={setDossierPresentationFile}
        ficheTechniqueFile={ficheTechniqueFile}
        setFicheTechniqueFile={setFicheTechniqueFile}
        planSceneFile={planSceneFile}
        setPlanSceneFile={setPlanSceneFile}
        kitPresseFile={kitPresseFile}
        setKitPresseFile={setKitPresseFile}
        saving={saving}
      />
      </>
      )}

      {/* Onglet 3: Galerie Photos */}
      {contentSubTab === 'galerie' && (
        <TabPublicGallery
          formData={formData}
          handleChange={handleChange}
          groupId={groupId}
          saving={saving}
        />
      )}

      {/* Onglet 4: Recrutement */}
      {contentSubTab === 'recrutement' && (
        <TabPublicRecruitment
          formData={formData}
          handleChange={handleChange}
          saving={saving}
        />
      )}

      {/* Onglet 4: Réseaux Sociaux & Newsletter */}
      {contentSubTab === 'reseaux' && (
        <div className="flex flex-col gap-6">
          {/* Liens des Réseaux Sociaux (Dynamiques) */}
          <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white">
            <h4 className="text-xs font-black uppercase tracking-widest text-encre-noire border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
              <span>🌐 Liens des Réseaux Sociaux</span>
              <span className="text-[10px] text-stone-500 font-normal">Affichage dynamique sur la vitrine</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Facebook */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
                  <span>📘 Page / Groupe Facebook</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.facebook || ''}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                  disabled={saving}
                  placeholder="https://facebook.com/votre-page"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>

              {/* Instagram */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
                  <span>📸 Compte Instagram</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.instagram || ''}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  disabled={saving}
                  placeholder="https://instagram.com/votre-compte"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>

              {/* YouTube */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
                  <span>🎬 Chaîne YouTube</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.youtube || ''}
                  onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                  disabled={saving}
                  placeholder="https://youtube.com/@votre-chaine"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>

              {/* WhatsApp */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
                  <span>💬 Boucle ou Lien WhatsApp</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.whatsapp || ''}
                  onChange={(e) => handleSocialLinkChange('whatsapp', e.target.value)}
                  disabled={saving}
                  placeholder="https://chat.whatsapp.com/... ou https://wa.me/..."
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>
            </div>
          </CordelCard>

          {/* Abonnés Newsletter & Export CSV */}
          <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-[var(--color-cordel-vert,#2d6a4f)]/30">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-cordel-vert,#2d6a4f)] border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
              <span>📬 Abonnés Newsletter & Export</span>
              <span className="text-[10px] text-stone-600 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                {subscriberCount !== null ? `${subscriberCount} abonné(s)` : 'Chargement...'}
              </span>
            </h4>

            <p className="text-xs text-stone-600 leading-relaxed">
              Les adresses e-mails saisies par vos fans et visiteurs sur la vitrine publique sont enregistrées ici. Vous pouvez exporter la liste complète au format CSV pour l'importer facilement dans votre outil de mailing (Brevo, Mailchimp, SendGrid...).
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportNewsletterCSV}
                disabled={exportingNewsletter}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[var(--color-cordel-vert,#2d6a4f)] rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>📥</span>
                <span>{exportingNewsletter ? "Génération..." : "Exporter les abonnés Newsletter (CSV)"}</span>
              </button>

              {newsletterStatusMsg && (
                <span className={`text-xs font-bold ${newsletterStatusMsg.includes('❌') || newsletterStatusMsg.includes('⚠️') ? 'text-amber-800' : 'text-emerald-800'}`}>
                  {newsletterStatusMsg}
                </span>
              )}
            </div>
          </CordelCard>

          {/* Configuration API Brevo */}
          <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-stone-200">
            <h4 className="text-xs font-black uppercase tracking-widest text-stone-800 border-b border-dashed border-stone-200 pb-2 flex items-center justify-between">
              <span>⚡ Synchronisation Automatique Brevo (API)</span>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                publicTheme.brevoApiKey ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {publicTheme.brevoApiKey ? '✓ Clé API renseignée' : '⚠️ Non configuré'}
              </span>
            </h4>

            <p className="text-xs text-stone-600 leading-relaxed">
              Connectez votre compte Brevo (ex-Sendinblue) pour ajouter automatiquement chaque nouvel inscrit de la vitrine à votre liste de contacts mailing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Clé API Brevo */}
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
                  onChange={(e) => handleThemeChange('brevoApiKey', e.target.value)}
                  disabled={saving}
                  placeholder="xkeysib-..."
                  className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono"
                />
              </div>

              {/* ID de la Liste Brevo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <span>📋 ID de la Liste Brevo (Optionnel)</span>
                </label>
                <input
                  type="text"
                  value={publicTheme.brevoListId || ''}
                  onChange={(e) => handleThemeChange('brevoListId', e.target.value)}
                  disabled={saving}
                  placeholder="Ex: 2 ou 5"
                  className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono"
                />
              </div>
            </div>

            <span className="text-[10px] text-stone-500 font-medium italic">
              💡 Votre clé API v3 se trouve sur votre compte Brevo sous <strong>Paramètres &gt; Clés API</strong>.
            </span>
          </CordelCard>
        </div>
      )}
    </div>
  );
}
