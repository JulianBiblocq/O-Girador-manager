import fs from 'fs';
import { vitrineAdminFr, vitrineAdminPt } from './data_vitrine_admin_locales.mjs';

function injectLocale(filePath, namespaceKey, dataObj, exportName) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Si vitrine est déjà présent, le remplacer proprement
  const vitrineRegex = new RegExp(`\\n  ${namespaceKey}:\\s*\\{[\\s\\S]*?\\n  \\},?\\n\\};`, 'm');
  
  const serialized = JSON.stringify(dataObj, null, 2)
    .split('\n')
    .map((line, idx) => (idx === 0 ? line : '    ' + line))
    .join('\n');

  const blockToInsert = `,\n  ${namespaceKey}: {\n    admin: ${serialized}\n  }\n};\n`;

  if (vitrineRegex.test(content)) {
    console.log(`Remplacement du bloc ${namespaceKey} existant dans ${filePath}...`);
    content = content.replace(vitrineRegex, blockToInsert);
  } else {
    console.log(`Insertion du nouveau bloc ${namespaceKey} dans ${filePath}...`);
    // Remplacer le dernier "};\n" ou "};" par le bloc
    const lastBraceIdx = content.lastIndexOf('};');
    if (lastBraceIdx === -1) {
      throw new Error(`Impossible de trouver la fermeture '};' dans ${filePath}`);
    }
    content = content.slice(0, lastBraceIdx) + `  ${namespaceKey}: {\n    admin: ${serialized}\n  }\n};\n`;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ ${filePath} mis à jour avec succès.`);
}

injectLocale('src/locales/fr.js', 'vitrine', vitrineAdminFr, 'fr');
injectLocale('src/locales/pt.js', 'vitrine', vitrineAdminPt, 'pt');
