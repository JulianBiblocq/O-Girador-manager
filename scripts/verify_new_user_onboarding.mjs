
const API_KEY = 'AIzaSyCTvRPj2p3zdIfEjftXoSvRJ43Uy0EfPMY';
const PROJECT_ID = 'o-girador-7828c';
const REFERER = 'http://localhost:5173/';

async function test() {
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const authRes = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Referer': REFERER },
    body: JSON.stringify({
      email: 'test.onboarding.samambaia.e2e1@o-girador.test',
      password: 'Password123!',
      returnSecureToken: true
    })
  });
  const authData = await authRes.json();
  if (!authRes.ok) {
    console.error('Auth error:', authData);
    process.exit(1);
  }
  const uid = authData.localId;
  const token = authData.idToken;
  console.log('User UID:', uid);

  const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const docRes = await fetch(docUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const docData = await docRes.json();
  console.log('Doc Status:', docRes.status);
  console.log('Document fields:\n', JSON.stringify(docData.fields, null, 2));

  // Verify all criteria
  const f = docData.fields;
  const role = f?.role?.stringValue;
  const statutActuel = f?.statutActuel?.stringValue;
  const groupId = f?.groupId?.stringValue;
  const isNew = f?.isNew?.booleanValue;
  const onboardingCompleted = f?.onboardingCompleted?.booleanValue;
  const pratiqueDanse = f?.pratiqueDanse?.booleanValue;
  const prenom = f?.prenom?.stringValue;
  const nom = f?.nom?.stringValue;

  console.log('\n--- VERIFICATION CHECKS ---');
  console.log('1. role === "membre":', role === 'membre', `(${role})`);
  console.log('2. statutActuel === "active":', statutActuel === 'active', `(${statutActuel})`);
  console.log('3. groupId === "Samambaia":', groupId === 'Samambaia', `(${groupId})`);
  console.log('4. isNew === false:', isNew === false, `(${isNew})`);
  console.log('5. onboardingCompleted === true:', onboardingCompleted === true, `(${onboardingCompleted})`);
  console.log('6. pratiqueDanse === true:', pratiqueDanse === true, `(${pratiqueDanse})`);
  console.log('7. prenom === "Testine", nom === "Samambaia":', prenom === 'Testine' && nom === 'Samambaia');

  // Verify sanitizeUserDocPayload (no nullValue)
  let hasNull = false;
  for (const [k, v] of Object.entries(f || {})) {
    if ('nullValue' in v) {
      console.warn('Field with nullValue found:', k);
      hasNull = true;
    }
  }
  console.log('8. sanitizeUserDocPayload (Zero nullValue):', !hasNull);
}

test().catch(console.error);
