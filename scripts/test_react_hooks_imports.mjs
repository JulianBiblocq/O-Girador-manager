import fs from 'fs';
import path from 'path';

console.log("===============================================================");
console.log("🧪 VÉRIFICATION GLOBALE : IMPORTS DES HOOKS REACT & PERSONNALISÉS");
console.log("===============================================================\n");

const nativeHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer'];
const missing = [];

// 1. Découverte des hooks personnalisés
const hookFiles = fs.readdirSync('src/hooks').filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
const customHooks = new Set();
for (const hf of hookFiles) {
  const content = fs.readFileSync(path.join('src/hooks', hf), 'utf8');
  const matches = [...content.matchAll(/export\s+(?:function|const)\s+(use[A-Z]\w+)/g)];
  for (const m of matches) {
    customHooks.add(m[1]);
  }
}

// 2. Scan récursif
function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      // Vérification des hooks natifs React
      for (const hook of nativeHooks) {
        const hasImport = new RegExp('import\\s+[^;]*\\b' + hook + '\\b[^;]*from\\s+[\'\"][^\'\"]+[\'\"]').test(content);
        let usesHook = false;
        lines.forEach((l) => {
          const trimmed = l.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
          const regex = new RegExp('(?<!React\\.)\\b' + hook + '\\s*\\(');
          if (regex.test(l)) {
            usesHook = true;
          }
        });
        if (usesHook && !hasImport) {
          missing.push({ file: fullPath, hook });
        }
      }

      // Vérification des hooks personnalisés
      for (const hook of customHooks) {
        const usageRegex = new RegExp(`(?<!function\\s+|const\\s+|let\\s+|var\\s+)\\b${hook}\\s*\\(`, 'g');
        if (usageRegex.test(content)) {
          const isImported = new RegExp(`\\b${hook}\\b.*from`).test(content) || new RegExp(`import\\s+[^;]*\\b${hook}\\b`).test(content);
          const isDeclaredLocally = new RegExp(`(?:function|const|let|var)\\s+${hook}\\b`).test(content);
          if (!isImported && !isDeclaredLocally) {
            missing.push({ file: fullPath, hook });
          }
        }
      }
    }
  }
}

scanDir('./src');

if (missing.length > 0) {
  console.error("❌ Des hooks sont appelés sans être importés :");
  missing.forEach((m) => console.error(`  - ${m.hook} manquant dans ${m.file}`));
  process.exit(1);
} else {
  console.log(`✅ Tous les hooks natifs React et les ${customHooks.size} hooks personnalisés sont rigoureusement importés.`);
  console.log("\n===============================================================");
  console.log("🏆 SUCCÈS : AUCUN HOOK MANQUANT DÉTECTÉ");
  console.log("===============================================================\n");
}
