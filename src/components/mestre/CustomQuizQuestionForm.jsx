// Formulaire d'ajout de question personnalisée et surcharge QCM pour le Mestre (<= 140 lignes)
import React, { useState } from 'react';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';
import { buildDeterministicQuizQuestionId } from '../../utils/quizOverrideKeyHelper';

export default function CustomQuizQuestionForm({
  selectedItem,
  itemType,
  allItems = [],
  availableMedia = [],
  onSubmitQuestion,
}) {
  const { t } = useTranslation();
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCorrect, setNewQuestionCorrect] = useState('');
  const [newQuestionBad1, setNewQuestionBad1] = useState('');
  const [newQuestionBad2, setNewQuestionBad2] = useState('');
  const [newQuestionBad3, setNewQuestionBad3] = useState('');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');
  const [targetField, setTargetField] = useState('custom');
  const [showValidation, setShowValidation] = useState(false);

  const handleGenerateAutoQuestion = () => {
    let questionText = 'Quel est le nom de cet élément ?';
    if (itemType === 'rhythm') questionText = 'Quel est le nom de ce rythme ?';
    else if (itemType === 'song') questionText = 'Quel est le titre de ce chant ?';
    else if (itemType === 'fiche') questionText = 'Quel est le sujet de cette fiche ?';

    const correctAnswer = selectedItem.titre || selectedItem.name || selectedItem.id;
    const otherItems = (allItems || []).filter((item) => item.id !== selectedItem.id);
    const shuffled = [...otherItems].sort(() => 0.5 - Math.random());
    setNewQuestionText(questionText);
    setNewQuestionCorrect(correctAnswer);
    setNewQuestionBad1(shuffled[0] ? (shuffled[0].titre || shuffled[0].name || shuffled[0].id) : 'Fausse réponse 1');
    setNewQuestionBad2(shuffled[1] ? (shuffled[1].titre || shuffled[1].name || shuffled[1].id) : 'Fausse réponse 2');
    setNewQuestionBad3(shuffled[2] ? (shuffled[2].titre || shuffled[2].name || shuffled[2].id) : 'Fausse réponse 3');
    if (availableMedia && availableMedia.length > 0) setSelectedMediaUrl(availableMedia[0].url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newQuestionCorrect.trim() || !newQuestionBad1.trim()) return;
    const category = itemType === 'song' ? 'toada' : (itemType === 'fiche' ? 'culture' : 'repertoire');
    const detId = buildDeterministicQuizQuestionId({
      sourceId: selectedItem?.id,
      category,
      questionType: targetField,
      targetField: targetField === 'custom' ? `custom_${Date.now()}` : targetField,
    });
    const newQ = {
      id: detId,
      deterministicId: detId,
      targetField,
      texte: newQuestionText.trim(),
      questionText: newQuestionText.trim(),
      bonneReponse: newQuestionCorrect.trim(),
      mauvaisesReponses: [newQuestionBad1.trim(), newQuestionBad2.trim(), newQuestionBad3.trim()].filter(Boolean),
      audioUrl: selectedMediaUrl || null,
    };
    await onSubmitQuestion(newQ, detId);
    setNewQuestionText('');
    setNewQuestionCorrect('');
    setNewQuestionBad1('');
    setNewQuestionBad2('');
    setNewQuestionBad3('');
    setSelectedMediaUrl('');
    setShowValidation(true);
    setTimeout(() => setShowValidation(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-[#fdfaf2] p-4 rounded border-2 border-encre-noire/10 relative">
      {showValidation && (
        <div className="absolute -top-3 right-4 bg-[var(--color-cordel-vert)] text-white text-[10px] font-bold px-3 py-1 rounded shadow-md animate-fadeIn z-10">
          {t('mestre.pedagogy.questionAddedToast')}
        </div>
      )}
      <div className="flex justify-between items-center mb-1 gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-widest text-cordel-wood">
          {t('mestre.pedagogy.newQuestionHeading')}
        </span>
        <div className="flex items-center gap-2">
          <select value={targetField} onChange={(e) => setTargetField(e.target.value)} className="p-1 border border-encre-noire/25 rounded text-[10px] font-bold bg-white">
            <option value="custom">Question libre</option>
            <option value="sticks">Surcharge : Baguettes (sticks)</option>
            <option value="refrain">Surcharge : Refrain / Paroles</option>
            <option value="rythme">Surcharge : Rythme / Baque</option>
            <option value="nacao">Surcharge : Nação</option>
            <option value="orixa">Surcharge : Orixá</option>
          </select>
          {allItems.length > 1 && (
            <button type="button" onClick={handleGenerateAutoQuestion} className="text-[9px] font-bold text-[var(--color-cordel-vert)] bg-[var(--color-cordel-vert)]/10 px-2 py-1 rounded hover:bg-[var(--color-cordel-vert)]/20 transition-colors cursor-pointer">
              {t('mestre.pedagogy.generateAutoBtn')}
            </button>
          )}
        </div>
      </div>

      <input type="text" value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} placeholder={t('mestre.pedagogy.questionPlaceholder')} className="p-2 border-2 border-encre-noire/30 rounded text-xs font-bold" required />

      {availableMedia && availableMedia.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          <label className="text-[9px] font-black uppercase text-encre-noire/60">{t('mestre.pedagogy.audioMediaLinkedLabel')}</label>
          <select value={selectedMediaUrl} onChange={(e) => setSelectedMediaUrl(e.target.value)} className="p-2 border-2 border-encre-noire/30 rounded text-xs font-medium bg-white">
            <option value="">{t('mestre.pedagogy.noMediaTextOnlyOption')}</option>
            {availableMedia.map((m) => (
              <option key={m.url} value={m.url}>{m.isAudio ? '🎧' : '📄'} {m.fileName}</option>
            ))}
          </select>
        </div>
      )}

      <input type="text" value={newQuestionCorrect} onChange={(e) => setNewQuestionCorrect(e.target.value)} placeholder={t('mestre.pedagogy.correctAnswerPlaceholder')} className="p-2 border-2 border-[#2d6a4f]/50 bg-[var(--color-cordel-vert)]/5 rounded text-xs font-bold text-[var(--color-cordel-vert)] mt-1" required />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input type="text" value={newQuestionBad1} onChange={(e) => setNewQuestionBad1(e.target.value)} placeholder={t('mestre.pedagogy.distractor1Placeholder')} className="p-2 border-2 border-encre-noire/20 rounded text-xs font-medium" required />
        <input type="text" value={newQuestionBad2} onChange={(e) => setNewQuestionBad2(e.target.value)} placeholder={t('mestre.pedagogy.distractor2Placeholder')} className="p-2 border-2 border-encre-noire/20 rounded text-xs font-medium" />
        <input type="text" value={newQuestionBad3} onChange={(e) => setNewQuestionBad3(e.target.value)} placeholder={t('mestre.pedagogy.distractor3Placeholder')} className="p-2 border-2 border-encre-noire/20 rounded text-xs font-medium" />
      </div>
      <CordelButton variant="primary" type="submit" disabled={!newQuestionText.trim() || !newQuestionCorrect.trim() || !newQuestionBad1.trim()} className="text-[10px] self-end mt-1">
        {t('mestre.pedagogy.addToQuizBtn')}
      </CordelButton>
    </form>
  );
}

