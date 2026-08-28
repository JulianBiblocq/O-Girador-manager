const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const LZString = require('lz-string');

// Initialize Firebase Admin with default credentials
// (Assuming you have GCLOUD_PROJECT or FIREBASE_CONFIG set, or we can just initialize without args if logged in)
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
admin.initializeApp();
const db = getFirestore();

const presetsDir = path.join(__dirname, '../../o-girador-sequenciador/public/presets');
const catalogFile = path.join(presetsDir, 'catalog.json');

async function importPresets() {
  try {
    const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
    
    for (const filename of catalog) {
      const presetPath = path.join(presetsDir, filename);
      const rawData = fs.readFileSync(presetPath, 'utf8');
      
      const preset = JSON.parse(rawData);
      const compressedData = LZString.compressToBase64(rawData);
      
      // Usually presets use the filename (without .json) as ID or similar. Let's just use a clean ID.
      const docId = filename.replace('.json', '');
      
      const presetDoc = {
        name: preset.metadata?.name || docId,
        visibility: 'admin_global',
        isPublic: true,
        data: compressedData,
        authorName: 'O Girador',
        createdAt: FieldValue.serverTimestamp(),
      };
      
      await db.collection('presets').doc(docId).set(presetDoc, { merge: true });
      console.log(`Uploaded ${filename} as ${docId}`);
    }
    
    console.log("Import completed!");
  } catch (err) {
    console.error("Error importing presets:", err);
  }
}

importPresets();
