import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default || traverseModule;

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

let divisions = [];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  } catch (err) {
    continue;
  }

  traverse(ast, {
    BinaryExpression(nodePath) {
      if (nodePath.node.operator === '/') {
        const right = nodePath.node.right;
        // If denominator is a literal number > 0 (e.g. / 2, / 100, / 1000, / 60), it's safe!
        if (right.type === 'NumericLiteral' && right.value !== 0) {
          return;
        }
        // Denominator is a variable, member expression, or calculation
        const line = nodePath.node.loc.start.line;
        const codeSnippet = code.split('\n')[line - 1].trim();
        divisions.push({
          file,
          line,
          codeSnippet
        });
      }
    }
  });
}

console.log(`=== DIVISIONS WITH NON-LITERAL DENOMINATORS (${divisions.length} found) ===`);
for (const d of divisions) {
  // Focus on treasury, pedagogy, attendance, percentages
  if (
    d.file.includes('treasury') ||
    d.file.includes('pedagogy') ||
    d.file.includes('dashboard') ||
    d.file.includes('attendance') ||
    d.file.includes('secretariat') ||
    d.file.includes('inventory') ||
    d.file.includes('aisance') ||
    d.file.includes('Calculations') ||
    d.codeSnippet.includes('%') ||
    d.codeSnippet.includes('total') ||
    d.codeSnippet.includes('count') ||
    d.codeSnippet.includes('length') ||
    d.codeSnippet.includes('Math.round')
  ) {
    console.log(`[${d.file}:${d.line}] ${d.codeSnippet}`);
  }
}
