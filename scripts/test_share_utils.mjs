import assert from 'assert';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { 
  getAssociationInitials, 
  getGroupInvitationDetails, 
  generateCombinedSealCanvas 
} from '../src/utils/shareUtils.js';

console.log('🧪 Début des tests pour shareUtils.js...');

// 1. Test des initiales
assert.equal(getAssociationInitials("Samb'à Bulles"), 'SB', 'Initiales pour Samb\'à Bulles');
assert.equal(getAssociationInitials('Samambaia'), 'SA', 'Initiales pour Samambaia');
assert.equal(getAssociationInitials('Maracatu O Girador'), 'MG', 'Initiales pour Maracatu O Girador');
assert.equal(getAssociationInitials(''), 'OG', 'Initiales par défaut');
console.log('✅ Test 1 validé : Calcul des initiales conforme.');

// 2. Test des détails d\'invitation
const mockAssocSambabulles = {
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

const details = getGroupInvitationDetails(mockAssocSambabulles, 'sambabulles');
assert.equal(details.canonicalId, 'sambabulles', 'Identifiant canonique');
assert.ok(details.invitationUrl.includes('groupe=sambabulles'), 'URL d\'invitation avec ?groupe=sambabulles');
assert.ok(details.invitationUrl.includes('mode=signup'), 'URL d\'invitation avec mode=signup');
assert.ok(details.shareText.includes("Samb'à Bulles"), 'Texte d\'invitation contenant le nom de l\'association');
console.log('✅ Test 2 validé : Paramètres et texte d\'invitation corrects.');

// 3. Test de génération du Canvas Sceau Combiné en Node
const canvasFactory = (w, h) => createCanvas(w, h);
const result = await generateCombinedSealCanvas(mockAssocSambabulles, {
  size: 512,
  canvasFactory
});

assert.ok(result.canvas, 'Canvas présent');
const buf = result.canvas.toBuffer('image/png');
assert.ok(buf.length > 5000, 'Image PNG générée de taille adéquate');

const testOutputPath = path.resolve('public/brandings/test-sambabulles-seal.png');
fs.mkdirSync(path.dirname(testOutputPath), { recursive: true });
fs.writeFileSync(testOutputPath, buf);
console.log(`✅ Test 3 validé : Sceau combiné généré avec succès (${buf.length} octets) -> ${testOutputPath}`);

console.log('🎉 Tous les tests unitaires de shareUtils ont réussi !');
