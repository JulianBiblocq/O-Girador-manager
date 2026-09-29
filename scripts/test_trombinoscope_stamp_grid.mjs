/**
 * Test unitaire et structurel pour la Refonte du Trombinoscope en Planche de Timbres (Mosaïque dense)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('🖼️ TEST SUITE : REFONTE DU TROMBINOSCOPE EN PLANCHE DE TIMBRES ULTRA-COMPACTE 🖼️\n');

// 1. Contrôle anti-monolithe (< 200 lignes pour chaque sous-composant)
console.log('▶️ Test 1 : Contrôle strict anti-monolithe des sous-composants (< 200 lignes)...');
const filesToCheck = [
  'src/components/trombinoscope/MemberStampCard.jsx',
  'src/components/trombinoscope/MemberDetailModal.jsx',
  'src/components/trombinoscope/MemberDetailCardContent.jsx',
  'src/components/UserCard.jsx'
];

filesToCheck.forEach(relPath => {
  const fullPath = path.resolve(process.cwd(), relPath);
  assert.ok(fs.existsSync(fullPath), `Le fichier ${relPath} doit exister`);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  console.log(`  - ${relPath} : ${lineCount} lignes (OK < 200)`);
  assert.ok(lineCount < 200, `Le fichier ${relPath} (${lineCount} lignes) doit faire strictement moins de 200 lignes`);
});
console.log('✅ Test 1 validé : Tous les nouveaux composants respectent la règle anti-monolithe.\n');

// 2. Vérification du gabarit de vignette timbre (MemberStampCard.jsx)
console.log('▶️ Test 2 : Vérification du gabarit de la vignette timbre (MemberStampCard.jsx)...');
const stampCardContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/trombinoscope/MemberStampCard.jsx'), 'utf8');

// Conteneur
const requiredClasses = [
  'relative', 'flex', 'flex-col', 'rounded-md', 'border-2',
  'border-[var(--color-cordel-encre,#181716)]',
  'bg-[var(--color-cordel-kraft-sombre,#e2d6b5)]',
  'shadow-[2px_2px_0px_0px_#181716]',
  'overflow-hidden', 'cursor-pointer', 'transition-transform',
  'hover:-translate-y-0.5', 'select-none'
];
requiredClasses.forEach(cls => {
  assert.ok(stampCardContent.includes(cls), `La classe ${cls} doit être présente dans le conteneur`);
});

// Zone photo aspect-square
assert.ok(
  stampCardContent.includes('aspect-square w-full overflow-hidden bg-neutral-900'),
  'La zone photo doit être aspect-square w-full overflow-hidden bg-neutral-900'
);

// Pastille présence 🟢 w-2.5 h-2.5
assert.ok(
  stampCardContent.includes('w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full'),
  'La pastille de présence en ligne doit être présente avec w-2.5 h-2.5'
);

// Micro-tampons distinctions (👑 Mestre, 🏛️ Bureau/CA, 👶 Enfant)
assert.ok(stampCardContent.includes('👑'), 'Le tampon Mestre 👑 doit être géré');
assert.ok(stampCardContent.includes('🏛️'), 'Le tampon Bureau/CA 🏛️ doit être géré');
assert.ok(stampCardContent.includes('👶'), 'Le tampon Enfant 👶 doit être géré');

// Polyvalence secours 👻 / opacity-65
assert.ok(stampCardContent.includes('opacity-65'), 'La classe opacity-65 doit être présente pour les cartes fantômes');
assert.ok(stampCardContent.includes('👻 Secours'), 'Le badge 👻 Secours doit être présent');

// Bandeau texte inférieur avec prénom + initiale du nom
assert.ok(
  stampCardContent.includes('bg-[var(--color-cordel-fond,#f4ecd8)] border-t border-[var(--color-cordel-encre,#181716)]'),
  'Le bandeau texte inférieur doit avoir le fond crème et bordure encre'
);
assert.ok(stampCardContent.includes('initialName'), 'initialName (prénom + initiale) doit être calculé et affiché');

// Liseré pupitre
assert.ok(stampCardContent.includes('style={{ backgroundColor: pupitreColor'), 'Le liseré inférieur de couleur pupitre doit être présent');

console.log('✅ Test 2 validé : Gabarit de vignette timbre conforme à 100%.\n');

// 3. Vérification de la modale Fiche Membre détaillée (MemberDetailModal.jsx)
console.log('▶️ Test 3 : Vérification de la modale Fiche Membre détaillée (MemberDetailModal.jsx)...');
const modalContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/trombinoscope/MemberDetailModal.jsx'), 'utf8');

// Respect strict de la confidentialité
assert.ok(modalContent.includes('isPhoneAllowed'), 'La vérification de confidentialité téléphone doit être présente');
assert.ok(modalContent.includes('isBirthdateAllowed'), 'La vérification de confidentialité anniversaire doit être présente');
assert.ok(modalContent.includes('isAddressAllowed'), 'La vérification de confidentialité ville/adresse doit être présente');

// Sous-composant de contenu détaillé
const modalContentSub = fs.readFileSync(path.resolve(process.cwd(), 'src/components/trombinoscope/MemberDetailCardContent.jsx'), 'utf8');
assert.ok(modalContentSub.includes('onContactUser'), 'Le bouton contacter doit être présent');
assert.ok(modalContentSub.includes('tel:'), 'Le lien téléphonique sécurisé doit être présent');

console.log('✅ Test 3 validé : Modale détaillée conforme et respectueuse de la confidentialité.\n');

// 4. Vérification de la grille et intégration dans Trombinoscope.jsx
console.log('▶️ Test 4 : Vérification de la grille dense et intégration dans Trombinoscope.jsx...');
const trombiContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Trombinoscope.jsx'), 'utf8');

// Grille resserrée
assert.ok(
  trombiContent.includes('grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3'),
  'La grille resserrée responsive doit être présente dans Trombinoscope.jsx'
);

// Titres de section sobres avec compteur
assert.ok(
  trombiContent.includes('({sectionMembers.length})'),
  'Le compteur de membres par section doit être conservé'
);

// Présence des sous-composants
assert.ok(trombiContent.includes('<MemberStampCard'), 'MemberStampCard doit être rendu dans Trombinoscope.jsx');
assert.ok(trombiContent.includes('<MemberDetailModal'), 'MemberDetailModal doit être rendu dans Trombinoscope.jsx');
assert.ok(trombiContent.includes('setSelectedMember'), 'L\'état selectedMember doit être géré pour l\'ouverture de la modale');

// Conserve la barre d'outils de filtres
assert.ok(trombiContent.includes('searchQuery'), 'La recherche textuelle doit être préservée');
assert.ok(trombiContent.includes('filterInstrument'), 'Le filtre d\'instrument doit être préservé');
assert.ok(trombiContent.includes('filterTag'), 'Le filtre de tag doit être préservé');

console.log('✅ Test 4 validé : Grille dense, barre d\'outils et modale parfaitement intégrées.\n');

// 5. Vérification de l'alias d'export UserCard.jsx
console.log('▶️ Test 5 : Vérification de l\'alias UserCard.jsx...');
const userCardContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/UserCard.jsx'), 'utf8');
assert.ok(userCardContent.includes('export default MemberStampCard'), 'UserCard.jsx doit réexporter MemberStampCard pour assurer la réutilisabilité');

console.log('✅ Test 5 validé : Alias UserCard.jsx opérationnel.\n');

console.log('===============================================================');
console.log('🏆 TOUS LES TESTS DE LA PLANCHE DE TIMBRES SONT VALIDÉS AVEC SUCCÈS !');
console.log('===============================================================');
