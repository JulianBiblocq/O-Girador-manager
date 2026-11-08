// Générateur de QCM pour les modèles d'instruments de l'Atelier (<= 140 lignes)
import { distractorPool } from '../../data/distractorPool.js';
import { normalizePartSteps } from '../workshopProjectionUtils.js';
import { cleanPromptTitle, sanitizeQuizQuestions } from '../quizSanitizer.js';
import { buildDeterministicQuizQuestionId, applyQuizOverrides } from '../quizOverrideKeyHelper.js';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function getPartsList(m) {
  if (!m) return [];
  const list = Array.isArray(m.parts || m.parties) ? (m.parts || m.parties) : [];
  if (list.length === 0 && (m.etapes || m.steps || m.materiaux || m.materiels)) {
    return [{ id: 'main_part', nom: m.nom || 'Instrument', materiels: m.materiels || m.materiaux || [], outils: m.outils || [], etapes: m.etapes || m.steps || [] }];
  }
  return list;
}

function getUniqueDistractors(correctAnswer, candidatePool = [], fallbackList = []) {
  const normCorrect = String(correctAnswer || '').trim().toLowerCase();
  const unique = new Set();
  for (const src of [shuffle(candidatePool), shuffle(fallbackList)]) {
    for (const item of src) {
      const trimmed = String(item || '').trim();
      if (trimmed && trimmed.toLowerCase() !== normCorrect && !unique.has(trimmed)) {
        unique.add(trimmed);
        if (unique.size >= 3) return Array.from(unique);
      }
    }
  }
  return Array.from(unique);
}

export function generateQuizFromInstrumentModel(model, allModels = [], config = {}) {
  if (!model) return [];
  const { targetPartId = null, targetStepIndex = null, limit = 10 } = config;
  const fbMats = distractorPool.materiauxEtLutherie?.length ? distractorPool.materiauxEtLutherie : ['Peau de chèvre naturelle', 'Contreplaqué cintrable', 'Corde polypropylène pré-étirée', 'Cercle en bois massif'];
  const fbTools = distractorPool.outilsLutherie?.length ? distractorPool.outilsLutherie : ['Scie sauteuse', 'Ponceuse orbitale', 'Serre-joints à pompe', 'Maillet en bois', 'Clé de tirant'];

  const allMaterials = new Set();
  const allTools = new Set();
  const allPartNames = new Set();
  (allModels?.length ? allModels : [model]).forEach((m) => {
    getPartsList(m).forEach((p) => {
      if (p.nom) allPartNames.add(p.nom);
      (p.materiels || p.materiaux || []).forEach((mat) => { const v = typeof mat === 'string' ? mat : (mat.nom || mat.type || ''); if (v) allMaterials.add(v); });
      (p.outils || []).forEach((out) => { const v = typeof out === 'string' ? out : (out.nom || ''); if (v) allTools.add(v); });
      normalizePartSteps(p).forEach((s) => {
        (s.materiaux || []).forEach((mat) => { const v = typeof mat === 'string' ? mat : (mat.nom || mat.type || ''); if (v) allMaterials.add(v); });
        (s.outils || []).forEach((out) => { const v = typeof out === 'string' ? out : (out.nom || ''); if (v) allTools.add(v); });
      });
    });
  });

  const mPool = Array.from(allMaterials);
  const tPool = Array.from(allTools);
  const pPool = Array.from(allPartNames);
  const isTargetingStep = targetStepIndex !== null && targetStepIndex !== undefined;
  const targetStepNumber = isTargetingStep ? Number(targetStepIndex) : null;
  const questions = [];

  getPartsList(model)
    .filter((part, idx) => !targetPartId || (part.id || `part_${idx}`) === targetPartId || part.nom === targetPartId)
    .forEach((part, index) => {
      const pId = part.id || `part_${index}`;
      const pTitle = part.nom || `Pièce ${index + 1}`;
      const cleanPTitle = cleanPromptTitle(pTitle);
      const normSteps = normalizePartSteps(part);
      const partMats = (part.materiels || part.materiaux || []).map((m) => typeof m === 'string' ? m : (m.nom || m.type || '')).filter(Boolean);
      const partTools = (part.outils || []).map((o) => typeof o === 'string' ? o : (o.nom || '')).filter(Boolean);

      if (!isTargetingStep) {
        if (part.nom && pPool.length > 1) {
          const cands = pPool.filter((n) => !getPartsList(model).some((mp) => mp.nom?.toLowerCase() === n.toLowerCase()));
          const wrong = getUniqueDistractors(part.nom, cands, fbMats);
          if (wrong.length > 0) {
            questions.push({
              id: buildDeterministicQuizQuestionId({ sourceId: model.id, category: 'atelier', targetField: `part_${pId}` }),
              type: 'fabrication_piece', partId: pId, partTitle: pTitle, stepIndex: null, stepTitle: null,
              instruction: 'Reconnaissance de pièce', questionText: `Laquelle de ces pièces fait partie de l'instrument "${model.nom}" ?`,
              choices: shuffle([{ text: part.nom, isCorrect: true }, ...wrong.map((w) => ({ text: w, isCorrect: false }))]),
              feedback: `Oui, la pièce "${part.nom}" fait partie de la conception de "${model.nom}".`,
            });
          }
        }
        if (partMats.length > 0) {
          const mat = partMats[0];
          const wrong = getUniqueDistractors(mat, mPool.filter((m) => !partMats.some((pm) => pm.toLowerCase() === m.toLowerCase())), fbMats);
          if (wrong.length > 0) {
            questions.push({
              id: buildDeterministicQuizQuestionId({ sourceId: model.id, category: 'atelier', targetField: `mat_${pId}` }),
              type: 'fabrication_materiel', partId: pId, partTitle: pTitle, stepIndex: null, stepTitle: null,
              instruction: 'Matériaux de fabrication', questionText: `Quel matériel est nécessaire pour fabriquer la pièce "${cleanPTitle}" ?`,
              choices: shuffle([{ text: mat, isCorrect: true }, ...wrong.map((w) => ({ text: w, isCorrect: false }))]),
              feedback: `Le matériel exact est "${mat}".`,
            });
          }
        }
        if (partTools.length > 0) {
          const outil = partTools[0];
          const wrong = getUniqueDistractors(outil, tPool.filter((t) => !partTools.some((pt) => pt.toLowerCase() === t.toLowerCase())), fbTools);
          if (wrong.length > 0) {
            questions.push({
              id: buildDeterministicQuizQuestionId({ sourceId: model.id, category: 'atelier', targetField: `outil_${pId}` }),
              type: 'fabrication_outil', partId: pId, partTitle: pTitle, stepIndex: null, stepTitle: null,
              instruction: 'Outillage', questionText: `Quel outil est utilisé pour la fabrication de la pièce "${cleanPTitle}" ?`,
              choices: shuffle([{ text: outil, isCorrect: true }, ...wrong.map((w) => ({ text: w, isCorrect: false }))]),
              feedback: `L'outil "${outil}" est bien requis.`,
            });
          }
        }
      }

      normSteps.forEach((step, sIdx) => {
        if (isTargetingStep && sIdx !== targetStepNumber) return;
        const cleanSTitle = cleanPromptTitle(step.titre || `Étape ${sIdx + 1}`);
        if (step.outils?.length > 0) {
          const sOutil = step.outils[0];
          const wrong = getUniqueDistractors(sOutil, tPool.filter((t) => !step.outils.some((so) => so.toLowerCase() === t.toLowerCase())), fbTools);
          if (wrong.length > 0) {
            questions.push({
              id: `qcm_auto_fab_step_outil_${model.id}_${pId}_${sIdx}`, type: 'fabrication_etape_outil', partId: pId, partTitle: pTitle, stepIndex: sIdx, stepTitle: step.titre,
              instruction: "Outillage d'étape", questionText: `Quel outil est nécessaire pour l'étape "${cleanSTitle}" ?`,
              choices: shuffle([{ text: sOutil, isCorrect: true }, ...wrong.map((w) => ({ text: w, isCorrect: false }))]),
              feedback: `Pour l'étape "${cleanSTitle}", l'outil requis est bien "${sOutil}".`,
            });
          }
        }
      });
    });

  return sanitizeQuizQuestions(applyQuizOverrides(shuffle(questions).slice(0, limit), model.quizOverrides, { sourceId: model.id, category: 'atelier' }));
}
