import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;

const standardGlobals = new Set([
  'window', 'document', 'navigator', 'console', 'localStorage', 'sessionStorage',
  'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'URL', 'URLSearchParams',
  'FileReader', 'Blob', 'File', 'Image', 'Audio', 'Event', 'CustomEvent',
  'FormData', 'Headers', 'Request', 'Response', 'AbortController', 'alert',
  'confirm', 'prompt', 'atob', 'btoa', 'encodeURIComponent', 'decodeURIComponent',
  'encodeURI', 'decodeURI', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'Math', 'Date', 'RegExp', 'JSON', 'Object', 'Array', 'String', 'Number',
  'Boolean', 'Symbol', 'Error', 'TypeError', 'RangeError', 'ReferenceError',
  'SyntaxError', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy',
  'Reflect', 'Intl', 'ArrayBuffer', 'Uint8Array', 'Int8Array', 'Uint16Array',
  'Int16Array', 'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array',
  'process', 'global', 'globalThis', 'location', 'history', 'performance',
  'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'HTMLElement',
  'Element', 'Node', 'AudioContext', 'webkitAudioContext', 'screen',
  'crypto', 'indexedDB', 'open', 'close', 'scrollTo', 'scrollBy'
]);

function getAllFiles(dir, exts = ['.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(getAllFiles(filePath, exts));
      }
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const allFiles = getAllFiles(path.resolve('src'));
const issues = [];

for (const file of allFiles) {
  const code = fs.readFileSync(file, 'utf-8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'objectRestSpread', 'optionalChaining', 'nullishCoalescingOperator', 'dynamicImport']
    });
  } catch (err) {
    // Erreur de parse
    continue;
  }

  traverse(ast, {
    ReferencedIdentifier(pathNode) {
      const name = pathNode.node.name;
      if (standardGlobals.has(name)) return;
      if (pathNode.scope.hasBinding(name)) return;

      // Ignorer certains identifiants spéciaux JSX ou types
      if (name === 'React') return;

      issues.push({
        file: path.relative(process.cwd(), file),
        line: pathNode.node.loc?.start?.line,
        name
      });
    }
  });
}

console.log(`Scan terminé. ${issues.length} identifiants potentiellement non déclarés trouvés :`);
for (const issue of issues) {
  console.log(`- ${issue.file}:${issue.line} -> "${issue.name}"`);
}
