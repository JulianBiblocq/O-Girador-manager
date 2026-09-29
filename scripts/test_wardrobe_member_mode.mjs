const API_KEY = "AIzaSyCTvRPj2p3zdIfEjftXoSvRJ43Uy0EfPMY";
const PROJECT_ID = "o-girador-7828c";

async function run() {
  console.log("=== TEST DU PARAMÉTRAGE MODULAIRE DU VESTIAIRE VIA REST ===");
  // 1. Authentification
  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Referer": "http://localhost:5173/" },
    body: JSON.stringify({ email: "provisioner_recette@ogirador.com", password: "TempProvisioner2026!", returnSecureToken: true })
  });
  const authData = await authRes.json();
  if (!authData.idToken) {
    throw new Error("Authentification échouée: " + JSON.stringify(authData));
  }
  const token = authData.idToken;
  console.log("Authentifié avec succès (Provisioner Recette)");

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/associations/Samambaia`;

  // Fonction utilitaire pour lire le document
  async function getDoc() {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    return await res.json();
  }

  // Fonction utilitaire pour mettre à jour wardrobeMemberMode
  async function setWardrobeMode(mode) {
    const patchUrl = `${url}?updateMask.fieldPaths=wardrobeMemberMode`;
    const res = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          wardrobeMemberMode: { stringValue: mode }
        }
      })
    });
    return await res.json();
  }

  // Initial read
  const initialDoc = await getDoc();
  console.log("Mode actuel :", initialDoc.fields?.wardrobeMemberMode?.stringValue || "(non défini, par défaut personal)");

  // Test 1: collective_workshop
  console.log("\n-> Test 1 : Passage au mode 'collective_workshop'...");
  await setWardrobeMode("collective_workshop");
  const doc1 = await getDoc();
  console.log("Vérification mode 1 :", doc1.fields?.wardrobeMemberMode?.stringValue);
  if (doc1.fields?.wardrobeMemberMode?.stringValue !== "collective_workshop") {
    throw new Error("Échec collective_workshop");
  }

  // Test 2: disabled
  console.log("\n-> Test 2 : Passage au mode 'disabled'...");
  await setWardrobeMode("disabled");
  const doc2 = await getDoc();
  console.log("Vérification mode 2 :", doc2.fields?.wardrobeMemberMode?.stringValue);
  if (doc2.fields?.wardrobeMemberMode?.stringValue !== "disabled") {
    throw new Error("Échec disabled");
  }

  // Test 3: personal
  console.log("\n-> Test 3 : Rétablissement au mode 'personal'...");
  await setWardrobeMode("personal");
  const doc3 = await getDoc();
  console.log("Vérification mode 3 :", doc3.fields?.wardrobeMemberMode?.stringValue);
  if (doc3.fields?.wardrobeMemberMode?.stringValue !== "personal") {
    throw new Error("Échec personal");
  }

  console.log("\n✅ Tous les tests REST Firestore de bascule des 3 modes sont 100% validés !");
}

run().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
