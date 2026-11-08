// Génère des identifiants déterministes et résout les surcharges quizOverrides du Mestre (<= 90 lignes)

function normalizeKeyPart(val = '') {
  return String(val || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const CATEGORY_ALIASES = {
  repertoire: 'repertoire', piece: 'repertoire', morceau: 'repertoire',
  toada: 'toada', song: 'toada', chant: 'toada',
  culture: 'culture', culture_fiche: 'culture', sheet: 'culture', fiche: 'culture',
  atelier: 'atelier', danse: 'danse', dance: 'danse',
};

const FIELD_ALIASES = {
  materiel_alfaia: 'sticks', sticks: 'sticks', baguettes: 'sticks',
  song_lyrics: 'refrain', song_verse_hole: 'refrain', refrain: 'refrain', lyrics: 'refrain',
  song_rythme: 'rythme', rythme_carac: 'rythme', song_nacao: 'nacao', nacao_carac: 'nacao',
  song_lexique: 'lexique', devinette_visuelle: 'orixa', symbole_orixa: 'orixa',
  blason_orixa: 'orixa', orixa: 'orixa', pattern_rythmique: 'tablature',
};

export function buildDeterministicQuizQuestionId({ sourceId, category, questionType, targetField } = {}) {
  const rawCat = normalizeKeyPart(category || (String(questionType || '').startsWith('song_') ? 'toada' : 'repertoire'));
  const canonCat = CATEGORY_ALIASES[rawCat] || rawCat || 'repertoire';
  const cleanSource = String(sourceId || 'global').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'global';
  const rawField = normalizeKeyPart(targetField || questionType || 'question');
  const canonField = FIELD_ALIASES[rawField] || rawField || 'question';
  return `${canonCat}_${cleanSource}_${canonField}`;
}

export function computeQuizTextHash(text = '') {
  const norm = normalizeKeyPart(text);
  if (!norm) return 'hash_0';
  let h = 5381;
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h) ^ norm.charCodeAt(i);
  return `hash_${(h >>> 0).toString(16)}`;
}

export function resolveQuizQuestionOverride(question, overrides = {}, context = {}) {
  if (!question) return question;
  const detId = question.deterministicId || buildDeterministicQuizQuestionId({
    sourceId: question.sourceId || context.sourceId,
    category: question.category || context.category,
    questionType: question.type,
    targetField: question.targetField,
  });
  if (!overrides || typeof overrides !== 'object') return { ...question, deterministicId: detId };
  const textHash = computeQuizTextHash(question.questionText || question.prompt || '');
  const candidates = [detId, question.id, question.legacyId, textHash].filter(Boolean);
  const matchedKey = candidates.find((k) => overrides[k] && typeof overrides[k] === 'object');
  if (!matchedKey) return { ...question, deterministicId: detId };

  const ov = overrides[matchedKey];
  const merged = { ...question, ...ov, id: question.id || detId, deterministicId: detId };
  if (ov.bonneReponse && Array.isArray(ov.mauvaisesReponses)) {
    merged.correctAnswer = ov.bonneReponse;
    merged.choices = [
      { text: ov.bonneReponse, isCorrect: true },
      ...ov.mauvaisesReponses.filter(Boolean).map((m) => ({ text: m, isCorrect: false })),
    ];
  }
  return merged;
}

export function applyQuizOverrides(questions = [], overrides = {}, context = {}) {
  if (!Array.isArray(questions)) return [];
  return questions
    .map((q) => resolveQuizQuestionOverride(q, overrides, context))
    .filter((q) => !q.isDisabled && !q.excluded);
}
