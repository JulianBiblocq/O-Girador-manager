import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCTvRPj2p3zdIfEjftXoSvRJ43Uy0EfPMY",
  authDomain: "o-girador-7828c.firebaseapp.com",
  projectId: "o-girador-7828c",
  storageBucket: "o-girador-7828c.firebasestorage.app",
  messagingSenderId: "488703864701",
  appId: "1:488703864701:web:50b8cbcd1ca4038e15e614"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log("Starting migration...");
  const querySnapshot = await getDocs(collection(db, "documents"));
  let count = 0;
  for (const document of querySnapshot.docs) {
    const data = document.data();
    if (data.categoryId === 'Administratif' || data.categorie === 'Administratif') {
      const titre = (data.titre || '').toLowerCase();
      const isCoreAdmin = titre.includes('compo ca') || titre.includes('règlement') || titre.includes('reglement') || titre.includes('statut') || titre.includes('rib');
      if (!isCoreAdmin) {
         console.log("Migrating:", data.titre);
         await updateDoc(doc(db, "documents", document.id), {
           categoryId: 'ComptesRendus',
           categorie: 'Comptes-rendus',
           type: 'report'
         });
         count++;
      }
    }
  }
  console.log(`Migration complete. Updated ${count} documents.`);
  process.exit(0);
}
migrate();
