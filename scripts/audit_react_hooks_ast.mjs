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
const hookPattern = /^use[A-Z0-9]/;

let violations = [];

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
    enter(nodePath) {
      const node = nodePath.node;
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        // Inspect body statements
        if (node.body && node.body.type === 'BlockStatement') {
          const bodyStatements = node.body.body;
          let earlyReturn = null;

          for (const stmt of bodyStatements) {
            // Did we hit an early return at the top level of this function?
            if (stmt.type === 'IfStatement') {
              let isEarlyReturn = false;
              if (stmt.consequent.type === 'ReturnStatement') {
                isEarlyReturn = true;
              } else if (stmt.consequent.type === 'BlockStatement') {
                const inner = stmt.consequent.body;
                if (inner.length > 0 && inner[inner.length - 1].type === 'ReturnStatement') {
                  isEarlyReturn = true;
                }
              }
              if (isEarlyReturn && !stmt.alternate) {
                earlyReturn = { line: stmt.loc.start.line };
              }
            }

            // If we have an early return active, check if this statement calls a hook
            if (earlyReturn) {
              traverse(stmt, {
                CallExpression(callPath) {
                  const callee = callPath.node.callee;
                  let calleeName = '';
                  if (callee.type === 'Identifier') {
                    calleeName = callee.name;
                  } else if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
                    calleeName = callee.property.name;
                  }

                  if (hookPattern.test(calleeName)) {
                    // Check if the hook call is directly in this function (not nested in a child callback)
                    let p = callPath.getFunctionParent();
                    if (p && p.node === node) {
                      violations.push({
                        file,
                        earlyReturnLine: earlyReturn.line,
                        hookName: calleeName,
                        hookLine: callPath.node.loc.start.line
                      });
                    }
                  }
                }
              }, nodePath.scope, nodePath.state, nodePath);
            }
          }
        }
      }
    }
  });
}

console.log('=== COMPREHENSIVE AST HOOK ORDER AUDIT ===');
console.log(`Violations found: ${violations.length}`);
for (const v of violations) {
  console.log(`- [${v.file}:${v.hookLine}] ${v.hookName}() appelé après sortie conditionnelle ligne ${v.earlyReturnLine}`);
}
