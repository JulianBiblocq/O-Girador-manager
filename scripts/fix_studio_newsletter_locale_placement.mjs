import fs from 'fs';
import * as babelParser from '@babel/parser';

const frPath = 'src/locales/fr.js';
const ptPath = 'src/locales/pt.js';

let frContent = fs.readFileSync(frPath, 'utf8');
let ptContent = fs.readFileSync(ptPath, 'utf8');

const keysToRemove = [
  'abonnesExportes: "✓ {{count}} abonné(s) exporté(s) !",',
  'inscrits: "inscrit(s)",',
  'liensReseauxFacebookInstagram: "Liens réseaux (Facebook, Instagram, etc.), formulaire d\'infolettre et export d\'abonnés",',
  'infolettreActualites: "Infolettre & Actualités",',
  'infolettrePrestations: "Infolettre & Prestations",',
  'abonnezVousANotreNewsletter: "Abonnez-vous à notre Newsletter",',
  'recevezNosProchainesDatesDe: "Recevez nos prochaines dates de prestations, défilés et actualités du groupe directement dans votre boîte mail.",',
  'photosSelectionnees2A4Requis: "photos sélectionnées (2 à 4 requis)",',
  'newsletterRodaDeMaracatu: "Newsletter Roda de Maracatu",'
];

const ptKeysToRemove = [
  'abonnesExportes: "✓ {{count}} assinante(s) exportado(s)!",',
  'inscrits: "inscrito(s)",',
  'liensReseauxFacebookInstagram: "Links de redes sociais (Facebook, Instagram, etc.), formulário de boletim e exportação de inscritos",',
  'infolettreActualites: "Boletim & Notícias",',
  'infolettrePrestations: "Boletim & Apresentações",',
  'abonnezVousANotreNewsletter: "Inscreva-se em nosso Boletim Informativo",',
  'recevezNosProchainesDatesDe: "Receba nossas próximas datas de apresentações, desfiles e notícias do grupo diretamente em sua caixa de entrada.",',
  'photosSelectionnees2A4Requis: "fotos selecionadas (2 a 4 necessárias)",',
  'newsletterRodaDeMaracatu: "Boletim Roda de Maracatu",'
];

// Nettoyer l'ancienne mauvaise insertion
for (const k of keysToRemove) {
  frContent = frContent.replace(k + '\n', '').replace(k + '\r\n', '');
}
for (const k of ptKeysToRemove) {
  ptContent = ptContent.replace(k + '\n', '').replace(k + '\r\n', '');
}

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

// Injecter sous studio: { newsletter: {
frContent = frContent.replace('studio: {\n    newsletter: {', 'studio: {\n    newsletter: {\n' + newsletterKeysFr);
frContent = frContent.replace('studio: {\r\n    newsletter: {', 'studio: {\r\n    newsletter: {\r\n' + newsletterKeysFr);

ptContent = ptContent.replace('studio: {\n    newsletter: {', 'studio: {\n    newsletter: {\n' + newsletterKeysPt);
ptContent = ptContent.replace('studio: {\r\n    newsletter: {', 'studio: {\r\n    newsletter: {\r\n' + newsletterKeysPt);

// Validation
babelParser.parse(frContent, { sourceType: 'module' });
babelParser.parse(ptContent, { sourceType: 'module' });

fs.writeFileSync(frPath, frContent, 'utf8');
fs.writeFileSync(ptPath, ptContent, 'utf8');

console.log('✅ Correction de l’emplacement studio.newsletter effectuée avec succès.');
