import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;

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

const files = getAllFiles(path.resolve('src'));
const violations = [];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'objectRestSpread', 'optionalChaining', 'nullishCoalescingOperator', 'dynamicImport']
    });
  } catch (e) {
    continue;
  }

  // Pour chaque fonction (FunctionDeclaration, FunctionExpression, ArrowFunctionExpression)
  traverse(ast, {
    Function(functionPath) {
      // Vérifier si cette fonction est un composant React ou un Custom Hook
      // (Nom commençant par une majuscule ou 'use')
      let funcName = '';
      if (functionPath.node.id) {
        funcName = functionPath.node.id.name;
      } else if (functionPath.parentPath.isVariableDeclarator()) {
        funcName = functionPath.parentPath.node.id.name;
      } else if (functionPath.parentPath.isExportDefaultDeclaration()) {
        funcName = 'defaultExport';
      }

      const isComponentOrHook = (/^[A-Z]/.test(funcName) || /^use[A-Z]/.test(funcName) || funcName === 'defaultExport');
      if (!isComponentOrHook) return;

      const body = functionPath.node.body;
      if (!body || body.type !== 'BlockStatement') return;

      // On regarde la séquence d'instructions directes dans le corps de la fonction
      let hasEarlyReturn = false;
      let earlyReturnLine = 0;

      for (const stmt of body.body) {
        // Détection d'un if avec return direct
        if (stmt.type === 'IfStatement') {
          const consequent = stmt.consequent;
          let hasReturn = false;
          if (consequent.type === 'ReturnStatement') {
            hasReturn = true;
          } else if (consequent.type === 'BlockStatement') {
            hasReturn = consequent.body.some(s => s.type === 'ReturnStatement');
          }
          if (hasReturn && !hasEarlyReturn) {
            hasEarlyReturn = true;
            earlyReturnLine = stmt.loc?.start?.line || 0;
          }
        }

        // Si on a déjà vu un early return AVANT cette instruction, chercher s'il y a un appel de Hook
        if (hasEarlyReturn && stmt.type !== 'ReturnStatement') {
          // Chercher les appels de hooks (useState, useEffect, use...) dans ce statement
          let hookFound = null;
          let hookLine = 0;

          // Petit traverse local
          function checkHooks(node) {
            if (!node || typeof node !== 'object') return;
            if (node.type === 'CallExpression') {
              let calleeName = '';
              if (node.callee.type === 'Identifier') {
                calleeName = node.callee.name;
              } else if (node.callee.type === 'MemberExpression' && node.callee.property.type === 'Identifier') {
                calleeName = node.callee.property.name;
              }
              if (/^use[A-Z]/.test(calleeName)) {
                hookFound = calleeName;
                hookLine = node.loc?.start?.line || 0;
                return;
              }
            }
            for (const key of Object.keys(node)) {
              if (key === 'parent' || hookFound) continue;
              const child = node[key];
              if (Array.isArray(child)) {
                for (const c of child) checkHooks(c);
              } else {
                checkHooks(child);
              }
            }
          }

          checkHooks(stmt);

          if (hookFound) {
            violations.push({
              file: path.relative(process.cwd(), file),
              funcName,
              earlyReturnLine,
              hookFound,
              hookLine
            });
            break;
          }
        }
      }
    }
  });
}

console.log(`\n🔍 Résultat du scan des Hooks après clause de sortie prématurée :`);
if (violations.length === 0) {
  console.log(`✅ AUCUNE violation des règles de hooks détectée. L'ordre des hooks est 100% stable.`);
} else {
  console.log(`⚠️ ${violations.length} violation(s) détectée(s) :`);
  for (const v of violations) {
    console.log(`  - [${v.file}] Fonction '${v.funcName}': Hook '${v.hookFound}' à la ligne ${v.hookLine} après early return à la ligne ${v.earlyReturnLine}`);
  }
}
