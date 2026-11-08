/**
 * Pré-intégration directe et synchronisation silencieuse des 6 structures musicales de Toadas (< 140 lignes).
 * Injecte rawTxtCode, toadaStructure, bpm et signatureRythmique ("4/4") dans les fiches existantes
 * si leur rawTxtCode est vide, tout en préservant l'identifiant Firestore (toadaDocId) et parolesOriginales.
 */

import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { normalizeString } from './repertoireMatcher.js';
import { parseStructureTxt } from './toadaTwoLineConverter.js';
import { computeSongStructure } from './toadaLineEditorHelper.js';
import { parseToadaMeasures } from './toadaMeasureParser.js';
import { toadaToCleanHtml } from './toadaSerializer.js';
import { cleanFirestorePayload } from './firestoreUtils.js';

export const SIX_TOADA_PRESETS = [
  {
    titre: 'Vou pra Bahia',
    bpm: 100,
    signatureRythmique: '4/4',
    rawTxtCode: `*Eu [1]vou pra [2]Bahi[3]a brin[4]car*\n[1] _ Vou [2]vadiar [3] _ carna[4]val`
  },
  {
    titre: 'Morô omim má',
    bpm: 80,
    signatureRythmique: '4/4',
    rawTxtCode: `*[1]Mo[2]rô omim [3]má, [4] _*\n/*[1]Mo[2]rô omim [3]ma[4]iô*\n/*[1]Mo[2]rô omim [3]maiô,*\n/*[4]Aba[1]dô a[2]iê [3]lê [4]ô*\n[1]Mo[2]rô omim [3]má, [4] _\n/[1]Mo[2]rô omim [3]ma[4]iô\n/[1]Mo[2]rô omim [3]maiô,\n/[4]Aba[1]dô a[2]iê [3]lê [4]ô\n*[1]A[2]_[3]lá [4]de'O[1]xum,*\n[1] _ O[2]xum mire[3]rei [4]ô\n*[1]A[2]_[3]lá [4]de'O[1]xum,*\n[1] _ O[2]xum mire[3]rei [4]ô\n!*Ela'é [1]mi[2]na ni[3]caro[4]dô,*\n/*Ela'é [1]mi[2]na ni[3]caro[4]dô*\nEla'é [1]mi[2]na ni[3]caro[4]dô,\n/Ela'é [1]mi[2]na ni[3]caro[4]dô`
  },
  {
    titre: 'Costa Velha',
    bpm: 75,
    signatureRythmique: '4/4',
    rawTxtCode: `*Olha'a [1]Costa [2]Velha [3]é Nagô A[4]fã*\n/*Es[1]trela Bri[2]lhante [3]é Nação Ger[4]mana*\nOlha'a [1]Costa [2]Velha [3]é Nagô A[4]fã\n/Es[1]trela Bri[2]lhante [3]é Nação Ger[4]mana\n*Vejo'um [1]quê na'es[2]trela,*\n/*[3]tem um brilho [4]sem igual*\n/*Uma [1]luz tão fa[2]gueira ilu[3]mina'a corte [4]real*\nUma [1]luz tão fa[2]gueira ilu[3]mina'a corte [4]real`
  },
  {
    titre: 'Tem Macaíba',
    bpm: 105,
    signatureRythmique: '4/4',
    rawTxtCode: `*[4]O [1]mestre [2]que domina'[3]essa na[4]ção*\n/*[1] _ faz um [2]baque vi[3]rado [4]tremer a*\n/*[1]terra [2]tremer o [3]chão [4] _*\n[4]O [1]mestre [2]que domina'[3]essa na[4]ção\n/[1] _ faz um [2]baque vi[3]rado [4]tremer a\n/[1]terra [2]tremer o [3]chão [4] _\n*[4]Tem Maca[1]íba,*\n[1] _ [2]tem sim se[3]nhor [4] _\n*[4]tarol e gon[1]guê,*\n[1] _ [2]tem sim se[3]nhor [4] _\n*[4]tem gan[1]za,*\n[1] _ [2]tem sim se[3]nhor [4] _\n*[4]faz a [1]terra tre[2]mer [3] _ [4] _*\n[4]faz a [1]terra tre[2]mer [3] _ [4] _`
  },
  {
    titre: 'Arreda do Caminho',
    bpm: 65,
    signatureRythmique: '4/4',
    rawTxtCode: `*Ô a[1]rreda do ca[2]minho*\n/*que'o Le[3]ão já quer pas[4]sar*\nO [1]mundo'é [2]largo\n/e dá pra [3]todos vadi[4]ar !`
  },
  {
    titre: 'Senhora do Rosário',
    bpm: 75,
    signatureRythmique: '4/4',
    rawTxtCode: `*[4]O, se[1]nhora [2]do ro[3]sario,*\n/*a sua [4]casa [1]chei[2]ra [3] _ [4] _*\n[4]O, se[1]nhora [2]do ro[3]sario,\n/a sua [4]casa [1]chei[2]ra [3] _ [4] _\n*[4]Cheira [1]cravo, [2]cheira [3]rosa,*\n/*[4]cheira [1]flor de laran[2]jeira [3] _ [4] _*\n[4]Cheira [1]cravo, [2]cheira [3]rosa,\n/[4]cheira [1]flor de laran[2]jeira [3] _ [4] _`
  }
];

export function findSixPresetForTitle(rawTitle = '') {
  const norm = normalizeString(rawTitle);
  if (!norm) return null;
  return SIX_TOADA_PRESETS.find((p) => normalizeString(p.titre) === norm) || null;
}

export function buildToadaStructure(rawTxtCode = '', signatureRythmique = '4/4') {
  if (!rawTxtCode || typeof rawTxtCode !== 'string' || !rawTxtCode.trim()) return null;
  const sig = signatureRythmique || '4/4';
  const lines = parseStructureTxt(rawTxtCode);
  const { totalMeasures, lineDetails } = computeSongStructure(lines, sig);
  const parsed = parseToadaMeasures(rawTxtCode);
  return cleanFirestorePayload({
    signatureRythmique: sig,
    totalMeasures,
    lines,
    lineDetails,
    measures: parsed.measures || [],
    sections: parsed.sections || []
  });
}

export function isToadaDocument(docItem) {
  return Boolean(docItem && (docItem.categorie === 'Toadas' || docItem.categoryId === 'Toadas' || docItem.type === 'song' || docItem.toadaData !== undefined));
}

/**
 * Synchronise silencieusement ou à la demande les 6 Toadas de référence dans les documents existants.
 */
export async function syncSixToadasPresetsToDocs({ db, documents = null, groupId = null, forceOverwrite = false, updateDocFn = null } = {}) {
  let docsList = Array.isArray(documents) ? documents : [];
  if (docsList.length === 0 && db && groupId) {
    const snap = await getDocs(query(collection(db, 'documents'), where('groupId', '==', groupId)));
    docsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const toadas = docsList.filter(isToadaDocument);
  const updatedIds = [], updates = [];

  for (const preset of SIX_TOADA_PRESETS) {
    const normPreset = normalizeString(preset.titre);
    const matches = toadas.filter((d) => normalizeString(d.titre || d.title) === normPreset);
    for (const existingDoc of matches) {
      const hasRawCode = Boolean(existingDoc.rawTxtCode && String(existingDoc.rawTxtCode).trim());
      if (hasRawCode && !forceOverwrite) continue;
      const payload = cleanFirestorePayload({
        rawTxtCode: preset.rawTxtCode,
        toadaStructure: buildToadaStructure(preset.rawTxtCode, preset.signatureRythmique),
        bpm: preset.bpm,
        bpmDefaut: preset.bpm,
        signatureRythmique: preset.signatureRythmique,
        signature: preset.signatureRythmique,
        ...(!existingDoc.parolesOriginales || !String(existingDoc.parolesOriginales).trim()
          ? { parolesOriginales: toadaToCleanHtml(preset.rawTxtCode) }
          : {})
      });
      if (updateDocFn) await updateDocFn(existingDoc.id, payload);
      else if (db && existingDoc.id) await updateDoc(doc(db, 'documents', existingDoc.id), payload);
      updatedIds.push(existingDoc.id);
      updates.push({ id: existingDoc.id, titre: existingDoc.titre || preset.titre, payload });
    }
  }
  return { updatedCount: updatedIds.length, updatedIds, updates };
}
