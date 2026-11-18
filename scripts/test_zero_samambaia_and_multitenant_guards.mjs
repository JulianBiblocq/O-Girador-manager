import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {
  LAST_TENANT_STORAGE_KEY,
  canonicalizeGroupId,
  registerCanonicalGroupId,
  buildGroupVariants,
  isCustomDomainHost
} from '../src/utils/tenantUtils.js';
import { resolveAdminFallbackGroupId } from '../src/utils/founderFallbackUtils.js';

console.log('🧪 DÉBUT DU TEST : ZÉRO NOM D\'ASSOCIATION EN DUR & 4 GARDE-FOUS MULTI-TENANT...');

// 1. Scan récursif strict de src/ : 0 occurrence de l'ancien groupe pilote codé en dur
const FORBIDDEN_TOKEN = ['samam', 'baia'].join('');
const FORBIDDEN_RE = new RegExp(FORBIDDEN_TOKEN, 'i');
const violations = [];

function walkSrc(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSrc(full);
    } else {
      const txt = fs.readFileSync(full, 'utf8');
      if (FORBIDDEN_RE.test(txt)) {
        violations.push(full);
      }
    }
  }
}
walkSrc(path.resolve('src'));
assert.strictEqual(violations.length, 0, `Occurrences interdites détectées dans src/ : ${violations.join(', ')}`);
console.log('  ✅ [PASS] Zéro occurrence en dur dans tout src/');

// 2. Garde-fou 1 : Promise.allSettled obligatoire dans tenantFirestoreResolver.js + isCustomDomainHost
const resolverSrc = fs.readFileSync(path.resolve('src/utils/tenantFirestoreResolver.js'), 'utf8');
assert.ok(resolverSrc.includes('Promise.allSettled'), 'tenantFirestoreResolver.js doit utiliser Promise.allSettled');
assert.ok(!resolverSrc.includes('Promise.all('), 'tenantFirestoreResolver.js ne doit jamais utiliser Promise.all');

assert.strictEqual(isCustomDomainHost('mon-asso-culturelle.fr'), true);
assert.strictEqual(isCustomDomainHost('www.mon-asso-culturelle.fr'), true);
assert.strictEqual(isCustomDomainHost('organizador.o-girador.com'), false);
assert.strictEqual(isCustomDomainHost('mostrador.o-girador.com'), false);
assert.strictEqual(isCustomDomainHost('o-girador-organizador.web.app'), false);
assert.strictEqual(isCustomDomainHost('localhost'), false);

registerCanonicalGroupId('BaqueSol');
assert.strictEqual(canonicalizeGroupId('baquesol'), 'BaqueSol');
assert.ok(buildGroupVariants('baquesol').includes('BaqueSol'));
console.log('  ✅ [PASS] Garde-fou 1 : Promise.allSettled, casse canonique et domaines personnalisés validés');

// 3. Garde-fou 2 : Persistance PWA og_last_tenant_id et changement d'association sur Login
assert.strictEqual(LAST_TENANT_STORAGE_KEY, 'og_last_tenant_id');
const badgeSrc = fs.readFileSync(path.resolve('src/components/auth/LoginActiveTenantBadge.jsx'), 'utf8');
assert.ok(badgeSrc.includes("Changer d'association"), 'LoginActiveTenantBadge doit proposer le changement d\'association');
console.log('  ✅ [PASS] Garde-fou 2 : Persistance PWA og_last_tenant_id et sélecteur de changement présents');

// 4. Garde-fou 3 : Interdiction des comptes orphelins dans Onboarding.jsx & memberService.js
const onboardingSrc = fs.readFileSync(path.resolve('src/components/Onboarding.jsx'), 'utf8');
const memberServiceSrc = fs.readFileSync(path.resolve('src/services/memberService.js'), 'utf8');
assert.ok(onboardingSrc.includes('if (!verifiedGroupId)'), 'Onboarding.jsx doit bloquer setDoc sans verifiedGroupId');
assert.ok(memberServiceSrc.includes('if (!canonicalGroup)'), 'memberService.js doit refuser toute écriture sans canonicalGroup');
console.log('  ✅ [PASS] Garde-fou 3 : Protection anti-comptes orphelins active');

// 5. Garde-fou 4 : Non-écrasement du groupId sur les profils de secours Admin
assert.strictEqual(resolveAdminFallbackGroupId({ groupId: 'BaqueSol' }, ''), 'BaqueSol');
assert.strictEqual(resolveAdminFallbackGroupId({}, 'sambabulles'), 'sambabulles');
assert.strictEqual(resolveAdminFallbackGroupId(null, ''), '');
console.log('  ✅ [PASS] Garde-fou 4 : Profils de secours Admin préservent le groupId existant');

console.log('🎉 TOUS LES GARDE-FOUS MULTI-TENANT SONT 100% VALIDÉS !');
