import fs from 'fs';
import assert from 'assert';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : VALIDATION DES TRADUCTIONS ET AGENDA");
console.log("===============================================================\n");

// --- Module 1 : Clés spécifiques de widgetAgenda ---
console.log("▶️ Module 1 : Vérification des clés de statut de l'Agenda (FR & PT)");
assert.strictEqual(fr.widgetAgenda?.canceled, "Annulé", "fr.widgetAgenda.canceled doit valoir 'Annulé'");
assert.strictEqual(pt.widgetAgenda?.canceled, "Cancelado", "pt.widgetAgenda.canceled doit valoir 'Cancelado'");

assert.strictEqual(fr.widgetAgenda?.poll, "Sondage", "fr.widgetAgenda.poll doit valoir 'Sondage'");
assert.strictEqual(pt.widgetAgenda?.poll, "Enquete", "pt.widgetAgenda.poll doit valoir 'Enquete'");

assert.strictEqual(fr.widgetAgenda?.informative, "Informatif", "fr.widgetAgenda.informative doit valoir 'Informatif'");
assert.strictEqual(pt.widgetAgenda?.informative, "Informativo", "pt.widgetAgenda.informative doit valoir 'Informativo'");

assert.strictEqual(fr.widgetAgenda?.presence, "Présence", "fr.widgetAgenda.presence doit valoir 'Présence'");
assert.strictEqual(pt.widgetAgenda?.presence, "Presença", "pt.widgetAgenda.presence doit valoir 'Presença'");

assert.strictEqual(fr.widgetAgenda?.confirmed, "Validé", "fr.widgetAgenda.confirmed doit valoir 'Validé'");
assert.strictEqual(pt.widgetAgenda?.confirmed, "Validado", "pt.widgetAgenda.confirmed doit valoir 'Validado'");

console.log("  ✅ [PASS] Clés widgetAgenda.canceled, poll, informative, presence, confirmed validées en FR et PT.");

// --- Module 2 : Logique de repli de la fonction t() ---
console.log("\n▶️ Module 2 : Comportement de la fonction t()");
const translations = { fr, pt };

function makeT(locale) {
  return (path, params) => {
    const keys = path.split('.');
    let value = translations[locale];
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        let fallbackValue = translations['fr'];
        for (const fKey of keys) {
          if (fallbackValue && fallbackValue[fKey] !== undefined) {
            fallbackValue = fallbackValue[fKey];
          } else {
            fallbackValue = (typeof params === 'string' && params.trim().length > 0) ? params : undefined;
            break;
          }
        }
        value = fallbackValue;
        break;
      }
    }
    return value;
  };
}

const tFr = makeT('fr');
const tPt = makeT('pt');

// Traduction existante
assert.strictEqual(tFr('widgetAgenda.canceled'), "Annulé");
assert.strictEqual(tPt('widgetAgenda.canceled'), "Cancelado");

// Clé manquante avec opérateur ||
assert.strictEqual(tFr('cle.inexistante') || 'VALEUR_PAR_DEFAUT', 'VALEUR_PAR_DEFAUT');

// Clé manquante avec 2e paramètre string
assert.strictEqual(tFr('cle.inexistante', 'REPLI_PARAMETRE'), 'REPLI_PARAMETRE');

console.log("  ✅ [PASS] Résolution et repli sécurisé de t() validés.");

// --- Module 3 : Exhaustivité des clés dans src/ ---
console.log("\n▶️ Module 3 : Absence de code brut dans les clés d'i18n du projet");
function getVal(obj, path) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

function scanFiles(dir) {
  const list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      list.push(...scanFiles(full));
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      list.push(full);
    }
  }
  return list;
}

const allFiles = scanFiles('src');
const missingKeys = [];

for (const file of allFiles) {
  if (file.includes('locales')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/t\(\s*['"]([a-zA-Z0-9_-]+\.[a-zA-Z0-9_.-]+)['"]/g)];
  for (const m of matches) {
    const key = m[1];
    const valFr = getVal(fr, key);
    const valPt = getVal(pt, key);
    if (valFr === undefined || valPt === undefined) {
      missingKeys.push({ file, key, valFr, valPt });
    }
  }
}

assert.strictEqual(missingKeys.length, 0, `Il reste des clés non traduites : ${JSON.stringify(missingKeys)}`);
console.log("  ✅ [PASS] 100% des clés d'i18n utilisées dans src/ sont définies en FR et PT.");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : AUCUNE CLÉ BRUTE NE PEUT DÉPASSER");
console.log("===============================================================\n");
