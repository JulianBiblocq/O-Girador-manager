import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

async function setDomain() {
  const assocRef = doc(db, 'associations', 'Samambaia');
  try {
    await updateDoc(assocRef, {
      customDomains: ['samambaia-maracatu.fr']
    });
    console.log("SUCCESS: customDomains updated for Samambaia");
  } catch (e) {
    console.error("ERROR", e);
  }
  process.exit(0);
}

setDomain();
