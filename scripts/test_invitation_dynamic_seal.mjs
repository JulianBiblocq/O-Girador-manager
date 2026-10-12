import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from 'canvas';
import { 
  getAssociationInitials, 
  getGroupInvitationDetails, 
  generateCombinedSealCanvas 
} from '../src/utils/shareUtils.js';

console.log('🧪 DÉBUT DU CONTRÔLE D\'INTÉGRITÉ DU SCEAU COMBINÉ & INVITATION DYNAMIQUE...\n');

// =========================================================================
// 1. Contrôle du fallback statique (index.html & assets publics)
// =========================================================================
console.log('▶️ 1. Vérification du fallback statique dans index.html et public/...');
const indexHtmlPath = path.resolve('index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

assert.ok(
  !indexHtmlContent.includes('og-image.png'),
  'index.html ne doit plus référencer og-image.png (qui contenait la fougère Samambaia brute)'
);
assert.ok(
  indexHtmlContent.includes('og-girador-frame.png'),
  'index.html doit pointer vers le sceau neutre officiel og-girador-frame.png'
);
assert.ok(
  indexHtmlContent.includes('content="O Girador"'),
  'index.html doit définir og:image:alt="O Girador"'
);

const neutralSealPath = path.resolve('public/og-girador-frame.png');
assert.ok(fs.existsSync(neutralSealPath), 'public/og-girador-frame.png doit exister physiquement');
const sealStats = fs.statSync(neutralSealPath);
assert.ok(sealStats.size > 20000, `public/og-girador-frame.png doit être un PNG haute résolution (> 20Ko, actuel: ${sealStats.size})`);
console.log('  ✅ Fallback statique index.html et asset neutre og-girador-frame.png conformes.');

// =========================================================================
// 2. Contrôle de la dynamisation pour Samb'à Bulles
// =========================================================================
console.log('\n▶️ 2. Vérification de la génération du sceau combiné pour Samb\'à Bulles...');
const mockSambabulles = {
  id: 'sambabulles',
  groupId: 'sambabulles',
  nom: "Samb'à Bulles",
  branding: {
    colors: {
      primary: '#8B2A1A',
      secondary: '#c05621',
      background: '#f4ecd8',
      text: '#181716'
    }
  }
};

// Initiales
const initials = getAssociationInitials(mockSambabulles.nom);
assert.equal(initials, 'SB', 'Les initiales pour Samb\'à Bulles doivent être SB');

// Détails de l'invitation
const details = getGroupInvitationDetails(mockSambabulles, 'sambabulles');
assert.equal(details.canonicalId, 'sambabulles');
assert.ok(details.invitationUrl.includes('groupe=sambabulles'));
assert.ok(details.invitationUrl.includes('mode=signup'));
assert.ok(details.shareText.includes("Samb'à Bulles"));
assert.ok(details.shareTitle.includes("Samb'à Bulles"));

// Génération du macaron combiné 512x512
const canvasFactory = (w, h) => createCanvas(w, h);
const sealResult = await generateCombinedSealCanvas(mockSambabulles, {
  size: 512,
  canvasFactory
});
assert.ok(sealResult.canvas, 'Canvas 512x512 généré');
assert.ok(sealResult.canvas.width === 512 && sealResult.canvas.height === 512, 'Dimensions 512x512 respectées');
const sealBuf = sealResult.canvas.toBuffer('image/png');
assert.ok(sealBuf.length > 30000, 'Image PNG du sceau combiné générée (> 30Ko)');
console.log(`  ✅ Macaron fusionné Samb'à Bulles généré avec succès (${sealBuf.length} octets)`);

// =========================================================================
// 3. Contrôle des composants (InvitationModal & SubscriptionInvitationHeader)
// =========================================================================
console.log('\n▶️ 3. Vérification des composants InvitationModal et SubscriptionInvitationHeader...');
const modalPath = path.resolve('src/components/InvitationModal.jsx');
assert.ok(fs.existsSync(modalPath), 'src/components/InvitationModal.jsx doit exister');
const modalContent = fs.readFileSync(modalPath, 'utf-8');
assert.ok(modalContent.includes('QRCodeSVG'), 'InvitationModal doit inclure QRCodeSVG pour le scan direct');
assert.ok(modalContent.includes('generateCombinedSealCanvas'), 'InvitationModal doit générer le macaron combiné');
assert.ok(modalContent.includes('shareGroupInvitation'), 'InvitationModal doit supporter le partage');

const headerPath = path.resolve('src/components/association-settings/identity/SubscriptionInvitationHeader.jsx');
const headerContent = fs.readFileSync(headerPath, 'utf-8');
assert.ok(headerContent.includes('InvitationModal'), 'SubscriptionInvitationHeader doit intégrer InvitationModal');
assert.ok(headerContent.includes('HeaderSealLogo'), 'SubscriptionInvitationHeader doit afficher la vignette du sceau');
assert.ok(headerContent.includes('setIsInviteModalOpen'), 'SubscriptionInvitationHeader doit piloter l\'ouverture de la modale');
console.log('  ✅ Composants InvitationModal et SubscriptionInvitationHeader conformes et connectés.');

// =========================================================================
// 4. Contrôle de la persistance Branding (Storage, combinedLogoUrl, SEO)
// =========================================================================
console.log('\n▶️ 4. Vérification de la persistance Branding et injection Open Graph...');
const settingsHookPath = path.resolve('src/hooks/useAssociationSettings.js');
const settingsHookContent = fs.readFileSync(settingsHookPath, 'utf-8');
assert.ok(settingsHookContent.includes('generateCombinedSealBlob'), 'useAssociationSettings doit importer generateCombinedSealBlob');
assert.ok(settingsHookContent.includes('brandings/${groupId}/combined-logo.png'), 'useAssociationSettings doit stocker sur brandings/${groupId}/combined-logo.png');
assert.ok(settingsHookContent.includes('combinedLogoUrl'), 'useAssociationSettings doit persister combinedLogoUrl dans branding');

const shareUtilsPath = path.resolve('src/utils/shareUtils.js');
const shareUtilsContent = fs.readFileSync(shareUtilsPath, 'utf-8');
assert.ok(shareUtilsContent.includes('uploadCombinedSealToStorage'), 'shareUtils.js doit exporter uploadCombinedSealToStorage');
assert.ok(shareUtilsContent.includes('brandings/${groupId}/combined-logo.png'), 'shareUtils.js doit cibler brandings/${groupId}/combined-logo.png');

const functionsPath = path.resolve('functions/index.js');
const functionsContent = fs.readFileSync(functionsPath, 'utf-8');
assert.ok(functionsContent.includes('isSocialBotOrCrawler'), 'functions/index.js doit implémenter isSocialBotOrCrawler');
assert.ok(functionsContent.includes('whatsapp'), 'functions/index.js doit détecter WhatsApp');
assert.ok(functionsContent.includes('facebookexternalhit'), 'functions/index.js doit détecter facebookexternalhit');
assert.ok(functionsContent.includes('twitterbot'), 'functions/index.js doit détecter twitterbot');
assert.ok(functionsContent.includes('Rejoindre ${assoName} sur O Girador'), 'functions/index.js doit formater le titre d\'invitation dynamique');
assert.ok(functionsContent.includes('Espace adhérents : agenda, répétitions, vestiaire et vie du groupe.'), 'functions/index.js doit inclure l\'accroche d\'invitation');
assert.ok(functionsContent.includes('branding?.combinedLogoUrl'), 'functions/index.js doit prioriser combinedLogoUrl pour le SEO');
assert.ok(functionsContent.includes('window.location.replace'), 'functions/index.js doit inclure la redirection JavaScript');

const seoHeadPath = path.resolve('src/components/public/PublicSeoHead.jsx');
const seoHeadContent = fs.readFileSync(seoHeadPath, 'utf-8');
assert.ok(seoHeadContent.includes('combinedLogoUrl'), 'PublicSeoHead doit supporter combinedLogoUrl');
assert.ok(seoHeadContent.includes('og-girador-frame.png'), 'PublicSeoHead doit utiliser og-girador-frame.png comme fallback');

console.log('  ✅ Persistance Branding (combinedLogoUrl) et gestionnaire SEO Open Graph validés.');

console.log('\n=========================================================================');
console.log('🏆 TOUTES LES VALIDATIONS DU SCEAU COMBINÉ DYNAMIQUE ONT RÉUSSI (100% SUCCÈS) !');
console.log('=========================================================================');
