/**
 * Script de raccordement automatisé des traductions FR/PT-BR
 * Pôle Studio - Lot 1 : Gazette / Newsletter (10 fichiers) & Galerie Photos / Médiathèque (12 fichiers)
 * Total : 22 fichiers cibles, 290 chaînes brutes raccordées sur useTranslation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babelParser from '@babel/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Assure la présence de l'import et du hook useTranslation dans le composant
 */
function ensureUseTranslation(content, importRelativePath = '../LanguageContext') {
  let modified = content;

  // 1. Vérifier l'import
  if (!modified.includes('useTranslation')) {
    const importRegex = /import\s+[^;]+;\r?\n/;
    const match = modified.match(importRegex);
    if (match) {
      modified = modified.replace(match[0], `${match[0]}import { useTranslation } from '${importRelativePath}';\n`);
    } else {
      modified = `import { useTranslation } from '${importRelativePath}';\n` + modified;
    }
  }

  // 2. Vérifier l'instanciation const { t } = useTranslation();
  if (!modified.includes('const { t } = useTranslation()') && !modified.includes('const { t,') && !modified.includes('{ t } = useTranslation')) {
    const fnRegex = /(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)/;
    const fnMatch = modified.match(fnRegex);
    if (fnMatch) {
      modified = modified.replace(fnMatch[0], `${fnMatch[0]}\n  const { t } = useTranslation();`);
    } else {
      const customHookRegex = /(export\s+function\s+\w+\s*\([^)]*\)\s*\{)/;
      const hookMatch = modified.match(customHookRegex);
      if (hookMatch) {
        modified = modified.replace(hookMatch[0], `${hookMatch[0]}\n  const { t } = useTranslation();`);
      } else {
        const arrowRegex = /(export\s+const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/;
        const arrowMatch = modified.match(arrowRegex);
        if (arrowMatch) {
          modified = modified.replace(arrowMatch[0], `${arrowMatch[0]}\n  const { t } = useTranslation();`);
        }
      }
    }
  }

  return modified;
}

// Transformations par fichier
const fileTransforms = [
  // ==========================================
  // GAZETTE & NEWSLETTER (10 fichiers)
  // ==========================================

  // 1. useNewsletterData.js
  {
    file: 'src/hooks/useNewsletterData.js',
    importPath: '../components/LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `const [titreCampagne, setTitreCampagne] = useState('Newsletter Roda de Maracatu');`,
        `const [titreCampagne, setTitreCampagne] = useState(() => t('studio.newsletter.newsletterRodaDeMaracatu'));`
      );
      return res;
    }
  },

  // 2. NewsletterStepper.jsx
  {
    file: 'src/components/studio/newsletter/NewsletterStepper.jsx',
    importPath: '../../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `aria-label="Progression de la newsletter"`,
        `aria-label={t('studio.newsletter.progressionDeLaNewsletter')}`
      );
      return res;
    }
  },

  // 3. Step1MessageAccueil.jsx
  {
    file: 'src/components/studio/newsletter/Step1MessageAccueil.jsx',
    importPath: '../../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`Étape 1 - Message d'accueil`, `{t('studio.newsletter.etape1MessageDAccueil')}`);
      res = res.replace(
        `Rédigez le sujet principal de votre campagne ainsi que le mot de bienvenue adressé aux abonnés.`,
        `{t('studio.newsletter.redigezLeSujetPrincipalDe')}`
      );
      res = res.replace(
        `Titre de la campagne <span className="text-[var(--theme-primary)]">*</span>`,
        `{t('studio.newsletter.titreDeLaCampagne')} <span className="text-[var(--theme-primary)]">*</span>`
      );
      res = res.replace(
        `placeholder="Ex : Newsletter Roda de Maracatu - Printemps 2026"`,
        `placeholder={t('studio.newsletter.exNewsletterRodaDeMaracatu')}`
      );
      res = res.replace(`Mot de bienvenue / Édito`, `{t('studio.newsletter.motDeBienvenueEdito')}`);
      res = res.replace(
        `placeholder="Chers adhérents et ami(e)s de la Roda, voici nos dernières nouvelles et les prochains rendez-vous à ne pas manquer..."`,
        `placeholder={t('studio.newsletter.chersAdherentsEtAmiE')}`
      );
      res = res.replace(`Suivant : Prochaines dates ➔`, `{t('studio.newsletter.suivantProchainesDates')}`);
      return res;
    }
  },

  // 4. Step2ProchainesDates.jsx
  {
    file: 'src/components/studio/newsletter/Step2ProchainesDates.jsx',
    importPath: '../../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`Étape 2 - Prochaines dates`, `{t('studio.newsletter.etape2ProchainesDates')}`);
      res = res.replace(
        `Cochez les événements futurs à intégrer dans la newsletter. Le titre, la date, le lieu et la description seront extraits automatiquement.`,
        `{t('studio.newsletter.cochezLesEvenementsFutursA')}`
      );
      res = res.replace(
        `Aucun événement à venir trouvé dans le calendrier. Vous pouvez poursuivre sans événement futur.`,
        `{t('studio.newsletter.aucunEvenementAVenirTrouve')}`
      );
      res = res.replace(
        `{selectedUpcomingIds.length} événement(s) sélectionné(s) pour les prochaines dates.`,
        `{selectedUpcomingIds.length} {t('studio.newsletter.evenementSSelectionneSPour')}`
      );
      res = res.replace(`⬅ Précédent`, `{t('studio.newsletter.precedent')}`);
      res = res.replace(`Suivant : Retour en images ➔`, `{t('studio.newsletter.suivantRetourEnImages')}`);
      return res;
    }
  },

  // 5. Step3RetourImages.jsx
  {
    file: 'src/components/studio/newsletter/Step3RetourImages.jsx',
    importPath: '../../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`Étape 3 - Retour en images`, `{t('studio.newsletter.etape3RetourEnImages')}`);
      res = res.replace(
        `Sélectionnez les événements passés récents, complétez le bilan/remerciements et choisissez entre 2 et 4 photos pour illustrer la newsletter.`,
        `{t('studio.newsletter.selectionnezLesEvenementsPassesRecents')}`
      );
      res = res.replace(`Événements passés récents & Bilans`, `{t('studio.newsletter.evenementsPassesRecentsBilans')}`);
      res = res.replace(`Aucun événement passé récent à afficher.`, `{t('studio.newsletter.aucunEvenementPasseRecentA')}`);
      res = res.replace(`Bilan / Remerciements pour cet événement :`, `{t('studio.newsletter.bilanRemerciementsPourCetEvenement')}`);
      res = res.replace(
        `placeholder="Ex : Superbe ambiance malgré la pluie ! Merci à toutes l'équipe..."`,
        `placeholder={t('studio.newsletter.exSuperbeAmbianceMalgreLa')}`
      );
      res = res.replace(`Grille de sélection des photos`, `{t('studio.newsletter.grilleDeSelectionDesPhotos')}`);
      res = res.replace(
        `{photoCount} / 4 photos sélectionnées (2 à 4 requis)`,
        `{photoCount} / 4 {t('studio.newsletter.photosSelectionnees2A4Requis')}`
      );
      res = res.replace(
        `Aucune photo enregistrée dans le système pour le moment.`,
        `{t('studio.newsletter.aucunePhotoEnregistreeDansLe')}`
      );
      res = res.replace(
        `Veuillez sélectionner entre 2 et 4 photos pour finaliser la mise en page de la newsletter.`,
        `{t('studio.newsletter.veuillezSelectionnerEntre2Et')}`
      );
      res = res.replace(`⬅ Précédent`, `{t('studio.newsletter.precedent')}`);
      res = res.replace(`Suivant : Récapitulatif ➔`, `{t('studio.newsletter.suivantRecapitulatif')}`);
      return res;
    }
  },

  // 6. Step4Recapitulatif.jsx
  {
    file: 'src/components/studio/newsletter/Step4Recapitulatif.jsx',
    importPath: '../../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`Étape 4 - Récapitulatif & Validation`, `{t('studio.newsletter.etape4RecapitulatifValidation')}`);
      res = res.replace(
        `Vérifiez la structure du contenu assemblé avant de générer le brouillon dans le service d'emailing.`,
        `{t('studio.newsletter.verifiezLaStructureDuContenu')}`
      );
      res = res.replace(`Brouillon généré avec succès !`, `{t('studio.newsletter.brouillonGenereAvecSucces')}`);
      res = res.replace(
        `Le brouillon de votre newsletter a été transmis à votre service d'emailing.`,
        `{t('studio.newsletter.leBrouillonDeVotreNewsletter')}`
      );
      res = res.replace(`ID Brouillon : {exportResult.data.draftId}`, `{t('studio.newsletter.idBrouillon')} {exportResult.data.draftId}`);
      res = res.replace(`Échec de génération du brouillon`, `{t('studio.newsletter.echecDeGenerationDuBrouillon')}`);
      res = res.replace(
        `Une erreur est survenue lors de l'exportation.`,
        `{t('studio.newsletter.uneErreurEstSurvenueLors')}`
      );
      res = res.replace(
        `<span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">\n            Campagne\n          </span>`,
        `<span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">\n            {t('studio.newsletter.campagne')}\n          </span>`
      );
      res = res.replace(
        `<span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">\r\n            Campagne\r\n          </span>`,
        `<span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">\r\n            {t('studio.newsletter.campagne')}\r\n          </span>`
      );
      res = res.replace(`payloadJSON.titre_campagne || 'Sans titre'`, `payloadJSON.titre_campagne || t('studio.newsletter.sansTitre')`);
      res = res.replace(`payloadJSON.message_accueil || 'Aucun mot de bienvenue.'`, `payloadJSON.message_accueil || t('studio.newsletter.aucunMotDeBienvenue')`);
      res = res.replace(
        `Événements futurs ({payloadJSON.prochaines_dates?.length || 0})`,
        `{t('studio.newsletter.evenementsFuturs')} ({payloadJSON.prochaines_dates?.length || 0})`
      );
      res = res.replace(`Aucune date sélectionnée`, `{t('studio.newsletter.aucuneDateSelectionnee')}`);
      res = res.replace(
        `Événements passés ({payloadJSON.evenements_passes?.length || 0})`,
        `{t('studio.newsletter.evenementsPasses')} ({payloadJSON.evenements_passes?.length || 0})`
      );
      res = res.replace(
        `payloadJSON.evenements_passes?.map(e => e.titre).join(', ') || 'Aucun passé sélectionné'`,
        `payloadJSON.evenements_passes?.map(e => e.titre).join(', ') || t('studio.newsletter.aucunPasseSelectionne')`
      );
      res = res.replace(`Photos associées :`, `{t('studio.newsletter.photosAssociees')}`);
      res = res.replace(`alt="Aperçu photo"`, `alt={t('studio.newsletter.apercuPhoto')}`);
      res = res.replace(`Payload JSON standardisé`, `{t('studio.newsletter.payloadJsonStandardise')}`);
      res = res.replace(
        `{copied ? '✓ Copié !' : '📋 Copier le JSON'}`,
        `{copied ? t('studio.newsletter.copie') : t('studio.newsletter.copierLeJson')}`
      );
      res = res.replace(`⬅ Précédent`, `{t('studio.newsletter.precedent')}`);
      res = res.replace(`Génération en cours...`, `{t('studio.newsletter.generationEnCours')}`);
      res = res.replace(`Générer le brouillon`, `{t('studio.newsletter.genererLeBrouillon')}`);
      return res;
    }
  },

  // 7. NewsletterPage.jsx
  {
    file: 'src/components/studio/NewsletterPage.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`Chargement du module Newsletter...`, `{t('studio.newsletter.chargementDuModuleNewsletter')}`);
      res = res.replace(`<span>Studio</span>`, `<span>{t('studio.newsletter.studio')}</span>`);
      res = res.replace(
        `<span className="text-[var(--color-cordel-vert)] dark:text-emerald-400">Export Newsletter</span>`,
        `<span className="text-[var(--color-cordel-vert)] dark:text-emerald-400">{t('studio.newsletter.exportNewsletter')}</span>`
      );
      res = res.replace(
        `<span>📰</span> Module Newsletter`,
        `<span>📰</span> {t('studio.newsletter.moduleNewsletter')}`
      );
      res = res.replace(
        `Préférez et exportez vos newsletters associatives directement vers votre plateforme emailing.`,
        `{t('studio.newsletter.preferezEtExportezVosNewsletters')}`
      );
      res = res.replace(`⬅ Retour au Studio`, `{t('studio.newsletter.retourAuStudio')}`);
      res = res.replace(
        `Service d'envoi & Expéditeur`,
        `{t('studio.newsletter.serviceDEnvoiExpediteur')}`
      );
      res = res.replace(
        `isBrevoConfigured ? "✓ Service d'envoi configuré" : "⚠️ Clé API non renseignée"`,
        `isBrevoConfigured ? t('studio.newsletter.serviceDEnvoiConfigure') : t('studio.newsletter.cleApiNonRenseignee')`
      );
      res = res.replace(
        `Expéditeur officiel : <strong className="text-encre-noire dark:text-white font-bold">{expediteurEmail}</strong>`,
        `{t('studio.newsletter.expediteurOfficiel')} <strong className="text-encre-noire dark:text-white font-bold">{expediteurEmail}</strong>`
      );
      res = res.replace(
        `La configuration technique (clé Brevo & domaine expéditeur) est centralisée dans <strong>Configuration › Communication</strong>.`,
        `{t('studio.newsletter.laConfigurationTechniqueCleBrevo')} <strong>{t('studio.newsletter.configurationCommunication')}</strong>.`
      );
      return res;
    }
  },

  // 8. PublicNewsletterForm.jsx
  {
    file: 'src/components/public/PublicNewsletterForm.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `const badgeNewsletter = vitrineTexts.badgeNewsletter || (variant === 'card' ? "Infolettre & Actualités" : "Infolettre & Prestations");`,
        `const badgeNewsletter = vitrineTexts.badgeNewsletter || (variant === 'card' ? t('studio.newsletter.infolettreActualites') : t('studio.newsletter.infolettrePrestations'));`
      );
      res = res.replace(
        `const titreNewsletter = vitrineTexts.titreNewsletter || (variant === 'card' ? "Infolettre & Actualités" : "Abonnez-vous à notre Newsletter");`,
        `const titreNewsletter = vitrineTexts.titreNewsletter || (variant === 'card' ? t('studio.newsletter.infolettreActualites') : t('studio.newsletter.abonnezVousANotreNewsletter'));`
      );
      res = res.replace(
        `const accrocheNewsletter = vitrineTexts.accrocheNewsletter || "Recevez nos prochaines dates de prestations, défilés et actualités du groupe directement dans votre boîte mail.";`,
        `const accrocheNewsletter = vitrineTexts.accrocheNewsletter || t('studio.newsletter.recevezNosProchainesDatesDe');`
      );
      res = res.replace(
        `setErrorMessage("Veuillez saisir une adresse e-mail valide.");`,
        `setErrorMessage(t('studio.newsletter.veuillezSaisirUneAdresseE'));`
      );
      res = res.replace(
        `setErrorMessage("Une erreur s'est produite lors de votre inscription. Veuillez réessayer.");`,
        `setErrorMessage(t('studio.newsletter.uneErreurSEstProduite'));`
      );
      res = res.replace(
        `isDemoMode() ? "Merci pour votre inscription ! En mode démo, aucun e-mail réel n'est envoyé." : "Merci ! Vous êtes bien inscrit(e) à notre newsletter."`,
        `isDemoMode() ? t('studio.newsletter.merciPourVotreInscriptionEn') : t('studio.newsletter.merciVousEtesBienInscrit')`
      );
      res = res.replace(`Inscrire une autre adresse`, `{t('studio.newsletter.inscrireUneAutreAdresse')}`);
      res = res.replace(
        `{submitting ? '⏳ Inscription...' : "S'inscrire à l'infolettre"}`,
        `{submitting ? t('studio.newsletter.inscription') : t('studio.newsletter.sInscrireALInfolettre')}`
      );
      res = res.replace(
        `🔒 Pas de spam. Désinscription à tout moment.`,
        `{t('studio.newsletter.pasDeSpamDesinscriptionA')}`
      );
      res = res.replace(
        `isDemoMode() ? "Merci pour votre message ! En mode démo, aucun e-mail réel n'est envoyé." : "Merci ! Vous êtes bien inscrit(e) à notre newsletter."`,
        `isDemoMode() ? t('studio.newsletter.merciPourVotreMessageEn') : t('studio.newsletter.merciVousEtesBienInscrit')`
      );
      res = res.replace(`Inscrire un autre e-mail`, `{t('studio.newsletter.inscrireUnAutreEMail')}`);
      res = res.replace(
        `{submitting ? '⏳ Validation...' : "S'inscrire"}`,
        `{submitting ? t('studio.newsletter.validation') : t('studio.newsletter.sInscrire')}`
      );
      res = res.replace(
        `🔒 Pas de spam. Vous pourrez vous désinscrire à tout moment.`,
        `{t('studio.newsletter.pasDeSpamVousPourrez')}`
      );
      return res;
    }
  },

  // 9. NewsletterBrevoBlock.jsx
  {
    file: 'src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx',
    importPath: '../../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `setNewsletterStatusMsg("⚠️ Aucun abonné pour le moment.");`,
        `setNewsletterStatusMsg(t('studio.newsletter.aucunAbonnePourLeMoment'));`
      );
      res = res.replace(
        `setNewsletterStatusMsg(\`✓ \${subscribers.length} abonné(s) exporté(s) !\`);`,
        `setNewsletterStatusMsg(t('studio.newsletter.abonnesExportes', { count: subscribers.length }));`
      );
      res = res.replace(
        `setNewsletterStatusMsg("❌ Erreur lors de l'exportation.");`,
        `setNewsletterStatusMsg(t('studio.newsletter.erreurLorsDeLExportation'));`
      );
      res = res.replace(
        `📬 Formulaire Newsletter`,
        `📬 {t('studio.newsletter.formulaireNewsletter')}`
      );
      res = res.replace(`Afficher sur la vitrine`, `{t('studio.newsletter.afficherSurLaVitrine')}`);
      res = res.replace(
        `<label className="text-[10px] font-bold uppercase text-stone-700">Titre Newsletter</label>`,
        `<label className="text-[10px] font-bold uppercase text-stone-700">{t('studio.newsletter.titreNewsletter')}</label>`
      );
      res = res.replace(`placeholder="Restez Informé !"`, `placeholder={t('studio.newsletter.restezInforme')}`);
      res = res.replace(
        `<label className="text-[10px] font-bold uppercase text-stone-700">Badge / Sur-titre</label>`,
        `<label className="text-[10px] font-bold uppercase text-stone-700">{t('studio.newsletter.badgeSurTitre')}</label>`
      );
      res = res.replace(`placeholder="Infolettre & Actus"`, `placeholder={t('studio.newsletter.infolettreActus')}`);
      res = res.replace(
        `<label className="text-[10px] font-bold uppercase text-stone-700">Phrase d'accroche Newsletter</label>`,
        `<label className="text-[10px] font-bold uppercase text-stone-700">{t('studio.newsletter.phraseDAccrocheNewsletter')}</label>`
      );
      res = res.replace(
        `placeholder="Inscrivez-vous pour recevoir nos dates de concerts !"`,
        `placeholder={t('studio.newsletter.inscrivezVousPourRecevoirNos')}`
      );
      res = res.replace(
        `Abonnés : <strong>{subscriberCount !== null ? \`\${subscriberCount} inscrit(s)\` : '...'}</strong>`,
        `{t('studio.newsletter.abonnes')} <strong>{subscriberCount !== null ? \`\${subscriberCount} \${t('studio.newsletter.inscrits')}\` : '...'}</strong>`
      );
      res = res.replace(`{exportingNewsletter ? "..." : "📥 Exporter CSV"}`, `{exportingNewsletter ? "..." : t('studio.newsletter.exporterCsv')}`);
      res = res.replace(
        `⚡ Synchronisation Brevo (API)`,
        `⚡ {t('studio.newsletter.synchronisationBrevoApi')}`
      );
      res = res.replace(
        `publicTheme.brevoApiKey ? '✓ Connecté' : '⚪ Optionnel'`,
        `publicTheme.brevoApiKey ? t('studio.newsletter.connecte') : t('studio.newsletter.optionnel')`
      );
      res = res.replace(
        `<label className="text-[10px] font-bold uppercase text-stone-700">Clé API Brevo v3</label>`,
        `<label className="text-[10px] font-bold uppercase text-stone-700">{t('studio.newsletter.cleApiBrevoV3')}</label>`
      );
      res = res.replace(
        `{showBrevoKey ? 'Masquer' : 'Afficher'}`,
        `{showBrevoKey ? t('studio.newsletter.masquer') : t('studio.newsletter.afficher')}`
      );
      res = res.replace(
        `<label className="text-[10px] font-bold uppercase text-stone-700">ID Liste Brevo</label>`,
        `<label className="text-[10px] font-bold uppercase text-stone-700">{t('studio.newsletter.idListeBrevo')}</label>`
      );
      res = res.replace(`placeholder="Ex: 2 ou 5"`, `placeholder={t('studio.newsletter.ex2Ou5')}`);
      return res;
    }
  },

  // 10. SocialNewsletterAccordion.jsx
  {
    file: 'src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx',
    importPath: '../../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`title="Réseaux Sociaux & Newsletter"`, `title={t('studio.newsletter.reseauxSociauxNewsletter')}`);
      res = res.replace(
        `subtitle="Liens réseaux (Facebook, Instagram, etc.), formulaire d'infolettre et export d'abonnés"`,
        `subtitle={t('studio.newsletter.liensReseauxFacebookInstagram')}`
      );
      res = res.replace(
        `<label className="text-[10px] font-bold uppercase text-stone-700">Titre Contact & Réseaux</label>`,
        `<label className="text-[10px] font-bold uppercase text-stone-700">{t('studio.newsletter.titreContactReseaux')}</label>`
      );
      res = res.replace(
        `placeholder="Contact & Réseaux Sociaux"`,
        `placeholder={t('studio.newsletter.contactReseauxSociaux')}`
      );
      res = res.replace(
        `<label className="text-[10px] font-bold uppercase text-stone-700">Bouton de Contact E-mail</label>`,
        `<label className="text-[10px] font-bold uppercase text-stone-700">{t('studio.newsletter.boutonDeContactEMail')}</label>`
      );
      res = res.replace(
        `placeholder="Contactez-nous pour programmer"`,
        `placeholder={t('studio.newsletter.contactezNousPourProgrammer')}`
      );
      res = res.replace(
        `<label className="text-[10px] font-bold uppercase text-stone-700">Phrase d'accroche Contact</label>`,
        `<label className="text-[10px] font-bold uppercase text-stone-700">{t('studio.newsletter.phraseDAccrocheContact')}</label>`
      );
      res = res.replace(
        `placeholder="Une question, un événement ou une prestation ? Contactez-nous ou suivez nos réseaux !"`,
        `placeholder={t('studio.newsletter.uneQuestionUnEvenementOu')}`
      );
      return res;
    }
  },

  // ==========================================
  // GALERIE PHOTOS & MÉDIATHÈQUE (12 fichiers)
  // ==========================================

  // 11. StudioPhotosView.jsx
  {
    file: 'src/components/studio/StudioPhotosView.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `{t('studioPhotos.tabRecolte') || "Récolte & Albums Prestations"}`,
        `{t('studio.photos.recolteAlbumsPrestations')}`
      );
      res = res.replace(
        `{t('studioPhotos.tabVaral') || "Varal Photos (Livrets)"}`,
        `{t('studio.photos.varalPhotosLivrets')}`
      );
      res = res.replace(
        `"Associez les dossiers partagés et imprimez les QR-Codes de chaque date."`,
        `t('studio.photos.associezLesDossiersPartagesEt')`
      );
      res = res.replace(
        `"Consultez les albums officiels sous forme de livrets Cordel suspendus."`,
        `t('studio.photos.consultezLesAlbumsOfficielsSous')`
      );
      return res;
    }
  },

  // 12. StudioVaralPickerModal.jsx
  {
    file: 'src/components/studio/StudioVaralPickerModal.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`Sélectionner des photos du Varal`, `{t('studio.photos.selectionnerDesPhotosDuVaral')}`);
      res = res.replace(
        `Aucune image trouvée dans la bibliothèque du Varal.`,
        `{t('studio.photos.aucuneImageTrouveeDansLa')}`
      );
      res = res.replace(
        `{selectedUrls.length} photo(s) sélectionnée(s)`,
        `{selectedUrls.length} {t('studio.photos.photosSelectionnees')}`
      );
      res = res.replace(`>Annuler</CordelButton>`, `>{t('studio.photos.annuler')}</CordelButton>`);
      res = res.replace(
        `>Ajouter ({selectedUrls.length})</CordelButton>`,
        `>{t('studio.photos.ajouter')} ({selectedUrls.length})</CordelButton>`
      );
      return res;
    }
  },

  // 13. StudioPhotoQrPrintModal.jsx
  {
    file: 'src/components/studio/StudioPhotoQrPrintModal.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `isDepot ? "Fiche QR-Code : Récolte Photos & Vidéos" : "Fiche QR-Code : Album Photos Officiel"`,
        `isDepot ? t('studio.photos.ficheQrCodeRecoltePhotos') : t('studio.photos.ficheQrCodeAlbumPhotos')`
      );
      res = res.replace(`title="Fermer (Échap)"`, `title={t('studio.photos.fermerEchap')}`);
      res = res.replace(
        `isDepot ? "✨ Partagez vos clichés de la Roda ! ✨" : "✨ Album Photos Officiel de la Roda ✨"`,
        `isDepot ? t('studio.photos.partagezVosClichesDeLa') : t('studio.photos.albumPhotosOfficielDeLa')`
      );
      res = res.replace(
        `{eventTitle || "Événement O Girador"}`,
        `{eventTitle || t('studio.photos.evenementOGirador')}`
      );
      res = res.replace(
        `"Scannez ce QR-Code avec l'appareil photo de votre smartphone pour déposer vos photos et vidéos dans notre espace partagé."`,
        `t('studio.photos.scannezCeQrCodeAvecL')`
      );
      res = res.replace(
        `"Scannez ce QR-Code avec votre smartphone pour visionner l'album photo complet de la prestation."`,
        `t('studio.photos.scannezCeQrCodeAvecVotre')`
      );
      res = res.replace(
        `title="Télécharger l'image du QR Code en haute définition (PNG)"`,
        `title={t('studio.photos.telechargerLImageDuQrCode')}`
      );
      res = res.replace(`<span>Exporter PNG</span>`, `<span>{t('studio.photos.exporterPng')}</span>`);
      res = res.replace(
        `title="Lancer l'impression formatée A4 prête pour affichage sur place"`,
        `title={t('studio.photos.lancerLImpressionFormateeA4')}`
      );
      res = res.replace(`<span>Imprimer Fiche A4</span>`, `<span>{t('studio.photos.imprimerFicheA4')}</span>`);
      res = res.replace(
        `{copied ? 'Lien copié !' : 'Copier le lien'}`,
        `{copied ? t('studio.photos.lienCopie') : t('studio.photos.copierLeLien')}`
      );
      res = res.replace(`title="Tester le lien dans un nouvel onglet"`, `title={t('studio.photos.testerLeLienDansUn')}`);
      res = res.replace(`<span>Tester le lien ↗</span>`, `<span>{t('studio.photos.testerLeLien')}</span>`);
      return res;
    }
  },

  // 14. StudioMultiPhotoManager.jsx
  {
    file: 'src/components/studio/StudioMultiPhotoManager.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `📸 Photos de la publication ({mediaList.length})`,
        `📸 {t('studio.photos.photosDeLaPublication')} ({mediaList.length})`
      );
      res = res.replace(`+ Affiche événement`, `+ {t('studio.photos.afficheEvenement')}`);
      res = res.replace(`📂 Depuis le Varal`, `📂 {t('studio.photos.depuisLeVaral')}`);
      res = res.replace(
        `Glissez-déposez vos photos ici ou cliquez pour parcourir`,
        `{t('studio.photos.glissezDeposezVosPhotosIci')}`
      );
      res = res.replace(
        `Sélection multiple autorisée (JPEG, PNG, WebP) - Compression auto`,
        `{t('studio.photos.selectionMultipleAutoriseeJpegPng')}`
      );
      res = res.replace(`<span>Upload en cours...</span>`, `<span>{t('studio.photos.uploadEnCours')}</span>`);
      res = res.replace(`<span>Échec envoi</span>`, `<span>{t('studio.photos.echecEnvoi')}</span>`);
      res = res.replace(`★ Couverture`, `★ {t('studio.photos.couverture')}`);
      res = res.replace(`title="Déplacer vers la gauche"`, `title={t('studio.photos.deplacerVersLaGauche')}`);
      res = res.replace(`title="Déplacer vers la droite"`, `title={t('studio.photos.deplacerVersLaDroite')}`);
      res = res.replace(`title="Définir en photo de couverture"`, `title={t('studio.photos.definirEnPhotoDeCouverture')}`);
      res = res.replace(`title="Supprimer la photo"`, `title={t('studio.photos.supprimerLaPhoto')}`);
      return res;
    }
  },

  // 15. FramaspaceGalleryViewer.jsx
  {
    file: 'src/components/studio/FramaspaceGalleryViewer.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`title = "Album Photos"`, `title = ""`);
      res = res.replace(
        `reject(new Error("Délai de connexion dépassé (8s). Le dossier distant ne répond pas ou est restreint."));`,
        `reject(new Error(t('studio.photos.delaiDeConnexionDepasse8s')));`
      );
      res = res.replace(
        `setError(data.error || "Aucun cliché accessible dans cet album.");`,
        `setError(data.error || t('studio.photos.aucunClicheAccessibleDansCet'));`
      );
      res = res.replace(
        `: "Impossible de charger la galerie en direct. Vous pouvez consulter l'album directement sur Framaspace.";`,
        `: t('studio.photos.impossibleDeChargerLaGalerie');`
      );
      res = res.replace(
        `{loading ? "Chargement des clichés..." : \`\${mediaItems.length} souvenir(s) multimédia\`}`,
        `{loading ? t('studio.photos.chargementDesCliches') : \`\${mediaItems.length} \${t('studio.photos.souvenirsMultimedia')}\`}`
      );
      res = res.replace(
        `title="Ouvrir l'album complet dans un nouvel onglet sécurisé"`,
        `title={t('studio.photos.ouvrirLAlbumCompletDans')}`
      );
      res = res.replace(`<span>↗ Ouvrir sur Framaspace</span>`, `<span>{t('studio.photos.ouvrirSurFramaspace')}</span>`);
      res = res.replace(
        `Connexion au dossier Framaspace et récupération des clichés...`,
        `{t('studio.photos.connexionAuDossierFramaspaceEt')}`
      );
      res = res.replace(`<span>Consulter l'album en ligne</span>`, `<span>{t('studio.photos.consulterLAlbumEnLigne')}</span>`);
      res = res.replace(
        `Cet album est encore vide pour le moment. Les photos et vidéos y apparaîtront dès leur téléversement.`,
        `{t('studio.photos.cetAlbumEstEncoreVide')}`
      );
      res = res.replace(
        `title="Télécharger ce fichier en haute qualité"`,
        `title={t('studio.photos.telechargerCeFichierEnHaute')}`
      );
      res = res.replace(`<span className="hidden sm:inline">Télécharger</span>`, `<span className="hidden sm:inline">{t('studio.photos.telecharger')}</span>`);
      res = res.replace(`title="Fermer (Échap)"`, `title={t('studio.photos.fermerEchap')}`);
      res = res.replace(`title="Précédente (Flèche gauche)"`, `title={t('studio.photos.precedenteFlecheGauche')}`);
      res = res.replace(
        `Lecture vidéo non décodable dans ce navigateur`,
        `{t('studio.photos.lectureVideoNonDecodableDans')}`
      );
      res = res.replace(
        `<span>Télécharger</span>\n                        </a>`,
        `<span>{t('studio.photos.telecharger')}</span>\n                        </a>`
      );
      res = res.replace(
        `<span>Télécharger</span>\r\n                        </a>`,
        `<span>{t('studio.photos.telecharger')}</span>\r\n                        </a>`
      );
      res = res.replace(`<span>Ouvrir le flux</span>`, `<span>{t('studio.photos.ouvrirLeFlux')}</span>`);
      res = res.replace(
        `💡 Conseil : Téléchargez le fichier pour le visionner directement avec VLC ou le lecteur vidéo de votre système.`,
        `{t('studio.photos.conseilTelechargezLeFichierPour')}`
      );
      res = res.replace(
        `Votre navigateur ne supporte pas la lecture directe de ce format vidéo.`,
        `{t('studio.photos.votreNavigateurNeSupportePas')}`
      );
      res = res.replace(`title="Suivante (Flèche droite)"`, `title={t('studio.photos.suivanteFlecheDroite')}`);
      res = res.replace(
        `{title}`,
        `{title || t('studio.photos.albumPhotos')}`
      );
      res = res.replace(
        `Astuce : Utilisez les touches ◀ et ▶ du clavier pour naviguer, et Échap pour quitter.`,
        `{t('studio.photos.astuceUtilisezLesTouchesEt')}`
      );
      return res;
    }
  },

  // 16. StudioEventsMediaTable.jsx
  {
    file: 'src/components/studio/StudioEventsMediaTable.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `alert("Erreur lors de l'enregistrement du lien de dépôt.");`,
        `alert(t('studio.photos.erreurLorsDeLEnregistrement'));`
      );
      res = res.replace(
        `alert("Erreur lors de la synchronisation de l'album avec le Varal.");`,
        `alert(t('studio.photos.erreurLorsDeLaSynchronisation'));`
      );
      res = res.replace(
        `alert("Aucun lien de dépôt n'est disponible pour cet événement.");`,
        `alert(t('studio.photos.aucunLienDeDepotN'));`
      );
      res = res.replace(
        `placeholder="Rechercher un concert, répétition ou lieu..."`,
        `placeholder={t('studio.photos.rechercherUnConcertRepetitionOu')}`
      );
      res = res.replace(
        `📸 Prestations & Récoltes actives`,
        `{t('studio.photos.prestationsRecoltesActives')}`
      );
      res = res.replace(`🪢 Sur le Varal`, `{t('studio.photos.surLeVaral')}`);
      res = res.replace(`🌱 À venir`, `{t('studio.photos.aVenir')}`);
      res = res.replace(
        `📋 Toutes les dates ({events.length})`,
        `{t('studio.photos.toutesLesDates')} ({events.length})`
      );
      res = res.replace(
        `Chargement des événements de l'association...`,
        `{t('studio.photos.chargementDesEvenementsDeL')}`
      );
      res = res.replace(
        `Aucun événement trouvé pour ces critères de recherche.`,
        `{t('studio.photos.aucunEvenementTrouvePourCes')}`
      );
      return res;
    }
  },

  // 17. StudioEventMediaAccordionRow.jsx
  {
    file: 'src/components/studio/StudioEventMediaAccordionRow.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `isPrestation ? "🎭 Prestation" : \`📌 \${event.type || 'Événement'}\``,
        `isPrestation ? t('studio.photos.prestation') : \`📌 \${event.type || t('studio.photos.evenementSansTitre')}\``
      );
      res = res.replace(`event.titre || "Événement sans titre"`, `event.titre || t('studio.photos.evenementSansTitre')`);
      res = res.replace(
        `hasDepot ? "📷 Dépôt ouvert" : "📷 Dépôt inactif"`,
        `hasDepot ? t('studio.photos.depotOuvert') : t('studio.photos.depotInactif')`
      );
      res = res.replace(`📁 Drive synchronisé`, `{t('studio.photos.driveSynchronise')}`);
      res = res.replace(`🪢 Varal relié`, `{t('studio.photos.varalRelie')}`);
      res = res.replace(`Voir sur le Varal`, `{t('studio.photos.voirSurLeVaral')}`);
      res = res.replace(
        `isProvisioning ? "⏳ Synchronisation..." : "⚡ Re-sync Framaspace"`,
        `isProvisioning ? t('studio.photos.synchronisation') : t('studio.photos.reSyncFramaspace')`
      );
      res = res.replace(
        `🗑️ Délier / Réinitialiser Cloud`,
        `{t('studio.photos.delierReinitialiserCloud')}`
      );
      res = res.replace(
        `📸 Boîte à photos / QR Code activé`,
        `{t('studio.photos.boiteAPhotosQrCode')}`
      );
      res = res.replace(
        `🪢 Publié sur le Varal Photos`,
        `{t('studio.photos.publieSurLeVaralPhotos')}`
      );
      res = res.replace(
        `📸 Dossier de dépôt public (Framaspace, Drive...)`,
        `{t('studio.photos.dossierDeDepotPublicFramaspace')}`
      );
      res = res.replaceAll(`<span>📱 QR-Code</span>`, `<span>{t('studio.photos.qrCode')}</span>`);
      res = res.replace(
        `🪢 Album photos finalisé (Sync Varal)`,
        `{t('studio.photos.albumPhotosFinaliseSyncVaral')}`
      );
      res = res.replace(
        `title="Copier l'URL du dépôt pour synchroniser immédiatement l'album Varal"`,
        `title={t('studio.photos.copierLUrlDuDepot')}`
      );
      res = res.replace(
        `<span>🔗 Aligner avec le dépôt</span>`,
        `<span>{t('studio.photos.alignerAvecLeDepot')}</span>`
      );
      return res;
    }
  },

  // 18. StudioEventsManager.jsx
  {
    file: 'src/components/studio/StudioEventsManager.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`{t('secretariat.back') || "Retour"}`, `{t('studio.photos.retour')}`);
      res = res.replace(
        `{t('secretariat.eventsManagementTitle') || "Gestion des événements"}`,
        `{t('studio.photos.gestionDesEvenements')}`
      );
      res = res.replace(
        `{t('secretariat.eventsManagementDesc') || "Tableau de bord d'édition rapide et globale des événements pour l'administration."}`,
        `{t('studio.photos.tableauDeBordDEdition')}`
      );
      res = res.replace(`alt="Perc"`, `alt={t('studio.photos.perc')}`);
      res = res.replace(
        `title="⚡ Planifier une série de répétitions pour la saison"`,
        `title={t('studio.photos.planifierUneSerieDeRepetitions')}`
      );
      res = res.replace(
        `{t('secretariat.btnPlanSeries') || "Planifier une série"}`,
        `{t('studio.photos.planifierUneSerie')}`
      );
      res = res.replace(`{t('secretariat.filterDisplay') || "Afficher :"}`, `{t('studio.photos.afficher')}`);
      res = res.replace(
        `{t('secretariat.filterUpcoming') || "À venir (Défaut)"}`,
        `{t('studio.photos.aVenirDefaut')}`
      );
      res = res.replace(`{t('secretariat.filterPast') || "Passés"}`, `{t('studio.photos.passes')}`);
      res = res.replace(`{t('secretariat.filterAll') || "Tous"}`, `{t('studio.photos.tous')}`);
      res = res.replace(`{t('secretariat.filterType') || "Type :"}`, `{t('studio.photos.type')}`);
      res = res.replace(
        `{t('secretariat.loadingLiveEvents') || "Chargement des événements en direct..."}`,
        `{t('studio.photos.chargementDesEvenementsEnDirect')}`
      );
      return res;
    }
  },

  // 19. EventsDataGrid.jsx
  {
    file: 'src/components/studio/EventsDataGrid.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`title="Cliquer pour trier par Titre"`, `title={t('studio.photos.cliquerPourTrierParTitre')}`);
      res = res.replace(`{t('secretariat.thColTitle') || "1. Titre"}`, `{t('studio.photos.titre')}`);
      res = res.replace(`title="Cliquer pour trier par Type"`, `title={t('studio.photos.cliquerPourTrierParType')}`);
      res = res.replace(`{t('secretariat.thColType') || "2. Type"}`, `{t('studio.photos.typeAlt')}`);
      res = res.replace(`title="Cliquer pour trier par Description"`, `title={t('studio.photos.cliquerPourTrierParDescription')}`);
      res = res.replace(`{t('secretariat.thColDescription') || "3. Description"}`, `{t('studio.photos.description')}`);
      res = res.replace(`title="Cliquer pour trier par Date"`, `title={t('studio.photos.cliquerPourTrierParDate')}`);
      res = res.replace(`{t('secretariat.thColDate') || "4. Date"}`, `{t('studio.photos.date')}`);
      res = res.replace(`title="Cliquer pour trier par Heure début"`, `title={t('studio.photos.cliquerPourTrierParHeure')}`);
      res = res.replace(`{t('secretariat.thColStartTime') || "5. Heure début"}`, `{t('studio.photos.heureDebut')}`);
      res = res.replace(`title="Cliquer pour trier par Heure fin"`, `title={t('studio.photos.cliquerPourTrierParHeureAlt')}`);
      res = res.replace(`{t('secretariat.thColEndTime') || "6. Heure fin"}`, `{t('studio.photos.heureFin')}`);
      res = res.replace(`title="Cliquer pour trier par Lieu simple"`, `title={t('studio.photos.cliquerPourTrierParLieu')}`);
      res = res.replace(`{t('secretariat.thColSimpleLocation') || "7. Lieu simple"}`, `{t('studio.photos.lieuSimple')}`);
      res = res.replace(`title="Cliquer pour trier par Date limite"`, `title={t('studio.photos.cliquerPourTrierParDateAlt')}`);
      res = res.replace(`{t('secretariat.thColDeadline') || "8. Date limite"}`, `{t('studio.photos.dateLimite')}`);
      res = res.replace(`title="Cliquer pour trier par Niveau perc"`, `title={t('studio.photos.cliquerPourTrierParNiveau')}`);
      res = res.replace(`<span>9. Niveau perc</span>`, `<span>{t('studio.photos.niveauPerc')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Niveau danse"`, `title={t('studio.photos.cliquerPourTrierParNiveauAlt')}`);
      res = res.replace(`<span>10. Niveau danse</span>`, `<span>{t('studio.photos.niveauDanse')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Tenue"`, `title={t('studio.photos.cliquerPourTrierParTenue')}`);
      res = res.replace(`<span>11. Tenue</span>`, `<span>{t('studio.photos.tenue')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Inclut perc"`, `title={t('studio.photos.cliquerPourTrierParInclut')}`);
      res = res.replace(`<span>12. Perc 🥁</span>`, `<span>{t('studio.photos.percAlt')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Inclut danse"`, `title={t('studio.photos.cliquerPourTrierParInclutAlt')}`);
      res = res.replace(`<span>13. Danse 💃</span>`, `<span>{t('studio.photos.danse')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Soumis à validation"`, `title={t('studio.photos.cliquerPourTrierParSoumis')}`);
      res = res.replace(`<span>14. Validation 🔒</span>`, `<span>{t('studio.photos.validation')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Inscriptions requises"`, `title={t('studio.photos.cliquerPourTrierParInscriptions')}`);
      res = res.replace(`<span>15. Inscriptions 📝</span>`, `<span>{t('studio.photos.inscriptions')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Covoiturage actif"`, `title={t('studio.photos.cliquerPourTrierParCovoiturage')}`);
      res = res.replace(`<span>16. Covoit 🚗</span>`, `<span>{t('studio.photos.covoit')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Visibilité Publique"`, `title={t('studio.photos.cliquerPourTrierParVisibilite')}`);
      res = res.replace(`<span>17. Public 🌍</span>`, `<span>{t('studio.photos.public')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Nombre de morceaux"`, `title={t('studio.photos.cliquerPourTrierParNombre')}`);
      res = res.replace(`<span>18. Morceaux 🎵</span>`, `<span>{t('studio.photos.morceaux')}</span>`);
      res = res.replace(`title="Cliquer pour trier par Statut Scène"`, `title={t('studio.photos.cliquerPourTrierParStatut')}`);
      res = res.replace(`<span>19. Scène 📐</span>`, `<span>{t('studio.photos.scene')}</span>`);
      res = res.replace(`Aucun événement disponible.`, `{t('studio.photos.aucunEvenementDisponible')}`);
      return res;
    }
  },

  // 20. EventsDataGridRow.jsx
  {
    file: 'src/components/studio/EventsDataGridRow.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(`placeholder="Titre..."`, `placeholder={t('studio.photos.titreAlt')}`);
      res = res.replace(`{t('secretariat.typeGig') || "Prestation"}`, `{t('studio.photos.prestationAlt')}`);
      res = res.replace(`{t('secretariat.typeRehearsal') || "Répétition"}`, `{t('studio.photos.repetition')}`);
      res = res.replace(`{t('secretariat.typeStage') || "Stage"}`, `{t('studio.photos.stage')}`);
      res = res.replace(`{t('secretariat.typeWorkshop') || "Atelier"}`, `{t('studio.photos.atelier')}`);
      res = res.replace(`{t('secretariat.typeMeeting') || "Réunion"}`, `{t('studio.photos.reunion')}`);
      res = res.replace(`{t('secretariat.typeOther') || "Autre"}`, `{t('studio.photos.autre')}`);
      res = res.replace(
        `{t('secretariat.optChooseLocation') || "📍 Choisir un lieu..."}`,
        `{t('studio.photos.choisirUnLieu')}`
      );
      res = res.replace(
        `label={t('secretariat.optGroupHabitualPlaces') || "📍 Lieux habituels de l'association"}`,
        `label={t('studio.photos.lieuxHabituelsDeLAssociation')}`
      );
      res = res.replace(`placeholder="Lieu..."`, `placeholder={t('studio.photos.lieu')}`);
      res = res.replace(`<span>👥 Tous</span>`, `<span>{t('studio.photos.tousAlt')}</span>`);
      res = res.replaceAll(`<span>Aucun</span>`, `<span>{t('studio.photos.aucun')}</span>`);
      res = res.replace(`placeholder="Tenue..."`, `placeholder={t('studio.photos.tenueAlt')}`);
      res = res.replace(`title="Percussion"`, `title={t('studio.photos.percussion')}`);
      res = res.replace(`<span>📐 Oui</span>`, `<span>{t('studio.photos.oui')}</span>`);
      return res;
    }
  },

  // 21. ActivityReports.jsx
  {
    file: 'src/components/studio/ActivityReports.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `alert("Veuillez sélectionner une date de début et de fin.");`,
        `alert(t('studio.photos.veuillezSelectionnerUneDateDe'));`
      );
      res = res.replace(
        `alert("Erreur lors de la génération de l'export d'activité.");`,
        `alert(t('studio.photos.erreurLorsDeLaGeneration'));`
      );
      res = res.replace(`{t('common.back') || "Retour"}`, `{t('studio.photos.retour')}`);
      res = res.replace(`Journal d'Activité (CSV)`, `{t('studio.photos.journalDActiviteCsv')}`);
      res = res.replace(
        `📊 Ce module permet d'extraire le journal des événements et les registres de présence de l'association sur une période choisie. Les exports sont générés sous forme de fichiers tableurs CSV compatibles avec Microsoft Excel, LibreOffice et Google Sheets.`,
        `{t('studio.photos.ceModulePermetDExtraire')}`
      );
      res = res.replace(`📅 Choix de la Période`, `{t('studio.photos.choixDeLaPeriode')}`);
      res = res.replace(
        `Sélectionnez la plage de dates à auditer. Par défaut, la saison associative en cours est présélectionnée.`,
        `{t('studio.photos.selectionnezLaPlageDeDates')}`
      );
      res = res.replace(`Date de début`, `{t('studio.photos.dateDeDebut')}`);
      res = res.replace(`Date de fin`, `{t('studio.photos.dateDeFin')}`);
      res = res.replace(`Saison associative active :`, `{t('studio.photos.saisonAssociativeActive')}`);
      res = res.replace(`isCurrent ? "En cours" : "Passée"`, `isCurrent ? t('studio.photos.enCours') : "Passée"`);
      res = res.replace(`🎭 Exporter le Bilan d'Activité`, `{t('studio.photos.exporterLeBilanDActivite')}`);
      res = res.replace(
        `Génère le registre des événements avec le décompte des présences. Idéal pour votre bilan annuel ou assemblée générale.`,
        `{t('studio.photos.genereLeRegistreDesEvenements')}`
      );
      res = res.replace(`Types d'événements à inclure :`, `{t('studio.photos.typesDEvenementsAInclure')}`);
      res = res.replace(`val === 'prestation' ? 'Prestations' : 'Tous types'`, `val === 'prestation' ? t('studio.photos.prestations') : 'Tous types'`);
      res = res.replace(
        `exporting ? 'Génération...' : '📄 Exporter l\\'Activité (CSV)'`,
        `exporting ? t('studio.photos.generation') : t('studio.photos.exporterLActiviteCsv')`
      );
      return res;
    }
  },

  // 22. StudioCloudHeader.jsx
  {
    file: 'src/components/studio/StudioCloudHeader.jsx',
    importPath: '../LanguageContext',
    transform(content) {
      let res = content;
      res = res.replace(
        `setError("Impossible d'enregistrer l'URL du Cloud.");`,
        `setError(t('studio.photos.impossibleDEnregistrerLUrl'));`
      );
      res = res.replace(
        `{t('studioCloud.title') || "Passerelle Stockage Cloud de l'Association"}`,
        `{t('studio.photos.passerelleStockageCloudDeL')}`
      );
      res = res.replace(`Hébergement actif :`, `{t('studio.photos.hebergementActif')}`);
      res = res.replace(
        `Aucun dossier Cloud racine configuré`,
        `{t('studio.photos.aucunDossierCloudRacineConfigure')}`
      );
      res = res.replace(
        `title="Ouvrir le dossier Cloud racine dans un nouvel onglet sécurisé"`,
        `title={t('studio.photos.ouvrirLeDossierCloudRacine')}`
      );
      res = res.replace(
        `{t('studioCloud.btnOpen') || "Ouvrir notre Cloud ↗"}`,
        `{t('studio.photos.ouvrirNotreCloud')}`
      );
      res = res.replace(
        `title="Configurer les identifiants API Framaspace pour l'automatisation des dossiers"`,
        `title={t('studio.photos.configurerLesIdentifiantsApiFramaspace')}`
      );
      res = res.replace(
        `showApiConfig ? "Masquer API Framaspace" : "Automatisation Framaspace"`,
        `showApiConfig ? t('studio.photos.masquerApiFramaspace') : t('studio.photos.automatisationFramaspace')`
      );
      res = res.replace(
        `🔗 URL d'accès racine au Cloud (Framaspace, Nextcloud, Google Drive, Dropbox)`,
        `{t('studio.photos.urlDAccesRacineAu')}`
      );
      res = res.replace(
        `placeholder="ex: https://mon-asso.framaspace.org/s/... ou https://drive.google.com/drive/folders/..."`,
        `placeholder={t('studio.photos.exHttpsMonAssoFramaspace')}`
      );
      res = res.replace(`⏳ Enregistrement...`, `{t('studio.photos.enregistrement')}`);
      res = res.replace(`✓ Enregistré !`, `{t('studio.photos.enregistre')}`);
      res = res.replace(`>Enregistrer</span>`, `>{t('studio.photos.enregistrer')}</span>`);
      res = res.replace(`>Annuler</button>`, `>{t('studio.photos.annuler')}</button>`);
      res = res.replace(
        `💡 Ce lien racine permet aux membres du pôle Studio d'accéder d'un clic à l'arborescence générale de stockage sans transiter par des serveurs tiers.`,
        `{t('studio.photos.ceLienRacinePermetAux')}`
      );
      return res;
    }
  }
];

// Exécution séquentielle avec validation Babel pour chaque fichier
console.log('--- Démarrage de l’application des traductions Studio Lot 1 ---');
let successCount = 0;
let failCount = 0;

for (const tf of fileTransforms) {
  const filePath = path.resolve(rootDir, tf.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier introuvable : ${tf.file}`);
    failCount++;
    continue;
  }

  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let updatedContent = ensureUseTranslation(originalContent, tf.importPath);
    updatedContent = tf.transform(updatedContent);

    // Validation syntaxique stricte avec Babel
    babelParser.parse(updatedContent, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ ${tf.file} raccordé et validé.`);
    successCount++;
  } catch (err) {
    console.error(`❌ Erreur sur ${tf.file} :`, err.message);
    failCount++;
  }
}

console.log(`\n--- Bilan : ${successCount} fichiers validés, ${failCount} erreurs ---`);
if (failCount > 0) {
  process.exit(1);
}
