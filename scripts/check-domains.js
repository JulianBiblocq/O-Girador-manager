import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkDomains() {
  const querySnapshot = await getDocs(collection(db, 'associations'));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.customDomains) {
      console.log(`Assoc ${doc.id}: ${JSON.stringify(data.customDomains)}`);
    } else {
      console.log(`Assoc ${doc.id}: NO customDomains`);
    }
  });
  process.exit(0);
}

checkDomains();
