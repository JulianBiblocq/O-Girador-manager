import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getFiles('./src');
const hookRegex = /\b(useState|useEffect|useMemo|useCallback|useRef|useContext|useReducer|useTranslation|usePoleGuide|useViewSimulator)\s*\(/;
const earlyReturnRegex = /^\s*if\s*\([^)]*!\s*(isOpen|open)[^)]*\)\s*return(\s+null)?;?/;

console.log('--- 1. AUDIT REACT HOOK ORDER (EARLY RETURNS BEFORE HOOKS) ---');
let hookIssues = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let sawEarlyReturn = false;
  let earlyReturnLine = -1;
  let earlyReturnSnippet = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (earlyReturnRegex.test(line)) {
      sawEarlyReturn = true;
      earlyReturnLine = i + 1;
      earlyReturnSnippet = line.trim();
    }
    if (sawEarlyReturn && hookRegex.test(line)) {
      // Check if it's inside another function/component defined below
      hookIssues.push({
        file,
        earlyReturnLine,
        earlyReturnSnippet,
        hookLine: i + 1,
        code: line.trim()
      });
    }
  }
}

if (hookIssues.length === 0) {
  console.log('✅ Aucun retour anticipe (!isOpen) avant un hook React.');
} else {
  console.log(`⚠️ ${hookIssues.length} anomalies detectees :`);
  for (const issue of hookIssues) {
    console.log(`  - [${issue.file}:${issue.hookLine}] Hook apres retour anticipe ligne ${issue.earlyReturnLine}: ${issue.code}`);
  }
}
