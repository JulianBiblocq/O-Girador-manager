import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import TabPublicGallery from './TabPublicGallery';
import TabPublicRecruitment from './TabPublicRecruitment';
import TabPublicProDocs from './TabPublicProDocs';
import TabPublicGeneral from './TabPublicGeneral';
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
  contentSubTab = 'general'
}) {
  const publicTheme = formData.publicTheme || {};
  const vitrineTexts = publicTheme.vitrineTexts || {};
  const socialLinks = publicTheme.socialLinks || {};

  // Mise à jour spécifique de vitrineTexts
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

      {/* Onglet 1: Général & SEO */}
      {contentSubTab === 'general' && (
        <TabPublicGeneral
          formData={formData}
          handleChange={handleChange}
          groupId={groupId}
          saving={saving}
        />
      )}

      {/* Onglet 2: Présentation & Hero */}
      {contentSubTab === 'presentation' && (
        <>
        <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white border-2 border-cordel-master-dark/30">
          <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2">
            🖼️ Bannière d'Accueil (Hero) & Section Présentation
          </h4>

        {/* Titre Principal du Site & Titre de la Section Présentation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>🏷️ Titre Principal du Site / Nom de l'Association</span>
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>👋 Titre de la section Présentation</span>
            </label>
            <input
              type="text"
              value={vitrineTexts.titrePresentation || ''}
              onChange={(e) => handleTextChange('titrePresentation', e.target.value)}
              disabled={saving}
              placeholder="Qui sommes-nous ?"
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>
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

        {/* Configuration du Bouton d'Action Principal (Hero CTA) */}
        <div className="flex flex-col gap-3 p-3.5 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
          <label className="text-xs font-bold uppercase tracking-wider text-cordel-wood flex items-center justify-between border-b border-dashed border-stone-300 pb-1.5">
            <span>🔘 Bouton d'Action Principal (Hero CTA)</span>
            <span className="text-[10px] text-stone-500 font-normal">Haut de la page d'accueil</span>
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Texte du bouton */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Texte du bouton CTA</label>
              <input
                type="text"
                value={publicTheme.heroCtaText !== undefined ? publicTheme.heroCtaText : 'Prochaines dates'}
                onChange={(e) => handleThemeChange('heroCtaText', e.target.value)}
                disabled={saving}
                placeholder="Ex: Nous rejoindre, Prochaines dates, Nous contacter..."
                className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white font-bold"
              />
            </div>

            {/* Icône / Émoji */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Icône / Émoji</label>
              <input
                type="text"
                value={publicTheme.heroCtaIcon !== undefined ? publicTheme.heroCtaIcon : '📅'}
                onChange={(e) => handleThemeChange('heroCtaIcon', e.target.value)}
                disabled={saving}
                placeholder="📅"
                className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white text-center font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* Lien / Redirection */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700 flex items-center justify-between">
                <span>Lien / Redirection du bouton</span>
                <span className="text-[9px] text-stone-500 font-normal">Ex: #agenda, mailto:contact@asso.com, /login</span>
              </label>
              <input
                type="text"
                value={publicTheme.heroCtaLink !== undefined ? publicTheme.heroCtaLink : '#agenda'}
                onChange={(e) => handleThemeChange('heroCtaLink', e.target.value)}
                disabled={saving}
                placeholder="Ex: #agenda, #recrutement, mailto:contact@asso.com"
                className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white font-mono"
              />
            </div>

            {/* Toggle Afficher l'icône */}
            <div className="flex items-center gap-2 pt-3 sm:pt-4">
              <input
                type="checkbox"
                id="showHeroCtaIcon"
                checked={publicTheme.showHeroCtaIcon !== false}
                onChange={(e) => handleThemeChange('showHeroCtaIcon', e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
              />
              <label htmlFor="showHeroCtaIcon" className="text-xs font-bold text-stone-800 cursor-pointer select-none">
                Afficher l'icône
              </label>
            </div>
          </div>
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
      </>
      )}

      {/* Onglet 3: Espace Organisateur & Fiche Technique */}
      {contentSubTab === 'organisateur' && (
        <>
        <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white border-2 border-cordel-master-dark/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
          <span>🎪 Espace Organisateur & Fiche Technique</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            publicTheme.enableOrganizerSection !== false 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
              : 'bg-stone-100 text-stone-600 border-stone-300'
          }`}>
            {publicTheme.enableOrganizerSection !== false ? '✓ Section Active' : '⚪ Section Masquée'}
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

        {/* Titres & Badge Espace Organisateur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Titre de la section "Nous Programmer"
            </label>
            <input
              type="text"
              value={vitrineTexts.titreProgrammer || ''}
              onChange={(e) => handleTextChange('titreProgrammer', e.target.value)}
              disabled={saving}
              placeholder="Nous Programmer / Fiche Technique"
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Badge / Sur-titre Organisateur
            </label>
            <input
              type="text"
              value={vitrineTexts.badgeProgrammer || ''}
              onChange={(e) => handleTextChange('badgeProgrammer', e.target.value)}
              disabled={saving}
              placeholder="Espace Organisateur & Programmateurs"
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>
        </div>

        {/* Accroche Organisateur */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
            Description / Accroche Organisateur
          </label>
          <textarea
            rows={2}
            value={vitrineTexts.accrocheProgrammer || ''}
            onChange={(e) => handleTextChange('accrocheProgrammer', e.target.value)}
            disabled={saving}
            placeholder="Toutes les informations pratiques pour accueillir notre groupe lors de vos festivals, défilés ou événements."
            className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white resize-none"
          />
        </div>

        {/* Formats de Prestations */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center justify-between">
            <span>🥁 Nos Formats de Prestations</span>
            <span className="text-[10px] text-stone-500 font-normal">Titre & Contenu</span>
          </label>
          <input
            type="text"
            value={vitrineTexts.titreFormats || ''}
            onChange={(e) => handleTextChange('titreFormats', e.target.value)}
            disabled={saving}
            placeholder="Nos Formats de Prestations"
            className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white mb-1"
          />
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

        {/* Fiche Technique (Titre & Contenu) */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Titre de la section "Fiche Technique"
            </label>
            <input
              type="text"
              value={vitrineTexts.titreFicheTechnique || ''}
              onChange={(e) => handleTextChange('titreFicheTechnique', e.target.value)}
              disabled={saving}
              placeholder="Fiche technique et besoin logistique"
              className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Contenu de la Fiche Technique & Besoins Logistiques
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
          groupId={groupId}
          saving={saving}
        />
      )}

      {/* Onglet 4: Réseaux Sociaux & Newsletter */}
      {contentSubTab === 'reseaux' && (
        <div className="flex flex-col gap-6">
          {/* Personnalisation des Textes & Titre de la Section Contact & Réseaux */}
          <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-cordel-master-dark/30">
            <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
              <span>📞 Textes de la section "Contact & Réseaux Sociaux"</span>
            </h4>

            {/* Titre de la section Contact & Réseaux */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                Titre de la section Contact & Réseaux
              </label>
              <input
                type="text"
                value={vitrineTexts.titreContactReseaux || ''}
                onChange={(e) => handleTextChange('titreContactReseaux', e.target.value)}
                disabled={saving}
                placeholder="Contact & Réseaux Sociaux"
                className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
              />
            </div>

            {/* Phrase d'accroche / Explication */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                Phrase d'accroche / Description de la section Contact
              </label>
              <textarea
                rows={2}
                value={vitrineTexts.accrocheContactReseaux || ''}
                onChange={(e) => handleTextChange('accrocheContactReseaux', e.target.value)}
                disabled={saving}
                placeholder="Une question, un projet d'événement ou une demande de prestation ? Contactez-nous directement ou suivez l'actualité de la troupe sur nos réseaux sociaux !"
                className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white resize-none"
              />
            </div>

            {/* Libellé du bouton E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                Libellé du bouton de contact E-mail
              </label>
              <input
                type="text"
                value={vitrineTexts.boutonContactEmail || ''}
                onChange={(e) => handleTextChange('boutonContactEmail', e.target.value)}
                disabled={saving}
                placeholder="Contactez-nous pour programmer"
                className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
              />
            </div>
          </CordelCard>

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

              {/* TikTok */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
                  <span>🎵 Compte TikTok</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.tiktok || ''}
                  onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
                  disabled={saving}
                  placeholder="https://tiktok.com/@votre-compte"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>

              {/* Snapchat */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
                  <span>👻 Compte Snapchat</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.snapchat || ''}
                  onChange={(e) => handleSocialLinkChange('snapchat', e.target.value)}
                  disabled={saving}
                  placeholder="https://snapchat.com/add/votre-compte"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>

              {/* WhatsApp */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
                  <span>💬 Contact / Groupe WhatsApp</span>
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

              {/* LinkedIn */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
                  <span>💼 Page LinkedIn</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.linkedin || ''}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  disabled={saving}
                  placeholder="https://linkedin.com/company/votre-asso"
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>

              {/* Spotify / Musique */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center gap-1.5">
                  <span>🎧 Spotify / Plateforme Musicale</span>
                </label>
                <input
                  type="url"
                  value={socialLinks.spotify || ''}
                  onChange={(e) => handleSocialLinkChange('spotify', e.target.value)}
                  disabled={saving}
                  placeholder="https://open.spotify.com/artist/..."
                  className="text-xs px-3 py-2 border border-encre-noire/30 rounded bg-white font-mono"
                />
              </div>
            </div>
          </CordelCard>

          {/* Section Newsletter & Infolettre */}
          <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-[var(--color-cordel-vert,#2d6a4f)]/30">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--color-cordel-vert,#2d6a4f)] border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
              <span>📬 Section Newsletter & Infolettre</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                publicTheme.afficherNewsletter !== false 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
                  : 'bg-stone-100 text-stone-600 border-stone-300'
              }`}>
                {publicTheme.afficherNewsletter !== false ? '✓ Section Active' : '⚪ Section Masquée'}
              </span>
            </h4>

            {/* Toggle Afficher / Masquer la Newsletter sur le site */}
            <div className="flex items-center gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] select-none">
              <input
                type="checkbox"
                id="afficherNewsletter"
                checked={publicTheme.afficherNewsletter !== false}
                onChange={(e) => handleThemeChange('afficherNewsletter', e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
              />
              <label htmlFor="afficherNewsletter" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer flex flex-wrap items-center gap-1.5">
                <span>Afficher le formulaire d'inscription Newsletter sur la vitrine publique</span>
              </label>
            </div>

            {/* Titres & Badge Newsletter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                  Titre principal Newsletter
                </label>
                <input
                  type="text"
                  value={vitrineTexts.titreNewsletter || ''}
                  onChange={(e) => handleTextChange('titreNewsletter', e.target.value)}
                  disabled={saving}
                  placeholder="Restez Informé !"
                  className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                  Sur-titre / Badge Newsletter
                </label>
                <input
                  type="text"
                  value={vitrineTexts.badgeNewsletter || ''}
                  onChange={(e) => handleTextChange('badgeNewsletter', e.target.value)}
                  disabled={saving}
                  placeholder="Infolettre & Actus"
                  className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
                />
              </div>
            </div>

            {/* Accroche Newsletter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
                Phrase d'accroche / Description Newsletter
              </label>
              <textarea
                rows={2}
                value={vitrineTexts.accrocheNewsletter || ''}
                onChange={(e) => handleTextChange('accrocheNewsletter', e.target.value)}
                disabled={saving}
                placeholder="Inscrivez-vous pour recevoir nos dates de concerts et actualités directement dans votre boîte e-mail !"
                className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white resize-none"
              />
            </div>

            {/* Abonnés Newsletter & Export CSV */}
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-stone-200">
              <span className="text-xs text-stone-600 leading-relaxed font-medium">
                Abonnés enregistrés : <strong>{subscriberCount !== null ? `${subscriberCount} abonné(s)` : 'Chargement...'}</strong>
              </span>
            </div>

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
