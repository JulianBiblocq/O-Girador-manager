import fs from 'fs';
import * as babelParser from '@babel/parser';

const frPath = 'src/locales/fr.js';
const ptPath = 'src/locales/pt.js';

let frContent = fs.readFileSync(frPath, 'utf8');
let ptContent = fs.readFileSync(ptPath, 'utf8');

const frNewKeys = `      passee: "Passée",
      tousTypes: "Tous types",
      repetitions: "Répétitions",
      stages: "Stages",
      ateliers: "Ateliers",
      reunions: "Réunions",
      sortie: "📅 Sortie",
      repetitionTitre: "🥁 Répétition",
`;

const ptNewKeys = `      passee: "Passada",
      tousTypes: "Todos os tipos",
      repetitions: "Ensaios",
      stages: "Oficinas intensivas",
      ateliers: "Oficinas",
      reunions: "Reuniões",
      sortie: "📅 Apresentação externa",
      repetitionTitre: "🥁 Ensaio",
`;

if (!frContent.includes('passee:')) {
  frContent = frContent.replace(
    'utiliseUnEncodageExConteneur:',
    frNewKeys + '      utiliseUnEncodageExConteneur:'
  );
}

if (!ptContent.includes('passee:')) {
  ptContent = ptContent.replace(
    'utiliseUnEncodageExConteneur:',
    ptNewKeys + '      utiliseUnEncodageExConteneur:'
  );
}

// Validation syntaxique
babelParser.parse(frContent, { sourceType: 'module' });
babelParser.parse(ptContent, { sourceType: 'module' });

fs.writeFileSync(frPath, frContent, 'utf8');
fs.writeFileSync(ptPath, ptContent, 'utf8');

console.log('✅ Clés complémentaires injectées dans fr.js et pt.js avec succès.');
