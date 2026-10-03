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
    } else if (file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getFiles('./src/components');

let potentialUnsafeMaps = [];

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

  const lines = code.split('\n');

  traverse(ast, {
    CallExpression(callPath) {
      const callee = callPath.node.callee;
      // Looking for foo.map(...) where foo is not an Array literal and not guarded by ?.
      if (
        callee.type === 'MemberExpression' &&
        (callee.property.name === 'map' || callee.property.name === 'filter' || callee.property.name === 'reduce')
      ) {
        // If it's optional call: foo?.map(...)
        if (callee.optional) return;
        
        // If it's an ArrayExpression: [1, 2].map(...)
        if (callee.object.type === 'ArrayExpression') return;

        // If it's Array.from or Object.keys / Object.values / Object.entries
        if (
          callee.object.type === 'CallExpression' &&
          callee.object.callee.type === 'MemberExpression' &&
          (callee.object.callee.object.name === 'Object' || callee.object.callee.object.name === 'Array')
        ) {
          return;
        }

        // If it's guarded with || []: (foo || []).map(...)
        if (
          callee.object.type === 'LogicalExpression' &&
          callee.object.operator === '||' &&
          callee.object.right.type === 'ArrayExpression'
        ) {
          return;
        }

        // Check if object is an identifier or member expression like props.items or data
        const line = callee.loc.start.line;
        const lineText = lines[line - 1].trim();

        // Check if it's already guarded on same line (e.g. `items && items.map` or `Array.isArray(x) && x.map`)
        if (lineText.includes('&&') || lineText.includes('?')) {
          // May be ternary or logical guard
          return;
        }

        potentialUnsafeMaps.push({
          file,
          line,
          method: callee.property.name,
          code: lineText
        });
      }
    }
  });
}

console.log(`=== POTENTIALLY UNGUARDED MAP/FILTER/REDUCE CALLS (${potentialUnsafeMaps.length} found) ===`);
for (const item of potentialUnsafeMaps.slice(0, 30)) {
  console.log(`[${item.file}:${item.line}] .${item.method} : ${item.code}`);
}
if (potentialUnsafeMaps.length > 30) {
  console.log(`... and ${potentialUnsafeMaps.length - 30} more`);
}
