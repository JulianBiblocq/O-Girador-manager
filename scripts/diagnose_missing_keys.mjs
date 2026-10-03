import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/studio_lot1_items_assigned.json', 'utf8'));

const missing = [
  { file: 'src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx', key: 'studio.newsletter.abonnesExportes' },
  { file: 'src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx', key: 'studio.newsletter.inscrits' },
  { file: 'src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx', key: 'studio.newsletter.liensReseauxFacebookInstagram' },
  { file: 'src/components/public/PublicNewsletterForm.jsx', key: 'studio.newsletter.infolettreActualites' },
  { file: 'src/components/public/PublicNewsletterForm.jsx', key: 'studio.newsletter.infolettrePrestations' },
  { file: 'src/components/public/PublicNewsletterForm.jsx', key: 'studio.newsletter.abonnezVousANotreNewsletter' },
  { file: 'src/components/public/PublicNewsletterForm.jsx', key: 'studio.newsletter.recevezNosProchainesDatesDe' },
  { file: 'src/components/studio/FramaspaceGalleryViewer.jsx', key: 'studio.photos.aucunClicheAccessibleDansCet' },
  { file: 'src/components/studio/FramaspaceGalleryViewer.jsx', key: 'studio.photos.impossibleDeChargerLaGalerie' },
  { file: 'src/components/studio/FramaspaceGalleryViewer.jsx', key: 'studio.photos.souvenirsMultimedia' },
  { file: 'src/components/studio/FramaspaceGalleryViewer.jsx', key: 'studio.photos.albumPhotos' },
  { file: 'src/components/studio/newsletter/Step3RetourImages.jsx', key: 'studio.newsletter.photosSelectionnees2A4Requis' },
  { file: 'src/components/studio/StudioPhotoQrPrintModal.jsx', key: 'studio.photos.scannezCeQrCodeAvecL' },
  { file: 'src/components/studio/StudioPhotoQrPrintModal.jsx', key: 'studio.photos.scannezCeQrCodeAvecVotre' },
  { file: 'src/components/studio/StudioPhotoQrPrintModal.jsx', key: 'studio.photos.telechargerLImageDuQrCode' },
  { file: 'src/components/studio/StudioVaralPickerModal.jsx', key: 'studio.photos.photosSelectionnees' },
  { file: 'src/hooks/useNewsletterData.js', key: 'studio.newsletter.newsletterRodaDeMaracatu' }
];

console.log('=== ANALYSE DES CLÉS ASSIGNÉES DANS LES FICHIERS CONCERNÉS ===');
const seenFiles = new Set();
for (const m of missing) {
  if (seenFiles.has(m.file)) continue;
  seenFiles.add(m.file);
  const cat = m.key.startsWith('studio.newsletter') ? 'newsletter' : 'photos';
  const fileItems = data[cat][m.file] || [];
  console.log(`\n--- ${m.file} ---`);
  fileItems.forEach(it => {
    console.log(`  L${it.line}: ${it.assignedKey} -> "${it.text.replace(/\r?\n/g, ' ')}"`);
  });
}
