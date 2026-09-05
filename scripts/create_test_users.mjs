/**
 * Script de création et synchronisation des profils de recette :
 * - Tiago Rocha (recette.membre@o-girador.test)
 * - Camila Santos (recette.admin@o-girador.test)
 */

const API_KEY = "AIzaSyCTvRPj2p3zdIfEjftXoSvRJ43Uy0EfPMY";
const PROJECT_ID = "o-girador-7828c";
const REFERER = "http://localhost:5173/";

// 1. Fonction helper Auth REST
async function authUser(email, password) {
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const headers = { 'Content-Type': 'application/json', 'Referer': REFERER };
  const body = JSON.stringify({ email, password, returnSecureToken: true });

  let res = await fetch(signUpUrl, { method: 'POST', headers, body });
  let data = await res.json();
  if (res.ok) {
    console.log(`[AUTH] Compte créé : ${email} (UID: ${data.localId})`);
    return data;
  }

  if (data?.error?.message === "EMAIL_EXISTS") {
    res = await fetch(signInUrl, { method: 'POST', headers, body });
    data = await res.json();
    if (res.ok) {
      console.log(`[AUTH] Connecté : ${email} (UID: ${data.localId})`);
      return data;
    }
  }

  throw new Error(`Auth échouée pour ${email} : ${JSON.stringify(data)}`);
}

// 2. Conversion JSON standard vers champs Firestore REST
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: value.toString() };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => typeof v === 'string' ? { stringValue: v } : toFirestoreFields(v))
        }
      };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(value) } };
    }
  }
  return fields;
}

// 3. Écriture / Mise à jour dans Firestore avec le token administrateur
async function saveFirestoreUser(adminToken, uid, profileData) {
  const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const fields = toFirestoreFields({
    ...profileData,
    id: uid,
    uid: uid,
    updatedAt: new Date().toISOString()
  });

  const res = await fetch(docUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Écriture Firestore refusée pour ${uid} : ${JSON.stringify(err)}`);
  }
  console.log(`[FIRESTORE] Profil injecté avec succès pour ${profileData.email} (UID: ${uid})`);
}

async function main() {
  console.log("=== Initialisation des profils de recette O-Girador ===");

  // Étape 1 : Obtenir le token provisioner mestre
  console.log("-> Connexion du compte provisioner mestre...");
  const provAuth = await authUser("provisioner_recette@ogirador.com", "TempProvisioner2026!");
  const adminToken = provAuth.idToken;

  // Étape 2 : Créer ou connecter Tiago Rocha (Membre standard)
  console.log("-> Initialisation de Tiago Rocha (recette.membre@o-girador.test)...");
  const tiagoAuth = await authUser("recette.membre@o-girador.test", "RecetteGirador2026!");
  const tiagoProfile = {
    prenom: "Tiago",
    nom: "Rocha",
    surnom: "Tiaguinho",
    email: "recette.membre@o-girador.test",
    groupId: "Samambaia",
    role: "membre",
    isSystemAdmin: false,
    isNew: false,
    onboardingCompleted: true,
    tags: [],
    instrument: "Alfaia",
    instrumentPrincipal: "Alfaia",
    instrumentSecondaire: "",
    competencesAlfaia: ["marcante"],
    pratiquePercussion: true,
    pratiqueDanse: false,
    cotisationStatut: "a_jour",
    cotisationFormule: "Adhésion annuelle troupe active",
    droitImage: true,
    aptitudeMedicale: true,
    telephone: "06 12 34 56 78",
    adresseRue: "14 rue des Maracatus",
    adresseCP: "75011",
    adresseVille: "Paris",
    tailleTshirt: "M",
    taillePantalon: "M",
    genre: "homme",
    lateralite: "droitier"
  };
  await saveFirestoreUser(adminToken, tiagoAuth.localId, tiagoProfile);

  // Étape 3 : Créer ou connecter Camila Santos (Admin bureau)
  console.log("-> Initialisation de Camila Santos (recette.admin@o-girador.test)...");
  const camilaAuth = await authUser("recette.admin@o-girador.test", "RecetteGirador2026!");
  const camilaProfile = {
    prenom: "Camila",
    nom: "Santos",
    surnom: "Mila",
    email: "recette.admin@o-girador.test",
    groupId: "Samambaia",
    role: "admin",
    isSystemAdmin: false,
    isNew: false,
    onboardingCompleted: true,
    tags: ["Bureau", "Secrétaire", "Trésorier", "Logisticien"],
    instrument: "Caixa",
    instrumentPrincipal: "Caixa",
    instrumentSecondaire: "",
    pratiquePercussion: true,
    pratiqueDanse: false,
    cotisationStatut: "a_jour",
    cotisationFormule: "Adhésion annuelle membre du bureau",
    droitImage: true,
    aptitudeMedicale: true,
    telephone: "06 98 76 54 32",
    adresseRue: "8 impasse du Terreiro",
    adresseCP: "75020",
    adresseVille: "Paris",
    tailleTshirt: "S",
    taillePantalon: "S",
    genre: "femme",
    lateralite: "droitiere"
  };
  await saveFirestoreUser(adminToken, camilaAuth.localId, camilaProfile);

  console.log("\n=== Synchronisation réussie des deux profils de test ! ===");
  console.log(`1. Tiago Rocha  (Membre): UID=${tiagoAuth.localId} / email=recette.membre@o-girador.test`);
  console.log(`2. Camila Santos (Admin): UID=${camilaAuth.localId} / email=recette.admin@o-girador.test`);
  process.exit(0);
}

main().catch(err => {
  console.error("Erreur générale :", err);
  process.exit(1);
});
