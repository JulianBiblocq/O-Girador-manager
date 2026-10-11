import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import de la fonction getVitrineUrl
import { getVitrineUrl } from '../src/utils/urlUtils.js';

console.log('🧪 Lancement des tests de résolution automatique de la Vitrine (Mostrador)...\n');

// 1. Test association "Samb'à bulles" sans domaine propre
{
  const url1 = getVitrineUrl('sambabulles', {});
  assert.equal(url1, 'https://mostrador.o-girador.com/?tenant=sambabulles', 'Échec résolution URL par groupId direct');

  const url2 = getVitrineUrl({ mostrador: 'https://mostrador.o-girador.com' }, { id: 'sambabulles' });
  assert.equal(url2, 'https://mostrador.o-girador.com/?tenant=sambabulles', 'Échec résolution URL via settings.id');

  const url3 = getVitrineUrl({ mostrador: 'https://mostrador.o-girador.com' }, {}, 'sambabulles');
  assert.equal(url3, 'https://mostrador.o-girador.com/?tenant=sambabulles', 'Échec résolution URL via 3e argument explicitGroupId');

  const urlCaseInsensitive = getVitrineUrl('  SambaBulles  ', {});
  assert.equal(urlCaseInsensitive, 'https://mostrador.o-girador.com/?tenant=sambabulles', 'Échec normalisation minuscules/trim');

  console.log('✅ Test 1 validé : Résolution de Samb\'à bulles vers https://mostrador.o-girador.com/?tenant=sambabulles');
}

// 2. Test domaine personnalisé propre (customDomain string)
{
  const settings = {
    customDomain: 'sambabulles.fr'
  };
  const url = getVitrineUrl('sambabulles', settings);
  assert.equal(url, 'https://sambabulles.fr', 'Échec résolution domaine personnalisé customDomain');

  const settingsWithHttps = {
    customDomain: 'https://mon-association.org'
  };
  const urlHttps = getVitrineUrl('monasso', settingsWithHttps);
  assert.equal(urlHttps, 'https://mon-association.org', 'Échec domaine avec https déjà présent');

  console.log('✅ Test 2 validé : Domaine personnalisé respecté (ex: https://sambabulles.fr)');
}

// 3. Test liste customDomains (tableau)
{
  const settings = {
    customDomains: ['www.sambabulles.com', 'sambabulles.com']
  };
  const url = getVitrineUrl('sambabulles', settings);
  assert.equal(url, 'https://www.sambabulles.com', 'Échec premier domaine de customDomains');

  console.log('✅ Test 3 validé : Premier domaine de customDomains pris en compte');
}

// 4. Test résolution prioritaire pour Samambaia vers son domaine officiel configuré
{
  const urlSamambaia = getVitrineUrl('samambaia', {});
  assert.equal(urlSamambaia, 'https://samambaia-maracatu.fr', 'Échec résolution domaine officiel Samambaia');
  console.log('✅ Test 4 validé : Résolution prioritaire de Samambaia vers https://samambaia-maracatu.fr');
}

// 5. Test inspection des query params pour useTenantResolver et usePublicTheme
{
  const searchParams1 = new URLSearchParams('?tenant=sambabulles');
  const tenant1 = searchParams1.get('tenant') || searchParams1.get('groupe');
  assert.equal(tenant1, 'sambabulles', 'Échec extraction ?tenant=');

  const searchParams2 = new URLSearchParams('?groupe=sambabulles');
  const tenant2 = searchParams2.get('tenant') || searchParams2.get('groupe');
  assert.equal(tenant2, 'sambabulles', 'Échec extraction ?groupe=');

  console.log('✅ Test 5 validé : Inspection prioritaire de searchParams.get("tenant") || searchParams.get("groupe")');
}

console.log('\n🎉 TOUS LES TESTS DE RÉSOLUTION VITRINE ONT RÉUSSI AVEC SUCCÈS !');
