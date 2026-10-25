/**
 * Service de lecture optique et numérisation de feuilles manuscrites Toada (< 130 lignes).
 * Cascade multi-modèles (gemini-2.5-flash -> gemini-2.0-flash -> gemini-2.0-flash-lite).
 */

export const SCAN_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
const STORAGE_KEY = 'girador_gemini_api_key';

export function getScanApiKey() {
  const env = (import.meta && import.meta.env) ? import.meta.env : {};
  const envKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) return envKey.trim();
  try {
    const local = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY)?.trim() : null;
    if (local) return local;
  } catch {}
  return (env.VITE_FIREBASE_API_KEY && typeof env.VITE_FIREBASE_API_KEY === 'string') ? env.VITE_FIREBASE_API_KEY.trim() : '';
}

export function saveScanApiKey(key) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (key?.trim()) localStorage.setItem(STORAGE_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export async function compressImageForScan(fileOrDataUrl, maxDim = 1600, quality = 0.82) {
  if (typeof window === 'undefined' || !window.document || !window.Image) return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    if (typeof fileOrDataUrl === 'string') img.src = fileOrDataUrl;
    else { const r = new FileReader(); r.onload = (e) => { img.src = e.target.result; }; r.onerror = reject; r.readAsDataURL(fileOrDataUrl); }
  });
}

export function buildVisionManuscriptPrompt({ lang = 'pt', signature = '4/4', tab1Lyrics = '' }) {
  let langDesc = "Portugais du Brésil — Chants traditionnels de Maracatu / Nordeste (respecter strictement l'orthographe brésilienne, accents ã, õ, ç, ê, á, élisions e'o, d'água).";
  if (lang === 'fr') langDesc = "Français (respecter rigoureusement l'orthographe et les accents).";
  else if (lang === 'other') langDesc = "Langue originale du chant.";

  let prompt = `Tu es un transcripteur musical expert du système O Girador (Organizador & Cantador).\nAnalyse cette photo de feuille manuscrite de chant (Toada) :\n1. Langue : ${langDesc}\n2. Signature rythmique active : ${signature}.`;
  if (tab1Lyrics && tab1Lyrics.trim()) {
    prompt += `\n3. Texte de référence des paroles (déjà validé) :\n"""\n${tab1Lyrics.trim()}\n"""\nAppuie-toi sur ce texte de référence pour l'orthographe exacte et concentre-toi sur le placement des numéros de temps au-dessus des lettres.`;
  }
  prompt += `\n4. Format de sortie strict (rawTxtCode direct) :\n- Place [1], [2], [3], [4]... immédiatement devant la lettre exacte au-dessus de laquelle il est noté (ex: [3] _ Negro [4]vem de Lu[1]anda).\n- Pour un temps dans le vide (avant phrase, entre syllabes avec tiret, entre mots, ou après phrase), utilise le tiret porte-temps _ (ex: [2] _, Trazen[3]_do, assinou [2]_ [3]_ [4]_).\n- Pour une mesure de silence complet, écris [1]_ [2]_ [3]_ [4]_ sur sa propre ligne.\n- Entoure d'astérisques *...* les passages du soliste (Puxador) soulignés, encadrés ou en gras.\n- Si une nouvelle métrique (ex: 6/8, 12/8) est notée au-dessus d'un 1, préfixe par [6/8][1].\nRenvoie UNIQUEMENT le texte transcrit brut, sans bloc markdown (\`\`\`) ni commentaire.`;
  return prompt;
}

export function extractVaralLyricsFromScanned(scannedText = '') {
  if (!scannedText || typeof scannedText !== 'string') return '';
  return scannedText.split(/\r?\n/).map((l) => l.replace(/\[\d+\]/g, '').replace(/\[sig:[^\]]+\]/gi, '').replace(/\[[0-9/]+\]/g, '').replace(/_/g, '').replace(/\s{2,}/g, ' ').trim()).filter(Boolean).join('\n');
}

export async function scanManuscriptSheet(imageInput, options = {}) {
  const apiKey = options.apiKey || getScanApiKey();
  if (!apiKey) return { success: false, error: "Clé d'accès requise pour la lecture optique", needsApiKey: true };

  const compressed = await compressImageForScan(imageInput);
  const prompt = buildVisionManuscriptPrompt(options);
  const base64Data = compressed.replace(/^data:image\/\w+;base64,/, '');
  const mimeType = compressed.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
  const payload = {
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Data } }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
  };

  let lastError = null;
  for (const model of SCAN_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.status === 429 || res.status === 503) { lastError = new Error(`Service temporairement saturé (${res.status})`); continue; }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Erreur de connexion (${res.status})`);
      }
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, text: rawText.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim(), model };
    } catch (err) {
      lastError = err;
    }
  }
  return { success: false, error: lastError?.message || "Échec de lecture optique" };
}
