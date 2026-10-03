/**
 * Application des remplacements i18n pour le Lot 2 Pédagogie (35 fichiers)
 */
import fs from 'fs';
import path from 'path';

const replacementsByFile = JSON.parse(fs.readFileSync('scripts/pedagogy_lot2_replacements_by_file.json', 'utf8'));

// Helper d'injection de useTranslation
function ensureUseTranslation(code, filePath) {
  let updated = code;
  const isHookPresent = updated.includes('useTranslation');

  if (!isHookPresent) {
    let importPath = '../LanguageContext';
    if (filePath.includes('/conductor/') || filePath.includes('/reflex/')) {
      importPath = '../../LanguageContext';
    } else if (filePath === 'src/components/SongCard.jsx' || filePath === 'src/components/CultureCard.jsx') {
      importPath = './LanguageContext';
    }

    // Trouver le dernier import
    const lastImportIndex = updated.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = updated.indexOf('\n', lastImportIndex);
      updated = updated.slice(0, endOfLine + 1) + `import { useTranslation } from '${importPath}';\n` + updated.slice(endOfLine + 1);
    } else {
      updated = `import { useTranslation } from '${importPath}';\n` + updated;
    }
  }

  // Vérifier la présence de const { t } = useTranslation();
  if (!updated.includes('const { t } = useTranslation()') && !updated.includes('const { t,') && !updated.includes(', t } = useTranslation()')) {
    // Injecter au début du premier composant fonctionnel
    const funcMatch = updated.match(/(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{|export\s+function\s+\w+\s*\([^)]*\)\s*\{|function\s+\w+\s*\([^)]*\)\s*\{)/);
    if (funcMatch) {
      const matchIndex = updated.indexOf(funcMatch[0]);
      const insertPos = matchIndex + funcMatch[0].length;
      updated = updated.slice(0, insertPos) + '\n  const { t } = useTranslation();' + updated.slice(insertPos);
    }
  }

  return updated;
}

let totalFilesModified = 0;
let totalStringsReplaced = 0;

for (const [relPath, items] of Object.entries(replacementsByFile)) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Fichier introuvable : ${relPath}`);
    continue;
  }

  let code = fs.readFileSync(fullPath, 'utf8');
  let originalCode = code;

  // 1. S'assurer de la présence du hook de traduction
  code = ensureUseTranslation(code, relPath);

  // 2. Trier les items par longueur de chaîne décroissante pour éviter les remplacements partiels
  const sortedItems = [...items].sort((a, b) => b.text.length - a.text.length);

  for (const it of sortedItems) {
    const text = it.text.trim();
    const fullKey = it.fullKey;

    if (!code.includes(text)) {
      continue;
    }

    // Remplacements contextuels
    // A. Attributs : title="...", placeholder="...", label="...", aria-label="..."
    const attrPatterns = [
      { from: `title="${text}"`, to: `title={t('${fullKey}')}` },
      { from: `title='${text}'`, to: `title={t('${fullKey}')}` },
      { from: `placeholder="${text}"`, to: `placeholder={t('${fullKey}')}` },
      { from: `placeholder='${text}'`, to: `placeholder={t('${fullKey}')}` },
      { from: `label="${text}"`, to: `label={t('${fullKey}')}` },
      { from: `label='${text}'`, to: `label={t('${fullKey}')}` },
      { from: `aria-label="${text}"`, to: `aria-label={t('${fullKey}')}` },
      { from: `aria-label='${text}'`, to: `aria-label={t('${fullKey}')}` },
      { from: `alt="${text}"`, to: `alt={t('${fullKey}')}` },
      { from: `alt='${text}'`, to: `alt={t('${fullKey}')}` },
    ];

    let attrReplaced = false;
    for (const p of attrPatterns) {
      if (code.includes(p.from)) {
        code = code.replaceAll(p.from, p.to);
        attrReplaced = true;
        totalStringsReplaced++;
      }
    }
    if (attrReplaced) continue;

    // B. Fallbacks : || "..." ou || '...'
    const fallbackDouble = `|| "${text}"`;
    const fallbackSingle = `|| '${text}'`;
    if (code.includes(fallbackDouble)) {
      code = code.replaceAll(fallbackDouble, `|| t('${fullKey}')`);
      totalStringsReplaced++;
      continue;
    }
    if (code.includes(fallbackSingle)) {
      code = code.replaceAll(fallbackSingle, `|| t('${fullKey}')`);
      totalStringsReplaced++;
      continue;
    }

    // C. Branches conditionnelles ternaires : ? "..." : ou : "..."
    const condDouble1 = `? "${text}"`;
    const condDouble2 = `: "${text}"`;
    const condSingle1 = `? '${text}'`;
    const condSingle2 = `: '${text}'`;
    let condReplaced = false;
    if (code.includes(condDouble1)) { code = code.replaceAll(condDouble1, `? t('${fullKey}')`); condReplaced = true; totalStringsReplaced++; }
    if (code.includes(condDouble2)) { code = code.replaceAll(condDouble2, `: t('${fullKey}')`); condReplaced = true; totalStringsReplaced++; }
    if (code.includes(condSingle1)) { code = code.replaceAll(condSingle1, `? t('${fullKey}')`); condReplaced = true; totalStringsReplaced++; }
    if (code.includes(condSingle2)) { code = code.replaceAll(condSingle2, `: t('${fullKey}')`); condReplaced = true; totalStringsReplaced++; }
    if (condReplaced) continue;

    // D. Appels de fonctions : alert("..."), confirm("...")
    const alertDouble = `alert("${text}")`;
    const alertSingle = `alert('${text}')`;
    const confirmDouble = `confirm("${text}")`;
    const confirmSingle = `confirm('${text}')`;
    if (code.includes(alertDouble)) { code = code.replaceAll(alertDouble, `alert(t('${fullKey}'))`); totalStringsReplaced++; continue; }
    if (code.includes(alertSingle)) { code = code.replaceAll(alertSingle, `alert(t('${fullKey}'))`); totalStringsReplaced++; continue; }
    if (code.includes(confirmDouble)) { code = code.replaceAll(confirmDouble, `confirm(t('${fullKey}'))`); totalStringsReplaced++; continue; }
    if (code.includes(confirmSingle)) { code = code.replaceAll(confirmSingle, `confirm(t('${fullKey}'))`); totalStringsReplaced++; continue; }

    // E. Expressions JSX : { "..." } ou { '...' }
    const exprDouble = `{"${text}"}`;
    const exprSingle = `{'${text}'}`;
    if (code.includes(exprDouble)) { code = code.replaceAll(exprDouble, `{t('${fullKey}')}`); totalStringsReplaced++; continue; }
    if (code.includes(exprSingle)) { code = code.replaceAll(exprSingle, `{t('${fullKey}')}`); totalStringsReplaced++; continue; }

    // F. Texte JSX brut : >texte<
    // Vérifier si le texte est entouré de balises
    const jsxRegex = new RegExp(`>\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`, 'g');
    if (jsxRegex.test(code)) {
      code = code.replace(jsxRegex, `>{t('${fullKey}')}<`);
      totalStringsReplaced++;
      continue;
    }

    // G. Remplacement JSX standard
    if (code.includes(`>${text}<`)) {
      code = code.replaceAll(`>${text}<`, `>{t('${fullKey}')}<`);
      totalStringsReplaced++;
      continue;
    }
  }

  // Nettoyage des doublons éventuels d'accolades : {{t('...')}} ou {t('{t('...')}')}
  code = code.replace(/\{\s*\{t\((.*?)\)\}\s*\}/g, "{t($1)}");
  code = code.replace(/\{t\(\s*['"]\{t\((.*?)\)\}['"]\s*\)\}/g, "t($1)");

  if (code !== originalCode) {
    fs.writeFileSync(fullPath, code, 'utf8');
    totalFilesModified++;
    console.log(`✅ Mis à jour : ${relPath}`);
  } else {
    console.log(`⚠️ Aucun changement : ${relPath}`);
  }
}

console.log(`\n🎉 Bilan Lot 2 : ${totalFilesModified} fichiers modifiés, ${totalStringsReplaced} remplacements appliqués.`);
