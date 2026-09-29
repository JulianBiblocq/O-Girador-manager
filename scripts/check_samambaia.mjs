import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const API_KEY = "AIzaSyCTvRPj2p3zdIfEjftXoSvRJ43Uy0EfPMY";
const PROJECT_ID = "o-girador-7828c";

async function checkSamambaia() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/associations/Samambaia?key=${API_KEY}`;
  const res = await fetch(url, { headers: { 'Referer': 'http://localhost:5173/' } });
  const data = await res.json();
  console.log("Samambaia Association:", JSON.stringify(data, null, 2));
}

checkSamambaia().catch(console.error);
