/**
 * Batterie de Tests Automatisés de Permissions en Ligne :
 * Pôles cibles : AGENDA & FORUM
 * Profils testés :
 * 1. Helena Ferreira - Présidente (recette.presidente@o-girador.test)
 * 2. Camila Santos   - Admin Bureau (recette.admin@o-girador.test)
 * 3. Tiago Rocha     - Membre Standard (recette.membre@o-girador.test)
 */

import { canManageEvents, canAccessPole, canAccessTabPermission } from '../src/utils/permissionUtils.js';

const API_KEY = "AIzaSyCTvRPj2p3zdIfEjftXoSvRJ43Uy0EfPMY";
const PROJECT_ID = "o-girador-7828c";
const REFERER = "http://localhost:5173/";

// 1. Authentification REST Firebase
async function authUser(email, password) {
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const headers = { 'Content-Type': 'application/json', 'Referer': REFERER };
  const res = await fetch(signInUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Échec authentification ${email} : ${JSON.stringify(data)}`);
  }
  return data;
}

// 2. Récupération du document profil Firestore
async function getFirestoreUser(token, uid) {
  const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const res = await fetch(docUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Impossible de récupérer le profil ${uid} : ${res.statusText}`);
  }
  const data = await res.json();
  
  // Désérialisation des champs Firestore
  const parseValue = (val) => {
    if (!val) return null;
    if ('stringValue' in val) return val.stringValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('arrayValue' in val) return (val.arrayValue.values || []).map(parseValue);
    if ('mapValue' in val) {
      const obj = {};
      for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
        obj[k] = parseValue(v);
      }
      return obj;
    }
    return null;
  };

  const user = { uid, id: uid };
  for (const [k, v] of Object.entries(data.fields || {})) {
    user[k] = parseValue(v);
  }
  return user;
}

// 3. Helper pour exécuter une requête REST Firestore
async function firestoreRequest(token, path, method = 'GET', body = null) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

// Helper pour vérifier l'accès aux salons forum (reproduction exacte de Forum.jsx)
function checkUserAccessToList(list, user) {
  if (!list || list.length === 0) return true;
  if (list.includes('all')) return true;

  const role = (user?.role || '').toLowerCase();
  const tags = (user?.tags || []).map(t => (t || '').toLowerCase());
  const userTokens = [role, ...tags];

  const BUREAU_KEYWORDS = ['bureau', 'président', 'présidente', 'présidence', 'trésorier', 'trésorière', 'secrétaire', 'direction'];
  const CA_KEYWORDS = ['ca', 'c.a', 'conseil', 'administrateur', 'administratrice'];

  return list.some(item => {
    const cleanItem = (item || '').toLowerCase().trim();
    if (cleanItem === 'all') return true;
    if (cleanItem === 'bureau') {
      return role === 'bureau' || BUREAU_KEYWORDS.some(kw => userTokens.includes(kw));
    }
    if (cleanItem === 'ca' || cleanItem === 'c.a') {
      return role === 'ca' || CA_KEYWORDS.some(kw => userTokens.includes(kw));
    }
    return userTokens.includes(cleanItem);
  });
}

// Helper pour vérifier le statut de modérateur forum (reproduction exacte de useForumModeration / ThreadView)
function isUserModeratorOrAdmin(user) {
  if (!user) return false;
  if (user.isSystemAdmin === true) return true;
  const role = (user.role || '').toLowerCase();
  if (['mestre', 'super-admin', 'admin', 'moderator'].includes(role)) return true;
  const tags = (user.tags || []).map(t => (t || '').toLowerCase());
  return tags.some(t => ['modérateur', 'moderateur', 'modérateur forum', 'bureau', 'président', 'présidente', 'direction'].includes(t));
}

async function runBatteryTests() {
  console.log("====================================================================");
  console.log("=== BATTERIE DE TESTS DE PERMISSIONS EN LIGNE (AGENDA & FORUM) ===");
  console.log("====================================================================\n");

  const results = {
    agenda: { success: [], errors: [] },
    forum: { success: [], errors: [] },
    firestoreRules: { success: [], errors: [] }
  };

  // Connexion des 3 profils
  console.log("-> 1. Authentification en direct sur Firebase...");
  const helenaAuth = await authUser("recette.presidente@o-girador.test", "RecetteGirador2026!");
  const camilaAuth = await authUser("recette.admin@o-girador.test", "RecetteGirador2026!");
  const tiagoAuth  = await authUser("recette.membre@o-girador.test", "RecetteGirador2026!");

  console.log("-> 2. Chargement des profils complets depuis Firestore...");
  const helenaUser = await getFirestoreUser(helenaAuth.idToken, helenaAuth.localId);
  const camilaUser = await getFirestoreUser(camilaAuth.idToken, camilaAuth.localId);
  const tiagoUser  = await getFirestoreUser(tiagoAuth.idToken, tiagoAuth.localId);

  console.log(`- Présidente : ${helenaUser.prenom} ${helenaUser.nom} | Rôle: ${helenaUser.role} | Tags: ${JSON.stringify(helenaUser.tags)}`);
  console.log(`- Admin      : ${camilaUser.prenom} ${camilaUser.nom} | Rôle: ${camilaUser.role} | Tags: ${JSON.stringify(camilaUser.tags)}`);
  console.log(`- Membre     : ${tiagoUser.prenom} ${tiagoUser.nom} | Rôle: ${tiagoUser.role} | Tags: ${JSON.stringify(tiagoUser.tags)}\n`);

  // ==========================================
  // SECTION 1 : TESTS LOGIQUE AGENDA
  // ==========================================
  console.log("--- TEST SECTION 1 : AGENDA (GESTION & ÉDITION D'ÉVÉNEMENTS) ---");
  
  // 1.1 Gestion des événements (Création, modification logistique, suppression)
  const helenaCanManageAgenda = canManageEvents(helenaUser);
  if (helenaCanManageAgenda === true) {
    results.agenda.success.push("Présidente : Autorisation de gestion d'événements (canManageEvents = TRUE)");
  } else {
    results.agenda.errors.push("Présidente : Échec canManageEvents (attendu TRUE)");
  }

  const camilaCanManageAgenda = canManageEvents(camilaUser);
  if (camilaCanManageAgenda === true) {
    results.agenda.success.push("Admin Bureau : Autorisation de gestion d'événements (canManageEvents = TRUE)");
  } else {
    results.agenda.errors.push("Admin Bureau : Échec canManageEvents (attendu TRUE)");
  }

  const tiagoCanManageAgenda = canManageEvents(tiagoUser);
  if (tiagoCanManageAgenda === false) {
    results.agenda.success.push("Membre standard : Blocage création/gestion d'événements (canManageEvents = FALSE)");
  } else {
    results.agenda.errors.push("Membre standard : Échec canManageEvents (attendu FALSE)");
  }

  // 1.2 Accès global aux onglets Espace Membre (Agenda & Forum)
  const helenaAgendaTab = canAccessTabPermission('agenda', 'accueil', helenaUser);
  const tiagoAgendaTab = canAccessTabPermission('agenda', 'accueil', tiagoUser);
  if (helenaAgendaTab && tiagoAgendaTab) {
    results.agenda.success.push("Consultation Agenda : Accessible pour tous les membres du groupe");
  } else {
    results.agenda.errors.push("Consultation Agenda : Accès refusé anormalement");
  }

  // ==========================================
  // SECTION 2 : TESTS LOGIQUE FORUM
  // ==========================================
  console.log("\n--- TEST SECTION 2 : FORUM (SALONS PRIVÉS & MODÉRATION) ---");

  // 2.0 Consultation Forum dans l'Espace Membre
  const helenaForumTab = canAccessTabPermission('forum', 'accueil', helenaUser);
  const tiagoForumTab = canAccessTabPermission('forum', 'accueil', tiagoUser);
  if (helenaForumTab && tiagoForumTab) {
    results.forum.success.push("Consultation Forum : Accessible pour tous les membres du groupe");
  } else {
    results.forum.errors.push("Consultation Forum : Accès refusé anormalement");
  }

  // 2.1 Salon public ("Général" : readRoles = ['all'])
  const publicRoles = ['all'];
  if (checkUserAccessToList(publicRoles, helenaUser) && 
      checkUserAccessToList(publicRoles, camilaUser) && 
      checkUserAccessToList(publicRoles, tiagoUser)) {
    results.forum.success.push("Salon Public 'Général' : Accessible par Présidente, Admin et Membre");
  } else {
    results.forum.errors.push("Salon Public 'Général' : Blocage inattendu");
  }

  // 2.2 Salon privé "Bureau" (readRoles = ['bureau', 'Bureau'])
  const bureauRoles = ['bureau', 'Bureau'];
  const helenaBureau = checkUserAccessToList(bureauRoles, helenaUser);
  const camilaBureau = checkUserAccessToList(bureauRoles, camilaUser);
  const tiagoBureau  = checkUserAccessToList(bureauRoles, tiagoUser);

  if (helenaBureau) {
    results.forum.success.push("Salon Privé 'Bureau' : Présidente autorisée avec succès");
  } else {
    results.forum.errors.push("Salon Privé 'Bureau' : Présidente refusée à tort");
  }

  if (camilaBureau) {
    results.forum.success.push("Salon Privé 'Bureau' : Admin autorisée avec succès");
  } else {
    results.forum.errors.push("Salon Privé 'Bureau' : Admin refusée à tort");
  }

  if (!tiagoBureau) {
    results.forum.success.push("Salon Privé 'Bureau' : Membre standard strictement bloqué");
  } else {
    results.forum.errors.push("Salon Privé 'Bureau' : Membre standard a indûment accès au Bureau");
  }

  // 2.3 Salon privé "CA" (readRoles = ['ca'])
  const caRoles = ['ca'];
  const helenaCA = checkUserAccessToList(caRoles, helenaUser);
  const tiagoCA  = checkUserAccessToList(caRoles, tiagoUser);

  if (helenaCA) {
    results.forum.success.push("Salon Privé 'CA' : Présidente autorisée avec succès (tag CA)");
  } else {
    results.forum.errors.push("Salon Privé 'CA' : Présidente refusée à tort");
  }

  if (!tiagoCA) {
    results.forum.success.push("Salon Privé 'CA' : Membre standard strictement bloqué");
  } else {
    results.forum.errors.push("Salon Privé 'CA' : Membre standard a indûment accès au CA");
  }

  // 2.4 Modération Forum (Épinglage, fermeture de fil, suppression de messages)
  const helenaMod = isUserModeratorOrAdmin(helenaUser);
  const camilaMod = isUserModeratorOrAdmin(camilaUser);
  const tiagoMod  = isUserModeratorOrAdmin(tiagoUser);

  if (helenaMod) {
    results.forum.success.push("Modération Forum : Présidente reconnue Modératrice/Admin (isUserModeratorOrAdmin = TRUE)");
  } else {
    results.forum.errors.push("Modération Forum : Présidente non reconnue Modératrice");
  }

  if (camilaMod) {
    results.forum.success.push("Modération Forum : Admin reconnue Modératrice/Admin (isUserModeratorOrAdmin = TRUE)");
  } else {
    results.forum.errors.push("Modération Forum : Admin non reconnue Modératrice");
  }

  if (!tiagoMod) {
    results.forum.success.push("Modération Forum : Membre standard sans privilèges de modération (isUserModeratorOrAdmin = FALSE)");
  } else {
    results.forum.errors.push("Modération Forum : Membre standard a indûment les droits de modération");
  }

  // ==========================================
  // SECTION 3 : TESTS RÈGLES DE SÉCURITÉ FIRESTORE EN LIGNE
  // ==========================================
  console.log("\n--- TEST SECTION 3 : RÈGLES DE SÉCURITÉ FIRESTORE EN LIGNE ---");

  // 3.1 Test Écriture Événement Agenda en Ligne
  const testEventId = `recette_event_${Date.now()}`;
  const eventPayload = {
    fields: {
      titre: { stringValue: "Répétition Générale Test Recette" },
      date: { stringValue: "2026-10-15" },
      groupId: { stringValue: "Samambaia" },
      type: { stringValue: "repetition" }
    }
  };

  // Helena (Présidente) écrit un événement -> doit réussir (200 OK)
  console.log("-> Test Firestore : Écriture événement par Présidente...");
  const helenaWriteRes = await firestoreRequest(
    helenaAuth.idToken,
    `events/${testEventId}`,
    'PATCH',
    eventPayload
  );

  if (helenaWriteRes.ok) {
    results.firestoreRules.success.push("Règles Firestore Agenda : Écriture autorisée pour la Présidente (200 OK)");
    // Nettoyage
    await firestoreRequest(helenaAuth.idToken, `events/${testEventId}`, 'DELETE');
  } else {
    results.firestoreRules.errors.push(`Règles Firestore Agenda : Écriture refusée pour la Présidente (${helenaWriteRes.status})`);
  }

  // Tiago (Membre) tente d'écrire un événement -> doit échouer (403 PERMISSION_DENIED)
  console.log("-> Test Firestore : Tentative d'écriture événement par Membre standard...");
  const tiagoWriteRes = await firestoreRequest(
    tiagoAuth.idToken,
    `events/${testEventId}`,
    'PATCH',
    eventPayload
  );

  if (!tiagoWriteRes.ok && (tiagoWriteRes.status === 403 || tiagoWriteRes.status === 400)) {
    results.firestoreRules.success.push(`Règles Firestore Agenda : Tentative d'écriture membre standard bloquée avec succès (${tiagoWriteRes.status} FORBIDDEN)`);
  } else {
    results.firestoreRules.errors.push(`Règles Firestore Agenda : Fuite de sécurité, membre a pu écrire un événement (${tiagoWriteRes.status})`);
    if (tiagoWriteRes.ok) {
      await firestoreRequest(helenaAuth.idToken, `events/${testEventId}`, 'DELETE');
    }
  }

  // 3.2 Test Écriture Forum en Ligne (Collection 'forum')
  // 3.2.1 Présidente publie dans salon Bureau -> Doit réussir (200 OK)
  const testThreadBureauId = `recette_thread_bureau_${Date.now()}`;
  const threadBureauPayload = {
    fields: {
      titre: { stringValue: "Fil Bureau Recette Présidence" },
      groupId: { stringValue: "Samambaia" },
      channelId: { stringValue: "Samambaia_bureau" },
      authorId: { stringValue: helenaAuth.localId },
      authorName: { stringValue: "Helena Ferreira" },
      createdAt: { timestampValue: new Date().toISOString() }
    }
  };

  console.log("-> Test Firestore : Création d'un fil sur salon Bureau par Présidente...");
  const helenaThreadRes = await firestoreRequest(
    helenaAuth.idToken,
    `forum/${testThreadBureauId}`,
    'PATCH',
    threadBureauPayload
  );

  if (helenaThreadRes.ok) {
    results.firestoreRules.success.push("Règles Firestore Forum : Présidente peut poster dans le salon Bureau (200 OK)");
    await firestoreRequest(helenaAuth.idToken, `forum/${testThreadBureauId}`, 'DELETE');
  } else {
    results.firestoreRules.errors.push(`Règles Firestore Forum : Écriture post Présidente dans Bureau refusée (${helenaThreadRes.status})`);
  }

  // 3.2.2 Membre standard tente de poster dans salon Bureau -> Doit échouer (403 FORBIDDEN)
  console.log("-> Test Firestore : Tentative de publication dans salon Bureau par Membre standard...");
  const tiagoThreadBureauRes = await firestoreRequest(
    tiagoAuth.idToken,
    `forum/${testThreadBureauId}`,
    'PATCH',
    {
      fields: {
        titre: { stringValue: "Intrusion Membre dans Salon Bureau" },
        groupId: { stringValue: "Samambaia" },
        channelId: { stringValue: "Samambaia_bureau" },
        authorId: { stringValue: tiagoAuth.localId },
        authorName: { stringValue: "Tiago Rocha" },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    }
  );

  if (!tiagoThreadBureauRes.ok && (tiagoThreadBureauRes.status === 403 || tiagoThreadBureauRes.status === 400)) {
    results.firestoreRules.success.push(`Règles Firestore Forum : Publication membre standard dans salon Bureau bloquée (${tiagoThreadBureauRes.status} FORBIDDEN)`);
  } else {
    results.firestoreRules.errors.push(`Règles Firestore Forum : Fuite de sécurité, membre a pu poster dans le Bureau (${tiagoThreadBureauRes.status})`);
    if (tiagoThreadBureauRes.ok) {
      await firestoreRequest(helenaAuth.idToken, `forum/${testThreadBureauId}`, 'DELETE');
    }
  }

  // 3.2.3 Membre standard publie dans salon Général -> Doit réussir (200 OK)
  const testThreadGeneralId = `recette_thread_gen_${Date.now()}`;
  console.log("-> Test Firestore : Création d'un fil sur salon Général par Membre standard...");
  const tiagoThreadGenRes = await firestoreRequest(
    tiagoAuth.idToken,
    `forum/${testThreadGeneralId}`,
    'PATCH',
    {
      fields: {
        titre: { stringValue: "Fil Général par Membre Standard" },
        groupId: { stringValue: "Samambaia" },
        channelId: { stringValue: "Samambaia_general" },
        authorId: { stringValue: tiagoAuth.localId },
        authorName: { stringValue: "Tiago Rocha" },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    }
  );

  if (tiagoThreadGenRes.ok) {
    results.firestoreRules.success.push("Règles Firestore Forum : Membre standard peut poster dans le salon public Général (200 OK)");
    await firestoreRequest(tiagoAuth.idToken, `forum/${testThreadGeneralId}`, 'DELETE');
  } else {
    results.firestoreRules.errors.push(`Règles Firestore Forum : Écriture post membre standard dans Général refusée (${tiagoThreadGenRes.status})`);
  }

  // ==========================================
  // RÉCAPITULATIF DES RÉSULTATS
  // ==========================================
  console.log("\n====================================================================");
  console.log("=== BILAN DE LA BATTERIE DE TESTS DE PERMISSION EN LIGNE ===");
  console.log("====================================================================");

  console.log("\n[1. AGENDA]");
  results.agenda.success.forEach(s => console.log(`  ✓ ${s}`));
  results.agenda.errors.forEach(e => console.log(`  ✗ ERREUR: ${e}`));

  console.log("\n[2. FORUM]");
  results.forum.success.forEach(s => console.log(`  ✓ ${s}`));
  results.forum.errors.forEach(e => console.log(`  ✗ ERREUR: ${e}`));

  console.log("\n[3. SÉCURITÉ FIRESTORE EN LIGNE]");
  results.firestoreRules.success.forEach(s => console.log(`  ✓ ${s}`));
  results.firestoreRules.errors.forEach(e => console.log(`  ✗ ERREUR: ${e}`));

  const totalErrors = results.agenda.errors.length + results.forum.errors.length + results.firestoreRules.errors.length;
  console.log("\n--------------------------------------------------------------------");
  if (results.agenda.errors.length === 0 && results.forum.errors.length === 0 && results.firestoreRules.errors.length === 0) {
    console.log(">>> TOUS LES TESTS DE PERMISSION AGENDA & FORUM SONT VALIDÉS (100% SUCCÈS) <<<");
    process.exit(0);
  } else {
    console.log(`>>> ATTENTION : ${totalErrors} ERREUR(S) DÉTECTÉE(S) <<<`);
    process.exit(1);
  }
}

runBatteryTests().catch(err => {
  console.error("Erreur critique d'exécution :", err);
  process.exit(1);
});
