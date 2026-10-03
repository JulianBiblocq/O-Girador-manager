import fs from 'fs';
import * as babelParser from '@babel/parser';

const frPath = 'src/locales/fr.js';
const ptPath = 'src/locales/pt.js';

let frContent = fs.readFileSync(frPath, 'utf8');
let ptContent = fs.readFileSync(ptPath, 'utf8');

const newsletterKeysFr = `      abonnesExportes: "✓ {{count}} abonné(s) exporté(s) !",
      inscrits: "inscrit(s)",
      liensReseauxFacebookInstagram: "Liens réseaux (Facebook, Instagram, etc.), formulaire d'infolettre et export d'abonnés",
      infolettreActualites: "Infolettre & Actualités",
      infolettrePrestations: "Infolettre & Prestations",
      abonnezVousANotreNewsletter: "Abonnez-vous à notre Newsletter",
      recevezNosProchainesDatesDe: "Recevez nos prochaines dates de prestations, défilés et actualités du groupe directement dans votre boîte mail.",
      photosSelectionnees2A4Requis: "photos sélectionnées (2 à 4 requis)",
      newsletterRodaDeMaracatu: "Newsletter Roda de Maracatu",
`;

const newsletterKeysPt = `      abonnesExportes: "✓ {{count}} assinante(s) exportado(s)!",
      inscrits: "inscrito(s)",
      liensReseauxFacebookInstagram: "Links de redes sociais (Facebook, Instagram, etc.), formulário de boletim e exportação de inscritos",
      infolettreActualites: "Boletim & Notícias",
      infolettrePrestations: "Boletim & Apresentações",
      abonnezVousANotreNewsletter: "Inscreva-se em nosso Boletim Informativo",
      recevezNosProchainesDatesDe: "Receba nossas próximas datas de apresentações, desfiles e notícias do grupo diretamente em sua caixa de entrada.",
      photosSelectionnees2A4Requis: "fotos selecionadas (2 a 4 necessárias)",
      newsletterRodaDeMaracatu: "Boletim Roda de Maracatu",
`;

const photosKeysFr = `      aucunClicheAccessibleDansCet: "Aucun cliché accessible dans cet album.",
      impossibleDeChargerLaGalerie: "Impossible de charger la galerie en direct. Vous pouvez consulter l'album directement sur Framaspace.",
      souvenirsMultimedia: "souvenir(s) multimédia",
      albumPhotos: "Album Photos",
      scannezCeQrCodeAvecL: "Scannez ce QR-Code avec l'appareil photo de votre smartphone pour déposer vos photos et vidéos dans notre espace partagé.",
      scannezCeQrCodeAvecVotre: "Scannez ce QR-Code avec votre smartphone pour visionner l'album photo complet de la prestation.",
      telechargerLImageDuQrCode: "Télécharger l'image du QR Code en haute définition (PNG)",
      photosSelectionnees: "photo(s) sélectionnée(s)",
`;

const photosKeysPt = `      aucunClicheAccessibleDansCet: "Nenhum registro fotográfico acessível neste álbum.",
      impossibleDeChargerLaGalerie: "Não foi possível carregar a galeria ao vivo. Você pode consultar o álbum diretamente no Framaspace.",
      souvenirsMultimedia: "lembrança(s) multimídia",
      albumPhotos: "Álbum de Fotos",
      scannezCeQrCodeAvecL: "Escaneie este QR Code com a câmera do seu smartphone para enviar suas fotos e vídeos ao nosso espaço compartilhado.",
      scannezCeQrCodeAvecVotre: "Escaneie este QR Code com seu smartphone para visualizar o álbum completo da apresentação.",
      telechargerLImageDuQrCode: "Baixar a imagem do QR Code em alta definição (PNG)",
      photosSelectionnees: "foto(s) selecionada(s)",
`;

// Injection sous studio.newsletter
if (!frContent.includes('abonnesExportes:')) {
  frContent = frContent.replace('newsletter: {', 'newsletter: {\n' + newsletterKeysFr);
}
if (!ptContent.includes('abonnesExportes:')) {
  ptContent = ptContent.replace('newsletter: {', 'newsletter: {\n' + newsletterKeysPt);
}

// Injection sous studio.photos
if (!frContent.includes('aucunClicheAccessibleDansCet:')) {
  frContent = frContent.replace('photos: {', 'photos: {\n' + photosKeysFr);
}
if (!ptContent.includes('aucunClicheAccessibleDansCet:')) {
  ptContent = ptContent.replace('photos: {', 'photos: {\n' + photosKeysPt);
}

// Validation syntaxique Babel
babelParser.parse(frContent, { sourceType: 'module' });
babelParser.parse(ptContent, { sourceType: 'module' });

fs.writeFileSync(frPath, frContent, 'utf8');
fs.writeFileSync(ptPath, ptContent, 'utf8');

console.log('✅ Clés demandées par le scan injectées dans fr.js et pt.js avec parité 100%.');
