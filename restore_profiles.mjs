// restore_profiles.mjs
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const FOUNDER_UID = 'iA0SweEHyOPzAPGIDVZdeKAV2mk1';
const CANONICAL_GROUP = 'samambaia';
const PROJECT_ID = 'o-girador-7828c';

// Récupération du jeton d'accès Firebase CLI
function getAccessToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Fichier de configuration Firebase introuvable : ${configPath}. Connectez-vous avec 'firebase login'.`);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const token = config.tokens?.access_token;
  if (!token) {
    throw new Error("Aucun jeton d'accès trouvé dans firebase-tools.json. Veuillez lancer 'firebase login'.");
  }
  return token;
}

function fromFirestoreValue(v) {
  if (!v || typeof v !== 'object') return v;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('doubleValue' in v) return parseFloat(v.doubleValue);
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in v) {
    const res = {};
    for (const [key, val] of Object.entries(v.mapValue.fields || {})) {
      res[key] = fromFirestoreValue(val);
    }
    return res;
  }
  return null;
}

function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: v.toString() } : { doubleValue: v };
  }
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toFirestoreValue) } };
  }
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, val] of Object.entries(v)) {
      fields[k] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

async function apiRequest(method, endpoint, body, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore REST ${method} ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function getDocument(docPath, token) {
  try {
    const raw = await apiRequest('GET', docPath, null, token);
    const fields = raw.fields || {};
    const data = {};
    for (const [k, v] of Object.entries(fields)) {
      data[k] = fromFirestoreValue(v);
    }
    return data;
  } catch (err) {
    if (err.message.includes('404')) return null;
    throw err;
  }
}

async function patchDocument(docPath, updates, token) {
  const fieldPaths = Object.keys(updates);
  const mask = fieldPaths.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const endpoint = `${docPath}?${mask}`;
  
  const fields = {};
  for (const [k, v] of Object.entries(updates)) {
    fields[k] = toFirestoreValue(v);
  }
  return apiRequest('PATCH', endpoint, { fields }, token);
}

async function listAllUsers(token) {
  const users = [];
  let pageToken = null;
  do {
    let endpoint = 'users?pageSize=100';
    if (pageToken) endpoint += `&pageToken=${encodeURIComponent(pageToken)}`;
    const res = await apiRequest('GET', endpoint, null, token);
    const docs = res.documents || [];
    for (const d of docs) {
      const docId = d.name.split('/').pop();
      const fields = {};
      for (const [k, v] of Object.entries(d.fields || {})) {
        fields[k] = fromFirestoreValue(v);
      }
      users.push({ id: docId, data: fields });
    }
    pageToken = res.nextPageToken;
  } while (pageToken);
  return users;
}

async function restore() {
  console.log('🚀 Démarrage de la restauration générale...\n');
  const token = getAccessToken();

  // 1. Restauration complète du profil Fondateur / Super-Mestre
  console.log(`👑 1. Rétablissement des pleins pouvoirs pour Julian (${FOUNDER_UID})...`);
  const founderData = await getDocument(`users/${FOUNDER_UID}`, token) || {};

  const founderExistingTags = Array.isArray(founderData.tags) ? founderData.tags : [];
  const requiredFounderTags = [
    'Mestre', 'Direction', 'Bureau', 'CA', 'Exonéré', 
    'Fondateur', 'Logistique', 'Comptes-Rendus', 'Secrétariat'
  ];
  const mergedFounderTags = Array.from(new Set([...founderExistingTags, ...requiredFounderTags]));

  const founderPatch = {
    nom: 'Biblocq',
    prenom: 'Julian',
    displayName: 'Julian Biblocq',
    surnom: 'Roul',
    adresse: 'Rue de Pont Logoden, 56550, Locoal-Mendon',
    adresseRue: 'Rue de Pont Logoden',
    adresseCP: '56550',
    adresseVille: 'Locoal-Mendon',
    dateNaissance: '1980-05-20',
    genre: 'homme',
    tailleTshirt: 'M',
    taillePantalon: '42',
    lateralite: 'droitier',
    instrument: 'Mestre',
    instrumentPrincipal: 'Mestre',
    instrumentsJoues: ['Caixa', 'Gonguê', 'Alfaia'],
    niveauxParInstrument: {
      'Caixa': 'Confirmé',
      'Gonguê': 'Confirmé',
      'Alfaia': 'Confirmé'
    },
    niveau: 'Confirmé',
    pratiquePercussion: true,
    pratiqueDanse: false,
    volontaireAncienInstrument: true,
    accordRenfortAncienInstrument: true,
    dietaryRestrictions: ['Végétarien'],
    vehicleType: 'Break / Ludospace',
    defaultPassengerSeats: 4,
    defaultTrunkCapacity: 3,
    hasVehicle: true,
    hasTowHitch: true,
    hasRoofBars: false,
    role: 'mestre',
    isSystemAdmin: true,             // Débloque le bouton "Visualiser tout"
    canViewAll: true,
    groupId: CANONICAL_GROUP,
    tags: mergedFounderTags,          // Contient 'Exonéré'
    cotisationStatus: 'exonere',      // Statut cotisation exonérée
    paymentStatus: 'exempted',        // Statut paiement canonique (exempted)
    adhesionStatus: 'valide',
    isCotisationExoneree: true,
    onboardingCompleted: true,
    afficherTelephone: true,
    publierTelephone: true,
    afficherVille: true,
    visibiliteAdresse: 'ville',
    afficherDateNaissance: true,
    publierDateNaissance: true,
    updatedAt: new Date().toISOString()
  };

  await patchDocument(`users/${FOUNDER_UID}`, founderPatch, token);

  console.log('   ✅ Profil fondateur restauré (Coordonnées, Instruments, Super-Admin, Exonéré, Tous tags actifs).\n');

  // 2. Audit et protection de TOUS les autres profils
  console.log('👥 2. Vérification et sécurisation de l\'ensemble des adhérents...');
  const allUsers = await listAllUsers(token);
  let checkedCount = 0;
  let fixedCount = 0;

  for (const userDoc of allUsers) {
    if (userDoc.id === FOUNDER_UID) continue;
    checkedCount++;
    const data = userDoc.data;
    const tags = Array.isArray(data.tags) ? data.tags : [];
    
    // Détection si l'utilisateur était exonéré sous n'importe quel format historique
    const isExonere = 
      tags.some(t => typeof t === 'string' && t.toLowerCase().includes('exon')) ||
      data.cotisationStatus === 'exonere' ||
      data.paymentStatus === 'exempt' ||
      data.paymentStatus === 'exempted' ||
      (typeof data.paymentStatus === 'string' && data.paymentStatus.toLowerCase().includes('exempt')) ||
      data.isExempt === true ||
      data.isCotisationExoneree === true;

    if (isExonere) {
      const cleanTags = Array.from(new Set([...tags, 'Exonéré']));
      await patchDocument(`users/${userDoc.id}`, {
        tags: cleanTags,
        cotisationStatus: 'exonere',
        paymentStatus: 'exempted',
        isCotisationExoneree: true
      }, token);
      fixedCount++;
      console.log(`   🛡️ Adhérent [${userDoc.id}] (${data.displayName || data.prenom || 'Membre'}) confirmé EXONÉRÉ.`);
    }
  }

  console.log(`\n✨ Restauration terminée avec succès :`);
  console.log(`   - Profil Super-Admin : Réaligné à 100%`);
  console.log(`   - Profils inspectés : ${checkedCount}`);
  console.log(`   - Profils protégés/exonérés : ${fixedCount}`);
}

restore().catch(err => {
  console.error('❌ Erreur lors de la restauration :', err);
  process.exit(1);
});
